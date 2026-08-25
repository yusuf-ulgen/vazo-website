import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  adminCategoryRepository,
  generateSlug,
  validateSlug,
  detectCategoryCycle,
} from '@/admin/categories/api/admin-category-repository';
import * as supabaseModule from '@/shared/lib/supabase';
import { createMockSupabaseClient } from '../../mocks/supabase-mock';
import type { AdminCategory } from '@/admin/categories/types';

const mockCategoriesData: AdminCategory[] = [
  {
    id: 'cat-1',
    slug: 'masa-ustu-vazolar',
    name: 'Masa Üstü Vazolar',
    description: 'Zarif masa üstü formları',
    image_url: 'https://images.unsplash.com/photo-1',
    parent_id: null,
    active: true,
    sort_order: 1,
    seo_title: 'Masa Üstü Vazolar',
    seo_description: 'Masa üstü seramik vazo modelleri',
    created_at: '2026-08-21T00:00:00Z',
    updated_at: '2026-08-21T00:00:00Z',
  },
  {
    id: 'cat-2',
    slug: 'mini-vazolar',
    name: 'Mini Vazolar',
    description: 'Kompakt masa objeleri',
    image_url: null,
    parent_id: 'cat-1',
    active: true,
    sort_order: 2,
    seo_title: null,
    seo_description: null,
    created_at: '2026-08-21T00:00:00Z',
    updated_at: '2026-08-21T00:00:00Z',
  },
];

describe('adminCategoryRepository (Phase 2.4)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Slug and Cycle Utilities', () => {
    it('generates valid URL slug from Turkish text', () => {
      expect(generateSlug('Masa Üstü & Çiçeklikler')).toBe('masa-ustu-ciceklikler');
      expect(generateSlug('Şık Heykelsi Vazolar (2026)')).toBe('sik-heykelsi-vazolar-2026');
      expect(generateSlug('Özel Terakota Serisi')).toBe('ozel-terakota-serisi');
    });

    it('validates slug format strictly', () => {
      expect(validateSlug('masa-ustu-vazolar')).toBe(true);
      expect(validateSlug('kategori123')).toBe(true);
      expect(validateSlug('Masa Ustu')).toBe(false);
      expect(validateSlug('masa--ustu')).toBe(false);
      expect(validateSlug('masa_ustu')).toBe(false);
      expect(validateSlug('')).toBe(false);
    });

    it('detects direct self-parenting', () => {
      expect(detectCategoryCycle('cat-1', 'cat-1', mockCategoriesData)).toBe(true);
    });

    it('detects circular parent hierarchy across ancestors and descendants', () => {
      const hierarchy: AdminCategory[] = [
        { ...mockCategoriesData[0], id: 'A', parent_id: null },
        { ...mockCategoriesData[0], id: 'B', parent_id: 'A' },
        { ...mockCategoriesData[0], id: 'C', parent_id: 'B' },
      ];

      // Making A's parent C would create cycle A -> C -> B -> A
      expect(detectCategoryCycle('A', 'C', hierarchy)).toBe(true);
      // Making C's parent A is valid (A -> B -> C)
      expect(detectCategoryCycle('C', 'A', hierarchy)).toBe(false);
    });
  });

  describe('CRUD Operations with Supabase Client', () => {
    it('fetches all categories ordered by sort_order', async () => {
      const mockClient = createMockSupabaseClient({
        categories: { data: mockCategoriesData, error: null },
      });
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);

      const result = await adminCategoryRepository.getAllCategories();
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Masa Üstü Vazolar');
      expect(mockClient.from).toHaveBeenCalledWith('categories');
    });

    it('filters categories by search and active status', async () => {
      const mockClient = createMockSupabaseClient({
        categories: { data: [mockCategoriesData[0]], error: null },
      });
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);

      const result = await adminCategoryRepository.getAllCategories({
        search: 'masa',
        active: true,
      });
      expect(result).toHaveLength(1);
    });

    it('creates a new category with validated slug and properties', async () => {
      const newCategory: AdminCategory = {
        id: 'cat-new-1',
        name: 'Zemin Vazoları',
        slug: 'zemin-vazolari',
        description: 'Büyük heykelsi formlar',
        image_url: null,
        parent_id: null,
        active: true,
        sort_order: 3,
        seo_title: null,
        seo_description: null,
        created_at: '2026-08-26T00:00:00Z',
        updated_at: '2026-08-26T00:00:00Z',
      };

      const mockClient = createMockSupabaseClient({
        categories: { data: [newCategory], error: null },
      });
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);

      const created = await adminCategoryRepository.createCategory({
        name: 'Zemin Vazoları',
        slug: 'zemin-vazolari',
        description: 'Büyük heykelsi formlar',
      });

      expect(created.id).toBe('cat-new-1');
      expect(created.slug).toBe('zemin-vazolari');
    });

    it('rejects category creation with empty name or invalid slug', async () => {
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);

      await expect(
        adminCategoryRepository.createCategory({ name: '   ', slug: 'gecerli-slug' })
      ).rejects.toThrow('Kategori adı zorunludur.');

      await expect(
        adminCategoryRepository.createCategory({ name: 'Test', slug: 'Gecersiz Slug!' })
      ).rejects.toThrow('Geçersiz URL formatı');
    });

    it('handles duplicate slug database error (code 23505)', async () => {
      const mockClient = createMockSupabaseClient({
        categories: {
          data: null,
          error: { message: 'duplicate key value violates unique constraint', code: '23505' },
        },
      });
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);

      await expect(
        adminCategoryRepository.createCategory({
          name: 'Masa Üstü',
          slug: 'masa-ustu-vazolar',
        })
      ).rejects.toThrow('zaten mevcut');
    });

    it('updates an existing category', async () => {
      const updatedCat: AdminCategory = {
        ...mockCategoriesData[0],
        name: 'Güncel Masa Üstü',
      };

      const mockClient = createMockSupabaseClient({
        categories: { data: [updatedCat], error: null },
      });
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);

      const result = await adminCategoryRepository.updateCategory('cat-1', {
        name: 'Güncel Masa Üstü',
      });
      expect(result.name).toBe('Güncel Masa Üstü');
    });

    it('prevents assigning category as its own parent', async () => {
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);

      await expect(
        adminCategoryRepository.updateCategory('cat-1', { parent_id: 'cat-1' })
      ).rejects.toThrow('Bir kategori kendisinin üst kategorisi olamaz.');
    });

    it('toggles category active status', async () => {
      const toggledCat: AdminCategory = {
        ...mockCategoriesData[0],
        active: false,
      };

      const mockClient = createMockSupabaseClient({
        categories: { data: [toggledCat], error: null },
      });
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);

      const result = await adminCategoryRepository.toggleCategoryActive('cat-1', false);
      expect(result.active).toBe(false);
    });

    it('deletes category by id', async () => {
      const mockClient = createMockSupabaseClient({
        categories: { data: null, error: null },
      });
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);

      await expect(adminCategoryRepository.deleteCategory('cat-1')).resolves.toBeUndefined();
    });

    it('throws error if Supabase is unconfigured', async () => {
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(false);

      await expect(adminCategoryRepository.getAllCategories()).rejects.toThrow(
        'Supabase client is not configured'
      );
    });
  });
});
