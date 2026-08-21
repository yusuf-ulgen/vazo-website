// Supabase Edge Function: submit-contact-message
// Deno TypeScript runtime with Service Role authority, strict allowlist, and anti-spam protection.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MAX_PAYLOAD_BYTES = 32768; // 32 KB limit

// Explicitly allowed client input fields
const ALLOWED_KEYS = new Set([
  'name',
  'email',
  'subject',
  'message',
  'company_website_confirm', // Honeypot field
  'bot_field',               // Honeypot fallback
]);

// Prohibited admin/system fields that must trigger a 400 Bad Request if injected
const FORBIDDEN_ADMIN_KEYS = [
  'status',
  'adminNotes',
  'admin_notes',
  'reviewedAt',
  'reviewed_at',
  'id',
  'createdAt',
  'created_at',
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

  // Enforce Payload Size Limit
  const contentLength = Number(req.headers.get('content-length') || 0);
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return new Response(
      JSON.stringify({ error: 'İstek boyutu izin verilen sınırı aşıyor (Maksimum 32 KB).' }),
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

    // Check for prohibited admin keys or unknown injected fields
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
        JSON.stringify({ success: true, message: 'Mesajınız alındı.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const name = String(rawBody.name || '').trim();
    const email = String(rawBody.email || '').trim().toLowerCase();
    const subject = String(rawBody.subject || 'Genel İletişim').trim();
    const message = String(rawBody.message || '').trim();

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'Lütfen zorunlu alanları (ad, e-posta, mesaj) doldurunuz.' }),
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

    if (name.length > 100 || subject.length > 200 || message.length > 3000) {
      return new Response(
        JSON.stringify({ error: 'Mesaj veya başlık uzunluk sınırını aşıyor.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authoritative Server Database Client using Service Role Key
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

    const { error: dbError } = await supabaseAdmin.from('contact_messages').insert({
      name,
      email,
      subject,
      message,
      status: 'new',
      reviewed_at: null,
      admin_notes: null,
    });

    if (dbError) {
      return new Response(
        JSON.stringify({ error: 'Mesaj veritabanına kaydedilirken bir hata oluştu.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Mesajınız stüdyo ekibimize başarıyla iletildi.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: 'Geçersiz istek biçimi veya ayrıştırma hatası.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
