import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminPricingRepository } from '@/admin/pricing/api/admin-pricing-repository';
import * as supabaseModule from '@/shared/lib/supabase';
import { createMockSupabaseClient } from '../../mocks/supabase-mock';

const mockProductPricingData = [
  {
    id: 'prod-1',
    name: 'Anfora Heykelsi Vazo',
    slug: 'anfora-heykelsi-vazo',
    primary_category_id: 'cat-1',
    retail_price: 2450,
    compare_at_price: 2900,
    retail_enabled: true,
    wholesale_enabled: true,
    updated_at: '2026-08-20T10:00:00Z',
    categories: { name: 'Masa Üstü' },
    product_variants: [
      {
        id: 'var-1',
        sku: 'VAZO-ANF-01',
        variant_name: 'Mat Antrasit',
        retail_price: 2450,
        compare_at_price: 2900,
        is_available_for_retail: true,
        is_available_for_wholesale: true,
        updated_at: '2026-08-20T10:00:00Z',
      },
    ],
  },
];

describe('adminPricingRepository (Phase 2.6)', () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockSupabaseClient();
    vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);
    vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
  });

  it('getPricingList flattens products and variants into pricing items', async () => {
    mockClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({
            data: mockProductPricingData,
            count: 1,
            error: null,
          }),
        }),
      }),
    } as never);

    const result = await adminPricingRepository.getPricingList({ page: 1, pageSize: 10 });

    expect(result.data).toHaveLength(2); // 1 product + 1 variant
    expect(result.data[0].type).toBe('product');
    expect(result.data[0].retailPrice).toBe(2450);
    expect(result.data[1].type).toBe('variant');
    expect(result.data[1].sku).toBe('VAZO-ANF-01');
  });

  it('updatePrice updates retail and compare price and rejects invalid inputs', async () => {
    mockClient.from.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    } as never);

    // Negative price
    await expect(
      adminPricingRepository.updatePrice({
        id: 'prod-1',
        type: 'product',
        retailPrice: -50,
      })
    ).rejects.toThrow('Fiyat negatif olamaz.');

    // Compare price lower than retail price
    await expect(
      adminPricingRepository.updatePrice({
        id: 'prod-1',
        type: 'product',
        retailPrice: 2000,
        compareAtPrice: 1500,
      })
    ).rejects.toThrow('Eski fiyat (indirim öncesi) mevcut satış fiyatından düşük olamaz.');

    // Valid price
    await expect(
      adminPricingRepository.updatePrice({
        id: 'prod-1',
        type: 'product',
        retailPrice: 2200,
        compareAtPrice: 2600,
      })
    ).resolves.not.toThrow();
  });
});
