// Supabase Edge Function: process-email-outbox
// Internal retry runner: polls pending transactional_emails and dispatches them.
// Authorization: server-to-server via INTERNAL_FUNCTION_SECRET header.
// Not anonymously exploitable — requires shared secret. Bounded batch size.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MAX_BATCH_SIZE = 20;

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Server-only internal authorization
  const internalSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET');
  const authHeader = req.headers.get('x-internal-secret');
  if (!internalSecret || authHeader !== internalSecret) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const functionsUrl = Deno.env.get('SUPABASE_FUNCTIONS_URL') ?? supabaseUrl?.replace('/rest/v1', '') + '/functions/v1';

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response('Server configuration error', { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  // Fetch pending emails that are due (available_at <= now), bounded batch
  const { data: pendingEmails, error } = await supabase
    .from('transactional_emails')
    .select('id')
    .eq('status', 'pending')
    .lte('available_at', new Date().toISOString())
    .order('available_at', { ascending: true })
    .limit(MAX_BATCH_SIZE);

  if (error) {
    console.error('[process-email-outbox] Query error:', error);
    return new Response('Query error', { status: 500 });
  }

  if (!pendingEmails || pendingEmails.length === 0) {
    return new Response(JSON.stringify({ dispatched: 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const secret = internalSecret;
  const results: Array<{ id: string; ok: boolean }> = [];

  for (const email of pendingEmails) {
    try {
      const res = await fetch(`${functionsUrl}/send-transactional-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': secret,
        },
        body: JSON.stringify({ email_id: email.id }),
      });
      results.push({ id: email.id, ok: res.ok });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown';
      console.error('[process-email-outbox] Dispatch error for', email.id, ':', msg);
      results.push({ id: email.id, ok: false });
    }
  }

  const dispatched = results.filter((r) => r.ok).length;

  return new Response(
    JSON.stringify({ dispatched, total: pendingEmails.length }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
