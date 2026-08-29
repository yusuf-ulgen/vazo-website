import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { AdminOrderDetailPage } from '@/admin/orders/pages/AdminOrderDetailPage';
import { renderWithRouter } from 'tests/utils/render-utils';
import { adminOrderRepository } from '@/entities/order/api/admin-order-repository';
import { mockAdminOrders } from '@/entities/order/api/admin-order-mocks';

describe('AdminOrderDetailPage Component (Phase 3.7)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const renderComponent = (orderId = 'ord-test-001') => {
    return renderWithRouter(
      <Routes>
        <Route path="/admin/orders/:orderId" element={<AdminOrderDetailPage />} />
      </Routes>,
      {
        routerInitialEntries: [`/admin/orders/${orderId}`],
      }
    );
  };

  it('renders complete order information and item details', async () => {
    renderComponent('ord-test-001');

    expect(await screen.findByText('VZ-20260829-001')).toBeInTheDocument();
    expect(screen.getByText('Terra Seramik Vazo')).toBeInTheDocument();
    expect(screen.getAllByText('Ayşe Yılmaz')[0]).toBeInTheDocument();
    expect(screen.getByText(/Karaköy Kemankeş Mah/)).toBeInTheDocument();
    expect(screen.getByText('Sevkiyat & Gönderi Yönetimi')).toBeInTheDocument();
  });

  it('updates fulfillment status to processing when Hazırlanıyor is clicked', async () => {
    const updateFulfillmentSpy = vi.spyOn(adminOrderRepository, 'updateOrderFulfillment');

    renderComponent('ord-test-001');

    expect(await screen.findByText('VZ-20260829-001')).toBeInTheDocument();

    const processBtn = screen.getByRole('button', { name: /Hazırlanıyor Olarak İşaretle/ });
    fireEvent.click(processBtn);

    expect(updateFulfillmentSpy).toHaveBeenCalledWith(
      'ord-test-001',
      expect.objectContaining({
        target_status: 'processing',
      })
    );
  });

  it('updates fulfillment status to shipped when carrier, tracking number, tracking url and note are entered', async () => {
    const updateFulfillmentSpy = vi.spyOn(adminOrderRepository, 'updateOrderFulfillment');

    renderComponent('ord-test-001');

    expect(await screen.findByText('VZ-20260829-001')).toBeInTheDocument();

    const carrierInput = screen.getByPlaceholderText(/Yurtiçi Kargo/);
    const trackingInput = screen.getByPlaceholderText(/YK-123456789/);
    const urlInput = screen.getByPlaceholderText(/https:\/\//);
    const noteInput = screen.getByPlaceholderText(/2 koli halinde kargolandı/);

    fireEvent.change(carrierInput, { target: { value: 'Aras Kargo' } });
    fireEvent.change(trackingInput, { target: { value: 'ARAS-998877' } });
    fireEvent.change(urlInput, { target: { value: 'https://aras.com/track/123' } });
    fireEvent.change(noteInput, { target: { value: 'Kırılabilir ürün etiketi yapıştırıldı' } });

    const shipBtn = screen.getByRole('button', { name: /Kargoya Verildi Olarak Kaydet/ });
    fireEvent.click(shipBtn);

    expect(updateFulfillmentSpy).toHaveBeenCalledWith(
      'ord-test-001',
      expect.objectContaining({
        target_status: 'shipped',
        carrier: 'Aras Kargo',
        tracking_number: 'ARAS-998877',
        tracking_url: 'https://aras.com/track/123',
        note: 'Kırılabilir ürün etiketi yapıştırıldı',
      })
    );
  });

  it('updates fulfillment status to delivered on shipped order', async () => {
    const updateFulfillmentSpy = vi.spyOn(adminOrderRepository, 'updateOrderFulfillment');

    renderComponent('ord-test-002');

    expect(await screen.findByText('VZ-20260829-002')).toBeInTheDocument();

    const deliverBtn = screen.getByRole('button', { name: /Teslim Edildi Olarak Tamamla/ });
    fireEvent.click(deliverBtn);

    expect(updateFulfillmentSpy).toHaveBeenCalledWith(
      'ord-test-002',
      expect.objectContaining({
        target_status: 'delivered',
      })
    );
  });

  it('opens refund modal, validates refund input, submits refund, and renders stock decoupling notice', async () => {
    const refundSpy = vi.spyOn(adminOrderRepository, 'processPayTRRefund');

    renderComponent('ord-test-001');

    expect(await screen.findByText('VZ-20260829-001')).toBeInTheDocument();

    const refundBtn = screen.getByRole('button', { name: /Para İadesi Yap/ });
    fireEvent.click(refundBtn);

    // Modal is opened
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('PayTR Para İadesi (Refund)')).toBeInTheDocument();
    expect(screen.getByText(/Envanter Ayrımı Uyarısı/)).toBeInTheDocument();

    const amountInput = screen.getByLabelText(/İade Edilecek Tutar/);
    fireEvent.change(amountInput, { target: { value: '150.00' } });

    const reasonInput = screen.getByLabelText(/İade Nedeni/);
    fireEvent.change(reasonInput, { target: { value: 'Müşteri vazgeçti' } });

    const confirmBtn = screen.getByRole('button', { name: /İadeyi Onayla/ });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(refundSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_id: 'pay-001',
          refund_amount_minor: 15000,
          reason: 'Müşteri vazgeçti',
        })
      );
    });
  });

  it('handles cancellation flow for unpaid order', async () => {
    const cancelSpy = vi.spyOn(adminOrderRepository, 'cancelOrder');

    // Make mock order unpaid
    const target = mockAdminOrders.find((o) => o.id === 'ord-test-001')!;
    target.status = 'pending_payment';

    renderComponent('ord-test-001');

    expect(await screen.findByText('VZ-20260829-001')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /Siparişi İptal Et/ });
    fireEvent.click(cancelBtn);

    expect(screen.getByText(/Ödenmemiş Sipariş İptali & Stok Rezervasyonu Salımı/)).toBeInTheDocument();

    const reasonInput = screen.getByPlaceholderText(/İptal gerekçesi giriniz/);
    fireEvent.change(reasonInput, { target: { value: 'Müşteri yanıt vermedi' } });

    const confirmCancelBtn = screen.getByRole('button', { name: /İptali Onayla/ });
    fireEvent.click(confirmCancelBtn);

    expect(cancelSpy).toHaveBeenCalledWith(
      'ord-test-001',
      expect.objectContaining({ reason: 'Müşteri yanıt vermedi' })
    );
  });

  it('renders not found state when order does not exist', async () => {
    vi.spyOn(adminOrderRepository, 'getAdminOrderById').mockResolvedValueOnce(null);

    renderComponent('ord-non-existent');

    expect(await screen.findByText('Sipariş kaydı bulunamadı.')).toBeInTheDocument();
  });

  it('renders error state when loading order detail fails', async () => {
    vi.spyOn(adminOrderRepository, 'getAdminOrderById')
      .mockRejectedValueOnce(new Error('Detay yüklenemedi'));

    renderComponent('ord-test-001');

    expect(await screen.findByText('Detay yüklenemedi')).toBeInTheDocument();
  });
});
