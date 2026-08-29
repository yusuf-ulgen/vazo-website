import { describe, it, expect } from 'vitest';
import { escapeHtml, renderTemplate } from '../../../supabase/functions/_shared/email-templates';

// ---------------------------------------------------------------------------
// escapeHtml
// ---------------------------------------------------------------------------

describe('escapeHtml', () => {
  it('escapes ampersand', () => {
    expect(escapeHtml('Cats & Dogs')).toBe('Cats &amp; Dogs');
  });

  it('escapes less-than and greater-than', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;'
    );
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#x27;s');
  });

  it('returns empty string for null', () => {
    expect(escapeHtml(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(escapeHtml(undefined)).toBe('');
  });

  it('handles numeric values safely', () => {
    expect(escapeHtml(42)).toBe('42');
  });
});

// ---------------------------------------------------------------------------
// renderTemplate — order_confirmed
// ---------------------------------------------------------------------------

describe('renderTemplate: order_confirmed', () => {
  const payload = {
    order_number: 'MN-2026-001',
    total_minor: 15000,
    currency: 'TRY',
  };

  it('returns a subject containing the order number', () => {
    const { subject } = renderTemplate('order_confirmed', payload);
    expect(subject).toContain('MN-2026-001');
  });

  it('HTML contains order number (escaped)', () => {
    const { html } = renderTemplate('order_confirmed', payload);
    expect(html).toContain('MN-2026-001');
  });

  it('HTML contains formatted total', () => {
    const { html } = renderTemplate('order_confirmed', payload);
    // 15000 minor = 150.00 TRY → "150,00 ₺"
    expect(html).toContain('150,00');
  });

  it('plain text contains order number', () => {
    const { text } = renderTemplate('order_confirmed', payload);
    expect(text).toContain('MN-2026-001');
  });

  it('HTML does NOT contain raw script tags (XSS guard)', () => {
    const xssPayload = {
      order_number: '<script>alert(1)</script>',
      total_minor: 0,
      currency: 'TRY',
    };
    const { html } = renderTemplate('order_confirmed', xssPayload);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('order_received alias produces same subject pattern', () => {
    const { subject } = renderTemplate('order_received', payload);
    expect(subject).toContain('MN-2026-001');
  });
});

// ---------------------------------------------------------------------------
// renderTemplate — order_shipped
// ---------------------------------------------------------------------------

describe('renderTemplate: order_shipped', () => {
  const payload = {
    order_number: 'MN-2026-002',
    carrier: 'Yurtiçi Kargo',
    tracking_number: '123456789',
    tracking_url: 'https://tracking.yurtici.com.tr/?code=123456789',
  };

  it('subject contains order number', () => {
    const { subject } = renderTemplate('order_shipped', payload);
    expect(subject).toContain('MN-2026-002');
  });

  it('HTML contains carrier name (escaped)', () => {
    const { html } = renderTemplate('order_shipped', payload);
    expect(html).toContain('Yurtiçi Kargo');
  });

  it('HTML contains tracking number', () => {
    const { html } = renderTemplate('order_shipped', payload);
    expect(html).toContain('123456789');
  });

  it('HTML contains tracking URL link', () => {
    const { html } = renderTemplate('order_shipped', payload);
    expect(html).toContain('https://tracking.yurtici.com.tr');
  });

  it('escapes malicious tracking URL', () => {
    const xssPayload = {
      order_number: 'MN-X',
      carrier: 'Test',
      tracking_number: 'T123',
      tracking_url: 'javascript:alert(1)',
    };
    const { html } = renderTemplate('order_shipped', xssPayload);
    // The URL will be escaped in the href attribute
    expect(html).not.toContain('javascript:alert(1)');
  });

  it('plain text contains tracking URL', () => {
    const { text } = renderTemplate('order_shipped', payload);
    expect(text).toContain('https://tracking.yurtici.com.tr');
  });
});

// ---------------------------------------------------------------------------
// renderTemplate — refund_confirmed
// ---------------------------------------------------------------------------

describe('renderTemplate: refund_confirmed', () => {
  const payload = {
    order_number: 'MN-2026-003',
    refund_amount_minor: 7500,
    currency: 'TRY',
  };

  it('subject contains order number', () => {
    const { subject } = renderTemplate('refund_confirmed', payload);
    expect(subject).toContain('MN-2026-003');
  });

  it('HTML contains formatted refund amount', () => {
    const { html } = renderTemplate('refund_confirmed', payload);
    expect(html).toContain('75,00');
  });

  it('order_refunded alias works', () => {
    const { subject } = renderTemplate('order_refunded', payload);
    expect(subject).toContain('MN-2026-003');
  });
});

// ---------------------------------------------------------------------------
// renderTemplate — payment_failed
// ---------------------------------------------------------------------------

describe('renderTemplate: payment_failed', () => {
  it('subject contains order number', () => {
    const { subject } = renderTemplate('payment_failed', { order_number: 'MN-F001' });
    expect(subject).toContain('MN-F001');
  });

  it('HTML contains retry CTA', () => {
    const { html } = renderTemplate('payment_failed', { order_number: 'MN-F001' });
    expect(html).toContain('monocactus.com');
  });
});

// ---------------------------------------------------------------------------
// renderTemplate — unknown key fallback
// ---------------------------------------------------------------------------

describe('renderTemplate: unknown template key', () => {
  it('returns a safe fallback response', () => {
    const { subject, html, text } = renderTemplate('non_existent_key', {});
    expect(subject).toBeTruthy();
    expect(html).toBeTruthy();
    expect(text).toBeTruthy();
    expect(html).not.toContain('<script>');
  });
});
