-- ==============================================================================
-- VAZO E-COMMERCE PLATFORM - AUDIT LOGS & ORDER FULFILLMENT RESILIENCE
-- Migration: 20260910040000_fix_admin_audit_logs_order_fulfillment.sql
-- ==============================================================================

-- 1. Add Compatibility Columns to admin_audit_logs
ALTER TABLE public.admin_audit_logs
    ADD COLUMN IF NOT EXISTS admin_id UUID,
    ADD COLUMN IF NOT EXISTS resource_type TEXT,
    ADD COLUMN IF NOT EXISTS resource_id TEXT,
    ADD COLUMN IF NOT EXISTS diff JSONB;

-- 2. Modernize Constraints on action and entity_type
ALTER TABLE public.admin_audit_logs
    DROP CONSTRAINT IF EXISTS admin_audit_logs_action_check,
    DROP CONSTRAINT IF EXISTS admin_audit_logs_entity_type_check;

ALTER TABLE public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_action_check
    CHECK (
        action IN (
            'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'BULK_UPDATE',
            'UPDATE_ORDER_FULFILLMENT', 'CANCEL_ORDER',
            'REFUND_ORDER_SUCCESS', 'REFUND_ORDER_FAILED',
            'RETRY_TRANSACTIONAL_EMAIL', 'CANCEL_TRANSACTIONAL_EMAIL'
        ) OR length(trim(action)) > 0
    );

ALTER TABLE public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_entity_type_check
    CHECK (
        entity_type IN (
            'product', 'variant', 'inventory', 'price', 'wholesale_tier',
            'category', 'collection', 'cms_page', 'cms_section',
            'faq_group', 'faq_item', 'menu_group', 'menu_item',
            'site_settings', 'trade_application', 'contact_message',
            'newsletter_subscription', 'shipping_zone', 'shipping_zone_country',
            'shipping_rate', 'order', 'refund', 'transactional_email'
        ) OR length(trim(entity_type)) > 0
    );

-- 3. Trigger for Bi-directional Field Synchronization
CREATE OR REPLACE FUNCTION public.sync_admin_audit_log_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync Actor User ID <-> Admin ID
    IF NEW.actor_user_id IS NULL AND NEW.admin_id IS NOT NULL THEN
        NEW.actor_user_id := NEW.admin_id;
    ELSIF NEW.admin_id IS NULL AND NEW.actor_user_id IS NOT NULL THEN
        NEW.admin_id := NEW.actor_user_id;
    END IF;

    -- Populate Actor Email if absent
    IF (NEW.actor_email IS NULL OR NEW.actor_email = '') AND NEW.actor_user_id IS NOT NULL THEN
        SELECT email INTO NEW.actor_email FROM auth.users WHERE id = NEW.actor_user_id;
        IF NEW.actor_email IS NULL THEN
            NEW.actor_email := 'admin@vazo.design';
        END IF;
    END IF;

    -- Sync Entity Type <-> Resource Type
    IF (NEW.entity_type IS NULL OR NEW.entity_type = '') AND NEW.resource_type IS NOT NULL THEN
        NEW.entity_type := NEW.resource_type;
    ELSIF (NEW.resource_type IS NULL OR NEW.resource_type = '') AND NEW.entity_type IS NOT NULL THEN
        NEW.resource_type := NEW.entity_type;
    END IF;

    -- Sync Entity ID <-> Resource ID
    IF (NEW.entity_id IS NULL OR NEW.entity_id = '') AND NEW.resource_id IS NOT NULL THEN
        NEW.entity_id := NEW.resource_id;
    ELSIF (NEW.resource_id IS NULL OR NEW.resource_id = '') AND NEW.entity_id IS NOT NULL THEN
        NEW.resource_id := NEW.entity_id;
    END IF;

    -- Sync Safe Metadata <-> Diff
    IF (NEW.safe_metadata IS NULL OR NEW.safe_metadata = '{}'::jsonb) AND NEW.diff IS NOT NULL THEN
        NEW.safe_metadata := NEW.diff;
    ELSIF NEW.diff IS NULL AND NEW.safe_metadata IS NOT NULL THEN
        NEW.diff := NEW.safe_metadata;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_admin_audit_fields ON public.admin_audit_logs;
CREATE TRIGGER trg_sync_admin_audit_fields
    BEFORE INSERT ON public.admin_audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_admin_audit_log_fields();

-- 4. Robust admin_update_order_fulfillment RPC
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
    v_admin_email TEXT;
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

    -- 7. Insert Admin Audit Log (canonical + compatibility fields)
    v_diff := jsonb_build_object(
        'from_status', v_order.status,
        'to_status', p_target_status,
        'carrier', v_clean_carrier,
        'tracking_number', v_clean_tracking,
        'tracking_url', v_clean_url,
        'note', p_note
    );

    SELECT email INTO v_admin_email FROM auth.users WHERE id = auth.uid();

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
        'STATUS_CHANGE',
        'order',
        'order',
        p_order_id::text,
        p_order_id::text,
        'Sipariş ' || v_order.order_number,
        v_diff,
        v_diff,
        timezone('utc', now())
    );

    -- 8. Enqueue Transactional Email for Customer
    v_template_key := 'order_' || p_target_status;

    v_payload := jsonb_build_object(
        'order_number', v_order.order_number,
        'order_id', v_order.id
    );

    IF p_target_status = 'shipped' THEN
        v_payload := v_payload || jsonb_build_object(
            'carrier', v_clean_carrier,
            'tracking_number', v_clean_tracking,
            'tracking_url', NULLIF(v_clean_url, '')
        );
    END IF;

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

-- 5. Robust admin_cancel_order RPC
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
    v_admin_email TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Erişim engellendi: Bu işlem için yönetici yetkisi gereklidir.';
    END IF;

    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sipariş bulunamadı: %', p_order_id;
    END IF;

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

    UPDATE public.orders
    SET status = 'cancelled',
        cancellation_reason = v_clean_reason,
        cancelled_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
    WHERE id = p_order_id;

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

    SELECT email INTO v_admin_email FROM auth.users WHERE id = auth.uid();

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
        'CANCEL_ORDER',
        'order',
        'order',
        p_order_id::text,
        p_order_id::text,
        'Sipariş ' || v_order.order_number,
        jsonb_build_object('reason', v_clean_reason, 'from_status', v_order.status),
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

-- 6. Robust finalize_admin_refund RPC
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
            WHEN v_new_refunded_minor >= v_payment.amount_minor THEN 'refunded'
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
            'already_finalized', false,
            'refund_id', p_refund_id,
            'status', 'succeeded'
        );
    ELSE
        UPDATE public.refunds
        SET status = 'failed',
            provider_error_code = NULLIF(trim(COALESCE(p_error_code, '')), ''),
            provider_error_message = NULLIF(trim(COALESCE(p_error_message, '')), ''),
            completed_at = timezone('utc', now()),
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
            'İade ' || COALESCE(v_refund.reference_no, p_refund_id::text),
            jsonb_build_object(
                'order_id', v_order.id,
                'payment_id', v_payment.id,
                'error_code', p_error_code,
                'error_message', p_error_message
            ),
            jsonb_build_object(
                'order_id', v_order.id,
                'payment_id', v_payment.id,
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

-- 7. Robust log_admin_audit_event
CREATE OR REPLACE FUNCTION public.log_admin_audit_event(
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id TEXT,
    p_entity_name TEXT DEFAULT NULL,
    p_safe_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_log_id UUID;
    v_actor_id UUID;
    v_actor_email TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin authorization required'
            USING ERRCODE = '42501';
    END IF;

    IF length(trim(COALESCE(p_action, ''))) = 0 THEN
        RAISE EXCEPTION 'Invalid audit action: %', p_action
            USING ERRCODE = '22023';
    END IF;

    IF length(trim(COALESCE(p_entity_type, ''))) = 0 THEN
        RAISE EXCEPTION 'Invalid audit entity type: %', p_entity_type
            USING ERRCODE = '22023';
    END IF;

    v_actor_id := auth.uid();
    IF v_actor_id IS NOT NULL THEN
        SELECT email INTO v_actor_email FROM auth.users WHERE id = v_actor_id;
    END IF;

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
        v_actor_id,
        COALESCE(v_actor_email, 'admin@vazo.design'),
        v_actor_id,
        p_action,
        p_entity_type,
        p_entity_type,
        p_entity_id,
        p_entity_id,
        p_entity_name,
        COALESCE(p_safe_metadata, '{}'::jsonb),
        COALESCE(p_safe_metadata, '{}'::jsonb),
        timezone('utc', now())
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

-- 8. Grant Execution Permissions to authenticated
GRANT EXECUTE ON FUNCTION public.admin_update_order_fulfillment(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_cancel_order(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_admin_refund(UUID, BOOLEAN, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_admin_audit_event(TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;
