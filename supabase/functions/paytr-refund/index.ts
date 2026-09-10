// Supabase Edge Function: paytr-refund
// Authenticated admin-only server-authoritative PayTR refund processor.
// Validates admin RBAC, executes pessimistic row-locking preparation, computes HMAC-SHA256 signature,
// calls PayTR Refund API with timeout/fail-closed semantics, and atomically finalizes financial records.
//
// FAIL-CLOSED ABSOLUTE INVARIANT:
// Database records NEVER transition to refunded unless PayTR authoritatively confirms success.
// Missing credentials, timeouts, network failures, malformed JSON, and provider rejections
// strictly record failed attempts without altering order status, payment status, or inventory.

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

  let preparedRefundId: string | null = null;
  let supabaseAdminClient: ReturnType<typeof createClient> | null = null;

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

    if (
      typeof refund_amount_minor !== 'number' ||
      !Number.isInteger(refund_amount_minor) ||
      refund_amount_minor <= 0
    ) {
      return new Response(
        JSON.stringify({ error: 'refund_amount_minor 0\'dan büyük geçerli bir tamsayı kuruş değeri olmalıdır.' }),
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
    supabaseAdminClient = supabaseAdmin;

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

    // Idempotency check on already prepared record
    if (prepareRes.already_prepared) {
      if (prepareRes.status === 'succeeded') {
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
      if (prepareRes.status === 'pending') {
        return new Response(
          JSON.stringify({
            error: 'Bu iade talebi zaten işleme alınmış ve devam ediyor.',
            error_code: 'REFUND_IN_PROGRESS',
            refund_id: prepareRes.refund_id,
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({
          error: 'Bu idempotency anahtarıyla yapılan iade denemesi daha önce başarısızlıkla sonuçlandı. Lütfen yeni bir işlem başlatın.',
          error_code: 'REFUND_ALREADY_FAILED',
          refund_id: prepareRes.refund_id,
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { refund_id, reference_no, merchant_oid, amount_minor } = prepareRes;
    preparedRefundId = refund_id;

    // 5. Fail-Closed Check on PayTR Secrets: Missing config is a hard error, NEVER simulate success!
    if (!merchantId || !merchantKey || !merchantSalt) {
      console.error('[paytr-refund] Missing PayTR merchant secrets. Failing closed.');
      
      await supabaseAdmin.rpc('finalize_admin_refund', {
        p_refund_id: refund_id,
        p_is_success: false,
        p_provider_reference: null,
        p_error_code: 'CONFIGURATION_ERROR',
        p_error_message: 'PayTR mağaza kimlik bilgileri yapılandırılmamış (PAYTR_MERCHANT_ID, KEY veya SALT eksik).',
      });

      return new Response(
        JSON.stringify({
          success: false,
          refund_id,
          error: 'PayTR yapılandırması eksik. İade işlemi gerçekleştirilemez.',
          error_code: 'CONFIGURATION_ERROR',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // 7. Dispatch HTTP POST to PayTR with strict 15s timeout
    const refundFormData = new URLSearchParams();
    refundFormData.set('merchant_id', merchantId);
    refundFormData.set('merchant_oid', merchant_oid);
    refundFormData.set('return_amount', returnAmountStr);
    refundFormData.set('paytr_token', paytrToken);

    let paytrResponse: Response;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      paytrResponse = await fetch('https://www.paytr.com/odeme/iade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: refundFormData.toString(),
        signal: controller.signal,
      });
    } catch (fetchErr: unknown) {
      clearTimeout(timeoutId);
      const isTimeout = fetchErr instanceof Error && fetchErr.name === 'AbortError';
      const errorCode = isTimeout ? 'PROVIDER_TIMEOUT' : 'NETWORK_ERROR';
      const errorMessage = isTimeout
        ? 'PayTR iade servisine bağlanırken 15 saniyelik zaman aşımı oluştu.'
        : (fetchErr instanceof Error ? fetchErr.message : 'PayTR ağına bağlanılamadı.');

      console.error(`[paytr-refund] ${errorCode}:`, errorMessage);

      await supabaseAdmin.rpc('finalize_admin_refund', {
        p_refund_id: refund_id,
        p_is_success: false,
        p_provider_reference: null,
        p_error_code: errorCode,
        p_error_message: errorMessage,
      });

      return new Response(
        JSON.stringify({
          success: false,
          refund_id,
          error: errorMessage,
          error_code: errorCode,
        }),
        { status: isTimeout ? 504 : 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    // 8. Parse PayTR Response & Validate Integrity
    const responseText = await paytrResponse.text();
    let paytrData: Record<string, unknown> = {};
    let isMalformed = false;

    try {
      paytrData = JSON.parse(responseText);
    } catch {
      isMalformed = true;
      console.error('[paytr-refund] Non-JSON or malformed response from PayTR:', responseText);
    }

    const isSuccess = !isMalformed && paytrResponse.ok && paytrData.status === 'success';
    const providerRef = typeof paytrData.reference_no === 'string' ? paytrData.reference_no : null;
    const errNo = isMalformed
      ? 'MALFORMED_PROVIDER_RESPONSE'
      : (paytrData.err_no != null ? String(paytrData.err_no) : (!isSuccess ? 'PROVIDER_REJECTED' : null));
    const errMsg = isMalformed
      ? `Geçersiz sağlayıcı yanıtı: ${responseText.slice(0, 100)}`
      : (paytrData.err_msg != null ? String(paytrData.err_msg) : (!isSuccess ? 'PayTR iade talebini reddetti.' : null));

    // 9. Fail-Closed Finalization in Database
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
    if (preparedRefundId && supabaseAdminClient) {
      try {
        await supabaseAdminClient.rpc('finalize_admin_refund', {
          p_refund_id: preparedRefundId,
          p_is_success: false,
          p_provider_reference: null,
          p_error_code: 'UNEXPECTED_SERVER_ERROR',
          p_error_message: err instanceof Error ? err.message : 'Bilinmeyen sunucu hatası.',
        });
      } catch (finalizeCatchErr) {
        console.error('[paytr-refund] Failed to auto-finalize refund after error:', finalizeCatchErr);
      }
    }
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Bilinmeyen sunucu hatası.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
