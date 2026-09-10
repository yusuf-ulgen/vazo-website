-- ==============================================================================
-- Migration: 20260910180000_fix_finalize_refund_typo.sql
-- Description: Fixes a typo in finalize_admin_refund where it referenced 
--              v_payment.amount_minor instead of expected_amount_minor.
-- ==============================================================================

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
    v_admin_email TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Erişim engellendi: İade sonuçlandırmak için yönetici yetkisi gereklidir.';
    END IF;

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

    SELECT * INTO v_payment FROM public.payments WHERE id = v_refund.payment_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ödeme kaydı bulunamadı: %', v_refund.payment_id;
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = v_payment.order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sipariş kaydı bulunamadı (ödeme: %)', v_refund.payment_id;
    END IF;

    SELECT email INTO v_admin_email FROM auth.users WHERE id = auth.uid();

    IF p_is_success THEN
        v_new_refunded_minor := COALESCE(v_payment.refunded_amount_minor, 0) + v_refund.amount_minor;
        v_new_payment_status := CASE
            WHEN v_new_refunded_minor >= v_payment.expected_amount_minor THEN 'refunded'
            ELSE 'partially_refunded'
        END;
        v_new_order_status := CASE
            WHEN v_new_refunded_minor >= v_order.total_minor THEN 'refunded'
            ELSE 'partially_refunded'
        END;

        UPDATE public.refunds
        SET status = 'succeeded',
            provider_reference = p_provider_reference,
            completed_at = timezone('utc', now()),
            updated_at = timezone('utc', now())
        WHERE id = p_refund_id;

        UPDATE public.payments
        SET refunded_amount_minor = v_new_refunded_minor,
            status = v_new_payment_status,
            updated_at = timezone('utc', now())
        WHERE id = v_payment.id;

        UPDATE public.orders
        SET status = v_new_order_status,
            updated_at = timezone('utc', now())
        WHERE id = v_order.id;

        INSERT INTO public.order_status_history (
            order_id, from_status, to_status, actor_type, actor_id, note, created_at
        ) VALUES (
            v_order.id, v_order.status, v_new_order_status, 'admin', auth.uid(),
            'İade başarıyla tamamlandı: ' || p_refund_id, timezone('utc', now())
        );

        INSERT INTO public.admin_audit_logs (
            actor_user_id,
            actor_email,
            admin_id,
            action,
            entity_type,
            resource_type,
            entity_id,
            resource_id,
            entity_name,
            safe_metadata,
            diff,
            created_at
        ) VALUES (
            auth.uid(),
            COALESCE(v_admin_email, 'admin@vazo.design'),
            auth.uid(),
            'REFUND_ORDER_SUCCESS',
            'refund',
            'refund',
            p_refund_id::text,
            p_refund_id::text,
            'İade ' || COALESCE(v_refund.reference_no, p_refund_id::text),
            jsonb_build_object(
                'order_id', v_order.id,
                'payment_id', v_payment.id,
                'amount_minor', v_refund.amount_minor,
                'total_refunded_minor', v_new_refunded_minor,
                'new_order_status', v_new_order_status,
                'provider_reference', p_provider_reference
            ),
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
                'refund_receipt',
                jsonb_build_object(
                    'order_id', v_order.id,
                    'reference_no', v_order.reference_no,
                    'refund_amount_minor', v_refund.amount_minor,
                    'refund_currency', v_refund.currency,
                    'refund_reason', v_refund.safe_reason
                ),
                'pending'
            );
        END IF;

        RETURN jsonb_build_object(
            'success', true,
            'refund_id', p_refund_id,
            'status', 'succeeded',
            'new_payment_status', v_new_payment_status,
            'new_order_status', v_new_order_status
        );
    ELSE
        UPDATE public.refunds
        SET status = 'failed',
            error_code = COALESCE(p_error_code, 'PROVIDER_ERROR'),
            error_message = p_error_message,
            updated_at = timezone('utc', now())
        WHERE id = p_refund_id;

        INSERT INTO public.admin_audit_logs (
            actor_user_id,
            actor_email,
            admin_id,
            action,
            entity_type,
            resource_type,
            entity_id,
            resource_id,
            entity_name,
            safe_metadata,
            diff,
            created_at
        ) VALUES (
            auth.uid(),
            COALESCE(v_admin_email, 'admin@vazo.design'),
            auth.uid(),
            'REFUND_ORDER_FAILED',
            'refund',
            'refund',
            p_refund_id::text,
            p_refund_id::text,
            'İade Hata ' || COALESCE(v_refund.reference_no, p_refund_id::text),
            jsonb_build_object(
                'order_id', v_order.id,
                'payment_id', v_payment.id,
                'amount_minor', v_refund.amount_minor,
                'error_code', p_error_code,
                'error_message', p_error_message
            ),
            jsonb_build_object(
                'error_code', p_error_code,
                'error_message', p_error_message
            ),
            timezone('utc', now())
        );

        RETURN jsonb_build_object(
            'success', false,
            'refund_id', p_refund_id,
            'status', 'failed',
            'error_code', p_error_code,
            'error_message', p_error_message
        );
    END IF;
END;
$$;
