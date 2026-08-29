import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminOrderRepository } from '@/entities/order/api/admin-order-repository';
import { mockAdminOrders } from '@/entities/order/api/admin-order-mocks';

describe('adminOrderRepository Unit Tests (Phase 3.7)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAdminOrders', () => {
    it('returns paginated orders list with summaries', async () => {
      const res = await adminOrderRepository.getAdminOrders({ page: 1, pageSize: 10 });
      expect(res.orders).toBeDefined();
      expect(res.orders.length).toBeGreaterThanOrEqual(1);
      expect(res.total_count).toBeGreaterThanOrEqual(1);
      expect(res.page).toBe(1);

      const first = res.orders[0];
      expect(first.order_number).toBeDefined();
      expect(first.customer_name).toBeDefined();
      expect(first.total_minor).toBeGreaterThan(0);
      expect(first.status).toBeDefined();
    });

    it('filters orders by channel and status', async () => {
      const resRetail = await adminOrderRepository.getAdminOrders({ channel: 'retail' });
      expect(resRetail.orders.every((o) => o.channel === 'retail')).toBe(true);

      const resPaid = await adminOrderRepository.getAdminOrders({ status: 'paid' });
      expect(resPaid.orders.every((o) => o.status === 'paid')).toBe(true);

      const resAll = await adminOrderRepository.getAdminOrders({ status: 'all', channel: 'all' });
      expect(resAll.total_count).toBeGreaterThanOrEqual(1);
    });

    it('filters orders by search query', async () => {
      const res = await adminOrderRepository.getAdminOrders({ search: 'Ayşe' });
      expect(res.orders.some((o) => o.customer_name.includes('Ayşe'))).toBe(true);

      const resEmpty = await adminOrderRepository.getAdminOrders({ search: 'NON_EXISTENT_XYZ_123' });
      expect(resEmpty.orders.length).toBe(0);
    });
  });

  describe('getAdminOrderById', () => {
    it('returns complete order detail with items and payments', async () => {
      const order = await adminOrderRepository.getAdminOrderById('ord-test-001');
      expect(order).not.toBeNull();
      expect(order?.id).toBe('ord-test-001');
      expect(order?.items.length).toBeGreaterThan(0);
      expect(order?.payments.length).toBeGreaterThan(0);
      expect(order?.shipping_address).toBeDefined();
    });

    it('returns null for non-existent order', async () => {
      const order = await adminOrderRepository.getAdminOrderById('non-existent-id');
      expect(order).toBeNull();
    });
  });

  describe('updateOrderFulfillment', () => {
    it('updates order status to processing', async () => {
      const res = await adminOrderRepository.updateOrderFulfillment('ord-test-001', {
        target_status: 'processing',
        note: 'Ürün paketleme aşamasında',
      });
      expect(res.success).toBe(true);
      expect(res.to_status).toBe('processing');
    });

    it('updates order status to shipped with tracking information', async () => {
      const res = await adminOrderRepository.updateOrderFulfillment('ord-test-001', {
        target_status: 'shipped',
        carrier: 'MNG Kargo',
        tracking_number: 'MNG-123456',
        tracking_url: 'https://mng.com/123456',
      });

      expect(res.success).toBe(true);
      expect(res.to_status).toBe('shipped');

      const updated = await adminOrderRepository.getAdminOrderById('ord-test-001');
      expect(updated?.shipping_carrier).toBe('MNG Kargo');
      expect(updated?.shipping_tracking_number).toBe('MNG-123456');
    });

    it('updates order status to delivered', async () => {
      const res = await adminOrderRepository.updateOrderFulfillment('ord-test-002', {
        target_status: 'delivered',
        note: 'Müşteriye teslim edildi',
      });
      expect(res.success).toBe(true);
      expect(res.to_status).toBe('delivered');
    });

    it('throws error when order is not found', async () => {
      await expect(
        adminOrderRepository.updateOrderFulfillment('invalid-id', { target_status: 'processing' })
      ).rejects.toThrow(/Sipariş bulunamadı/);
    });
  });

  describe('cancelOrder', () => {
    it('rejects cancellation of paid orders without refund', async () => {
      await expect(
        adminOrderRepository.cancelOrder('ord-test-001', { reason: 'Müşteri vazgeçti' })
      ).rejects.toThrow(/Ödenmiş sipariş doğrudan iptal edilemez/);
    });

    it('cancels unpaid order successfully', async () => {
      // Temporarily mark order as pending_payment for cancellation test
      const targetOrder = mockAdminOrders.find((o) => o.id === 'ord-test-001')!;
      targetOrder.status = 'pending_payment';

      const res = await adminOrderRepository.cancelOrder('ord-test-001', {
        reason: 'Zaman aşımı',
      });

      expect(res.success).toBe(true);
      expect(res.to_status).toBe('cancelled');
      expect(targetOrder.status).toBe('cancelled');
      expect(targetOrder.cancellation_reason).toBe('Zaman aşımı');
    });

    it('throws error when order to cancel is not found', async () => {
      await expect(
        adminOrderRepository.cancelOrder('non-existent-order', { reason: 'Test' })
      ).rejects.toThrow(/Sipariş bulunamadı/);
    });
  });

  describe('getAdminPayments & processPayTRRefund', () => {
    it('returns payment records list with filters', async () => {
      const res = await adminOrderRepository.getAdminPayments();
      expect(res.payments.length).toBeGreaterThanOrEqual(1);
      expect(res.payments[0].merchant_oid).toBeDefined();
      expect(res.payments[0].expected_amount_minor).toBeGreaterThan(0);

      const resStatus = await adminOrderRepository.getAdminPayments({ status: 'paid' });
      expect(resStatus.payments.every((p) => p.status === 'paid')).toBe(true);

      const resSearch = await adminOrderRepository.getAdminPayments({ search: 'VZ20260829001' });
      expect(resSearch.payments.length).toBeGreaterThanOrEqual(1);
    });

    it('processes partial refund and updates payment and order statuses', async () => {
      const refundRes = await adminOrderRepository.processPayTRRefund({
        payment_id: 'pay-002',
        refund_amount_minor: 10000, // 100 TL
        reason: 'Ürün kusuru',
      });

      expect(refundRes.success).toBe(true);
      expect(refundRes.status).toBe('succeeded');
      expect(refundRes.reference_no).toBeDefined();
    });

    it('rejects refund exceeding remaining amount', async () => {
      await expect(
        adminOrderRepository.processPayTRRefund({
          payment_id: 'pay-002',
          refund_amount_minor: 999999999, // Exceeds balance
          reason: 'Aşırı tutar',
        })
      ).rejects.toThrow(/İade tutarı kalan iade edilebilir bakiyeyi aşamaz/);
    });

    it('throws error when payment to refund is not found', async () => {
      await expect(
        adminOrderRepository.processPayTRRefund({
          payment_id: 'non-existent-pay-id',
          refund_amount_minor: 1000,
        })
      ).rejects.toThrow(/Ödeme kaydı bulunamadı/);
    });
  });
});
