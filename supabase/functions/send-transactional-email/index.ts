// Supabase Edge Function: send-transactional-email
// Internal server-only function for sending a single transactional email via Gmail API.
// Authorization: server-to-server via INTERNAL_FUNCTION_SECRET header.
// Never called from the browser. Never exposes Gmail credentials in logs.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { buildMimeMessage, base64urlEncode } from '../_shared/mime.ts';
import { renderTemplate } from '../_shared/email-templates.ts';

const GMAIL_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GMAIL_SEND_ENDPOINT = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';

async function getGmailAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<string> {
  const res = await fetch(GMAIL_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gmail token exchange failed: ${res.status} ${err.slice(0, 200)}`);
  }

  const json = await res.json();
  if (!json.access_token) throw new Error('Gmail token response missing access_token');
  return json.access_token as string;
}

async function sendGmailMessage(accessToken: string, rawBase64url: string): Promise<void> {
  const res = await fetch(GMAIL_SEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: rawBase64url }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gmail API send failed: ${res.status} ${err.slice(0, 200)}`);
  }
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Server-only internal authorization: shared secret header
  const internalSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET');
  const authHeader = req.headers.get('x-internal-secret');
  if (!internalSecret || authHeader !== internalSecret) {
    return new Response('Unauthorized', { status: 401 });
  }

  const gmailClientId = Deno.env.get('GMAIL_CLIENT_ID');
  const gmailClientSecret = Deno.env.get('GMAIL_CLIENT_SECRET');
  const gmailRefreshToken = Deno.env.get('GMAIL_REFRESH_TOKEN');
  const gmailSenderEmail = Deno.env.get('GMAIL_SENDER_EMAIL');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (
    !gmailClientId ||
    !gmailClientSecret ||
    !gmailRefreshToken ||
    !gmailSenderEmail ||
    !supabaseUrl ||
    !supabaseServiceKey
  ) {
    console.error('[send-transactional-email] Missing server configuration.');
    return new Response('Server configuration error', { status: 500 });
  }

  let body: { email_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON body', { status: 400 });
  }

  const emailId = body?.email_id;
  if (!emailId || typeof emailId !== 'string') {
    return new Response('Missing email_id', { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  // Claim the row: mark as processing (idempotency guard)
  const { data: email, error: claimErr } = await supabase
    .from('transactional_emails')
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .eq('id', emailId)
    .eq('status', 'pending')
    .select()
    .single();

  if (claimErr || !email) {
    // Row not found or not in pending state — safe to skip (already claimed/sent)
    return new Response(JSON.stringify({ skipped: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { html, text, subject } = renderTemplate(email.template_key, email.payload_safe);

    const mime = buildMimeMessage({
      from: `Monocactus <${gmailSenderEmail}>`,
      to: email.recipient_email,
      subject,
      html,
      text,
    });

    const rawBase64url = base64urlEncode(mime);

    const accessToken = await getGmailAccessToken(
      gmailClientId,
      gmailClientSecret,
      gmailRefreshToken
    );

    await sendGmailMessage(accessToken, rawBase64url);

    // Mark as sent
    await supabase
      .from('transactional_emails')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', emailId);

    return new Response(JSON.stringify({ sent: true, email_id: emailId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[send-transactional-email] Send failed for email_id:', emailId, '–', msg);

    // Return to retryable state, cap at 10 attempts
    const newAttemptCount = (email.attempt_count ?? 0) + 1;
    const newStatus = newAttemptCount >= 10 ? 'failed' : 'pending';
    const retryDelay = Math.min(60 * newAttemptCount, 3600); // seconds, capped at 1 hour
    const availableAt = new Date(Date.now() + retryDelay * 1000).toISOString();

    await supabase
      .from('transactional_emails')
      .update({
        status: newStatus,
        attempt_count: newAttemptCount,
        last_error_safe: msg.slice(0, 500),
        available_at: availableAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', emailId);

    return new Response(JSON.stringify({ sent: false, error: 'Email delivery failed', retried: newStatus === 'pending' }), {
      status: 200, // 200 so orchestrator doesn't crash; payment is unaffected
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
