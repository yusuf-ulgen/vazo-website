// Supabase Edge Function: submit-trade-application
// Deno TypeScript environment for controlled public trade application submission.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    // Strict Input Validation & Normalization
    const companyName = String(payload.companyName || '').trim();
    const taxNumber = String(payload.taxNumber || '').trim();
    const taxOffice = String(payload.taxOffice || '').trim();
    const businessType = String(payload.businessType || '').trim();
    const contactPerson = String(payload.contactPerson || '').trim();
    const email = String(payload.email || '').trim().toLowerCase();
    const phone = String(payload.phone || '').trim();
    const website = payload.website ? String(payload.website).trim() : null;
    const estimatedMonthlyVolume = payload.estimatedMonthlyVolume ? String(payload.estimatedMonthlyVolume).trim() : null;
    const customerMessage = payload.customerMessage || payload.notes ? String(payload.customerMessage || payload.notes).trim() : null;

    if (!companyName || !taxNumber || !taxOffice || !contactPerson || !email || !phone) {
      return new Response(
        JSON.stringify({ error: 'Zorunlu alanlar eksik.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 255) {
      return new Response(
        JSON.stringify({ error: 'Geçersiz e-posta adresi.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Character length limits
    if (companyName.length > 200 || taxNumber.length > 50 || taxOffice.length > 100 || contactPerson.length > 100 || phone.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Girilen alan boyutları izin verilen sınırları aşıyor.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { error: dbError } = await supabase.from('trade_applications').insert({
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
        JSON.stringify({ error: 'Başvuru kaydedilirken bir hata oluştu.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Toptan / B2B başvurunuz başarıyla alındı.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: 'Geçersiz istek gövdesi.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
