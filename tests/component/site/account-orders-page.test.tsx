import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { AccountOrdersPage } from '@/site/pages/AccountOrdersPage';
import { AccountOrderDetailPage } from '@/site/pages/AccountOrderDetailPage';
import { renderWithRouter } from 'tests/utils/render-utils';
import { orderRepository } from '@/entities/order/api/order-repository';
import { Order } from '@/entities/order/types';
import { useCustomerAuth } from '@/shared/stores/customer-auth-store';
import { CustomerProfile } from '@/entities/customer/types';
import { User } from '@supabase/supabase-js';

vi.mock('@/shared/stores/customer-auth-store', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/shared/stores/customer-auth-store');
  return {
    ...actual,
    useCustomerAuth: vi.fn(),
  };
});

const mockOrder: Order = {
  id: 'order-101',
  order_number: 'VZ-20260828-ABCDE',
  customer_id: 'cust-01',
  channel: 'retail',
  status: 'shipped',
  currency: 'TRY',
  tax_included: true,
  subtotal_minor: 300000,
  shipping_minor: 15000,
  discount_minor: 0,
  tax_included_minor: 52500,
  total_minor: 315000,
  shipping_carrier: 'Yurtiçi Kargo',
  shipping_tracking_number: 'YK-99887766',
  shipping_tracking_url: 'https://yurticikargo.com/track/YK-99887766',
  shipping_address: {
    id: 'addr-01',
    user_id: 'cust-01',
    label: 'Ev',
    recipient_name: 'Zeynep Kaya',
    phone: '5551112233',
    address_line1: 'Nispetiye Cad. No 10',
    district: 'Beşiktaş',
    city: 'İstanbul',
    country_code: 'TR',
    country_name: 'Türkiye',
    created_at: '2026-08-28T00:00:00Z',
    updated_at: '2026-08-28T00:00:00Z',
  },
  billing_address: {
    id: 'addr-01',
    user_id: 'cust-01',
    label: 'Ev',
    recipient_name: 'Zeynep Kaya',
    phone: '5551112233',
    address_line1: 'Nispetiye Cad. No 10',
    district: 'Beşiktaş',
    city: 'İstanbul',
    country_code: 'TR',
    country_name: 'Türkiye',
    created_at: '2026-08-28T00:00:00Z',
    updated_at: '2026-08-28T00:00:00Z',
  },
  items: [
    {
      id: 'oi-01',
      order_id: 'order-101',
      product_id: 'prod-01',
      variant_id: 'var-01',
      sku_snapshot: 'VZ-ALB-01',
      product_name_snapshot: 'Alabaster Vazo',
      variant_name_snapshot: 'Krem / Büyük',
      image_url_snapshot: 'https://example.com/vazo.jpg',
      unit_price_minor: 300000,
      quantity: 1,
      line_total_minor: 300000,
      currency: 'TRY',
      channel: 'retail',
      metadata_snapshot: {},
      created_at: '2026-08-28T00:00:00Z',
    },
  ],
  created_at: '2026-08-28T12:00:00Z',
  updated_at: '2026-08-28T12:00:00Z',
};

describe('AccountOrdersPage & AccountOrderDetailPage Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCustomerAuth).mockReturnValue({
      user: { id: 'cust-01', email: 'test@example.com' } as User,
      profile: { id: 'cust-01', first_name: 'Zeynep', last_name: 'Kaya' } as CustomerProfile,
      addresses: [],
      isAuthenticated: true,
      isLoading: false,
      error: null,
      displayName: 'Zeynep Kaya',
      email: 'test@example.com',
      customerType: 'retail',
      isWholesaleApproved: false,
      signOut: vi.fn(),
      updateProfile: vi.fn(),
    });
  });

  it('renders customer orders list with order number, status, and items snapshot', async () => {
    vi.spyOn(orderRepository, 'getCustomerOrders').mockResolvedValue([mockOrder]);

    renderWithRouter(<AccountOrdersPage />);

    expect(await screen.findByText('Geçmiş Siparişlerim')).toBeInTheDocument();
    expect(screen.getByText('VZ-20260828-ABCDE')).toBeInTheDocument();
    expect(screen.getByText('Kargoya Verildi')).toBeInTheDocument();
    expect(screen.getByText(/Alabaster Vazo/)).toBeInTheDocument();
  });

  it('renders empty orders state when customer has no orders', async () => {
    vi.spyOn(orderRepository, 'getCustomerOrders').mockResolvedValue([]);

    renderWithRouter(<AccountOrdersPage />);
    expect(await screen.findByText('Henüz Siparişiniz Yok')).toBeInTheDocument();
  });

  it('renders error state when fetching orders fails', async () => {
    vi.spyOn(orderRepository, 'getCustomerOrders').mockRejectedValue(new Error('Sipariş yükleme hatası'));

    renderWithRouter(<AccountOrdersPage />);
    expect(await screen.findByText('Sipariş yükleme hatası')).toBeInTheDocument();
  });

  it('renders order detail page with tracking link, items breakdown, and address snapshot', async () => {
    vi.spyOn(orderRepository, 'getOrderById').mockResolvedValue(mockOrder);

    renderWithRouter(
      <Routes>
        <Route path="/account/orders/:orderId" element={<AccountOrderDetailPage />} />
      </Routes>,
      {
        routerInitialEntries: ['/account/orders/order-101'],
      }
    );

    expect(
      await screen.findByRole('heading', { level: 1, name: /VZ-20260828-ABCDE/ })
    ).toBeInTheDocument();
    expect(screen.getByText('Kargo Takip: Yurtiçi Kargo')).toBeInTheDocument();
    expect(screen.getByText('Takip No: YK-99887766')).toBeInTheDocument();
    expect(screen.getByText('Alabaster Vazo')).toBeInTheDocument();
    expect(screen.getAllByText(/Nispetiye Cad\. No 10/).length).toBeGreaterThan(0);
  });

  it('renders order detail page not found state on error', async () => {
    vi.spyOn(orderRepository, 'getOrderById').mockRejectedValue(new Error('Sipariş bulunamadı.'));

    renderWithRouter(
      <Routes>
        <Route path="/account/orders/:orderId" element={<AccountOrderDetailPage />} />
      </Routes>,
      {
        routerInitialEntries: ['/account/orders/non-existent'],
      }
    );

    expect(await screen.findByText('Sipariş Bulunamadı')).toBeInTheDocument();
  });

  it('renders order detail page with free shipping and discount amounts', async () => {
    const freeShipOrder: Order = {
      ...mockOrder,
      shipping_minor: 0,
      discount_minor: 25000,
      shipping_tracking_number: null,
      shipping_carrier: null,
      shipping_tracking_url: null,
      items: [
        {
          ...mockOrder.items![0],
          image_url_snapshot: null,
        },
      ],
    };

    vi.spyOn(orderRepository, 'getOrderById').mockResolvedValue(freeShipOrder);

    renderWithRouter(
      <Routes>
        <Route path="/account/orders/:orderId" element={<AccountOrderDetailPage />} />
      </Routes>,
      {
        routerInitialEntries: ['/account/orders/order-free'],
      }
    );

    expect(await screen.findByText('Ücretsiz')).toBeInTheDocument();
    expect(screen.getByText('İndirim')).toBeInTheDocument();
    expect(screen.getByText('Görsel Yok')).toBeInTheDocument();
  });
});
