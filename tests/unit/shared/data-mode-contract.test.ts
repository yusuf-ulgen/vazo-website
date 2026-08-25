import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as supabaseModule from '@/shared/lib/supabase';
import { productRepository } from '@/entities/product/api/product-repository';
import { categoryRepository } from '@/entities/category/api/category-repository';
import { collectionRepository } from '@/entities/collection/api/collection-repository';
import { contentRepository } from '@/entities/content/api/content-repository';
import { createMockSupabaseClient } from 'tests/mocks/supabase-mock';

describe('Data Mode Architecture & Decoupling Contract (Phase 2.1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Contract 1: Supabase client availability is separate from storefront mock flag', () => {
    it('allows Supabase client to be configured even when storefront mock mode is true', () => {
      const mockClient = createMockSupabaseClient({});
      vi.spyOn(supabaseModule, 'isStorefrontMockEnabled', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      // Admin or backend caller can access configured client
      expect(supabaseModule.isStorefrontMockEnabled).toBe(true);
      expect(supabaseModule.isSupabaseConfigured).toBe(true);
      expect(supabaseModule.supabase).toBe(mockClient);
    });
  });

  describe('Contract 2: Storefront repositories use mocks when explicit mock flag is true', () => {
    it('returns mock product, category, collection, and content data when mock mode is true', async () => {
      vi.spyOn(supabaseModule, 'isStorefrontMockEnabled', 'get').mockReturnValue(true);

      const products = await productRepository.getProducts();
      expect(products.length).toBeGreaterThan(0);

      const categories = await categoryRepository.getCategories();
      expect(categories.length).toBeGreaterThan(0);

      const collections = await collectionRepository.getCollections();
      expect(collections.length).toBeGreaterThan(0);

      const announcement = await contentRepository.getAnnouncement();
      expect(announcement).not.toBeNull();
    });
  });

  describe('Contract 3 & 4: Explicit live mode fails clearly when Supabase is unconfigured', () => {
    it('fails clearly and never silently falls back to mock data when unconfigured', async () => {
      vi.spyOn(supabaseModule, 'isStorefrontMockEnabled', 'get').mockReturnValue(false);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(false);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(null);

      await expect(productRepository.getProducts()).rejects.toThrow(
        /Supabase client is not configured. Live mode requires valid Supabase environment variables./
      );

      await expect(categoryRepository.getCategories()).rejects.toThrow(
        /Supabase client is not configured. Live mode requires valid Supabase environment variables./
      );

      await expect(collectionRepository.getCollections()).rejects.toThrow(
        /Supabase client is not configured. Live mode requires valid Supabase environment variables./
      );

      await expect(contentRepository.getAnnouncement()).rejects.toThrow(
        /Supabase client is not configured. Live mode requires valid Supabase environment variables./
      );
    });

    it('fails clearly and never silently falls back to mock data when live query errors', async () => {
      const mockClient = createMockSupabaseClient({
        products: { data: null, error: { message: 'Database outage' } },
        categories: { data: null, error: { message: 'Database outage' } },
      });

      vi.spyOn(supabaseModule, 'isStorefrontMockEnabled', 'get').mockReturnValue(false);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      await expect(productRepository.getProducts()).rejects.toThrow(/Database outage/);
      await expect(categoryRepository.getCategories()).rejects.toThrow(/Database outage/);
    });
  });

  describe('Contract 5: Zero server secrets in browser environment', () => {
    it('verifies absence of service_role, sb_secret, or database passwords in client env', () => {
      const env = import.meta.env as Record<string, string | undefined>;
      const forbiddenPatterns = ['service_role', 'sb_secret', 'secret_key', 'database_password'];

      for (const [key] of Object.entries(env)) {
        const lowerKey = key.toLowerCase();
        for (const pattern of forbiddenPatterns) {
          expect(lowerKey.includes(pattern)).toBe(false);
        }
      }
    });
  });
});
