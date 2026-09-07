-- ==============================================================================
-- Migration: 20260830010000_phase3_checkout_readiness_harden.sql
-- Description: Phase 3.15 — Checkout State Atomicity, Kill Switch & Readiness Hardening
-- Author: Yusuf Ulgen / Vazo Platform Engineering
-- Standards: Atomic JSONB merge, Zero browser truth, Kill switch enforcement
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. admin_update_commerce_settings RPC: Atomic DB-side JSON merge
--    Ensures that saving commerce text/thresholds NEVER overwrites or deletes
--    checkout_enabled or other existing keys in site_settings.commerce.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_update_commerce_settings(
    p_free_shipping_threshold NUMERIC,
    p_shipping_estimate_text TEXT,
    p_shipping_summary TEXT,
    p_returns_policy_text TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_updated JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Yalnızca yöneticiler e-ticaret ayarlarını güncelleyebilir.';
    END IF;

    -- Ensure commerce row exists with default structure if missing
    INSERT INTO public.site_settings (key, value, is_public, updated_at)
    VALUES (
        'commerce',
        jsonb_build_object(
            'free_shipping_threshold', COALESCE(p_free_shipping_threshold, 0),
            'shipping_estimate_text', COALESCE(p_shipping_estimate_text, ''),
            'shipping_summary', COALESCE(p_shipping_summary, ''),
            'returns_policy_text', COALESCE(p_returns_policy_text, ''),
            'checkout_enabled', false
        ),
        true,
        timezone('utc', now())
    )
    ON CONFLICT (key) DO NOTHING;

    -- Atomically merge fields into existing commerce object, preserving checkout_enabled
    UPDATE public.site_settings
    SET value = value || jsonb_build_object(
            'free_shipping_threshold', COALESCE(p_free_shipping_threshold, 0),
            'shipping_estimate_text', COALESCE(p_shipping_estimate_text, ''),
            'shipping_summary', COALESCE(p_shipping_summary, ''),
            'returns_policy_text', COALESCE(p_returns_policy_text, '')
        ),
        updated_at = timezone('utc', now())
    WHERE key = 'commerce'
    RETURNING value INTO v_updated;

    RETURN v_updated;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_commerce_settings(NUMERIC, TEXT, TEXT, TEXT) TO authenticated;

-- ------------------------------------------------------------------------------
-- 2. Hardened calculate_checkout_quote: DB-level Kill Switch Enforcement
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
    v_checkout_enabled BOOLEAN;
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
    -- 0. Kill Switch: Stop all checkout if disabled
    SELECT COALESCE((value->>'checkout_enabled')::boolean, false) INTO v_checkout_enabled
    FROM public.site_settings
    WHERE key = 'commerce';

    IF NOT COALESCE(v_checkout_enabled, false) THEN
        RAISE EXCEPTION 'Ödeme ve sipariş sistemi şu anda kapalıdır.';
    END IF;

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
            RAISE EXCEPTION 'Toptan fiyat ve sipariş için onaylı kurumsal hesap gereklidir.';
        END IF;
    END IF;

    -- 3. Validate Currency and Items Array
    IF p_currency <> 'TRY' THEN
        RAISE EXCEPTION 'Yalnızca TRY para birimi desteklenmektedir.';
    END IF;

    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Sepet boş olamaz.';
    END IF;

    -- 4. Authoritative Item Iteration & Price Calculation
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_variant_id := (v_item->>'variant_id')::UUID;
        v_requested_qty := (v_item->>'quantity')::INT;

        IF v_requested_qty IS NULL OR v_requested_qty <= 0 THEN
            RAISE EXCEPTION 'Geçersiz ürün adedi: %', v_requested_qty;
        END IF;

        SELECT * INTO v_variant
        FROM public.product_variants
        WHERE id = v_variant_id AND active = true;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Varyant bulunamadı veya aktif değil: %', v_variant_id;
        END IF;

        SELECT * INTO v_product
        FROM public.products
        WHERE id = v_variant.product_id AND status = 'published';

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Ürün bulunamadı veya satışta değil: %', v_variant.product_id;
        END IF;

        SELECT (v_variant.stock_quantity - COALESCE(SUM(quantity), 0)) INTO v_available_stock
        FROM public.inventory_reservations
        WHERE variant_id = v_variant_id AND expires_at > timezone('utc', now());

        IF v_requested_qty > v_available_stock THEN
            RAISE EXCEPTION 'Yetersiz stok: "%" için talep edilen % adet mevcut değil (Mevcut: % adet).',
                v_product.name, v_requested_qty, GREATEST(0, v_available_stock);
        END IF;

        IF p_channel = 'wholesale' THEN
            v_moq := COALESCE(v_product.wholesale_moq, 1);
            IF v_requested_qty < v_moq THEN
                RAISE EXCEPTION 'Minimum toptan sipariş adedi karşılanmadı: "%" için en az % adet sipariş verilmelidir.',
                    v_product.name, v_moq;
            END IF;

            SELECT unit_price INTO v_tier_unit_price
            FROM public.product_wholesale_tiers
            WHERE product_id = v_product.id
              AND min_quantity <= v_requested_qty
            ORDER BY min_quantity DESC
            LIMIT 1;

            IF v_tier_unit_price IS NOT NULL THEN
                v_unit_price_minor := ROUND(v_tier_unit_price * 100);
            ELSIF v_product.wholesale_base_price IS NOT NULL THEN
                v_unit_price_minor := ROUND(v_product.wholesale_base_price * 100);
            ELSE
                v_unit_price_minor := ROUND(v_variant.retail_price * 100);
            END IF;
        ELSE
            v_unit_price_minor := ROUND(v_variant.retail_price * 100);
        END IF;

        v_line_total_minor := v_unit_price_minor * v_requested_qty;
        v_subtotal_minor := v_subtotal_minor + v_line_total_minor;

        v_quote_items := v_quote_items || jsonb_build_object(
            'variant_id', v_variant.id,
            'product_id', v_product.id,
            'product_name', v_product.name,
            'variant_name', v_variant.variant_name,
            'sku', v_variant.sku,
            'image_url', v_product.primary_image_url,
            'quantity', v_requested_qty,
            'unit_price_minor', v_unit_price_minor,
            'line_total_minor', v_line_total_minor,
            'channel', p_channel
        );
    END LOOP;

    -- 5. Calculate Server-Authoritative Shipping
    v_shipping_res := public.calculate_shipping_rate(
        p_destination_country,
        v_subtotal_minor,
        p_items
    );

    IF (v_shipping_res->>'is_available')::BOOLEAN = false THEN
        RAISE EXCEPTION 'Belirtilen teslimat adresi için aktif kargo seçeneği bulunamadı.';
    END IF;

    v_shipping_minor := (v_shipping_res->>'rate_minor')::BIGINT;
    v_total_minor := v_subtotal_minor + v_shipping_minor;
    v_tax_included_minor := ROUND(v_subtotal_minor - (v_subtotal_minor / 1.20));

    RETURN jsonb_build_object(
        'currency', p_currency,
        'channel', p_channel,
        'destination_country', p_destination_country,
        'subtotal_minor', v_subtotal_minor,
        'shipping_minor', v_shipping_minor,
        'total_minor', v_total_minor,
        'tax_included_minor', v_tax_included_minor,
        'items', v_quote_items,
        'shipping_option', v_shipping_res
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 3. Hardened create_checkout_order: DB-level Kill Switch Enforcement
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
    v_checkout_enabled BOOLEAN;
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
    v_preliminary_page RECORD;
    v_distance_page RECORD;
BEGIN
    -- 0. Kill Switch: Stop all checkout orders if disabled
    SELECT COALESCE((value->>'checkout_enabled')::boolean, false) INTO v_checkout_enabled
    FROM public.site_settings
    WHERE key = 'commerce';

    IF NOT COALESCE(v_checkout_enabled, false) THEN
        RAISE EXCEPTION 'Ödeme ve sipariş sistemi şu anda kapalıdır.';
    END IF;

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

    -- 7. Fetch Customer Snapshot
    SELECT * INTO v_customer_record
    FROM public.customer_profiles
    WHERE user_id = p_customer_id;

    v_customer_name := COALESCE(
        v_customer_record.company_name,
        NULLIF(TRIM(COALESCE(v_customer_record.first_name, '') || ' ' || COALESCE(v_customer_record.last_name, '')), ''),
        p_shipping_address->>'recipient_name',
        'Değerli Müşterimiz'
    );
    v_customer_email := COALESCE(v_customer_record.email, p_shipping_address->>'email', 'musteri@vazostudio.com');
    v_customer_phone := COALESCE(v_customer_record.phone, p_shipping_address->>'phone', '');

    -- 8. Fetch Legal Page Snapshots
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

    -- 9. Insert Order Record
    INSERT INTO public.orders (
        order_number,
        customer_id,
        channel,
        status,
        currency,
        tax_inclusive,
        subtotal_minor,
        shipping_minor,
        discount_minor,
        tax_included_minor,
        total_minor,
        shipping_carrier,
        shipping_address_snapshot,
        billing_address_snapshot,
        notes,
        metadata,
        seller_legal_snapshot,
        customer_legal_snapshot,
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
        COALESCE(v_quote->'shipping_option'->>'carrier', 'Yurtiçi Kargo'),
        p_shipping_address,
        p_billing_address,
        NULL,
        jsonb_build_object(
            'customer_id', p_customer_id,
            'customer_name', v_customer_name,
            'customer_email', v_customer_email,
            'customer_phone', v_customer_phone,
            'legal_preliminary_accepted_at', timezone('utc', now()),
            'legal_distance_sales_accepted_at', timezone('utc', now()),
            'payment_expires_at', v_payment_expires_at
        ),
        (SELECT value FROM public.site_settings WHERE key = 'seller_legal'),
        jsonb_build_object(
            'preliminary_info', v_preliminary_page,
            'distance_sales', v_distance_page
        ),
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
            product_id,
            variant_id,
            sku_snapshot,
            product_name_snapshot,
            variant_name_snapshot,
            image_url_snapshot,
            unit_price_minor,
            quantity,
            line_total_minor,
            currency,
            channel,
            metadata_snapshot
        ) VALUES (
            v_order_id,
            (v_quote_item->>'product_id')::UUID,
            v_variant_id,
            COALESCE(v_quote_item->>'sku', ''),
            COALESCE(v_quote_item->>'product_name', ''),
            COALESCE(v_quote_item->>'variant_name', ''),
            v_quote_item->>'image_url',
            (v_quote_item->>'unit_price_minor')::BIGINT,
            v_requested_qty,
            (v_quote_item->>'line_total_minor')::BIGINT,
            p_currency,
            p_channel,
            jsonb_build_object('source', p_channel || '_checkout')
        );

        INSERT INTO public.inventory_reservations (
            order_id,
            variant_id,
            quantity,
            status,
            expires_at,
            created_at
        ) VALUES (
            v_order_id,
            v_variant_id,
            v_requested_qty,
            'active',
            v_reservation_expires_at,
            timezone('utc', now())
        );
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'total_minor', v_total_minor,
        'currency', p_currency,
        'status', 'pending_payment',
        'reservation_expires_at', v_reservation_expires_at
    );
END;
$$;

COMMIT;
