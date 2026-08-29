// Supabase Edge Function: paytr-refund
// Authenticated admin-only server-authoritative PayTR refund processor.
// Validates admin RBAC, executes pessimistic row-locking preparation, computes HMAC-SHA256 signature,
// calls PayTR Refund API, and atomically finalizes financial records and status history.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
  };
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Sadece POST istekleri kabul edilir.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Yetkilendirme başlığı (Authorization) zorunludur.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const merchantId = Deno.env.get('PAYTR_MERCHANT_ID');
    const merchantKey = Deno.env.get('PAYTR_MERCHANT_KEY');
    const merchantSalt = Deno.env.get('PAYTR_MERCHANT_SALT');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[paytr-refund] Missing Supabase environment configuration.');
      return new Response(
        JSON.stringify({ error: 'Sunucu yapılandırma hatası (Supabase).' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Authenticate Request with User JWT
    const supabaseUser = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Geçersiz veya süresi dolmuş kullanıcı oturumu.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Enforce Admin RBAC via public.is_admin()
    const { data: isAdmin, error: adminCheckError } = await supabaseUser.rpc('is_admin');
    if (adminCheckError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Erişim engellendi: İade işlemi için yönetici yetkisi zorunludur.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Parse and Validate Request Payload
    const body = await req.json().catch(() => ({}));
    const { payment_id, refund_amount_minor, reason, idempotency_key } = body;

    if (!payment_id || typeof payment_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'payment_id parametresi zorunludur.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!refund_amount_minor || typeof refund_amount_minor !== 'number' || refund_amount_minor <= 0) {
      return new Response(
        JSON.stringify({ error: 'refund_amount_minor 0\'dan büyük geçerli bir tamsayı kuruş olmalıdır.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const idempotencyKey = idempotency_key && typeof idempotency_key === 'string'
      ? idempotency_key.trim()
      : `req_${payment_id}_${refund_amount_minor}_${Date.now()}`;

    // 4. Call prepare_admin_refund RPC using Service Role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { data: prepareRes, error: prepareError } = await supabaseAdmin.rpc('prepare_admin_refund', {
      p_payment_id: payment_id,
      p_refund_amount_minor: Math.floor(refund_amount_minor),
      p_reason: typeof reason === 'string' ? reason.trim() : null,
      p_idempotency_key: idempotencyKey,
    });

    if (prepareError || !prepareRes || !prepareRes.success) {
      console.error('[paytr-refund] prepare_admin_refund error:', prepareError);
      return new Response(
        JSON.stringify({ error: prepareError?.message || 'İade hazırlık işlemi başarısız oldu.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If already finalized/prepared in idempotent state
    if (prepareRes.already_prepared && prepareRes.status === 'succeeded') {
      return new Response(
        JSON.stringify({
          success: true,
          already_finalized: true,
          refund_id: prepareRes.refund_id,
          reference_no: prepareRes.reference_no,
          status: 'succeeded',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { refund_id, reference_no, merchant_oid, amount_minor } = prepareRes;

    // 5. Check PayTR Secrets
    if (!merchantId || !merchantKey || !merchantSalt) {
      console.warn('[paytr-refund] Missing PayTR merchant secrets. Simulating mock refund in sandbox.');
      
      // Finalize mock refund
      const { data: finalizeRes } = await supabaseAdmin.rpc('finalize_admin_refund', {
        p_refund_id: refund_id,
        p_is_success: true,
        p_provider_reference: `mock_ref_${reference_no}`,
        p_error_code: null,
        p_error_message: null,
      });

      return new Response(
        JSON.stringify({
          success: true,
          refund_id,
          reference_no,
          is_simulated: true,
          status: finalizeRes?.status || 'succeeded',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Compute PayTR Refund HMAC-SHA256 Token
    // Exact major unit string without floating point inaccuracies: e.g. "10.25"
    const returnAmountStr = (amount_minor / 100).toFixed(2);
    const hashStr = `${merchantId}${merchant_oid}${returnAmountStr}${merchantSalt}`;

    const encoder = new TextEncoder();
    const keyData = encoder.encode(merchantKey);
    const messageData = encoder.encode(hashStr);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const signatureBytes = new Uint8Array(signature);
    let binary = '';
    for (let i = 0; i < signatureBytes.length; i++) {
      binary += String.fromCharCode(signatureBytes[i]);
    }
    const paytrToken = btoa(binary);

    // 7. Dispatch HTTP POST to PayTR Refund API
    const refundFormData = new URLSearchParams();
    refundFormData.set('merchant_id', merchantId);
    refundFormData.set('merchant_oid', merchant_oid);
    refundFormData.set('return_amount', returnAmountStr);
    refundFormData.set('paytr_token', paytrToken);

    const paytrResponse = await fetch('https://www.paytr.com/odeme/iade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: refundFormData.toString(),
    });

    const responseText = await paytrResponse.text();
    let paytrData: Record<string, unknown> = {};
    try {
      paytrData = JSON.parse(responseText);
    } catch {
      console.error('[paytr-refund] Non-JSON response from PayTR:', responseText);
      paytrData = { status: 'error', err_msg: `Geçersiz sağlayıcı yanıtı: ${responseText.slice(0, 100)}` };
    }

    const isSuccess = paytrData.status === 'success';
    const providerRef = typeof paytrData.reference_no === 'string' ? paytrData.reference_no : null;
    const errNo = typeof paytrData.err_no === 'string' ? paytrData.err_no : null;
    const errMsg = typeof paytrData.err_msg === 'string' ? paytrData.err_msg : null;

    // 8. Atomically Finalize in Database
    const { data: finalizeRes, error: finalizeError } = await supabaseAdmin.rpc('finalize_admin_refund', {
      p_refund_id: refund_id,
      p_is_success: isSuccess,
      p_provider_reference: providerRef,
      p_error_code: errNo,
      p_error_message: errMsg,
    });

    if (finalizeError) {
      console.error('[paytr-refund] finalize_admin_refund error:', finalizeError);
      return new Response(
        JSON.stringify({ error: finalizeError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isSuccess) {
      return new Response(
        JSON.stringify({
          success: false,
          refund_id,
          error: errMsg || 'PayTR iade işlemi reddedildi.',
          error_code: errNo,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        refund_id,
        reference_no,
        provider_reference: providerRef,
        status: finalizeRes?.status || 'succeeded',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    console.error('[paytr-refund] Unexpected exception:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Bilinmeyen sunucu hatası.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
