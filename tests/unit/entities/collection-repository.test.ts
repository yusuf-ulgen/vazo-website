import { describe, it, expect, vi, beforeEach } from 'vitest';
import { collectionRepository } from '@/entities/collection/api/collection-repository';
import * as supabaseModule from '@/shared/lib/supabase';
import { createMockSupabaseClient } from 'tests/mocks/supabase-mock';

describe('collectionRepository', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Mock Mode', () => {
    it('returns all mock collections sorted by order', async () => {
      const collections = await collectionRepository.getCollections();
      expect(collections.length).toBeGreaterThan(0);
      for (let i = 0; i < collections.length - 1; i++) {
        expect(collections[i]!.order).toBeLessThanOrEqual(collections[i + 1]!.order);
      }
    });

    it('finds collection by valid slug', async () => {
      const col = await collectionRepository.getCollectionBySlug('nordik-sessizlik');
      expect(col).not.toBeNull();
      expect(col?.name).toBe('Nordik Sessizlik Serisi');
    });

    it('returns null for non-existent collection slug', async () => {
      const col = await collectionRepository.getCollectionBySlug('non-existent-col');
      expect(col).toBeNull();
    });
  });

  describe('Live Supabase Mode', () => {
    const mockRawCollection = {
      id: 'col-db-1',
      slug: 'db-koleksiyon',
      name: 'DB Koleksiyon',
      subtitle: 'DB Alt Başlık',
      description: 'DB Açıklama',
      hero_image_url: 'https://example.com/col.jpg',
      featured: true,
      sort_order: 1,
    };

    it('throws error when live mode is requested without Supabase configuration (NO silent mock fallback)', async () => {
      vi.spyOn(supabaseModule, 'isStorefrontMockEnabled', 'get').mockReturnValue(false);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(false);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(null);

      await expect(collectionRepository.getCollections()).rejects.toThrow(
        'Supabase client is not configured. Live mode requires valid Supabase environment variables.'
      );
      await expect(collectionRepository.getCollectionBySlug('nordik-sessizlik')).rejects.toThrow(
        'Supabase client is not configured. Live mode requires valid Supabase environment variables.'
      );
    });

    it('maps collections from database query', async () => {
      const mockClient = createMockSupabaseClient({
        collections: { data: [mockRawCollection], error: null },
      });

      vi.spyOn(supabaseModule, 'isStorefrontMockEnabled', 'get').mockReturnValue(false);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      const collections = await collectionRepository.getCollections();
      expect(collections.length).toBe(1);
      expect(collections[0]?.id).toBe('col-db-1');
      expect(collections[0]?.isFeaturedOnHomepage).toBe(true);
    });

    it('finds single collection by slug in live mode', async () => {
      const mockClient = createMockSupabaseClient({
        collections: { data: mockRawCollection, error: null },
      });

      vi.spyOn(supabaseModule, 'isStorefrontMockEnabled', 'get').mockReturnValue(false);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      const col = await collectionRepository.getCollectionBySlug('db-koleksiyon');
      expect(col).not.toBeNull();
      expect(col?.slug).toBe('db-koleksiyon');
    });

    it('throws error when database query fails in live mode', async () => {
      const mockClient = createMockSupabaseClient({
        collections: { data: null, error: { message: 'Database connection failed' } },
      });

      vi.spyOn(supabaseModule, 'isStorefrontMockEnabled', 'get').mockReturnValue(false);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      await expect(collectionRepository.getCollections()).rejects.toThrow('Failed to fetch collections');
    });

    it('throws error when single collection query fails with generic error', async () => {
      const mockClient = createMockSupabaseClient({
        collections: { data: null, error: { message: 'Generic error', code: '500' } },
      });

      vi.spyOn(supabaseModule, 'isStorefrontMockEnabled', 'get').mockReturnValue(false);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      await expect(collectionRepository.getCollectionBySlug('db-koleksiyon')).rejects.toThrow(
        'Failed to fetch collection'
      );
    });

    it('handles PGRST116 code for single collection query', async () => {
      const mockClient = createMockSupabaseClient({
        collections: { data: null, error: { message: 'Row not found', code: 'PGRST116' } },
      });

      vi.spyOn(supabaseModule, 'isStorefrontMockEnabled', 'get').mockReturnValue(false);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      const col = await collectionRepository.getCollectionBySlug('non-existent');
      expect(col).toBeNull();
    });
  });
});
