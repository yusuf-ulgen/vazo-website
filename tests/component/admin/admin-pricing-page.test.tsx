import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AdminPricingPage } from '@/admin/pricing/pages/AdminPricingPage';
import { adminPricingRepository } from '@/admin/pricing/api/admin-pricing-repository';
import { adminCategoryRepository } from '@/admin/categories/api/admin-category-repository';
import { ToastProvider } from '@/admin/ui';
import type { AdminPricingListResult } from '@/admin/pricing/types';

vi.mock('@/admin/pricing/api/admin-pricing-repository');
vi.mock('@/admin/categories/api/admin-category-repository');

const mockPricingResult: AdminPricingListResult = {
  data: [
    {
      id: 'prod-1',
      type: 'product',
      productId: 'prod-1',
      name: 'Anfora Heykelsi Vazo',
      categoryName: 'Masa Üstü Vazolar',
      retailPrice: 2450,
      compareAtPrice: 2900,
      retailEnabled: true,
      wholesaleEnabled: true,
      updatedAt: '2026-08-20T10:00:00Z',
    },
    {
      id: 'var-1',
      type: 'variant',
      productId: 'prod-1',
      variantId: 'var-1',
      name: 'Anfora Heykelsi Vazo (Mat Antrasit)',
      sku: 'VAZO-ANF-01',
      categoryName: 'Masa Üstü Vazolar',
      retailPrice: 2450,
      compareAtPrice: null,
      retailEnabled: true,
      wholesaleEnabled: true,
      updatedAt: '2026-08-20T10:00:00Z',
    },
  ],
  totalCount: 2,
  page: 1,
  pageSize: 15,
  totalPages: 1,
};

describe('AdminPricingPage Component (Phase 2.6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminPricingRepository.getPricingList).mockResolvedValue(mockPricingResult);
    vi.mocked(adminCategoryRepository.getAllCategories).mockResolvedValue([]);
  });

  const renderPage = () => {
    return render(
      <ToastProvider>
        <AdminPricingPage />
      </ToastProvider>
    );
  };

  it('renders pricing matrix table with products and variants', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Anfora Heykelsi Vazo')).toBeInTheDocument();
      expect(screen.getByText('Anfora Heykelsi Vazo (Mat Antrasit)')).toBeInTheDocument();
    });

    expect(screen.getByText('Fiyatlandırma Matrisi')).toBeInTheDocument();
    expect(screen.getByText('Ana Ürün')).toBeInTheDocument();
    expect(screen.getByText('Varyant (SKU)')).toBeInTheDocument();
  });

  it('opens price edit modal and updates product price', async () => {
    vi.mocked(adminPricingRepository.updatePrice).mockResolvedValue(undefined);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Anfora Heykelsi Vazo')).toBeInTheDocument();
    });

    const editBtns = screen.getAllByRole('button', { name: /Düzenle/ });
    fireEvent.click(editBtns[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Fiyatı Düzenle' })).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: 'Fiyatı Kaydet' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(adminPricingRepository.updatePrice).toHaveBeenCalledWith({
        id: 'prod-1',
        type: 'product',
        retailPrice: 2450,
        compareAtPrice: 2900,
      });
    });
  });
});
