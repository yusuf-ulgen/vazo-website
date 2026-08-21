import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { CategoryPage } from '@/site/pages/CategoryPage';
import { renderWithRouter } from 'tests/utils/render-utils';
import { categoryRepository } from '@/entities/category/api/category-repository';
import { createCategory } from 'tests/factories/category.factory';
import { createProduct } from 'tests/factories/product.factory';
import { productRepository } from '@/entities/product/api/product-repository';

describe('CategoryPage Integration Tests (/categories/:slug)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders category details and matching product grid for valid slug', async () => {
    const mockCat = createCategory({ slug: 'masa-ustu', name: 'Masa Üstü Serisi' });
    const mockProd = createProduct({ name: 'Konsol Vazosu', categoryIds: [mockCat.id] });

    vi.spyOn(categoryRepository, 'getCategoryBySlug').mockResolvedValue(mockCat);
    vi.spyOn(productRepository, 'getProducts').mockResolvedValue([mockProd]);

    renderWithRouter(
      <Routes>
        <Route path="/categories/:slug" element={<CategoryPage />} />
      </Routes>,
      { routerInitialEntries: ['/categories/masa-ustu'] }
    );

    expect(await screen.findByText('Masa Üstü Serisi')).toBeInTheDocument();
    expect(await screen.findByText('Konsol Vazosu')).toBeInTheDocument();

    const sortSelect = screen.getByLabelText('Sıralama');
    fireEvent.change(sortSelect, { target: { value: 'price_asc' } });
  });

  it('renders empty products state when category has no products', async () => {
    const mockCat = createCategory({ slug: 'bos-kategori', name: 'Boş Kategori' });
    vi.spyOn(categoryRepository, 'getCategoryBySlug').mockResolvedValue(mockCat);
    vi.spyOn(productRepository, 'getProducts').mockResolvedValue([]);

    renderWithRouter(
      <Routes>
        <Route path="/categories/:slug" element={<CategoryPage />} />
      </Routes>,
      { routerInitialEntries: ['/categories/bos-kategori'] }
    );

    expect(await screen.findByText('Bu kategoride ürün bulunmuyor')).toBeInTheDocument();
  });

  it('renders not found error state when category does not exist', async () => {
    vi.spyOn(categoryRepository, 'getCategoryBySlug').mockResolvedValue(null);

    renderWithRouter(
      <Routes>
        <Route path="/categories/:slug" element={<CategoryPage />} />
      </Routes>,
      { routerInitialEntries: ['/categories/bulunamayan'] }
    );

    expect(await screen.findByText('Kategori bulunamadı.')).toBeInTheDocument();
  });

  it('renders error state when category repository rejects', async () => {
    vi.spyOn(categoryRepository, 'getCategoryBySlug').mockRejectedValue(new Error('Kategori yüklenirken hata'));

    renderWithRouter(
      <Routes>
        <Route path="/categories/:slug" element={<CategoryPage />} />
      </Routes>,
      { routerInitialEntries: ['/categories/hata-kategori'] }
    );

    expect(await screen.findByText('Kategori yüklenirken hata')).toBeInTheDocument();
  });
});
