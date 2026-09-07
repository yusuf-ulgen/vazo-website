// Mock RPC dispatcher for Supabase mock client in tests

export function handleMockRpc(
  state: Record<string, Record<string, unknown>[]>,
  fnName: string,
  args?: Record<string, unknown>
): Promise<{ data: unknown; error: unknown }> {
  if (fnName === 'log_admin_audit_event' && args) {
    if (!state['admin_audit_logs']) state['admin_audit_logs'] = [];
    state['admin_audit_logs'].unshift({
      id: `audit-${Date.now()}`,
      action: args.p_action,
      entity_type: args.p_entity_type,
      entity_id: args.p_entity_id,
      entity_name: args.p_entity_name,
      safe_metadata: args.p_safe_metadata || args.p_metadata || null,
      created_at: new Date().toISOString(),
    });
    return Promise.resolve({ data: true, error: null });
  }

  if (fnName === 'admin_update_order_fulfillment' && args) {
    const orderId = args.p_order_id as string;
    const targetOrder = (state['orders'] || []).find((o) => o.id === orderId);
    if (!targetOrder) {
      return Promise.resolve({ data: null, error: { message: `Sipariş bulunamadı: ${orderId}` } });
    }
    const fromStatus = targetOrder.status as string;
    const toStatus = args.p_target_status as string;
    targetOrder.status = toStatus;
    if (toStatus === 'shipped') {
      targetOrder.shipping_carrier = args.p_carrier || 'Kargo';
      targetOrder.shipping_tracking_number = args.p_tracking_number || 'TRK123';
      targetOrder.shipping_tracking_url = args.p_tracking_url || null;
      targetOrder.shipped_at = new Date().toISOString();
    } else if (toStatus === 'delivered') {
      targetOrder.delivered_at = new Date().toISOString();
    }
    return Promise.resolve({
      data: { success: true, from_status: fromStatus, to_status: toStatus },
      error: null,
    });
  }

  if (fnName === 'admin_cancel_order' && args) {
    const orderId = args.p_order_id as string;
    const targetOrder = (state['orders'] || []).find((o) => o.id === orderId);
    if (!targetOrder) {
      return Promise.resolve({ data: null, error: { message: `Sipariş bulunamadı: ${orderId}` } });
    }
    if (['paid', 'shipped', 'delivered', 'partially_refunded', 'refunded'].includes(targetOrder.status as string)) {
      return Promise.resolve({
        data: null,
        error: { message: 'Ödenmiş sipariş doğrudan iptal edilemez. Lütfen İade (Refund) sürecini kullanın.' },
      });
    }
    const fromStatus = targetOrder.status as string;
    targetOrder.status = 'cancelled';
    targetOrder.cancellation_reason = args.p_reason as string;
    targetOrder.cancelled_at = new Date().toISOString();
    return Promise.resolve({
      data: { success: true, from_status: fromStatus, to_status: 'cancelled' },
      error: null,
    });
  }

  if (fnName === 'admin_update_commerce_settings' && args) {
    if (!state['site_settings']) state['site_settings'] = [];
    let existing = state['site_settings'].find((s) => s.key === 'commerce');
    if (!existing) {
      existing = {
        key: 'commerce',
        value: {
          free_shipping_threshold: 0,
          shipping_estimate_text: '',
          shipping_summary: '',
          returns_policy_text: '',
          checkout_enabled: false,
        },
        is_public: true,
        updated_at: new Date().toISOString(),
      };
      state['site_settings'].push(existing);
    }
    const currentValue = (existing.value as Record<string, unknown>) || {};
    existing.value = {
      ...currentValue,
      free_shipping_threshold: Number(args.p_free_shipping_threshold) || 0,
      shipping_estimate_text: String(args.p_shipping_estimate_text || ''),
      shipping_summary: String(args.p_shipping_summary || ''),
      returns_policy_text: String(args.p_returns_policy_text || ''),
    };
    existing.updated_at = new Date().toISOString();
    return Promise.resolve({ data: existing.value, error: null });
  }

  if (fnName === 'admin_enable_checkout' && args) {
    if (!state['site_settings']) state['site_settings'] = [];
    let existing = state['site_settings'].find((s) => s.key === 'commerce');
    if (!existing) {
      existing = {
        key: 'commerce',
        value: { checkout_enabled: Boolean(args.p_enabled) },
        is_public: true,
        updated_at: new Date().toISOString(),
      };
      state['site_settings'].push(existing);
    } else {
      existing.value = {
        ...((existing.value as Record<string, unknown>) || {}),
        checkout_enabled: Boolean(args.p_enabled),
      };
      existing.updated_at = new Date().toISOString();
    }
    return Promise.resolve({ data: { success: true, checkout_enabled: Boolean(args.p_enabled) }, error: null });
  }

  if (fnName === 'get_checkout_readiness') {
    const commerce = (state['site_settings'] || []).find((s) => s.key === 'commerce');
    const isEnabled = Boolean((commerce?.value as Record<string, unknown>)?.checkout_enabled);
    return Promise.resolve({
      data: {
        seller_legal_complete: true,
        checkout_enabled: isEnabled,
        has_active_shipping: true,
        paytr_secrets_present: true,
        gmail_secrets_present: true,
        seller_fields_summary: {},
      },
      error: null,
    });
  }

  if (fnName === 'check_payment_resume_eligibility' && args) {
    const orderId = args.p_order_id as string;
    const customerId = args.p_customer_id as string;

    const commerce = (state['site_settings'] || []).find((s) => s.key === 'commerce');
    const isCheckoutEnabled = (commerce?.value as Record<string, unknown>)?.checkout_enabled !== false;
    if (!isCheckoutEnabled) {
      return Promise.resolve({
        data: { eligible: false, reason: 'Ödeme ve sipariş sistemi şu anda kapalıdır.', code: 'CHECKOUT_DISABLED' },
        error: null,
      });
    }

    const orders = state['orders'] || [];
    const order = orders.find((o) => o.id === orderId || o.order_number === orderId);
    if (!order) {
      return Promise.resolve({
        data: { eligible: false, reason: 'Sipariş bulunamadı.', code: 'ORDER_NOT_FOUND' },
        error: null,
      });
    }

    if (order.customer_id && customerId && order.customer_id !== customerId) {
      return Promise.resolve({
        data: { eligible: false, is_owner: false, reason: 'Bu siparişe erişim yetkiniz bulunmamaktadır.', code: 'FORBIDDEN' },
        error: null,
      });
    }

    if (order.status === 'paid') {
      return Promise.resolve({
        data: { eligible: false, is_owner: true, status: 'paid', reason: 'Bu siparişin ödemesi zaten tamamlanmıştır.', code: 'ALREADY_PAID' },
        error: null,
      });
    }

    if (order.status === 'cancelled') {
      return Promise.resolve({
        data: { eligible: false, is_owner: true, status: 'cancelled', reason: 'Bu sipariş iptal edilmiştir.', code: 'ORDER_CANCELLED' },
        error: null,
      });
    }

    if (order.status !== 'pending_payment') {
      return Promise.resolve({
        data: { eligible: false, is_owner: true, status: order.status, reason: 'Sipariş ödeme aşamasında değil.', code: 'INVALID_STATUS' },
        error: null,
      });
    }

    const isExpired = order.is_expired === true;
    if (isExpired) {
      return Promise.resolve({
        data: {
          eligible: false,
          is_owner: true,
          is_expired: true,
          status: order.status,
          order_id: order.id,
          order_number: order.order_number,
          reason: 'Sipariş için ayrılan stok rezervasyon süresi dolmuştur.',
          code: 'RESERVATION_EXPIRED',
        },
        error: null,
      });
    }

    return Promise.resolve({
      data: {
        eligible: true,
        is_owner: true,
        is_expired: false,
        status: order.status,
        order_id: order.id,
        order_number: order.order_number,
        subtotal_minor: order.subtotal_minor || order.total_minor,
        shipping_minor: order.shipping_minor || 0,
        total_minor: order.total_minor,
        currency: order.currency || 'TRY',
      },
      error: null,
    });
  }

  return Promise.resolve({ data: true, error: null });
}
