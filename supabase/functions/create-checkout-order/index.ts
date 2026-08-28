// Supabase Edge Function: create-checkout-order
// Authenticated server-authoritative checkout order creation endpoint.
// Executes atomic RPC transaction with pessimistic row-locking and inventory reservation.

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Sunucu yapılandırma hatası.' }),
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
    if (!body) {
      return new Response(
        JSON.stringify({ error: 'Geçersiz istek gövdesi.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      items,
      channel = 'retail',
      currency = 'TRY',
      destination_country,
      shipping_address,
      billing_address,
      accepted_preliminary_info,
      accepted_distance_sales,
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Sipariş için en az 1 ürün gereklidir.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!shipping_address || !shipping_address.country_code) {
      return new Response(
        JSON.stringify({ error: 'Teslimat adresi ve ülke kodu zorunludur.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!accepted_preliminary_info || !accepted_distance_sales) {
      return new Response(
        JSON.stringify({
          error: 'Siparişinizi tamamlamak için Ön Bilgilendirme Koşulları ve Mesafeli Satış Sözleşmesi onaylanmalıdır.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetCountry = (destination_country || shipping_address.country_code).trim().toUpperCase();

    // Call atomic order creation RPC
    const { data, error } = await supabase.rpc('create_checkout_order', {
      p_customer_id: user.id,
      p_channel: channel === 'wholesale' ? 'wholesale' : 'retail',
      p_currency: currency,
      p_destination_country: targetCountry,
      p_items: items,
      p_shipping_address: shipping_address,
      p_billing_address: billing_address || shipping_address,
      p_accepted_preliminary_info: Boolean(accepted_preliminary_info),
      p_accepted_distance_sales: Boolean(accepted_distance_sales),
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Bilinmeyen hata';
    return new Response(
      JSON.stringify({ error: `Sipariş oluşturulamadı: ${msg}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
