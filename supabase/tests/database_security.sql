-- ==============================================================================
-- VAZO DATABASE SECURITY & RLS AUTOMATED TEST SUITE (pgTAP / Supabase Test Runner)
-- File: supabase/tests/database_security.sql
-- ==============================================================================

BEGIN;
SELECT plan(30);

-- ------------------------------------------------------------------------------
-- 1. Table Existence & Schema Verification
-- ------------------------------------------------------------------------------
SELECT has_table('public', 'products', 'Table public.products should exist');
SELECT has_table('public', 'product_variants', 'Table public.product_variants should exist');
SELECT has_table('public', 'product_media', 'Table public.product_media should exist');
SELECT has_table('public', 'wholesale_price_tiers', 'Table public.wholesale_price_tiers should exist');
SELECT has_table('public', 'categories', 'Table public.categories should exist');
SELECT has_table('public', 'collections', 'Table public.collections should exist');
SELECT has_table('public', 'site_settings', 'Table public.site_settings should exist');
SELECT has_table('public', 'trade_applications', 'Table public.trade_applications should exist');
SELECT has_table('public', 'contact_messages', 'Table public.contact_messages should exist');
SELECT has_table('public', 'newsletter_subscriptions', 'Table public.newsletter_subscriptions should exist');

-- ------------------------------------------------------------------------------
-- 2. Row Level Security (RLS) Enabled Checks
-- ------------------------------------------------------------------------------
SELECT row_level_security_is_active('public', 'products', 'RLS should be active on products');
SELECT row_level_security_is_active('public', 'product_variants', 'RLS should be active on product_variants');
SELECT row_level_security_is_active('public', 'product_media', 'RLS should be active on product_media');
SELECT row_level_security_is_active('public', 'wholesale_price_tiers', 'RLS should be active on wholesale_price_tiers');
SELECT row_level_security_is_active('public', 'site_settings', 'RLS should be active on site_settings');
SELECT row_level_security_is_active('public', 'trade_applications', 'RLS should be active on trade_applications');
SELECT row_level_security_is_active('public', 'contact_messages', 'RLS should be active on contact_messages');
SELECT row_level_security_is_active('public', 'newsletter_subscriptions', 'RLS should be active on newsletter_subscriptions');

-- ------------------------------------------------------------------------------
-- 3. Anonymous Role (Storefront Public Visitor) Isolation Tests
-- ------------------------------------------------------------------------------
SET LOCAL ROLE anon;

-- 3.1 Anon can view published products
SELECT ok(
    (SELECT count(*) FROM public.products WHERE status = 'published') >= 0,
    'Anonymous user can query published products'
);

-- 3.2 Anon CANNOT view draft or archived products
SELECT is(
    (SELECT count(*) FROM public.products WHERE status IN ('draft', 'archived')),
    0::bigint,
    'Anonymous user receives 0 rows for draft/archived products'
);

-- 3.3 Anon CANNOT insert, update, or delete products
SELECT throws_ok(
    $$ INSERT INTO public.products (slug, name, material, finish, retail_price) VALUES ('hack-vazo', 'Hack', 'Plastik', 'Parlak', 100) $$,
    '42501',
    NULL,
    'Anonymous user cannot insert products'
);

-- 3.4 Anon CANNOT view private site settings
SELECT is(
    (SELECT count(*) FROM public.site_settings WHERE is_public = false),
    0::bigint,
    'Anonymous user receives 0 rows for private site settings'
);

-- 3.5 Direct Public Browser Mutation Denial: Trade Applications
SELECT throws_ok(
    $$ INSERT INTO public.trade_applications (company_name, tax_number, tax_office, business_type, contact_person, email, phone, status)
       VALUES ('Direct Browser Test', '1234567890', 'Kadıköy VD', 'Tasarım', 'Caner Yılmaz', 'caner@test.com', '05551112233', 'pending') $$,
    '42501',
    NULL,
    'Direct anonymous INSERT into trade_applications must fail (Edge Function required)'
);

-- 3.6 Anon CANNOT read back trade applications
SELECT is(
    (SELECT count(*) FROM public.trade_applications),
    0::bigint,
    'Anonymous user cannot read submitted trade applications (zero leakage)'
);

-- 3.7 Direct Public Browser Mutation Denial: Contact Messages
SELECT throws_ok(
    $$ INSERT INTO public.contact_messages (name, email, subject, message, status)
       VALUES ('Ziyaretçi', 'ziyaretci@test.com', 'Bilgi', 'Doğrudan mesaj iletimi', 'new') $$,
    '42501',
    NULL,
    'Direct anonymous INSERT into contact_messages must fail (Edge Function required)'
);

-- 3.8 Anon CANNOT read contact messages
SELECT is(
    (SELECT count(*) FROM public.contact_messages),
    0::bigint,
    'Anonymous user cannot read contact messages'
);

-- 3.9 Direct Public Browser Mutation Denial: Newsletter Subscriptions
SELECT throws_ok(
    $$ INSERT INTO public.newsletter_subscriptions (normalized_email, status, source)
       VALUES ('direct-anon-subscriber@test.com', 'active', 'browser') $$,
    '42501',
    NULL,
    'Direct anonymous INSERT into newsletter_subscriptions must fail (Edge Function required)'
);

-- 3.10 Anon CANNOT read newsletter subscribers
SELECT is(
    (SELECT count(*) FROM public.newsletter_subscriptions),
    0::bigint,
    'Anonymous user cannot read newsletter subscribers (privacy protection)'
);

-- ------------------------------------------------------------------------------
-- 4. Hidden-Parent Child RLS Regression Check
-- ------------------------------------------------------------------------------
RESET ROLE;

-- Setup draft parent product with child variant and media
DO $$
DECLARE
    v_draft_id UUID := 'd0000000-0000-0000-0000-000000000001';
BEGIN
    INSERT INTO public.products (id, slug, name, short_description, description, status, material, finish, retail_price)
    VALUES (v_draft_id, 'hidden-draft-vase', 'Gizli Taslak Vazo', 'Taslak', 'Taslak Açıklama', 'draft', 'Seramik', 'Mat', 1500)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.product_variants (product_id, sku, variant_name, color_name, retail_price, stock_quantity, active)
    VALUES (v_draft_id, 'DRAFT-VAR-1', 'Taslak Renk', 'Doğal', 1500, 10, true)
    ON CONFLICT (sku) DO NOTHING;

    INSERT INTO public.product_media (product_id, url, alt_text, sort_order)
    VALUES (v_draft_id, 'https://example.com/draft.jpg', 'Taslak Görsel', 0)
    ON CONFLICT DO NOTHING;
END $$;

SET LOCAL ROLE anon;

-- Child variant of draft parent MUST NOT be visible to anon
SELECT is(
    (SELECT count(*) FROM public.product_variants WHERE sku = 'DRAFT-VAR-1'),
    0::bigint,
    'Child variant of draft product is completely invisible to anonymous visitors'
);

-- Child media of draft parent MUST NOT be visible to anon
SELECT is(
    (SELECT count(*) FROM public.product_media WHERE alt_text = 'Taslak Görsel'),
    0::bigint,
    'Child media of draft product is completely invisible to anonymous visitors'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
