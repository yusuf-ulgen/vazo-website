import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminOrderRepository } from '@/entities/order/api/admin-order-repository';
import * as supabaseModule from '@/shared/lib/supabase';

describe('Phase 3.14 — Real Admin Orders, Payments Data & Schema Repair', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Storefront Mock Mode Isolation Guarantee', () => {
    it('adminOrderRepository NEVER returns fake mock data even when isStorefrontMockEnabled is true', async () => {
      // Force storefront mock mode to true
      vi.spyOn(supabaseModule, 'isStorefrontMockEnabled', 'get').mockReturnValue(true);

      // Verify that admin repository still queries live Supabase client, not internal mockAdminOrders
      const client = supabaseModule.getSupabase();
      const fromSpy = vi.spyOn(client, 'from');

      const res = await adminOrderRepository.getAdminOrders({ page: 1, pageSize: 10 });

      expect(fromSpy).toHaveBeenCalledWith('orders');
      expect(res.orders).toBeDefined();
      expect(res.orders.length).toBeGreaterThanOrEqual(1);

      // Detailed order fetch also queries live Supabase
      const detail = await adminOrderRepository.getAdminOrderById('ord-test-001');
      expect(fromSpy).toHaveBeenCalledWith('orders');
      expect(detail).toBeDefined();
      expect(detail?.order_number).toBe('VZ-20260829-001');

      // Payments fetch also queries live Supabase
      const paymentsRes = await adminOrderRepository.getAdminPayments();
      expect(fromSpy).toHaveBeenCalledWith('payments');
      expect(paymentsRes.payments).toBeDefined();
    });

    it('throws fail-closed error if Supabase is unconfigured (zero fake fallback)', async () => {
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(false);

      await expect(adminOrderRepository.getAdminOrders()).rejects.toThrow(
        /Yönetici paneli için aktif veritabanı bağlantısı zorunludur/
      );

      await expect(adminOrderRepository.getAdminOrderById('ord-test-001')).rejects.toThrow(
        /Yönetici paneli için aktif veritabanı bağlantısı zorunludur/
      );

      await expect(adminOrderRepository.getAdminPayments()).rejects.toThrow(
        /Yönetici paneli için aktif veritabanı bağlantısı zorunludur/
      );
    });
  });

  describe('2. Schema Repair & Immutable Order Snapshot Precedence', () => {
    it('does NOT query nonexistent customer_profiles fields (full_name, email)', async () => {
      const client = supabaseModule.getSupabase();
      let selectArg = '';

      vi.spyOn(client, 'from').mockImplementation((table: string) => {
        if (table === 'orders') {
          return {
            select: vi.fn().mockImplementation((sel: string) => {
              selectArg = sel;
              return {
                order: vi.fn().mockReturnThis(),
                range: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              };
            }),
          } as never;
        }
        return client.from(table);
      });

      await adminOrderRepository.getAdminOrders();
      expect(selectArg).not.toContain('customer_profiles');
      expect(selectArg).not.toContain('full_name');
      expect(selectArg).not.toContain('customer_profiles:customer_id');

      await adminOrderRepository.getAdminOrderById('ord-test-001');
      expect(selectArg).not.toContain('customer_profiles');
      expect(selectArg).not.toContain('full_name');
    });

    it('builds customer identity strictly from immutable order snapshots', async () => {
      const client = supabaseModule.getSupabase();

      // Return order where shipping_address and customer_legal_snapshot have immutable snapshot data
      const mockDbOrder = {
        id: 'ord-snapshot-test',
        order_number: 'VZ-SNAP-001',
        customer_id: 'cust-uuid-456',
        channel: 'retail',
        status: 'paid',
        currency: 'TRY',
        tax_included: true,
        subtotal_minor: 500000,
        shipping_minor: 0,
        discount_minor: 0,
        tax_included_minor: 83333,
        total_minor: 500000,
        shipping_address: {
          recipient_name: 'Ahmet Snapshotçı',
          recipient_email: 'ahmet.snapshot@example.com',
          phone: '05550001122',
          address_line1: 'Nispetiye Cad. No: 12',
          city: 'İstanbul',
          country_name: 'Türkiye',
        },
        billing_address: {
          recipient_name: 'Ahmet Snapshotçı',
        },
        customer_legal_snapshot: {
          customer_id: 'cust-uuid-456',
          email: 'ahmet.immutable@example.com',
          customer_name: 'Ahmet Snapshotçı',
        },
        order_items: [],
        payments: [{ status: 'paid' }],
        refunds: [],
        order_status_history: [],
        order_legal_acceptances: [],
        created_at: '2026-08-29T10:00:00.000Z',
      };

      vi.spyOn(client, 'from').mockImplementation((table: string) => {
        if (table === 'orders') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnThis(),
              range: vi.fn().mockResolvedValue({
                data: [mockDbOrder],
                count: 1,
                error: null,
              }),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: mockDbOrder,
                error: null,
              }),
            }),
          } as never;
        }
        return client.from(table);
      });

      const listRes = await adminOrderRepository.getAdminOrders();
      expect(listRes.orders[0].customer_name).toBe('Ahmet Snapshotçı');
      expect(listRes.orders[0].customer_email).toBe('ahmet.immutable@example.com');

      const detailRes = await adminOrderRepository.getAdminOrderById('ord-snapshot-test');
      expect(detailRes?.customer_name).toBe('Ahmet Snapshotçı');
      expect(detailRes?.customer_email).toBe('ahmet.immutable@example.com');
      expect(detailRes?.customer_phone).toBe('05550001122');
    });
  });

  describe('3. PostgREST Filter Injection Protection & Search Integrity', () => {
    it('sanitizes search input against PostgREST syntax injection characters', async () => {
      const client = supabaseModule.getSupabase();
      let orFilterArg = '';

      vi.spyOn(client, 'from').mockImplementation((table: string) => {
        if (table === 'orders') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnThis(),
              range: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
              eq: vi.fn().mockReturnThis(),
              or: vi.fn().mockImplementation((expr: string) => {
                orFilterArg = expr;
                return {
                  order: vi.fn().mockReturnThis(),
                  range: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
                };
              }),
            }),
          } as never;
        }
        return client.from(table);
      });

      // Malicious search attempt with parentheses, commas, quotes, semicolons
      const maliciousSearch = `test,status.eq.paid),admin_notes.ilike."secret"`;
      await adminOrderRepository.getAdminOrders({ search: maliciousSearch });

      // Ensure dangerous characters are stripped out and no additional clauses were injected
      const clauses = orFilterArg.split(',');
      expect(clauses).toHaveLength(3);
      expect(orFilterArg).not.toContain('(');
      expect(orFilterArg).not.toContain(')');
      expect(orFilterArg).not.toContain('"');
    });

    it('sanitizes payments search query against injection', async () => {
      const client = supabaseModule.getSupabase();
      let ilikeArg = '';

      vi.spyOn(client, 'from').mockImplementation((table: string) => {
        if (table === 'payments') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnThis(),
              range: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
              eq: vi.fn().mockReturnThis(),
              ilike: vi.fn().mockImplementation((col: string, val: string) => {
                ilikeArg = val;
                return {
                  order: vi.fn().mockReturnThis(),
                  range: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
                };
              }),
            }),
          } as never;
        }
        return client.from(table);
      });

      await adminOrderRepository.getAdminPayments({ search: `VZ123,status.eq.paid` });
      expect(ilikeArg).not.toContain(',');
    });
  });

  describe('4. Server-Side RPC Authority & No Generic Mark Paid', () => {
    it('dispatches fulfillment updates via admin_update_order_fulfillment RPC', async () => {
      const client = supabaseModule.getSupabase();
      const rpcSpy = vi.spyOn(client, 'rpc');

      await adminOrderRepository.updateOrderFulfillment('ord-test-001', {
        target_status: 'shipped',
        carrier: 'MNG Kargo',
        tracking_number: 'MNG-9988',
        tracking_url: 'https://mng.com/track',
        note: 'Paketlendi',
      });

      expect(rpcSpy).toHaveBeenCalledWith('admin_update_order_fulfillment', {
        p_order_id: 'ord-test-001',
        p_target_status: 'shipped',
        p_carrier: 'MNG Kargo',
        p_tracking_number: 'MNG-9988',
        p_tracking_url: 'https://mng.com/track',
        p_note: 'Paketlendi',
      });
    });

    it('dispatches cancellation via admin_cancel_order RPC', async () => {
      const client = supabaseModule.getSupabase();
      const rpcSpy = vi.spyOn(client, 'rpc');

      await adminOrderRepository.cancelOrder('ord-test-003', {
        reason: 'Müşteri talebi',
      });

      expect(rpcSpy).toHaveBeenCalledWith('admin_cancel_order', {
        p_order_id: 'ord-test-003',
        p_reason: 'Müşteri talebi',
      });
    });

    it('dispatches refund via paytr-refund edge function, not generic mark refunded', async () => {
      const client = supabaseModule.getSupabase();
      const invokeSpy = vi.spyOn(client.functions, 'invoke');

      const res = await adminOrderRepository.processPayTRRefund({
        payment_id: 'pay-002',
        refund_amount_minor: 50000,
        reason: 'Hasarlı ürün iadesi',
      });

      expect(invokeSpy).toHaveBeenCalledWith('paytr-refund', {
        body: expect.objectContaining({
          payment_id: 'pay-002',
          refund_amount_minor: 50000,
          reason: 'Hasarlı ürün iadesi',
        }),
      });
      expect(res.success).toBe(true);
    });
  });
});
