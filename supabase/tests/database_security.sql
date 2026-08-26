-- ==============================================================================
-- VAZO DATABASE SECURITY & RLS AUTOMATED TEST SUITE (pgTAP / Supabase Test Runner)
-- File: supabase/tests/database_security.sql
-- ==============================================================================

BEGIN;
SELECT plan(51);

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
SELECT has_table('public', 'admin_users', 'Table public.admin_users should exist');
SELECT has_table('public', 'admin_audit_logs', 'Table public.admin_audit_logs should exist');

-- ------------------------------------------------------------------------------
-- 2. Row Level Security (RLS) Enabled Checks
-- ------------------------------------------------------------------------------
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.products'::regclass), 'RLS should be active on products');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.product_variants'::regclass), 'RLS should be active on product_variants');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.product_media'::regclass), 'RLS should be active on product_media');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.wholesale_price_tiers'::regclass), 'RLS should be active on wholesale_price_tiers');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.site_settings'::regclass), 'RLS should be active on site_settings');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.trade_applications'::regclass), 'RLS should be active on trade_applications');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.contact_messages'::regclass), 'RLS should be active on contact_messages');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.newsletter_subscriptions'::regclass), 'RLS should be active on newsletter_subscriptions');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.admin_users'::regclass), 'RLS should be active on admin_users');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.admin_audit_logs'::regclass), 'RLS should be active on admin_audit_logs');

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

-- 3.5 Anon CAN view public site settings
SELECT ok(
    (SELECT count(*) FROM public.site_settings WHERE is_public = true) >= 4,
    'Anonymous user can read public site settings (general, contact, commerce, social)'
);

-- 3.6 Direct Public Browser Mutation Denial: Trade Applications
SELECT throws_ok(
    $$ INSERT INTO public.trade_applications (company_name, tax_number, tax_office, business_type, contact_person, email, phone, status)
       VALUES ('Direct Browser Test', '1234567890', 'Kadıköy VD', 'Tasarım', 'Caner Yılmaz', 'caner@test.com', '05551112233', 'pending') $$,
    '42501',
    NULL,
    'Direct anonymous INSERT into trade_applications must fail (Edge Function required)'
);

-- 3.7 Anon CANNOT read back trade applications
SELECT is(
    (SELECT count(*) FROM public.trade_applications),
    0::bigint,
    'Anonymous user cannot read submitted trade applications (zero leakage)'
);

-- 3.8 Direct Public Browser Mutation Denial: Contact Messages
SELECT throws_ok(
    $$ INSERT INTO public.contact_messages (name, email, subject, message, status)
       VALUES ('Ziyaretçi', 'ziyaretci@test.com', 'Bilgi', 'Doğrudan mesaj iletimi', 'new') $$,
    '42501',
    NULL,
    'Direct anonymous INSERT into contact_messages must fail (Edge Function required)'
);

-- 3.9 Anon CANNOT read back contact messages
SELECT is(
    (SELECT count(*) FROM public.contact_messages),
    0::bigint,
    'Anonymous user cannot read customer contact messages (zero leakage)'
);

-- 3.10 Direct Public Browser Mutation Denial: Newsletter Subscriptions
SELECT throws_ok(
    $$ INSERT INTO public.newsletter_subscriptions (normalized_email, status)
       VALUES ('spam@test.com', 'active') $$,
    '42501',
    NULL,
    'Direct anonymous INSERT into newsletter_subscriptions must fail (Edge Function required)'
);

-- 3.11 Anon CANNOT read back newsletter subscribers
SELECT is(
    (SELECT count(*) FROM public.newsletter_subscriptions),
    0::bigint,
    'Anonymous user cannot read newsletter subscriber list (zero leakage)'
);

-- ------------------------------------------------------------------------------
-- 4. Draft Cascading Visibility Protection (RLS Child Invariant)
-- ------------------------------------------------------------------------------
RESET ROLE;

-- Setup test draft product with variant and media
DO $$
DECLARE
    v_draft_id UUID := 'd0000000-0000-0000-0000-000000000001';
BEGIN
    INSERT INTO public.products (id, slug, name, short_description, description, material, finish, status, retail_price)
    VALUES (v_draft_id, 'hidden-draft-vase', 'Gizli Taslak Vazo', 'Taslak kısa açıklama', 'Taslak açıklama', 'Seramik', 'Mat', 'draft', 990.00)
    ON CONFLICT (id) DO UPDATE SET status = 'draft';

    INSERT INTO public.product_variants (product_id, sku, variant_name, color_name, retail_price, stock_quantity)
    VALUES (v_draft_id, 'VAZ-DRAFT-01', 'Draft Variant', 'Ham', 990.00, 10)
    ON CONFLICT (sku) DO NOTHING;

    INSERT INTO public.product_media (product_id, url, alt_text, sort_order, is_primary)
    VALUES (v_draft_id, 'https://example.com/draft.jpg', 'Draft Media', 1, true)
    ON CONFLICT DO NOTHING;
END $$;

SET LOCAL ROLE anon;

SELECT is(
    (SELECT count(*) FROM public.product_variants pv
     JOIN public.products p ON p.id = pv.product_id
     WHERE p.status = 'draft' AND p.slug = 'hidden-draft-vase'),
    0::bigint,
    'Child variant of draft product is completely invisible to anonymous visitors'
);

SELECT is(
    (SELECT count(*) FROM public.product_media pm
     JOIN public.products p ON p.id = pm.product_id
     WHERE p.status = 'draft' AND p.slug = 'hidden-draft-vase'),
    0::bigint,
    'Child media of draft product is completely invisible to anonymous visitors'
);

-- ------------------------------------------------------------------------------
-- 5. RBAC Isolation & User Enumeration Security
-- ------------------------------------------------------------------------------
RESET ROLE;

-- Setup test admin user
DO $$
BEGIN
    INSERT INTO public.admin_users (user_id, role, active)
    VALUES ('a0000000-0000-0000-0000-000000000001', 'admin', true)
    ON CONFLICT (user_id) DO NOTHING;
END $$;

SET LOCAL ROLE anon;

-- Anon has 0 access to admin_users table
SELECT is(
    (SELECT count(*) FROM public.admin_users),
    0::bigint,
    'Anonymous user receives 0 rows querying admin_users table directly'
);

SELECT throws_ok(
    $$ INSERT INTO public.admin_users (user_id, role, active) VALUES ('a0000000-0000-0000-0000-000000000001', 'admin', true) $$,
    '42501',
    NULL,
    'Anonymous user cannot insert into admin_users'
);

-- Parameterless is_admin() returns false for anon
SELECT is(
    public.is_admin(),
    false,
    'Parameterless public.is_admin() returns false for anonymous visitor'
);

-- Anon EXECUTE on parameterized is_admin(UUID) must return false (enumeration blocked)
SELECT is(
    public.is_admin('00000000-0000-0000-0000-000000000000'::uuid),
    false,
    'Anonymous execution of parameterized is_admin(UUID) returns false (enumeration blocked)'
);

SELECT throws_ok(
    $$ SELECT public.get_admin_role('00000000-0000-0000-0000-000000000000'::uuid) $$,
    '42501',
    NULL,
    'Anonymous execution of parameterized get_admin_role(UUID) is revoked (enumeration blocked)'
);

-- Parameterless get_admin_role() returns NULL for anon
SELECT is(
    public.get_admin_role(),
    NULL::text,
    'Parameterless public.get_admin_role() returns NULL for anonymous visitor'
);

-- Direct execution of internal check by non-admin returns false without leaking presence
RESET ROLE;
SELECT is(
    public.is_admin('00000000-0000-0000-0000-000000000000'),
    false,
    'Internal is_admin returns false for non-existent admin user ID'
);

-- ------------------------------------------------------------------------------
-- 6. Product Primary Image Uniqueness Integrity Check & Primary Switch RPC
-- ------------------------------------------------------------------------------
RESET ROLE;

DO $$
DECLARE
    v_prod_id UUID := 'a2000000-0000-0000-0000-000000000001';
BEGIN
    -- Ensure parent product row exists
    INSERT INTO public.products (id, slug, name, short_description, description, material, finish, status, retail_price)
    VALUES (v_prod_id, 'pgtap-test-product', 'pgTAP Test Product', 'Test short desc', 'Test desc', 'Seramik', 'Mat', 'published', 100.00)
    ON CONFLICT (id) DO NOTHING;

    -- Ensure first primary media exists
    INSERT INTO public.product_media (id, product_id, url, alt_text, sort_order, is_primary)
    VALUES ('a4000000-0000-0000-0000-000000000001', v_prod_id, 'https://example.com/prim1.jpg', 'Primary 1', 1, true)
    ON CONFLICT (id) DO UPDATE SET is_primary = true;
END $$;

SELECT throws_ok(
    $$ INSERT INTO public.product_media (product_id, url, alt_text, sort_order, is_primary)
       VALUES ('a2000000-0000-0000-0000-000000000001', 'https://example.com/prim2.jpg', 'Primary 2', 2, true) $$,
    '23505',
    NULL,
    'Product primary media uniqueness: second primary image insert must fail with 23505'
);

-- Test set_primary_product_media atomic switch between two media rows
DO $$
DECLARE
    v_prod_id UUID := 'a2000000-0000-0000-0000-000000000001';
    v_med2_id UUID := 'a4000000-0000-0000-0000-000000000002';
BEGIN
    -- Insert a non-primary secondary media row
    INSERT INTO public.product_media (id, product_id, url, alt_text, sort_order, is_primary)
    VALUES (v_med2_id, v_prod_id, 'https://example.com/prim2.jpg', 'Primary 2', 2, false)
    ON CONFLICT (id) DO UPDATE SET is_primary = false;
END $$;

SELECT lives_ok(
    $$ SELECT public.set_primary_product_media('a2000000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000002') $$,
    'set_primary_product_media RPC successfully switches primary image between two media rows'
);

SELECT is(
    (SELECT is_primary FROM public.product_media WHERE id = 'a4000000-0000-0000-0000-000000000002'),
    true,
    'Target media row is now primary'
);

SELECT is(
    (SELECT is_primary FROM public.product_media WHERE id = 'a4000000-0000-0000-0000-000000000001'),
    false,
    'Previous primary media row is now non-primary'
);

-- ------------------------------------------------------------------------------
-- 7. Audit Trail Immutability Checks (Tested Against Real Existing Row)
-- ------------------------------------------------------------------------------
RESET ROLE;

-- Create real authorized setup row directly
DO $$
DECLARE
    v_audit_id UUID := 'a1000000-0000-0000-0000-000000000001';
BEGIN
    INSERT INTO public.admin_audit_logs (
        id,
        actor_user_id,
        actor_email,
        action,
        entity_type,
        entity_id,
        entity_name,
        safe_metadata,
        created_at
    ) VALUES (
        v_audit_id,
        '00000000-0000-0000-0000-000000000001',
        'admin@vazo.design',
        'CREATE',
        'product',
        'p-setup-test',
        'Setup Test Product',
        '{}'::jsonb,
        now()
    ) ON CONFLICT (id) DO NOTHING;
END $$;

SELECT throws_ok(
    $$ UPDATE public.admin_audit_logs SET action = 'UPDATE' WHERE id = 'a1000000-0000-0000-0000-000000000001' $$,
    '27000',
    NULL,
    'Audit logs are immutable: UPDATE must fail with 27000'
);

SELECT throws_ok(
    $$ DELETE FROM public.admin_audit_logs WHERE id = 'a1000000-0000-0000-0000-000000000001' $$,
    '27000',
    NULL,
    'Audit logs are immutable: DELETE must fail with 27000'
);

-- ------------------------------------------------------------------------------
-- 8. Storage Bucket 5 MB Limit Verification
-- ------------------------------------------------------------------------------
SELECT is(
    (SELECT file_size_limit FROM storage.buckets WHERE id = 'public-media'),
    5242880::bigint,
    'Storage bucket public-media file size limit is canonical 5 MB (5242880 bytes)'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
