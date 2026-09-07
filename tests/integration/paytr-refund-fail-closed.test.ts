import { describe, it, expect, beforeEach, vi } from 'vitest';
import { adminOrderRepository } from '@/entities/order/api/admin-order-repository';
import { getMockState } from '../mocks/supabase-mock';

describe('Phase 3.17 — PayTR Refund Fail-Closed Financial Hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Initialize mock payments & orders state
    const state = getMockState();
    state['orders'] = [
      {
        id: 'ord_rf_01',
        order_number: 'ORD-2026-RF01',
        status: 'paid',
        total_minor: 50000, // 500.00 TL
      },
    ];
    state['payments'] = [
      {
        id: 'pay_rf_01',
        order_id: 'ord_rf_01',
        merchant_oid: 'VZ_ORD_2026_RF01',
        status: 'paid',
        expected_amount_minor: 50000,
        refunded_amount_minor: 0,
        currency: 'TRY',
      },
    ];
    state['refunds'] = [];
  });

  it('FAIL-CLOSED: Missing PayTR secrets rejects refund and prevents state changes', async () => {
    const state = getMockState();
    const paymentBefore = { ...state['payments'][0] };
    const orderBefore = { ...state['orders'][0] };

    await expect(
      adminOrderRepository.processPayTRRefund({
        payment_id: 'pay_rf_01',
        refund_amount_minor: 10000,
        idempotency_key: 'req_missing_sec',
        simulateMissingSecrets: true,
      } as unknown as Parameters<typeof adminOrderRepository.processPayTRRefund>[0])
    ).rejects.toThrow(/PayTR yapılandırması eksik/);

    // Verify ABSOLUTE INVARIANT: No financial state transition occurred
    const paymentAfter = state['payments'].find((p) => p.id === 'pay_rf_01');
    const orderAfter = state['orders'].find((o) => o.id === 'ord_rf_01');
    expect(paymentAfter.refunded_amount_minor).toBe(paymentBefore.refunded_amount_minor);
    expect(paymentAfter.status).toBe(paymentBefore.status);
    expect(orderAfter.status).toBe(orderBefore.status);
  });

  it('FAIL-CLOSED: Provider timeout fails closed without updating payment or order statuses', async () => {
    const state = getMockState();
    const paymentBefore = { ...state['payments'][0] };

    await expect(
      adminOrderRepository.processPayTRRefund({
        payment_id: 'pay_rf_01',
        refund_amount_minor: 15000,
        idempotency_key: 'req_timeout',
        simulateTimeout: true,
      } as unknown as Parameters<typeof adminOrderRepository.processPayTRRefund>[0])
    ).rejects.toThrow(/zaman aşımı/);

    const paymentAfter = state['payments'].find((p) => p.id === 'pay_rf_01');
    expect(paymentAfter.refunded_amount_minor).toBe(paymentBefore.refunded_amount_minor);
    expect(paymentAfter.status).toBe('paid');
  });

  it('FAIL-CLOSED: Network / connection failure fails closed', async () => {
    const state = getMockState();
    const paymentBefore = { ...state['payments'][0] };

    await expect(
      adminOrderRepository.processPayTRRefund({
        payment_id: 'pay_rf_01',
        refund_amount_minor: 15000,
        idempotency_key: 'req_network_err',
        simulateNetworkError: true,
      } as unknown as Parameters<typeof adminOrderRepository.processPayTRRefund>[0])
    ).rejects.toThrow(/bağlanılamadı/);

    const paymentAfter = state['payments'].find((p) => p.id === 'pay_rf_01');
    expect(paymentAfter.refunded_amount_minor).toBe(paymentBefore.refunded_amount_minor);
    expect(paymentAfter.status).toBe('paid');
  });

  it('FAIL-CLOSED: Malformed / non-JSON provider response fails closed', async () => {
    const state = getMockState();
    const paymentBefore = { ...state['payments'][0] };

    await expect(
      adminOrderRepository.processPayTRRefund({
        payment_id: 'pay_rf_01',
        refund_amount_minor: 15000,
        idempotency_key: 'req_malformed',
        simulateMalformedResponse: true,
      } as unknown as Parameters<typeof adminOrderRepository.processPayTRRefund>[0])
    ).rejects.toThrow(/Geçersiz sağlayıcı yanıtı/);

    const paymentAfter = state['payments'].find((p) => p.id === 'pay_rf_01');
    expect(paymentAfter.refunded_amount_minor).toBe(paymentBefore.refunded_amount_minor);
    expect(paymentAfter.status).toBe('paid');
  });

  it('FAIL-CLOSED: Provider rejection (e.g. insufficient funds) fails closed', async () => {
    const state = getMockState();
    const paymentBefore = { ...state['payments'][0] };

    await expect(
      adminOrderRepository.processPayTRRefund({
        payment_id: 'pay_rf_01',
        refund_amount_minor: 15000,
        idempotency_key: 'req_rejected',
        simulateProviderReject: true,
      } as unknown as Parameters<typeof adminOrderRepository.processPayTRRefund>[0])
    ).rejects.toThrow(/PayTR: Yetersiz bakiye veya işlem reddedildi/);

    const paymentAfter = state['payments'].find((p) => p.id === 'pay_rf_01');
    expect(paymentAfter.refunded_amount_minor).toBe(paymentBefore.refunded_amount_minor);
    expect(paymentAfter.status).toBe('paid');
  });

  it('SUCCESS: Partial refund transitions status to partially_refunded', async () => {
    const state = getMockState();

    const res = await adminOrderRepository.processPayTRRefund({
      payment_id: 'pay_rf_01',
      refund_amount_minor: 20000, // 200.00 TL out of 500.00 TL
      idempotency_key: 'req_partial_01',
      reason: 'Kısmi hasar',
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe('succeeded');
    expect(res.refund_id).toBeDefined();

    const paymentAfter = state['payments'].find((p) => p.id === 'pay_rf_01');
    const orderAfter = state['orders'].find((o) => o.id === 'ord_rf_01');
    expect(paymentAfter.refunded_amount_minor).toBe(20000);
    expect(paymentAfter.status).toBe('partially_refunded');
    expect(orderAfter.status).toBe('partially_refunded');
  });

  it('SUCCESS: Full cumulative refund transitions status to refunded', async () => {
    const state = getMockState();

    // First refund: 200.00 TL
    await adminOrderRepository.processPayTRRefund({
      payment_id: 'pay_rf_01',
      refund_amount_minor: 20000,
      idempotency_key: 'req_part_1',
    });

    // Second refund remaining: 300.00 TL
    const res = await adminOrderRepository.processPayTRRefund({
      payment_id: 'pay_rf_01',
      refund_amount_minor: 30000,
      idempotency_key: 'req_part_2',
    });

    expect(res.success).toBe(true);
    const paymentAfter = state['payments'].find((p) => p.id === 'pay_rf_01');
    const orderAfter = state['orders'].find((o) => o.id === 'ord_rf_01');
    expect(paymentAfter.refunded_amount_minor).toBe(50000);
    expect(paymentAfter.status).toBe('refunded');
    expect(orderAfter.status).toBe('refunded');
  });

  it('IDEMPOTENCY: Duplicate request with same idempotency key does not re-refund', async () => {
    const state = getMockState();

    const firstRes = await adminOrderRepository.processPayTRRefund({
      payment_id: 'pay_rf_01',
      refund_amount_minor: 10000,
      idempotency_key: 'req_same_key_01',
    });
    expect(firstRes.success).toBe(true);

    const paymentAfterFirst = state['payments'].find((p) => p.id === 'pay_rf_01');
    expect(paymentAfterFirst.refunded_amount_minor).toBe(10000);

    // Repeat with identical key (simulating refreshed browser or double click)
    const secondRes = await adminOrderRepository.processPayTRRefund({
      payment_id: 'pay_rf_01',
      refund_amount_minor: 10000,
      idempotency_key: 'req_same_key_01',
    });

    expect(secondRes.success).toBe(true);
    expect(secondRes.already_finalized).toBe(true);
    expect(secondRes.refund_id).toBe(firstRes.refund_id);

    // Total refunded MUST NOT double!
    const paymentAfterSecond = state['payments'].find((p) => p.id === 'pay_rf_01');
    expect(paymentAfterSecond.refunded_amount_minor).toBe(10000);
  });

  it('BOUNDS CHECK: Too-large refund exceeding remaining balance is strictly rejected', async () => {
    const state = getMockState();

    await expect(
      adminOrderRepository.processPayTRRefund({
        payment_id: 'pay_rf_01',
        refund_amount_minor: 60000, // 600.00 TL > 500.00 TL
        idempotency_key: 'req_excessive',
      })
    ).rejects.toThrow(/kalan iade edilebilir bakiyeyi aşamaz/);

    const paymentAfter = state['payments'].find((p) => p.id === 'pay_rf_01');
    expect(paymentAfter.refunded_amount_minor).toBe(0);
  });

  it('CONCURRENCY / IN-FLIGHT: In-progress refund prevents concurrent duplicate refund', async () => {
    const state = getMockState();
    // Simulate an in-flight pending refund row
    state['refunds'] = [
      {
        id: 'ref_pending_01',
        payment_id: 'pay_rf_01',
        request_id: 'inflight_req_01',
        reference_no: 'RF_INFLIGHT',
        amount_minor: 25000,
        status: 'pending',
      },
    ];

    await expect(
      adminOrderRepository.processPayTRRefund({
        payment_id: 'pay_rf_01',
        refund_amount_minor: 25000,
        idempotency_key: 'inflight_req_01',
      })
    ).rejects.toThrow(/zaten işleme alınmış/);
  });

  it('INVENTORY ISOLATION: Financial refund does not alter stock inventory', async () => {
    const state = getMockState();
    const initialVariants = state['product_variants'] ? [...state['product_variants']] : [];

    await adminOrderRepository.processPayTRRefund({
      payment_id: 'pay_rf_01',
      refund_amount_minor: 50000,
      idempotency_key: 'req_full_isolation',
    });

    const postVariants = state['product_variants'] ? [...state['product_variants']] : [];
    expect(postVariants).toEqual(initialVariants);
  });
});
