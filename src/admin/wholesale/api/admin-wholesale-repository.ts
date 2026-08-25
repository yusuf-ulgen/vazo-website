import { supabase, isSupabaseConfigured } from '@/shared/lib/supabase';
import {
  AdminWholesaleTier,
  CreateWholesaleTierInput,
  UpdateWholesaleTierInput,
  UpdateProductWholesaleConfigInput,
} from '../types';

function getClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase client is not configured. Admin operations require active Supabase connection.');
  }
  return supabase;
}

interface RawTierRow {
  id: string;
  product_id: string;
  variant_id: string | null;
  min_quantity: number;
  max_quantity: number | null;
  unit_price: number | string;
  discount_percentage: number | string | null;
  active: boolean;
  created_at: string;
  products?: { name: string; slug: string } | null;
  product_variants?: { sku: string; variant_name: string } | null;
}

export const adminWholesaleRepository = {
  async getWholesaleTiers(productId?: string): Promise<AdminWholesaleTier[]> {
    const client = getClient();

    let query = client
      .from('wholesale_price_tiers')
      .select('*, products(name, slug), product_variants(sku, variant_name)');

    if (productId) {
      query = query.eq('product_id', productId);
    }

    query = query.order('min_quantity', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('[adminWholesaleRepository.getWholesaleTiers] Error:', error);
      throw new Error(`Toptan fiyat kademeleri yüklenemedi: ${error.message}`);
    }

    return ((data as unknown as RawTierRow[]) || []).map((row) => ({
      id: row.id,
      product_id: row.product_id,
      product_name: row.products?.name || 'Ürün',
      product_slug: row.products?.slug || '',
      variant_id: row.variant_id,
      variant_sku: row.product_variants?.sku,
      variant_name: row.product_variants?.variant_name,
      min_quantity: row.min_quantity,
      max_quantity: row.max_quantity,
      unit_price: Number(row.unit_price) || 0,
      discount_percentage: row.discount_percentage !== null ? Number(row.discount_percentage) : null,
      active: row.active,
      created_at: row.created_at,
    }));
  },

  async createWholesaleTier(input: CreateWholesaleTierInput): Promise<AdminWholesaleTier> {
    if (!input.product_id) {
      throw new Error('Ürün seçimi zorunludur.');
    }

    const minQty = Math.floor(Number(input.min_quantity));
    if (isNaN(minQty) || minQty < 1) {
      throw new Error('Minimum adet en az 1 olmalıdır.');
    }

    const maxQty =
      input.max_quantity !== undefined && input.max_quantity !== null
        ? Math.floor(Number(input.max_quantity))
        : null;

    if (maxQty !== null && maxQty < minQty) {
      throw new Error('Maksimum adet minimum adetten küçük olamaz.');
    }

    const unitPrice = Number(input.unit_price);
    if (isNaN(unitPrice) || unitPrice < 0) {
      throw new Error('Birim toptan fiyat negatif olamaz.');
    }

    const client = getClient();

    // Check for overlap with existing active tiers for the same product & variant
    const { data: existingTiers } = await client
      .from('wholesale_price_tiers')
      .select('min_quantity, max_quantity')
      .eq('product_id', input.product_id)
      .eq('active', true)
      .is('variant_id', input.variant_id || null);

    if (existingTiers && existingTiers.length > 0) {
      const overlaps = existingTiers.some((tier) => {
        const tierMin = tier.min_quantity;
        const tierMax = tier.max_quantity !== null ? tier.max_quantity : Infinity;
        const newMax = maxQty !== null ? maxQty : Infinity;
        return minQty <= tierMax && newMax >= tierMin;
      });

      if (overlaps) {
        throw new Error(
          'Belirtilen miktar aralığı bu ürün için tanımlı başka bir aktif toptan kademe ile çakışıyor.'
        );
      }
    }

    const payload = {
      product_id: input.product_id,
      variant_id: input.variant_id || null,
      min_quantity: minQty,
      max_quantity: maxQty,
      unit_price: unitPrice,
      discount_percentage:
        input.discount_percentage !== undefined && input.discount_percentage !== null
          ? Number(input.discount_percentage)
          : null,
      active: input.active !== false,
    };

    const { data, error } = await client
      .from('wholesale_price_tiers')
      .insert(payload)
      .select('*, products(name, slug), product_variants(sku, variant_name)')
      .single();

    if (error) {
      throw new Error(`Toptan kademe oluşturulamadı: ${error.message}`);
    }

    const row = data as unknown as RawTierRow;
    return {
      id: row.id,
      product_id: row.product_id,
      product_name: row.products?.name || 'Ürün',
      product_slug: row.products?.slug || '',
      variant_id: row.variant_id,
      variant_sku: row.product_variants?.sku,
      variant_name: row.product_variants?.variant_name,
      min_quantity: row.min_quantity,
      max_quantity: row.max_quantity,
      unit_price: Number(row.unit_price) || 0,
      discount_percentage: row.discount_percentage !== null ? Number(row.discount_percentage) : null,
      active: row.active,
      created_at: row.created_at,
    };
  },

  async updateWholesaleTier(id: string, input: UpdateWholesaleTierInput): Promise<void> {
    const payload: Record<string, unknown> = {};

    if (input.min_quantity !== undefined) {
      const min = Math.floor(Number(input.min_quantity));
      if (min < 1) throw new Error('Minimum adet en az 1 olmalıdır.');
      payload.min_quantity = min;
    }

    if (input.max_quantity !== undefined) {
      const max = input.max_quantity !== null ? Math.floor(Number(input.max_quantity)) : null;
      if (max !== null && input.min_quantity !== undefined && max < input.min_quantity) {
        throw new Error('Maksimum adet minimum adetten küçük olamaz.');
      }
      payload.max_quantity = max;
    }

    if (input.unit_price !== undefined) {
      const price = Number(input.unit_price);
      if (price < 0) throw new Error('Birim fiyat negatif olamaz.');
      payload.unit_price = price;
    }

    if (input.discount_percentage !== undefined) {
      payload.discount_percentage =
        input.discount_percentage !== null ? Number(input.discount_percentage) : null;
    }

    if (input.active !== undefined) {
      payload.active = input.active;
    }

    const client = getClient();
    const { error } = await client
      .from('wholesale_price_tiers')
      .update(payload)
      .eq('id', id);

    if (error) {
      throw new Error(`Toptan kademe güncellenemedi: ${error.message}`);
    }
  },

  async deleteWholesaleTier(id: string): Promise<void> {
    const client = getClient();
    const { error } = await client.from('wholesale_price_tiers').delete().eq('id', id);

    if (error) {
      throw new Error(`Toptan kademe silinemedi: ${error.message}`);
    }
  },

  async updateProductWholesaleConfig(
    productId: string,
    input: UpdateProductWholesaleConfigInput
  ): Promise<void> {
    if (input.wholesale_moq < 1) {
      throw new Error('Minimum toptan sipariş adedi (MOQ) en az 1 olmalıdır.');
    }

    const client = getClient();
    const { error } = await client
      .from('products')
      .update({
        wholesale_enabled: input.wholesale_enabled,
        wholesale_moq: Math.floor(input.wholesale_moq),
        wholesale_lead_time_days:
          input.wholesale_lead_time_days !== undefined && input.wholesale_lead_time_days !== null
            ? Math.floor(Number(input.wholesale_lead_time_days))
            : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId);

    if (error) {
      throw new Error(`Toptan ayarları güncellenemedi: ${error.message}`);
    }
  },
};
