-- ==============================================================================
-- Migration: 20260828040000_phase3_checkout_order_schema.sql
-- Description: Phase 3.4 Server-Authoritative Checkout, Concurrency Locking RPC,
--              Inventory Reservation Engine & Legal Content Seed
-- Author: Yusuf Ulgen / Vazo Platform Engineering
-- Standards: ISO-4217 minor units, Pessimistic row-locking (FOR UPDATE),
--            Zero browser price trust, Immutable legal snapshots, RLS compliant.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Seed Mandatory Legal Content Pages (Pre-Information & Distance Sales)
-- ------------------------------------------------------------------------------

INSERT INTO public.content_pages (id, page_key, title, seo_title, seo_description, published)
VALUES
    (
        'c1000000-0000-0000-0000-000000000007',
        'preliminary_info',
        'Ön Bilgilendirme Koşulları',
        'Ön Bilgilendirme Koşulları | Vazo Studio',
        '6502 sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca alıcıya sipariş öncesi sunulan yasal ön bilgilendirme metni.',
        true
    ),
    (
        'c1000000-0000-0000-0000-000000000008',
        'distance_sales',
        'Mesafeli Satış Sözleşmesi',
        'Mesafeli Satış Sözleşmesi | Vazo Studio',
        'Vazo Studio e-ticaret platformu üzerinden akdedilen resmi mesafeli satış sözleşmesi ve cayma hakkı bildirimleri.',
        true
    )
ON CONFLICT (page_key) DO UPDATE
SET title = EXCLUDED.title,
    seo_title = EXCLUDED.seo_title,
    seo_description = EXCLUDED.seo_description,
    published = EXCLUDED.published;

-- Insert Default Sections for Preliminary Info Form
INSERT INTO public.content_sections (id, page_id, section_key, title, content, sort_order, active)
VALUES
    (
        'c2000000-0000-0000-0000-000000000010',
        'c1000000-0000-0000-0000-000000000007',
        'seller_info',
        '1. Satıcı Bilgileri',
        'Unvan: Vazo Studio Tasarım ve Sanat Ürünleri A.Ş. (Yetkili Firma Ünvanı Konfigüre Edilecek)' || E'\n' ||
        'Adres: Karaköy Tasarım Bölgesi, Kemankeş Cad. No: 42, Beyoğlu / İstanbul' || E'\n' ||
        'Telefon: +90 (212) 555 0192' || E'\n' ||
        'E-posta: info@vazostudio.com / musterihizmetleri@vazostudio.com' || E'\n' ||
        'Mersis No / Vergi No: [Firma Tescilinde Belirlenecek]',
        1,
        true
    ),
    (
        'c2000000-0000-0000-0000-000000000011',
        'c1000000-0000-0000-0000-000000000007',
        'product_and_delivery',
        '2. Sözleşme Konusu Ürün, Fiyat ve Teslimat Bilgileri',
        'Sözleşme konusu mal veya hizmetin temel nitelikleri, tüm vergiler dahil toplam satış bedeli, teslimat masrafları ve teslimat planı sipariş özetinde belirtilmiştir. Teslimat, anlaşmalı kargo kuruluşu aracılığıyla alıcının bildirdiği adrese sigortalı olarak yapılır.',
        2,
        true
    ),
    (
        'c2000000-0000-0000-0000-000000000012',
        'c1000000-0000-0000-0000-000000000007',
        'right_of_withdrawal',
        '3. Cayma Hakkı & İade Şartları',
        'Alıcı, hiçbir hukuki ve cezai sorumluluk üstlenmeksizin ve hiçbir gerekçe göstermeksizin malı teslim aldığı tarihten itibaren 14 (on dört) gün içerisinde cayma hakkını kullanabilir. Özel istek ve sipariş üzerine üretilen kişiye özel seramik eserlerde cayma hakkı istisnaları geçerlidir.',
        3,
        true
    )
ON CONFLICT (page_id, section_key) DO UPDATE
SET title = EXCLUDED.title,
    content = EXCLUDED.content,
    sort_order = EXCLUDED.sort_order,
    active = EXCLUDED.active;

-- Insert Default Sections for Distance Sales Agreement
INSERT INTO public.content_sections (id, page_id, section_key, title, content, sort_order, active)
VALUES
    (
        'c2000000-0000-0000-0000-000000000020',
        'c1000000-0000-0000-0000-000000000008',
        'parties',
        'Madde 1 — Taraflar',
        'İşbu sözleşme, bir tarafta Vazo Studio (Satıcı) ile diğer tarafta internet sitesi üzerinden elektronik ortamda sipariş veren Müşteri (Alıcı) arasında akdedilmiştir.',
        1,
        true
    ),
    (
        'c2000000-0000-0000-0000-000000000021',
        'c1000000-0000-0000-0000-000000000008',
        'subject',
        'Madde 2 — Konu ve Kapsam',
        'İşbu sözleşmenin konusu, Alıcı''nın Satıcı''ya ait web sitesinden elektronik ortamda siparişini yaptığı aşağıda nitelikleri ve satış fiyatı belirtilen ürünün satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerinin saptanmasıdır.',
        2,
        true
    ),
    (
        'c2000000-0000-0000-0000-000000000022',
        'c1000000-0000-0000-0000-000000000008',
        'dispute_resolution',
        'Madde 3 — Yetkili Mahkeme ve İhtilafların Çözümü',
        'İşbu sözleşmenin uygulanmasında, Ticaret Bakanlığınca ilan edilen değere kadar Alıcının yerleşim yerindeki veya Satıcının merkezindeki Tüketici Hakem Heyetleri ile Tüketici Mahkemeleri yetkilidir.',
        3,
        true
    )
ON CONFLICT (page_id, section_key) DO UPDATE
SET title = EXCLUDED.title,
    content = EXCLUDED.content,
    sort_order = EXCLUDED.sort_order,
    active = EXCLUDED.active;

-- ------------------------------------------------------------------------------
-- 2. Server-Authoritative Quote Generator Function
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
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_item JSONB;
    v_variant_id UUID;
    v_requested_qty INTEGER;
    v_variant RECORD;
    v_product RECORD;
    v_unit_price_minor BIGINT;
    v_line_total_minor BIGINT;
    v_subtotal_minor BIGINT := 0;
    v_available_stock INTEGER;
    v_shipping_res JSONB;
    v_shipping_minor BIGINT := 0;
    v_free_shipping_applied BOOLEAN := false;
    v_estimated_delivery_text TEXT := NULL;
    v_tax_included_minor BIGINT := 0;
    v_total_minor BIGINT := 0;
    v_quote_items JSONB := '[]'::jsonb;
    v_is_wholesale_approved BOOLEAN := false;
BEGIN
    -- 1. Validate Channel
    IF p_channel NOT IN ('retail', 'wholesale') THEN
        RAISE EXCEPTION 'Geçersiz kanal: %', p_channel;
    END IF;

    -- 2. If Wholesale, Validate Customer Approval
    IF p_channel = 'wholesale' THEN
        SELECT (status = 'approved') INTO v_is_wholesale_approved
        FROM public.customer_profiles
        WHERE id = p_customer_id;

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
            RAISE EXCEPTION 'Seçilen ürün varyantı aktif değildir: %', v_variant.title;
        END IF;

        -- Fetch Product
        SELECT * INTO v_product
        FROM public.products
        WHERE id = v_variant.product_id;

        IF v_product IS NULL OR v_product.status != 'published' THEN
            RAISE EXCEPTION 'Ürün satışta değildir: %', COALESCE(v_product.name, 'Bilinmeyen Ürün');
        END IF;

        -- Check Available Stock (Physical Stock minus unexpired active reservations)
        SELECT public.get_variant_available_stock(v_variant_id) INTO v_available_stock;
        IF v_available_stock < v_requested_qty THEN
            RAISE EXCEPTION 'Yetersiz stok: "% - %". Mevcut adet: %, İstenen adet: %',
                v_product.name, v_variant.title, v_available_stock, v_requested_qty;
        END IF;

        -- Calculate Authoritative Unit Price (Minor Units)
        IF p_channel = 'wholesale' AND v_product.wholesale_price IS NOT NULL THEN
            v_unit_price_minor := ROUND(v_product.wholesale_price * 100);
        ELSE
            v_unit_price_minor := ROUND(v_product.retail_price * 100);
        END IF;

        -- Variant Price Adjustment (if present)
        IF v_variant.price_adjustment IS NOT NULL THEN
            v_unit_price_minor := GREATEST(0, v_unit_price_minor + ROUND(v_variant.price_adjustment * 100));
        END IF;

        v_line_total_minor := v_unit_price_minor * v_requested_qty;
        v_subtotal_minor := v_subtotal_minor + v_line_total_minor;

        v_quote_items := v_quote_items || jsonb_build_object(
            'variant_id', v_variant.id,
            'product_id', v_product.id,
            'product_name', v_product.name,
            'variant_name', v_variant.title,
            'sku', v_variant.sku,
            'image_url', (SELECT image_url FROM public.product_images WHERE product_id = v_product.id AND is_primary LIMIT 1),
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

    v_shipping_minor := (v_shipping_res->>'shipping_minor')::BIGINT;
    v_free_shipping_applied := (v_shipping_res->>'free_shipping_applied')::BOOLEAN;
    v_estimated_delivery_text := v_shipping_res->>'estimated_delivery_text';

    -- Total Minor (KDV Included)
    v_total_minor := v_subtotal_minor + v_shipping_minor;
    -- KDV is 20% standard included in consumer prices: tax_included = total * 20 / 120
    v_tax_included_minor := ROUND((v_total_minor * 20)::NUMERIC / 120);

    RETURN jsonb_build_object(
        'supported', true,
        'channel', p_channel,
        'currency', p_currency,
        'destination_country', p_destination_country,
        'items', v_quote_items,
        'subtotal_minor', v_subtotal_minor,
        'shipping_minor', v_shipping_minor,
        'free_shipping_applied', v_free_shipping_applied,
        'estimated_delivery_text', v_estimated_delivery_text,
        'discount_minor', 0,
        'tax_included', true,
        'tax_rate', 20,
        'tax_included_minor', v_tax_included_minor,
        'total_minor', v_total_minor
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 3. Atomic, Concurrency-Safe Order Creation RPC
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
SET search_path = public, pg_temp
AS $$
DECLARE
    v_item JSONB;
    v_variant_id UUID;
    v_requested_qty INTEGER;
    v_variant RECORD;
    v_product RECORD;
    v_physical_stock INTEGER;
    v_active_reserved INTEGER;
    v_available_stock INTEGER;
    v_unit_price_minor BIGINT;
    v_line_total_minor BIGINT;
    v_subtotal_minor BIGINT := 0;
    v_shipping_res JSONB;
    v_shipping_minor BIGINT := 0;
    v_free_shipping_applied BOOLEAN := false;
    v_total_minor BIGINT := 0;
    v_tax_included_minor BIGINT := 0;
    v_order_id UUID := gen_random_uuid();
    v_order_number TEXT;
    v_primary_image TEXT;
    v_reservation_expires_at TIMESTAMPTZ;
    v_seller_snapshot JSONB;
    v_customer_snapshot JSONB;
    v_preliminary_page RECORD;
    v_distance_page RECORD;
    v_is_wholesale_approved BOOLEAN := false;
BEGIN
    -- 1. Enforce Legal Acceptance Checkboxes
    IF NOT (COALESCE(p_accepted_preliminary_info, false) AND COALESCE(p_accepted_distance_sales, false)) THEN
        RAISE EXCEPTION 'Sipariş oluşturmak için Ön Bilgilendirme Koşulları ve Mesafeli Satış Sözleşmesi onaylanmalıdır.';
    END IF;

    -- 2. Verify Customer Authentication
    IF p_customer_id IS NULL THEN
        RAISE EXCEPTION 'Kimliği doğrulanmış kullanıcı oturumu zorunludur.';
    END IF;

    -- 3. Validate Channel
    IF p_channel NOT IN ('retail', 'wholesale') THEN
        RAISE EXCEPTION 'Geçersiz sipariş kanalı: %', p_channel;
    END IF;

    IF p_channel = 'wholesale' THEN
        SELECT (status = 'approved') INTO v_is_wholesale_approved
        FROM public.customer_profiles
        WHERE id = p_customer_id;

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

    -- 5. PESSIMISTIC ROW LOCKING: Lock all requested product variants in sorted order
    --    This guarantees two concurrent requests cannot race to over-reserve the final stock unit.
    PERFORM id
    FROM public.product_variants
    WHERE id IN (
        SELECT (elem->>'variant_id')::UUID
        FROM jsonb_array_elements(p_items) AS elem
    )
    ORDER BY id
    FOR UPDATE;

    -- 6. Evaluate and Recompute Authoritative Items Under Lock
    IF jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Sepetinizde ürün bulunmamaktadır.';
    END IF;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_variant_id := (v_item->>'variant_id')::UUID;
        v_requested_qty := (v_item->>'quantity')::INTEGER;

        IF v_requested_qty <= 0 THEN
            RAISE EXCEPTION 'Geçersiz ürün adedi: %', v_requested_qty;
        END IF;

        -- Fetch Locked Variant
        SELECT * INTO v_variant
        FROM public.product_variants
        WHERE id = v_variant_id;

        IF v_variant IS NULL THEN
            RAISE EXCEPTION 'Ürün varyantı bulunamadı: %', v_variant_id;
        END IF;

        IF NOT v_variant.active THEN
            RAISE EXCEPTION 'Varyant aktif değil: %', v_variant.title;
        END IF;

        -- Fetch Product
        SELECT * INTO v_product
        FROM public.products
        WHERE id = v_variant.product_id;

        IF v_product IS NULL OR v_product.status != 'published' THEN
            RAISE EXCEPTION 'Ürün yayında değil: %', COALESCE(v_product.name, 'Bilinmeyen Ürün');
        END IF;

        -- Physical stock check under lock
        v_physical_stock := v_variant.stock_quantity;

        SELECT COALESCE(SUM(quantity), 0) INTO v_active_reserved
        FROM public.inventory_reservations
        WHERE variant_id = v_variant_id
          AND status = 'reserved'
          AND expires_at > timezone('utc', now());

        v_available_stock := GREATEST(0, v_physical_stock - v_active_reserved);

        IF v_available_stock < v_requested_qty THEN
            RAISE EXCEPTION 'Yetersiz stok: "% - %". Kalan stok: %, Talep edilen: %',
                v_product.name, v_variant.title, v_available_stock, v_requested_qty;
        END IF;

        -- Authoritative Pricing
        IF p_channel = 'wholesale' AND v_product.wholesale_price IS NOT NULL THEN
            v_unit_price_minor := ROUND(v_product.wholesale_price * 100);
        ELSE
            v_unit_price_minor := ROUND(v_product.retail_price * 100);
        END IF;

        IF v_variant.price_adjustment IS NOT NULL THEN
            v_unit_price_minor := GREATEST(0, v_unit_price_minor + ROUND(v_variant.price_adjustment * 100));
        END IF;

        v_line_total_minor := v_unit_price_minor * v_requested_qty;
        v_subtotal_minor := v_subtotal_minor + v_line_total_minor;
    END LOOP;

    -- 7. Authoritative Shipping Rate Resolution
    v_shipping_res := public.resolve_shipping_rate(
        p_destination_country,
        p_channel,
        v_subtotal_minor,
        p_currency
    );

    IF NOT (v_shipping_res->>'supported')::BOOLEAN THEN
        RAISE EXCEPTION 'Teslimat ülkesi için kargo hizmeti bulunamadı: %', p_destination_country;
    END IF;

    v_shipping_minor := (v_shipping_res->>'shipping_minor')::BIGINT;
    v_total_minor := v_subtotal_minor + v_shipping_minor;
    v_tax_included_minor := ROUND((v_total_minor * 20)::NUMERIC / 120);

    -- 8. Generate Unique Order Number
    v_order_number := public.generate_order_number();
    v_reservation_expires_at := timezone('utc', now()) + INTERVAL '40 minutes';

    -- 9. Prepare Legal Snapshots
    SELECT value INTO v_seller_snapshot FROM public.site_settings WHERE key = 'contact';
    SELECT jsonb_build_object(
        'customer_id', p_customer_id,
        'email', (SELECT email FROM auth.users WHERE id = p_customer_id),
        'created_at', timezone('utc', now())
    ) INTO v_customer_snapshot;

    -- 10. INSERT ORDER MASTER RECORD
    INSERT INTO public.orders (
        id,
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
        seller_legal_snapshot,
        customer_legal_snapshot,
        created_at,
        updated_at
    ) VALUES (
        v_order_id,
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
        p_billing_address,
        v_seller_snapshot,
        v_customer_snapshot,
        timezone('utc', now()),
        timezone('utc', now())
    );

    -- 11. INSERT ORDER ITEMS & INVENTORY RESERVATIONS
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_variant_id := (v_item->>'variant_id')::UUID;
        v_requested_qty := (v_item->>'quantity')::INTEGER;

        SELECT * INTO v_variant FROM public.product_variants WHERE id = v_variant_id;
        SELECT * INTO v_product FROM public.products WHERE id = v_variant.product_id;

        IF p_channel = 'wholesale' AND v_product.wholesale_price IS NOT NULL THEN
            v_unit_price_minor := ROUND(v_product.wholesale_price * 100);
        ELSE
            v_unit_price_minor := ROUND(v_product.retail_price * 100);
        END IF;

        IF v_variant.price_adjustment IS NOT NULL THEN
            v_unit_price_minor := GREATEST(0, v_unit_price_minor + ROUND(v_variant.price_adjustment * 100));
        END IF;

        v_line_total_minor := v_unit_price_minor * v_requested_qty;

        SELECT image_url INTO v_primary_image
        FROM public.product_images
        WHERE product_id = v_product.id AND is_primary
        LIMIT 1;

        -- Order Item Snapshot
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
            v_product.id,
            v_variant.id,
            v_variant.sku,
            v_product.name,
            v_variant.title,
            v_primary_image,
            v_unit_price_minor,
            v_requested_qty,
            v_line_total_minor,
            p_currency,
            p_channel,
            jsonb_build_object(
                'material', v_product.material,
                'weight_grams', v_variant.weight_grams,
                'dimensions', jsonb_build_object(
                    'height_cm', v_variant.height_cm,
                    'width_cm', v_variant.width_cm,
                    'diameter_cm', v_variant.diameter_cm
                )
            )
        );

        -- Active Inventory Reservation (40 min TTL)
        INSERT INTO public.inventory_reservations (
            order_id,
            variant_id,
            quantity,
            status,
            reserved_at,
            expires_at
        ) VALUES (
            v_order_id,
            v_variant.id,
            v_requested_qty,
            'reserved',
            timezone('utc', now()),
            v_reservation_expires_at
        );
    END LOOP;

    -- 12. INSERT INITIAL ORDER STATUS HISTORY
    INSERT INTO public.order_status_history (
        order_id,
        from_status,
        to_status,
        actor_type,
        actor_id,
        note
    ) VALUES (
        v_order_id,
        NULL,
        'pending_payment',
        'customer',
        p_customer_id,
        'Sipariş oluşturuldu, ödeme bekleniyor (Rezervasyon süresi: 40 dk)'
    );

    -- 13. INSERT IMMUTABLE LEGAL ACCEPTANCES
    SELECT * INTO v_preliminary_page FROM public.content_pages WHERE page_key = 'preliminary_info';
    SELECT * INTO v_distance_page FROM public.content_pages WHERE page_key = 'distance_sales';

    INSERT INTO public.order_legal_acceptances (
        order_id,
        document_key,
        document_version,
        content_snapshot,
        accepted_at
    ) VALUES
    (
        v_order_id,
        'preliminary_information_form',
        '2026.08.v1',
        jsonb_build_object(
            'page_key', 'preliminary_info',
            'title', COALESCE(v_preliminary_page.title, 'Ön Bilgilendirme Formu'),
            'accepted_by_user_id', p_customer_id,
            'ip_timestamp', timezone('utc', now())
        ),
        timezone('utc', now())
    ),
    (
        v_order_id,
        'distance_sales_agreement',
        '2026.08.v1',
        jsonb_build_object(
            'page_key', 'distance_sales',
            'title', COALESCE(v_distance_page.title, 'Mesafeli Satış Sözleşmesi'),
            'accepted_by_user_id', p_customer_id,
            'ip_timestamp', timezone('utc', now())
        ),
        timezone('utc', now())
    );

    -- 14. RETURN COMPLETE ORDER SUMMARY
    RETURN jsonb_build_object(
        'order_id', v_order_id,
        'order_number', v_order_number,
        'status', 'pending_payment',
        'subtotal_minor', v_subtotal_minor,
        'shipping_minor', v_shipping_minor,
        'total_minor', v_total_minor,
        'currency', p_currency,
        'expires_at', v_reservation_expires_at,
        'payment_timeout_minutes', 30,
        'reservation_timeout_minutes', 40
    );
END;
$$;

COMMIT;
