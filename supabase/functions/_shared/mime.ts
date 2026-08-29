// Shared MIME message builder for Gmail API
// Produces RFC 2822-compliant MIME email messages.
// Content is escaped to prevent header injection.

/**
 * Sanitizes a header value: strips newlines and null bytes to prevent header injection.
 */
function sanitizeHeader(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\r\n\x00]/g, ' ').trim();
}

export interface MimeMessageOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Builds a multipart/alternative MIME message string.
 * Returns raw RFC 2822 message suitable for Gmail API base64url encoding.
 */
export function buildMimeMessage(opts: MimeMessageOptions): string {
  const boundary = `boundary_vazo_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const from = sanitizeHeader(opts.from);
  const to = sanitizeHeader(opts.to);
  const subject = sanitizeHeader(opts.subject);

  // Encode subject as UTF-8 base64 to support non-ASCII characters (Turkish)
  const subjectEncoded = `=?UTF-8?B?${btoa(encodeURIComponent(subject).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))))}?=`;

  const lines: string[] = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subjectEncoded}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: quoted-printable`,
    ``,
    opts.text,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: quoted-printable`,
    ``,
    opts.html,
    ``,
    `--${boundary}--`,
  ];

  return lines.join('\r\n');
}

/**
 * Encodes a UTF-8 string to base64url for Gmail API raw message field.
 */
export function base64urlEncode(raw: string): string {
  const bytes = new TextEncoder().encode(raw);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
