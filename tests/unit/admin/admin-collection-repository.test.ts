import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminCollectionRepository } from '@/admin/collections/api/admin-collection-repository';
import * as supabaseModule from '@/shared/lib/supabase';
import { createMockSupabaseClient } from '../../mocks/supabase-mock';
import type { AdminCollection } from '@/admin/collections/types';

const mockCollectionsData: AdminCollection[] = [
  {
    id: 'col-1',
    slug: 'nordik-sessizlik',
    name: 'Nordik Sessizlik Serisi',
    subtitle: 'Yumuşak kavisler ve mineral mat sırlı yüzeyler',
    description: 'Kuzey doğasından ilham alan seri',
    story_markdown: '# Nordik Sessizlik\n\nZamansız formlar...',
    hero_image_url: 'https://images.unsplash.com/photo-nordik',
    active: true,
    featured: true,
    sort_order: 1,
    seo_title: 'Nordik Sessizlik Koleksiyonu',
    seo_description: 'Nordik seramik vazo modelleri',
    created_at: '2026-08-21T00:00:00Z',
    updated_at: '2026-08-21T00:00:00Z',
  },
  {
    id: 'col-2',
    slug: 'amforik-kivrimlar',
    name: 'Amforik Kıvrımlar 2026',
    subtitle: 'Antik hatların çağdaş brütalizm ile buluşması',
    description: 'Akdeniz heykelsi serisi',
    story_markdown: null,
    hero_image_url: null,
    active: true,
    featured: false,
    sort_order: 2,
    seo_title: null,
    seo_description: null,
    created_at: '2026-08-21T00:00:00Z',
    updated_at: '2026-08-21T00:00:00Z',
  },
];

describe('adminCollectionRepository (Phase 2.4)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('CRUD Operations with Supabase Client', () => {
    it('fetches all collections ordered by sort_order', async () => {
      const mockClient = createMockSupabaseClient({
        collections: { data: mockCollectionsData, error: null },
      });
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);

      const result = await adminCollectionRepository.getAllCollections();
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Nordik Sessizlik Serisi');
      expect(mockClient.from).toHaveBeenCalledWith('collections');
    });

    it('filters collections by search, active, and featured status', async () => {
      const mockClient = createMockSupabaseClient({
        collections: { data: [mockCollectionsData[0]], error: null },
      });
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);

      const result = await adminCollectionRepository.getAllCollections({
        search: 'nordik',
        active: true,
        featured: true,
      });
      expect(result).toHaveLength(1);
    });

    it('creates a new collection with validated slug and properties', async () => {
      const newCollection: AdminCollection = {
        id: 'col-new-1',
        name: 'Monokrom Brütalizm',
        slug: 'monokrom-brutalizm',
        subtitle: 'Antrasit ve bazalt taşın gücü',
        description: 'Monolitik mimari serisi',
        story_markdown: null,
        hero_image_url: null,
        active: true,
        featured: true,
        sort_order: 3,
        seo_title: null,
        seo_description: null,
        created_at: '2026-08-26T00:00:00Z',
        updated_at: '2026-08-26T00:00:00Z',
      };

      const mockClient = createMockSupabaseClient({
        collections: { data: [newCollection], error: null },
      });
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);

      const created = await adminCollectionRepository.createCollection({
        name: 'Monokrom Brütalizm',
        slug: 'monokrom-brutalizm',
        subtitle: 'Antrasit ve bazalt taşın gücü',
        featured: true,
      });

      expect(created.id).toBe('col-new-1');
      expect(created.featured).toBe(true);
    });

    it('rejects collection creation with empty name or invalid slug', async () => {
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);

      await expect(
        adminCollectionRepository.createCollection({ name: '   ', slug: 'gecerli-slug' })
      ).rejects.toThrow('Koleksiyon adı zorunludur.');

      await expect(
        adminCollectionRepository.createCollection({ name: 'Koleksiyon', slug: 'Gecersiz Slug!' })
      ).rejects.toThrow('Geçersiz URL formatı');
    });

    it('handles duplicate slug database error (code 23505)', async () => {
      const mockClient = createMockSupabaseClient({
        collections: {
          data: null,
          error: { message: 'duplicate key value violates unique constraint', code: '23505' },
        },
      });
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);

      await expect(
        adminCollectionRepository.createCollection({
          name: 'Nordik Sessizlik',
          slug: 'nordik-sessizlik',
        })
      ).rejects.toThrow('zaten mevcut');
    });

    it('updates an existing collection', async () => {
      const updatedCol: AdminCollection = {
        ...mockCollectionsData[0],
        name: 'Güncel Nordik Seri',
      };

      const mockClient = createMockSupabaseClient({
        collections: { data: [updatedCol], error: null },
      });
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);

      const result = await adminCollectionRepository.updateCollection('col-1', {
        name: 'Güncel Nordik Seri',
      });
      expect(result.name).toBe('Güncel Nordik Seri');
    });

    it('toggles collection active and featured status', async () => {
      const toggledCol: AdminCollection = {
        ...mockCollectionsData[0],
        featured: false,
        active: false,
      };

      const mockClient = createMockSupabaseClient({
        collections: { data: [toggledCol], error: null },
      });
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);

      const resFeatured = await adminCollectionRepository.toggleCollectionFeatured('col-1', false);
      expect(resFeatured.featured).toBe(false);

      const resActive = await adminCollectionRepository.toggleCollectionActive('col-1', false);
      expect(resActive.active).toBe(false);
    });

    it('deletes collection by id', async () => {
      const mockClient = createMockSupabaseClient({
        collections: { data: null, error: null },
      });
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);

      await expect(adminCollectionRepository.deleteCollection('col-1')).resolves.toBeUndefined();
    });

    it('throws error if Supabase is unconfigured', async () => {
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(false);

      await expect(adminCollectionRepository.getAllCollections()).rejects.toThrow(
        'Supabase client is not configured'
      );
    });
  });
});
