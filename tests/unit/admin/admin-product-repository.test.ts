import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminProductRepository } from '@/admin/products/api/admin-product-repository';
import * as supabaseModule from '@/shared/lib/supabase';
import { createMockSupabaseClient } from '../../mocks/supabase-mock';

const mockProductRow = {
  id: 'prod-uuid-1',
  slug: 'anfora-vazo',
  name: 'Anfora Heykelsi Vazo',
  short_description: 'Heykelsi form',
  description: 'Antik çizgilerle tasarlanmış seramik vazo.',
  status: 'draft',
  primary_category_id: 'cat-1',
  material: 'Stoneware Seramik',
  finish: 'Mat Sırlı',
  care_instructions: 'Nemli bezle siliniz',
  origin_country: 'Türkiye',
  retail_price: 1850,
  compare_at_price: 2200,
  retail_enabled: true,
  wholesale_enabled: true,
  wholesale_moq: 6,
  wholesale_lead_time_days: 14,
  featured: true,
  new_arrival: false,
  bestseller: true,
  tags: ['seramik', 'heykelsi'],
  seo_title: 'Anfora Vazo',
  seo_description: 'Anfora vazo modelleri',
  created_at: '2026-08-21T00:00:00Z',
  updated_at: '2026-08-21T00:00:00Z',
  product_media: [
    { url: 'https://images.unsplash.com/photo-anfora', is_primary: true, sort_order: 0 },
  ],
  product_variants: [{ id: 'var-1' }, { id: 'var-2' }],
};

describe('adminProductRepository (Phase 2.5)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Server-Side Pagination & Filtering', () => {
    it('fetches products with server-side pagination range and ordering', async () => {
      const mockClient = createMockSupabaseClient({
        products: { data: [mockProductRow], error: null },
      });
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);

      const result = await adminProductRepository.getProducts({
        page: 2,
        pageSize: 10,
        sortBy: 'price_desc',
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Anfora Heykelsi Vazo');
      expect(result.data[0].thumbnail_url).toBe('https://images.unsplash.com/photo-anfora');
      expect(result.data[0].variants_count).toBe(2);
      expect(mockClient.from).toHaveBeenCalledWith('products');
    });

    it('filters products by search query, status, category, and sales channels', async () => {
      const mockClient = createMockSupabaseClient({
        products: { data: [mockProductRow], error: null },
      });
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);

      const result = await adminProductRepository.getProducts({
        search: 'anfora',
        status: 'draft',
        categoryId: 'cat-1',
        retailEnabled: true,
        wholesaleEnabled: true,
        featured: true,
        bestseller: true,
      });

      expect(result.data).toHaveLength(1);
    });
  });

  describe('CRUD Operations', () => {
    it('creates a new product and synchronizes category and collection relations', async () => {
      const createdRow = {
        ...mockProductRow,
        id: 'prod-new-uuid',
        name: 'Monolitik Zemin Vazosu',
        slug: 'monolitik-zemin-vazosu',
      };

      const mockClient = createMockSupabaseClient({
        products: { data: [createdRow], error: null },
        product_categories: { data: [{ category_id: 'cat-1' }, { category_id: 'cat-2' }], error: null },
        product_collections: { data: [{ collection_id: 'col-1' }], error: null },
      });
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);

      const newProduct = await adminProductRepository.createProduct({
        name: 'Monolitik Zemin Vazosu',
        slug: 'monolitik-zemin-vazosu',
        short_description: 'Büyük mekan objesi',
        description: 'Monolitik tasarım',
        material: 'Ham Terakota',
        finish: 'Pürüzlü Mat',
        retail_price: 3400,
        primary_category_id: 'cat-1',
        category_ids: ['cat-2'],
        collection_ids: ['col-1'],
      });

      expect(newProduct.id).toBe('prod-new-uuid');
      expect(mockClient.from).toHaveBeenCalledWith('products');
      expect(mockClient.from).toHaveBeenCalledWith('product_categories');
      expect(mockClient.from).toHaveBeenCalledWith('product_collections');
    });

    it('rejects product creation when required fields are missing or price is invalid', async () => {
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);

      await expect(
        adminProductRepository.createProduct({
          name: '   ',
          slug: 'gecerli-slug',
          short_description: 'Özet',
          description: 'Açıklama',
          material: 'Seramik',
          finish: 'Mat',
          retail_price: 100,
        })
      ).rejects.toThrow('Ürün adı zorunludur.');

      await expect(
        adminProductRepository.createProduct({
          name: 'Ürün',
          slug: 'Gecersiz Slug!',
          short_description: 'Özet',
          description: 'Açıklama',
          material: 'Seramik',
          finish: 'Mat',
          retail_price: 100,
        })
      ).rejects.toThrow('Geçersiz URL formatı');

      await expect(
        adminProductRepository.createProduct({
          name: 'Ürün',
          slug: 'gecerli-slug',
          short_description: 'Özet',
          description: 'Açıklama',
          material: 'Seramik',
          finish: 'Mat',
          retail_price: -50,
        })
      ).rejects.toThrow('Perakende fiyatı negatif olamaz.');

      await expect(
        adminProductRepository.createProduct({
          name: 'Ürün',
          slug: 'gecerli-slug',
          short_description: 'Özet',
          description: 'Açıklama',
          material: 'Seramik',
          finish: 'Mat',
          retail_price: 500,
          compare_at_price: 400,
        })
      ).rejects.toThrow('Eski fiyat (karşılaştırma fiyatı) mevcut perakende fiyatından düşük olamaz.');
    });

    it('updates an existing product and its relations', async () => {
      const updatedRow = {
        ...mockProductRow,
        name: 'Güncel Anfora Vazo',
        retail_price: 1950,
      };

      const mockClient = createMockSupabaseClient({
        products: { data: [updatedRow], error: null },
        product_categories: { data: [{ category_id: 'cat-1' }], error: null },
        product_collections: { data: [], error: null },
      });
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);

      const result = await adminProductRepository.updateProduct('prod-uuid-1', {
        name: 'Güncel Anfora Vazo',
        retail_price: 1950,
        category_ids: ['cat-1'],
        collection_ids: [],
      });

      expect(result.name).toBe('Güncel Anfora Vazo');
      expect(mockClient.from).toHaveBeenCalledWith('product_categories');
      expect(mockClient.from).toHaveBeenCalledWith('product_collections');
    });

    it('updates product status (workflow draft -> published -> archived)', async () => {
      const publishedRow = {
        ...mockProductRow,
        status: 'published',
      };

      const mockClient = createMockSupabaseClient({
        products: { data: [publishedRow], error: null },
        product_categories: { data: [], error: null },
        product_collections: { data: [], error: null },
      });
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);

      const result = await adminProductRepository.updateProductStatus('prod-uuid-1', 'published');
      expect(result.status).toBe('published');
    });

    it('deletes product by ID', async () => {
      const mockClient = createMockSupabaseClient({
        products: { data: null, error: null },
      });
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);

      await expect(adminProductRepository.deleteProduct('prod-uuid-1')).resolves.toBeUndefined();
    });

    it('handles duplicate slug error (code 23505)', async () => {
      const mockClient = createMockSupabaseClient({
        products: {
          data: null,
          error: { message: 'duplicate key value violates unique constraint', code: '23505' },
        },
      });
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);

      await expect(
        adminProductRepository.createProduct({
          name: 'Anfora Vazo',
          slug: 'anfora-vazo',
          short_description: 'Özet',
          description: 'Açıklama',
          material: 'Seramik',
          finish: 'Mat',
          retail_price: 1000,
        })
      ).rejects.toThrow('zaten mevcut');
    });

    it('throws error when Supabase client is not configured', async () => {
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(false);

      await expect(adminProductRepository.getProducts()).rejects.toThrow(
        'Supabase client is not configured'
      );
    });
  });
});
