import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AdminInventoryPage } from '@/admin/inventory/pages/AdminInventoryPage';
import { adminInventoryRepository } from '@/admin/inventory/api/admin-inventory-repository';
import { ToastProvider } from '@/admin/ui';
import type { AdminInventoryListResult } from '@/admin/inventory/types';

vi.mock('@/admin/inventory/api/admin-inventory-repository');

const mockInventoryResult: AdminInventoryListResult = {
  data: [
    {
      id: 'var-1',
      product_id: 'prod-1',
      product_name: 'Anfora Heykelsi Vazo',
      product_slug: 'anfora-heykelsi-vazo',
      sku: 'VAZO-ANF-01',
      variant_name: 'Mat Antrasit - Standart',
      color_name: 'Antrasit',
      color_hex: '#2D3134',
      size_label: 'Standart',
      stock_quantity: 12,
      retail_price: 2450,
      is_available_for_retail: true,
      is_available_for_wholesale: true,
      active: true,
      updated_at: '2026-08-20T10:00:00Z',
    },
    {
      id: 'var-2',
      product_id: 'prod-2',
      product_name: 'Minimalist Terakota Vazo',
      product_slug: 'minimalist-terakota-vazo',
      sku: 'VAZO-TER-01',
      variant_name: 'Ham Dokulu',
      color_name: 'Terakota',
      color_hex: '#D97706',
      size_label: 'M',
      stock_quantity: 2,
      retail_price: 1850,
      is_available_for_retail: true,
      is_available_for_wholesale: true,
      active: true,
      updated_at: '2026-08-20T10:00:00Z',
    },
  ],
  totalCount: 2,
  page: 1,
  pageSize: 15,
  totalPages: 1,
  metrics: {
    totalVariants: 2,
    inStockCount: 2,
    lowStockCount: 1,
    outOfStockCount: 0,
    totalUnits: 14,
  },
};

describe('AdminInventoryPage Component (Phase 2.6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminInventoryRepository.getInventory).mockResolvedValue(mockInventoryResult);
  });

  const renderPage = () => {
    return render(
      <ToastProvider>
        <AdminInventoryPage />
      </ToastProvider>
    );
  };

  it('renders inventory metrics and table with variant rows', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Anfora Heykelsi Vazo')).toBeInTheDocument();
      expect(screen.getByText('VAZO-ANF-01')).toBeInTheDocument();
      expect(screen.getByText('Minimalist Terakota Vazo')).toBeInTheDocument();
    });

    expect(screen.getByText('Stok ve Envanter Yönetimi')).toBeInTheDocument();
    expect(screen.getByText('12 Adet')).toBeInTheDocument();
    expect(screen.getByText('2 Adet (Kritik)')).toBeInTheDocument();
  });

  it('opens stock adjustment modal and updates stock quantity', async () => {
    vi.mocked(adminInventoryRepository.updateStock).mockResolvedValue(undefined);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('VAZO-ANF-01')).toBeInTheDocument();
    });

    const updateBtns = screen.getAllByRole('button', { name: /Güncelle/ });
    fireEvent.click(updateBtns[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Stok Miktarını Güncelle' })).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: 'Stoku Kaydet' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(adminInventoryRepository.updateStock).toHaveBeenCalledWith('var-1', 12);
    });
  });
});
