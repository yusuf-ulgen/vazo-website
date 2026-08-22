import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { ProductDetailPage } from '@/site/pages/ProductDetailPage';
import { renderWithRouter } from 'tests/utils/render-utils';
import { productRepository } from '@/entities/product/api/product-repository';
import { createProduct, createVariant } from 'tests/factories/product.factory';

describe('ProductDetailPage Integration Tests (/products/:slug)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders product details, purchase panel, specifications, and related items', async () => {
    const variant = createVariant({ name: 'Mat Beyaz', retailPrice: 1850, stockQuantity: 20 });
    const product = createProduct({
      id: 'p1',
      slug: 'amforik-vazo',
      name: 'Amforik Taş Vazo',
      categoryId: 'cat-1',
      variants: [variant],
    });
    const relatedProduct = createProduct({
      id: 'p2',
      slug: 'baska-vazo',
      name: 'İlgili Model',
      categoryId: 'cat-1',
    });

    vi.spyOn(productRepository, 'getProductBySlug').mockResolvedValue(product);
    vi.spyOn(productRepository, 'getProducts').mockResolvedValue([relatedProduct]);

    renderWithRouter(
      <Routes>
        <Route path="/products/:slug" element={<ProductDetailPage />} />
      </Routes>,
      { routerInitialEntries: ['/products/amforik-vazo'] }
    );

    expect(await screen.findByRole('heading', { name: 'Amforik Taş Vazo' })).toBeInTheDocument();
    expect(screen.getByText('Stokta Mevcut (20 adet)')).toBeInTheDocument();
    expect(await screen.findByText('İlgili Model')).toBeInTheDocument();
    expect(screen.getByText('BENZER ÜRÜNLER')).toBeInTheDocument();
  });

  it('renders not found state when product slug does not exist', async () => {
    vi.spyOn(productRepository, 'getProductBySlug').mockResolvedValue(null);

    renderWithRouter(
      <Routes>
        <Route path="/products/:slug" element={<ProductDetailPage />} />
      </Routes>,
      { routerInitialEntries: ['/products/olmayan-model'] }
    );

    expect(await screen.findByText('Ürün bulunamadı.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Tüm Kataloğu Gör/ })).toHaveAttribute('href', '/products');
  });

  it('renders error state when product repository throws an error', async () => {
    vi.spyOn(productRepository, 'getProductBySlug').mockRejectedValue(new Error('Sunucu bağlantısı koptu'));

    renderWithRouter(
      <Routes>
        <Route path="/products/:slug" element={<ProductDetailPage />} />
      </Routes>,
      { routerInitialEntries: ['/products/hata-modeli'] }
    );

    expect(await screen.findByText('Sunucu bağlantısı koptu')).toBeInTheDocument();
  });
});
