import { getSupabase, isSupabaseConfigured, isStorefrontMockEnabled } from '@/shared/lib/supabase';
import {
  AdminOrderListQuery,
  AdminOrderListResponse,
  AdminOrderDetail,
  AdminOrderSummary,
  OrderFulfillmentRequest,
  AdminCancelOrderRequest,
  AdminRefundRequest,
  AdminRefundResponse,
  PaymentRecord,
  OrderStatus,
  CurrencyCode,
} from '../types';
import { mockAdminOrders } from './admin-order-mocks';

export const adminOrderRepository = {
  /**
   * Fetch paginated list of orders with filters
   */
  async getAdminOrders(query: AdminOrderListQuery = {}): Promise<AdminOrderListResponse> {
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.max(1, Math.min(100, query.pageSize || 20));

    if (!isSupabaseConfigured || isStorefrontMockEnabled) {
      let filtered = [...mockAdminOrders];

      if (query.status && query.status !== 'all') {
        filtered = filtered.filter((o) => o.status === query.status);
      }
      if (query.channel && query.channel !== 'all') {
        filtered = filtered.filter((o) => o.channel === query.channel);
      }
      if (query.search) {
        const q = query.search.toLowerCase();
        filtered = filtered.filter(
          (o) =>
            o.order_number.toLowerCase().includes(q) ||
            o.customer_name.toLowerCase().includes(q) ||
            o.customer_email.toLowerCase().includes(q)
        );
      }

      const totalCount = filtered.length;
      const totalPages = Math.ceil(totalCount / pageSize) || 1;
      const start = (page - 1) * pageSize;
      const paginated = filtered.slice(start, start + pageSize);

      const summaries: AdminOrderSummary[] = paginated.map((o) => ({
        id: o.id,
        order_number: o.order_number,
        customer_id: o.customer_id,
        customer_name: o.customer_name,
        customer_email: o.customer_email,
        channel: o.channel,
        status: o.status,
        currency: o.currency,
        total_minor: o.total_minor,
        item_count: o.items.reduce((sum, item) => sum + item.quantity, 0),
        payment_status: o.payments[0]?.status || (o.status === 'paid' ? 'paid' : 'initiated'),
        shipping_carrier: o.shipping_carrier || null,
        shipping_tracking_number: o.shipping_tracking_number || null,
        created_at: o.created_at,
        paid_at: o.paid_at || null,
      }));

      return {
        orders: summaries,
        total_count: totalCount,
        page,
        page_size: pageSize,
        total_pages: totalPages,
      };
    }

    const supabase = getSupabase();
    let dbQuery = supabase
      .from('orders')
      .select('*, customer_profiles:customer_id(full_name, email, phone), order_items(id, quantity), payments(status)', {
        count: 'exact',
      });

    if (query.status && query.status !== 'all') {
      dbQuery = dbQuery.eq('status', query.status);
    }
    if (query.channel && query.channel !== 'all') {
      dbQuery = dbQuery.eq('channel', query.channel);
    }
    if (query.search) {
      const q = `%${query.search.trim()}%`;
      dbQuery = dbQuery.or(`order_number.ilike.${q}`);
    }

    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    const { data, count, error } = await dbQuery
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) {
      console.error('[adminOrderRepository.getAdminOrders] Error:', error);
      throw new Error(error.message || 'Siparişler yüklenemedi.');
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    const summaries: AdminOrderSummary[] = (data || []).map((rowRecord: unknown) => {
      const row = rowRecord as {
        id: string;
        order_number: string;
        customer_id: string;
        customer_profiles?: { full_name?: string; email?: string; phone?: string };
        customer_legal_snapshot?: Record<string, unknown>;
        shipping_address?: Record<string, unknown>;
        channel: 'retail' | 'wholesale';
        status: OrderStatus;
        currency: CurrencyCode;
        total_minor: number;
        order_items?: Array<{ quantity?: number }>;
        payments?: Array<{ status?: string }>;
        shipping_carrier?: string | null;
        shipping_tracking_number?: string | null;
        created_at: string;
        paid_at?: string | null;
      };

      const profile = row.customer_profiles;
      const legalSnap = row.customer_legal_snapshot || {};
      const shipAddr = row.shipping_address || {};

      const customerName = String(
        legalSnap.full_name ||
        profile?.full_name ||
        shipAddr.recipient_name ||
        'Bilinmeyen Müşteri'
      );
      const customerEmail = String(legalSnap.email || profile?.email || '—');

      const items = Array.isArray(row.order_items) ? row.order_items : [];
      const itemCount = items.reduce((sum: number, it) => sum + (it.quantity || 1), 0);

      const payments = Array.isArray(row.payments) ? row.payments : [];
      const paymentStatus = (payments[0]?.status || (row.status === 'paid' ? 'paid' : 'initiated')) as PaymentRecord['status'];

      return {
        id: row.id,
        order_number: row.order_number,
        customer_id: row.customer_id,
        customer_name: customerName,
        customer_email: customerEmail,
        channel: row.channel,
        status: row.status,
        currency: row.currency || 'TRY',
        total_minor: row.total_minor,
        item_count: itemCount,
        payment_status: paymentStatus,
        shipping_carrier: row.shipping_carrier || null,
        shipping_tracking_number: row.shipping_tracking_number || null,
        created_at: row.created_at,
        paid_at: row.paid_at || null,
      };
    });

    return {
      orders: summaries,
      total_count: totalCount,
      page,
      page_size: pageSize,
      total_pages: totalPages,
    };
  },

  /**
   * Fetch complete order detail for admin inspection
   */
  async getAdminOrderById(orderId: string): Promise<AdminOrderDetail | null> {
    if (!isSupabaseConfigured || isStorefrontMockEnabled) {
      const found = mockAdminOrders.find((o) => o.id === orderId || o.order_number === orderId);
      return found ? { ...found } : null;
    }

    const supabase = getSupabase();
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer_profiles:customer_id(full_name, email, phone),
        order_items(*),
        payments(*),
        refunds(*),
        order_status_history(*),
        order_legal_acceptances(*)
      `)
      .eq('id', orderId)
      .maybeSingle();

    if (error) {
      console.error('[adminOrderRepository.getAdminOrderById] Error:', error);
      throw new Error(error.message || 'Sipariş detayı yüklenemedi.');
    }

    if (!order) return null;

    const row = order as unknown as AdminOrderDetail & {
      customer_profiles?: { full_name?: string; email?: string; phone?: string };
      order_items?: AdminOrderDetail['items'];
      order_status_history?: AdminOrderDetail['status_history'];
      order_legal_acceptances?: AdminOrderDetail['legal_acceptances'];
    };

    const profile = row.customer_profiles;
    const legalSnap = (row.customer_legal_snapshot as Record<string, unknown>) || {};
    const shipAddr = (row.shipping_address as unknown as Record<string, unknown>) || {};

    const customerName = String(
      legalSnap.full_name ||
      profile?.full_name ||
      shipAddr.recipient_name ||
      'Müşteri'
    );
    const customerEmail = String(legalSnap.email || profile?.email || '—');
    const customerPhone = legalSnap.phone ? String(legalSnap.phone) : profile?.phone ? String(profile.phone) : shipAddr.phone ? String(shipAddr.phone) : undefined;

    return {
      id: row.id,
      order_number: row.order_number,
      customer_id: row.customer_id,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      channel: row.channel,
      status: row.status,
      currency: row.currency,
      tax_included: row.tax_included,
      subtotal_minor: row.subtotal_minor,
      shipping_minor: row.shipping_minor,
      discount_minor: row.discount_minor,
      tax_included_minor: row.tax_included_minor,
      total_minor: row.total_minor,
      shipping_address: row.shipping_address,
      billing_address: row.billing_address,
      seller_legal_snapshot: row.seller_legal_snapshot,
      customer_legal_snapshot: row.customer_legal_snapshot,
      shipping_carrier: row.shipping_carrier,
      shipping_tracking_number: row.shipping_tracking_number,
      shipping_tracking_url: row.shipping_tracking_url,
      cancellation_reason: row.cancellation_reason,
      admin_notes: row.admin_notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      paid_at: row.paid_at,
      cancelled_at: row.cancelled_at,
      shipped_at: row.shipped_at,
      delivered_at: row.delivered_at,
      items: row.order_items || row.items || [],
      payments: row.payments || [],
      refunds: row.refunds || [],
      status_history: row.order_status_history || row.status_history || [],
      legal_acceptances: row.order_legal_acceptances || row.legal_acceptances || [],
    };
  },

  /**
   * Update fulfillment status & tracking via server RPC
   */
  async updateOrderFulfillment(
    orderId: string,
    request: OrderFulfillmentRequest
  ): Promise<{ success: boolean; from_status: string; to_status: string }> {
    if (!isSupabaseConfigured || isStorefrontMockEnabled) {
      const order = mockAdminOrders.find((o) => o.id === orderId);
      if (!order) throw new Error('Sipariş bulunamadı.');

      const fromStatus = order.status;
      order.status = request.target_status;
      if (request.target_status === 'shipped') {
        order.shipping_carrier = request.carrier || 'Kargo';
        order.shipping_tracking_number = request.tracking_number || 'TRK123';
        order.shipping_tracking_url = request.tracking_url || null;
        order.shipped_at = new Date().toISOString();
      } else if (request.target_status === 'delivered') {
        order.delivered_at = new Date().toISOString();
      }
      order.status_history.push({
        id: `hist-${Date.now()}`,
        order_id: orderId,
        from_status: fromStatus,
        to_status: request.target_status,
        actor_type: 'admin',
        actor_id: 'admin-mock',
        note: request.note || `Durum güncellendi: ${request.target_status}`,
        created_at: new Date().toISOString(),
      });

      return { success: true, from_status: fromStatus, to_status: request.target_status };
    }

    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('admin_update_order_fulfillment', {
      p_order_id: orderId,
      p_target_status: request.target_status,
      p_carrier: request.carrier || null,
      p_tracking_number: request.tracking_number || null,
      p_tracking_url: request.tracking_url || null,
      p_note: request.note || null,
    });

    if (error) {
      console.error('[adminOrderRepository.updateOrderFulfillment] Error:', error);
      throw new Error(error.message || 'Kargo durumu güncellenemedi.');
    }

    return data;
  },

  /**
   * Cancel an unpaid order via server RPC
   */
  async cancelOrder(
    orderId: string,
    request: AdminCancelOrderRequest
  ): Promise<{ success: boolean; from_status: string; to_status: string }> {
    if (!isSupabaseConfigured || isStorefrontMockEnabled) {
      const order = mockAdminOrders.find((o) => o.id === orderId);
      if (!order) throw new Error('Sipariş bulunamadı.');

      if (['paid', 'shipped', 'delivered'].includes(order.status)) {
        throw new Error('Ödenmiş sipariş doğrudan iptal edilemez. Lütfen İade (Refund) sürecini kullanın.');
      }

      const fromStatus = order.status;
      order.status = 'cancelled';
      order.cancellation_reason = request.reason;
      order.cancelled_at = new Date().toISOString();
      order.status_history.push({
        id: `hist-${Date.now()}`,
        order_id: orderId,
        from_status: fromStatus,
        to_status: 'cancelled',
        actor_type: 'admin',
        actor_id: 'admin-mock',
        note: `İptal edildi: ${request.reason}`,
        created_at: new Date().toISOString(),
      });

      return { success: true, from_status: fromStatus, to_status: 'cancelled' };
    }

    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('admin_cancel_order', {
      p_order_id: orderId,
      p_reason: request.reason,
    });

    if (error) {
      console.error('[adminOrderRepository.cancelOrder] Error:', error);
      throw new Error(error.message || 'Sipariş iptal edilemedi.');
    }

    return data;
  },

  /**
   * Fetch list of PayTR payment attempts and records
   */
  async getAdminPayments(
    query: { search?: string; status?: string; page?: number; pageSize?: number } = {}
  ): Promise<{ payments: PaymentRecord[]; total_count: number }> {
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.max(1, Math.min(100, query.pageSize || 20));

    if (!isSupabaseConfigured || isStorefrontMockEnabled) {
      const allPayments: PaymentRecord[] = mockAdminOrders.flatMap((o) => o.payments);
      let filtered = [...allPayments];

      if (query.status && query.status !== 'all') {
        filtered = filtered.filter((p) => p.status === query.status);
      }
      if (query.search) {
        const q = query.search.toLowerCase();
        filtered = filtered.filter((p) => p.merchant_oid.toLowerCase().includes(q));
      }

      return {
        payments: filtered.slice((page - 1) * pageSize, page * pageSize),
        total_count: filtered.length,
      };
    }

    const supabase = getSupabase();
    let dbQuery = supabase
      .from('payments')
      .select('*, orders:order_id(order_number, customer_legal_snapshot, shipping_address)', {
        count: 'exact',
      });

    if (query.status && query.status !== 'all') {
      dbQuery = dbQuery.eq('status', query.status);
    }
    if (query.search) {
      const q = `%${query.search.trim()}%`;
      dbQuery = dbQuery.ilike('merchant_oid', q);
    }

    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    const { data, count, error } = await dbQuery
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) {
      console.error('[adminOrderRepository.getAdminPayments] Error:', error);
      throw new Error(error.message || 'Ödeme kayıtları yüklenemedi.');
    }

    const records: PaymentRecord[] = (data || []).map((rowRecord: unknown) => {
      const row = rowRecord as {
        id: string;
        order_id: string;
        orders?: {
          order_number?: string;
          customer_legal_snapshot?: Record<string, unknown>;
          shipping_address?: { recipient_email?: string };
        };
        provider: 'paytr';
        merchant_oid: string;
        status: PaymentRecord['status'];
        expected_amount_minor: number;
        refunded_amount_minor?: number;
        currency: CurrencyCode;
        test_mode: boolean;
        failure_code?: string | null;
        failure_message_safe?: string | null;
        initiated_at: string;
        expires_at: string;
        paid_at?: string | null;
        created_at: string;
      };

      const order = row.orders;
      const legalSnap = (order?.customer_legal_snapshot as Record<string, string>) || {};
      const shipAddr = order?.shipping_address || {};
      const customerEmail = legalSnap.email || shipAddr.recipient_email || '—';

      return {
        id: row.id,
        order_id: row.order_id,
        order_number: order?.order_number,
        customer_email: customerEmail,
        provider: row.provider,
        merchant_oid: row.merchant_oid,
        status: row.status,
        expected_amount_minor: row.expected_amount_minor,
        refunded_amount_minor: row.refunded_amount_minor || 0,
        currency: row.currency || 'TRY',
        test_mode: row.test_mode,
        failure_code: row.failure_code || null,
        failure_message_safe: row.failure_message_safe || null,
        initiated_at: row.initiated_at,
        expires_at: row.expires_at,
        paid_at: row.paid_at || null,
        created_at: row.created_at,
      };
    });

    return {
      payments: records,
      total_count: count || 0,
    };
  },

  /**
   * Dispatch PayTR refund request through paytr-refund Edge Function
   */
  async processPayTRRefund(request: AdminRefundRequest): Promise<AdminRefundResponse> {
    if (!isSupabaseConfigured || isStorefrontMockEnabled) {
      const order = mockAdminOrders.find((o) => o.payments.some((p) => p.id === request.payment_id));
      if (!order) throw new Error('Ödeme kaydı bulunamadı.');

      const payment = order.payments.find((p) => p.id === request.payment_id)!;
      const remaining = payment.expected_amount_minor - payment.refunded_amount_minor;

      if (request.refund_amount_minor > remaining) {
        throw new Error('İade tutarı kalan iade edilebilir bakiyeyi aşamaz.');
      }

      payment.refunded_amount_minor += request.refund_amount_minor;
      const newStatus: OrderStatus =
        payment.refunded_amount_minor >= payment.expected_amount_minor ? 'refunded' : 'partially_refunded';
      payment.status = newStatus;
      order.status = newStatus;

      const refRecord = {
        id: `ref-${Date.now()}`,
        order_id: order.id,
        payment_id: payment.id,
        request_id: request.idempotency_key || `req-${Date.now()}`,
        reference_no: `RF${Date.now()}`,
        amount_minor: request.refund_amount_minor,
        currency: payment.currency,
        status: 'succeeded' as const,
        requested_by: 'admin-mock',
        safe_reason: request.reason || null,
        provider_reference: `mock_paytr_ret_${Date.now()}`,
        provider_error_code: null,
        provider_error_message: null,
        requested_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      order.refunds.push(refRecord);

      return {
        success: true,
        refund_id: refRecord.id,
        reference_no: refRecord.reference_no,
        provider_reference: refRecord.provider_reference,
        status: 'succeeded',
      };
    }

    const supabase = getSupabase();
    const { data, error } = await supabase.functions.invoke('paytr-refund', {
      body: {
        payment_id: request.payment_id,
        refund_amount_minor: request.refund_amount_minor,
        reason: request.reason,
        idempotency_key: request.idempotency_key,
      },
    });

    if (error) {
      console.error('[adminOrderRepository.processPayTRRefund] Error:', error);
      throw new Error(error.message || 'İade işlemi başlatılamadı.');
    }

    if (!data.success) {
      throw new Error(data.error || 'İade işlemi PayTR tarafından reddedildi.');
    }

    return data;
  },
};
