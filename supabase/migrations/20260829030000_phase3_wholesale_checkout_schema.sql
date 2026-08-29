-- ==============================================================================
-- Migration: 20260829030000_phase3_wholesale_checkout_schema.sql
-- Description: Phase 3.8 - Authenticated Wholesale Identity, Application Claiming,
--              Admin Approval/Revocation, Authoritative Server-Side Tier Pricing,
--              MOQ Enforcement & Single-Channel PayTR Checkout.
-- ==============================================================================

-- 1. Schema Extensions for trade_applications
-- ------------------------------------------------------------------------------
ALTER TABLE public.trade_applications
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_trade_applications_user_id ON public.trade_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_applications_lower_email ON public.trade_applications(lower(email));

-- RLS: Authenticated users can view their own trade applications
DROP POLICY IF EXISTS "Users can view own trade applications" ON public.trade_applications;
CREATE POLICY "Users can view own trade applications" ON public.trade_applications
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR lower(email) = lower(auth.jwt()->>'email'));

-- 2. Claim / Link Trade Application RPC
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_trade_application()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_user_email TEXT;
    v_app RECORD;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Kimliği doğrulanmış kullanıcı oturumu zorunludur.' USING ERRCODE = '42501';
    END IF;

    SELECT lower(email) INTO v_user_email
    FROM auth.users
    WHERE id = v_user_id;

    IF v_user_email IS NULL THEN
        RAISE EXCEPTION 'Kullanıcı e-posta adresi bulunamadı.';
    END IF;

    -- Find approved trade application matching user email
    SELECT * INTO v_app
    FROM public.trade_applications
    WHERE lower(email) = v_user_email
      AND status = 'approved'
      AND (user_id IS NULL OR user_id = v_user_id)
    ORDER BY reviewed_at DESC NULLS LAST, submitted_at DESC
    LIMIT 1;

    IF v_app.id IS NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'claimed', false,
            'message', 'E-posta adresinizle eşleşen onaylanmış bir toptan başvuru bulunamadı.'
        );
    END IF;

    -- Bind user_id to trade application
    UPDATE public.trade_applications
    SET user_id = v_user_id
    WHERE id = v_app.id;

    -- Elevate customer profile to wholesale
    UPDATE public.customer_profiles
    SET customer_type = 'wholesale',
        wholesale_approved_at = COALESCE(wholesale_approved_at, timezone('utc', now())),
        updated_at = timezone('utc', now())
    WHERE user_id = v_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'claimed', true,
        'application_id', v_app.id,
        'company_name', v_app.company_name,
        'message', 'Toptan hesabınız başarıyla doğrulandı ve bağlandı.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_trade_application() TO authenticated;

-- 3. Admin Approve Trade Application RPC
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_approve_trade_application(
    p_application_id UUID,
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_app RECORD;
    v_target_user_id UUID;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Bu işlem yalnızca yetkili yöneticiler tarafından gerçekleştirilebilir.' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_app
    FROM public.trade_applications
    WHERE id = p_application_id;

    IF v_app.id IS NULL THEN
        RAISE EXCEPTION 'Toptan başvuru kaydı bulunamadı: %', p_application_id;
    END IF;

    v_target_user_id := v_app.user_id;

    -- If not already bound, check if an auth user exists with matching email
    IF v_target_user_id IS NULL THEN
        SELECT id INTO v_target_user_id
        FROM auth.users
        WHERE lower(email) = lower(v_app.email)
        LIMIT 1;
    END IF;

    UPDATE public.trade_applications
    SET status = 'approved',
        user_id = v_target_user_id,
        reviewed_at = timezone('utc', now()),
        admin_notes = COALESCE(p_admin_notes, admin_notes)
    WHERE id = p_application_id
    RETURNING * INTO v_app;

    -- If target user profile exists, elevate to wholesale
    IF v_target_user_id IS NOT NULL THEN
        UPDATE public.customer_profiles
        SET customer_type = 'wholesale',
            wholesale_approved_at = timezone('utc', now()),
            updated_at = timezone('utc', now())
        WHERE user_id = v_target_user_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'application_id', v_app.id,
        'status', v_app.status,
        'user_id', v_target_user_id,
        'is_user_bound', v_target_user_id IS NOT NULL,
        'reviewed_at', v_app.reviewed_at,
        'admin_notes', v_app.admin_notes
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_approve_trade_application(UUID, TEXT) TO authenticated;

-- 4. Admin Revoke Wholesale Access RPC
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_revoke_wholesale_access(
    p_application_id UUID,
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_app RECORD;
    v_target_user_id UUID;
    v_other_approved_count INT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Bu işlem yalnızca yetkili yöneticiler tarafından gerçekleştirilebilir.' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_app
    FROM public.trade_applications
    WHERE id = p_application_id;

    IF v_app.id IS NULL THEN
        RAISE EXCEPTION 'Toptan başvuru kaydı bulunamadı: %', p_application_id;
    END IF;

    v_target_user_id := v_app.user_id;
    IF v_target_user_id IS NULL THEN
        SELECT id INTO v_target_user_id
        FROM auth.users
        WHERE lower(email) = lower(v_app.email)
        LIMIT 1;
    END IF;

    UPDATE public.trade_applications
    SET status = 'rejected',
        reviewed_at = timezone('utc', now()),
        admin_notes = COALESCE(p_admin_notes, admin_notes)
    WHERE id = p_application_id
    RETURNING * INTO v_app;

    -- Check if user has any other active approved application
    IF v_target_user_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_other_approved_count
        FROM public.trade_applications
        WHERE (user_id = v_target_user_id OR lower(email) = lower(v_app.email))
          AND status = 'approved'
          AND id != p_application_id;

        IF v_other_approved_count = 0 THEN
            UPDATE public.customer_profiles
            SET customer_type = 'retail',
                wholesale_approved_at = NULL,
                updated_at = timezone('utc', now())
            WHERE user_id = v_target_user_id;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'application_id', v_app.id,
        'status', v_app.status,
        'user_id', v_target_user_id,
        'reviewed_at', v_app.reviewed_at,
        'admin_notes', v_app.admin_notes
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_revoke_wholesale_access(UUID, TEXT) TO authenticated;

-- 5. Upgraded calculate_checkout_quote RPC
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_checkout_quote(
    p_customer_id UUID,
    p_channel TEXT,
    p_currency TEXT,
    p_destination_country TEXT,
    p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_subtotal_minor BIGINT := 0;
    v_shipping_res JSONB;
    v_shipping_minor BIGINT := 0;
    v_total_minor BIGINT := 0;
    v_tax_included_minor BIGINT := 0;
    v_item JSONB;
    v_variant_id UUID;
    v_requested_qty INT;
    v_variant RECORD;
    v_product RECORD;
    v_available_stock INT;
    v_unit_price_minor BIGINT;
    v_tier_unit_price NUMERIC(10, 2);
    v_line_total_minor BIGINT;
    v_quote_items JSONB := '[]'::JSONB;
    v_moq INT;
    v_is_wholesale_approved BOOLEAN := false;
BEGIN
    -- 1. Validate Channel
    IF p_channel NOT IN ('retail', 'wholesale') THEN
        RAISE EXCEPTION 'Geçersiz kanal: %', p_channel;
    END IF;

    -- 2. If Wholesale, Validate Customer Approval
    IF p_channel = 'wholesale' THEN
        IF p_customer_id IS NULL THEN
            RAISE EXCEPTION 'Toptan kanal için kimliği doğrulanmış kurumsal hesap gereklidir.';
        END IF;

        SELECT (customer_type = 'wholesale' AND wholesale_approved_at IS NOT NULL) INTO v_is_wholesale_approved
        FROM public.customer_profiles
        WHERE user_id = p_customer_id;

        IF NOT COALESCE(v_is_wholesale_approved, false) THEN
            RAISE EXCEPTION 'Toptan kanal için onaylı kurumsal hesap gereklidir.';
        END IF;
    END IF;

    -- 3. Validate Items Array
    IF jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Sepetinizde ürün bulunmamaktadır.';
    END IF;

    -- 4. Loop Through Requested Items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_variant_id := (v_item->>'variant_id')::UUID;
        v_requested_qty := (v_item->>'quantity')::INTEGER;

        IF v_requested_qty <= 0 THEN
            RAISE EXCEPTION 'Geçersiz ürün adedi: %', v_requested_qty;
        END IF;

        -- Fetch Variant
        SELECT * INTO v_variant
        FROM public.product_variants
        WHERE id = v_variant_id;

        IF v_variant IS NULL THEN
            RAISE EXCEPTION 'Ürün varyantı bulunamadı: %', v_variant_id;
        END IF;

        IF NOT v_variant.active THEN
            RAISE EXCEPTION 'Seçilen ürün varyantı aktif değildir: %', v_variant.variant_name;
        END IF;

        -- Fetch Product
        SELECT * INTO v_product
        FROM public.products
        WHERE id = v_variant.product_id;

        IF v_product IS NULL OR v_product.status != 'published' THEN
            RAISE EXCEPTION 'Ürün satışta değildir: %', COALESCE(v_product.name, 'Bilinmeyen Ürün');
        END IF;

        -- Channel-specific Availability & MOQ Validation
        IF p_channel = 'wholesale' THEN
            IF NOT v_product.wholesale_enabled OR NOT v_variant.is_available_for_wholesale THEN
                RAISE EXCEPTION 'Ürün toptan satışa uygun değildir: "% - %"', v_product.name, v_variant.variant_name;
            END IF;

            v_moq := COALESCE(v_product.wholesale_moq, 1);
            IF v_requested_qty < v_moq THEN
                RAISE EXCEPTION 'Minimum toptan sipariş adedi (% adet) karşılanamadı: "% - %"', v_moq, v_product.name, v_variant.variant_name;
            END IF;

            -- Authoritative Wholesale Tier Price
            SELECT unit_price INTO v_tier_unit_price
            FROM public.wholesale_price_tiers
            WHERE product_id = v_product.id
              AND (variant_id IS NULL OR variant_id = v_variant.id)
              AND active = true
              AND min_quantity <= v_requested_qty
            ORDER BY min_quantity DESC
            LIMIT 1;

            IF v_tier_unit_price IS NOT NULL THEN
                v_unit_price_minor := ROUND(v_tier_unit_price * 100);
            ELSIF v_product.retail_price IS NOT NULL THEN
                -- Fallback tier price
                v_unit_price_minor := ROUND(v_product.retail_price * 0.8 * 100);
            ELSE
                RAISE EXCEPTION 'Toptan fiyatlandırma bulunamadı: "% - %"', v_product.name, v_variant.variant_name;
            END IF;
        ELSE
            -- Retail channel
            IF NOT v_product.retail_enabled OR NOT v_variant.is_available_for_retail THEN
                RAISE EXCEPTION 'Ürün perakende satışa uygun değildir: "% - %"', v_product.name, v_variant.variant_name;
            END IF;

            v_unit_price_minor := ROUND(COALESCE(v_variant.retail_price, v_product.retail_price) * 100);
        END IF;

        -- Check Available Stock
        SELECT public.get_variant_available_stock(v_variant_id) INTO v_available_stock;
        IF v_available_stock < v_requested_qty THEN
            RAISE EXCEPTION 'Yetersiz stok: "% - %". Mevcut adet: %, İstenen adet: %',
                v_product.name, v_variant.variant_name, v_available_stock, v_requested_qty;
        END IF;

        v_line_total_minor := v_unit_price_minor * v_requested_qty;
        v_subtotal_minor := v_subtotal_minor + v_line_total_minor;

        v_quote_items := v_quote_items || jsonb_build_object(
            'variant_id', v_variant.id,
            'product_id', v_product.id,
            'product_name', v_product.name,
            'variant_name', v_variant.variant_name,
            'sku', v_variant.sku,
            'image_url', (SELECT url FROM public.product_media WHERE product_id = v_product.id AND is_primary LIMIT 1),
            'unit_price_minor', v_unit_price_minor,
            'quantity', v_requested_qty,
            'line_total_minor', v_line_total_minor
        );
    END LOOP;

    -- 5. Resolve Authoritative Shipping
    v_shipping_res := public.resolve_shipping_rate(
        p_destination_country,
        p_channel,
        v_subtotal_minor,
        p_currency
    );

    IF NOT (v_shipping_res->>'supported')::BOOLEAN THEN
        RAISE EXCEPTION 'Seçilen teslimat ülkesi için kargo desteği bulunmamaktadır: %', p_destination_country;
    END IF;

    v_shipping_minor := (v_shipping_res->>'rate_minor')::BIGINT;
    v_total_minor := v_subtotal_minor + v_shipping_minor;

    -- Compute included tax for display (e.g. 20% KDV included)
    v_tax_included_minor := ROUND(v_subtotal_minor - (v_subtotal_minor / 1.20));

    RETURN jsonb_build_object(
        'currency', p_currency,
        'channel', p_channel,
        'destination_country', p_destination_country,
        'items', v_quote_items,
        'subtotal_minor', v_subtotal_minor,
        'shipping_minor', v_shipping_minor,
        'discount_minor', 0,
        'tax_included_minor', v_tax_included_minor,
        'total_minor', v_total_minor,
        'shipping_option', v_shipping_res
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_checkout_quote(UUID, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;

-- 6. Upgraded create_checkout_order RPC
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_checkout_order(
    p_customer_id UUID,
    p_channel TEXT,
    p_currency TEXT,
    p_destination_country TEXT,
    p_items JSONB,
    p_shipping_address JSONB,
    p_billing_address JSONB,
    p_accepted_preliminary_info BOOLEAN,
    p_accepted_distance_sales BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_quote JSONB;
    v_order_id UUID;
    v_order_number TEXT;
    v_quote_item JSONB;
    v_variant_id UUID;
    v_requested_qty INT;
    v_reservation_expires_at TIMESTAMPTZ;
    v_payment_expires_at TIMESTAMPTZ;
    v_subtotal_minor BIGINT;
    v_shipping_minor BIGINT;
    v_total_minor BIGINT;
    v_tax_included_minor BIGINT;
    v_customer_record RECORD;
    v_customer_name TEXT;
    v_customer_email TEXT;
    v_customer_phone TEXT;
    v_is_wholesale_approved BOOLEAN := false;
BEGIN
    -- 1. Validate Legal Acceptance
    IF NOT p_accepted_preliminary_info OR NOT p_accepted_distance_sales THEN
        RAISE EXCEPTION 'Ön Bilgilendirme Koşulları ve Mesafeli Satış Sözleşmesi onaylanmalıdır.';
    END IF;

    -- 2. Verify Customer Authentication
    IF p_customer_id IS NULL THEN
        RAISE EXCEPTION 'Kimliği doğrulanmış kullanıcı oturumu zorunludur.';
    END IF;

    -- 3. Validate Channel & Wholesale Entitlement
    IF p_channel NOT IN ('retail', 'wholesale') THEN
        RAISE EXCEPTION 'Geçersiz sipariş kanalı: %', p_channel;
    END IF;

    IF p_channel = 'wholesale' THEN
        SELECT (customer_type = 'wholesale' AND wholesale_approved_at IS NOT NULL) INTO v_is_wholesale_approved
        FROM public.customer_profiles
        WHERE user_id = p_customer_id;

        IF NOT COALESCE(v_is_wholesale_approved, false) THEN
            RAISE EXCEPTION 'Toptan sipariş oluşturmak için onaylı kurumsal hesap gereklidir.';
        END IF;
    END IF;

    -- 4. Validate Address Payloads
    IF p_shipping_address IS NULL OR p_shipping_address->>'country_code' IS NULL THEN
        RAISE EXCEPTION 'Geçerli bir teslimat adresi zorunludur.';
    END IF;
    IF p_billing_address IS NULL THEN
        p_billing_address := p_shipping_address;
    END IF;

    -- 5. PESSIMISTIC ROW LOCKING
    PERFORM id
    FROM public.product_variants
    WHERE id IN (
        SELECT (elem->>'variant_id')::UUID
        FROM jsonb_array_elements(p_items) AS elem
    )
    ORDER BY id
    FOR UPDATE;

    -- 6. Calculate Authoritative Quote
    v_quote := public.calculate_checkout_quote(
        p_customer_id,
        p_channel,
        p_currency,
        p_destination_country,
        p_items
    );

    v_subtotal_minor := (v_quote->>'subtotal_minor')::BIGINT;
    v_shipping_minor := (v_quote->>'shipping_minor')::BIGINT;
    v_total_minor := (v_quote->>'total_minor')::BIGINT;
    v_tax_included_minor := (v_quote->>'tax_included_minor')::BIGINT;

    -- 7. Generate Sequence Order Number
    v_order_number := 'VZ-' || to_char(timezone('utc', now()), 'YYYYMMDD') || '-' || upper(substring(gen_random_uuid()::text, 1, 6));

    -- 8. Fetch Customer Snapshot Details
    SELECT
        p.first_name,
        p.last_name,
        p.phone,
        u.email
    INTO v_customer_record
    FROM public.customer_profiles p
    JOIN auth.users u ON u.id = p.user_id
    WHERE p.user_id = p_customer_id;

    v_customer_name := COALESCE(trim(v_customer_record.first_name || ' ' || COALESCE(v_customer_record.last_name, '')), p_shipping_address->>'recipient_name', 'Müşteri');
    v_customer_email := COALESCE(v_customer_record.email, p_shipping_address->>'email', 'bilgi@vazostudio.com');
    v_customer_phone := COALESCE(v_customer_record.phone, p_shipping_address->>'phone');

    -- Timeouts
    v_payment_expires_at := timezone('utc', now()) + INTERVAL '30 minutes';
    v_reservation_expires_at := timezone('utc', now()) + INTERVAL '40 minutes';

    -- 9. Insert Master Order Record
    INSERT INTO public.orders (
        order_number,
        customer_id,
        channel,
        status,
        currency,
        subtotal_minor,
        shipping_minor,
        discount_minor,
        tax_included_minor,
        total_minor,
        shipping_carrier,
        shipping_tracking_number,
        shipping_tracking_url,
        shipping_address,
        billing_address,
        customer_name,
        customer_email,
        customer_phone,
        legal_preliminary_accepted_at,
        legal_distance_sales_accepted_at,
        payment_expires_at,
        created_at,
        updated_at
    ) VALUES (
        v_order_number,
        p_customer_id,
        p_channel,
        'pending_payment',
        p_currency,
        v_subtotal_minor,
        v_shipping_minor,
        0,
        v_tax_included_minor,
        v_total_minor,
        COALESCE(v_quote->'shipping_option'->>'carrier', 'Yurtiçi Kargo'),
        NULL,
        NULL,
        p_shipping_address,
        p_billing_address,
        v_customer_name,
        v_customer_email,
        v_customer_phone,
        timezone('utc', now()),
        timezone('utc', now()),
        v_payment_expires_at,
        timezone('utc', now()),
        timezone('utc', now())
    )
    RETURNING id INTO v_order_id;

    -- 10. Insert Order Line Items & Inventory Reservations
    FOR v_quote_item IN SELECT * FROM jsonb_array_elements(v_quote->'items')
    LOOP
        v_variant_id := (v_quote_item->>'variant_id')::UUID;
        v_requested_qty := (v_quote_item->>'quantity')::INTEGER;

        INSERT INTO public.order_items (
            order_id,
            variant_id,
            product_id,
            product_name,
            variant_name,
            sku,
            unit_price_minor,
            quantity,
            line_total_minor,
            tax_rate,
            image_url,
            created_at
        ) VALUES (
            v_order_id,
            v_variant_id,
            (v_quote_item->>'product_id')::UUID,
            v_quote_item->>'product_name',
            v_quote_item->>'variant_name',
            v_quote_item->>'sku',
            (v_quote_item->>'unit_price_minor')::BIGINT,
            v_requested_qty,
            (v_quote_item->>'line_total_minor')::BIGINT,
            20.00,
            v_quote_item->>'image_url',
            timezone('utc', now())
        );

        INSERT INTO public.inventory_reservations (
            order_id,
            variant_id,
            quantity,
            expires_at,
            status,
            created_at
        ) VALUES (
            v_order_id,
            v_variant_id,
            v_requested_qty,
            v_reservation_expires_at,
            'active',
            timezone('utc', now())
        );
    END LOOP;

    -- 11. Return Authoritative Order Response
    RETURN jsonb_build_object(
        'order_id', v_order_id,
        'order_number', v_order_number,
        'status', 'pending_payment',
        'subtotal_minor', v_subtotal_minor,
        'shipping_minor', v_shipping_minor,
        'total_minor', v_total_minor,
        'currency', p_currency,
        'expires_at', v_payment_expires_at,
        'payment_timeout_minutes', 30,
        'reservation_timeout_minutes', 40
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_checkout_order(UUID, TEXT, TEXT, TEXT, JSONB, JSONB, JSONB, BOOLEAN, BOOLEAN) TO authenticated;
