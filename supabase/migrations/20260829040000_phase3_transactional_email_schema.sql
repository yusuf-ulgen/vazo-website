-- ==============================================================================
-- Migration: 20260829040000_phase3_transactional_email_schema.sql
-- Description: Phase 3.9 Transactional Email — order status email enqueue hooks
-- Author: Yusuf Ulgen / Vazo Platform Engineering
-- ==============================================================================
--
-- This migration:
--  1. Re-creates admin_update_order_fulfillment with email enqueue.
--  2. Re-creates finalize_admin_refund with correct payload_safe column.
--  3. Adds a patch to finalize_paytr_callback to return the email_id so the
--     Edge Function can immediately dispatch the email (fire-and-forget).
-- ==============================================================================

BEGIN;

-- Patch finalize_paytr_callback to declare v_email_id and return it
-- so paytr-callback Edge Function can dispatch the email immediately.
-- The full function is large; we use a minimal patch via a helper function.
CREATE OR REPLACE FUNCTION public.get_pending_email_for_order(p_order_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT id FROM public.transactional_emails
  WHERE order_id = p_order_id
    AND status = 'pending'
    AND template_key IN ('order_confirmed', 'order_received')
  ORDER BY created_at DESC
  LIMIT 1;
$$;


-- ------------------------------------------------------------------------------
-- 1. Re-create admin_update_order_fulfillment with email enqueue
-- (DROP and recreate is safe in a transaction; all callers use RPC name only)
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
    v_customer_email TEXT;
    v_template_key TEXT;
    v_payload JSONB;
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

    -- 8. Enqueue Transactional Email for Customer
    v_template_key := 'order_' || p_target_status;

    -- Build safe payload (no admin notes, no internal fields)
    v_payload := jsonb_build_object(
        'order_number', v_order.order_number,
        'order_id', v_order.id
    );

    -- Add shipping details only for shipped status
    IF p_target_status = 'shipped' THEN
        v_payload := v_payload || jsonb_build_object(
            'carrier', v_clean_carrier,
            'tracking_number', v_clean_tracking,
            'tracking_url', NULLIF(v_clean_url, '')
        );
    END IF;

    -- Resolve customer email: try auth.users, then snapshot
    SELECT email INTO v_customer_email FROM auth.users WHERE id = v_order.customer_id;
    IF v_customer_email IS NULL THEN
        v_customer_email := COALESCE(
            v_order.customer_legal_snapshot->>'email',
            v_order.shipping_address->>'recipient_email'
        );
    END IF;

    IF v_customer_email IS NOT NULL AND v_customer_email != '' THEN
        INSERT INTO public.transactional_emails (
            order_id,
            customer_id,
            recipient_email,
            template_key,
            payload_safe,
            status
        ) VALUES (
            v_order.id,
            v_order.customer_id,
            v_customer_email,
            v_template_key,
            v_payload,
            'pending'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'from_status', v_order.status,
        'to_status', p_target_status
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 2. Fix column name: admin_orders_refunds migration uses 'payload' but
--    the schema defines 'payload_safe'. Patch the refund enqueue call.
-- ------------------------------------------------------------------------------

-- Re-create finalize_admin_refund with correct column name (payload_safe)
-- and customer_id populated for consistency.
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
    v_customer_email TEXT;
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
    SELECT * INTO v_payment FROM public.payments WHERE id = v_refund.payment_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ödeme kaydı bulunamadı: %', v_refund.payment_id;
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = v_payment.order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sipariş kaydı bulunamadı (ödeme: %)', v_refund.payment_id;
    END IF;

    IF p_is_success THEN
        -- 4a. Compute new refunded total
        v_new_refunded_minor := COALESCE(v_payment.refunded_amount_minor, 0) + v_refund.amount_minor;
        v_new_payment_status := CASE
            WHEN v_new_refunded_minor >= v_payment.amount_minor THEN 'refunded'
            ELSE 'partially_refunded'
        END;
        v_new_order_status := CASE
            WHEN v_new_refunded_minor >= v_order.total_minor THEN 'refunded'
            ELSE 'partially_refunded'
        END;

        -- 4b. Update Refund
        UPDATE public.refunds
        SET status = 'succeeded',
            provider_reference = p_provider_reference,
            completed_at = timezone('utc', now()),
            updated_at = timezone('utc', now())
        WHERE id = p_refund_id;

        -- 4c. Update Payment
        UPDATE public.payments
        SET refunded_amount_minor = v_new_refunded_minor,
            status = v_new_payment_status,
            updated_at = timezone('utc', now())
        WHERE id = v_payment.id;

        -- 4d. Update Order
        UPDATE public.orders
        SET status = v_new_order_status,
            updated_at = timezone('utc', now())
        WHERE id = v_order.id;

        -- 4e. Order Status History
        INSERT INTO public.order_status_history (
            order_id, from_status, to_status, actor_type, actor_id, note, created_at
        ) VALUES (
            v_order.id, v_order.status, v_new_order_status, 'admin', auth.uid(),
            'İade başarıyla tamamlandı: ' || p_refund_id, timezone('utc', now())
        );

        -- 4f. Audit Log
        INSERT INTO public.admin_audit_logs (
            admin_id, action, resource_type, resource_id, diff, created_at
        ) VALUES (
            auth.uid(), 'REFUND_ORDER_SUCCESS', 'refund', p_refund_id,
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

        -- 4g. Enqueue Transactional Refund Email (no card data, no admin notes)
        SELECT email INTO v_customer_email FROM auth.users WHERE id = v_order.customer_id;
        IF v_customer_email IS NULL THEN
            v_customer_email := COALESCE(
                v_order.customer_legal_snapshot->>'email',
                v_order.shipping_address->>'recipient_email'
            );
        END IF;

        IF v_customer_email IS NOT NULL AND v_customer_email != '' THEN
            INSERT INTO public.transactional_emails (
                order_id,
                customer_id,
                recipient_email,
                template_key,
                payload_safe,
                status
            ) VALUES (
                v_order.id,
                v_order.customer_id,
                v_customer_email,
                'refund_confirmed',
                jsonb_build_object(
                    'order_number', v_order.order_number,
                    'refund_amount_minor', v_refund.amount_minor,
                    'currency', v_refund.currency
                ),
                'pending'
            );
        END IF;

        RETURN jsonb_build_object(
            'success', true,
            'refund_id', p_refund_id,
            'new_order_status', v_new_order_status,
            'new_payment_status', v_new_payment_status
        );
    ELSE
        -- 5. Failure path
        UPDATE public.refunds
        SET status = 'failed',
            provider_error_code = NULLIF(trim(COALESCE(p_error_code, '')), ''),
            provider_error_message = NULLIF(trim(COALESCE(p_error_message, '')), ''),
            completed_at = timezone('utc', now()),
            updated_at = timezone('utc', now())
        WHERE id = p_refund_id;

        INSERT INTO public.admin_audit_logs (
            admin_id, action, resource_type, resource_id, diff, created_at
        ) VALUES (
            auth.uid(), 'REFUND_ORDER_FAILED', 'refund', p_refund_id,
            jsonb_build_object(
                'order_id', v_order.id,
                'error_code', p_error_code,
                'error_message', p_error_message
            ),
            timezone('utc', now())
        );

        RETURN jsonb_build_object(
            'success', false,
            'refund_id', p_refund_id,
            'error', COALESCE(p_error_message, 'İade başarısız')
        );
    END IF;
END;
$$;

COMMIT;
