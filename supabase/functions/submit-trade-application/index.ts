// Supabase Edge Function: submit-trade-application
// Deno TypeScript runtime with Service Role authority, strict allowlist, and anti-spam protection.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MAX_PAYLOAD_BYTES = 65536; // 64 KB limit

// Explicitly allowed client input fields
const ALLOWED_KEYS = new Set([
  'companyName',
  'taxNumber',
  'taxOffice',
  'businessType',
  'contactPerson',
  'email',
  'phone',
  'website',
  'estimatedMonthlyVolume',
  'customerMessage',
  'notes',
  'company_website_confirm', // Honeypot field
  'bot_field',               // Honeypot fallback
]);

// Prohibited admin/system fields that must trigger a 400 Bad Request if injected
const FORBIDDEN_ADMIN_KEYS = [
  'status',
  'approved',
  'reviewedAt',
  'reviewed_at',
  'adminNotes',
  'admin_notes',
  'role',
  'userRole',
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

  // Enforce Payload Size Limit
  const contentLength = Number(req.headers.get('content-length') || 0);
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return new Response(
      JSON.stringify({ error: 'İstek gövdesi izin verilen boyutu aşıyor (Maksimum 64 KB).' }),
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

    // Honeypot Spam Bot Check (if filled, silently succeed without DB insert)
    const honeypot = String(rawBody.company_website_confirm || rawBody.bot_field || '').trim();
    if (honeypot.length > 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'Başvurunuz alındı.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Strict Field Extraction & Normalization
    const companyName = String(rawBody.companyName || '').trim();
    const taxNumber = String(rawBody.taxNumber || '').trim();
    const taxOffice = String(rawBody.taxOffice || '').trim();
    const businessType = String(rawBody.businessType || 'İç Mimarlık / Tasarım Ofisi').trim();
    const contactPerson = String(rawBody.contactPerson || '').trim();
    const email = String(rawBody.email || '').trim().toLowerCase();
    const phone = String(rawBody.phone || '').trim();
    const website = rawBody.website ? String(rawBody.website).trim() : null;
    const estimatedMonthlyVolume = rawBody.estimatedMonthlyVolume ? String(rawBody.estimatedMonthlyVolume).trim() : null;
    const customerMessage = rawBody.customerMessage || rawBody.notes ? String(rawBody.customerMessage || rawBody.notes).trim() : null;

    if (!companyName || !taxNumber || !taxOffice || !contactPerson || !email || !phone) {
      return new Response(
        JSON.stringify({ error: 'Lütfen tüm zorunlu kurumsal ve yetkili iletişim alanlarını doldurunuz.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 255) {
      return new Response(
        JSON.stringify({ error: 'Geçersiz kurumsal e-posta adresi formatı.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Character length limits
    if (
      companyName.length > 200 ||
      taxNumber.length > 50 ||
      taxOffice.length > 100 ||
      contactPerson.length > 100 ||
      phone.length > 50 ||
      (website && website.length > 255) ||
      (customerMessage && customerMessage.length > 3000)
    ) {
      return new Response(
        JSON.stringify({ error: 'Girilen alan boyutları izin verilen maksimum karakter sınırlarını aşıyor.' }),
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

    // Server-side user identity extraction (never trusted from payload)
    let authenticatedUserId: string | null = null;
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      try {
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (user) {
          authenticatedUserId = user.id;
        }
      } catch {
        // Continue unlinked if token is invalid or expired
      }
    }

    const { error: dbError } = await supabaseAdmin.from('trade_applications').insert({
      user_id: authenticatedUserId,
      company_name: companyName,
      tax_number: taxNumber,
      tax_office: taxOffice,
      business_type: businessType,
      contact_person: contactPerson,
      email: email,
      phone: phone,
      website: website,
      estimated_monthly_volume: estimatedMonthlyVolume,
      customer_message: customerMessage,
      status: 'pending',
      reviewed_at: null,
      admin_notes: null,
    });

    if (dbError) {
      return new Response(
        JSON.stringify({ error: 'Başvuru veritabanına kaydedilirken bir hata oluştu.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Toptan / Trade başvurunuz başarıyla alındı. B2B temsilcimiz en kısa sürede sizinle iletişime geçecektir.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: 'Geçersiz istek biçimi veya ayrıştırma hatası.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
