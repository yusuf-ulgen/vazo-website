-- ==============================================================================
-- Migration: 20260913160000_phase4_discount_codes.sql
-- Description: Phase 4 — Discount Codes (İndirim Kodları) Schema & RLS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.discount_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL,
    discount_percentage NUMERIC(5, 2) NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
    scope VARCHAR(20) NOT NULL DEFAULT 'all' CHECK (scope IN ('all', 'category', 'collection')),
    scope_id UUID,
    scope_label TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    usage_limit INTEGER CHECK (usage_limit IS NULL OR usage_limit > 0),
    usage_count INTEGER NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT discount_codes_code_unique UNIQUE (code)
);

-- Case-insensitive unique index for fast lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_discount_codes_code_upper ON public.discount_codes (UPPER(code));
CREATE INDEX IF NOT EXISTS idx_discount_codes_active_expires ON public.discount_codes (is_active, expires_at);

-- Enable RLS
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- 1. Public / Customers can read active discount codes (for cart validation)
CREATE POLICY "Public users can view active discount codes"
    ON public.discount_codes
    FOR SELECT
    USING (is_active = true);

-- 2. Admins have full access
CREATE POLICY "Admins have full access to discount codes"
    ON public.discount_codes
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Permissions
GRANT SELECT ON TABLE public.discount_codes TO anon, authenticated;
GRANT ALL ON TABLE public.discount_codes TO authenticated;
GRANT ALL ON TABLE public.discount_codes TO service_role;
