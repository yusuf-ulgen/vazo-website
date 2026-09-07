import { requireAdminSupabase } from '@/admin/shared/api/require-admin-supabase';
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

export const adminOrderRepository = {
  /**
   * Fetch paginated list of orders with filters from live Supabase
   */
  async getAdminOrders(query: AdminOrderListQuery = {}): Promise<AdminOrderListResponse> {
    const supabase = requireAdminSupabase();
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.max(1, Math.min(100, query.pageSize || 20));

    let dbQuery = supabase
      .from('orders')
      .select('*, order_items(id, quantity), payments(status)', {
        count: 'exact',
      });

    if (query.status && query.status !== 'all') {
      dbQuery = dbQuery.eq('status', query.status);
    }
    if (query.channel && query.channel !== 'all') {
      dbQuery = dbQuery.eq('channel', query.channel);
    }
    if (query.search) {
      // Sanitize search query to prevent PostgREST filter injection and syntax errors
      const cleanSearch = query.search.trim().replace(/[,()"'\\;%]/g, '');
      if (cleanSearch) {
        dbQuery = dbQuery.or(
          `order_number.ilike.%${cleanSearch}%,shipping_address->>recipient_name.ilike.%${cleanSearch}%,customer_legal_snapshot->>email.ilike.%${cleanSearch}%`
        );
      }
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
        customer_legal_snapshot?: Record<string, unknown>;
        shipping_address?: Record<string, unknown>;
        billing_address?: Record<string, unknown>;
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

      const legalSnap = row.customer_legal_snapshot || {};
      const shipAddr = row.shipping_address || {};
      const billAddr = row.billing_address || {};

      // Build customer identity strictly from immutable order snapshots
      const customerName = String(
        legalSnap.customer_name ||
        shipAddr.recipient_name ||
        billAddr.recipient_name ||
        legalSnap.full_name ||
        'Müşteri'
      );
      const customerEmail = String(
        legalSnap.customer_email ||
        legalSnap.email ||
        shipAddr.recipient_email ||
        shipAddr.email ||
        billAddr.email ||
        '—'
      );

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
   * Fetch complete order detail for admin inspection from live Supabase
   */
  async getAdminOrderById(orderId: string): Promise<AdminOrderDetail | null> {
    const supabase = requireAdminSupabase();

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
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
      order_items?: AdminOrderDetail['items'];
      order_status_history?: AdminOrderDetail['status_history'];
      order_legal_acceptances?: AdminOrderDetail['legal_acceptances'];
    };

    const legalSnap = (row.customer_legal_snapshot as Record<string, unknown>) || {};
    const shipAddr = (row.shipping_address as unknown as Record<string, unknown>) || {};
    const billAddr = (row.billing_address as unknown as Record<string, unknown>) || {};

    // Build customer identity strictly from immutable order snapshots
    const customerName = String(
      legalSnap.customer_name ||
      shipAddr.recipient_name ||
      billAddr.recipient_name ||
      legalSnap.full_name ||
      'Müşteri'
    );
    const customerEmail = String(
      legalSnap.customer_email ||
      legalSnap.email ||
      shipAddr.recipient_email ||
      shipAddr.email ||
      billAddr.email ||
      '—'
    );
    const customerPhone =
      (legalSnap.customer_phone ? String(legalSnap.customer_phone) : null) ||
      (legalSnap.phone ? String(legalSnap.phone) : null) ||
      (shipAddr.phone ? String(shipAddr.phone) : null) ||
      (billAddr.phone ? String(billAddr.phone) : null) ||
      undefined;

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
    const supabase = requireAdminSupabase();

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
    const supabase = requireAdminSupabase();

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
   * Fetch list of PayTR payment attempts and records from live Supabase
   */
  async getAdminPayments(
    query: { search?: string; status?: string; page?: number; pageSize?: number } = {}
  ): Promise<{ payments: PaymentRecord[]; total_count: number }> {
    const supabase = requireAdminSupabase();
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.max(1, Math.min(100, query.pageSize || 20));

    let dbQuery = supabase
      .from('payments')
      .select('*, orders:order_id(order_number, customer_legal_snapshot, shipping_address)', {
        count: 'exact',
      });

    if (query.status && query.status !== 'all') {
      dbQuery = dbQuery.eq('status', query.status);
    }
    if (query.search) {
      // Sanitize search query to prevent PostgREST filter injection
      const cleanSearch = query.search.trim().replace(/[,()"'\\;%]/g, '');
      if (cleanSearch) {
        dbQuery = dbQuery.ilike('merchant_oid', `%${cleanSearch}%`);
      }
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
          shipping_address?: { recipient_email?: string; email?: string };
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
      const customerEmail = legalSnap.customer_email || legalSnap.email || shipAddr.recipient_email || shipAddr.email || '—';

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
    const supabase = requireAdminSupabase();

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

    if (!data || !data.success) {
      throw new Error((data && data.error) || 'İade işlemi PayTR tarafından reddedildi.');
    }

    return data;
  },
};
