import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminInventoryRepository } from '@/admin/inventory/api/admin-inventory-repository';
import * as supabaseModule from '@/shared/lib/supabase';
import { createMockSupabaseClient } from '../../mocks/supabase-mock';

const mockInventoryData = [
  {
    id: 'var-1',
    product_id: 'prod-1',
    sku: 'VAZO-ANF-01',
    variant_name: 'Mat Antrasit',
    color_name: 'Antrasit',
    stock_quantity: 12,
    retail_price: 2450,
    active: true,
    updated_at: '2026-08-20T10:00:00Z',
    products: { name: 'Anfora Vazo', slug: 'anfora-vazo' },
  },
  {
    id: 'var-2',
    product_id: 'prod-1',
    sku: 'VAZO-ANF-02',
    variant_name: 'Kumlu Bej',
    color_name: 'Bej',
    stock_quantity: 3, // low stock
    retail_price: 2450,
    active: true,
    updated_at: '2026-08-20T10:00:00Z',
    products: { name: 'Anfora Vazo', slug: 'anfora-vazo' },
  },
  {
    id: 'var-3',
    product_id: 'prod-2',
    sku: 'VAZO-MIN-01',
    variant_name: 'Ham Terracotta',
    color_name: 'Terracotta',
    stock_quantity: 0, // out of stock
    retail_price: 1850,
    active: true,
    updated_at: '2026-08-20T10:00:00Z',
    products: { name: 'Minimalist Vazo', slug: 'minimalist-vazo' },
  },
];

describe('adminInventoryRepository (Phase 2.6)', () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockSupabaseClient();
    vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);
    vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
  });

  it('getInventory returns inventory items and calculated metrics', async () => {
    let callCount = 0;
    mockClient.from.mockReturnValue({
      select: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Main query
          return {
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockInventoryData,
                count: 3,
                error: null,
              }),
            }),
          };
        }
        // Metrics query
        return Promise.resolve({
          data: [
            { stock_quantity: 12 },
            { stock_quantity: 3 },
            { stock_quantity: 0 },
          ],
          error: null,
        });
      }),
    } as never);

    const result = await adminInventoryRepository.getInventory({ page: 1, pageSize: 10 });

    expect(result.data).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.metrics.totalVariants).toBe(3);
    expect(result.metrics.totalUnits).toBe(15);
    expect(result.metrics.lowStockCount).toBe(1);
    expect(result.metrics.outOfStockCount).toBe(1);
  });

  it('updateStock calls adjust_inventory_stock RPC with optional reason', async () => {
    mockClient.rpc = vi.fn().mockResolvedValue({
      data: { variant_id: 'var-1', previous_stock: 12, new_stock: 25, reason: 'Sayım Düzeltmesi' },
      error: null,
    });

    await adminInventoryRepository.updateStock('var-1', 25, 'Sayım Düzeltmesi', 12);

    expect(mockClient.rpc).toHaveBeenCalledWith('adjust_inventory_stock', {
      p_variant_id: 'var-1',
      p_new_quantity: 25,
      p_reason: 'Sayım Düzeltmesi',
    });
  });

  it('updateStock denies negative stock before calling database', async () => {
    await expect(adminInventoryRepository.updateStock('var-1', -5)).rejects.toThrow(
      'Stok adedi negatif olamaz.'
    );
    expect(mockClient.rpc).not.toHaveBeenCalled();
  });
});
