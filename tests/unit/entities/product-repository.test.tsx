import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productRepository } from '@/entities/product/api/product-repository';
import * as supabaseModule from '@/shared/lib/supabase';
import { createMockSupabaseClient } from 'tests/mocks/supabase-mock';

describe('productRepository', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Mock Mode Filter Operations', () => {
    it('returns all retail products by default', async () => {
      const products = await productRepository.getProducts();
      expect(products.length).toBeGreaterThan(0);
      expect(products.every((p) => p.retailEnabled)).toBe(true);
    });

    it('filters by categoryId', async () => {
      const products = await productRepository.getProducts({
        categoryId: 'c0000000-0000-0000-0000-000000000001',
      });
      expect(products.length).toBeGreaterThan(0);
      expect(
        products.every((p) =>
          p.categoryIds.includes('c0000000-0000-0000-0000-000000000001')
        )
      ).toBe(true);
    });

    it('filters by collectionId', async () => {
      const products = await productRepository.getProducts({
        collectionId: 'b0000000-0000-0000-0000-000000000001',
      });
      expect(products.length).toBeGreaterThan(0);
      expect(
        products.every((p) =>
          p.collectionIds.includes('b0000000-0000-0000-0000-000000000001')
        )
      ).toBe(true);
    });

    it('filters by isFeatured, isNewArrival, and isBestseller', async () => {
      const featured = await productRepository.getProducts({ isFeatured: true });
      expect(featured.every((p) => p.isFeatured)).toBe(true);

      const newArrivals = await productRepository.getProducts({ isNewArrival: true });
      expect(newArrivals.every((p) => p.isNewArrival)).toBe(true);

      const bestsellers = await productRepository.getProducts({ isBestseller: true });
      expect(bestsellers.every((p) => p.isBestseller)).toBe(true);
    });

    it('filters by wholesaleOnly', async () => {
      const wholesale = await productRepository.getProducts({ wholesaleOnly: true });
      expect(wholesale.length).toBeGreaterThan(0);
      expect(wholesale.every((p) => p.wholesale.isWholesaleEnabled)).toBe(true);
    });

    it('filters by searchQuery', async () => {
      const results = await productRepository.getProducts({ searchQuery: 'amforik' });
      expect(results.length).toBeGreaterThan(0);
      expect(
        results.every(
          (p) =>
            p.name.toLowerCase().includes('amforik') ||
            p.description.toLowerCase().includes('amforik') ||
            p.material.toLowerCase().includes('amforik')
        )
      ).toBe(true);
    });

    it('sorts by price_asc, price_desc, and newest', async () => {
      const priceAsc = await productRepository.getProducts({ sortBy: 'price_asc' });
      for (let i = 0; i < priceAsc.length - 1; i++) {
        expect(priceAsc[i]!.retailPrice).toBeLessThanOrEqual(priceAsc[i + 1]!.retailPrice);
      }

      const priceDesc = await productRepository.getProducts({ sortBy: 'price_desc' });
      for (let i = 0; i < priceDesc.length - 1; i++) {
        expect(priceDesc[i]!.retailPrice).toBeGreaterThanOrEqual(priceDesc[i + 1]!.retailPrice);
      }

      const newest = await productRepository.getProducts({ sortBy: 'newest' });
      expect(newest.length).toBeGreaterThan(0);
    });

    it('handles pagination with limit and offset', async () => {
      const page1 = await productRepository.getProducts({ limit: 2, offset: 0 });
      const page2 = await productRepository.getProducts({ limit: 2, offset: 2 });

      expect(page1.length).toBe(2);
      expect(page2.length).toBeGreaterThan(0);
      expect(page1[0]!.id).not.toBe(page2[0]!.id);
    });

    it('finds product by slug in mock mode', async () => {
      const product = await productRepository.getProductBySlug('amforik-tas-vazo-tebehir');
      expect(product).not.toBeNull();
      expect(product?.slug).toBe('amforik-tas-vazo-tebehir');
    });

    it('returns null for non-existent slug', async () => {
      const product = await productRepository.getProductBySlug('non-existent-vazo-xyz');
      expect(product).toBeNull();
    });
  });

  describe('Live Supabase Mode', () => {
    const mockRawProduct = {
      id: 'db-prod-1',
      slug: 'db-vazo',
      name: 'DB Vazo',
      subtitle: 'DB Alt Başlık',
      description: 'DB Açıklama',
      material: 'Stoneware',
      finish: 'Mat',
      retail_price: 2500,
      compare_at_price: 3000,
      is_retail_enabled: true,
      is_wholesale_enabled: true,
      featured: true,
      is_new_arrival: false,
      is_bestseller: true,
      min_order_quantity: 6,
      starting_wholesale_price: 1800,
      product_categories: [{ category_id: 'cat-1', is_primary: true }],
      product_collections: [{ collection_id: 'col-1' }],
      product_media: [
        {
          id: 'm1',
          public_url: 'https://images.unsplash.com/photo-1',
          alt_text: 'DB Görsel',
          is_primary: true,
          sort_order: 1,
        },
      ],
      product_variants: [
        {
          id: 'v1',
          sku: 'DB-SKU-1',
          name: 'DB Varyant',
          color_name: 'Antrasit',
          color_hex: '#333333',
          finish: 'Mat',
          retail_price: 2500,
          compare_at_price: 3000,
          stock_quantity: 15,
          is_available_for_retail: true,
          is_available_for_wholesale: true,
          height_cm: 30,
          diameter_cm: 20,
          weight_kg: 2.5,
        },
      ],
      wholesale_price_tiers: [
        {
          id: 't1',
          min_quantity: 6,
          max_quantity: 19,
          discount_percentage: 25,
          unit_price: 1875,
          tier_label: '6-19 Adet',
          sort_order: 1,
        },
      ],
    };

    it('fetches and maps products with options in live mode', async () => {
      const mockClient = createMockSupabaseClient({
        products: { data: [mockRawProduct], error: null },
      });

      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      const products = await productRepository.getProducts({
        retailOnly: true,
        wholesaleOnly: true,
        isFeatured: true,
        isNewArrival: false,
        isBestseller: true,
        searchQuery: 'Vazo',
        sortBy: 'price_desc',
        categoryId: 'cat-1',
        collectionId: 'col-1',
      });
      expect(products.length).toBe(1);
      expect(products[0]?.id).toBe('db-prod-1');
    });

    it('fetches single product by slug in live mode', async () => {
      const mockClient = createMockSupabaseClient({
        products: { data: mockRawProduct, error: null },
      });

      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      const product = await productRepository.getProductBySlug('db-vazo');
      expect(product).not.toBeNull();
      expect(product?.slug).toBe('db-vazo');
    });

    it('throws error when single product query fails with non-PGRST116 error', async () => {
      const mockClient = createMockSupabaseClient({
        products: { data: null, error: { message: 'Database error', code: '500' } },
      });

      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      await expect(productRepository.getProductBySlug('db-vazo')).rejects.toThrow(
        'Failed to fetch product by slug'
      );
    });

    it('throws error when database query fails in live mode (NO silent fallback)', async () => {
      const mockClient = createMockSupabaseClient({
        products: { data: null, error: { message: 'Database connection failed' } },
      });

      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      await expect(productRepository.getProducts()).rejects.toThrow('Failed to fetch products');
    });

    it('handles PGRST116 not found error for single product query', async () => {
      const mockClient = createMockSupabaseClient({
        products: { data: null, error: { message: 'Row not found', code: 'PGRST116' } },
      });

      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      const product = await productRepository.getProductBySlug('non-existent');
      expect(product).toBeNull();
    });
  });
});
