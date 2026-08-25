import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminProductsPage } from '@/admin/products/pages/AdminProductsPage';
import { adminProductRepository } from '@/admin/products/api/admin-product-repository';
import { adminCategoryRepository } from '@/admin/categories/api/admin-category-repository';
import { adminCollectionRepository } from '@/admin/collections/api/admin-collection-repository';
import { ToastProvider } from '@/admin/ui/ToastProvider';
import type { AdminProduct } from '@/admin/products/types';
import type { AdminCategory } from '@/admin/categories/types';
import type { AdminCollection } from '@/admin/collections/types';

const mockProductsList: AdminProduct[] = [
  {
    id: 'prod-1',
    name: 'Anfora Heykelsi Vazo',
    slug: 'anfora-heykelsi-vazo',
    short_description: 'Heykelsi form',
    description: 'Antik çizgilerle seramik vazo.',
    status: 'draft',
    primary_category_id: 'cat-1',
    material: 'Stoneware Seramik',
    finish: 'Mat Sırlı',
    care_instructions: null,
    origin_country: 'Türkiye',
    retail_price: 1850,
    compare_at_price: 2200,
    retail_enabled: true,
    wholesale_enabled: true,
    wholesale_moq: 6,
    wholesale_lead_time_days: 14,
    featured: true,
    new_arrival: false,
    bestseller: true,
    tags: ['seramik', 'heykelsi'],
    seo_title: null,
    seo_description: null,
    created_at: '2026-08-21T00:00:00Z',
    updated_at: '2026-08-21T00:00:00Z',
    thumbnail_url: 'https://images.unsplash.com/photo-anfora',
    variants_count: 2,
  },
  {
    id: 'prod-2',
    name: 'Nordik Mini Obje',
    slug: 'nordik-mini-obje',
    short_description: 'Minimal form',
    description: 'Kompakt obje.',
    status: 'published',
    primary_category_id: 'cat-2',
    material: 'Porselen',
    finish: 'Kumlu Dokulu',
    care_instructions: null,
    origin_country: 'Türkiye',
    retail_price: 950,
    compare_at_price: null,
    retail_enabled: true,
    wholesale_enabled: false,
    wholesale_moq: 1,
    wholesale_lead_time_days: null,
    featured: false,
    new_arrival: true,
    bestseller: false,
    tags: ['nordik'],
    seo_title: null,
    seo_description: null,
    created_at: '2026-08-21T00:00:00Z',
    updated_at: '2026-08-21T00:00:00Z',
    thumbnail_url: null,
    variants_count: 1,
  },
];

const mockCategoriesList: AdminCategory[] = [
  {
    id: 'cat-1',
    name: 'Masa Üstü Vazolar',
    slug: 'masa-ustu-vazolar',
    description: null,
    image_url: null,
    parent_id: null,
    active: true,
    sort_order: 1,
    seo_title: null,
    seo_description: null,
    created_at: '2026-08-21T00:00:00Z',
    updated_at: '2026-08-21T00:00:00Z',
  },
  {
    id: 'cat-2',
    name: 'Mini Vazolar',
    slug: 'mini-vazolar',
    description: null,
    image_url: null,
    parent_id: 'cat-1',
    active: false,
    sort_order: 2,
    seo_title: null,
    seo_description: null,
    created_at: '2026-08-21T00:00:00Z',
    updated_at: '2026-08-21T00:00:00Z',
  },
];

const mockCollectionsList: AdminCollection[] = [
  {
    id: 'col-1',
    name: 'Nordik Sessizlik Serisi',
    slug: 'nordik-sessizlik',
    subtitle: 'Mineral mat yüzeyler',
    description: null,
    story_markdown: null,
    hero_image_url: null,
    active: true,
    featured: true,
    sort_order: 1,
    seo_title: null,
    seo_description: null,
    created_at: '2026-08-21T00:00:00Z',
    updated_at: '2026-08-21T00:00:00Z',
  },
];

function renderProductsPage() {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <AdminProductsPage />
      </MemoryRouter>
    </ToastProvider>
  );
}

describe('AdminProductsPage Component (Phase 2.5)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(adminCategoryRepository, 'getAllCategories').mockResolvedValue(mockCategoriesList);
    vi.spyOn(adminCollectionRepository, 'getAllCollections').mockResolvedValue(mockCollectionsList);
  });

  it('renders products table with rows, prices, channels, and status badges', async () => {
    vi.spyOn(adminProductRepository, 'getProducts').mockResolvedValue({
      data: mockProductsList,
      totalCount: 2,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    });

    renderProductsPage();

    expect(screen.getByText('Ürün Kataloğu Yönetimi')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Anfora Heykelsi Vazo')).toBeInTheDocument();
      expect(screen.getByText('Nordik Mini Obje')).toBeInTheDocument();
      expect(screen.getByText('/anfora-heykelsi-vazo')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Masa Üstü Vazolar').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Taslak').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Yayında').length).toBeGreaterThanOrEqual(1);
  });

  it('filters products when search query is typed', async () => {
    const getProductsSpy = vi.spyOn(adminProductRepository, 'getProducts').mockResolvedValue({
      data: [mockProductsList[0]],
      totalCount: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    });

    renderProductsPage();

    await waitFor(() => {
      expect(screen.getByText('Anfora Heykelsi Vazo')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Ürün adı veya slug ara...');
    fireEvent.change(searchInput, { target: { value: 'anfora' } });

    await waitFor(() => {
      expect(getProductsSpy).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'anfora' })
      );
    });
  });

  it('opens create modal and submits a new product across tabs', async () => {
    vi.spyOn(adminProductRepository, 'getProducts').mockResolvedValue({
      data: mockProductsList,
      totalCount: 2,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    });

    const createSpy = vi.spyOn(adminProductRepository, 'createProduct').mockResolvedValue({
      ...mockProductsList[0],
      id: 'prod-new',
      name: 'Monokrom Brütal Vazo',
      slug: 'monokrom-brutal-vazo',
    });

    renderProductsPage();

    await waitFor(() => {
      expect(screen.getByText('Anfora Heykelsi Vazo')).toBeInTheDocument();
    });

    const newBtn = screen.getByRole('button', { name: /Yeni Ürün Ekle/ });
    fireEvent.click(newBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Yeni Ürün Ekle' })).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Ürün Adı/);
    fireEvent.change(nameInput, { target: { value: 'Monokrom Brütal Vazo' } });

    // Switch to pricing tab
    const pricingTabBtn = screen.getByRole('button', { name: 'Fiyat & Kanallar' });
    fireEvent.click(pricingTabBtn);

    const priceInput = screen.getByLabelText(/Perakende Satış Fiyatı/);
    fireEvent.change(priceInput, { target: { value: '2400' } });

    const submitBtn = screen.getByRole('button', { name: 'Ürünü Oluştur' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Monokrom Brütal Vazo',
          slug: 'monokrom-brutal-vazo',
          retail_price: 2400,
        })
      );
    });
  });

  it('opens edit modal and updates product details', async () => {
    vi.spyOn(adminProductRepository, 'getProducts').mockResolvedValue({
      data: mockProductsList,
      totalCount: 2,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    });

    const updateSpy = vi.spyOn(adminProductRepository, 'updateProduct').mockResolvedValue({
      ...mockProductsList[0],
      name: 'Anfora Heykelsi Vazo 2026',
    });

    renderProductsPage();

    await waitFor(() => {
      expect(screen.getByText('Anfora Heykelsi Vazo')).toBeInTheDocument();
    });

    const editBtn = screen.getByLabelText('Anfora Heykelsi Vazo ürününü düzenle');
    fireEvent.click(editBtn);

    expect(screen.getByText('Ürünü Düzenle')).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Ürün Adı/);
    fireEvent.change(nameInput, { target: { value: 'Anfora Heykelsi Vazo 2026' } });

    const saveBtn = screen.getByRole('button', { name: 'Değişiklikleri Kaydet' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        'prod-1',
        expect.objectContaining({
          name: 'Anfora Heykelsi Vazo 2026',
        })
      );
    });
  });

  it('updates product status directly from row dropdown', async () => {
    vi.spyOn(adminProductRepository, 'getProducts').mockResolvedValue({
      data: mockProductsList,
      totalCount: 2,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    });

    const statusSpy = vi
      .spyOn(adminProductRepository, 'updateProductStatus')
      .mockResolvedValue({
        ...mockProductsList[0],
        status: 'published',
      });

    renderProductsPage();

    await waitFor(() => {
      expect(screen.getByText('Anfora Heykelsi Vazo')).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText('Anfora Heykelsi Vazo durumunu değiştir');
    fireEvent.change(statusSelect, { target: { value: 'published' } });

    await waitFor(() => {
      expect(statusSpy).toHaveBeenCalledWith('prod-1', 'published');
    });
  });

  it('opens delete confirmation and deletes product', async () => {
    vi.spyOn(adminProductRepository, 'getProducts').mockResolvedValue({
      data: mockProductsList,
      totalCount: 2,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    });

    const deleteSpy = vi.spyOn(adminProductRepository, 'deleteProduct').mockResolvedValue();

    renderProductsPage();

    await waitFor(() => {
      expect(screen.getByText('Anfora Heykelsi Vazo')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByLabelText('Anfora Heykelsi Vazo ürününü sil');
    fireEvent.click(deleteBtn);

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText(/adlı ürünü kalıcı olarak silmek istediğinizden emin misiniz/)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Ürünü Sil' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('prod-1');
    });
  });

  it('renders error state and handles retry button', async () => {
    const getProductsSpy = vi
      .spyOn(adminProductRepository, 'getProducts')
      .mockRejectedValueOnce(new Error('Ağ bağlantısı koptu'))
      .mockResolvedValueOnce({
        data: mockProductsList,
        totalCount: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      });

    renderProductsPage();

    await waitFor(() => {
      expect(screen.getByText('Ağ bağlantısı koptu')).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: 'Yeniden Dene' });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(getProductsSpy).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Anfora Heykelsi Vazo')).toBeInTheDocument();
    });
  });
});
