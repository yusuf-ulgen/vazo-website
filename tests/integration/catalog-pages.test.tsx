import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { CatalogPage } from '@/site/pages/CatalogPage';
import { renderWithRouter } from 'tests/utils/render-utils';
import { productRepository } from '@/entities/product/api/product-repository';

describe('Catalog Page Integration Tests (/products, /new, /bestsellers)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders standard /products catalog with all models', async () => {
    renderWithRouter(<CatalogPage mode="all" />, { routerInitialEntries: ['/products'] });

    const headings = await screen.findAllByText('Tüm Vazo Koleksiyonu');
    expect(headings.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Tümü')).toBeInTheDocument();
  });

  it('renders /new with explicit new arrival mode', async () => {
    renderWithRouter(<CatalogPage mode="new" />, { routerInitialEntries: ['/new'] });

    const headings = await screen.findAllByText('Yeni Gelenler');
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it('renders /bestsellers with bestseller mode', async () => {
    renderWithRouter(<CatalogPage mode="bestseller" />, { routerInitialEntries: ['/bestsellers'] });

    const headings = await screen.findAllByText('Çok Satan Vazo Modelleri');
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it('filters by category button click and sorting', async () => {
    renderWithRouter(<CatalogPage mode="all" />, { routerInitialEntries: ['/products'] });

    const categoryBtn = await screen.findByRole('button', { name: 'Masa Üstü Vazolar' });
    fireEvent.click(categoryBtn);

    const sortSelect = screen.getByLabelText('Sıralama seçeneği');
    fireEvent.change(sortSelect, { target: { value: 'price_asc' } });

    expect(screen.getAllByText('Masa Üstü Vazolar').length).toBeGreaterThanOrEqual(1);
  });

  it('handles empty results and clears filters', async () => {
    renderWithRouter(<CatalogPage mode="all" />, {
      routerInitialEntries: ['/products?material=BulunmayanMateryalXYZ'],
    });

    expect(await screen.findByText('Eşleşen Ürün Bulunamadı')).toBeInTheDocument();

    const clearBtn = screen.getByRole('button', { name: 'Filtreleri Temizle' });
    fireEvent.click(clearBtn);

    expect(await screen.findAllByText('Tüm Vazo Koleksiyonu')).toBeDefined();
  });

  it('displays error message when repository fails to load products', async () => {
    vi.spyOn(productRepository, 'getProducts').mockRejectedValue(new Error('Ağ Hatası'));

    renderWithRouter(<CatalogPage mode="all" />);

    expect(await screen.findByText('Katalog Yüklenemedi')).toBeInTheDocument();
    expect(screen.getByText('Yeniden Dene')).toBeInTheDocument();
  });
});
