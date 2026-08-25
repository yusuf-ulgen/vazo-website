import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AdminWholesalePage } from '@/admin/wholesale/pages/AdminWholesalePage';
import { adminWholesaleRepository } from '@/admin/wholesale/api/admin-wholesale-repository';
import { adminProductRepository } from '@/admin/products/api/admin-product-repository';
import { ToastProvider } from '@/admin/ui';
import type { AdminWholesaleTier } from '@/admin/wholesale/types';

vi.mock('@/admin/wholesale/api/admin-wholesale-repository');
vi.mock('@/admin/products/api/admin-product-repository');

const mockTiers: AdminWholesaleTier[] = [
  {
    id: 'tier-1',
    product_id: 'prod-1',
    product_name: 'Anfora Heykelsi Vazo',
    product_slug: 'anfora-heykelsi-vazo',
    variant_id: null,
    min_quantity: 10,
    max_quantity: 49,
    unit_price: 1850,
    discount_percentage: 25,
    active: true,
    created_at: '2026-08-20T10:00:00Z',
  },
  {
    id: 'tier-2',
    product_id: 'prod-1',
    product_name: 'Anfora Heykelsi Vazo',
    product_slug: 'anfora-heykelsi-vazo',
    variant_id: null,
    min_quantity: 50,
    max_quantity: null,
    unit_price: 1600,
    discount_percentage: 35,
    active: true,
    created_at: '2026-08-20T10:00:00Z',
  },
];

describe('AdminWholesalePage Component (Phase 2.6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminWholesaleRepository.getWholesaleTiers).mockResolvedValue(mockTiers);
    vi.mocked(adminProductRepository.getProducts).mockResolvedValue({
      data: [
        {
          id: 'prod-1',
          name: 'Anfora Heykelsi Vazo',
          slug: 'anfora-heykelsi-vazo',
          short_description: '',
          description: '',
          status: 'published',
          material: '',
          finish: '',
          origin_country: 'Türkiye',
          retail_price: 2450,
          retail_enabled: true,
          wholesale_enabled: true,
          wholesale_moq: 10,
          wholesale_lead_time_days: 14,
          featured: false,
          new_arrival: false,
          bestseller: false,
          tags: [],
          created_at: '2026-08-20T10:00:00Z',
          updated_at: '2026-08-20T10:00:00Z',
        },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 100,
      totalPages: 1,
    });
  });

  const renderPage = () => {
    return render(
      <ToastProvider>
        <AdminWholesalePage />
      </ToastProvider>
    );
  };

  it('renders wholesale tiers table with min/max quantities and unit prices', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText('Anfora Heykelsi Vazo').length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByText('B2B & Toptan Yönetimi')).toBeInTheDocument();
    expect(screen.getByText('10 Adet')).toBeInTheDocument();
    expect(screen.getByText('49 Adet')).toBeInTheDocument();
    expect(screen.getByText('50 Adet')).toBeInTheDocument();
    expect(screen.getByText('Sınırsız (ve üzeri)')).toBeInTheDocument();
  });

  it('opens create tier modal and submits new tier', async () => {
    vi.mocked(adminWholesaleRepository.createWholesaleTier).mockResolvedValue({
      id: 'tier-3',
      product_id: 'prod-1',
      product_name: 'Anfora Heykelsi Vazo',
      product_slug: 'anfora-heykelsi-vazo',
      variant_id: null,
      min_quantity: 100,
      max_quantity: null,
      unit_price: 1400,
      discount_percentage: 40,
      active: true,
      created_at: '2026-08-20T10:00:00Z',
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText('Anfora Heykelsi Vazo').length).toBeGreaterThanOrEqual(1);
    });

    const addBtn = screen.getByRole('button', { name: /Yeni Kademe Ekle/ });
    fireEvent.click(addBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Yeni Toptan Fiyat Kademesi Ekle' })).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: 'Kademeyi Ekle' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(adminWholesaleRepository.createWholesaleTier).toHaveBeenCalled();
    });
  });
});
