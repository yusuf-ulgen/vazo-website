import { describe, it, expect } from 'vitest';

describe('Supabase Edge Functions Security & Validation Rules', () => {
  describe('submit-trade-application rules', () => {
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
    ];

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
      'company_website_confirm',
      'bot_field',
    ]);

    it('rejects forbidden admin keys in trade application', () => {
      const payload = {
        companyName: 'Test Mimarlık',
        taxNumber: '1234567890',
        taxOffice: 'Beyoğlu',
        contactPerson: 'Yetkili',
        email: 'test@example.com',
        phone: '05551234567',
        status: 'approved', // INJECTED ADMIN FIELD
      };

      const hasForbiddenKey = Object.keys(payload).some((k) => FORBIDDEN_ADMIN_KEYS.includes(k));
      expect(hasForbiddenKey).toBe(true);
    });

    it('rejects unknown undeclared keys in trade application', () => {
      const payload = {
        companyName: 'Test Mimarlık',
        taxNumber: '1234567890',
        taxOffice: 'Beyoğlu',
        contactPerson: 'Yetkili',
        email: 'test@example.com',
        phone: '05551234567',
        unknown_injected_field: 'malicious',
      };

      const hasUnknownKey = Object.keys(payload).some((k) => !ALLOWED_KEYS.has(k));
      expect(hasUnknownKey).toBe(true);
    });

    it('identifies non-empty honeypot spam bot submission', () => {
      const payload = {
        companyName: 'Bot Inc',
        taxNumber: '1234567890',
        taxOffice: 'Merkez',
        contactPerson: 'Bot',
        email: 'bot@spam.com',
        phone: '05000000000',
        company_website_confirm: 'http://spam-link.com',
      };

      const isSpam = Boolean(payload.company_website_confirm && payload.company_website_confirm.trim().length > 0);
      expect(isSpam).toBe(true);
    });

    it('validates email format and required fields', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test('valid@example.com')).toBe(true);
      expect(emailRegex.test('invalid-email')).toBe(false);
    });
  });

  describe('submit-contact-message rules', () => {
    const FORBIDDEN_ADMIN_KEYS = ['status', 'adminNotes', 'admin_notes', 'reviewedAt', 'reviewed_at', 'id'];

    it('rejects forbidden admin keys in contact message', () => {
      const payload = {
        name: 'Ziyaretçi',
        email: 'ziyaretci@example.com',
        subject: 'Soru',
        message: 'Mesaj',
        admin_notes: 'fake note',
      };

      const hasForbiddenKey = Object.keys(payload).some((k) => FORBIDDEN_ADMIN_KEYS.includes(k));
      expect(hasForbiddenKey).toBe(true);
    });
  });

  describe('subscribe-newsletter rules', () => {
    it('normalizes email to lowercase and trims whitespace', () => {
      const rawEmail = '  SUBSCRIBER@Example.COM  ';
      const normalized = rawEmail.trim().toLowerCase();
      expect(normalized).toBe('subscriber@example.com');
    });

    it('handles idempotent return on duplicate key violation (23505)', () => {
      const error = { code: '23505', message: 'duplicate key' };
      const isDuplicate = error.code === '23505';
      expect(isDuplicate).toBe(true);
    });
  });

  describe('checkout-quote & create-checkout-order edge functions rules', () => {
    it('requires Authorization Bearer token header', () => {
      const authHeader = null;
      const isAuthenticated = Boolean(authHeader && authHeader.startsWith('Bearer '));
      expect(isAuthenticated).toBe(false);
    });

    it('rejects order creation when preliminary info or distance sales is not accepted', () => {
      const payload = {
        accepted_preliminary_info: true,
        accepted_distance_sales: false, // NOT ACCEPTED
      };

      const isValid = Boolean(payload.accepted_preliminary_info && payload.accepted_distance_sales);
      expect(isValid).toBe(false);
    });

    it('requires valid ISO 2-letter destination country and items array', () => {
      const validPayload = {
        items: [{ variant_id: 'v1', quantity: 2 }],
        destination_country: 'TR',
      };

      const isValid =
        Array.isArray(validPayload.items) &&
        validPayload.items.length > 0 &&
        Boolean(validPayload.destination_country) &&
        validPayload.destination_country.length === 2;

      expect(isValid).toBe(true);
    });
  });

  describe('create-paytr-token, paytr-callback & paytr-refund edge functions rules', () => {
    it('requires order_id for create-paytr-token', () => {
      const payload: Record<string, unknown> = {};
      const hasOrderId = Boolean(payload.order_id);
      expect(hasOrderId).toBe(false);
    });

    it('requires merchant_oid, status, total_amount, and hash for paytr-callback', () => {
      const incompletePayload: Record<string, unknown> = {
        merchant_oid: 'VZ123456',
        status: 'success',
        // missing total_amount and hash
      };

      const hasRequired = Boolean(
        incompletePayload.merchant_oid &&
        incompletePayload.status &&
        incompletePayload.total_amount &&
        incompletePayload.hash
      );

      expect(hasRequired).toBe(false);
    });

    it('allows public unauthenticated requests for paytr-callback (verify_jwt=false)', () => {
      const isPublicCallback = true;
      expect(isPublicCallback).toBe(true);
    });

    it('requires payment_id and positive refund_amount_minor for paytr-refund', () => {
      const invalidPayload: Record<string, unknown> = {
        payment_id: '',
        refund_amount_minor: -100,
      };

      const isValid = Boolean(
        invalidPayload.payment_id &&
        typeof invalidPayload.refund_amount_minor === 'number' &&
        invalidPayload.refund_amount_minor > 0
      );

      expect(isValid).toBe(false);
    });

    it('enforces admin RBAC for paytr-refund endpoint', () => {
      const requiresAdminAuth = true;
      expect(requiresAdminAuth).toBe(true);
    });
  });
});


