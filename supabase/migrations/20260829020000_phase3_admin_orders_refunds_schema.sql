-- ==============================================================================
-- Migration: 20260829020000_phase3_admin_orders_refunds_schema.sql
-- Description: Phase 3.7 Admin Orders, Payments, Real Fulfillment & PayTR Refunds
-- Author: Yusuf Ulgen / Vazo Platform Engineering
-- Standards: ISO-4217 minor units, Pessimistic row-locking (FOR UPDATE),
--            is_admin() server RBAC, Atomic refund ledger, Safe restock decoupling.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Schema Enhancements on Payments & Refunds
-- ------------------------------------------------------------------------------

ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS refunded_amount_minor BIGINT NOT NULL DEFAULT 0 CHECK (refunded_amount_minor >= 0);

ALTER TABLE public.refunds
ADD COLUMN IF NOT EXISTS provider_reference TEXT;

CREATE INDEX IF NOT EXISTS idx_payments_refunded_amount ON public.payments(refunded_amount_minor);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON public.refunds(status);

-- ------------------------------------------------------------------------------
-- 2. Admin Order Fulfillment RPC
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_update_order_fulfillment(
    p_order_id UUID,
    p_target_status TEXT,
    p_carrier TEXT DEFAULT NULL,
    p_tracking_number TEXT DEFAULT NULL,
    p_tracking_url TEXT DEFAULT NULL,
    p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_clean_carrier TEXT := trim(COALESCE(p_carrier, ''));
    v_clean_tracking TEXT := trim(COALESCE(p_tracking_number, ''));
    v_clean_url TEXT := trim(COALESCE(p_tracking_url, ''));
    v_diff JSONB;
BEGIN
    -- 1. Enforce Admin RBAC
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Erişim engellendi: Bu işlem için yönetici yetkisi gereklidir.';
    END IF;

    -- 2. Lock Order Row
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sipariş bulunamadı: %', p_order_id;
    END IF;

    -- 3. Validate Target Status
    IF p_target_status NOT IN ('processing', 'shipped', 'delivered') THEN
        RAISE EXCEPTION 'Geçersiz gönderi durumu: %', p_target_status;
    END IF;

    -- 4. Status Transition Validation
    IF v_order.status IN ('pending_payment', 'payment_failed', 'cancelled') THEN
        RAISE EXCEPTION 'Ödenmemiş veya iptal edilmiş sipariş üzerinde kargo/gönderi işlemi yapılamaz. Mevcut durum: %', v_order.status;
    END IF;

    IF p_target_status = 'shipped' THEN
        IF v_clean_carrier = '' OR v_clean_tracking = '' THEN
            RAISE EXCEPTION 'Siparişi kargolandı durumuna almak için kargo firması ve takip numarası zorunludur.';
        END IF;
    END IF;

    IF p_target_status = 'delivered' AND v_order.status != 'shipped' THEN
        RAISE EXCEPTION 'Yalnızca kargolanmış (shipped) siparişler teslim edildi (delivered) durumuna alınabilir.';
    END IF;

    -- 5. Perform Status and Tracking Updates
    IF p_target_status = 'processing' THEN
        UPDATE public.orders
        SET status = 'processing',
            updated_at = timezone('utc', now())
        WHERE id = p_order_id;
    ELSIF p_target_status = 'shipped' THEN
        UPDATE public.orders
        SET status = 'shipped',
            shipping_carrier = v_clean_carrier,
            shipping_tracking_number = v_clean_tracking,
            shipping_tracking_url = NULLIF(v_clean_url, ''),
            shipped_at = COALESCE(shipped_at, timezone('utc', now())),
            updated_at = timezone('utc', now())
        WHERE id = p_order_id;
    ELSIF p_target_status = 'delivered' THEN
        UPDATE public.orders
        SET status = 'delivered',
            delivered_at = COALESCE(delivered_at, timezone('utc', now())),
            updated_at = timezone('utc', now())
        WHERE id = p_order_id;
    END IF;

    -- 6. Insert Order Status History
    INSERT INTO public.order_status_history (
        order_id,
        from_status,
        to_status,
        actor_type,
        actor_id,
        note,
        created_at
    ) VALUES (
        p_order_id,
        v_order.status,
        p_target_status,
        'admin',
        auth.uid(),
        COALESCE(p_note, 'Yönetici kargo/teslimat durum güncellemesi: ' || p_target_status),
        timezone('utc', now())
    );

    -- 7. Insert Admin Audit Log
    v_diff := jsonb_build_object(
        'from_status', v_order.status,
        'to_status', p_target_status,
        'carrier', v_clean_carrier,
        'tracking_number', v_clean_tracking,
        'tracking_url', v_clean_url,
        'note', p_note
    );

    INSERT INTO public.admin_audit_logs (
        admin_id,
        action,
        resource_type,
        resource_id,
        diff,
        created_at
    ) VALUES (
        auth.uid(),
        'UPDATE_ORDER_FULFILLMENT',
        'order',
        p_order_id,
        v_diff,
        timezone('utc', now())
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'from_status', v_order.status,
        'to_status', p_target_status
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 3. Admin Order Cancellation RPC (Safe unpaid release)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_cancel_order(
    p_order_id UUID,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_res RECORD;
    v_clean_reason TEXT := trim(COALESCE(p_reason, ''));
BEGIN
    -- 1. Enforce Admin RBAC
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Erişim engellendi: Bu işlem için yönetici yetkisi gereklidir.';
    END IF;

    -- 2. Lock Order Row
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sipariş bulunamadı: %', p_order_id;
    END IF;

    -- 3. Invariant: Paid orders cannot be cancelled directly without refund
    IF v_order.status IN ('paid', 'processing', 'shipped', 'delivered', 'partially_refunded', 'refunded') THEN
        RAISE EXCEPTION 'Ödenmiş veya kısmen iade edilmiş siparişler doğrudan iptal edilemez. Lütfen İade (Refund) sürecini kullanın. Mevcut durum: %', v_order.status;
    END IF;

    IF v_order.status = 'cancelled' THEN
        RETURN jsonb_build_object(
            'success', true,
            'already_cancelled', true,
            'order_id', p_order_id
        );
    END IF;

    IF v_clean_reason = '' THEN
        RAISE EXCEPTION 'Sipariş iptali için geçerli bir iptal nedeni zorunludur.';
    END IF;

    -- 4. Update Order to Cancelled
    UPDATE public.orders
    SET status = 'cancelled',
        cancellation_reason = v_clean_reason,
        cancelled_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
    WHERE id = p_order_id;

    -- 5. Release any active inventory reservations
    FOR v_res IN
        SELECT *
        FROM public.inventory_reservations
        WHERE order_id = p_order_id AND status = 'reserved'
        FOR UPDATE
    LOOP
        UPDATE public.inventory_reservations
        SET status = 'released',
            released_at = timezone('utc', now())
        WHERE id = v_res.id;

        INSERT INTO public.inventory_movements (
            variant_id,
            order_id,
            quantity_delta,
            movement_type,
            safe_reason,
            actor_type,
            actor_id,
            created_at
        ) VALUES (
            v_res.variant_id,
            p_order_id,
            v_res.quantity,
            'order_cancellation_release',
            'Sipariş yönetici tarafından iptal edildi: ' || v_clean_reason,
            'admin',
            auth.uid(),
            timezone('utc', now())
        );
    END LOOP;

    -- 6. Insert Order Status History
    INSERT INTO public.order_status_history (
        order_id,
        from_status,
        to_status,
        actor_type,
        actor_id,
        note,
        created_at
    ) VALUES (
        p_order_id,
        v_order.status,
        'cancelled',
        'admin',
        auth.uid(),
        'Yönetici sipariş iptali: ' || v_clean_reason,
        timezone('utc', now())
    );

    -- 7. Audit Log
    INSERT INTO public.admin_audit_logs (
        admin_id,
        action,
        resource_type,
        resource_id,
        diff,
        created_at
    ) VALUES (
        auth.uid(),
        'CANCEL_ORDER',
        'order',
        p_order_id,
        jsonb_build_object('reason', v_clean_reason, 'from_status', v_order.status),
        timezone('utc', now())
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'from_status', v_order.status,
        'to_status', 'cancelled'
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 4. Admin Refund Preparation RPC
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prepare_admin_refund(
    p_payment_id UUID,
    p_refund_amount_minor BIGINT,
    p_reason TEXT,
    p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_payment RECORD;
    v_order RECORD;
    v_existing_refund RECORD;
    v_remaining_refundable_minor BIGINT;
    v_reference_no TEXT;
    v_refund_id UUID;
    v_clean_reason TEXT := trim(COALESCE(p_reason, ''));
    v_clean_idempotency TEXT := trim(COALESCE(p_idempotency_key, ''));
BEGIN
    -- 1. Enforce Admin RBAC
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Erişim engellendi: İade başlatmak için yönetici yetkisi gereklidir.';
    END IF;

    IF v_clean_idempotency = '' THEN
        RAISE EXCEPTION 'İade işlemi için idempotency anahtarı zorunludur.';
    END IF;

    -- 2. Check Existing Idempotency
    SELECT * INTO v_existing_refund
    FROM public.refunds
    WHERE request_id = v_clean_idempotency;

    IF FOUND THEN
        SELECT merchant_oid INTO v_payment FROM public.payments WHERE id = v_existing_refund.payment_id;
        RETURN jsonb_build_object(
            'success', true,
            'already_prepared', true,
            'refund_id', v_existing_refund.id,
            'reference_no', v_existing_refund.reference_no,
            'merchant_oid', v_payment.merchant_oid,
            'amount_minor', v_existing_refund.amount_minor,
            'currency', v_existing_refund.currency,
            'status', v_existing_refund.status
        );
    END IF;

    -- 3. Lock Payment and Order
    SELECT * INTO v_payment
    FROM public.payments
    WHERE id = p_payment_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ödeme kaydı bulunamadı: %', p_payment_id;
    END IF;

    SELECT * INTO v_order
    FROM public.orders
    WHERE id = v_payment.order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'İlişkili sipariş kaydı bulunamadı.';
    END IF;

    -- 4. Invariant Validations
    IF v_payment.status NOT IN ('paid', 'partially_refunded') THEN
        RAISE EXCEPTION 'Yalnızca başarılı (paid) veya kısmen iade edilmiş (partially_refunded) ödemelere iade yapılabilir. Mevcut durum: %', v_payment.status;
    END IF;

    IF p_refund_amount_minor <= 0 THEN
        RAISE EXCEPTION 'İade tutarı 0''dan büyük bir tamsayı kuruş değeri olmalıdır.';
    END IF;

    v_remaining_refundable_minor := v_payment.expected_amount_minor - v_payment.refunded_amount_minor;

    IF p_refund_amount_minor > v_remaining_refundable_minor THEN
        RAISE EXCEPTION 'Talep edilen iade tutarı (% TL), kalan iade edilebilir bakiyeyi (% TL) aşamaz.',
            (p_refund_amount_minor::numeric / 100)::text,
            (v_remaining_refundable_minor::numeric / 100)::text;
    END IF;

    -- 5. Generate Safe Alphanumeric Reference No (strictly <= 64 chars)
    v_reference_no := 'RF' || to_char(timezone('utc', now()), 'YYYYMMDD') || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10));

    -- 6. Insert Pending Refund Record
    INSERT INTO public.refunds (
        order_id,
        payment_id,
        request_id,
        reference_no,
        amount_minor,
        currency,
        status,
        requested_by,
        safe_reason,
        requested_at,
        created_at,
        updated_at
    ) VALUES (
        v_order.id,
        v_payment.id,
        v_clean_idempotency,
        v_reference_no,
        p_refund_amount_minor,
        v_payment.currency,
        'pending',
        auth.uid(),
        NULLIF(v_clean_reason, ''),
        timezone('utc', now()),
        timezone('utc', now()),
        timezone('utc', now())
    )
    RETURNING id INTO v_refund_id;

    RETURN jsonb_build_object(
        'success', true,
        'already_prepared', false,
        'refund_id', v_refund_id,
        'reference_no', v_reference_no,
        'merchant_oid', v_payment.merchant_oid,
        'amount_minor', p_refund_amount_minor,
        'currency', v_payment.currency,
        'status', 'pending'
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. Admin Refund Finalization RPC
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.finalize_admin_refund(
    p_refund_id UUID,
    p_is_success BOOLEAN,
    p_provider_reference TEXT DEFAULT NULL,
    p_error_code TEXT DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_refund RECORD;
    v_payment RECORD;
    v_order RECORD;
    v_new_refunded_minor BIGINT;
    v_new_payment_status TEXT;
    v_new_order_status TEXT;
BEGIN
    -- 1. Enforce Admin RBAC
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Erişim engellendi: İade sonuçlandırmak için yönetici yetkisi gereklidir.';
    END IF;

    -- 2. Lock Refund
    SELECT * INTO v_refund
    FROM public.refunds
    WHERE id = p_refund_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'İade kaydı bulunamadı: %', p_refund_id;
    END IF;

    IF v_refund.status IN ('succeeded', 'failed') THEN
        RETURN jsonb_build_object(
            'success', true,
            'already_finalized', true,
            'refund_id', p_refund_id,
            'status', v_refund.status
        );
    END IF;

    -- 3. Lock Payment and Order
    SELECT * INTO v_payment
    FROM public.payments
    WHERE id = v_refund.payment_id
    FOR UPDATE;

    SELECT * INTO v_order
    FROM public.orders
    WHERE id = v_refund.order_id
    FOR UPDATE;

    -- 4. Handle Success vs Failure
    IF p_is_success THEN
        v_new_refunded_minor := v_payment.refunded_amount_minor + v_refund.amount_minor;

        IF v_new_refunded_minor >= v_payment.expected_amount_minor THEN
            v_new_payment_status := 'refunded';
            v_new_order_status := 'refunded';
        ELSE
            v_new_payment_status := 'partially_refunded';
            v_new_order_status := 'partially_refunded';
        END IF;

        -- Update Refund Record
        UPDATE public.refunds
        SET status = 'succeeded',
            provider_reference = NULLIF(trim(COALESCE(p_provider_reference, '')), ''),
            completed_at = timezone('utc', now()),
            updated_at = timezone('utc', now())
        WHERE id = p_refund_id;

        -- Update Payment Record
        UPDATE public.payments
        SET refunded_amount_minor = v_new_refunded_minor,
            status = v_new_payment_status,
            updated_at = timezone('utc', now())
        WHERE id = v_payment.id;

        -- Update Order Record
        UPDATE public.orders
        SET status = v_new_order_status,
            updated_at = timezone('utc', now())
        WHERE id = v_order.id;

        -- Status History
        INSERT INTO public.order_status_history (
            order_id,
            from_status,
            to_status,
            actor_type,
            actor_id,
            note,
            created_at
        ) VALUES (
            v_order.id,
            v_order.status,
            v_new_order_status,
            'admin',
            auth.uid(),
            'PayTR iade işlemi başarıyla tamamlandı. İade Tutarı: ' || (v_refund.amount_minor::numeric / 100)::text || ' ' || v_refund.currency || ' (Ref: ' || v_refund.reference_no || ')',
            timezone('utc', now())
        );

        -- Audit Log
        INSERT INTO public.admin_audit_logs (
            admin_id,
            action,
            resource_type,
            resource_id,
            diff,
            created_at
        ) VALUES (
            auth.uid(),
            'REFUND_ORDER_SUCCESS',
            'refund',
            p_refund_id,
            jsonb_build_object(
                'order_id', v_order.id,
                'payment_id', v_payment.id,
                'amount_minor', v_refund.amount_minor,
                'total_refunded_minor', v_new_refunded_minor,
                'new_order_status', v_new_order_status,
                'provider_reference', p_provider_reference
            ),
            timezone('utc', now())
        );

        -- Enqueue Transactional Email (Refund Confirmation)
        INSERT INTO public.transactional_emails (
            order_id,
            recipient_email,
            template_key,
            payload,
            status,
            created_at,
            updated_at
        ) VALUES (
            v_order.id,
            COALESCE((v_order.customer_legal_snapshot->>'email'), (v_order.shipping_address->>'recipient_email'), 'customer@example.com'),
            'order_refunded',
            jsonb_build_object(
                'order_number', v_order.order_number,
                'refund_amount_minor', v_refund.amount_minor,
                'currency', v_refund.currency,
                'reference_no', v_refund.reference_no,
                'is_full_refund', (v_new_order_status = 'refunded')
            ),
            'pending',
            timezone('utc', now()),
            timezone('utc', now())
        );
    ELSE
        -- Update Refund Record as Failed
        UPDATE public.refunds
        SET status = 'failed',
            provider_error_code = NULLIF(trim(COALESCE(p_error_code, '')), ''),
            provider_error_message = NULLIF(trim(COALESCE(p_error_message, '')), ''),
            completed_at = timezone('utc', now()),
            updated_at = timezone('utc', now())
        WHERE id = p_refund_id;

        -- Audit Log for Failure
        INSERT INTO public.admin_audit_logs (
            admin_id,
            action,
            resource_type,
            resource_id,
            diff,
            created_at
        ) VALUES (
            auth.uid(),
            'REFUND_ORDER_FAILED',
            'refund',
            p_refund_id,
            jsonb_build_object(
                'order_id', v_order.id,
                'payment_id', v_payment.id,
                'error_code', p_error_code,
                'error_message', p_error_message
            ),
            timezone('utc', now())
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'refund_id', p_refund_id,
        'status', CASE WHEN p_is_success THEN 'succeeded' ELSE 'failed' END
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. Real Admin Dashboard Metrics RPC
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_metrics()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_paid_revenue_minor BIGINT := 0;
    v_paid_orders_count INTEGER := 0;
    v_pending_orders_count INTEGER := 0;
    v_awaiting_fulfillment_count INTEGER := 0;
    v_refunded_total_minor BIGINT := 0;
    v_total_products_count INTEGER := 0;
    v_low_stock_variants_count INTEGER := 0;
BEGIN
    -- 1. Enforce Admin RBAC
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Erişim engellendi: Gösterge paneli metrikleri için yönetici yetkisi gereklidir.';
    END IF;

    -- 2. Aggregations from Orders
    SELECT
        COALESCE(SUM(total_minor) FILTER (WHERE status IN ('paid', 'processing', 'shipped', 'delivered', 'partially_refunded')), 0),
        COALESCE(COUNT(*) FILTER (WHERE status IN ('paid', 'processing', 'shipped', 'delivered', 'partially_refunded')), 0),
        COALESCE(COUNT(*) FILTER (WHERE status = 'pending_payment'), 0),
        COALESCE(COUNT(*) FILTER (WHERE status = 'paid'), 0)
    INTO
        v_paid_revenue_minor,
        v_paid_orders_count,
        v_pending_orders_count,
        v_awaiting_fulfillment_count
    FROM public.orders;

    -- 3. Total Refunds
    SELECT COALESCE(SUM(amount_minor), 0)
    INTO v_refunded_total_minor
    FROM public.refunds
    WHERE status = 'succeeded';

    -- 4. Products & Stock Status
    SELECT COUNT(*) INTO v_total_products_count FROM public.products;
    SELECT COUNT(*) INTO v_low_stock_variants_count FROM public.product_variants WHERE stock_quantity <= 5 AND active = true;

    RETURN jsonb_build_object(
        'paid_revenue_minor', v_paid_revenue_minor,
        'paid_orders_count', v_paid_orders_count,
        'pending_orders_count', v_pending_orders_count,
        'awaiting_fulfillment_count', v_awaiting_fulfillment_count,
        'refunded_total_minor', v_refunded_total_minor,
        'total_products_count', v_total_products_count,
        'low_stock_variants_count', v_low_stock_variants_count
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 7. Grant RPC Execution Permissions
-- ------------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.admin_update_order_fulfillment(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_cancel_order(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_admin_refund(UUID, BIGINT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_admin_refund(UUID, BOOLEAN, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_metrics() TO authenticated;

COMMIT;
