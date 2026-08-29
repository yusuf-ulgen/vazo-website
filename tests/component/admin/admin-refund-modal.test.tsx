import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminRefundModal } from '@/admin/orders/components/AdminRefundModal';
import { PaymentRecord } from '@/entities/order/types';

describe('AdminRefundModal Component Tests', () => {
  const mockPayment: PaymentRecord = {
    id: 'pay-001',
    order_id: 'ord-001',
    order_number: 'VZ-001',
    customer_email: 'test@example.com',
    provider: 'paytr',
    merchant_oid: 'VZTEST001',
    status: 'paid',
    expected_amount_minor: 50000, // 500.00 TL
    refunded_amount_minor: 10000, // 100.00 TL
    currency: 'TRY',
    test_mode: true,
    failure_code: null,
    failure_message_safe: null,
    initiated_at: new Date().toISOString(),
    expires_at: new Date().toISOString(),
    paid_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  const mockClose = vi.fn();
  const mockSuccess = vi.fn();
  const mockProcessRefund = vi.fn().mockResolvedValue({ success: true });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <AdminRefundModal
        isOpen={false}
        onClose={mockClose}
        payment={mockPayment}
        orderNumber="VZ-001"
        onSuccess={mockSuccess}
        onProcessRefund={mockProcessRefund}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders modal dialog with remaining balance calculations', () => {
    render(
      <AdminRefundModal
        isOpen={true}
        onClose={mockClose}
        payment={mockPayment}
        orderNumber="VZ-001"
        onSuccess={mockSuccess}
        onProcessRefund={mockProcessRefund}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('PayTR Para İadesi (Refund)')).toBeInTheDocument();
    expect(screen.getByText('₺400,00')).toBeInTheDocument(); // Remaining
  });

  it('sets full refund amount when Tam İade button is clicked', () => {
    render(
      <AdminRefundModal
        isOpen={true}
        onClose={mockClose}
        payment={mockPayment}
        orderNumber="VZ-001"
        onSuccess={mockSuccess}
        onProcessRefund={mockProcessRefund}
      />
    );

    const input = screen.getByLabelText(/İade Edilecek Tutar/);
    fireEvent.change(input, { target: { value: '50.00' } });
    expect(input).toHaveValue(50);

    const fullBtn = screen.getByRole('button', { name: /Tam İade/ });
    fireEvent.click(fullBtn);
    expect(input).toHaveValue(400);
  });

  it('validates invalid numeric input and displays error', async () => {
    render(
      <AdminRefundModal
        isOpen={true}
        onClose={mockClose}
        payment={mockPayment}
        orderNumber="VZ-001"
        onSuccess={mockSuccess}
        onProcessRefund={mockProcessRefund}
      />
    );

    const input = screen.getByLabelText(/İade Edilecek Tutar/);
    fireEvent.change(input, { target: { value: '-10' } });

    const form = screen.getByRole('dialog').querySelector('form')!;
    fireEvent.submit(form);

    expect(await screen.findByText(/Lütfen sıfırdan büyük geçerli bir iade tutarı girin/)).toBeInTheDocument();
    expect(mockProcessRefund).not.toHaveBeenCalled();
  });

  it('validates amount exceeding remaining balance and displays error', async () => {
    render(
      <AdminRefundModal
        isOpen={true}
        onClose={mockClose}
        payment={mockPayment}
        orderNumber="VZ-001"
        onSuccess={mockSuccess}
        onProcessRefund={mockProcessRefund}
      />
    );

    const input = screen.getByLabelText(/İade Edilecek Tutar/);
    fireEvent.change(input, { target: { value: '999.00' } });

    const form = screen.getByRole('dialog').querySelector('form')!;
    fireEvent.submit(form);

    expect(await screen.findByText(/İade tutarı kalan iade edilebilir bakiyeyi/)).toBeInTheDocument();
    expect(mockProcessRefund).not.toHaveBeenCalled();
  });

  it('submits refund and triggers success callback', async () => {
    render(
      <AdminRefundModal
        isOpen={true}
        onClose={mockClose}
        payment={mockPayment}
        orderNumber="VZ-001"
        onSuccess={mockSuccess}
        onProcessRefund={mockProcessRefund}
      />
    );

    const input = screen.getByLabelText(/İade Edilecek Tutar/);
    fireEvent.change(input, { target: { value: '100.00' } });

    const reason = screen.getByLabelText(/İade Nedeni/);
    fireEvent.change(reason, { target: { value: 'Kusurlu ürün bildirimi' } });

    const form = screen.getByRole('dialog').querySelector('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockProcessRefund).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_id: 'pay-001',
          refund_amount_minor: 10000,
          reason: 'Kusurlu ürün bildirimi',
        })
      );
      expect(mockSuccess).toHaveBeenCalled();
      expect(mockClose).toHaveBeenCalled();
    });
  });

  it('displays error when process refund throws', async () => {
    mockProcessRefund.mockRejectedValueOnce(new Error('PayTR bağlantı hatası'));

    render(
      <AdminRefundModal
        isOpen={true}
        onClose={mockClose}
        payment={mockPayment}
        orderNumber="VZ-001"
        onSuccess={mockSuccess}
        onProcessRefund={mockProcessRefund}
      />
    );

    const form = screen.getByRole('dialog').querySelector('form')!;
    fireEvent.submit(form);

    expect(await screen.findByText('PayTR bağlantı hatası')).toBeInTheDocument();
  });
});
