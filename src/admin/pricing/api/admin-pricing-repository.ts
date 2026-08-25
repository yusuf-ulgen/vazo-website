import { supabase, isSupabaseConfigured } from '@/shared/lib/supabase';
import {
  AdminPricingItem,
  AdminPricingListParams,
  AdminPricingListResult,
  UpdatePriceInput,
} from '../types';

function getClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase client is not configured. Admin operations require active Supabase connection.');
  }
  return supabase;
}

interface RawCategoryRef {
  name: string;
}

interface RawVariantPricingRef {
  id: string;
  sku: string;
  variant_name: string;
  retail_price: number | string;
  compare_at_price?: number | string | null;
  is_available_for_retail?: boolean;
  is_available_for_wholesale?: boolean;
  updated_at: string;
}

interface RawProductPricingRow {
  id: string;
  name: string;
  slug: string;
  primary_category_id?: string | null;
  retail_price: number | string;
  compare_at_price?: number | string | null;
  retail_enabled?: boolean;
  wholesale_enabled?: boolean;
  updated_at: string;
  categories?: RawCategoryRef | null;
  product_variants?: RawVariantPricingRef[];
}

export const adminPricingRepository = {
  async getPricingList(params: AdminPricingListParams = {}): Promise<AdminPricingListResult> {
    const client = getClient();
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, params.pageSize || 15);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = client
      .from('products')
      .select('id, name, slug, primary_category_id, retail_price, compare_at_price, retail_enabled, wholesale_enabled, updated_at, categories:primary_category_id(name), product_variants(id, sku, variant_name, retail_price, compare_at_price, is_available_for_retail, is_available_for_wholesale, updated_at)', { count: 'exact' });

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`);
    }

    if (params.categoryId && params.categoryId !== 'all') {
      query = query.eq('primary_category_id', params.categoryId);
    }

    query = query.order('name', { ascending: true }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('[adminPricingRepository.getPricingList] Error:', error);
      throw new Error(`Fiyat listesi yüklenemedi: ${error.message}`);
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const items: AdminPricingItem[] = [];

    ((data as unknown as RawProductPricingRow[]) || []).forEach((prod) => {
      // Add root product pricing item
      items.push({
        id: prod.id,
        type: 'product',
        productId: prod.id,
        name: prod.name,
        categoryName: prod.categories?.name || 'Kategorisiz',
        retailPrice: Number(prod.retail_price) || 0,
        compareAtPrice: prod.compare_at_price !== null && prod.compare_at_price !== undefined ? Number(prod.compare_at_price) : null,
        retailEnabled: Boolean(prod.retail_enabled),
        wholesaleEnabled: Boolean(prod.wholesale_enabled),
        updatedAt: prod.updated_at,
      });

      // Add variant items if any
      (prod.product_variants || []).forEach((v) => {
        items.push({
          id: v.id,
          type: 'variant',
          productId: prod.id,
          variantId: v.id,
          name: `${prod.name} (${v.variant_name})`,
          sku: v.sku,
          categoryName: prod.categories?.name || 'Kategorisiz',
          retailPrice: Number(v.retail_price) || 0,
          compareAtPrice: v.compare_at_price !== null && v.compare_at_price !== undefined ? Number(v.compare_at_price) : null,
          retailEnabled: v.is_available_for_retail !== false,
          wholesaleEnabled: v.is_available_for_wholesale !== false,
          updatedAt: v.updated_at,
        });
      });
    });

    return {
      data: items,
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  },

  async updatePrice(input: UpdatePriceInput): Promise<void> {
    if (input.retailPrice < 0 || isNaN(input.retailPrice)) {
      throw new Error('Fiyat negatif olamaz.');
    }

    if (
      input.compareAtPrice !== null &&
      input.compareAtPrice !== undefined &&
      input.compareAtPrice < input.retailPrice
    ) {
      throw new Error('Eski fiyat (indirim öncesi) mevcut satış fiyatından düşük olamaz.');
    }

    const client = getClient();
    const payload = {
      retail_price: Number(input.retailPrice),
      compare_at_price: input.compareAtPrice !== null && input.compareAtPrice !== undefined ? Number(input.compareAtPrice) : null,
      updated_at: new Date().toISOString(),
    };

    if (input.type === 'product') {
      const { error } = await client
        .from('products')
        .update(payload)
        .eq('id', input.id);

      if (error) {
        throw new Error(`Ürün fiyatı güncellenemedi: ${error.message}`);
      }
    } else {
      const { error } = await client
        .from('product_variants')
        .update(payload)
        .eq('id', input.id);

      if (error) {
        throw new Error(`Varyant fiyatı güncellenemedi: ${error.message}`);
      }
    }
  },
};
