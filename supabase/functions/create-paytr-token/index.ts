// Supabase Edge Function: create-paytr-token
// Authenticated server-authoritative PayTR inline token generator.
// Enforces strict customer data integrity (no dummy/fake values), origin safety,
// reservation validation, and truthful failed payment state transitions upon provider errors.

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

// Convert string to Base64 safely handling UTF-8 characters
function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Sanitize Turkish characters for PayTR email constraint
function sanitizeEmail(email: string): string {
  const map: Record<string, string> = {
    'ı': 'i', 'İ': 'i', 'ğ': 'g', 'Ğ': 'g', 'ü': 'u', 'Ü': 'u',
    'ş': 's', 'Ş': 's', 'ö': 'o', 'Ö': 'o', 'ç': 'c', 'Ç': 'c',
  };
  return email.trim().replace(/[ıİğĞüÜşŞöÖçÇ]/g, (c) => map[c] || c).slice(0, 100);
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

  let createdMerchantOid: string | null = null;
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
    const testMode = Deno.env.get('PAYTR_TEST_MODE') || '1';
    const debugOn = Deno.env.get('PAYTR_DEBUG_ON') || '1';
    const rawAppOrigin = Deno.env.get('APP_ORIGIN');

    // Origin Safety: Production missing APP_ORIGIN must fail clearly
    if (!rawAppOrigin && testMode !== '1') {
      console.error('[create-paytr-token] Missing APP_ORIGIN in production environment.');
      return new Response(
        JSON.stringify({ error: 'Sunucu yapılandırma hatası: APP_ORIGIN tanımlanmamış.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const baseOrigin = (rawAppOrigin || 'https://shop.monocactus.com').trim().replace(/\/+$/, '');
    let safeOrigin = baseOrigin;
    if (safeOrigin.startsWith('http://shop.monocactus.com')) {
      safeOrigin = safeOrigin.replace('http://', 'https://');
    }

    try {
      const parsedUrl = new URL(safeOrigin);
      if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
        throw new Error('Geçersiz protokol');
      }
    } catch {
      return new Response(
        JSON.stringify({ error: 'Sunucu yapılandırma hatası: APP_ORIGIN geçersiz bir URL.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !merchantId || !merchantKey || !merchantSalt) {
      return new Response(
        JSON.stringify({ error: 'Sunucu ödeme altyapısı yapılandırması eksik.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });
    supabaseAdminClient = supabase;

    // 1. Authenticate Request
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Geçersiz veya süresi dolmuş oturum.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.order_id) {
      return new Response(
        JSON.stringify({ error: 'Sipariş kimliği (order_id) zorunludur.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Kill Switch Validation
    const { data: commerceSetting } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'commerce')
      .single();

    const isCheckoutEnabled = Boolean(commerceSetting?.value?.checkout_enabled);
    if (!isCheckoutEnabled) {
      return new Response(
        JSON.stringify({ error: 'Ödeme ve sipariş sistemi şu anda kapalıdır.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Fetch Order and verify ownership & business validity
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*), inventory_reservations(*)')
      .eq('id', body.order_id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Sipariş bulunamadı.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (order.customer_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Bu siparişe erişim yetkiniz bulunmamaktadır.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (order.status !== 'pending_payment') {
      return new Response(
        JSON.stringify({ error: `Sipariş ödeme aşamasında değil (Mevcut Durum: ${order.status}).` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!order.order_items || order.order_items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Siparişte ürün kalemi bulunamadı.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!order.total_minor || order.total_minor <= 0) {
      return new Response(
        JSON.stringify({ error: 'Sipariş toplam tutarı 0\'dan büyük olmalıdır.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['TRY', 'USD', 'EUR', 'GBP'].includes(order.currency)) {
      return new Response(
        JSON.stringify({ error: `Desteklenmeyen para birimi: ${order.currency}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Reservation & Payment Expiration Check
    const reservations = (order.inventory_reservations || []) as Array<{ expires_at?: string; status?: string }>;
    const now = new Date();
    const paymentExpiresAt = order.metadata?.payment_expires_at ? new Date(order.metadata.payment_expires_at as string) : null;

    const isReservationExpired = reservations.length > 0 && reservations.every((r) => {
      if (r.status !== 'active') return true;
      return r.expires_at ? new Date(r.expires_at) <= now : false;
    });
    const isPaymentTimeExpired = paymentExpiresAt ? paymentExpiresAt <= now : false;

    if (isReservationExpired || isPaymentTimeExpired) {
      return new Response(
        JSON.stringify({
          error: 'Sipariş için ayrılan stok rezervasyon süresi dolmuştur. Lütfen yeni bir sipariş oluşturun.',
          code: 'RESERVATION_EXPIRED',
          is_expired: true,
        }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Strict Customer Data Integrity Validation (No Fake / Dummy Values)
    const shippingAddr = order.shipping_address || {};
    const legalSnapshot = order.customer_legal_snapshot || {};

    // 5a. Real Email
    const rawEmail = (legalSnapshot.email || user.email || shippingAddr.email || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isFakeEmail = !rawEmail ||
      rawEmail.includes('musteri@vazostudio.com') ||
      rawEmail.includes('placeholder') ||
      rawEmail.endsWith('@example.com') ||
      rawEmail === 'test@test.com';

    if (!emailRegex.test(rawEmail) || isFakeEmail) {
      return new Response(
        JSON.stringify({
          error: 'Geçerli bir müşteri e-posta adresi zorunludur. Lütfen profilinizdeki e-posta adresinizi doğrulayın.',
          code: 'INVALID_CUSTOMER_EMAIL',
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const email = sanitizeEmail(rawEmail);

    // 5b. Real Name
    const rawName = (shippingAddr.recipient_name || legalSnapshot.customer_name || '').trim();
    const isFakeName = !rawName || rawName.length < 2 || rawName === 'Müşteri' || rawName === 'Değerli Müşterimiz';
    if (isFakeName) {
      return new Response(
        JSON.stringify({
          error: 'Teslimat için geçerli bir alıcı ad-soyad bilgisi zorunludur. Lütfen adresinizi güncelleyin.',
          code: 'INVALID_RECIPIENT_NAME',
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const userName = rawName.slice(0, 60);

    // 5c. Real Phone
    const rawPhone = (shippingAddr.phone || legalSnapshot.phone || '').replace(/\D/g, '');
    const isFakePhone = !rawPhone ||
      rawPhone.length < 10 ||
      rawPhone === '5550000000' ||
      rawPhone === '1234567890' ||
      /^(\d)\1+$/.test(rawPhone);

    if (isFakePhone) {
      return new Response(
        JSON.stringify({
          error: 'Teslimat ve SMS bilgilendirmesi için geçerli bir telefon numarası zorunludur. Lütfen adresinizdeki telefon bilgisini güncelleyin.',
          code: 'INVALID_PHONE_NUMBER',
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const userPhone = rawPhone.slice(0, 20);

    // 5d. Real Shipping Address
    const line1 = (shippingAddr.address_line1 || '').trim();
    const city = (shippingAddr.city || '').trim();
    const district = (shippingAddr.district || '').trim();
    const country = (shippingAddr.country_name || 'Türkiye').trim();
    const userAddress = `${line1} ${district} ${city} ${country}`.trim();

    if (!line1 || line1.length < 5 || !city || userAddress.length < 10) {
      return new Response(
        JSON.stringify({
          error: 'Geçerli ve açık bir teslimat adresi zorunludur. Lütfen adres bilgilerinizi eksiksiz doldurun.',
          code: 'INVALID_SHIPPING_ADDRESS',
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. User IP & Unique merchant_oid Generation
    const clientIpHeader = req.headers.get('cf-connecting-ip')
      || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || '127.0.0.1';
    const userIp = clientIpHeader.slice(0, 39);

    const cleanOrderNumber = order.order_number.replace(/[^a-zA-Z0-9]/g, '');
    const uniqueSuffix = Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    const merchantOid = `VZ${cleanOrderNumber}${uniqueSuffix}`.slice(0, 64);
    createdMerchantOid = merchantOid;

    // 7. Record Payment Attempt in DB (Initial Status: initiated)
    const { error: initiateError } = await supabase.rpc('initiate_order_payment', {
      p_order_id: order.id,
      p_merchant_oid: merchantOid,
      p_expected_amount_minor: order.total_minor,
      p_currency: order.currency,
      p_test_mode: testMode === '1',
    });

    if (initiateError) {
      return new Response(
        JSON.stringify({ error: initiateError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Build user_basket
    const basketItems: [string, string, number][] = order.order_items.map((item: { product_name_snapshot: string; unit_price_minor: number; quantity: number }) => [
      item.product_name_snapshot,
      (item.unit_price_minor / 100).toFixed(2),
      item.quantity,
    ]);

    if (order.shipping_minor > 0) {
      basketItems.push(['Kargo Ücreti', (order.shipping_minor / 100).toFixed(2), 1]);
    }

    const userBasket = utf8ToBase64(JSON.stringify(basketItems));
    const paymentAmount = order.total_minor.toString();
    const noInstallment = '1';
    const maxInstallment = '0';
    const currency = order.currency === 'TRY' ? 'TL' : order.currency;
    const timeoutLimit = '30';
    const merchantOkUrl = `${safeOrigin}/payment/success?order_id=${order.id}`;
    const merchantFailUrl = `${safeOrigin}/payment/failure?order_id=${order.id}`;

    // 9. Official PayTR HMAC-SHA256 Token
    const hashStr = `${merchantId}${userIp}${merchantOid}${email}${paymentAmount}${userBasket}${noInstallment}${maxInstallment}${currency}${testMode}${merchantSalt}`;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(merchantKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(hashStr));
    const paytrToken = btoa(String.fromCharCode(...new Uint8Array(signature)));

    // 10. Dispatch request to PayTR Token API
    const params = new URLSearchParams();
    params.append('merchant_id', merchantId);
    params.append('user_ip', userIp);
    params.append('merchant_oid', merchantOid);
    params.append('email', email);
    params.append('payment_amount', paymentAmount);
    params.append('paytr_token', paytrToken);
    params.append('user_basket', userBasket);
    params.append('debug_on', debugOn);
    params.append('no_installment', noInstallment);
    params.append('max_installment', maxInstallment);
    params.append('user_name', userName);
    params.append('user_address', userAddress);
    params.append('user_phone', userPhone);
    params.append('merchant_ok_url', merchantOkUrl);
    params.append('merchant_fail_url', merchantFailUrl);
    params.append('timeout_limit', timeoutLimit);
    params.append('currency', currency);
    params.append('test_mode', testMode);
    params.append('lang', 'tr');

    let paytrResponse: Response;
    try {
      paytrResponse = await fetch('https://www.paytr.com/odeme/api/get-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
    } catch (networkErr: unknown) {
      console.error('[create-paytr-token] PayTR network error:', networkErr);
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          failure_code: 'PAYTR_NETWORK_ERROR',
          failure_message_safe: 'PayTR servisine bağlanırken ağ hatası oluştu.',
          failed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('merchant_oid', merchantOid);

      return new Response(
        JSON.stringify({ error: 'PayTR servisi ile iletişim kurulamadı.', code: 'PAYTR_NETWORK_ERROR' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paytrData = await paytrResponse.json().catch(() => ({ status: 'error', reason: 'Geçersiz JSON yanıtı' }));

    if (paytrData.status !== 'success') {
      const failureReason = paytrData.reason || 'Bilinmeyen PayTR hatası';
      console.error('[create-paytr-token] PayTR rejected token creation:', failureReason);

      // Truthfully update payment attempt state from initiated to failed
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          failure_code: 'PAYTR_TOKEN_REJECTED',
          failure_message_safe: failureReason,
          failed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('merchant_oid', merchantOid);

      return new Response(
        JSON.stringify({
          error: `PayTR ödeme başlatılamadı: ${failureReason}`,
          code: 'PAYTR_TOKEN_REJECTED',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        token: paytrData.token,
        iframe_url: `https://www.paytr.com/odeme/guvenli/${paytrData.token}`,
        merchant_oid: merchantOid,
        is_test_mode: testMode === '1',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Bilinmeyen hata';
    console.error('[create-paytr-token] Exception:', msg);

    if (createdMerchantOid && supabaseAdminClient) {
      await supabaseAdminClient
        .from('payments')
        .update({
          status: 'failed',
          failure_code: 'SERVER_EXCEPTION',
          failure_message_safe: msg,
          failed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('merchant_oid', createdMerchantOid)
        .catch(() => {});
    }

    return new Response(
      JSON.stringify({ error: `PayTR token hatası: ${msg}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
