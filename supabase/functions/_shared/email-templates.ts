// Shared transactional email template renderer.
// All customer-controlled content is HTML-escaped to prevent XSS/injection.
// Template payloads come from immutable order snapshots in the database.
// Admin notes are never included in customer-facing emails.

/**
 * Escapes HTML special characters to prevent XSS in email templates.
 */
export function escapeHtml(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Sanitizes a URL for use in href attributes.
 * Only allows https:// and http:// URLs. All other schemes (javascript:, data:, etc.)
 * are replaced with a safe fallback to prevent XSS.
 */
function sanitizeUrl(url: string): string {
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return escapeHtml(url);
  }
  return '#';
}

/**
 * Formats a minor-unit amount to display currency string.
 * e.g. 15000 TRY → "150,00 ₺"
 */
function formatMoney(minor: number, currency = 'TRY'): string {
  const major = minor / 100;
  if (currency === 'TRY') return `${major.toFixed(2).replace('.', ',')} ₺`;
  return `${major.toFixed(2)} ${currency}`;
}

function baseLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; background: #f5f3f0; margin: 0; padding: 0; color: #1a1a1a; }
  .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border: 1px solid #e0dcd6; }
  .header { background: #1a1a1a; padding: 28px 32px; text-align: center; }
  .header h1 { color: #ffffff; font-size: 20px; font-weight: 400; letter-spacing: 0.15em; margin: 0; text-transform: uppercase; }
  .content { padding: 36px 32px; }
  .content h2 { font-size: 18px; font-weight: 400; margin-top: 0; }
  .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .info-table td { padding: 10px 0; border-bottom: 1px solid #f0ede9; font-size: 14px; }
  .info-table td:first-child { color: #6b6560; width: 45%; }
  .info-table td:last-child { font-weight: 500; }
  .total-row td { border-bottom: none; font-size: 16px; padding-top: 14px; }
  .cta { display: inline-block; margin: 24px 0 8px; padding: 12px 28px; background: #1a1a1a; color: #ffffff; text-decoration: none; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; }
  .footer { padding: 20px 32px; border-top: 1px solid #f0ede9; font-size: 12px; color: #9e9890; text-align: center; line-height: 1.6; }
  .badge { display: inline-block; padding: 4px 10px; background: #f0ede9; font-size: 11px; letter-spacing: 0.05em; text-transform: uppercase; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header"><h1>Monocactus</h1></div>
  <div class="content">${body}</div>
  <div class="footer">
    Monocactus El Yapımı Seramik Koleksiyonu<br>
    Bu e-posta, hesabınızdaki sipariş işlemlerine ilişkin sistem bildirimidir.<br>
    Soru için <a href="mailto:info@monocactus.com" style="color:#6b6560;">info@monocactus.com</a> adresine yazabilirsiniz.
  </div>
</div>
</body>
</html>`;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

// --------------------------------------------------------------------------
// Template: order_received  (alias: order_confirmed)
// --------------------------------------------------------------------------
function renderOrderReceived(p: Record<string, unknown>): RenderedEmail {
  const orderNumber = escapeHtml(p['order_number']);
  const totalMinor = Number(p['total_minor'] ?? 0);
  const currency = String(p['currency'] ?? 'TRY');
  const total = formatMoney(totalMinor, currency);

  const subject = `Siparişiniz Alındı — ${orderNumber}`;

  const html = baseLayout(subject, `
    <h2>Siparişiniz Alındı ✓</h2>
    <p style="color:#6b6560;font-size:14px;">Ödemeniz başarıyla alındı. Siparişiniz hazırlanmaya başlayacaktır.</p>
    <table class="info-table">
      <tr><td>Sipariş No</td><td>#${orderNumber}</td></tr>
      <tr><td>Toplam Tutar</td><td>${escapeHtml(total)}</td></tr>
    </table>
    <p style="font-size:14px;">Sipariş durumunuzu hesabınızdan takip edebilirsiniz.</p>
    <a href="https://shop.monocactus.com/account/orders" class="cta">Siparişlerimi Görüntüle</a>
  `);

  const text = `Siparişiniz Alındı\n\nSipariş No: #${orderNumber}\nToplam: ${total}\n\nhttps://shop.monocactus.com/account/orders`;

  return { subject, html, text };
}

// --------------------------------------------------------------------------
// Template: payment_confirmed
// --------------------------------------------------------------------------
function renderPaymentConfirmed(p: Record<string, unknown>): RenderedEmail {
  const orderNumber = escapeHtml(p['order_number']);
  const totalMinor = Number(p['total_minor'] ?? 0);
  const currency = String(p['currency'] ?? 'TRY');
  const total = formatMoney(totalMinor, currency);

  const subject = `Ödemeniz Onaylandı — ${orderNumber}`;

  const html = baseLayout(subject, `
    <h2>Ödemeniz Onaylandı ✓</h2>
    <p style="color:#6b6560;font-size:14px;">Ödemeniz başarıyla doğrulandı.</p>
    <table class="info-table">
      <tr><td>Sipariş No</td><td>#${orderNumber}</td></tr>
      <tr><td>Ödenen Tutar</td><td>${escapeHtml(total)}</td></tr>
    </table>
    <a href="https://shop.monocactus.com/account/orders" class="cta">Siparişlerimi Görüntüle</a>
  `);

  const text = `Ödemeniz Onaylandı\n\nSipariş No: #${orderNumber}\nÖdenen Tutar: ${total}\n\nhttps://shop.monocactus.com/account/orders`;

  return { subject, html, text };
}

// --------------------------------------------------------------------------
// Template: payment_failed
// --------------------------------------------------------------------------
function renderPaymentFailed(p: Record<string, unknown>): RenderedEmail {
  const orderNumber = escapeHtml(p['order_number']);

  const subject = `Ödeme Başarısız — ${orderNumber}`;

  const html = baseLayout(subject, `
    <h2>Ödeme İşlemi Başarısız</h2>
    <p style="color:#6b6560;font-size:14px;">Sipariş <strong>#${orderNumber}</strong> için ödeme alınamadı. Lütfen ödeme yönteminizi kontrol edin ve tekrar deneyin.</p>
    <a href="https://shop.monocactus.com/cart" class="cta">Tekrar Dene</a>
  `);

  const text = `Ödeme Başarısız\n\nSipariş No: #${orderNumber}\nÖdeme alınamadı. Lütfen tekrar deneyin.\n\nhttps://shop.monocactus.com/cart`;

  return { subject, html, text };
}

// --------------------------------------------------------------------------
// Template: order_processing
// --------------------------------------------------------------------------
function renderOrderProcessing(p: Record<string, unknown>): RenderedEmail {
  const orderNumber = escapeHtml(p['order_number']);

  const subject = `Siparişiniz Hazırlanıyor — ${orderNumber}`;

  const html = baseLayout(subject, `
    <h2>Siparişiniz Hazırlanıyor</h2>
    <p style="color:#6b6560;font-size:14px;">Sipariş <strong>#${orderNumber}</strong> üretim/paketleme aşamasına alınmıştır. Kargoya verildiğinde bilgilendirme yapacağız.</p>
    <a href="https://shop.monocactus.com/account/orders" class="cta">Siparişimi Takip Et</a>
  `);

  const text = `Siparişiniz Hazırlanıyor\n\nSipariş No: #${orderNumber}\nSiparişiniz hazırlanmaktadır.\n\nhttps://shop.monocactus.com/account/orders`;

  return { subject, html, text };
}

// --------------------------------------------------------------------------
// Template: order_shipped
// --------------------------------------------------------------------------
function renderOrderShipped(p: Record<string, unknown>): RenderedEmail {
  const orderNumber = escapeHtml(p['order_number']);
  const carrier = escapeHtml(p['carrier']);
  const trackingNumber = escapeHtml(p['tracking_number']);
  const trackingUrl = p['tracking_url'] ? String(p['tracking_url']) : null;

  const subject = `Siparişiniz Kargoya Verildi — ${orderNumber}`;

  const trackingBlock = trackingUrl
    ? `<a href="${sanitizeUrl(trackingUrl)}" class="cta">Kargo Takip Et</a>`
    : `<span class="badge">${carrier} — ${trackingNumber}</span>`;

  const html = baseLayout(subject, `
    <h2>Siparişiniz Kargoya Verildi ✓</h2>
    <p style="color:#6b6560;font-size:14px;">Sipariş <strong>#${orderNumber}</strong> kargoya teslim edildi.</p>
    <table class="info-table">
      <tr><td>Kargo Firması</td><td>${carrier}</td></tr>
      <tr><td>Takip Numarası</td><td>${trackingNumber}</td></tr>
    </table>
    ${trackingBlock}
  `);

  const trackingLine = trackingUrl
    ? `Takip: ${trackingUrl}`
    : `${carrier} — ${trackingNumber}`;

  const text = `Siparişiniz Kargoya Verildi\n\nSipariş No: #${orderNumber}\n${trackingLine}\n\nhttps://shop.monocactus.com/account/orders`;

  return { subject, html, text };
}

// --------------------------------------------------------------------------
// Template: order_delivered
// --------------------------------------------------------------------------
function renderOrderDelivered(p: Record<string, unknown>): RenderedEmail {
  const orderNumber = escapeHtml(p['order_number']);

  const subject = `Siparişiniz Teslim Edildi — ${orderNumber}`;

  const html = baseLayout(subject, `
    <h2>Siparişiniz Teslim Edildi ✓</h2>
    <p style="color:#6b6560;font-size:14px;">Sipariş <strong>#${orderNumber}</strong> teslim edildi. Umarız beğenirsiniz!</p>
    <p style="font-size:14px;">Deneyiminizi paylaşmak ister misiniz? Yorumunuz bizim için çok değerli.</p>
    <a href="https://shop.monocactus.com/account/orders" class="cta">Siparişlerimi Görüntüle</a>
  `);

  const text = `Siparişiniz Teslim Edildi\n\nSipariş No: #${orderNumber}\nSiparişiniz teslim edildi. Umarız beğenirsiniz!\n\nhttps://shop.monocactus.com/account/orders`;

  return { subject, html, text };
}

// --------------------------------------------------------------------------
// Template: refund_confirmed  (alias: order_refunded)
// --------------------------------------------------------------------------
function renderRefundConfirmed(p: Record<string, unknown>): RenderedEmail {
  const orderNumber = escapeHtml(p['order_number']);
  const refundMinor = Number(p['refund_amount_minor'] ?? 0);
  const currency = String(p['currency'] ?? 'TRY');
  const amount = formatMoney(refundMinor, currency);

  const subject = `İade Onaylandı — ${orderNumber}`;

  const html = baseLayout(subject, `
    <h2>İade İşleminiz Onaylandı ✓</h2>
    <p style="color:#6b6560;font-size:14px;">Sipariş <strong>#${orderNumber}</strong> için iade talebiniz onaylandı.</p>
    <table class="info-table">
      <tr><td>İade Tutarı</td><td>${escapeHtml(amount)}</td></tr>
      <tr><td>Sipariş No</td><td>#${orderNumber}</td></tr>
    </table>
    <p style="font-size:14px;color:#6b6560;">İade tutarı bankanızın işlem süresine göre 3–10 iş günü içinde hesabınıza yansıyacaktır.</p>
  `);

  const text = `İade Onaylandı\n\nSipariş No: #${orderNumber}\nİade Tutarı: ${amount}\n\nİade 3-10 iş günü içinde hesabınıza geçecektir.`;

  return { subject, html, text };
}

// --------------------------------------------------------------------------
// Dispatcher
// --------------------------------------------------------------------------
const TEMPLATE_MAP: Record<string, (p: Record<string, unknown>) => RenderedEmail> = {
  order_received: renderOrderReceived,
  order_confirmed: renderOrderReceived, // alias used by paytr-callback
  payment_confirmed: renderPaymentConfirmed,
  payment_failed: renderPaymentFailed,
  order_processing: renderOrderProcessing,
  order_shipped: renderOrderShipped,
  order_delivered: renderOrderDelivered,
  refund_confirmed: renderRefundConfirmed,
  order_refunded: renderRefundConfirmed, // alias used by finalize_admin_refund
};

export function renderTemplate(
  templateKey: string,
  payload: Record<string, unknown>
): RenderedEmail {
  const renderer = TEMPLATE_MAP[templateKey];
  if (!renderer) {
    // Fallback for unknown templates
    return {
      subject: `Monocactus — Bildirim`,
      html: `<p>Siparişinizle ilgili bir güncelleme mevcut.</p>`,
      text: `Monocactus — Siparişinizle ilgili bir güncelleme mevcut.`,
    };
  }
  return renderer(payload);
}
