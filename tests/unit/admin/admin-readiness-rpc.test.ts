import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminSettingsRepository } from '@/admin/settings/api/admin-settings-repository';
import { supabase } from '@/shared/lib/supabase';

describe('Admin Checkout Readiness & Safe Activation (Phase 3.10)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns boolean readiness flags without leaking secrets', async () => {
    const mockRpcResponse = {
      seller_legal_complete: true,
      checkout_enabled: false,
      has_active_shipping: true,
      paytr_secrets_present: true,
      gmail_secrets_present: true,
      seller_fields_summary: {
        business_type: true,
        owner_full_name: true,
        legal_trade_title: true,
        tax_office: true,
        tax_number: true,
        registered_address: true,
        kep_address: true,
        business_email: true,
        business_phone: true,
        mersis_number: false,
      },
    };

    if (supabase) {
      vi.spyOn(supabase, 'rpc').mockResolvedValue({
        data: mockRpcResponse,
        error: null,
      } as unknown as ReturnType<typeof supabase.rpc>);

      vi.spyOn(supabase.functions, 'invoke').mockResolvedValue({
        data: mockRpcResponse,
        error: null,
      });
    }

    const readiness = await adminSettingsRepository.getCheckoutReadiness();

    // Verify boolean types
    expect(typeof readiness.seller_legal_complete).toBe('boolean');
    expect(typeof readiness.checkout_enabled).toBe('boolean');
    expect(typeof readiness.has_active_shipping).toBe('boolean');
    expect(typeof readiness.paytr_secrets_present).toBe('boolean');
    expect(typeof readiness.gmail_secrets_present).toBe('boolean');

    // Verify no secrets or sensitive keys leaked in the payload
    const payloadKeys = Object.keys(readiness);
    expect(payloadKeys).not.toContain('merchant_key');
    expect(payloadKeys).not.toContain('merchant_salt');
    expect(payloadKeys).not.toContain('app_password');
    expect(payloadKeys).not.toContain('service_role_key');
  });

  it('calls admin_enable_checkout RPC and returns result', async () => {
    if (supabase) {
      vi.spyOn(supabase, 'rpc').mockResolvedValue({
        data: { success: true },
        error: null,
      } as unknown as ReturnType<typeof supabase.rpc>);
    }

    const result = await adminSettingsRepository.setCheckoutEnabled(true);
    expect(result.success).toBe(true);
  });

  it('returns failure reason when activation fails conditions', async () => {
    if (supabase) {
      vi.spyOn(supabase, 'rpc').mockResolvedValue({
        data: {
          success: false,
          error: 'Ödeme açılmadan önce satıcı yasal bilgileri (9 zorunlu alan) ve en az 1 aktif kargo tarifesi tamamlanmalıdır.',
        },
        error: null,
      } as unknown as ReturnType<typeof supabase.rpc>);
    }

    const result = await adminSettingsRepository.setCheckoutEnabled(true);
    expect(result.success).toBe(false);
    expect(result.error).toContain('satıcı yasal bilgileri');
  });
});
