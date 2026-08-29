// Supabase Edge Function: create-paytr-token
// Authenticated server-authoritative PayTR inline token generator.
// Generates official PayTR HMAC-SHA256 signature, records payment attempt, and retrieves iframe token.

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
    const appOrigin = Deno.env.get('APP_ORIGIN') || 'https://shop.monocactus.com';

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

    // 1. Fetch Order and verify ownership
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

    // 2. Derive User IP safely
    const clientIpHeader = req.headers.get('cf-connecting-ip')
      || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || '127.0.0.1';
    const userIp = clientIpHeader.slice(0, 39);

    // 3. Generate unique alphanumeric merchant_oid (strictly no hyphens, <= 64 chars)
    const cleanOrderNumber = order.order_number.replace(/[^a-zA-Z0-9]/g, '');
    const uniqueSuffix = Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    const merchantOid = `VZ${cleanOrderNumber}${uniqueSuffix}`.slice(0, 64);

    // 4. Record Payment Attempt in DB
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

    // 5. Build user_basket
    const basketItems: [string, string, number][] = order.order_items.map((item: { product_name_snapshot: string; unit_price_minor: number; quantity: number }) => [
      item.product_name_snapshot,
      (item.unit_price_minor / 100).toFixed(2),
      item.quantity,
    ]);

    if (order.shipping_minor > 0) {
      basketItems.push(['Kargo Ücreti', (order.shipping_minor / 100).toFixed(2), 1]);
    }

    const userBasket = utf8ToBase64(JSON.stringify(basketItems));

    // 6. User details with field constraint safety
    const shippingAddr = order.shipping_address || {};
    const email = sanitizeEmail(user.email || 'musteri@vazostudio.com');
    const userName = (shippingAddr.recipient_name || user.email || 'Müşteri').slice(0, 60);
    const userAddress = `${shippingAddr.address_line1 || ''} ${shippingAddr.district || ''} ${shippingAddr.city || ''} ${shippingAddr.country_name || ''}`.trim().slice(0, 400);
    const userPhone = (shippingAddr.phone || '5550000000').replace(/\s+/g, '').slice(0, 20);

    const paymentAmount = order.total_minor.toString();
    const noInstallment = '1';
    const maxInstallment = '0';
    const currency = order.currency === 'TRY' ? 'TL' : order.currency;
    const timeoutLimit = '30';
    const merchantOkUrl = `${appOrigin}/payment/success?order_id=${order.id}`;
    const merchantFailUrl = `${appOrigin}/payment/failure?order_id=${order.id}`;

    // 7. Official PayTR HMAC-SHA256 Hash Generation
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

    // 8. Dispatch request to PayTR Token API
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

    const paytrResponse = await fetch('https://www.paytr.com/odeme/api/get-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const paytrData = await paytrResponse.json();

    if (paytrData.status !== 'success') {
      return new Response(
        JSON.stringify({
          error: `PayTR ödeme başlatılamadı: ${paytrData.reason || 'Bilinmeyen hata'}`,
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
    return new Response(
      JSON.stringify({ error: `PayTR token hatası: ${msg}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
