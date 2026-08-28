-- ==============================================================================
-- Migration: 20260828030000_phase3_shipping_schema.sql
-- Description: Phase 3.3 Global Shipping Zones, Zone Countries, Rates & Engine
-- Author: Yusuf Ulgen / Vazo Platform Engineering
-- Standards: ISO-4217 minor units, ISO 3166-1 alpha-2 country codes, RLS isolated,
--            Deterministic rate resolution, Zero fabricated international prices.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Shipping Zones Master Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipping_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 0,
    retail_enabled BOOLEAN NOT NULL DEFAULT true,
    wholesale_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_shipping_zones_active_prio ON public.shipping_zones(active, priority DESC);

-- ------------------------------------------------------------------------------
-- 2. Shipping Zone Countries Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipping_zone_countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID NOT NULL REFERENCES public.shipping_zones(id) ON DELETE CASCADE,
    country_code TEXT NOT NULL UNIQUE CHECK (
        length(country_code) = 2 AND country_code = upper(country_code)
    ),
    country_name TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_shipping_zc_country_active ON public.shipping_zone_countries(country_code, active);
CREATE INDEX IF NOT EXISTS idx_shipping_zc_zone_id ON public.shipping_zone_countries(zone_id);

-- ------------------------------------------------------------------------------
-- 3. Shipping Rates Table (Minor Units)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipping_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID NOT NULL REFERENCES public.shipping_zones(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'TRY' CHECK (currency IN ('TRY', 'USD', 'EUR', 'GBP')),
    flat_amount_minor BIGINT NOT NULL CHECK (flat_amount_minor >= 0),
    free_shipping_threshold_minor BIGINT CHECK (free_shipping_threshold_minor >= 0),
    minimum_order_minor BIGINT CHECK (minimum_order_minor >= 0),
    maximum_order_minor BIGINT CHECK (maximum_order_minor >= 0),
    estimated_delivery_text TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

    CONSTRAINT chk_shipping_rates_order_bounds CHECK (
        maximum_order_minor IS NULL OR minimum_order_minor IS NULL OR maximum_order_minor >= minimum_order_minor
    )
);

CREATE INDEX IF NOT EXISTS idx_shipping_rates_zone_active ON public.shipping_rates(zone_id, active, priority DESC);

-- ------------------------------------------------------------------------------
-- 4. Initial Seed Data: Domestic Turkey Baseline (No Fake International Rates)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_tr_zone_id UUID := '70000000-0000-0000-0000-000000000001';
BEGIN
    -- 1. Turkey Zone
    INSERT INTO public.shipping_zones (
        id, name, description, active, priority, retail_enabled, wholesale_enabled
    ) VALUES (
        v_tr_zone_id, 'Türkiye İçi', 'Türkiye geneli standart ve express kargo bölgesi', true, 10, true, true
    ) ON CONFLICT (name) DO UPDATE SET active = true;

    -- 2. Turkey Country
    INSERT INTO public.shipping_zone_countries (
        zone_id, country_code, country_name, active
    ) VALUES (
        v_tr_zone_id, 'TR', 'Türkiye', true
    ) ON CONFLICT (country_code) DO NOTHING;

    -- 3. Turkey Standard Shipping Rate (150.00 TRY flat, Free over 5,000.00 TRY)
    INSERT INTO public.shipping_rates (
        zone_id, name, currency, flat_amount_minor, free_shipping_threshold_minor,
        estimated_delivery_text, active, priority
    ) VALUES (
        v_tr_zone_id, 'Standart Yurtiçi Teslimat', 'TRY', 15000, 500000,
        '2–4 İş Günü', true, 10
    ) ON CONFLICT DO NOTHING;
END $$;

-- ------------------------------------------------------------------------------
-- 5. Authoritative Shipping Rate Resolution Function
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_shipping_rate(
    p_country_code TEXT,
    p_channel TEXT DEFAULT 'retail',
    p_subtotal_minor BIGINT DEFAULT 0,
    p_currency TEXT DEFAULT 'TRY'
)
RETURNS TABLE (
    supported BOOLEAN,
    zone_id UUID,
    zone_name TEXT,
    rate_id UUID,
    rate_name TEXT,
    shipping_minor BIGINT,
    free_shipping_applied BOOLEAN,
    estimated_delivery_text TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_country TEXT;
    v_rec RECORD;
BEGIN
    v_country := upper(trim(COALESCE(p_country_code, '')));

    IF v_country = '' THEN
        RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::uuid, NULL::text, 0::bigint, false, NULL::text;
        RETURN;
    END IF;

    -- Search for matching active zone and rate
    SELECT 
        z.id AS z_id,
        z.name AS z_name,
        r.id AS r_id,
        r.name AS r_name,
        r.flat_amount_minor AS r_flat,
        r.free_shipping_threshold_minor AS r_thresh,
        r.estimated_delivery_text AS r_est
    INTO v_rec
    FROM public.shipping_zones z
    JOIN public.shipping_zone_countries c ON c.zone_id = z.id
    JOIN public.shipping_rates r ON r.zone_id = z.id
    WHERE c.country_code = v_country
      AND c.active = true
      AND z.active = true
      AND r.active = true
      AND r.currency = p_currency
      AND (
          (p_channel = 'retail' AND z.retail_enabled = true) OR
          (p_channel = 'wholesale' AND z.wholesale_enabled = true)
      )
      AND (r.minimum_order_minor IS NULL OR p_subtotal_minor >= r.minimum_order_minor)
      AND (r.maximum_order_minor IS NULL OR p_subtotal_minor <= r.maximum_order_minor)
    ORDER BY z.priority DESC, r.priority DESC, r.flat_amount_minor ASC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::uuid, NULL::text, 0::bigint, false, NULL::text;
        RETURN;
    END IF;

    -- Determine if free shipping threshold is met
    IF v_rec.r_thresh IS NOT NULL AND p_subtotal_minor >= v_rec.r_thresh THEN
        RETURN QUERY SELECT 
            true,
            v_rec.z_id,
            v_rec.z_name,
            v_rec.r_id,
            v_rec.r_name,
            0::bigint,
            true,
            v_rec.r_est;
    ELSE
        RETURN QUERY SELECT 
            true,
            v_rec.z_id,
            v_rec.z_name,
            v_rec.r_id,
            v_rec.r_name,
            v_rec.r_flat,
            false,
            v_rec.r_est;
    END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. Updated_At Triggers
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_shipping_zones_updated_at ON public.shipping_zones;
CREATE TRIGGER trg_shipping_zones_updated_at
BEFORE UPDATE ON public.shipping_zones
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at_commerce();

DROP TRIGGER IF EXISTS trg_shipping_rates_updated_at ON public.shipping_rates;
CREATE TRIGGER trg_shipping_rates_updated_at
BEFORE UPDATE ON public.shipping_rates
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at_commerce();

-- ------------------------------------------------------------------------------
-- 7. Enable Row Level Security (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zone_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 8. RLS Policies
-- ------------------------------------------------------------------------------

-- 8.1 Public / Authenticated Customers can read active shipping zones
CREATE POLICY "Public read active shipping zones"
ON public.shipping_zones FOR SELECT
TO anon, authenticated
USING (active = true);

CREATE POLICY "Admins have full access to shipping zones"
ON public.shipping_zones FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 8.2 Public / Authenticated Customers can read active shipping countries
CREATE POLICY "Public read active shipping zone countries"
ON public.shipping_zone_countries FOR SELECT
TO anon, authenticated
USING (
    active = true AND EXISTS (
        SELECT 1 FROM public.shipping_zones z
        WHERE z.id = shipping_zone_countries.zone_id
          AND z.active = true
    )
);

CREATE POLICY "Admins have full access to shipping zone countries"
ON public.shipping_zone_countries FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 8.3 Public / Authenticated Customers can read active shipping rates
CREATE POLICY "Public read active shipping rates"
ON public.shipping_rates FOR SELECT
TO anon, authenticated
USING (
    active = true AND EXISTS (
        SELECT 1 FROM public.shipping_zones z
        WHERE z.id = shipping_rates.zone_id
          AND z.active = true
    )
);

CREATE POLICY "Admins have full access to shipping rates"
ON public.shipping_rates FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

COMMIT;
