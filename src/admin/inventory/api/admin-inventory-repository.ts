import { requireAdminSupabase } from '@/admin/shared/api/require-admin-supabase';
import { adminAuditRepository } from '@/admin/audit/api/admin-audit-repository';
import type {
  AdminInventoryItem,
  AdminInventoryListParams,
  AdminInventoryListResult,
} from '../types';

interface RawVariantRow {
  id: string;
  product_id: string;
  sku: string;
  variant_name: string;
  color_name: string;
  color_hex?: string | null;
  size_label?: string | null;
  stock_quantity: number | string;
  retail_price: number | string;
  is_available_for_retail?: boolean;
  is_available_for_wholesale?: boolean;
  active?: boolean;
  updated_at: string;
  products?: { name: string; slug: string } | null;
}

export const adminInventoryRepository = {
  async getInventory(params: AdminInventoryListParams = {}): Promise<AdminInventoryListResult> {
    const client = requireAdminSupabase();
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, params.pageSize || 15);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = client
      .from('product_variants')
      .select('*, products(name, slug)', { count: 'exact' });

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      query = query.or(`sku.ilike.%${q}%,variant_name.ilike.%${q}%,color_name.ilike.%${q}%`);
    }

    if (params.stockFilter === 'low_stock') {
      query = query.lte('stock_quantity', 5).gt('stock_quantity', 0);
    } else if (params.stockFilter === 'out_of_stock') {
      query = query.eq('stock_quantity', 0);
    } else if (params.stockFilter === 'in_stock') {
      query = query.gt('stock_quantity', 0);
    }

    query = query.order('stock_quantity', { ascending: true }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('[adminInventoryRepository.getInventory] Error:', error);
      throw new Error(`Envanter listesi alınamadı: ${error.message}`);
    }

    // Also fetch high-level metrics across all variants
    const { data: allVariants } = await client
      .from('product_variants')
      .select('stock_quantity');

    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalUnits = 0;
    const totalVariants = allVariants?.length || 0;

    (allVariants || []).forEach((row) => {
      const qty = Number(row.stock_quantity) || 0;
      totalUnits += qty;
      if (qty === 0) {
        outOfStockCount++;
      } else if (qty <= 5) {
        lowStockCount++;
        inStockCount++;
      } else {
        inStockCount++;
      }
    });

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const items: AdminInventoryItem[] = ((data as unknown as RawVariantRow[]) || []).map((row) => ({
      id: row.id,
      product_id: row.product_id,
      product_name: row.products?.name || 'İsimsiz Ürün',
      product_slug: row.products?.slug || '',
      sku: row.sku,
      variant_name: row.variant_name,
      color_name: row.color_name,
      color_hex: row.color_hex || null,
      size_label: row.size_label || null,
      stock_quantity: Math.max(0, Number(row.stock_quantity) || 0),
      retail_price: Number(row.retail_price) || 0,
      is_available_for_retail: row.is_available_for_retail !== false,
      is_available_for_wholesale: row.is_available_for_wholesale !== false,
      active: row.active !== false,
      updated_at: row.updated_at,
    }));

    return {
      data: items,
      totalCount,
      page,
      pageSize,
      totalPages,
      metrics: {
        totalVariants,
        inStockCount,
        lowStockCount,
        outOfStockCount,
        totalUnits,
      },
    };
  },

  async updateStock(
    variantId: string,
    newStockQuantity: number,
    reason?: string,
    previousStockQuantity?: number
  ): Promise<void> {
    if (newStockQuantity < 0 || isNaN(newStockQuantity)) {
      throw new Error('Stok adedi negatif olamaz.');
    }

    const client = requireAdminSupabase();
    const qty = Math.floor(newStockQuantity);

    const { data: updatedVariant, error } = await client
      .from('product_variants')
      .update({
        stock_quantity: qty,
        updated_at: new Date().toISOString(),
      })
      .eq('id', variantId)
      .select('id, sku, variant_name')
      .single();

    if (error) {
      console.error('[adminInventoryRepository.updateStock] Error:', error);
      throw new Error(`Stok güncellenemedi: ${error.message}`);
    }

    if (reason && updatedVariant) {
      await adminAuditRepository.logAuditEvent(
        'UPDATE',
        'inventory',
        variantId,
        `${updatedVariant.sku} (${updatedVariant.variant_name})`,
        {
          previous_stock: previousStockQuantity ?? null,
          new_stock: qty,
          reason: reason.trim(),
        }
      ).catch((auditErr) => {
        console.warn('[adminInventoryRepository.updateStock] Audit log warning:', auditErr);
      });
    }
  },
};
