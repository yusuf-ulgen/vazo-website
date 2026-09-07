-- ==============================================================================
-- Migration: 20260830030000_phase3_refund_fail_closed_hardening.sql
-- Description: Phase 3.17 Fail-Closed PayTR Refund Financial Hardening
-- Ensures:
--   1. Strict DB-level fail-closed semantics for PayTR refund operations.
--   2. In-flight pending refund serialization (prevents race conditions/over-refunds).
--   3. Financial refund strictly decoupled from inventory restocking.
--   4. Truthful failure audit logging without altering payment or order status.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Hardened prepare_admin_refund RPC
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
    v_pending_refund_minor BIGINT;
    v_remaining_refundable_minor BIGINT;
    v_reference_no TEXT;
    v_refund_id UUID;
    v_clean_reason TEXT := trim(COALESCE(p_reason, ''));
    v_clean_idempotency TEXT := trim(COALESCE(p_idempotency_key, ''));
BEGIN
    -- 1. Enforce Admin RBAC via public.is_admin()
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
            'merchant_oid', COALESCE(v_payment.merchant_oid, ''),
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

    -- 5. In-flight Pending Refund Protection (Concurrency / Race-Condition Guard)
    SELECT COALESCE(SUM(amount_minor), 0) INTO v_pending_refund_minor
    FROM public.refunds
    WHERE payment_id = p_payment_id AND status = 'pending';

    IF v_pending_refund_minor > 0 THEN
        RAISE EXCEPTION 'Bu ödeme için şu anda işlemde olan (% TL) bir iade süreci mevcuttur. Lütfen mevcut işlemin sonuçlanmasını bekleyin.',
            (v_pending_refund_minor::numeric / 100)::text;
    END IF;

    -- 6. Remaining Refundable Balance Bounds Check
    v_remaining_refundable_minor := v_payment.expected_amount_minor - v_payment.refunded_amount_minor;

    IF p_refund_amount_minor > v_remaining_refundable_minor THEN
        RAISE EXCEPTION 'Talep edilen iade tutarı (% TL), kalan iade edilebilir bakiyeyi (% TL) aşamaz.',
            (p_refund_amount_minor::numeric / 100)::text,
            (v_remaining_refundable_minor::numeric / 100)::text;
    END IF;

    -- 7. Generate Safe Alphanumeric Reference No (strictly <= 64 chars)
    v_reference_no := 'RF' || to_char(timezone('utc', now()), 'YYYYMMDD') || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10));

    -- 8. Insert Pending Refund Record (Status: pending)
    -- Invariant: Financial refund does NOT modify stock inventory.
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
-- 2. Hardened finalize_admin_refund RPC
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

    -- 4. Fail-Closed Handling: Success vs Failure
    IF p_is_success THEN
        -- ABSOLUTE INVARIANT: Only reached when provider affirmatively confirmed success!
        v_new_refunded_minor := v_payment.refunded_amount_minor + v_refund.amount_minor;

        IF v_new_refunded_minor >= v_payment.expected_amount_minor THEN
            v_new_payment_status := 'refunded';
            v_new_order_status := 'refunded';
        ELSE
            v_new_payment_status := 'partially_refunded';
            v_new_order_status := 'partially_refunded';
        END IF;

        -- Update Refund Record to succeeded
        UPDATE public.refunds
        SET status = 'succeeded',
            provider_reference = NULLIF(trim(COALESCE(p_provider_reference, '')), ''),
            completed_at = timezone('utc', now()),
            updated_at = timezone('utc', now())
        WHERE id = p_refund_id;

        -- Update Payment Record with incremented refunded_amount_minor
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

        RETURN jsonb_build_object(
            'success', true,
            'already_finalized', false,
            'refund_id', p_refund_id,
            'status', 'succeeded'
        );
    ELSE
        -- ABSOLUTE INVARIANT: Failure does NOT alter payment or order status, and does NOT increase refunded_amount_minor!
        UPDATE public.refunds
        SET status = 'failed',
            provider_error_code = NULLIF(trim(COALESCE(p_error_code, '')), ''),
            provider_error_message = NULLIF(trim(COALESCE(p_error_message, '')), ''),
            completed_at = timezone('utc', now()),
            updated_at = timezone('utc', now())
        WHERE id = p_refund_id;

        -- Audit Log for Failure Attempt
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
                'amount_minor', v_refund.amount_minor,
                'error_code', p_error_code,
                'error_message', p_error_message
            ),
            timezone('utc', now())
        );

        RETURN jsonb_build_object(
            'success', true,
            'already_finalized', false,
            'refund_id', p_refund_id,
            'status', 'failed',
            'error_code', p_error_code,
            'error_message', p_error_message
        );
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.prepare_admin_refund(UUID, BIGINT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_admin_refund(UUID, BOOLEAN, TEXT, TEXT, TEXT) TO authenticated;
