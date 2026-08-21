import { describe, it, expect, vi, beforeEach } from 'vitest';
import { categoryRepository } from '@/entities/category/api/category-repository';
import * as supabaseModule from '@/shared/lib/supabase';
import { createMockSupabaseClient } from 'tests/mocks/supabase-mock';

describe('categoryRepository', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Mock Mode', () => {
    it('returns all mock categories sorted by order', async () => {
      const categories = await categoryRepository.getCategories();
      expect(categories.length).toBeGreaterThan(0);
      for (let i = 0; i < categories.length - 1; i++) {
        expect(categories[i]!.order).toBeLessThanOrEqual(categories[i + 1]!.order);
      }
    });

    it('finds category by valid slug', async () => {
      const cat = await categoryRepository.getCategoryBySlug('masa-ustu-vazolar');
      expect(cat).not.toBeNull();
      expect(cat?.name).toBe('Masa Üstü Vazolar');
    });

    it('returns null for non-existent category slug', async () => {
      const cat = await categoryRepository.getCategoryBySlug('non-existent-cat');
      expect(cat).toBeNull();
    });
  });

  describe('Live Supabase Mode', () => {
    const mockRawCategory = {
      id: 'cat-db-1',
      slug: 'db-kategori',
      name: 'DB Kategori',
      description: 'DB Açıklama',
      parent_id: null,
      image_url: 'https://example.com/cat.jpg',
      sort_order: 1,
    };

    it('maps categories from database query', async () => {
      const mockClient = createMockSupabaseClient({
        categories: { data: [mockRawCategory], error: null },
      });

      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      const categories = await categoryRepository.getCategories();
      expect(categories.length).toBe(1);
      expect(categories[0]?.id).toBe('cat-db-1');
      expect(categories[0]?.slug).toBe('db-kategori');
    });

    it('finds single category by slug in live mode', async () => {
      const mockClient = createMockSupabaseClient({
        categories: { data: mockRawCategory, error: null },
      });

      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      const cat = await categoryRepository.getCategoryBySlug('db-kategori');
      expect(cat).not.toBeNull();
      expect(cat?.slug).toBe('db-kategori');
    });

    it('throws error when database query fails in live mode', async () => {
      const mockClient = createMockSupabaseClient({
        categories: { data: null, error: { message: 'Database connection failed' } },
      });

      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      await expect(categoryRepository.getCategories()).rejects.toThrow('Failed to fetch categories');
    });

    it('throws error when single category query fails with generic error', async () => {
      const mockClient = createMockSupabaseClient({
        categories: { data: null, error: { message: 'Generic error', code: '500' } },
      });

      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      await expect(categoryRepository.getCategoryBySlug('db-kategori')).rejects.toThrow(
        'Failed to fetch category'
      );
    });

    it('handles PGRST116 code for single category query', async () => {
      const mockClient = createMockSupabaseClient({
        categories: { data: null, error: { message: 'Row not found', code: 'PGRST116' } },
      });

      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      const cat = await categoryRepository.getCategoryBySlug('non-existent');
      expect(cat).toBeNull();
    });
  });
});
