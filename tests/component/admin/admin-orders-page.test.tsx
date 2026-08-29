import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminOrdersPage } from '@/admin/orders/pages/AdminOrdersPage';
import { renderWithRouter } from 'tests/utils/render-utils';
import { adminOrderRepository } from '@/entities/order/api/admin-order-repository';

describe('AdminOrdersPage Component (Phase 3.7)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders page header and order list table headers', async () => {
    renderWithRouter(<AdminOrdersPage />);

    expect(screen.getByRole('heading', { name: 'Sipariş Yönetimi', level: 1 })).toBeInTheDocument();
    expect(await screen.findByText('VZ-20260829-001')).toBeInTheDocument();
    expect(screen.getByText('Ayşe Yılmaz')).toBeInTheDocument();
    expect(screen.getByText('Sipariş No')).toBeInTheDocument();
    expect(screen.getByText('Müşteri')).toBeInTheDocument();
    expect(screen.getByText('Tutar')).toBeInTheDocument();
  });

  it('filters orders by channel selection', async () => {
    const getAdminOrdersSpy = vi.spyOn(adminOrderRepository, 'getAdminOrders');
    renderWithRouter(<AdminOrdersPage />);

    expect(await screen.findByText('VZ-20260829-001')).toBeInTheDocument();

    const channelSelect = screen.getByRole('combobox', { name: /Kanal Filtresi/i });
    fireEvent.change(channelSelect, { target: { value: 'wholesale' } });

    expect(getAdminOrdersSpy).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'wholesale' })
    );
  });

  it('filters orders by status selection', async () => {
    const getAdminOrdersSpy = vi.spyOn(adminOrderRepository, 'getAdminOrders');
    renderWithRouter(<AdminOrdersPage />);

    expect(await screen.findByText('VZ-20260829-001')).toBeInTheDocument();

    const statusSelect = screen.getByRole('combobox', { name: /Durum Filtresi/i });
    fireEvent.change(statusSelect, { target: { value: 'paid' } });

    expect(getAdminOrdersSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'paid' })
    );

    fireEvent.change(statusSelect, { target: { value: 'all' } });
    expect(getAdminOrdersSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'all' })
    );
  });

  it('submits search query from form input', async () => {
    const getAdminOrdersSpy = vi.spyOn(adminOrderRepository, 'getAdminOrders');
    renderWithRouter(<AdminOrdersPage />);

    const searchInput = screen.getByPlaceholderText(/Sipariş no, müşteri adı/);
    fireEvent.change(searchInput, { target: { value: 'VZ-20260829-001' } });
    fireEvent.submit(searchInput.closest('form')!);

    expect(getAdminOrdersSpy).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'VZ-20260829-001' })
    );
  });

  it('renders refresh button and refetches orders', async () => {
    const getAdminOrdersSpy = vi.spyOn(adminOrderRepository, 'getAdminOrders');
    renderWithRouter(<AdminOrdersPage />);

    expect(await screen.findByText('VZ-20260829-001')).toBeInTheDocument();

    const refreshBtn = screen.getByRole('button', { name: /Yenile/ });
    fireEvent.click(refreshBtn);

    expect(getAdminOrdersSpy).toHaveBeenCalled();
  });

  it('renders empty state when no orders match query', async () => {
    vi.spyOn(adminOrderRepository, 'getAdminOrders').mockResolvedValueOnce({
      orders: [],
      total_count: 0,
      page: 1,
      page_size: 20,
      total_pages: 1,
    });

    renderWithRouter(<AdminOrdersPage />);

    expect(await screen.findByText('Filtrelere uygun sipariş kaydı bulunamadı.')).toBeInTheDocument();
  });

  it('renders error state and retries fetching', async () => {
    vi.spyOn(adminOrderRepository, 'getAdminOrders')
      .mockRejectedValueOnce(new Error('Sipariş yükleme hatası'))
      .mockResolvedValueOnce({
        orders: [],
        total_count: 0,
        page: 1,
        page_size: 20,
        total_pages: 1,
      });

    renderWithRouter(<AdminOrdersPage />);

    expect(await screen.findByText('Sipariş yükleme hatası')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: 'Tekrar Dene' });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.queryByText('Sipariş yükleme hatası')).not.toBeInTheDocument();
    });
  });

  it('handles multi-page pagination controls', async () => {
    vi.spyOn(adminOrderRepository, 'getAdminOrders').mockResolvedValue({
      orders: [
        {
          id: 'ord-p2',
          order_number: 'VZ-PAGE-2',
          customer_id: 'cust-1',
          customer_name: 'Page 2 Customer',
          customer_email: 'p2@example.com',
          channel: 'retail',
          status: 'paid',
          currency: 'TRY',
          total_minor: 12000,
          item_count: 1,
          payment_status: 'paid',
          shipping_carrier: null,
          shipping_tracking_number: null,
          created_at: new Date().toISOString(),
          paid_at: new Date().toISOString(),
        },
      ],
      total_count: 40,
      page: 1,
      page_size: 20,
      total_pages: 2,
    });

    renderWithRouter(<AdminOrdersPage />);

    expect(await screen.findByText('VZ-PAGE-2')).toBeInTheDocument();
    const nextBtn = screen.getByRole('button', { name: 'Sonraki Sayfa' });
    fireEvent.click(nextBtn);
  });
});
