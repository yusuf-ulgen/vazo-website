-- ==============================================================================
-- VAZO E-COMMERCE PLATFORM - INITIAL STOREFRONT SCHEMA
-- Migration: 20260821000000_initial_storefront_schema.sql
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. Categories
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    seo_title TEXT,
    seo_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 2. Collections
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    story_markdown TEXT,
    hero_image_url TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    featured BOOLEAN NOT NULL DEFAULT false,
    sort_order INT NOT NULL DEFAULT 0,
    seo_title TEXT,
    seo_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 3. Products
-- ------------------------------------------------------------------------------
CREATE TYPE product_status AS ENUM ('draft', 'published', 'archived', 'out_of_stock');

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    short_description TEXT NOT NULL,
    description TEXT NOT NULL,
    status product_status NOT NULL DEFAULT 'draft',
    material TEXT NOT NULL,
    finish TEXT NOT NULL,
    care_instructions TEXT,
    origin_country TEXT NOT NULL DEFAULT 'Türkiye',
    retail_price NUMERIC(10, 2) NOT NULL CHECK (retail_price >= 0),
    compare_at_price NUMERIC(10, 2) CHECK (compare_at_price IS NULL OR compare_at_price >= retail_price),
    retail_enabled BOOLEAN NOT NULL DEFAULT true,
    wholesale_enabled BOOLEAN NOT NULL DEFAULT true,
    wholesale_moq INT NOT NULL DEFAULT 1 CHECK (wholesale_moq >= 1),
    wholesale_lead_time_days INT DEFAULT 14,
    featured BOOLEAN NOT NULL DEFAULT false,
    new_arrival BOOLEAN NOT NULL DEFAULT false,
    bestseller BOOLEAN NOT NULL DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    seo_title TEXT,
    seo_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 4. Product Variants
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sku TEXT NOT NULL UNIQUE,
    variant_name TEXT NOT NULL,
    color_name TEXT NOT NULL,
    color_hex TEXT,
    finish TEXT,
    size_label TEXT,
    height_cm NUMERIC(6, 2),
    diameter_cm NUMERIC(6, 2),
    width_cm NUMERIC(6, 2),
    depth_cm NUMERIC(6, 2),
    weight_kg NUMERIC(6, 2),
    retail_price NUMERIC(10, 2) NOT NULL CHECK (retail_price >= 0),
    compare_at_price NUMERIC(10, 2),
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    is_available_for_retail BOOLEAN NOT NULL DEFAULT true,
    is_available_for_wholesale BOOLEAN NOT NULL DEFAULT true,
    image_url TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 5. Product Media Gallery
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    media_type TEXT NOT NULL DEFAULT 'image',
    url TEXT NOT NULL,
    alt_text TEXT NOT NULL,
    width INT,
    height INT,
    sort_order INT NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 6. Product-Category & Product-Collection Relations
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_categories (
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

CREATE TABLE IF NOT EXISTS public.product_collections (
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, collection_id)
);

-- ------------------------------------------------------------------------------
-- 7. Wholesale Price Tiers
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wholesale_price_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
    min_quantity INT NOT NULL CHECK (min_quantity >= 1),
    max_quantity INT CHECK (max_quantity IS NULL OR max_quantity >= min_quantity),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    discount_percentage NUMERIC(5, 2),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 8. CMS: Announcement Bars, Hero Slides, Editorial Sections
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcement_bars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    link_text TEXT,
    link_url TEXT,
    background_color TEXT,
    text_color TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hero_slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eyebrow TEXT,
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT NOT NULL,
    image_url TEXT NOT NULL,
    primary_cta_text TEXT NOT NULL,
    primary_cta_url TEXT NOT NULL,
    secondary_cta_text TEXT,
    secondary_cta_url TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.editorial_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eyebrow TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT NOT NULL,
    image_position TEXT NOT NULL DEFAULT 'left' CHECK (image_position IN ('left', 'right')),
    cta_text TEXT,
    cta_url TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 9. CMS: Navigation Mega Menus & Wholesale Benefits
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.menu_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_type TEXT NOT NULL CHECK (menu_type IN ('retail_mega', 'wholesale_mega', 'primary', 'footer')),
    title TEXT NOT NULL,
    promo_title TEXT,
    promo_subtitle TEXT,
    promo_image_url TEXT,
    promo_cta_text TEXT,
    promo_cta_url TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.menu_groups(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    href TEXT NOT NULL,
    is_new BOOLEAN NOT NULL DEFAULT false,
    is_popular BOOLEAN NOT NULL DEFAULT false,
    sort_order INT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.wholesale_benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true
);

-- ------------------------------------------------------------------------------
-- 10. Site Settings (Public / Non-Secret)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 11. Trade Applications (B2B Public Submission)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trade_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    tax_number TEXT NOT NULL,
    tax_office TEXT NOT NULL,
    business_type TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    website TEXT,
    estimated_monthly_volume TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'more_info_needed')),
    notes TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ
);

-- ------------------------------------------------------------------------------
-- 12. Indexes for Optimal Storefront Query Performance
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_products_new ON public.products(new_arrival) WHERE new_arrival = true;
CREATE INDEX IF NOT EXISTS idx_products_bestseller ON public.products(bestseller) WHERE bestseller = true;
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_media_product_id ON public.product_media(product_id);
CREATE INDEX IF NOT EXISTS idx_wholesale_tiers_product_id ON public.wholesale_price_tiers(product_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_collections_slug ON public.collections(slug);

-- ------------------------------------------------------------------------------
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- Mandatory security: Public anonymous users can only READ published/active content.
-- ------------------------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wholesale_price_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_bars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wholesale_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_applications ENABLE ROW LEVEL SECURITY;

-- Read policies for public anonymous & authenticated visitors
CREATE POLICY "Public can view active categories" ON public.categories
    FOR SELECT TO anon, authenticated USING (active = true);

CREATE POLICY "Public can view active collections" ON public.collections
    FOR SELECT TO anon, authenticated USING (active = true);

CREATE POLICY "Public can view published products" ON public.products
    FOR SELECT TO anon, authenticated USING (status = 'published');

CREATE POLICY "Public can view active product variants" ON public.product_variants
    FOR SELECT TO anon, authenticated USING (active = true);

CREATE POLICY "Public can view product media" ON public.product_media
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public can view product categories" ON public.product_categories
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public can view product collections" ON public.product_collections
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public can view active wholesale tiers" ON public.wholesale_price_tiers
    FOR SELECT TO anon, authenticated USING (active = true);

CREATE POLICY "Public can view active announcement bars" ON public.announcement_bars
    FOR SELECT TO anon, authenticated USING (active = true);

CREATE POLICY "Public can view active hero slides" ON public.hero_slides
    FOR SELECT TO anon, authenticated USING (active = true);

CREATE POLICY "Public can view active editorial sections" ON public.editorial_sections
    FOR SELECT TO anon, authenticated USING (active = true);

CREATE POLICY "Public can view active menu groups" ON public.menu_groups
    FOR SELECT TO anon, authenticated USING (active = true);

CREATE POLICY "Public can view active menu items" ON public.menu_items
    FOR SELECT TO anon, authenticated USING (active = true);

CREATE POLICY "Public can view active wholesale benefits" ON public.wholesale_benefits
    FOR SELECT TO anon, authenticated USING (active = true);

CREATE POLICY "Public can view public site settings" ON public.site_settings
    FOR SELECT TO anon, authenticated USING (true);

-- Trade applications: Public can INSERT application, but cannot SELECT/UPDATE/DELETE
CREATE POLICY "Public can submit trade applications" ON public.trade_applications
    FOR INSERT TO anon, authenticated WITH CHECK (true);
