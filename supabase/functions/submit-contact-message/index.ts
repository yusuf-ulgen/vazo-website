// Supabase Edge Function: submit-contact-message
// Deno TypeScript environment for controlled public contact form message submission.

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

    const name = String(payload.name || '').trim();
    const email = String(payload.email || '').trim().toLowerCase();
    const subject = String(payload.subject || 'Genel İletişim').trim();
    const message = String(payload.message || '').trim();

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'Lütfen zorunlu alanları (ad, e-posta, mesaj) doldurunuz.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 255) {
      return new Response(
        JSON.stringify({ error: 'Geçersiz e-posta adresi.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (name.length > 100 || subject.length > 200 || message.length > 3000) {
      return new Response(
        JSON.stringify({ error: 'Mesaj veya başlık uzunluk sınırını aşıyor.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { error: dbError } = await supabase.from('contact_messages').insert({
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
        JSON.stringify({ error: 'Mesaj kaydedilirken bir hata oluştu.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Mesajınız stüdyo ekibimize başarıyla iletildi.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: 'Geçersiz istek biçimi.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
