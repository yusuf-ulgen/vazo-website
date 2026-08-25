-- ==============================================================================
-- VAZO E-COMMERCE PLATFORM - PHASE 2.2 SECURE ADMIN AUTHENTICATION & RBAC
-- Migration: 20260826010000_phase2_admin_rbac.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Admin Users RBAC Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. Hardened Database Helper Functions (Security Definer & search_path bounded)
-- ------------------------------------------------------------------------------

-- 2.1 is_admin helper function
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_users
        WHERE user_id = COALESCE(check_user_id, auth.uid())
          AND active = true
    );
$$;

-- 2.2 get_admin_role helper function
CREATE OR REPLACE FUNCTION public.get_admin_role(check_user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
    SELECT role
    FROM public.admin_users
    WHERE user_id = COALESCE(check_user_id, auth.uid())
      AND active = true
    LIMIT 1;
$$;

-- Grant EXECUTE permissions on helpers
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_role(UUID) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 3. Row Level Security on admin_users Table
-- Browser clients cannot insert, update, or self-escalate.
-- Initial Admin provisioning is performed via Supabase Dashboard / SQL / service_role.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;
CREATE POLICY "Admins can view admin users" ON public.admin_users
    FOR SELECT TO authenticated
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. Admin Management Policies for Catalog & Content Tables
-- ------------------------------------------------------------------------------

-- 4.1 Products
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products" ON public.products
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4.2 Product Variants
DROP POLICY IF EXISTS "Admins can manage product variants" ON public.product_variants;
CREATE POLICY "Admins can manage product variants" ON public.product_variants
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4.3 Product Media
DROP POLICY IF EXISTS "Admins can manage product media" ON public.product_media;
CREATE POLICY "Admins can manage product media" ON public.product_media
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4.4 Categories
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4.5 Collections
DROP POLICY IF EXISTS "Admins can manage collections" ON public.collections;
CREATE POLICY "Admins can manage collections" ON public.collections
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4.6 Product Categories Junction
DROP POLICY IF EXISTS "Admins can manage product categories" ON public.product_categories;
CREATE POLICY "Admins can manage product categories" ON public.product_categories
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4.7 Product Collections Junction
DROP POLICY IF EXISTS "Admins can manage product collections" ON public.product_collections;
CREATE POLICY "Admins can manage product collections" ON public.product_collections
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4.8 Wholesale Price Tiers
DROP POLICY IF EXISTS "Admins can manage wholesale tiers" ON public.wholesale_price_tiers;
CREATE POLICY "Admins can manage wholesale tiers" ON public.wholesale_price_tiers
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4.9 Announcement Bars
DROP POLICY IF EXISTS "Admins can manage announcement bars" ON public.announcement_bars;
CREATE POLICY "Admins can manage announcement bars" ON public.announcement_bars
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4.10 Hero Slides
DROP POLICY IF EXISTS "Admins can manage hero slides" ON public.hero_slides;
CREATE POLICY "Admins can manage hero slides" ON public.hero_slides
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4.11 Editorial Sections
DROP POLICY IF EXISTS "Admins can manage editorial sections" ON public.editorial_sections;
CREATE POLICY "Admins can manage editorial sections" ON public.editorial_sections
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4.12 Menu Groups
DROP POLICY IF EXISTS "Admins can manage menu groups" ON public.menu_groups;
CREATE POLICY "Admins can manage menu groups" ON public.menu_groups
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4.13 Menu Items
DROP POLICY IF EXISTS "Admins can manage menu items" ON public.menu_items;
CREATE POLICY "Admins can manage menu items" ON public.menu_items
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4.14 Wholesale Benefits
DROP POLICY IF EXISTS "Admins can manage wholesale benefits" ON public.wholesale_benefits;
CREATE POLICY "Admins can manage wholesale benefits" ON public.wholesale_benefits
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4.15 Site Settings
DROP POLICY IF EXISTS "Admins can manage site settings" ON public.site_settings;
CREATE POLICY "Admins can manage site settings" ON public.site_settings
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4.16 Trade Applications (Inbox review)
DROP POLICY IF EXISTS "Admins can view and manage trade applications" ON public.trade_applications;
CREATE POLICY "Admins can view and manage trade applications" ON public.trade_applications
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4.17 Contact Messages (Inbox review)
DROP POLICY IF EXISTS "Admins can view and manage contact messages" ON public.contact_messages;
CREATE POLICY "Admins can view and manage contact messages" ON public.contact_messages
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4.18 Newsletter Subscriptions (Audience management)
DROP POLICY IF EXISTS "Admins can view and manage newsletter subscriptions" ON public.newsletter_subscriptions;
CREATE POLICY "Admins can view and manage newsletter subscriptions" ON public.newsletter_subscriptions
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 5. Performance Indexes
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON public.admin_users(user_id, active);
