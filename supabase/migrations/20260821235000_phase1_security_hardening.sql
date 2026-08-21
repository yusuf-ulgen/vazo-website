-- ==============================================================================
-- VAZO E-COMMERCE PLATFORM - PHASE 1 SECURITY & CORRECTNESS HARDENING
-- Migration: 20260821235000_phase1_security_hardening.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Hardening Site Settings (Explicit Public Allowlist)
-- ------------------------------------------------------------------------------
ALTER TABLE public.site_settings
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- Allowlist known public storefront settings
UPDATE public.site_settings
SET is_public = true
WHERE key IN ('general', 'contact', 'announcement', 'features', 'shipping_policy_preview');

-- Drop open policy and restrict public SELECT to is_public = true only
DROP POLICY IF EXISTS "Public can view public site settings" ON public.site_settings;
CREATE POLICY "Public can view public site settings" ON public.site_settings
    FOR SELECT TO anon, authenticated
    USING (is_public = true);

-- ------------------------------------------------------------------------------
-- 2. Contact Messages Table (Real Persistence for Contact Page)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
    email TEXT NOT NULL CHECK (char_length(email) >= 5 AND char_length(email) <= 255),
    subject TEXT NOT NULL CHECK (char_length(subject) >= 2 AND char_length(subject) <= 200),
    message TEXT NOT NULL CHECK (char_length(message) >= 5 AND char_length(message) <= 3000),
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived', 'replied')),
    admin_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Public can submit new contact messages (cannot supply admin_notes or change status)
CREATE POLICY "Public can submit contact messages" ON public.contact_messages
    FOR INSERT TO anon, authenticated
    WITH CHECK (
        status = 'new'
        AND reviewed_at IS NULL
        AND admin_notes IS NULL
    );

-- ------------------------------------------------------------------------------
-- 3. Newsletter Subscriptions Table (Real Persistence & Idempotency)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    normalized_email TEXT NOT NULL UNIQUE CHECK (char_length(normalized_email) >= 5 AND char_length(normalized_email) <= 255),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
    source TEXT NOT NULL DEFAULT 'storefront' CHECK (char_length(source) <= 50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Public can submit subscriptions (no public SELECT to prevent subscriber email leakage)
CREATE POLICY "Public can subscribe to newsletter" ON public.newsletter_subscriptions
    FOR INSERT TO anon, authenticated
    WITH CHECK (status = 'active');

-- ------------------------------------------------------------------------------
-- 4. Trade Applications Hardening
-- ------------------------------------------------------------------------------
ALTER TABLE public.trade_applications
    ADD COLUMN IF NOT EXISTS customer_message TEXT,
    ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Migrate legacy notes to customer_message if existing
UPDATE public.trade_applications
SET customer_message = notes
WHERE customer_message IS NULL AND notes IS NOT NULL;

-- Restrict length and enforce server-controlled fields on INSERT
DROP POLICY IF EXISTS "Public can submit trade applications" ON public.trade_applications;
CREATE POLICY "Public can submit trade applications" ON public.trade_applications
    FOR INSERT TO anon, authenticated
    WITH CHECK (
        status = 'pending'
        AND reviewed_at IS NULL
        AND admin_notes IS NULL
        AND char_length(company_name) <= 200
        AND char_length(tax_number) <= 50
        AND char_length(tax_office) <= 100
        AND char_length(contact_person) <= 100
        AND char_length(email) <= 255
        AND char_length(phone) <= 50
    );

-- ------------------------------------------------------------------------------
-- 5. Fix RLS Child-Resource Leakage (Parent Visibility Propagation)
-- ------------------------------------------------------------------------------

-- 5.1 product_variants: Require variant active and parent product published
DROP POLICY IF EXISTS "Public can view active product variants" ON public.product_variants;
CREATE POLICY "Public can view active product variants" ON public.product_variants
    FOR SELECT TO anon, authenticated
    USING (
        active = true
        AND EXISTS (
            SELECT 1 FROM public.products p
            WHERE p.id = product_variants.product_id
              AND p.status = 'published'
        )
    );

-- 5.2 product_media: Require parent product published and variant active if attached
DROP POLICY IF EXISTS "Public can view product media" ON public.product_media;
CREATE POLICY "Public can view product media" ON public.product_media
    FOR SELECT TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.products p
            WHERE p.id = product_media.product_id
              AND p.status = 'published'
        )
        AND (
            variant_id IS NULL
            OR EXISTS (
                SELECT 1 FROM public.product_variants pv
                WHERE pv.id = product_media.variant_id
                  AND pv.active = true
            )
        )
    );

-- 5.3 product_categories: Require published product and active category
DROP POLICY IF EXISTS "Public can view product categories" ON public.product_categories;
CREATE POLICY "Public can view product categories" ON public.product_categories
    FOR SELECT TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.products p
            WHERE p.id = product_categories.product_id
              AND p.status = 'published'
        )
        AND EXISTS (
            SELECT 1 FROM public.categories c
            WHERE c.id = product_categories.category_id
              AND c.active = true
        )
    );

-- 5.4 product_collections: Require published product and active collection
DROP POLICY IF EXISTS "Public can view product collections" ON public.product_collections;
CREATE POLICY "Public can view product collections" ON public.product_collections
    FOR SELECT TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.products p
            WHERE p.id = product_collections.product_id
              AND p.status = 'published'
        )
        AND EXISTS (
            SELECT 1 FROM public.collections col
            WHERE col.id = product_collections.collection_id
              AND col.active = true
        )
    );

-- 5.5 wholesale_price_tiers: Require active tier, published wholesale product, and active wholesale variant
DROP POLICY IF EXISTS "Public can view active wholesale tiers" ON public.wholesale_price_tiers;
CREATE POLICY "Public can view active wholesale tiers" ON public.wholesale_price_tiers
    FOR SELECT TO anon, authenticated
    USING (
        active = true
        AND EXISTS (
            SELECT 1 FROM public.products p
            WHERE p.id = wholesale_price_tiers.product_id
              AND p.status = 'published'
              AND p.wholesale_enabled = true
        )
        AND (
            variant_id IS NULL
            OR EXISTS (
                SELECT 1 FROM public.product_variants pv
                WHERE pv.id = wholesale_price_tiers.variant_id
                  AND pv.active = true
                  AND pv.is_available_for_wholesale = true
            )
        )
    );

-- 5.6 menu_items: Require active item and active parent menu group
DROP POLICY IF EXISTS "Public can view active menu items" ON public.menu_items;
CREATE POLICY "Public can view active menu items" ON public.menu_items
    FOR SELECT TO anon, authenticated
    USING (
        active = true
        AND EXISTS (
            SELECT 1 FROM public.menu_groups mg
            WHERE mg.id = menu_items.group_id
              AND mg.active = true
        )
    );

-- ------------------------------------------------------------------------------
-- 6. Performance Indexes for Hardened RLS Queries
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_product_variants_active_product ON public.product_variants(product_id, active);
CREATE INDEX IF NOT EXISTS idx_wholesale_tiers_active_product ON public.wholesale_price_tiers(product_id, active);
CREATE INDEX IF NOT EXISTS idx_menu_items_active_group ON public.menu_items(group_id, active);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_email ON public.newsletter_subscriptions(normalized_email);
