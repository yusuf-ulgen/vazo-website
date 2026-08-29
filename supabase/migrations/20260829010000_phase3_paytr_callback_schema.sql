-- ==============================================================================
-- Migration: Phase 3.5 & 3.6 — PayTR Token Initiation & Atomic Callback Finalization
-- Description:
--   1. Implements public.initiate_order_payment(...) RPC to record unique alphanumeric merchant_oid payment attempts
--   2. Implements public.finalize_paytr_callback(...) RPC for atomic, idempotent webhook processing
--   3. Handles stock decrement, inventory movement ledger, reservation conversion/release,
--      status history, payment event deduplication, and transactional email queuing.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Function: initiate_order_payment
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.initiate_order_payment(
    p_order_id UUID,
    p_merchant_oid TEXT,
    p_expected_amount_minor BIGINT,
    p_currency TEXT DEFAULT 'TRY',
    p_test_mode BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_payment_id UUID;
    v_active_reservations INTEGER;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- 1. Validate merchant_oid format (strictly alphanumeric, <= 64 chars)
    IF p_merchant_oid IS NULL OR length(p_merchant_oid) > 64 OR NOT (p_merchant_oid ~ '^[a-zA-Z0-9]+$') THEN
        RAISE EXCEPTION 'Geçersiz merchant_oid: Yalnızca alfanümerik ve en fazla 64 karakter olmalıdır.';
    END IF;

    -- 2. Lock and validate order
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF v_order IS NULL THEN
        RAISE EXCEPTION 'Sipariş bulunamadı: %', p_order_id;
    END IF;

    IF v_order.status != 'pending_payment' THEN
        RAISE EXCEPTION 'Sipariş ödeme aşamasında değildir: % (Durum: %)', p_order_id, v_order.status;
    END IF;

    IF v_order.total_minor != p_expected_amount_minor THEN
        RAISE EXCEPTION 'Ödeme tutarı sipariş tutarıyla eşleşmiyor. Sipariş: %, İstenen: %',
            v_order.total_minor, p_expected_amount_minor;
    END IF;

    -- 3. Check that active reservations exist and are unexpired
    SELECT COUNT(*) INTO v_active_reservations
    FROM public.inventory_reservations
    WHERE order_id = p_order_id
      AND status = 'reserved'
      AND expires_at > timezone('utc', now());

    IF v_active_reservations = 0 THEN
        RAISE EXCEPTION 'Sipariş için aktif stok rezervasyonu bulunamadı veya süresi doldu.';
    END IF;

    -- 4. Calculate payment attempt timeout (30 minutes)
    v_expires_at := timezone('utc', now()) + INTERVAL '30 minutes';

    -- 5. Insert new payment attempt
    INSERT INTO public.payments (
        order_id,
        provider,
        merchant_oid,
        status,
        expected_amount_minor,
        currency,
        test_mode,
        initiated_at,
        expires_at,
        created_at,
        updated_at
    ) VALUES (
        p_order_id,
        'paytr',
        p_merchant_oid,
        'initiated',
        p_expected_amount_minor,
        p_currency,
        p_test_mode,
        timezone('utc', now()),
        v_expires_at,
        timezone('utc', now()),
        timezone('utc', now())
    )
    RETURNING id INTO v_payment_id;

    RETURN jsonb_build_object(
        'success', true,
        'payment_id', v_payment_id,
        'order_id', p_order_id,
        'merchant_oid', p_merchant_oid,
        'expected_amount_minor', p_expected_amount_minor,
        'expires_at', v_expires_at
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 2. Function: finalize_paytr_callback
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.finalize_paytr_callback(
    p_merchant_oid TEXT,
    p_status TEXT,
    p_total_amount_minor BIGINT,
    p_failed_reason_code TEXT DEFAULT NULL,
    p_failed_reason_msg TEXT DEFAULT NULL,
    p_raw_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_payment RECORD;
    v_order RECORD;
    v_res RECORD;
    v_fingerprint TEXT;
    v_customer_email TEXT;
    v_is_success BOOLEAN;
BEGIN
    -- 1. Locate payment attempt with row lock
    SELECT * INTO v_payment
    FROM public.payments
    WHERE merchant_oid = p_merchant_oid
    FOR UPDATE;

    IF v_payment IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Bilinmeyen ödeme kaydı: ' || p_merchant_oid
        );
    END IF;

    -- 2. Idempotency Check: If already processed, return immediately without side effects
    IF v_payment.status IN ('paid', 'failed', 'refunded', 'partially_refunded', 'manual_review') THEN
        RETURN jsonb_build_object(
            'success', true,
            'already_processed', true,
            'status', v_payment.status,
            'order_id', v_payment.order_id
        );
    END IF;

    -- 3. Lock associated order
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = v_payment.order_id
    FOR UPDATE;

    IF v_order IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Sipariş bulunamadı: ' || v_payment.order_id::text
        );
    END IF;

    -- 4. Determine status
    v_is_success := (lower(trim(p_status)) = 'success');

    -- --------------------------------------------------------------------------
    -- 5. SUCCESS FLOW
    -- --------------------------------------------------------------------------
    IF v_is_success THEN
        -- 5.1 Verify Amount Integrity
        IF p_total_amount_minor != v_payment.expected_amount_minor THEN
            -- Mismatch detected: Put in manual review, do not mark paid
            UPDATE public.payments
            SET status = 'manual_review',
                provider_total_amount_minor = p_total_amount_minor,
                failure_message_safe = 'Tutar uyuşmazlığı: Beklenen ' || v_payment.expected_amount_minor::text || ', Gelen ' || p_total_amount_minor::text,
                updated_at = timezone('utc', now())
            WHERE id = v_payment.id;

            UPDATE public.orders
            SET status = 'payment_review',
                updated_at = timezone('utc', now())
            WHERE id = v_order.id;

            INSERT INTO public.order_status_history (
                order_id,
                from_status,
                to_status,
                actor_type,
                note
            ) VALUES (
                v_order.id,
                v_order.status,
                'payment_review',
                'system',
                'PayTR callback tutar uyuşmazlığı (merchant_oid: ' || p_merchant_oid || ')'
            );

            RETURN jsonb_build_object(
                'success', true,
                'already_processed', false,
                'status', 'manual_review',
                'order_id', v_order.id,
                'warning', 'Tutar uyuşmazlığı nedeniyle sipariş incelemeye alındı.'
            );
        END IF;

        -- 5.2 Convert Inventory Reservations & Decrement Stock
        FOR v_res IN
            SELECT * FROM public.inventory_reservations
            WHERE order_id = v_order.id AND status = 'reserved'
            FOR UPDATE
        LOOP
            -- Mark reservation converted
            UPDATE public.inventory_reservations
            SET status = 'converted',
                converted_at = timezone('utc', now())
            WHERE id = v_res.id;

            -- Decrement physical stock on variant
            UPDATE public.product_variants
            SET stock_quantity = GREATEST(0, stock_quantity - v_res.quantity),
                updated_at = timezone('utc', now())
            WHERE id = v_res.variant_id;

            -- Record immutable ledger entry
            INSERT INTO public.inventory_movements (
                variant_id,
                order_id,
                quantity_delta,
                movement_type,
                safe_reason,
                actor_type,
                actor_id
            ) VALUES (
                v_res.variant_id,
                v_order.id,
                -v_res.quantity,
                'sale',
                'PayTR sipariş onayı (' || v_order.order_number || ')',
                'system',
                NULL
            );
        END LOOP;

        -- 5.3 Mark Payment Paid
        UPDATE public.payments
        SET status = 'paid',
            provider_total_amount_minor = p_total_amount_minor,
            paid_at = timezone('utc', now()),
            updated_at = timezone('utc', now())
        WHERE id = v_payment.id;

        -- 5.4 Mark Order Paid
        UPDATE public.orders
        SET status = 'paid',
            paid_at = timezone('utc', now()),
            updated_at = timezone('utc', now())
        WHERE id = v_order.id;

        -- 5.5 Insert Order Status History
        INSERT INTO public.order_status_history (
            order_id,
            from_status,
            to_status,
            actor_type,
            note
        ) VALUES (
            v_order.id,
            v_order.status,
            'paid',
            'system',
            'PayTR başarılı ödeme onayı (merchant_oid: ' || p_merchant_oid || ')'
        );

        -- 5.6 Insert Payment Event Log with Deduplication Fingerprint
        v_fingerprint := md5(p_merchant_oid || ':success:' || p_total_amount_minor::text || ':' || COALESCE(p_raw_payload->>'hash', ''));
        
        INSERT INTO public.payment_events (
            payment_id,
            order_id,
            merchant_oid,
            event_type,
            event_fingerprint,
            safe_metadata,
            received_at
        ) VALUES (
            v_payment.id,
            v_order.id,
            p_merchant_oid,
            'paytr_callback_success',
            v_fingerprint,
            p_raw_payload,
            timezone('utc', now())
        )
        ON CONFLICT (event_fingerprint) DO NOTHING;

        -- 5.7 Enqueue Transactional Confirmation Email
        SELECT email INTO v_customer_email FROM auth.users WHERE id = v_order.customer_id;
        
        IF v_customer_email IS NOT NULL THEN
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
                'order_confirmed',
                jsonb_build_object(
                    'order_id', v_order.id,
                    'order_number', v_order.order_number,
                    'total_minor', v_order.total_minor,
                    'currency', v_order.currency,
                    'paid_at', timezone('utc', now())
                ),
                'pending'
            );
        END IF;

        RETURN jsonb_build_object(
            'success', true,
            'already_processed', false,
            'status', 'paid',
            'order_id', v_order.id,
            'order_number', v_order.order_number
        );

    -- --------------------------------------------------------------------------
    -- 6. FAILED PAYMENT FLOW
    -- --------------------------------------------------------------------------
    ELSE
        -- 6.1 Release active reservations
        UPDATE public.inventory_reservations
        SET status = 'released',
            released_at = timezone('utc', now())
        WHERE order_id = v_order.id AND status = 'reserved';

        -- 6.2 Mark Payment Failed
        UPDATE public.payments
        SET status = 'failed',
            failure_code = p_failed_reason_code,
            failure_message_safe = COALESCE(p_failed_reason_msg, 'Ödeme işlemi başarısız oldu.'),
            failed_at = timezone('utc', now()),
            updated_at = timezone('utc', now())
        WHERE id = v_payment.id;

        -- 6.3 Mark Order Payment Failed
        UPDATE public.orders
        SET status = 'payment_failed',
            updated_at = timezone('utc', now())
        WHERE id = v_order.id;

        -- 6.4 Insert Order Status History
        INSERT INTO public.order_status_history (
            order_id,
            from_status,
            to_status,
            actor_type,
            note
        ) VALUES (
            v_order.id,
            v_order.status,
            'payment_failed',
            'system',
            'PayTR ödeme başarısız: ' || COALESCE(p_failed_reason_msg, 'Bilinmeyen neden') || ' (Kod: ' || COALESCE(p_failed_reason_code, 'none') || ')'
        );

        -- 6.5 Insert Payment Event Log
        v_fingerprint := md5(p_merchant_oid || ':failed:' || COALESCE(p_failed_reason_code, 'none') || ':' || COALESCE(p_raw_payload->>'hash', ''));

        INSERT INTO public.payment_events (
            payment_id,
            order_id,
            merchant_oid,
            event_type,
            event_fingerprint,
            safe_metadata,
            received_at
        ) VALUES (
            v_payment.id,
            v_order.id,
            p_merchant_oid,
            'paytr_callback_failed',
            v_fingerprint,
            p_raw_payload,
            timezone('utc', now())
        )
        ON CONFLICT (event_fingerprint) DO NOTHING;

        RETURN jsonb_build_object(
            'success', true,
            'already_processed', false,
            'status', 'failed',
            'order_id', v_order.id,
            'order_number', v_order.order_number
        );
    END IF;
END;
$$;

COMMIT;
