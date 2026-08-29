import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminPaymentsPage } from '@/admin/payments/pages/AdminPaymentsPage';
import { renderWithRouter } from 'tests/utils/render-utils';
import { adminOrderRepository } from '@/entities/order/api/admin-order-repository';

describe('AdminPaymentsPage Component (Phase 3.7)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders payments table, merchant OID, and test badge', async () => {
    renderWithRouter(<AdminPaymentsPage />);

    expect(screen.getByRole('heading', { name: /Ödemeler & İadeler/, level: 1 })).toBeInTheDocument();
    expect(await screen.findByText('VZ20260829001TX1')).toBeInTheDocument();
    expect(screen.getByText('VZ-20260829-001')).toBeInTheDocument();
    expect(screen.getAllByText('TEST')[0]).toBeInTheDocument();
    expect(screen.getByText('Merchant OID')).toBeInTheDocument();
    expect(screen.getByText('Kalan İade Edilebilir')).toBeInTheDocument();
  });

  it('filters payments by status selection and search query', async () => {
    const getAdminPaymentsSpy = vi.spyOn(adminOrderRepository, 'getAdminPayments');
    renderWithRouter(<AdminPaymentsPage />);

    expect(await screen.findByText('VZ20260829001TX1')).toBeInTheDocument();

    const statusSelect = screen.getByRole('combobox', { name: /Ödeme Durum Filtresi/i });
    fireEvent.change(statusSelect, { target: { value: 'paid' } });

    expect(getAdminPaymentsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'paid' })
    );

    const searchInput = screen.getByPlaceholderText(/PayTR merchant_oid/);
    fireEvent.change(searchInput, { target: { value: 'VZ2026' } });
    fireEvent.submit(searchInput.closest('form')!);

    expect(getAdminPaymentsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'VZ2026' })
    );
  });

  it('opens refund modal directly from payments table action and closes it', async () => {
    renderWithRouter(<AdminPaymentsPage />);

    expect(await screen.findByText('VZ20260829001TX1')).toBeInTheDocument();

    const refundBtns = screen.getAllByRole('button', { name: /İade/ });
    fireEvent.click(refundBtns[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('PayTR Para İadesi (Refund)')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: 'Vazgeç' });
    fireEvent.click(cancelBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('handles refresh button click', async () => {
    const getAdminPaymentsSpy = vi.spyOn(adminOrderRepository, 'getAdminPayments');
    renderWithRouter(<AdminPaymentsPage />);

    expect(await screen.findByText('VZ20260829001TX1')).toBeInTheDocument();

    const refreshBtn = screen.getByRole('button', { name: /Yenile/ });
    fireEvent.click(refreshBtn);

    expect(getAdminPaymentsSpy).toHaveBeenCalled();
  });

  it('renders empty state when no payments are found', async () => {
    vi.spyOn(adminOrderRepository, 'getAdminPayments').mockResolvedValueOnce({
      payments: [],
      total_count: 0,
    });

    renderWithRouter(<AdminPaymentsPage />);

    expect(await screen.findByText('Filtrelere uygun ödeme kaydı bulunamadı.')).toBeInTheDocument();
  });

  it('renders error state and retries fetching', async () => {
    vi.spyOn(adminOrderRepository, 'getAdminPayments')
      .mockRejectedValueOnce(new Error('Ödeme kayıtları yüklenemedi'))
      .mockResolvedValueOnce({
        payments: [],
        total_count: 0,
      });

    renderWithRouter(<AdminPaymentsPage />);

    expect(await screen.findByText('Ödeme kayıtları yüklenemedi')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: 'Tekrar Dene' });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.queryByText('Ödeme kayıtları yüklenemedi')).not.toBeInTheDocument();
    });
  });

  it('submits refund from modal and triggers processPayTRRefund', async () => {
    const refundSpy = vi.spyOn(adminOrderRepository, 'processPayTRRefund').mockResolvedValueOnce({
      success: true,
      refund_id: 'ref-1',
      status: 'succeeded',
      refund_amount_minor: 5000,
      currency: 'TRY',
      reference_no: 'REF-12345',
      message: 'İade başarılı',
    });

    renderWithRouter(<AdminPaymentsPage />);

    expect(await screen.findByText('VZ20260829001TX1')).toBeInTheDocument();

    const refundBtns = screen.getAllByRole('button', { name: /İade/ });
    fireEvent.click(refundBtns[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const amountInput = screen.getByLabelText(/İade Edilecek Tutar/);
    fireEvent.change(amountInput, { target: { value: '50.00' } });

    const confirmBtn = screen.getByRole('button', { name: /İadeyi Onayla/ });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(refundSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          refund_amount_minor: 5000,
        })
      );
    });
  });
});
