import { supabase, isSupabaseConfigured } from '@/shared/lib/supabase';
import { ProductStatus } from '@/entities/product/types';
import {
  AdminProduct,
  CreateProductInput,
  UpdateProductInput,
  AdminProductListParams,
  AdminProductListResult,
} from '../types';
import { generateSlug, validateSlug } from '@/admin/categories/api/admin-category-repository';

function getClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase client is not configured. Admin operations require active Supabase connection.');
  }
  return supabase;
}

export const adminProductRepository = {
  async getProducts(params: AdminProductListParams = {}): Promise<AdminProductListResult> {
    const client = getClient();
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, Math.min(100, params.pageSize || 10));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = client
      .from('products')
      .select('*, product_media(url, is_primary, sort_order), product_variants(id)', { count: 'exact' });

    // Text search filter
    if (params.search && params.search.trim()) {
      const term = params.search.trim();
      query = query.or(`name.ilike.%${term}%,slug.ilike.%${term}%`);
    }

    // Status filter
    if (params.status && params.status !== 'all') {
      query = query.eq('status', params.status);
    }

    // Primary Category filter
    if (params.categoryId) {
      query = query.eq('primary_category_id', params.categoryId);
    }

    // Boolean filters
    if (params.retailEnabled !== undefined && params.retailEnabled !== 'all') {
      query = query.eq('retail_enabled', params.retailEnabled);
    }
    if (params.wholesaleEnabled !== undefined && params.wholesaleEnabled !== 'all') {
      query = query.eq('wholesale_enabled', params.wholesaleEnabled);
    }
    if (params.featured !== undefined && params.featured !== 'all') {
      query = query.eq('featured', params.featured);
    }
    if (params.bestseller !== undefined && params.bestseller !== 'all') {
      query = query.eq('bestseller', params.bestseller);
    }
    if (params.newArrival !== undefined && params.newArrival !== 'all') {
      query = query.eq('new_arrival', params.newArrival);
    }

    // Ordering
    switch (params.sortBy) {
      case 'created_at_asc':
        query = query.order('created_at', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('retail_price', { ascending: false });
        break;
      case 'price_asc':
        query = query.order('retail_price', { ascending: true });
        break;
      case 'name_asc':
        query = query.order('name', { ascending: true });
        break;
      case 'created_at_desc':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Pagination range
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('[adminProductRepository.getProducts] Error:', error);
      throw new Error(`Ürünler listelenirken hata oluştu: ${error.message}`);
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    interface RawMediaRow {
      url: string;
      is_primary?: boolean;
      sort_order?: number;
    }

    interface RawProductRow {
      id: string;
      slug: string;
      name: string;
      short_description: string;
      description: string;
      status: string;
      primary_category_id?: string | null;
      material: string;
      finish: string;
      care_instructions?: string | null;
      origin_country?: string;
      retail_price: number | string;
      compare_at_price?: number | string | null;
      retail_enabled?: boolean;
      wholesale_enabled?: boolean;
      wholesale_moq?: number;
      wholesale_lead_time_days?: number | null;
      featured?: boolean;
      new_arrival?: boolean;
      bestseller?: boolean;
      tags?: string[] | null;
      seo_title?: string | null;
      seo_description?: string | null;
      created_at: string;
      updated_at: string;
      product_media?: RawMediaRow[];
      product_variants?: Array<{ id: string }>;
    }

    const mappedProducts: AdminProduct[] = ((data as unknown as RawProductRow[]) || []).map((row) => {
      // Find primary thumbnail from media relation
      const mediaList = row.product_media || [];
      const primaryMedia =
        mediaList.find((m) => m.is_primary) ||
        [...mediaList].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))[0];

      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        short_description: row.short_description,
        description: row.description,
        status: row.status as ProductStatus,
        primary_category_id: row.primary_category_id || null,
        material: row.material,
        finish: row.finish,
        care_instructions: row.care_instructions || null,
        origin_country: row.origin_country || 'Türkiye',
        retail_price: Number(row.retail_price) || 0,
        compare_at_price: row.compare_at_price !== null && row.compare_at_price !== undefined ? Number(row.compare_at_price) : null,
        retail_enabled: Boolean(row.retail_enabled),
        wholesale_enabled: Boolean(row.wholesale_enabled),
        wholesale_moq: row.wholesale_moq || 1,
        wholesale_lead_time_days: row.wholesale_lead_time_days || null,
        featured: Boolean(row.featured),
        new_arrival: Boolean(row.new_arrival),
        bestseller: Boolean(row.bestseller),
        tags: Array.isArray(row.tags) ? row.tags : [],
        seo_title: row.seo_title || null,
        seo_description: row.seo_description || null,
        created_at: row.created_at,
        updated_at: row.updated_at,
        thumbnail_url: primaryMedia?.url || null,
        variants_count: Array.isArray(row.product_variants) ? row.product_variants.length : 0,
      };
    });

    return {
      data: mappedProducts,
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  },

  async getProductById(id: string): Promise<AdminProduct | null> {
    const client = getClient();

    const { data: productRow, error } = await client
      .from('products')
      .select('*, product_media(*), product_variants(*)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Ürün yüklenemedi: ${error.message}`);
    }

    // Fetch related category IDs
    const { data: catRows } = await client
      .from('product_categories')
      .select('category_id')
      .eq('product_id', id);

    // Fetch related collection IDs
    const { data: colRows } = await client
      .from('product_collections')
      .select('collection_id')
      .eq('product_id', id);

    const categoryIds = ((catRows as Array<{ category_id: string }>) || []).map((r) => r.category_id);
    const collectionIds = ((colRows as Array<{ collection_id: string }>) || []).map((r) => r.collection_id);

    return {
      id: productRow.id,
      slug: productRow.slug,
      name: productRow.name,
      short_description: productRow.short_description,
      description: productRow.description,
      status: productRow.status as ProductStatus,
      primary_category_id: productRow.primary_category_id || null,
      material: productRow.material,
      finish: productRow.finish,
      care_instructions: productRow.care_instructions || null,
      origin_country: productRow.origin_country || 'Türkiye',
      retail_price: Number(productRow.retail_price) || 0,
      compare_at_price: productRow.compare_at_price !== null ? Number(productRow.compare_at_price) : null,
      retail_enabled: Boolean(productRow.retail_enabled),
      wholesale_enabled: Boolean(productRow.wholesale_enabled),
      wholesale_moq: productRow.wholesale_moq || 1,
      wholesale_lead_time_days: productRow.wholesale_lead_time_days || null,
      featured: Boolean(productRow.featured),
      new_arrival: Boolean(productRow.new_arrival),
      bestseller: Boolean(productRow.bestseller),
      tags: Array.isArray(productRow.tags) ? productRow.tags : [],
      seo_title: productRow.seo_title || null,
      seo_description: productRow.seo_description || null,
      created_at: productRow.created_at,
      updated_at: productRow.updated_at,
      category_ids: categoryIds,
      collection_ids: collectionIds,
      variants_count: Array.isArray(productRow.product_variants) ? productRow.product_variants.length : 0,
    };
  },

  async createProduct(input: CreateProductInput): Promise<AdminProduct> {
    const name = input.name.trim();
    if (!name) {
      throw new Error('Ürün adı zorunludur.');
    }

    const slug = (input.slug || generateSlug(name)).trim().toLowerCase();
    if (!validateSlug(slug)) {
      throw new Error('Geçersiz URL formatı (slug). Sadece küçük harfler, rakamlar ve tire (-) kullanılabilir.');
    }

    if (input.retail_price < 0) {
      throw new Error('Perakende fiyatı negatif olamaz.');
    }

    if (
      input.compare_at_price !== undefined &&
      input.compare_at_price !== null &&
      input.compare_at_price < input.retail_price
    ) {
      throw new Error('Eski fiyat (karşılaştırma fiyatı) mevcut perakende fiyatından düşük olamaz.');
    }

    const client = getClient();

    // Prepare category IDs ensuring primary_category_id is included
    const categoryIds = new Set(input.category_ids || []);
    if (input.primary_category_id) {
      categoryIds.add(input.primary_category_id);
    }

    const productPayload = {
      name,
      slug,
      short_description: input.short_description?.trim() || name,
      description: input.description?.trim() || name,
      status: input.status || 'draft',
      primary_category_id: input.primary_category_id || null,
      material: input.material?.trim() || 'Stoneware Seramik',
      finish: input.finish?.trim() || 'Mat Sırlı',
      care_instructions: input.care_instructions?.trim() || null,
      origin_country: input.origin_country?.trim() || 'Türkiye',
      retail_price: Number(input.retail_price),
      compare_at_price: input.compare_at_price !== undefined ? input.compare_at_price : null,
      retail_enabled: input.retail_enabled !== undefined ? input.retail_enabled : true,
      wholesale_enabled: input.wholesale_enabled !== undefined ? input.wholesale_enabled : true,
      wholesale_moq: Math.max(1, Number(input.wholesale_moq) || 1),
      wholesale_lead_time_days: input.wholesale_lead_time_days ?? 14,
      featured: Boolean(input.featured),
      new_arrival: Boolean(input.new_arrival),
      bestseller: Boolean(input.bestseller),
      tags: Array.isArray(input.tags) ? input.tags : [],
      seo_title: input.seo_title?.trim() || null,
      seo_description: input.seo_description?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { data: createdProduct, error } = await client
      .from('products')
      .insert(productPayload)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error(`"${slug}" slug adresine sahip bir ürün zaten mevcut.`);
      }
      throw new Error(`Ürün oluşturulamadı: ${error.message}`);
    }

    const productId = createdProduct.id;

    // Insert category relations
    if (categoryIds.size > 0) {
      const catInserts = Array.from(categoryIds).map((catId) => ({
        product_id: productId,
        category_id: catId,
      }));
      await client.from('product_categories').insert(catInserts);
    }

    // Insert collection relations
    const collectionIds = input.collection_ids || [];
    if (collectionIds.length > 0) {
      const colInserts = collectionIds.map((colId) => ({
        product_id: productId,
        collection_id: colId,
      }));
      await client.from('product_collections').insert(colInserts);
    }

    return this.getProductById(productId) as Promise<AdminProduct>;
  },

  async updateProduct(id: string, input: UpdateProductInput): Promise<AdminProduct> {
    if (input.name !== undefined && !input.name.trim()) {
      throw new Error('Ürün adı zorunludur.');
    }

    if (input.slug !== undefined) {
      const slug = input.slug.trim().toLowerCase();
      if (!validateSlug(slug)) {
        throw new Error('Geçersiz URL formatı (slug). Sadece küçük harfler, rakamlar ve tire (-) kullanılabilir.');
      }
    }

    if (input.retail_price !== undefined && input.retail_price < 0) {
      throw new Error('Perakende fiyatı negatif olamaz.');
    }

    const client = getClient();

    const productPayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) productPayload.name = input.name.trim();
    if (input.slug !== undefined) productPayload.slug = input.slug.trim().toLowerCase();
    if (input.short_description !== undefined) productPayload.short_description = input.short_description.trim();
    if (input.description !== undefined) productPayload.description = input.description.trim();
    if (input.status !== undefined) productPayload.status = input.status;
    if (input.primary_category_id !== undefined) productPayload.primary_category_id = input.primary_category_id;
    if (input.material !== undefined) productPayload.material = input.material.trim();
    if (input.finish !== undefined) productPayload.finish = input.finish.trim();
    if (input.care_instructions !== undefined) productPayload.care_instructions = input.care_instructions?.trim() || null;
    if (input.origin_country !== undefined) productPayload.origin_country = input.origin_country.trim();
    if (input.retail_price !== undefined) productPayload.retail_price = Number(input.retail_price);
    if (input.compare_at_price !== undefined) productPayload.compare_at_price = input.compare_at_price;
    if (input.retail_enabled !== undefined) productPayload.retail_enabled = input.retail_enabled;
    if (input.wholesale_enabled !== undefined) productPayload.wholesale_enabled = input.wholesale_enabled;
    if (input.wholesale_moq !== undefined) productPayload.wholesale_moq = Math.max(1, Number(input.wholesale_moq) || 1);
    if (input.wholesale_lead_time_days !== undefined) productPayload.wholesale_lead_time_days = input.wholesale_lead_time_days;
    if (input.featured !== undefined) productPayload.featured = input.featured;
    if (input.new_arrival !== undefined) productPayload.new_arrival = input.new_arrival;
    if (input.bestseller !== undefined) productPayload.bestseller = input.bestseller;
    if (input.tags !== undefined) productPayload.tags = input.tags;
    if (input.seo_title !== undefined) productPayload.seo_title = input.seo_title?.trim() || null;
    if (input.seo_description !== undefined) productPayload.seo_description = input.seo_description?.trim() || null;

    const { error } = await client.from('products').update(productPayload).eq('id', id);

    if (error) {
      if (error.code === '23505') {
        throw new Error(`Bu slug adresi başka bir ürün tarafından kullanılıyor.`);
      }
      throw new Error(`Ürün güncellenemedi: ${error.message}`);
    }

    // Synchronize category relations if category_ids or primary_category_id updated
    if (input.category_ids !== undefined || input.primary_category_id !== undefined) {
      const categoryIds = new Set(input.category_ids || []);
      if (input.primary_category_id) {
        categoryIds.add(input.primary_category_id);
      }

      await client.from('product_categories').delete().eq('product_id', id);
      if (categoryIds.size > 0) {
        const catInserts = Array.from(categoryIds).map((catId) => ({
          product_id: id,
          category_id: catId,
        }));
        await client.from('product_categories').insert(catInserts);
      }
    }

    // Synchronize collection relations if collection_ids updated
    if (input.collection_ids !== undefined) {
      await client.from('product_collections').delete().eq('product_id', id);
      if (input.collection_ids.length > 0) {
        const colInserts = input.collection_ids.map((colId) => ({
          product_id: id,
          collection_id: colId,
        }));
        await client.from('product_collections').insert(colInserts);
      }
    }

    return this.getProductById(id) as Promise<AdminProduct>;
  },

  async updateProductStatus(id: string, status: ProductStatus): Promise<AdminProduct> {
    return this.updateProduct(id, { status });
  },

  async deleteProduct(id: string): Promise<void> {
    const client = getClient();
    const { error } = await client.from('products').delete().eq('id', id);

    if (error) {
      throw new Error(`Ürün silinemedi: ${error.message}`);
    }
  },
};
