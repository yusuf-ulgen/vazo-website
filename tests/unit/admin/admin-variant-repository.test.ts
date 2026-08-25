import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminVariantRepository } from '@/admin/variants/api/admin-variant-repository';
import * as supabaseModule from '@/shared/lib/supabase';
import { createMockSupabaseClient } from '../../mocks/supabase-mock';

const mockVariantRow = {
  id: 'var-1',
  product_id: 'prod-1',
  sku: 'VAZO-ANF-01',
  variant_name: 'Mat Antrasit - Standart',
  color_name: 'Antrasit',
  color_hex: '#2D3134',
  finish: 'Mat Sırlı',
  size_label: 'Standart',
  height_cm: 28.5,
  diameter_cm: 18.0,
  width_cm: 18.0,
  depth_cm: 18.0,
  weight_kg: 2.1,
  retail_price: 2450.0,
  compare_at_price: 2800.0,
  stock_quantity: 12,
  is_available_for_retail: true,
  is_available_for_wholesale: true,
  image_url: null,
  sort_order: 0,
  active: true,
  created_at: '2026-08-20T10:00:00Z',
  updated_at: '2026-08-20T10:00:00Z',
  products: {
    name: 'Anfora Heykelsi Vazo',
    slug: 'anfora-heykelsi-vazo',
  },
};

describe('adminVariantRepository (Phase 2.6)', () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockSupabaseClient();
    vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);
    vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
  });

  it('getVariantsByProductId returns correctly mapped variant objects', async () => {
    mockClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [mockVariantRow],
            error: null,
          }),
        }),
      }),
    } as never);

    const variants = await adminVariantRepository.getVariantsByProductId('prod-1');

    expect(variants).toHaveLength(1);
    expect(variants[0].sku).toBe('VAZO-ANF-01');
    expect(variants[0].size_label).toBe('Standart');
    expect(variants[0].width_cm).toBe(18.0);
    expect(variants[0].depth_cm).toBe(18.0);
    expect(variants[0].retail_price).toBe(2450.0);
    expect(variants[0].stock_quantity).toBe(12);
  });

  it('createVariant validates required fields and inserts variant', async () => {
    mockClient.from.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { ...mockVariantRow, id: 'var-new' },
            error: null,
          }),
        }),
      }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { ...mockVariantRow, id: 'var-new' },
            error: null,
          }),
        }),
      }),
    } as never);

    const created = await adminVariantRepository.createVariant({
      product_id: 'prod-1',
      sku: 'VAZO-ANF-02',
      variant_name: 'Kumlu Bej - Büyük Boy',
      color_name: 'Kumlu Bej',
      size_label: 'L',
      width_cm: 20,
      depth_cm: 20,
      retail_price: 3200,
      stock_quantity: 8,
    });

    expect(created).toBeDefined();
  });

  it('createVariant rejects negative prices and negative stock', async () => {
    await expect(
      adminVariantRepository.createVariant({
        product_id: 'prod-1',
        sku: 'VAZO-TEST',
        variant_name: 'Test',
        color_name: 'Test',
        retail_price: -100,
      })
    ).rejects.toThrow('Perakende fiyatı negatif olamaz.');

    await expect(
      adminVariantRepository.createVariant({
        product_id: 'prod-1',
        sku: 'VAZO-TEST',
        variant_name: 'Test',
        color_name: 'Test',
        retail_price: 100,
        stock_quantity: -5,
      })
    ).rejects.toThrow('Stok miktarı negatif olamaz.');
  });

  it('createVariant handles duplicate SKU database error with clear message', async () => {
    mockClient.from.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: '23505', message: 'duplicate key value violates unique constraint' },
          }),
        }),
      }),
    } as never);

    await expect(
      adminVariantRepository.createVariant({
        product_id: 'prod-1',
        sku: 'VAZO-ANF-01',
        variant_name: 'Mat Antrasit',
        color_name: 'Antrasit',
        retail_price: 2450,
      })
    ).rejects.toThrow('VAZO-ANF-01" SKU koduna sahip bir varyant zaten mevcut.');
  });

  it('updateVariantStock updates stock quantity and denies negative stock', async () => {
    mockClient.from.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { ...mockVariantRow, stock_quantity: 25 },
            error: null,
          }),
        }),
      }),
    } as never);

    await expect(adminVariantRepository.updateVariantStock('var-1', -1)).rejects.toThrow(
      'Stok miktarı negatif olamaz.'
    );

    const updated = await adminVariantRepository.updateVariantStock('var-1', 25);
    expect(updated.stock_quantity).toBe(25);
  });

  it('deleteVariant deletes variant', async () => {
    mockClient.from.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    } as never);

    await expect(adminVariantRepository.deleteVariant('var-1')).resolves.not.toThrow();
  });
});
