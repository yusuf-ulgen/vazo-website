-- ==============================================================================
-- VAZO DATABASE SECURITY & RLS AUTOMATED TEST SUITE (pgTAP / Supabase Test Runner)
-- File: supabase/tests/database_security.sql
-- ==============================================================================

BEGIN;
SELECT plan(49);

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
SELECT row_level_security_is_active('public', 'products', 'RLS should be active on products');
SELECT row_level_security_is_active('public', 'product_variants', 'RLS should be active on product_variants');
SELECT row_level_security_is_active('public', 'product_media', 'RLS should be active on product_media');
SELECT row_level_security_is_active('public', 'wholesale_price_tiers', 'RLS should be active on wholesale_price_tiers');
SELECT row_level_security_is_active('public', 'site_settings', 'RLS should be active on site_settings');
SELECT row_level_security_is_active('public', 'trade_applications', 'RLS should be active on trade_applications');
SELECT row_level_security_is_active('public', 'contact_messages', 'RLS should be active on contact_messages');
SELECT row_level_security_is_active('public', 'newsletter_subscriptions', 'RLS should be active on newsletter_subscriptions');
SELECT row_level_security_is_active('public', 'admin_users', 'RLS should be active on admin_users');
SELECT row_level_security_is_active('public', 'admin_audit_logs', 'RLS should be active on admin_audit_logs');

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

-- 3.9 Anon CANNOT read contact messages
SELECT is(
    (SELECT count(*) FROM public.contact_messages),
    0::bigint,
    'Anonymous user cannot read contact messages'
);

-- 3.10 Direct Public Browser Mutation Denial: Newsletter Subscriptions
SELECT throws_ok(
    $$ INSERT INTO public.newsletter_subscriptions (normalized_email, status, source)
       VALUES ('direct-anon-subscriber@test.com', 'active', 'browser') $$,
    '42501',
    NULL,
    'Direct anonymous INSERT into newsletter_subscriptions must fail (Edge Function required)'
);

-- 3.11 Anon CANNOT read newsletter subscribers
SELECT is(
    (SELECT count(*) FROM public.newsletter_subscriptions),
    0::bigint,
    'Anonymous user cannot read newsletter subscribers (privacy protection)'
);

-- 3.12 Anon CANNOT view or insert into admin_users (Role escalation protection)
SELECT is(
    (SELECT count(*) FROM public.admin_users),
    0::bigint,
    'Anonymous user receives 0 rows when attempting to select admin_users'
);

SELECT throws_ok(
    $$ INSERT INTO public.admin_users (user_id, role, active) VALUES ('a0000000-0000-0000-0000-000000000001', 'admin', true) $$,
    '42501',
    NULL,
    'Direct anonymous INSERT into admin_users must fail (Role escalation denied)'
);

-- 3.13 Anon CANNOT read or insert into admin_audit_logs
SELECT is(
    (SELECT count(*) FROM public.admin_audit_logs),
    0::bigint,
    'Anonymous user receives 0 rows from admin_audit_logs'
);

SELECT throws_ok(
    $$ INSERT INTO public.admin_audit_logs (action, entity_type, entity_id) VALUES ('CREATE', 'product', '1') $$,
    '42501',
    NULL,
    'Direct anonymous INSERT into admin_audit_logs must fail'
);

-- 3.14 Anon CANNOT call log_admin_audit_event RPC
SELECT throws_ok(
    $$ SELECT public.log_admin_audit_event('CREATE', 'product', 'test-id', 'Test Product') $$,
    '42501',
    NULL,
    'Direct anonymous execution of log_admin_audit_event must fail'
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

-- ------------------------------------------------------------------------------
-- 5. Authenticated Non-Admin vs Active Admin RBAC Isolation Checks
-- ------------------------------------------------------------------------------
RESET ROLE;

-- 5.1 Helper function public.is_admin returns boolean
SELECT ok(
    public.is_admin('00000000-0000-0000-0000-000000000000') = false,
    'public.is_admin returns false for unknown user'
);

-- 5.2 Authenticated non-admin cannot insert or self-escalate into admin_users
SET LOCAL ROLE authenticated;

SELECT throws_ok(
    $$ INSERT INTO public.admin_users (user_id, role, active) VALUES ('b0000000-0000-0000-0000-000000000002', 'admin', true) $$,
    '42501',
    NULL,
    'Authenticated non-admin user cannot insert into admin_users'
);

SELECT throws_ok(
    $$ INSERT INTO public.products (slug, name, material, finish, retail_price) VALUES ('customer-hack', 'Customer Hack', 'Clay', 'Matte', 2000) $$,
    '42501',
    NULL,
    'Authenticated non-admin user cannot insert products'
);

SELECT is(
    (SELECT count(*) FROM public.admin_users),
    0::bigint,
    'Authenticated non-admin receives 0 rows from admin_users'
);

SELECT throws_ok(
    $$ SELECT public.log_admin_audit_event('CREATE', 'product', 'forged-id', 'Forged') $$,
    '42501',
    NULL,
    'Forged log_admin_audit_event by authenticated non-admin is denied'
);

-- ------------------------------------------------------------------------------
-- 6. Product Primary Image Uniqueness Integrity Check
-- ------------------------------------------------------------------------------
RESET ROLE;

DO $$
DECLARE
    v_prod_id UUID := 'p0000000-0000-0000-0000-000000000001';
BEGIN
    -- Ensure first primary media exists
    INSERT INTO public.product_media (id, product_id, url, alt_text, sort_order, is_primary)
    VALUES ('m0000000-0000-0000-0000-000000000001', v_prod_id, 'https://example.com/prim1.jpg', 'Primary 1', 1, true)
    ON CONFLICT (id) DO UPDATE SET is_primary = true;
END $$;

SELECT throws_ok(
    $$ INSERT INTO public.product_media (product_id, url, alt_text, sort_order, is_primary)
       VALUES ('p0000000-0000-0000-0000-000000000001', 'https://example.com/prim2.jpg', 'Primary 2', 2, true) $$,
    '23505',
    NULL,
    'Product primary media uniqueness: second primary image insert must fail with 23505'
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
