import { supabase, isSupabaseConfigured } from '@/shared/lib/supabase';
import { AdminProductVariant, CreateVariantInput, UpdateVariantInput } from '../types';

function getClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase client is not configured. Admin operations require active Supabase connection.');
  }
  return supabase;
}

export const adminVariantRepository = {
  async getVariantsByProductId(productId: string): Promise<AdminProductVariant[]> {
    const client = getClient();

    const { data, error } = await client
      .from('product_variants')
      .select('*, products(name, slug)')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[adminVariantRepository.getVariantsByProductId] Error:', error);
      throw new Error(`Ürün varyantları yüklenemedi: ${error.message}`);
    }

    interface RawVariantWithProduct {
      id: string;
      product_id: string;
      sku: string;
      variant_name: string;
      color_name: string;
      color_hex?: string | null;
      finish?: string | null;
      size_label?: string | null;
      height_cm?: number | string | null;
      diameter_cm?: number | string | null;
      width_cm?: number | string | null;
      depth_cm?: number | string | null;
      weight_kg?: number | string | null;
      retail_price: number | string;
      compare_at_price?: number | string | null;
      stock_quantity?: number | string;
      is_available_for_retail?: boolean;
      is_available_for_wholesale?: boolean;
      image_url?: string | null;
      sort_order?: number;
      active?: boolean;
      created_at: string;
      updated_at: string;
      products?: { name: string; slug: string } | null;
    }

    return ((data as unknown as RawVariantWithProduct[]) || []).map((row) => ({
      id: row.id,
      product_id: row.product_id,
      sku: row.sku,
      variant_name: row.variant_name,
      color_name: row.color_name,
      color_hex: row.color_hex || null,
      finish: row.finish || null,
      size_label: row.size_label || null,
      height_cm: row.height_cm !== null && row.height_cm !== undefined ? Number(row.height_cm) : null,
      diameter_cm: row.diameter_cm !== null && row.diameter_cm !== undefined ? Number(row.diameter_cm) : null,
      width_cm: row.width_cm !== null && row.width_cm !== undefined ? Number(row.width_cm) : null,
      depth_cm: row.depth_cm !== null && row.depth_cm !== undefined ? Number(row.depth_cm) : null,
      weight_kg: row.weight_kg !== null && row.weight_kg !== undefined ? Number(row.weight_kg) : null,
      retail_price: Number(row.retail_price) || 0,
      compare_at_price: row.compare_at_price !== null && row.compare_at_price !== undefined ? Number(row.compare_at_price) : null,
      stock_quantity: Math.max(0, Number(row.stock_quantity) || 0),
      is_available_for_retail: row.is_available_for_retail !== false,
      is_available_for_wholesale: row.is_available_for_wholesale !== false,
      image_url: row.image_url || null,
      sort_order: row.sort_order || 0,
      active: row.active !== false,
      created_at: row.created_at,
      updated_at: row.updated_at,
      product_name: row.products?.name,
      product_slug: row.products?.slug,
    }));
  },

  async getVariantById(id: string): Promise<AdminProductVariant | null> {
    const client = getClient();

    const { data, error } = await client
      .from('product_variants')
      .select('*, products(name, slug)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Varyant yüklenemedi: ${error.message}`);
    }

    return {
      id: data.id,
      product_id: data.product_id,
      sku: data.sku,
      variant_name: data.variant_name,
      color_name: data.color_name,
      color_hex: data.color_hex || null,
      finish: data.finish || null,
      size_label: data.size_label || null,
      height_cm: data.height_cm !== null ? Number(data.height_cm) : null,
      diameter_cm: data.diameter_cm !== null ? Number(data.diameter_cm) : null,
      width_cm: data.width_cm !== null ? Number(data.width_cm) : null,
      depth_cm: data.depth_cm !== null ? Number(data.depth_cm) : null,
      weight_kg: data.weight_kg !== null ? Number(data.weight_kg) : null,
      retail_price: Number(data.retail_price) || 0,
      compare_at_price: data.compare_at_price !== null ? Number(data.compare_at_price) : null,
      stock_quantity: Math.max(0, Number(data.stock_quantity) || 0),
      is_available_for_retail: data.is_available_for_retail !== false,
      is_available_for_wholesale: data.is_available_for_wholesale !== false,
      image_url: data.image_url || null,
      sort_order: data.sort_order || 0,
      active: data.active !== false,
      created_at: data.created_at,
      updated_at: data.updated_at,
      product_name: data.products?.name,
      product_slug: data.products?.slug,
    };
  },

  async createVariant(input: CreateVariantInput): Promise<AdminProductVariant> {
    const sku = input.sku?.trim().toUpperCase();
    if (!sku) {
      throw new Error('Varyant SKU kodu zorunludur.');
    }

    const variantName = input.variant_name?.trim();
    if (!variantName) {
      throw new Error('Varyant adı zorunludur.');
    }

    const colorName = input.color_name?.trim();
    if (!colorName) {
      throw new Error('Renk adı zorunludur.');
    }

    if (input.retail_price < 0) {
      throw new Error('Perakende fiyatı negatif olamaz.');
    }

    if (
      input.compare_at_price !== undefined &&
      input.compare_at_price !== null &&
      input.compare_at_price < input.retail_price
    ) {
      throw new Error('Eski fiyat mevcut fiyattan düşük olamaz.');
    }

    const stock = Number(input.stock_quantity ?? 0);
    if (isNaN(stock) || stock < 0) {
      throw new Error('Stok miktarı negatif olamaz.');
    }

    const client = getClient();

    const payload = {
      product_id: input.product_id,
      sku,
      variant_name: variantName,
      color_name: colorName,
      color_hex: input.color_hex?.trim() || null,
      finish: input.finish?.trim() || null,
      size_label: input.size_label?.trim() || null,
      height_cm: input.height_cm !== undefined && input.height_cm !== null ? Number(input.height_cm) : null,
      diameter_cm: input.diameter_cm !== undefined && input.diameter_cm !== null ? Number(input.diameter_cm) : null,
      width_cm: input.width_cm !== undefined && input.width_cm !== null ? Number(input.width_cm) : null,
      depth_cm: input.depth_cm !== undefined && input.depth_cm !== null ? Number(input.depth_cm) : null,
      weight_kg: input.weight_kg !== undefined && input.weight_kg !== null ? Number(input.weight_kg) : null,
      retail_price: Number(input.retail_price),
      compare_at_price: input.compare_at_price !== undefined && input.compare_at_price !== null ? Number(input.compare_at_price) : null,
      stock_quantity: Math.floor(stock),
      is_available_for_retail: input.is_available_for_retail !== false,
      is_available_for_wholesale: input.is_available_for_wholesale !== false,
      image_url: input.image_url?.trim() || null,
      sort_order: Number(input.sort_order ?? 0),
      active: input.active !== false,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('product_variants')
      .insert(payload)
      .select('*, products(name, slug)')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error(`"${sku}" SKU koduna sahip bir varyant zaten mevcut.`);
      }
      throw new Error(`Varyant oluşturulamadı: ${error.message}`);
    }

    return this.getVariantById(data.id) as Promise<AdminProductVariant>;
  },

  async updateVariant(id: string, input: UpdateVariantInput): Promise<AdminProductVariant> {
    if (input.sku !== undefined && !input.sku.trim()) {
      throw new Error('Varyant SKU kodu zorunludur.');
    }

    if (input.variant_name !== undefined && !input.variant_name.trim()) {
      throw new Error('Varyant adı zorunludur.');
    }

    if (input.retail_price !== undefined && input.retail_price < 0) {
      throw new Error('Perakende fiyatı negatif olamaz.');
    }

    if (input.stock_quantity !== undefined && input.stock_quantity < 0) {
      throw new Error('Stok miktarı negatif olamaz.');
    }

    const client = getClient();

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.sku !== undefined) payload.sku = input.sku.trim().toUpperCase();
    if (input.variant_name !== undefined) payload.variant_name = input.variant_name.trim();
    if (input.color_name !== undefined) payload.color_name = input.color_name.trim();
    if (input.color_hex !== undefined) payload.color_hex = input.color_hex?.trim() || null;
    if (input.finish !== undefined) payload.finish = input.finish?.trim() || null;
    if (input.size_label !== undefined) payload.size_label = input.size_label?.trim() || null;
    if (input.height_cm !== undefined) payload.height_cm = input.height_cm !== null ? Number(input.height_cm) : null;
    if (input.diameter_cm !== undefined) payload.diameter_cm = input.diameter_cm !== null ? Number(input.diameter_cm) : null;
    if (input.width_cm !== undefined) payload.width_cm = input.width_cm !== null ? Number(input.width_cm) : null;
    if (input.depth_cm !== undefined) payload.depth_cm = input.depth_cm !== null ? Number(input.depth_cm) : null;
    if (input.weight_kg !== undefined) payload.weight_kg = input.weight_kg !== null ? Number(input.weight_kg) : null;
    if (input.retail_price !== undefined) payload.retail_price = Number(input.retail_price);
    if (input.compare_at_price !== undefined) payload.compare_at_price = input.compare_at_price !== null ? Number(input.compare_at_price) : null;
    if (input.stock_quantity !== undefined) payload.stock_quantity = Math.max(0, Math.floor(Number(input.stock_quantity)));
    if (input.is_available_for_retail !== undefined) payload.is_available_for_retail = input.is_available_for_retail;
    if (input.is_available_for_wholesale !== undefined) payload.is_available_for_wholesale = input.is_available_for_wholesale;
    if (input.image_url !== undefined) payload.image_url = input.image_url?.trim() || null;
    if (input.sort_order !== undefined) payload.sort_order = Number(input.sort_order);
    if (input.active !== undefined) payload.active = input.active;

    const { error } = await client
      .from('product_variants')
      .update(payload)
      .eq('id', id);

    if (error) {
      if (error.code === '23505') {
        throw new Error(`Bu SKU kodu başka bir varyant tarafından kullanılıyor.`);
      }
      throw new Error(`Varyant güncellenemedi: ${error.message}`);
    }

    return this.getVariantById(id) as Promise<AdminProductVariant>;
  },

  async toggleVariantActive(id: string, active: boolean): Promise<AdminProductVariant> {
    return this.updateVariant(id, { active });
  },

  async updateVariantStock(id: string, stockQuantity: number): Promise<AdminProductVariant> {
    if (stockQuantity < 0) {
      throw new Error('Stok miktarı negatif olamaz.');
    }
    return this.updateVariant(id, { stock_quantity: stockQuantity });
  },

  async updateVariantPrice(id: string, retailPrice: number, compareAtPrice?: number | null): Promise<AdminProductVariant> {
    if (retailPrice < 0) {
      throw new Error('Fiyat negatif olamaz.');
    }
    return this.updateVariant(id, { retail_price: retailPrice, compare_at_price: compareAtPrice });
  },

  async deleteVariant(id: string): Promise<void> {
    const client = getClient();
    const { error } = await client.from('product_variants').delete().eq('id', id);

    if (error) {
      throw new Error(`Varyant silinemedi: ${error.message}`);
    }
  },
};
