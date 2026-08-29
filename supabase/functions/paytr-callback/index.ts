// Supabase Edge Function: paytr-callback
// Public server-to-server webhook endpoint for PayTR payment finalization.
// Verifies HMAC-SHA256 signature, enforces idempotency, and executes atomic PostgreSQL finalization RPC.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Constant-time string comparison to prevent timing attacks
function constantTimeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

serve(async (req: Request) => {
  // Only accept POST requests from PayTR
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const merchantKey = Deno.env.get('PAYTR_MERCHANT_KEY');
    const merchantSalt = Deno.env.get('PAYTR_MERCHANT_SALT');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!merchantKey || !merchantSalt || !supabaseUrl || !supabaseServiceKey) {
      console.error('[paytr-callback] Configuration missing on server.');
      return new Response('Server configuration missing', { status: 500 });
    }

    // Parse application/x-www-form-urlencoded or multipart form data
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      const text = await req.text();
      const params = new URLSearchParams(text);
      formData = new FormData();
      for (const [key, value] of params.entries()) {
        formData.append(key, value);
      }
    }

    const merchantOid = formData.get('merchant_oid')?.toString() || '';
    const status = formData.get('status')?.toString() || '';
    const totalAmount = formData.get('total_amount')?.toString() || '';
    const receivedHash = formData.get('hash')?.toString() || '';
    const failedReasonCode = formData.get('failed_reason_code')?.toString() || null;
    const failedReasonMsg = formData.get('failed_reason_msg')?.toString() || null;
    const testMode = formData.get('test_mode')?.toString() || null;
    const paymentType = formData.get('payment_type')?.toString() || null;
    const currency = formData.get('currency')?.toString() || null;

    if (!merchantOid || !status || !totalAmount || !receivedHash) {
      return new Response('Missing required callback parameters', { status: 400 });
    }

    // 1. Calculate and verify PayTR HMAC-SHA256 hash
    // Formula: merchant_oid + merchant_salt + status + total_amount
    const message = `${merchantOid}${merchantSalt}${status}${totalAmount}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(merchantKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
    const expectedHash = btoa(String.fromCharCode(...new Uint8Array(signature)));

    if (!constantTimeEqual(expectedHash, receivedHash)) {
      console.warn('[paytr-callback] Invalid hash received for merchant_oid:', merchantOid);
      return new Response('BAD HASH', { status: 400 });
    }

    // 2. Initialize Supabase Admin Client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const totalAmountMinor = parseInt(totalAmount, 10);
    if (isNaN(totalAmountMinor) || totalAmountMinor < 0) {
      return new Response('Invalid total_amount format', { status: 400 });
    }

    const safePayload: Record<string, unknown> = {
      merchant_oid: merchantOid,
      status,
      total_amount: totalAmount,
      failed_reason_code: failedReasonCode,
      failed_reason_msg: failedReasonMsg,
      test_mode: testMode,
      payment_type: paymentType,
      currency,
      received_at: new Date().toISOString(),
    };

    // 3. Execute Atomic Database Finalization RPC
    const { data, error } = await supabase.rpc('finalize_paytr_callback', {
      p_merchant_oid: merchantOid,
      p_status: status,
      p_total_amount_minor: totalAmountMinor,
      p_failed_reason_code: failedReasonCode,
      p_failed_reason_msg: failedReasonMsg,
      p_raw_payload: safePayload,
    });

    if (error) {
      console.error('[paytr-callback] RPC error finalizing callback:', error);
      return new Response('Database finalization error', { status: 500 });
    }

    if (!data || data.success === false) {
      console.warn('[paytr-callback] Finalization returned unsuccess:', data?.error);
      return new Response(data?.error || 'Finalization rejected', { status: 400 });
    }

    // 5. Fire-and-forget: dispatch pending email for this order (non-blocking)
    // Payment outcome is independent of email delivery success.
    const internalSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET');
    const functionsUrl = Deno.env.get('SUPABASE_FUNCTIONS_URL') ??
      supabaseUrl.replace('/rest/v1', '') + '/functions/v1';

    if (internalSecret && data.order_id) {
      // Resolve email_id from outbox (inserted by finalize_paytr_callback RPC)
      supabase
        .rpc('get_pending_email_for_order', { p_order_id: data.order_id })
        .then(({ data: emailId }: { data: string | null }) => {
          if (!emailId) return;
          return fetch(`${functionsUrl}/send-transactional-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-internal-secret': internalSecret,
            },
            body: JSON.stringify({ email_id: emailId }),
          });
        })
        .catch((e: unknown) => {
          const msg = e instanceof Error ? e.message : 'Unknown';
          console.warn('[paytr-callback] Email dispatch fire-and-forget failed:', msg);
          // Outbox retry will pick this up — payment is unaffected.
        });
    }

    // 6. Return EXACT plain text OK to satisfy PayTR callback confirmation

    return new Response('OK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[paytr-callback] Unexpected exception:', msg);
    return new Response('Internal Server Error', { status: 500 });
  }
});

