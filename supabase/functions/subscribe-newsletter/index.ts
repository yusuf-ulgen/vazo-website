// Supabase Edge Function: subscribe-newsletter
// Deno TypeScript environment for privacy-safe newsletter subscription.

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
    const email = String(payload.email || '').trim().toLowerCase();
    const source = String(payload.source || 'storefront').trim();

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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Insert with safe ignore if duplicate (Privacy safe idempotent response)
    const { error: dbError } = await supabase.from('newsletter_subscriptions').insert({
      normalized_email: email,
      source: source.slice(0, 50),
      status: 'active',
    });

    if (dbError && dbError.code !== '23505') {
      // 23505 is PostgreSQL unique constraint violation (already subscribed)
      return new Response(
        JSON.stringify({ error: 'Bülten kaydı oluşturulamadı.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Always return privacy-safe success
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
