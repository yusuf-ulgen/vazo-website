// Supabase Edge Function: subscribe-newsletter
// Deno TypeScript runtime with Service Role authority, strict allowlist, and anti-spam protection.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MAX_PAYLOAD_BYTES = 8192; // 8 KB limit

const ALLOWED_KEYS = new Set([
  'email',
  'source',
  'company_website_confirm', // Honeypot field
  'bot_field',               // Honeypot fallback
]);

const FORBIDDEN_ADMIN_KEYS = [
  'status',
  'id',
  'createdAt',
  'created_at',
  'updatedAt',
  'updated_at',
];

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

  const contentLength = Number(req.headers.get('content-length') || 0);
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return new Response(
      JSON.stringify({ error: 'İstek boyutu izin verilen sınırı aşıyor (Maksimum 8 KB).' }),
      { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const rawBody = await req.json();

    if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
      return new Response(
        JSON.stringify({ error: 'Geçersiz JSON istek gövdesi.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const providedKeys = Object.keys(rawBody);
    for (const key of providedKeys) {
      if (FORBIDDEN_ADMIN_KEYS.includes(key)) {
        return new Response(
          JSON.stringify({ error: `Güvenlik İhlali: Sistem alanı (${key}) istemci tarafından gönderilemez.` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (!ALLOWED_KEYS.has(key)) {
        return new Response(
          JSON.stringify({ error: `Tanınmayan alan: ${key}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Honeypot Spam Bot Check
    const honeypot = String(rawBody.company_website_confirm || rawBody.bot_field || '').trim();
    if (honeypot.length > 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'Bülten kaydınız tamamlandı.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const email = String(rawBody.email || '').trim().toLowerCase();
    const source = String(rawBody.source || 'storefront').trim().slice(0, 50);

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'E-posta adresi zorunludur.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 255) {
      return new Response(
        JSON.stringify({ error: 'Geçerli bir e-posta adresi giriniz.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Sunucu konfigürasyonu eksik (Service Authority).' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error: dbError } = await supabaseAdmin.from('newsletter_subscriptions').insert({
      normalized_email: email,
      source: source,
      status: 'active',
    });

    if (dbError && dbError.code !== '23505') {
      return new Response(
        JSON.stringify({ error: 'Bülten kaydı oluşturulurken bir hata oluştu.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Bülten kaydınız başarıyla tamamlandı.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: 'Geçersiz istek.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
