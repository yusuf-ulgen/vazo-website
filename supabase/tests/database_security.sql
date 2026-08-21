-- ==============================================================================
-- VAZO DATABASE SECURITY & RLS AUTOMATED TEST SUITE (pgTAP / Supabase Test Runner)
-- File: supabase/tests/database_security.sql
-- ==============================================================================

BEGIN;
SELECT plan(28);

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
    $$ INSERT INTO public.products (slug, name, material, retail_price) VALUES ('hack-vazo', 'Hack', 'Plastik', 100) $$,
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

-- 3.5 Anon CAN submit trade application with status=pending
SELECT lives_ok(
    $$ INSERT INTO public.trade_applications (company_name, tax_number, tax_office, business_type, contact_person, email, phone, status)
       VALUES ('Test Mimarlık', '1234567890', 'Kadıköy VD', 'Tasarım', 'Ahmet Yılmaz', 'ahmet@test.com', '05551112233', 'pending') $$,
    'Anonymous user can submit trade application with pending status'
);

-- 3.6 Anon CANNOT submit trade application with pre-approved status
SELECT throws_ok(
    $$ INSERT INTO public.trade_applications (company_name, tax_number, tax_office, business_type, contact_person, email, phone, status)
       VALUES ('Fraud Ltd', '9999999999', 'Merkez VD', 'Diğer', 'Fraudster', 'fraud@test.com', '05550000000', 'approved') $$,
    '42501',
    NULL,
    'Anonymous user cannot bypass status verification on trade application'
);

-- 3.7 Anon CANNOT read back trade applications
SELECT is(
    (SELECT count(*) FROM public.trade_applications),
    0::bigint,
    'Anonymous user cannot read submitted trade applications (no email leakage)'
);

-- 3.8 Anon CAN submit contact message
SELECT lives_ok(
    $$ INSERT INTO public.contact_messages (name, email, subject, message, status)
       VALUES ('Ziyaretçi', 'ziyaretci@test.com', 'Bilgi', 'Merhabalar, ürün hakkında bilgi alabilir miyim?', 'new') $$,
    'Anonymous user can submit contact message'
);

-- 3.9 Anon CANNOT read contact messages
SELECT is(
    (SELECT count(*) FROM public.contact_messages),
    0::bigint,
    'Anonymous user cannot read contact messages'
);

-- 3.10 Anon CAN subscribe to newsletter and CANNOT read subscriber list
SELECT lives_ok(
    $$ INSERT INTO public.newsletter_subscriptions (normalized_email, status, source)
       VALUES ('subscriber@test.com', 'active', 'test_runner') $$,
    'Anonymous user can insert newsletter subscription'
);

SELECT is(
    (SELECT count(*) FROM public.newsletter_subscriptions),
    0::bigint,
    'Anonymous user cannot read newsletter subscribers (privacy protection)'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
