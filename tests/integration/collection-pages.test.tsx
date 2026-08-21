import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { CollectionsIndexPage } from '@/site/pages/CollectionsIndexPage';
import { CollectionDetailPage } from '@/site/pages/CollectionDetailPage';
import { renderWithRouter } from 'tests/utils/render-utils';
import { collectionRepository } from '@/entities/collection/api/collection-repository';
import { createCollection } from 'tests/factories/collection.factory';
import { createProduct } from 'tests/factories/product.factory';
import { productRepository } from '@/entities/product/api/product-repository';

describe('Collection Pages Integration Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('CollectionsIndexPage (/collections)', () => {
    it('renders all collections with editorial hero and cards', async () => {
      const col = createCollection({ name: 'Nordik Sessizlik Koleksiyonu' });
      vi.spyOn(collectionRepository, 'getCollections').mockResolvedValue([col]);

      renderWithRouter(<CollectionsIndexPage />, { routerInitialEntries: ['/collections'] });

      expect(await screen.findByText('Kürasyon & Seriler')).toBeInTheDocument();
      expect(screen.getByText('Nordik Sessizlik Koleksiyonu')).toBeInTheDocument();
    });
  });

  describe('CollectionDetailPage (/collections/:slug)', () => {
    it('renders collection story and linked products for valid slug', async () => {
      const col = createCollection({ slug: 'nordik-seri', name: 'Nordik Seri' });
      const prod = createProduct({ name: 'Nordik Vazo', collectionIds: [col.id] });

      vi.spyOn(collectionRepository, 'getCollectionBySlug').mockResolvedValue(col);
      vi.spyOn(productRepository, 'getProducts').mockResolvedValue([prod]);

      renderWithRouter(
        <Routes>
          <Route path="/collections/:slug" element={<CollectionDetailPage />} />
        </Routes>,
        { routerInitialEntries: ['/collections/nordik-seri'] }
      );

      expect(await screen.findByText('Nordik Seri')).toBeInTheDocument();
      expect(await screen.findByText('Nordik Vazo')).toBeInTheDocument();
    });

    it('renders empty products state when collection has no products', async () => {
      const col = createCollection({ slug: 'bos-koleksiyon', name: 'Boş Koleksiyon' });
      vi.spyOn(collectionRepository, 'getCollectionBySlug').mockResolvedValue(col);
      vi.spyOn(productRepository, 'getProducts').mockResolvedValue([]);

      renderWithRouter(
        <Routes>
          <Route path="/collections/:slug" element={<CollectionDetailPage />} />
        </Routes>,
        { routerInitialEntries: ['/collections/bos-koleksiyon'] }
      );

      expect(await screen.findByText('Bu koleksiyonda henüz ürün yer almıyor')).toBeInTheDocument();
    });

    it('renders error state when collection is not found', async () => {
      vi.spyOn(collectionRepository, 'getCollectionBySlug').mockResolvedValue(null);

      renderWithRouter(
        <Routes>
          <Route path="/collections/:slug" element={<CollectionDetailPage />} />
        </Routes>,
        { routerInitialEntries: ['/collections/bulunamayan'] }
      );

      expect(await screen.findByText('Koleksiyon bulunamadı.')).toBeInTheDocument();
    });

    it('renders error state when collection repository rejects', async () => {
      vi.spyOn(collectionRepository, 'getCollectionBySlug').mockRejectedValue(new Error('Koleksiyon yüklenemedi'));

      renderWithRouter(
        <Routes>
          <Route path="/collections/:slug" element={<CollectionDetailPage />} />
        </Routes>,
        { routerInitialEntries: ['/collections/hata-koleksiyon'] }
      );

      expect(await screen.findByText('Koleksiyon yüklenemedi')).toBeInTheDocument();
    });
  });
});
