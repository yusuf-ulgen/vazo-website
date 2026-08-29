-- ==============================================================================
-- Migration: 20260829050000_phase3_seller_legal_schema.sql
-- Description: Phase 3.10 — Seller Legal Profile, checkout_enabled, readiness RPC
-- Author: Yusuf Ulgen / Vazo Platform Engineering
-- ==============================================================================
-- This migration:
--  1. Seeds seller_legal row in site_settings (empty, admin must fill).
--  2. Adds checkout_enabled boolean to commerce settings.
--  3. Creates get_checkout_readiness() — returns BOOLEAN map only, no secrets.
--  4. Creates admin_enable_checkout() RPC — admin RBAC, readiness guard.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Seed seller_legal row (empty — admin must fill via Settings UI)
-- ------------------------------------------------------------------------------
INSERT INTO public.site_settings (key, value, is_public, updated_at)
VALUES (
    'seller_legal',
    jsonb_build_object(
        'business_type', '',
        'owner_full_name', '',
        'legal_trade_title', '',
        'brand_name', null,
        'tax_office', '',
        'tax_number', '',
        'registered_address', '',
        'kep_address', '',
        'business_email', '',
        'business_phone', '',
        'chamber_name', null,
        'chamber_registration_number', null,
        'trade_registry_number', null,
        'mersis_number', null
    ),
    true,
    timezone('utc', now())
)
ON CONFLICT (key) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. Add checkout_enabled to commerce settings row
-- ------------------------------------------------------------------------------
UPDATE public.site_settings
SET value = value || jsonb_build_object('checkout_enabled', false),
    updated_at = timezone('utc', now())
WHERE key = 'commerce'
  AND NOT (value ? 'checkout_enabled');

-- Seed commerce row if missing
INSERT INTO public.site_settings (key, value, is_public, updated_at)
VALUES (
    'commerce',
    jsonb_build_object(
        'free_shipping_threshold', 0,
        'shipping_estimate_text', '',
        'shipping_summary', '',
        'returns_policy_text', '',
        'checkout_enabled', false
    ),
    true,
    timezone('utc', now())
)
ON CONFLICT (key) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. get_checkout_readiness() — Returns BOOLEAN presence flags only.
--    NEVER returns secret values. Callable by admin only.
-- ------------------------------------------------------------------------------
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
    v_has_paytr_secrets BOOLEAN;
    v_has_gmail_secrets BOOLEAN;
    v_seller_complete BOOLEAN;
    v_checkout_enabled BOOLEAN;
    v_has_shipping BOOLEAN;
    v_required_fields TEXT[] := ARRAY[
        'business_type', 'owner_full_name', 'legal_trade_title',
        'tax_office', 'tax_number', 'registered_address',
        'kep_address', 'business_email', 'business_phone'
    ];
    v_field TEXT;
    v_all_filled BOOLEAN := true;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Yalnızca yöneticiler hazırlık durumunu görüntüleyebilir.';
    END IF;

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
    SELECT EXISTS (
        SELECT 1 FROM public.shipping_zones sz
        JOIN public.shipping_rates sr ON sr.zone_id = sz.id
        WHERE sz.is_active = true AND sr.is_active = true
        LIMIT 1
    ) INTO v_has_shipping;

    -- PayTR secrets: we can only detect if the payment function has been used
    -- (we cannot read Deno env from SQL). Use presence of successful payments as proxy.
    -- If no payments exist, we cannot confirm. Mark as 'not_verifiable_from_db'.
    -- We set has_paytr_secrets = null (unknown) — frontend shows 'Harici doğrulama gerekli'.
    v_has_paytr_secrets := NULL; -- Cannot read Deno secrets from SQL

    -- Gmail: same constraint
    v_has_gmail_secrets := NULL;

    RETURN jsonb_build_object(
        'seller_legal_complete', v_seller_complete,
        'checkout_enabled', v_checkout_enabled,
        'has_active_shipping', v_has_shipping,
        'paytr_secrets_present', v_has_paytr_secrets,
        'gmail_secrets_present', v_has_gmail_secrets,
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

-- ------------------------------------------------------------------------------
-- 4. admin_enable_checkout(p_enabled) — Requires seller_legal complete
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_enable_checkout(p_enabled BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_readiness JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Yalnızca yöneticiler ödeme etkinleştirme yapabilir.';
    END IF;

    -- If enabling, check seller legal completeness
    IF p_enabled THEN
        SELECT public.get_checkout_readiness() INTO v_readiness;

        IF NOT COALESCE((v_readiness->>'seller_legal_complete')::boolean, false) THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Ödeme etkinleştirilemez: Satıcı yasal bilgileri eksik. Lütfen önce Satıcı Bilgileri formunu tamamlayın.'
            );
        END IF;

        IF NOT COALESCE((v_readiness->>'has_active_shipping')::boolean, false) THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Ödeme etkinleştirilemez: Aktif kargo bölgesi ve tarifesi tanımlanmamış.'
            );
        END IF;
    END IF;

    -- Update commerce.checkout_enabled
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

-- Grant admin_enable_checkout to authenticated (is_admin() guard inside)
GRANT EXECUTE ON FUNCTION public.get_checkout_readiness() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_enable_checkout(BOOLEAN) TO authenticated;

COMMIT;
