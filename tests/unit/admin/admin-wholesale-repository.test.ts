import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminWholesaleRepository } from '@/admin/wholesale/api/admin-wholesale-repository';
import * as supabaseModule from '@/shared/lib/supabase';
import { createMockSupabaseClient } from '../../mocks/supabase-mock';

const mockTierRow = {
  id: 'tier-1',
  product_id: 'prod-1',
  variant_id: null,
  min_quantity: 10,
  max_quantity: 49,
  unit_price: 1850,
  discount_percentage: 25,
  active: true,
  created_at: '2026-08-20T10:00:00Z',
  products: { name: 'Anfora Heykelsi Vazo', slug: 'anfora-heykelsi-vazo' },
  product_variants: null,
};

describe('adminWholesaleRepository (Phase 2.6)', () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockSupabaseClient();
    vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);
    vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
  });

  it('getWholesaleTiers returns correctly mapped wholesale tiers', async () => {
    mockClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [mockTierRow],
          error: null,
        }),
      }),
    } as never);

    const tiers = await adminWholesaleRepository.getWholesaleTiers();

    expect(tiers).toHaveLength(1);
    expect(tiers[0].min_quantity).toBe(10);
    expect(tiers[0].max_quantity).toBe(49);
    expect(tiers[0].unit_price).toBe(1850);
  });

  it('createWholesaleTier validates quantities and prevents overlaps', async () => {
    mockClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockResolvedValue({
              data: [{ min_quantity: 10, max_quantity: 49 }],
              error: null,
            }),
          }),
        }),
      }),
    } as never);

    // Invalid min quantity
    await expect(
      adminWholesaleRepository.createWholesaleTier({
        product_id: 'prod-1',
        min_quantity: 0,
        unit_price: 1500,
      })
    ).rejects.toThrow('Minimum adet en az 1 olmalıdır.');

    // Overlapping tier interval (e.g. 20 to 60 overlaps with 10 to 49)
    await expect(
      adminWholesaleRepository.createWholesaleTier({
        product_id: 'prod-1',
        min_quantity: 20,
        max_quantity: 60,
        unit_price: 1600,
      })
    ).rejects.toThrow('çakışıyor');
  });

  it('updateProductWholesaleConfig validates MOQ and updates settings', async () => {
    mockClient.from.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    } as never);

    await expect(
      adminWholesaleRepository.updateProductWholesaleConfig('prod-1', {
        wholesale_enabled: true,
        wholesale_moq: 0,
      })
    ).rejects.toThrow('en az 1 olmalıdır.');

    await expect(
      adminWholesaleRepository.updateProductWholesaleConfig('prod-1', {
        wholesale_enabled: true,
        wholesale_moq: 15,
        wholesale_lead_time_days: 21,
      })
    ).resolves.not.toThrow();
  });

  it('deleteWholesaleTier deletes tier by ID', async () => {
    mockClient.from.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    } as never);

    await expect(adminWholesaleRepository.deleteWholesaleTier('tier-1')).resolves.not.toThrow();
  });
});
