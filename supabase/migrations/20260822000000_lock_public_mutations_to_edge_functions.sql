-- ==============================================================================
-- VAZO E-COMMERCE PLATFORM - LOCK PUBLIC MUTATIONS TO EDGE FUNCTIONS & SCHEMA REFINEMENTS
-- Migration: 20260822000000_lock_public_mutations_to_edge_functions.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Explicit Primary Category Architecture
-- ------------------------------------------------------------------------------
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS primary_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- Populate primary_category_id from product_categories join if not already set
UPDATE public.products p
SET primary_category_id = pc.category_id
FROM (
    SELECT DISTINCT ON (product_id) product_id, category_id
    FROM public.product_categories
    ORDER BY product_id, category_id
) pc
WHERE p.id = pc.product_id AND p.primary_category_id IS NULL;

-- ------------------------------------------------------------------------------
-- 2. Revoke Direct Public Browser INSERT Policies from Mutation Tables
-- Ingestion is strictly mediated through Supabase Edge Functions with Service Role
-- ------------------------------------------------------------------------------

-- 2.1 Trade Applications: Drop direct anon/authenticated INSERT policy
DROP POLICY IF EXISTS "Public can submit trade applications" ON public.trade_applications;

-- 2.2 Contact Messages: Drop direct anon/authenticated INSERT policy
DROP POLICY IF EXISTS "Public can submit contact messages" ON public.contact_messages;

-- 2.3 Newsletter Subscriptions: Drop direct anon/authenticated INSERT policy
DROP POLICY IF EXISTS "Public can subscribe to newsletter" ON public.newsletter_subscriptions;

-- Ensure RLS is active on all mutation tables
ALTER TABLE public.trade_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Note: No SELECT/INSERT/UPDATE/DELETE policies exist for anon/authenticated on these tables.
-- All operations by visitors must go through Edge Functions executing with service_role authority.

-- ------------------------------------------------------------------------------
-- 3. Channel-Aware Variant Visibility & Integrity
-- ------------------------------------------------------------------------------
-- Ensure public variant SELECT policy strictly requires active variant and published parent
DROP POLICY IF EXISTS "Public can view active product variants" ON public.product_variants;
CREATE POLICY "Public can view active product variants" ON public.product_variants
    FOR SELECT TO anon, authenticated
    USING (
        active = true
        AND (is_available_for_retail = true OR is_available_for_wholesale = true)
        AND EXISTS (
            SELECT 1 FROM public.products p
            WHERE p.id = product_variants.product_id
            AND p.status = 'published'
        )
    );
