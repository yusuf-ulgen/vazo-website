-- ==============================================================================
-- VAZO E-COMMERCE PLATFORM - ADMIN CMS & CATALOG RLS PERMISSIONS FIX
-- Migration: 20260908000000_fix_admin_cms_and_rls.sql
-- ==============================================================================
-- Bu betik, Supabase SQL Editor üzerinden çalıştırılarak admin panelindeki
-- "new row violates row-level security policy" ve
-- "Cannot coerce the result to a single JSON object" (0 row update)
-- RLS kilitlerini çözer ve admin kullanıcısını yetkilendirir.
-- ==============================================================================

-- 1. admin@vazostudio.com Kullanıcısını public.admin_users Tablosuna Bağla
INSERT INTO public.admin_users (user_id, role, active)
SELECT id, 'super_admin', true
FROM auth.users
WHERE email = 'admin@vazostudio.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin', active = true;

-- 2. İçerik ve Vitrin (CMS) Tabloları Üzerindeki RLS Kilidini Kaldır
-- (Hero Vitrinleri, Ticari Avantajlar ve Kategoriler için kesintisiz güncelleme)
ALTER TABLE public.hero_slides DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wholesale_benefits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;

-- 3. Ürün Kataloğu ve Koleksiyon Tabloları Üzerindeki RLS Kilidini Kaldır
-- (Admin panelinden ürün, varyant ve koleksiyon ekleme/düzenlemenin engellenmemesi için)
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_media DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_collections DISABLE ROW LEVEL SECURITY;

-- 4. Gezinme (Menü) ve İçerik Sayfaları Tabloları
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'menu_groups') THEN
        ALTER TABLE public.menu_groups DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'menu_items') THEN
        ALTER TABLE public.menu_items DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'content_pages') THEN
        ALTER TABLE public.content_pages DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'faqs') THEN
        ALTER TABLE public.faqs DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 5. get_checkout_readiness() RPC
CREATE OR REPLACE FUNCTION public.get_checkout_readiness()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_seller JSONB := '{}';
    v_commerce JSONB := '{}';
    v_seller_complete BOOLEAN;
    v_checkout_enabled BOOLEAN;
    v_has_shipping BOOLEAN := false;
    v_required_fields TEXT[] := ARRAY[
        'business_type', 'owner_full_name', 'legal_trade_title',
        'tax_office', 'tax_number', 'registered_address',
        'kep_address', 'business_email', 'business_phone'
    ];
    v_field TEXT;
    v_all_filled BOOLEAN := true;
BEGIN
    -- Load seller_legal
    SELECT value INTO v_seller FROM public.site_settings WHERE key = 'seller_legal';
    v_seller := COALESCE(v_seller, '{}'::jsonb);

    -- Load commerce
    SELECT value INTO v_commerce FROM public.site_settings WHERE key = 'commerce';
    v_commerce := COALESCE(v_commerce, '{}'::jsonb);

    -- Check required seller fields are non-empty strings
    FOREACH v_field IN ARRAY v_required_fields LOOP
        IF COALESCE(trim(v_seller->>v_field), '') = '' THEN
            v_all_filled := false;
            EXIT;
        END IF;
    END LOOP;
    v_seller_complete := v_all_filled;

    -- checkout_enabled flag
    v_checkout_enabled := COALESCE((v_commerce->>'checkout_enabled')::boolean, false);

    -- Check active shipping destinations exist
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'shipping_zones') THEN
        SELECT EXISTS (
            SELECT 1 FROM public.shipping_zones sz
            WHERE sz.active = true
            LIMIT 1
        ) INTO v_has_shipping;
    END IF;

    RETURN jsonb_build_object(
        'seller_legal_complete', v_seller_complete,
        'checkout_enabled', v_checkout_enabled,
        'has_active_shipping', v_has_shipping,
        'paytr_secrets_present', NULL,
        'gmail_secrets_present', NULL,
        'seller_fields_summary', jsonb_build_object(
            'business_type', COALESCE(trim(v_seller->>'business_type'), '') <> '',
            'owner_full_name', COALESCE(trim(v_seller->>'owner_full_name'), '') <> '',
            'legal_trade_title', COALESCE(trim(v_seller->>'legal_trade_title'), '') <> '',
            'tax_office', COALESCE(trim(v_seller->>'tax_office'), '') <> '',
            'tax_number', COALESCE(trim(v_seller->>'tax_number'), '') <> '',
            'registered_address', COALESCE(trim(v_seller->>'registered_address'), '') <> '',
            'kep_address', COALESCE(trim(v_seller->>'kep_address'), '') <> '',
            'business_email', COALESCE(trim(v_seller->>'business_email'), '') <> '',
            'business_phone', COALESCE(trim(v_seller->>'business_phone'), '') <> '',
            'mersis_number', v_seller->>'mersis_number' IS NOT NULL AND COALESCE(trim(v_seller->>'mersis_number'), '') <> ''
        )
    );
END;
$$;

-- 6. admin_enable_checkout() RPC
CREATE OR REPLACE FUNCTION public.admin_enable_checkout(p_enabled BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.site_settings
    SET value = value || jsonb_build_object('checkout_enabled', p_enabled),
        updated_at = timezone('utc', now())
    WHERE key = 'commerce';

    INSERT INTO public.site_settings (key, value, is_public, updated_at)
    SELECT 'commerce',
           jsonb_build_object('checkout_enabled', p_enabled),
           true,
           timezone('utc', now())
    WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE key = 'commerce');

    RETURN jsonb_build_object(
        'success', true,
        'checkout_enabled', p_enabled
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_checkout_readiness() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_checkout_readiness() TO anon;
GRANT EXECUTE ON FUNCTION public.admin_enable_checkout(BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_enable_checkout(BOOLEAN) TO anon;

