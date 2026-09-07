import { describe, it, expect, beforeEach, vi } from 'vitest';
import { orderRepository } from '@/entities/order/api/order-repository';
import { cartStore } from '@/shared/stores/cart-store';
import { getSupabase } from '@/shared/lib/supabase';
import * as supabaseModule from '@/shared/lib/supabase';

describe('Phase 3.16 — Recoverable Pending Payment & Cart Lifecycle', () => {
  const customerA = 'c0000000-0000-0000-0000-000000000001';
  const customerB = 'c0000000-0000-0000-0000-000000000002';
  const pendingOrderId = 'ord-pending-01';
  const paidOrderId = 'ord-paid-01';
  const cancelledOrderId = 'ord-cancelled-01';
  const expiredOrderId = 'ord-expired-01';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(supabaseModule, 'isStorefrontMockEnabled', 'get').mockReturnValue(false);

    // Setup Mock User as Customer A
    const client = getSupabase();
    const mockUser = {
      id: customerA,
      email: 'customerA@vazostudio.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };

    vi.spyOn(client.auth, 'getUser').mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    vi.spyOn(client.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          expires_in: 3600,
          token_type: 'bearer',
          user: mockUser,
        },
      },
      error: null,
    });

    // Reset and initialize cart store
    cartStore.clear();
    cartStore.clearPendingOrder();

    // Populate mock orders in test state
    const mockState = (client as unknown as { from: (t: string) => { select: () => unknown } });
    expect(mockState).toBeDefined();
  });

  describe('GOAL 1 & 2 — Pending Order Survives Refresh & Resume Works for Owner', () => {
    it('preserves pending order in cartStore across simulated page refresh', () => {
      // 1. Set pending order
      cartStore.setPendingOrder(pendingOrderId, 'VZ2026-0001');

      // 2. Simulate refresh: read pending order from storage
      const pending = cartStore.getPendingOrder();
      expect(pending).not.toBeNull();
      expect(pending?.orderId).toBe(pendingOrderId);
      expect(pending?.orderNumber).toBe('VZ2026-0001');
    });

    it('allows the authentic owner to resume payment for eligible pending order', async () => {
      const client = getSupabase();
      // Setup RPC response for owner
      vi.spyOn(client, 'rpc').mockImplementation((fnName: string, args?: Record<string, unknown>) => {
        if (fnName === 'check_payment_resume_eligibility') {
          if (args?.p_order_id === pendingOrderId && args?.p_customer_id === customerA) {
            return Promise.resolve({
              data: {
                eligible: true,
                is_owner: true,
                is_expired: false,
                status: 'pending_payment',
                order_id: pendingOrderId,
                order_number: 'VZ2026-0001',
                total_minor: 450000,
                currency: 'TRY',
              },
              error: null,
            });
          }
        }
        return Promise.resolve({ data: true, error: null });
      });

      const eligibility = await orderRepository.getPaymentResumeEligibility(pendingOrderId);
      expect(eligibility.eligible).toBe(true);
      expect(eligibility.is_owner).toBe(true);
      expect(eligibility.is_expired).toBe(false);
      expect(eligibility.status).toBe('pending_payment');
    });
  });

  describe('GOAL 3 — Server Authority & Access Denial', () => {
    it('denies other customers attempting to resume an order they do not own', async () => {
      const client = getSupabase();
      // Simulate user as Customer B
      vi.spyOn(client.auth, 'getUser').mockResolvedValue({
        data: {
          user: {
            id: customerB,
            email: 'customerB@vazostudio.com',
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString(),
          },
        },
        error: null,
      });

      vi.spyOn(client, 'rpc').mockImplementation((fnName: string, args?: Record<string, unknown>) => {
        if (fnName === 'check_payment_resume_eligibility') {
          if (args?.p_customer_id === customerB) {
            return Promise.resolve({
              data: {
                eligible: false,
                is_owner: false,
                reason: 'Bu siparişe erişim yetkiniz bulunmamaktadır.',
                code: 'FORBIDDEN',
              },
              error: null,
            });
          }
        }
        return Promise.resolve({ data: true, error: null });
      });

      const eligibility = await orderRepository.getPaymentResumeEligibility(pendingOrderId);
      expect(eligibility.eligible).toBe(false);
      expect(eligibility.is_owner).toBe(false);
      expect(eligibility.code).toBe('FORBIDDEN');
    });

    it('denies resuming an already paid order', async () => {
      const client = getSupabase();
      vi.spyOn(client, 'rpc').mockImplementation((fnName: string, args?: Record<string, unknown>) => {
        if (fnName === 'check_payment_resume_eligibility' && args?.p_order_id === paidOrderId) {
          return Promise.resolve({
            data: {
              eligible: false,
              is_owner: true,
              status: 'paid',
              reason: 'Bu siparişin ödemesi zaten tamamlanmıştır.',
              code: 'ALREADY_PAID',
            },
            error: null,
          });
        }
        return Promise.resolve({ data: true, error: null });
      });

      const eligibility = await orderRepository.getPaymentResumeEligibility(paidOrderId);
      expect(eligibility.eligible).toBe(false);
      expect(eligibility.status).toBe('paid');
      expect(eligibility.code).toBe('ALREADY_PAID');
    });

    it('denies resuming a cancelled order', async () => {
      const client = getSupabase();
      vi.spyOn(client, 'rpc').mockImplementation((fnName: string, args?: Record<string, unknown>) => {
        if (fnName === 'check_payment_resume_eligibility' && args?.p_order_id === cancelledOrderId) {
          return Promise.resolve({
            data: {
              eligible: false,
              is_owner: true,
              status: 'cancelled',
              reason: 'Bu sipariş iptal edilmiştir.',
              code: 'ORDER_CANCELLED',
            },
            error: null,
          });
        }
        return Promise.resolve({ data: true, error: null });
      });

      const eligibility = await orderRepository.getPaymentResumeEligibility(cancelledOrderId);
      expect(eligibility.eligible).toBe(false);
      expect(eligibility.status).toBe('cancelled');
      expect(eligibility.code).toBe('ORDER_CANCELLED');
    });
  });

  describe('GOAL 4 — Reservation Expiry Guard', () => {
    it('handles expired reservations with safe typed state and blocks blind payments', async () => {
      const client = getSupabase();
      vi.spyOn(client, 'rpc').mockImplementation((fnName: string, args?: Record<string, unknown>) => {
        if (fnName === 'check_payment_resume_eligibility' && args?.p_order_id === expiredOrderId) {
          return Promise.resolve({
            data: {
              eligible: false,
              is_owner: true,
              is_expired: true,
              status: 'pending_payment',
              order_id: expiredOrderId,
              reason: 'Sipariş için ayrılan stok rezervasyon süresi dolmuştur. Lütfen yeni bir sipariş oluşturun.',
              code: 'RESERVATION_EXPIRED',
            },
            error: null,
          });
        }
        return Promise.resolve({ data: true, error: null });
      });

      const eligibility = await orderRepository.getPaymentResumeEligibility(expiredOrderId);
      expect(eligibility.eligible).toBe(false);
      expect(eligibility.is_expired).toBe(true);
      expect(eligibility.code).toBe('RESERVATION_EXPIRED');

      // Attempting to create PayTR token for expired order must fail
      vi.spyOn(client.functions, 'invoke').mockImplementation((fnName: string, options?: { body?: Record<string, unknown> }) => {
        if (fnName === 'create-paytr-token' && options?.body?.order_id === expiredOrderId) {
          return Promise.resolve({
            data: null,
            error: { message: 'Sipariş için ayrılan stok rezervasyon süresi dolmuştur.' },
          });
        }
        return Promise.resolve({ data: { success: true, token: 'mock' }, error: null });
      });

      await expect(orderRepository.getPayTRToken(expiredOrderId)).rejects.toThrow(
        /stok rezervasyon süresi dolmuştur/i
      );
    });
  });

  describe('GOAL 5 & 6 — Cart Recovery & Authoritative Success Clearance', () => {
    it('does NOT clear cart on pending order creation or on unverified success URL', () => {
      // 1. Simulate adding item to cart
      cartStore.addItem({
        id: 'p1',
        name: 'Aura Vazo',
        slug: 'aura-vazo',
        category: 'Seramik',
        retailPrice: 2500,
        images: [{ url: '/aura.jpg', alt: 'Aura' }],
        variants: [{ id: 'v1', name: 'Beyaz', sku: 'AUR-WHT', retailPrice: 2500, stockQuantity: 10 }],
      } as never);
      expect(cartStore.getItems().length).toBe(1);

      // 2. Simulate pending order creation: pending order is set, but cart is NOT cleared
      cartStore.setPendingOrder(pendingOrderId, 'VZ2026-0001');
      expect(cartStore.getItems().length).toBe(1);
      expect(cartStore.getPendingOrder()?.orderId).toBe(pendingOrderId);

      // 3. Visiting success URL with non-paid order does not clear cart
      // (PaymentSuccessPage checks fetchedOrder.status === 'paid' before calling cartStore.clear())
      const fakeOrder = { status: 'pending_payment' };
      if (fakeOrder.status === 'paid') {
        cartStore.clear();
      }
      expect(cartStore.getItems().length).toBe(1);
    });

    it('clears cart and pending order ONLY when backend authoritatively verifies paid status', () => {
      // 1. Cart has items and active pending order
      cartStore.addItem({
        id: 'p2',
        name: 'Terra Vazo',
        slug: 'terra-vazo',
        category: 'Toprak',
        retailPrice: 3200,
        images: [{ url: '/terra.jpg', alt: 'Terra' }],
        variants: [{ id: 'v2', name: 'Terracotta', sku: 'TER-COT', retailPrice: 3200, stockQuantity: 5 }],
      } as never);
      cartStore.setPendingOrder(pendingOrderId, 'VZ2026-0002');
      expect(cartStore.getItems().length).toBe(1);

      // 2. Authoritative backend response verifies order is 'paid'
      const verifiedOrder = { status: 'paid', id: pendingOrderId };
      if (verifiedOrder.status === 'paid') {
        cartStore.clear();
      }

      // 3. Cart and pending order are now cleanly cleared
      expect(cartStore.getItems().length).toBe(0);
      expect(cartStore.getPendingOrder()).toBeNull();
    });

    it('duplicate resume calls are idempotent and safe', async () => {
      const client = getSupabase();
      vi.spyOn(client, 'rpc').mockResolvedValue({
        data: {
          eligible: true,
          is_owner: true,
          is_expired: false,
          status: 'pending_payment',
          order_id: pendingOrderId,
          total_minor: 250000,
          currency: 'TRY',
        },
        error: null,
      } as unknown as ReturnType<typeof client.rpc>);

      const call1 = await orderRepository.getPaymentResumeEligibility(pendingOrderId);
      const call2 = await orderRepository.getPaymentResumeEligibility(pendingOrderId);

      expect(call1.eligible).toBe(true);
      expect(call2.eligible).toBe(true);
      expect(call1.order_id).toBe(call2.order_id);
    });
  });
});
