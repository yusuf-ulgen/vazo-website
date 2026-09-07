-- ==============================================================================
-- Migration: 20260830020000_phase3_recoverable_payment_schema.sql
-- Description: Phase 3.16 — Recoverable Pending Payment & Server Resume Authority
-- Author: Yusuf Ulgen / Vazo Platform Engineering
-- Standards: Server Authority, Reservation Expiry Guard, Idempotent Payment Resume
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. check_payment_resume_eligibility RPC
--    Server-authoritative check for whether an order can safely resume payment.
--    Validates:
--      - Checkout kill switch enabled
--      - Order existence
--      - Customer ownership
--      - Status is 'pending_payment' (not paid, not cancelled, not refunded)
--      - Active inventory reservation and unexpired payment timeout
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_payment_resume_eligibility(
    p_order_id UUID,
    p_customer_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_has_active_res BOOLEAN;
    v_is_expired BOOLEAN := false;
    v_payment_expires_at TIMESTAMPTZ;
    v_checkout_enabled BOOLEAN;
BEGIN
    -- 1. Kill Switch Check
    SELECT COALESCE((value->>'checkout_enabled')::boolean, false) INTO v_checkout_enabled
    FROM public.site_settings WHERE key = 'commerce';

    IF NOT COALESCE(v_checkout_enabled, false) THEN
        RETURN jsonb_build_object(
            'eligible', false,
            'reason', 'Ödeme ve sipariş sistemi şu anda kapalıdır.',
            'code', 'CHECKOUT_DISABLED'
        );
    END IF;

    -- 2. Fetch Order
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'eligible', false,
            'reason', 'Sipariş bulunamadı.',
            'code', 'ORDER_NOT_FOUND'
        );
    END IF;

    -- 3. Customer Ownership Check
    IF v_order.customer_id <> p_customer_id THEN
        RETURN jsonb_build_object(
            'eligible', false,
            'is_owner', false,
            'reason', 'Bu siparişe erişim yetkiniz bulunmamaktadır.',
            'code', 'FORBIDDEN'
        );
    END IF;

    -- 4. Terminal / Ineligible Status Checks
    IF v_order.status = 'paid' THEN
        RETURN jsonb_build_object(
            'eligible', false,
            'is_owner', true,
            'status', v_order.status,
            'reason', 'Bu siparişin ödemesi zaten tamamlanmıştır.',
            'code', 'ALREADY_PAID'
        );
    END IF;

    IF v_order.status = 'cancelled' THEN
        RETURN jsonb_build_object(
            'eligible', false,
            'is_owner', true,
            'status', v_order.status,
            'reason', 'Bu sipariş iptal edilmiştir.',
            'code', 'ORDER_CANCELLED'
        );
    END IF;

    IF v_order.status <> 'pending_payment' THEN
        RETURN jsonb_build_object(
            'eligible', false,
            'is_owner', true,
            'status', v_order.status,
            'reason', 'Sipariş ödeme aşamasında değil.',
            'code', 'INVALID_STATUS'
        );
    END IF;

    -- 5. Expiration Checks (Metadata timeout & Inventory Reservations)
    IF (v_order.metadata ? 'payment_expires_at') THEN
        v_payment_expires_at := (v_order.metadata->>'payment_expires_at')::TIMESTAMPTZ;
        IF v_payment_expires_at <= timezone('utc', now()) THEN
            v_is_expired := true;
        END IF;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.inventory_reservations
        WHERE order_id = p_order_id
          AND status = 'active'
          AND expires_at > timezone('utc', now())
    ) INTO v_has_active_res;

    IF NOT v_has_active_res OR v_is_expired THEN
        RETURN jsonb_build_object(
            'eligible', false,
            'is_owner', true,
            'is_expired', true,
            'status', v_order.status,
            'order_id', v_order.id,
            'order_number', v_order.order_number,
            'reason', 'Sipariş için ayrılan stok rezervasyon süresi dolmuştur. Lütfen yeni bir sipariş oluşturun.',
            'code', 'RESERVATION_EXPIRED'
        );
    END IF;

    -- 6. Eligible for payment resume
    RETURN jsonb_build_object(
        'eligible', true,
        'is_owner', true,
        'is_expired', false,
        'status', v_order.status,
        'order_id', v_order.id,
        'order_number', v_order.order_number,
        'subtotal_minor', v_order.subtotal_minor,
        'shipping_minor', v_order.shipping_minor,
        'total_minor', v_order.total_minor,
        'currency', v_order.currency,
        'expires_at', v_payment_expires_at
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_payment_resume_eligibility(UUID, UUID) TO authenticated;

COMMIT;
