// Supabase Edge Function: admin-readiness
// Admin-only integration readiness endpoint.
// Returns BOOLEAN presence flags only for secrets, operational config, and DB completeness.
// NEVER returns actual secret values.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
  };
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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

    // RBAC: Verify admin privileges
    const { data: isAdmin } = await supabase.rpc('is_admin', {}, { count: 'exact' }).catch(() => ({ data: false, error: null }));
    
    // Check customer_profiles role
    const { data: profile } = await supabase
      .from('customer_profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const isUserAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || Boolean(isAdmin);

    if (!isUserAdmin) {
      return new Response(
        JSON.stringify({ error: 'Bu bilgileri görüntülemek için yönetici yetkisi gereklidir.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Detect Environment Secrets presence (BOOLEAN only — NEVER return values)
    const paytrMerchantId = Deno.env.get('PAYTR_MERCHANT_ID');
    const paytrMerchantKey = Deno.env.get('PAYTR_MERCHANT_KEY');
    const paytrMerchantSalt = Deno.env.get('PAYTR_MERCHANT_SALT');
    const hasPaytrSecrets = Boolean(
      paytrMerchantId && paytrMerchantId.trim() !== '' &&
      paytrMerchantKey && paytrMerchantKey.trim() !== '' &&
      paytrMerchantSalt && paytrMerchantSalt.trim() !== ''
    );

    const gmailUser = Deno.env.get('GMAIL_USER');
    const gmailAppPassword = Deno.env.get('GMAIL_APP_PASSWORD');
    const hasGmailSecrets = Boolean(
      gmailUser && gmailUser.trim() !== '' &&
      gmailAppPassword && gmailAppPassword.trim() !== ''
    );

    const hasSupabaseOperational = Boolean(
      supabaseUrl && supabaseUrl.trim() !== '' &&
      supabaseServiceKey && supabaseServiceKey.trim() !== ''
    );

    // 2. Query Database-level Readiness RPC
    const { data: dbReadiness, error: dbError } = await supabase.rpc('get_checkout_readiness');

    if (dbError) {
      return new Response(
        JSON.stringify({ error: `Veritabanı hazırlık durumu alınamadı: ${dbError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = {
      seller_legal_complete: Boolean(dbReadiness?.seller_legal_complete),
      checkout_enabled: Boolean(dbReadiness?.checkout_enabled),
      has_active_shipping: Boolean(dbReadiness?.has_active_shipping),
      paytr_secrets_present: hasPaytrSecrets,
      gmail_secrets_present: hasGmailSecrets,
      supabase_auth_operational: hasSupabaseOperational,
      seller_fields_summary: dbReadiness?.seller_fields_summary || {},
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Bilinmeyen hata';
    return new Response(
      JSON.stringify({ error: `Hazırlık durumu kontrolü başarısız: ${msg}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
