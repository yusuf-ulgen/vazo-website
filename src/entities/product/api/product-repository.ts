import { Product, ProductVariant, WholesalePricingTier } from '../types';
import { supabase, isSupabaseConfigured } from '@/shared/lib/supabase';
import { mockProducts } from '@/shared/mocks/products';

export interface ProductFilterOptions {
  categoryId?: string;
  collectionId?: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestseller?: boolean;
  wholesaleOnly?: boolean;
  searchQuery?: string;
  sortBy?: 'recommended' | 'price_asc' | 'price_desc' | 'newest';
}

interface SupabaseProductRow {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  description: string;
  status: 'draft' | 'published' | 'archived' | 'out_of_stock';
  material: string;
  finish: string;
  origin_country: string;
  retail_price: number;
  compare_at_price: number | null;
  retail_enabled: boolean;
  wholesale_enabled: boolean;
  wholesale_moq: number;
  wholesale_lead_time_days: number | null;
  featured: boolean;
  new_arrival: boolean;
  bestseller: boolean;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  product_variants?: Array<{
    id: string;
    sku: string;
    variant_name: string;
    color_name: string;
    color_hex: string | null;
    finish: string | null;
    height_cm: number | null;
    diameter_cm: number | null;
    weight_kg: number | null;
    retail_price: number;
    compare_at_price: number | null;
    stock_quantity: number;
    is_available_for_retail: boolean;
    is_available_for_wholesale: boolean;
    image_url: string | null;
  }>;
  product_media?: Array<{
    id: string;
    url: string;
    alt_text: string;
    is_primary: boolean;
    sort_order: number;
  }>;
  wholesale_price_tiers?: Array<{
    min_quantity: number;
    max_quantity: number | null;
    unit_price: number;
    discount_percentage: number | null;
  }>;
  product_categories?: Array<{ category_id: string }>;
  product_collections?: Array<{ collection_id: string }>;
}

function mapRowToProduct(row: SupabaseProductRow): Product {
  const variants: ProductVariant[] = (row.product_variants || []).map((v) => ({
    id: v.id,
    sku: v.sku,
    name: v.variant_name,
    colorName: v.color_name,
    colorHex: v.color_hex || undefined,
    finish: (v.finish as 'matte' | 'glossy' | 'raw_clay' | 'textured') || 'matte',
    dimensions: {
      heightCm: Number(v.height_cm || 0),
      diameterCm: Number(v.diameter_cm || 0),
      weightKg: Number(v.weight_kg || 0),
    },
    retailPrice: Number(v.retail_price),
    compareAtPrice: v.compare_at_price ? Number(v.compare_at_price) : undefined,
    stockQuantity: v.stock_quantity,
    isAvailableForRetail: v.is_available_for_retail,
    isAvailableForWholesale: v.is_available_for_wholesale,
    imageUrl: v.image_url || undefined,
  }));

  const media = (row.product_media || [])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((m) => ({
      id: m.id,
      url: m.url,
      alt: m.alt_text,
      isPrimary: m.is_primary,
    }));

  const tiers: WholesalePricingTier[] = (row.wholesale_price_tiers || [])
    .sort((a, b) => a.min_quantity - b.min_quantity)
    .map((t) => ({
      minQuantity: t.min_quantity,
      maxQuantity: t.max_quantity || undefined,
      unitPrice: Number(t.unit_price),
      discountPercentage: t.discount_percentage ? Number(t.discount_percentage) : undefined,
    }));

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    description: row.description,
    status: row.status,
    categoryId: row.product_categories?.[0]?.category_id || '',
    collectionIds: (row.product_collections || []).map((c) => c.collection_id),
    material: row.material,
    finish: row.finish,
    originCountry: row.origin_country,
    images: media.length > 0 ? media : [{ id: 'fallback', url: '/placeholder-vase.jpg', alt: row.name, isPrimary: true }],
    variants,
    retailPrice: Number(row.retail_price),
    compareAtPrice: row.compare_at_price ? Number(row.compare_at_price) : undefined,
    wholesale: {
      isWholesaleEnabled: row.wholesale_enabled,
      minOrderQuantity: row.wholesale_moq,
      tiers,
      leadTimeDays: row.wholesale_lead_time_days || 14,
    },
    tags: row.tags || [],
    isFeatured: row.featured,
    isNewArrival: row.new_arrival,
    isBestseller: row.bestseller,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const productRepository = {
  async getProducts(options?: ProductFilterOptions): Promise<Product[]> {
    if (!isSupabaseConfigured || import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
      let filtered = [...mockProducts];

      if (options?.categoryId) {
        filtered = filtered.filter((p) => p.categoryId === options.categoryId);
      }
      if (options?.collectionId) {
        filtered = filtered.filter((p) => p.collectionIds.includes(options.collectionId!));
      }
      if (options?.isFeatured !== undefined) {
        filtered = filtered.filter((p) => p.isFeatured === options.isFeatured);
      }
      if (options?.isNewArrival !== undefined) {
        filtered = filtered.filter((p) => p.isNewArrival === options.isNewArrival);
      }
      if (options?.isBestseller !== undefined) {
        filtered = filtered.filter((p) => p.isBestseller === options.isBestseller);
      }
      if (options?.wholesaleOnly) {
        filtered = filtered.filter((p) => p.wholesale.isWholesaleEnabled);
      }
      if (options?.searchQuery) {
        const q = options.searchQuery.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.material.toLowerCase().includes(q) ||
            p.tags.some((t) => t.toLowerCase().includes(q))
        );
      }

      if (options?.sortBy === 'price_asc') {
        filtered.sort((a, b) => a.retailPrice - b.retailPrice);
      } else if (options?.sortBy === 'price_desc') {
        filtered.sort((a, b) => b.retailPrice - a.retailPrice);
      } else if (options?.sortBy === 'newest') {
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      return filtered;
    }

    if (!supabase) {
      throw new Error('Supabase client is not available.');
    }

    let query = supabase
      .from('products')
      .select(`
        *,
        product_variants (*),
        product_media (*),
        wholesale_price_tiers (*),
        product_categories (category_id),
        product_collections (collection_id)
      `)
      .eq('status', 'published');

    if (options?.isFeatured !== undefined) {
      query = query.eq('featured', options.isFeatured);
    }
    if (options?.isNewArrival !== undefined) {
      query = query.eq('new_arrival', options.isNewArrival);
    }
    if (options?.isBestseller !== undefined) {
      query = query.eq('bestseller', options.isBestseller);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[productRepository.getProducts] Supabase error:', error);
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    let products = (data as unknown as SupabaseProductRow[]).map(mapRowToProduct);

    if (options?.categoryId) {
      products = products.filter((p) => p.categoryId === options.categoryId);
    }
    if (options?.collectionId) {
      products = products.filter((p) => p.collectionIds.includes(options.collectionId!));
    }

    return products;
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    if (!isSupabaseConfigured || import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
      const found = mockProducts.find((p) => p.slug === slug);
      return found || null;
    }

    if (!supabase) {
      throw new Error('Supabase client is not available.');
    }

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_variants (*),
        product_media (*),
        wholesale_price_tiers (*),
        product_categories (category_id),
        product_collections (collection_id)
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // not found
      console.error('[productRepository.getProductBySlug] Error:', error);
      throw new Error(`Failed to fetch product by slug: ${error.message}`);
    }

    return data ? mapRowToProduct(data as unknown as SupabaseProductRow) : null;
  },
};
