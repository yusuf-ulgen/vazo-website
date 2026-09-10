-- ==============================================================================
-- Migration: 20260910183000_fix_refund_pending_deadlock_and_formatting.sql
-- Description:
--   1. Cleans up existing orphaned in-flight 'pending' refunds left by prior failures.
--   2. Updates prepare_admin_refund to auto-fail stale pending refunds (> 2 minutes).
--   3. Formats TL amounts cleanly to 2 decimal places ('FM999999990.00' TL) to eliminate
--      floating point / numeric artifact displays like '15.0000000000000000 TL'.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Clean up existing orphaned 'pending' refunds
-- ------------------------------------------------------------------------------
UPDATE public.refunds
SET status = 'failed',
    error_code = 'ORPHANED_CLEANUP',
    error_message = 'Sistem güncellemesi: Askıda kalan önceki iade denemesi temizlendi. Yeniden denenebilir.',
    updated_at = timezone('utc', now())
WHERE status = 'pending';

-- ------------------------------------------------------------------------------
-- 2. Enhanced prepare_admin_refund RPC with Auto-Stale Cleanup & Clean Formatting
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

    -- 5. Auto-clean stale in-flight refunds older than 2 minutes for this payment
    -- Prevents permanent deadlocks if an Edge Function or network call crashed mid-flight.
    UPDATE public.refunds
    SET status = 'failed',
        error_code = 'TIMEOUT_STALE_PENDING',
        error_message = 'İade işlemi zaman aşımına uğradığı için otomatik olarak sonlandırıldı. Yeniden denenebilir.',
        updated_at = timezone('utc', now())
    WHERE payment_id = p_payment_id
      AND status = 'pending'
      AND created_at < timezone('utc', now()) - interval '2 minutes';

    -- 6. In-flight Pending Refund Protection (Concurrency / Race-Condition Guard)
    SELECT COALESCE(SUM(amount_minor), 0) INTO v_pending_refund_minor
    FROM public.refunds
    WHERE payment_id = p_payment_id AND status = 'pending';

    IF v_pending_refund_minor > 0 THEN
        RAISE EXCEPTION 'Bu ödeme için şu anda işlemde olan (% TL) bir iade süreci mevcuttur. Lütfen mevcut işlemin sonuçlanmasını bekleyin.',
            to_char(v_pending_refund_minor::numeric / 100, 'FM999999990.00');
    END IF;

    -- 7. Remaining Refundable Balance Bounds Check
    v_remaining_refundable_minor := v_payment.expected_amount_minor - v_payment.refunded_amount_minor;

    IF p_refund_amount_minor > v_remaining_refundable_minor THEN
        RAISE EXCEPTION 'Talep edilen iade tutarı (% TL), kalan iade edilebilir bakiyeyi (% TL) aşamaz.',
            to_char(p_refund_amount_minor::numeric / 100, 'FM999999990.00'),
            to_char(v_remaining_refundable_minor::numeric / 100, 'FM999999990.00');
    END IF;

    -- 8. Generate Safe Alphanumeric Reference No (strictly <= 64 chars)
    v_reference_no := 'RF' || to_char(timezone('utc', now()), 'YYYYMMDD') || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10));

    -- 9. Insert Pending Refund Record (Status: pending)
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
