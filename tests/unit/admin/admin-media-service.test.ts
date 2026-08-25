import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  adminMediaService,
  validateMediaFile,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  STORAGE_BUCKET,
} from '@/admin/media/api/admin-media-service';
import * as supabaseModule from '@/shared/lib/supabase';
import { createMockSupabaseClient } from '../../mocks/supabase-mock';

function createMockFile(name: string, size: number, type: string): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

describe('adminMediaService (Phase 2.7)', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockSupabaseClient();
    vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);
    vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
  });

  describe('File Validation & Security Constraints', () => {
    it('allows valid JPEG, PNG and WebP files under 5 MB', () => {
      const validJpg = createMockFile('product.jpg', 2 * 1024 * 1024, 'image/jpeg');
      const validPng = createMockFile('product.png', 1 * 1024 * 1024, 'image/png');
      const validWebp = createMockFile('product.webp', 3 * 1024 * 1024, 'image/webp');

      expect(() => validateMediaFile(validJpg)).not.toThrow();
      expect(() => validateMediaFile(validPng)).not.toThrow();
      expect(() => validateMediaFile(validWebp)).not.toThrow();
    });

    it('rejects SVG files to prevent XSS script injection vectors', () => {
      const svgFile = createMockFile('vector.svg', 500 * 1024, 'image/svg+xml');
      expect(() => validateMediaFile(svgFile)).toThrow(/Desteklenmeyen dosya formatı/);
    });

    it('rejects files larger than 5 MB', () => {
      const oversizedFile = createMockFile('giant.jpg', 6 * 1024 * 1024, 'image/jpeg');
      expect(() => validateMediaFile(oversizedFile)).toThrow(/Maksimum izin verilen boyut: 5 MB/);
    });

    it('confirms ALLOWED_MIME_TYPES matches strictly allowed formats', () => {
      expect(ALLOWED_MIME_TYPES).toEqual(['image/jpeg', 'image/png', 'image/webp']);
      expect(MAX_FILE_SIZE_BYTES).toBe(5 * 1024 * 1024);
      expect(STORAGE_BUCKET).toBe('public-media');
    });
  });

  describe('Product Media Retrieval', () => {
    it('fetches media items ordered by sort_order and maps correctly', async () => {
      mockClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'media-1',
                    product_id: 'prod-1',
                    variant_id: 'var-1',
                    media_type: 'image',
                    url: 'https://storage.example.com/public-media/products/prod-1/uuid1.jpg',
                    alt_text: 'Ana Görsel',
                    width: 1200,
                    height: 1600,
                    sort_order: 1,
                    is_primary: true,
                    storage_bucket: 'public-media',
                    storage_path: 'products/prod-1/uuid1.jpg',
                    mime_type: 'image/jpeg',
                    file_size_bytes: 1048576,
                    created_at: '2026-08-26T00:00:00Z',
                    product_variants: {
                      sku: 'VAZO-01',
                      variant_name: 'Antrasit',
                    },
                  },
                ],
                error: null,
              }),
            }),
          }),
        }),
      } as never);

      const items = await adminMediaService.getProductMedia('prod-1');

      expect(items).toHaveLength(1);
      expect(items[0].is_primary).toBe(true);
      expect(items[0].variant_sku).toBe('VAZO-01');
      expect(items[0].storage_path).toBe('products/prod-1/uuid1.jpg');
    });
  });

  describe('Upload & Orphan Cleanup Lifecycle', () => {
    it('uploads to Supabase storage and persists metadata into database', async () => {
      const mockFile = createMockFile('vase-hero.jpg', 1024 * 1024, 'image/jpeg');

      mockClient.storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'products/prod-1/uuid.jpg' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.supabase.co/storage/v1/object/public/public-media/products/prod-1/uuid.jpg' },
        }),
      });

      mockClient.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'med-new',
                product_id: 'prod-1',
                variant_id: null,
                media_type: 'image',
                url: 'https://example.supabase.co/storage/v1/object/public/public-media/products/prod-1/uuid.jpg',
                alt_text: 'Vazo Ana Görsel',
                sort_order: 1,
                is_primary: true,
                storage_bucket: 'public-media',
                storage_path: 'products/prod-1/uuid.jpg',
                mime_type: 'image/jpeg',
                file_size_bytes: 1048576,
                created_at: '2026-08-26T00:00:00Z',
              },
              error: null,
            }),
          }),
        }),
      } as never);

      const result = await adminMediaService.uploadProductMedia('prod-1', mockFile, {
        altText: 'Vazo Ana Görsel',
        isPrimary: true,
        sortOrder: 1,
      });

      expect(result.id).toBe('med-new');
      expect(result.is_primary).toBe(true);
      expect(result.url).toContain('products/prod-1/uuid.jpg');
    });

    it('cleans up orphan Storage object if database metadata insert fails', async () => {
      const mockFile = createMockFile('fail-insert.png', 512 * 1024, 'image/png');
      const removeSpy = vi.fn().mockResolvedValue({ data: [], error: null });

      mockClient.storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'products/prod-1/fail.png' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.supabase.co/storage/v1/object/public/public-media/products/prod-1/fail.png' },
        }),
        remove: removeSpy,
      });

      mockClient.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database insert failed (e.g. FK violation)' },
            }),
          }),
        }),
      } as never);

      await expect(
        adminMediaService.uploadProductMedia('prod-1', mockFile, { altText: 'Taslak' })
      ).rejects.toThrow(/Görsel veritabanına kaydedilemedi/);

      // Verify orphan cleanup occurred
      expect(removeSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Media Deletion & Storage Removal', () => {
    it('deletes database record and purges file from Supabase Storage', async () => {
      const removeSpy = vi.fn().mockResolvedValue({ data: [], error: null });

      mockClient.storage.from.mockReturnValue({
        remove: removeSpy,
      });

      mockClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { storage_path: 'products/prod-1/to-delete.jpg', storage_bucket: 'public-media' },
              error: null,
            }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      } as never);

      await adminMediaService.deleteProductMedia('med-123');

      expect(removeSpy).toHaveBeenCalledWith(['products/prod-1/to-delete.jpg']);
    });
  });

  describe('Primary Image & Reordering Operations', () => {
    it('sets primary image and unsets others for the same product', async () => {
      const updateSpy = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockClient.from.mockReturnValue({
        update: updateSpy,
      } as never);

      await adminMediaService.setPrimaryImage('prod-1', 'med-target');

      expect(updateSpy).toHaveBeenCalledWith({ is_primary: false });
      expect(updateSpy).toHaveBeenCalledWith({ is_primary: true });
    });

    it('reorders media items by sort_order', async () => {
      const updateSpy = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockClient.from.mockReturnValue({
        update: updateSpy,
      } as never);

      await adminMediaService.reorderMedia([
        { id: 'm-2', sort_order: 1 },
        { id: 'm-1', sort_order: 2 },
      ]);

      expect(updateSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Generic Asset Upload', () => {
    it('uploads category or collection banner to appropriate prefix', async () => {
      const file = createMockFile('hero.webp', 800 * 1024, 'image/webp');

      mockClient.storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'categories/cat-1/uuid.webp' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.supabase.co/public-media/categories/cat-1/uuid.webp' },
        }),
      });

      const result = await adminMediaService.uploadGenericAsset('categories', file, 'cat-1');

      expect(result.url).toContain('categories/cat-1/');
      expect(result.mimeType).toBe('image/webp');
    });
  });
});
