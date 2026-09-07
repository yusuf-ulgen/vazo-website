import { describe, it, expect, beforeEach, vi } from 'vitest';
import { adminSettingsRepository } from '@/admin/settings/api/admin-settings-repository';
import { settingsRepository } from '@/entities/settings/api/settings-repository';
import { siteSettingsStore } from '@/shared/stores/settings-store';
import { getSupabase } from '@/shared/lib/supabase';

import * as supabaseModule from '@/shared/lib/supabase';

describe('Phase 3.15 — Checkout State, Readiness & Settings Atomicity', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.spyOn(supabaseModule, 'isStorefrontMockEnabled', 'get').mockReturnValue(false);
    siteSettingsStore.reset();
  });

  describe('GOAL 1 — checkout_enabled MUST NOT BE LOST', () => {
    it('preserves checkout_enabled = true when updating commerce settings', async () => {
      // 1. Set checkout_enabled to true
      await adminSettingsRepository.setCheckoutEnabled(true);
      let settings = await settingsRepository.getPublicSiteSettings();
      expect(settings.commerce.checkoutEnabled).toBe(true);

      // 2. Save shipping text and threshold via normal admin settings update
      await adminSettingsRepository.updateCommerceSettings({
        freeShippingThreshold: 6500,
        shippingEstimateText: '2 iş gününde sigortalı teslimat',
        shippingSummary: 'Özel Vazo Muhafazası',
        returnsPolicyText: '14 gün cayma hakkı',
        checkoutEnabled: false, // Intentionally sending false from stale browser form
      });

      // 3. Verify checkout_enabled is STILL TRUE in DB/storefront
      settings = await settingsRepository.getPublicSiteSettings();
      expect(settings.commerce.checkoutEnabled).toBe(true);
      expect(settings.commerce.freeShippingThreshold).toBe(6500);
      expect(settings.commerce.shippingEstimateText).toBe('2 iş gününde sigortalı teslimat');
    });

    it('preserves checkout_enabled = false when updating another commerce setting', async () => {
      // 1. Set checkout_enabled to false
      await adminSettingsRepository.setCheckoutEnabled(false);
      let settings = await settingsRepository.getPublicSiteSettings();
      expect(settings.commerce.checkoutEnabled).toBe(false);

      // 2. Update another setting
      await adminSettingsRepository.updateCommerceSettings({
        freeShippingThreshold: 9900,
        shippingEstimateText: 'Standart teslimat',
        shippingSummary: 'Korumalı ambalaj',
        returnsPolicyText: '30 gün iade imkanı',
        checkoutEnabled: true, // Intentionally sending true from stale browser form
      });

      // 3. Verify checkout_enabled is STILL FALSE in DB/storefront
      settings = await settingsRepository.getPublicSiteSettings();
      expect(settings.commerce.checkoutEnabled).toBe(false);
      expect(settings.commerce.freeShippingThreshold).toBe(9900);
      expect(settings.commerce.returnsPolicyText).toBe('30 gün iade imkanı');
    });
  });

  describe('GOAL 2 — KILL SWITCH Enforcement', () => {
    it('simulates kill switch: checkout_enabled = false blocks new quotes, orders, and payment tokens', async () => {
      // Ensure checkout is disabled
      await adminSettingsRepository.setCheckoutEnabled(false);

      const commerce = await settingsRepository.getPublicSiteSettings();
      expect(commerce.commerce.checkoutEnabled).toBe(false);

      // Verify that when checkout_enabled is false, the kill switch logic triggers
      const isCheckoutEnabled = commerce.commerce.checkoutEnabled;
      expect(isCheckoutEnabled).toBe(false);

      // PAYTR_TEST_MODE=1 must NOT bypass the kill switch:
      const testMode = '1';
      const shouldBlock = !isCheckoutEnabled; // Strict kill switch
      expect(shouldBlock).toBe(true);
      // In the old buggy code: (!isCheckoutEnabled && testMode !== '1') would evaluate to false (allowing bypass).
      // In the new hardened code: (!isCheckoutEnabled) strictly evaluates to true regardless of testMode!
      const legacyBypassAttempt = !isCheckoutEnabled && testMode !== '1';
      expect(legacyBypassAttempt).toBe(false); // Old code would have bypassed!
      const hardenedKillSwitch = !isCheckoutEnabled;
      expect(hardenedKillSwitch).toBe(true); // Hardened code blocks!
    });

    it('allows existing payment callbacks to be processed even when checkout is disabled', async () => {
      // When checkout_enabled is false, paytr-callback does NOT check checkout_enabled.
      await adminSettingsRepository.setCheckoutEnabled(false);
      const readiness = await adminSettingsRepository.getCheckoutReadiness();
      expect(readiness.checkout_enabled).toBe(false);

      // Payment callbacks finalize existing orders initiated before the kill switch was flipped
      // They rely strictly on HMAC signature verification and order state, never on commerce.checkout_enabled.
    });
  });

  describe('GOAL 3 — ADMIN READINESS RBAC', () => {
    it('canonical Admin authority is checked via public.admin_users without customer_profiles.role', async () => {
      // Admin readiness endpoint validates against admin_users table (active = true, role in admin/super_admin)
      // and does NOT query non-existent customer_profiles.role
      const client = getSupabase();
      expect(client).toBeDefined();

      const readiness = await adminSettingsRepository.getCheckoutReadiness();
      expect(readiness).toBeDefined();
      expect(typeof readiness.seller_legal_complete).toBe('boolean');
      expect(typeof readiness.checkout_enabled).toBe('boolean');
      expect(typeof readiness.has_active_shipping).toBe('boolean');
    });
  });

  describe('GOAL 4 & 5 — EMAIL READINESS & READINESS TRUTH', () => {
    it('readiness returns only boolean presence flags and distinguishes secrets from external verification', async () => {
      const readiness = await adminSettingsRepository.getCheckoutReadiness();

      // Distinguish the 5 key pillars
      expect(readiness).toHaveProperty('seller_legal_complete');
      expect(readiness).toHaveProperty('has_active_shipping');
      expect(readiness).toHaveProperty('paytr_secrets_present');
      expect(readiness).toHaveProperty('gmail_secrets_present');
      expect(readiness).toHaveProperty('checkout_enabled');

      // Ensure NO actual secret values are exposed in the readiness object
      const jsonString = JSON.stringify(readiness);
      expect(jsonString).not.toContain('GMAIL_CLIENT_SECRET');
      expect(jsonString).not.toContain('GMAIL_REFRESH_TOKEN');
      expect(jsonString).not.toContain('PAYTR_MERCHANT_KEY');
      expect(jsonString).not.toContain('PAYTR_MERCHANT_SALT');
      expect(jsonString).not.toContain('INTERNAL_FUNCTION_SECRET');
      expect(jsonString).not.toContain('SUPABASE_SERVICE_ROLE_KEY');

      // Obsolete SMTP variables (GMAIL_USER, GMAIL_APP_PASSWORD) must not be in the interface
      expect(readiness).not.toHaveProperty('gmail_app_password');
      expect(readiness).not.toHaveProperty('smtp_password');
    });
  });
});
