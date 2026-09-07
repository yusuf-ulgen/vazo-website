-- ==============================================================================
-- Migration: 20260830040000_phase3_paytr_customer_data_integrity.sql
-- Description: Phase 3.18 PayTR Customer Data Integrity & Input Hardening
-- Removes all dummy fallback values for customer email, name, and phone.
-- Ensures orders are created with strictly verified customer & address data.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.create_checkout_order(
    p_customer_id UUID,
    p_channel TEXT,
    p_currency TEXT,
    p_destination_country TEXT,
    p_shipping_address JSONB,
    p_billing_address JSONB,
    p_items JSONB,
    p_legal_consent JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_checkout_enabled BOOLEAN;
    v_customer_record RECORD;
    v_customer_name TEXT;
    v_customer_email TEXT;
    v_customer_phone TEXT;
    v_clean_phone TEXT;
    v_order_id UUID;
    v_order_number TEXT;
    v_quote JSONB;
    v_subtotal_minor BIGINT;
    v_shipping_minor BIGINT;
    v_total_minor BIGINT;
    v_tax_included_minor BIGINT;
    v_preliminary_page JSONB;
    v_distance_page JSONB;
    v_reservation_expires_at TIMESTAMPTZ;
    v_payment_expires_at TIMESTAMPTZ;
    v_item RECORD;
    v_variant RECORD;
BEGIN
    -- 1. Check Commerce Kill Switch
    SELECT COALESCE((value->>'checkout_enabled')::BOOLEAN, false) INTO v_is_checkout_enabled
    FROM public.site_settings
    WHERE key = 'commerce';

    IF NOT v_is_checkout_enabled THEN
        RAISE EXCEPTION 'Ödeme ve sipariş sistemi şu anda kapalıdır. Lütfen daha sonra tekrar deneyin.';
    END IF;

    -- 2. Validate Customer Authentication & Session
    IF p_customer_id IS NULL OR p_customer_id != auth.uid() THEN
        RAISE EXCEPTION 'Yetkisiz erişim: Sipariş oluşturan kullanıcı kimliği doğrulanamadı.';
    END IF;

    -- 3. Validate Channel & Currency
    IF p_channel NOT IN ('retail', 'wholesale') THEN
        RAISE EXCEPTION 'Geçersiz sipariş kanalı: %', p_channel;
    END IF;

    IF p_currency NOT IN ('TRY', 'USD', 'EUR', 'GBP') THEN
        RAISE EXCEPTION 'Geçersiz para birimi: %', p_currency;
    END IF;

    -- 4. Validate Legal Consents
    IF NOT COALESCE((p_legal_consent->>'kvkk_accepted')::BOOLEAN, false) OR
       NOT COALESCE((p_legal_consent->>'preliminary_info_accepted')::BOOLEAN, false) OR
       NOT COALESCE((p_legal_consent->>'distance_sales_accepted')::BOOLEAN, false) THEN
        RAISE EXCEPTION 'Sipariş oluşturmak için zorunlu yasal sözleşmelerin onaylanması gereklidir.';
    END IF;

    -- 5. Validate Shipping Address (Real Data Invariant - No Dummy Fallbacks)
    IF p_shipping_address IS NULL OR
       trim(COALESCE(p_shipping_address->>'recipient_name', '')) = '' OR
       length(trim(COALESCE(p_shipping_address->>'recipient_name', ''))) < 2 OR
       trim(COALESCE(p_shipping_address->>'address_line1', '')) = '' OR
       length(trim(COALESCE(p_shipping_address->>'address_line1', ''))) < 5 OR
       trim(COALESCE(p_shipping_address->>'city', '')) = '' THEN
        RAISE EXCEPTION 'Geçerli ve açık bir teslimat adresi ile alıcı adı zorunludur.';
    END IF;

    -- 6. Validate Items Non-Empty
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Sipariş için en az bir ürün seçilmelidir.';
    END IF;

    -- 7. Calculate Server-Authoritative Quote & Lock Inventory
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

    IF v_total_minor <= 0 THEN
        RAISE EXCEPTION 'Sipariş toplam tutarı 0''dan büyük olmalıdır.';
    END IF;

    -- 8. Fetch Customer Real Snapshot (Strictly No Dummy Values)
    SELECT * INTO v_customer_record
    FROM public.customer_profiles
    WHERE user_id = p_customer_id;

    v_customer_name := COALESCE(
        v_customer_record.company_name,
        NULLIF(TRIM(COALESCE(v_customer_record.first_name, '') || ' ' || COALESCE(v_customer_record.last_name, '')), ''),
        NULLIF(TRIM(COALESCE(p_shipping_address->>'recipient_name', '')), '')
    );

    IF v_customer_name IS NULL OR length(v_customer_name) < 2 OR v_customer_name IN ('Müşteri', 'Değerli Müşterimiz') THEN
        RAISE EXCEPTION 'Geçerli bir müşteri/alıcı adı zorunludur. Lütfen profilinizi veya teslimat adresinizi güncelleyin.';
    END IF;

    v_customer_email := COALESCE(
        NULLIF(TRIM(COALESCE(v_customer_record.email, '')), ''),
        NULLIF(TRIM(COALESCE(p_shipping_address->>'email', '')), ''),
        NULLIF(TRIM(COALESCE(auth.jwt()->>'email', '')), '')
    );

    IF v_customer_email IS NULL OR
       v_customer_email NOT LIKE '%@%.%' OR
       v_customer_email IN ('musteri@vazostudio.com', 'test@test.com', 'placeholder@example.com') THEN
        RAISE EXCEPTION 'Geçerli bir müşteri e-posta adresi zorunludur. Lütfen profilinizdeki e-posta adresinizi doğrulayın.';
    END IF;

    v_clean_phone := regexp_replace(
        COALESCE(
            NULLIF(TRIM(COALESCE(v_customer_record.phone, '')), ''),
            NULLIF(TRIM(COALESCE(p_shipping_address->>'phone', '')), '')
        ),
        '\D',
        '',
        'g'
    );

    IF v_clean_phone IS NULL OR length(v_clean_phone) < 10 OR v_clean_phone = '5550000000' OR v_clean_phone ~ '^(\d)\1+$' THEN
        RAISE EXCEPTION 'Teslimat ve SMS bilgilendirmesi için geçerli bir telefon numarası zorunludur. Lütfen adresinizdeki telefon bilgisini güncelleyin.';
    END IF;

    v_customer_phone := v_clean_phone;

    -- 9. Fetch Legal Page Snapshots
    SELECT jsonb_build_object('id', id, 'title', title, 'sections', COALESCE(
        (SELECT jsonb_agg(jsonb_build_object('key', section_key, 'title', title, 'content', content))
         FROM public.content_sections WHERE page_id = content_pages.id AND active = true),
        '[]'::jsonb
    )) INTO v_preliminary_page
    FROM public.content_pages
    WHERE page_key = 'preliminary_info';

    SELECT jsonb_build_object('id', id, 'title', title, 'sections', COALESCE(
        (SELECT jsonb_agg(jsonb_build_object('key', section_key, 'title', title, 'content', content))
         FROM public.content_sections WHERE page_id = content_pages.id AND active = true),
        '[]'::jsonb
    )) INTO v_distance_page
    FROM public.content_pages
    WHERE page_key = 'distance_sales';

    -- Generate order number and expiration timestamps
    v_order_number := public.generate_order_number();
    v_reservation_expires_at := timezone('utc', now()) + INTERVAL '15 minutes';
    v_payment_expires_at := timezone('utc', now()) + INTERVAL '15 minutes';

    -- 10. Insert Order Record
    INSERT INTO public.orders (
        order_number,
        customer_id,
        channel,
        status,
        currency,
        tax_included,
        subtotal_minor,
        shipping_minor,
        discount_minor,
        tax_included_minor,
        total_minor,
        shipping_address,
        billing_address,
        customer_legal_snapshot,
        preliminary_info_snapshot,
        distance_sales_snapshot,
        kvkk_consent_snapshot,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        v_order_number,
        p_customer_id,
        p_channel,
        'pending_payment',
        p_currency,
        true,
        v_subtotal_minor,
        v_shipping_minor,
        0,
        v_tax_included_minor,
        v_total_minor,
        p_shipping_address,
        COALESCE(p_billing_address, p_shipping_address),
        jsonb_build_object(
            'customer_name', v_customer_name,
            'email', v_customer_email,
            'phone', v_customer_phone,
            'channel', p_channel,
            'is_tax_exempt', COALESCE(v_customer_record.tax_exempt, false)
        ),
        v_preliminary_page,
        v_distance_page,
        jsonb_build_object('accepted', true, 'timestamp', timezone('utc', now())),
        jsonb_build_object('payment_expires_at', v_payment_expires_at),
        timezone('utc', now()),
        timezone('utc', now())
    )
    RETURNING id INTO v_order_id;

    -- 11. Insert Order Items and Stock Reservations
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS (
        variant_id UUID,
        quantity INT
    )
    LOOP
        SELECT pv.*, p.name as product_title
        INTO v_variant
        FROM public.product_variants pv
        JOIN public.products p ON p.id = pv.product_id
        WHERE pv.id = v_item.variant_id;

        INSERT INTO public.order_items (
            order_id,
            product_id,
            variant_id,
            product_name_snapshot,
            variant_name_snapshot,
            sku_snapshot,
            unit_price_minor,
            quantity,
            total_minor,
            created_at,
            updated_at
        ) VALUES (
            v_order_id,
            v_variant.product_id,
            v_variant.id,
            v_variant.product_title,
            v_variant.variant_name,
            v_variant.sku,
            v_variant.retail_price_minor,
            v_item.quantity,
            v_variant.retail_price_minor * v_item.quantity,
            timezone('utc', now()),
            timezone('utc', now())
        );

        INSERT INTO public.stock_reservations (
            order_id,
            variant_id,
            quantity,
            status,
            expires_at,
            created_at
        ) VALUES (
            v_order_id,
            v_variant.id,
            v_item.quantity,
            'active',
            v_reservation_expires_at,
            timezone('utc', now())
        );
    END LOOP;

    -- 12. Record Initial Order Status History
    INSERT INTO public.order_status_history (
        order_id,
        from_status,
        to_status,
        actor_type,
        actor_id,
        note,
        created_at
    ) VALUES (
        v_order_id,
        NULL,
        'pending_payment',
        'customer',
        p_customer_id,
        'Sipariş oluşturuldu, ödeme bekleniyor.',
        timezone('utc', now())
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'total_minor', v_total_minor,
        'currency', p_currency,
        'reservation_timeout_minutes', 15
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_checkout_order(UUID, TEXT, TEXT, TEXT, JSONB, JSONB, JSONB, JSONB) TO authenticated;
