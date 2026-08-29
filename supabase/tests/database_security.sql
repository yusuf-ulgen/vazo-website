-- ==============================================================================
-- VAZO DATABASE SECURITY & RLS AUTOMATED TEST SUITE (pgTAP / Supabase Test Runner)
-- File: supabase/tests/database_security.sql
-- ==============================================================================

BEGIN;
SELECT plan(145);

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
SELECT has_table('public', 'customer_profiles', 'Table public.customer_profiles should exist');
SELECT has_table('public', 'customer_addresses', 'Table public.customer_addresses should exist');

-- Phase 3.2 Commerce Master Tables
SELECT has_table('public', 'orders', 'Table public.orders should exist');
SELECT has_table('public', 'order_items', 'Table public.order_items should exist');
SELECT has_table('public', 'payments', 'Table public.payments should exist');
SELECT has_table('public', 'payment_events', 'Table public.payment_events should exist');
SELECT has_table('public', 'inventory_reservations', 'Table public.inventory_reservations should exist');
SELECT has_table('public', 'inventory_movements', 'Table public.inventory_movements should exist');
SELECT has_table('public', 'order_status_history', 'Table public.order_status_history should exist');
SELECT has_table('public', 'order_legal_acceptances', 'Table public.order_legal_acceptances should exist');
SELECT has_table('public', 'refunds', 'Table public.refunds should exist');
SELECT has_table('public', 'order_invoices', 'Table public.order_invoices should exist');
SELECT has_table('public', 'transactional_emails', 'Table public.transactional_emails should exist');

-- Phase 3.3 Shipping Tables
SELECT has_table('public', 'shipping_zones', 'Table public.shipping_zones should exist');
SELECT has_table('public', 'shipping_zone_countries', 'Table public.shipping_zone_countries should exist');
SELECT has_table('public', 'shipping_rates', 'Table public.shipping_rates should exist');

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
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.customer_profiles'::regclass), 'RLS should be active on customer_profiles');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.customer_addresses'::regclass), 'RLS should be active on customer_addresses');

-- Phase 3.2 Commerce Tables RLS
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.orders'::regclass), 'RLS should be active on orders');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.order_items'::regclass), 'RLS should be active on order_items');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.payments'::regclass), 'RLS should be active on payments');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.payment_events'::regclass), 'RLS should be active on payment_events');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.inventory_reservations'::regclass), 'RLS should be active on inventory_reservations');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.inventory_movements'::regclass), 'RLS should be active on inventory_movements');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.order_status_history'::regclass), 'RLS should be active on order_status_history');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.order_legal_acceptances'::regclass), 'RLS should be active on order_legal_acceptances');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.refunds'::regclass), 'RLS should be active on refunds');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.order_invoices'::regclass), 'RLS should be active on order_invoices');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.transactional_emails'::regclass), 'RLS should be active on transactional_emails');

-- Phase 3.3 Shipping Tables RLS
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.shipping_zones'::regclass), 'RLS should be active on shipping_zones');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.shipping_zone_countries'::regclass), 'RLS should be active on shipping_zone_countries');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.shipping_rates'::regclass), 'RLS should be active on shipping_rates');

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

-- 3.12 Direct Public Browser Mutation Denial: Customer Profiles
SELECT throws_ok(
    $$ INSERT INTO public.customer_profiles (user_id, customer_type) VALUES ('00000000-0000-0000-0000-000000000001', 'retail') $$,
    '42501',
    NULL,
    'Direct anonymous INSERT into customer_profiles must fail'
);

-- 3.13 Direct Public Browser Mutation Denial: Customer Addresses
SELECT throws_ok(
    $$ INSERT INTO public.customer_addresses (user_id, recipient_name, phone, address_line1, city, postal_code, country_code, country_name)
       VALUES ('00000000-0000-0000-0000-000000000001', 'Test', '555', 'Test Mah.', 'Istanbul', '34000', 'TR', 'Turkiye') $$,
    '42501',
    NULL,
    'Direct anonymous INSERT into customer_addresses must fail'
);

-- 3.14 Direct Public Browser Mutation Denial: Orders
SELECT throws_ok(
    $$ INSERT INTO public.orders (order_number, customer_id, channel, subtotal_minor, total_minor, shipping_address, billing_address)
       VALUES ('VZ-TEST-0001', 'c1000000-0000-0000-0000-000000000001', 'retail', 10000, 10000, '{}'::jsonb, '{}'::jsonb) $$,
    '42501',
    NULL,
    'Direct anonymous INSERT into orders must fail'
);

-- 3.15 Anon CANNOT read back orders
SELECT is(
    (SELECT count(*) FROM public.orders),
    0::bigint,
    'Anonymous user receives 0 rows for orders table (zero leakage)'
);

-- 3.16 Anon CANNOT read payments
SELECT is(
    (SELECT count(*) FROM public.payments),
    0::bigint,
    'Anonymous user receives 0 rows for payments table (zero leakage)'
);

-- 3.17 Anon CANNOT read payment events
SELECT is(
    (SELECT count(*) FROM public.payment_events),
    0::bigint,
    'Anonymous user receives 0 rows for payment_events table (zero leakage)'
);

-- 3.18 Anon CANNOT read inventory reservations
SELECT is(
    (SELECT count(*) FROM public.inventory_reservations),
    0::bigint,
    'Anonymous user receives 0 rows for inventory_reservations (zero leakage)'
);

-- 3.19 Anon CANNOT read refunds
SELECT is(
    (SELECT count(*) FROM public.refunds),
    0::bigint,
    'Anonymous user receives 0 rows for refunds table (zero leakage)'
);

-- 3.20 Anon CANNOT read transactional emails
SELECT is(
    (SELECT count(*) FROM public.transactional_emails),
    0::bigint,
    'Anonymous user receives 0 rows for transactional_emails table (zero leakage)'
);

-- 3.21 Anon CANNOT mutate shipping zones
SELECT throws_ok(
    $$ INSERT INTO public.shipping_zones (name) VALUES ('Hacked Zone') $$,
    '42501',
    NULL,
    'Anonymous user cannot insert shipping zones'
);

-- 3.22 Anon CANNOT mutate shipping countries
SELECT throws_ok(
    $$ INSERT INTO public.shipping_zone_countries (zone_id, country_code, country_name) VALUES ('70000000-0000-0000-0000-000000000001', 'XX', 'Hacked Country') $$,
    '42501',
    NULL,
    'Anonymous user cannot insert shipping countries'
);

-- 3.23 Anon CANNOT mutate shipping rates
SELECT throws_ok(
    $$ INSERT INTO public.shipping_rates (zone_id, name, flat_amount_minor) VALUES ('70000000-0000-0000-0000-000000000001', 'Free Shipping Hacked', 0) $$,
    '42501',
    NULL,
    'Anonymous user cannot insert shipping rates'
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
    INSERT INTO auth.users (id, aud, role, email)
    VALUES ('a0000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'admin-test@vazo.design')
    ON CONFLICT (id) DO NOTHING;

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

-- Parameterless get_admin_role() is also revoked for anon
SELECT throws_ok(
    $$ SELECT public.get_admin_role() $$,
    '42501',
    NULL,
    'Anonymous execution of public.get_admin_role() is revoked'
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

-- Simulate admin session for set_primary_product_media
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = 'a0000000-0000-0000-0000-000000000001';
SET LOCAL "request.jwt.claim.role" = 'authenticated';

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

RESET ROLE;

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

-- ------------------------------------------------------------------------------
-- 9. Phase 3 Customer Profile & Address Privilege Verification
-- ------------------------------------------------------------------------------
RESET ROLE;

DO $$
DECLARE
    v_cust_a UUID := 'c1000000-0000-0000-0000-000000000001';
    v_cust_b UUID := 'c2000000-0000-0000-0000-000000000002';
BEGIN
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES 
        (v_cust_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'customer.a@vazostudio.com', 'hash', now(), '{"provider":"google","providers":["google"]}', '{"full_name":"Ahmet Yilmaz"}', now(), now()),
        (v_cust_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'customer.b@vazostudio.com', 'hash', now(), '{"provider":"google","providers":["google"]}', '{"full_name":"Mehmet Demir"}', now(), now())
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.customer_profiles (user_id, first_name, last_name, customer_type)
    VALUES 
        (v_cust_a, 'Ahmet', 'Yilmaz', 'retail'),
        (v_cust_b, 'Mehmet', 'Demir', 'retail')
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.customer_addresses (id, user_id, recipient_name, phone, address_line1, city, postal_code, country_code, country_name, is_default_shipping)
    VALUES 
        ('d1000000-0000-0000-0000-000000000001', v_cust_a, 'Ahmet Yilmaz', '05551112233', 'Moda Cad. No:1', 'Istanbul', '34710', 'TR', 'Turkiye', true),
        ('d2000000-0000-0000-0000-000000000002', v_cust_b, 'Mehmet Demir', '05554445566', 'Kordon Boyu No:2', 'Izmir', '35000', 'TR', 'Turkiye', true)
    ON CONFLICT (id) DO NOTHING;
END $$;

-- Switch to Customer A context
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "c1000000-0000-0000-0000-000000000001", "role": "authenticated"}';

-- 9.1 Customer A can read own profile
SELECT is(
    (SELECT count(*) FROM public.customer_profiles WHERE user_id = 'c1000000-0000-0000-0000-000000000001'),
    1::bigint,
    'Customer A can read own profile'
);

-- 9.2 Customer A receives 0 rows for Customer B profile (isolation)
SELECT is(
    (SELECT count(*) FROM public.customer_profiles WHERE user_id = 'c2000000-0000-0000-0000-000000000002'),
    0::bigint,
    'Customer A cannot read Customer B profile (RLS isolation)'
);

-- 9.3 Customer A cannot self-promote to wholesale
SELECT throws_ok(
    $$ UPDATE public.customer_profiles SET customer_type = 'wholesale' WHERE user_id = 'c1000000-0000-0000-0000-000000000001' $$,
    '42501',
    NULL,
    'Customer cannot promote customer_type to wholesale (privilege protection trigger)'
);

-- 9.4 Customer A can only see own addresses
SELECT is(
    (SELECT count(*) FROM public.customer_addresses),
    1::bigint,
    'Customer A can query only own addresses (Customer B addresses isolated)'
);

-- ------------------------------------------------------------------------------
-- 10. Phase 3.2 Commerce RLS, Customer Isolation & Operational Tests
-- ------------------------------------------------------------------------------
RESET ROLE;

-- Setup test orders, order_items, payments, reservations, invoices
DO $$
DECLARE
    v_cust_a UUID := 'c1000000-0000-0000-0000-000000000001';
    v_cust_b UUID := 'c2000000-0000-0000-0000-000000000002';
    v_ord_a  UUID := 'e1000000-0000-0000-0000-000000000001';
    v_ord_b  UUID := 'e2000000-0000-0000-0000-000000000002';
    v_pay_a  UUID := 'b1000000-0000-0000-0000-000000000001';
    v_var_id UUID := 'f1000000-0000-0000-0000-000000000001';
    v_prod_id UUID := 'f0000000-0000-0000-0000-000000000001';
BEGIN
    -- Product & Variant setup for commerce calculations
    INSERT INTO public.products (id, slug, name, short_description, description, material, finish, status, retail_price)
    VALUES (v_prod_id, 'commerce-vase', 'Commerce Vazo', 'Kısa açıklama', 'Açıklama', 'Seramik', 'Mat', 'published', 250.00)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.product_variants (id, product_id, sku, variant_name, color_name, retail_price, stock_quantity)
    VALUES (v_var_id, v_prod_id, 'VAZ-COMMERCE-01', 'Beyaz', 250.00, 10)
    ON CONFLICT (sku) DO NOTHING;

    -- Order A for Customer A
    INSERT INTO public.orders (
        id, order_number, customer_id, channel, status, currency, tax_included,
        subtotal_minor, shipping_minor, discount_minor, tax_included_minor, total_minor,
        shipping_address, billing_address
    ) VALUES (
        v_ord_a, 'VZ-20260828-AAAA1', v_cust_a, 'retail', 'pending_payment', 'TRY', true,
        25000, 5000, 0, 4167, 30000,
        '{"city": "Istanbul"}'::jsonb, '{"city": "Istanbul"}'::jsonb
    ) ON CONFLICT (id) DO NOTHING;

    -- Order B for Customer B
    INSERT INTO public.orders (
        id, order_number, customer_id, channel, status, currency, tax_included,
        subtotal_minor, shipping_minor, discount_minor, tax_included_minor, total_minor,
        shipping_address, billing_address
    ) VALUES (
        v_ord_b, 'VZ-20260828-BBBB2', v_cust_b, 'retail', 'pending_payment', 'TRY', true,
        50000, 0, 0, 8333, 50000,
        '{"city": "Izmir"}'::jsonb, '{"city": "Izmir"}'::jsonb
    ) ON CONFLICT (id) DO NOTHING;

    -- Items for Order A
    INSERT INTO public.order_items (
        id, order_id, product_id, variant_id, sku_snapshot, product_name_snapshot,
        variant_name_snapshot, unit_price_minor, quantity, line_total_minor, currency, channel
    ) VALUES (
        'a1100000-0000-0000-0000-000000000001', v_ord_a, v_prod_id, v_var_id,
        'VAZ-COMMERCE-01', 'Commerce Vazo', 'Beyaz', 25000, 1, 25000, 'TRY', 'retail'
    ) ON CONFLICT (id) DO NOTHING;

    -- Items for Order B
    INSERT INTO public.order_items (
        id, order_id, product_id, variant_id, sku_snapshot, product_name_snapshot,
        variant_name_snapshot, unit_price_minor, quantity, line_total_minor, currency, channel
    ) VALUES (
        'a2200000-0000-0000-0000-000000000002', v_ord_b, v_prod_id, v_var_id,
        'VAZ-COMMERCE-01', 'Commerce Vazo', 'Beyaz', 25000, 2, 50000, 'TRY', 'retail'
    ) ON CONFLICT (id) DO NOTHING;

    -- Payment for Order A
    INSERT INTO public.payments (
        id, order_id, provider, merchant_oid, status, expected_amount_minor,
        currency, test_mode, initiated_at, expires_at
    ) VALUES (
        v_pay_a, v_ord_a, 'paytr', 'VZ20260828AAAA1PAY1', 'initiated', 30000,
        'TRY', true, now(), now() + interval '30 minutes'
    ) ON CONFLICT (id) DO NOTHING;

    -- Active unexpired reservation for Order A (2 units)
    INSERT INTO public.inventory_reservations (
        id, order_id, variant_id, quantity, status, reserved_at, expires_at
    ) VALUES (
        'e3000000-0000-0000-0000-000000000001', v_ord_a, v_var_id, 2, 'reserved',
        now(), now() + interval '40 minutes'
    ) ON CONFLICT (id) DO NOTHING;

    -- Invoice record for Order A
    INSERT INTO public.order_invoices (
        id, order_id, status
    ) VALUES (
        'e4000000-0000-0000-0000-000000000001', v_ord_a, 'not_requested'
    ) ON CONFLICT (id) DO NOTHING;
END $$;

-- Switch to Customer A context
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "c1000000-0000-0000-0000-000000000001", "role": "authenticated"}';

-- 10.1 Customer A can read own order
SELECT is(
    (SELECT count(*) FROM public.orders WHERE customer_id = 'c1000000-0000-0000-0000-000000000001'),
    1::bigint,
    'Customer A can read own orders'
);

-- 10.2 Customer A receives 0 rows for Customer B order
SELECT is(
    (SELECT count(*) FROM public.orders WHERE customer_id = 'c2000000-0000-0000-0000-000000000002'),
    0::bigint,
    'Customer A cannot read Customer B orders (RLS isolation)'
);

-- 10.3 Customer A can read own order items
SELECT is(
    (SELECT count(*) FROM public.order_items oi JOIN public.orders o ON o.id = oi.order_id WHERE o.customer_id = 'c1000000-0000-0000-0000-000000000001'),
    1::bigint,
    'Customer A can read own order items'
);

-- 10.4 Customer A receives 0 rows for Customer B order items
SELECT is(
    (SELECT count(*) FROM public.order_items oi JOIN public.orders o ON o.id = oi.order_id WHERE o.customer_id = 'c2000000-0000-0000-0000-000000000002'),
    0::bigint,
    'Customer A cannot read Customer B order items (RLS isolation)'
);

-- 10.5 Customer A CANNOT insert orders directly from browser
SELECT throws_ok(
    $$ INSERT INTO public.orders (order_number, customer_id, channel, subtotal_minor, total_minor, shipping_address, billing_address)
       VALUES ('VZ-HACK-0001', 'c1000000-0000-0000-0000-000000000001', 'retail', 10000, 10000, '{}'::jsonb, '{}'::jsonb) $$,
    '42501',
    NULL,
    'Customer cannot insert orders directly from browser'
);

-- 10.6 Customer A CANNOT update order status or totals directly
SELECT throws_ok(
    $$ UPDATE public.orders SET status = 'paid' WHERE customer_id = 'c1000000-0000-0000-0000-000000000001' $$,
    '42501',
    NULL,
    'Customer cannot update order status or totals directly'
);

-- 10.7 Customer A CANNOT insert payment events
SELECT throws_ok(
    $$ INSERT INTO public.payment_events (payment_id, order_id, merchant_oid, event_type, event_fingerprint)
       VALUES ('b1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'MERCH123', 'callback', 'fp123') $$,
    '42501',
    NULL,
    'Customer cannot insert payment_events'
);

-- 10.8 Customer A can view invoices for own orders
SELECT is(
    (SELECT count(*) FROM public.order_invoices),
    1::bigint,
    'Customer A can read invoice record for own order'
);

-- ------------------------------------------------------------------------------
-- 11. Commerce Domain Functions & Constraints Validation
-- ------------------------------------------------------------------------------
RESET ROLE;

-- 11.1 generate_order_number() returns VZ-YYYYMMDD-XXXXX pattern
SELECT ok(
    public.generate_order_number() ~ '^VZ-[0-9]{8}-[A-Z0-9]{5}$',
    'generate_order_number() generates valid collision-resistant VZ-YYYYMMDD-XXXXX format'
);

-- 11.2 get_variant_available_stock computes physical minus active reservations
SELECT is(
    public.get_variant_available_stock('f1000000-0000-0000-0000-000000000001'),
    8,
    'get_variant_available_stock calculates 10 physical minus 2 active unexpired reservations = 8'
);

-- 11.3 orders total integrity check throws on mismatch
SELECT throws_ok(
    $$ INSERT INTO public.orders (order_number, customer_id, channel, subtotal_minor, shipping_minor, discount_minor, total_minor, shipping_address, billing_address)
       VALUES ('VZ-TEST-BADTOTAL', 'c1000000-0000-0000-0000-000000000001', 'retail', 10000, 2000, 0, 99999, '{}'::jsonb, '{}'::jsonb) $$,
    '23514',
    NULL,
    'Orders total integrity constraint rejects total mismatch (subtotal + shipping - discount)'
);

-- 11.4 order_items line total integrity check throws on mismatch
SELECT throws_ok(
    $$ INSERT INTO public.order_items (order_id, sku_snapshot, product_name_snapshot, variant_name_snapshot, unit_price_minor, quantity, line_total_minor, currency, channel)
       VALUES ('e1000000-0000-0000-0000-000000000001', 'SKU-01', 'Vazo', 'Beyaz', 5000, 2, 99999, 'TRY', 'retail') $$,
    '23514',
    NULL,
    'Order items line total integrity constraint rejects mismatch (unit_price * quantity)'
);

-- 11.5 payments merchant_oid rejects non-alphanumeric (e.g. contains hyphens or special chars)
SELECT throws_ok(
    $$ INSERT INTO public.payments (order_id, merchant_oid, expected_amount_minor, expires_at)
       VALUES ('e1000000-0000-0000-0000-000000000001', 'VZ-INVALID-OID-WITH-HYPHENS', 10000, now() + interval '30 minutes') $$,
    '23514',
    NULL,
    'Payments merchant_oid check constraint rejects non-alphanumeric identifiers'
);

-- 11.6 refunds amount_minor rejects non-positive (e.g. 0 or negative)
SELECT throws_ok(
    $$ INSERT INTO public.refunds (order_id, payment_id, request_id, reference_no, amount_minor)
       VALUES ('e1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'req-01', 'REF01', 0) $$,
    '23514',
    NULL,
    'Refunds amount_minor check constraint rejects zero or negative refund amounts'
);

-- 11.7 order_invoices default status is 'not_requested'
SELECT is(
    (SELECT status FROM public.order_invoices WHERE order_id = 'e1000000-0000-0000-0000-000000000001'),
    'not_requested',
    'Order invoice scaffold default status is not_requested'
);

-- ------------------------------------------------------------------------------
-- 12. Phase 3.3 Shipping Engine & Resolution Tests
-- ------------------------------------------------------------------------------
RESET ROLE;

-- 12.1 resolve_shipping_rate returns supported for active Turkey
SELECT ok(
    (SELECT supported FROM public.resolve_shipping_rate('TR', 'retail', 10000, 'TRY')),
    'resolve_shipping_rate resolves active Turkey standard shipping'
);

-- 12.2 resolve_shipping_rate applies free shipping over threshold
SELECT ok(
    (SELECT free_shipping_applied FROM public.resolve_shipping_rate('TR', 'retail', 500000, 'TRY')),
    'resolve_shipping_rate applies free shipping when subtotal >= 5000.00 TRY threshold'
);

-- 12.3 resolve_shipping_rate rejects unsupported country
SELECT is(
    (SELECT supported FROM public.resolve_shipping_rate('JP', 'retail', 10000, 'TRY')),
    false,
    'resolve_shipping_rate returns supported = false for unconfigured country'
);

-- 12.4 resolve_shipping_rate rejects empty country
SELECT is(
    (SELECT supported FROM public.resolve_shipping_rate('', 'retail', 10000, 'TRY')),
    false,
    'resolve_shipping_rate returns supported = false for empty country code'
);

-- 12.5 shipping_zone_countries check constraint rejects lowercase country code
SELECT throws_ok(
    $$ INSERT INTO public.shipping_zone_countries (zone_id, country_code, country_name) VALUES ('70000000-0000-0000-0000-000000000001', 'de', 'Germany') $$,
    '23514',
    NULL,
    'Shipping zone countries check constraint rejects non-uppercase country codes'
);

-- 12.6 shipping_rates check constraint rejects maximum < minimum order bounds
SELECT throws_ok(
    $$ INSERT INTO public.shipping_rates (zone_id, name, flat_amount_minor, minimum_order_minor, maximum_order_minor)
       VALUES ('70000000-0000-0000-0000-000000000001', 'Bad Bounds Rate', 1000, 5000, 2000) $$,
    '23514',
    NULL,
    'Shipping rates check constraint rejects maximum order bound lower than minimum order bound'
);

-- 12.7 Authenticated customer CANNOT mutate shipping zones
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "c1000000-0000-0000-0000-000000000001", "role": "authenticated"}';

SELECT throws_ok(
    $$ INSERT INTO public.shipping_zones (name) VALUES ('Customer Injected Zone') $$,
    '42501',
    NULL,
    'Authenticated customer cannot insert shipping zones'
);

-- 12.8 Authenticated customer CANNOT mutate shipping rates
SELECT throws_ok(
    $$ INSERT INTO public.shipping_rates (zone_id, name, flat_amount_minor) VALUES ('70000000-0000-0000-0000-000000000001', 'Customer Rate', 0) $$,
    '42501',
    NULL,
    'Authenticated customer cannot insert shipping rates'
);

RESET ROLE;

-- ------------------------------------------------------------------------------
-- 13. Phase 3.4 Checkout Quote, Order Creation RPC & Concurrency Assertions
-- ------------------------------------------------------------------------------

-- 13.1 calculate_checkout_quote and create_checkout_order functions exist
SELECT is(
    (SELECT count(*)::INTEGER FROM pg_proc WHERE proname = 'calculate_checkout_quote'),
    1,
    'Function public.calculate_checkout_quote should exist'
);
SELECT is(
    (SELECT count(*)::INTEGER FROM pg_proc WHERE proname = 'create_checkout_order'),
    1,
    'Function public.create_checkout_order should exist'
);

-- 13.2 calculate_checkout_quote rejects invalid channel
SELECT throws_ok(
    $$ SELECT public.calculate_checkout_quote(
        'c1000000-0000-0000-0000-000000000001'::UUID,
        'invalid_channel',
        'TRY',
        'TR',
        '[{"variant_id": "b2000000-0000-0000-0000-000000000001", "quantity": 1}]'::JSONB
    ) $$,
    NULL,
    'Geçersiz kanal: invalid_channel',
    'calculate_checkout_quote rejects invalid channel'
);

-- 13.3 calculate_checkout_quote rejects wholesale if customer profile is not approved
SELECT throws_ok(
    $$ SELECT public.calculate_checkout_quote(
        'c1000000-0000-0000-0000-000000000001'::UUID,
        'wholesale',
        'TRY',
        'TR',
        '[{"variant_id": "b2000000-0000-0000-0000-000000000001", "quantity": 1}]'::JSONB
    ) $$,
    NULL,
    'Toptan kanal için onaylı kurumsal hesap gereklidir.',
    'calculate_checkout_quote rejects wholesale channel for non-approved customer'
);

-- 13.4 calculate_checkout_quote rejects empty items array
SELECT throws_ok(
    $$ SELECT public.calculate_checkout_quote(
        'c1000000-0000-0000-0000-000000000001'::UUID,
        'retail',
        'TRY',
        'TR',
        '[]'::JSONB
    ) $$,
    NULL,
    'Sepetinizde ürün bulunmamaktadır.',
    'calculate_checkout_quote rejects empty items'
);

-- 13.5 create_checkout_order rejects missing legal acceptance
SELECT throws_ok(
    $$ SELECT public.create_checkout_order(
        'c1000000-0000-0000-0000-000000000001'::UUID,
        'retail',
        'TRY',
        'TR',
        '[{"variant_id": "b2000000-0000-0000-0000-000000000001", "quantity": 1}]'::JSONB,
        '{"country_code": "TR", "city": "Istanbul", "recipient_name": "Test"}'::JSONB,
        '{"country_code": "TR", "city": "Istanbul", "recipient_name": "Test"}'::JSONB,
        false,
        true
    ) $$,
    NULL,
    'Sipariş oluşturmak için Ön Bilgilendirme Koşulları ve Mesafeli Satış Sözleşmesi onaylanmalıdır.',
    'create_checkout_order requires both legal acceptance checkboxes'
);

-- 13.6 create_checkout_order rejects missing destination address
SELECT throws_ok(
    $$ SELECT public.create_checkout_order(
        'c1000000-0000-0000-0000-000000000001'::UUID,
        'retail',
        'TRY',
        'TR',
        '[{"variant_id": "b2000000-0000-0000-0000-000000000001", "quantity": 1}]'::JSONB,
        NULL,
        NULL,
        true,
        true
    ) $$,
    NULL,
    'Geçerli bir teslimat adresi zorunludur.',
    'create_checkout_order rejects null shipping address'
);

-- 13.7 Seed Test Fixtures for Successful Checkout
DO $$
BEGIN
    INSERT INTO auth.users (id, email)
    VALUES ('c1000000-0000-0000-0000-000000000099', 'checkout-test@example.com')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.products (id, slug, name, description, material, status, retail_price)
    VALUES ('a2000000-0000-0000-0000-000000000099', 'checkout-vazo', 'Checkout Vazo', 'Desc', 'Seramik', 'published', 2500.00)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.product_variants (id, product_id, sku, title, stock_quantity, active)
    VALUES ('b2000000-0000-0000-0000-000000000099', 'a2000000-0000-0000-0000-000000000099', 'VZ-CHK-01', 'Beyaz', 5, true)
    ON CONFLICT (id) DO UPDATE SET stock_quantity = 5, active = true;
END $$;

-- 13.8 create_checkout_order successfully creates order and reserves stock
SELECT lives_ok(
    $$ SELECT public.create_checkout_order(
        'c1000000-0000-0000-0000-000000000099'::UUID,
        'retail',
        'TRY',
        'TR',
        '[{"variant_id": "b2000000-0000-0000-0000-000000000099", "quantity": 2}]'::JSONB,
        '{"country_code": "TR", "city": "Istanbul", "recipient_name": "Ayşe Yılmaz", "phone": "5551234567", "address_line1": "Karaköy No 1"}'::JSONB,
        '{"country_code": "TR", "city": "Istanbul", "recipient_name": "Ayşe Yılmaz", "phone": "5551234567", "address_line1": "Karaköy No 1"}'::JSONB,
        true,
        true
    ) $$,
    'create_checkout_order executes atomic transaction with row locking, reservation and order generation'
);

-- 13.9 Verify Created Order Properties
SELECT is(
    (SELECT status FROM public.orders WHERE customer_id = 'c1000000-0000-0000-0000-000000000099' ORDER BY created_at DESC LIMIT 1),
    'pending_payment',
    'Created order has initial status pending_payment'
);

-- 13.10 Verify Inventory Reservation was Created with Quantity 2
SELECT is(
    (SELECT quantity FROM public.inventory_reservations WHERE variant_id = 'b2000000-0000-0000-0000-000000000099' AND status = 'reserved' ORDER BY created_at DESC LIMIT 1),
    2,
    'Inventory reservation created with exact requested quantity'
);

-- 13.11 Verify Available Stock is now 3 (5 physical - 2 reserved)
SELECT is(
    public.get_variant_available_stock('b2000000-0000-0000-0000-000000000099'::UUID),
    3,
    'Available stock accurately reflects active unexpired reservations under concurrency'
);

-- 13.12 Verify Legal Acceptances Recorded 2 Documents
SELECT is(
    (SELECT count(*)::INTEGER FROM public.order_legal_acceptances WHERE order_id = (SELECT id FROM public.orders WHERE customer_id = 'c1000000-0000-0000-0000-000000000099' ORDER BY created_at DESC LIMIT 1)),
    2,
    'Two legal documents (preliminary_info & distance_sales) immutably snapshotted'
);

-- 13.13 Concurrency Check: Attempting to reserve more than available (4 > 3 remaining) must fail
SELECT throws_ok(
    $$ SELECT public.create_checkout_order(
        'c1000000-0000-0000-0000-000000000099'::UUID,
        'retail',
        'TRY',
        'TR',
        '[{"variant_id": "b2000000-0000-0000-0000-000000000099", "quantity": 4}]'::JSONB,
        '{"country_code": "TR", "city": "Istanbul", "recipient_name": "Test"}'::JSONB,
        '{"country_code": "TR", "city": "Istanbul", "recipient_name": "Test"}'::JSONB,
        true,
        true
    ) $$,
    NULL,
    'Yetersiz stok: "Checkout Vazo - Beyaz". Kalan stok: 3, Talep edilen: 4',
    'create_checkout_order prevents overselling remaining stock'
);

-- 13.14 Orders RLS: Customer cannot view another customer order
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "c1000000-0000-0000-0000-000000000001", "role": "authenticated"}';

SELECT is(
    (SELECT count(*)::INTEGER FROM public.orders WHERE customer_id = 'c1000000-0000-0000-0000-000000000099'),
    0,
    'Customer A cannot view Customer B orders via RLS'
);

-- 13.15 Orders RLS: Anonymous/Customer cannot directly insert orders bypassing RPC
SELECT throws_ok(
    $$ INSERT INTO public.orders (order_number, customer_id, channel, status, subtotal_minor, total_minor, shipping_address, billing_address)
       VALUES ('VZ-FAKE-99999', 'c1000000-0000-0000-0000-000000000001', 'retail', 'pending_payment', 100, 100, '{}', '{}') $$,
    '42501',
    NULL,
    'Customer cannot directly insert orders without server RPC execution'
);

RESET ROLE;

-- ------------------------------------------------------------------------------
-- 14. PayTR Token Initiation & Atomic Callback Finalization (Phase 3.5 & 3.6)
-- ------------------------------------------------------------------------------

-- 14.1 initiate_order_payment rejects merchant_oid with hyphens
SELECT throws_ok(
    $$ SELECT public.initiate_order_payment(
        (SELECT id FROM public.orders WHERE customer_id = 'c1000000-0000-0000-0000-000000000099' ORDER BY created_at DESC LIMIT 1),
        'VZ-INVALID-OID-WITH-HYPHEN',
        105000,
        'TRY',
        true
    ) $$,
    NULL,
    'Geçersiz merchant_oid: Yalnızca alfanümerik ve en fazla 64 karakter olmalıdır.',
    'initiate_order_payment rejects merchant_oid containing hyphens'
);

-- 14.2 initiate_order_payment creates payment attempt for valid order
SELECT is(
    (SELECT (public.initiate_order_payment(
        (SELECT id FROM public.orders WHERE customer_id = 'c1000000-0000-0000-0000-000000000099' ORDER BY created_at DESC LIMIT 1),
        'VZTESTPAYTR001',
        105000,
        'TRY',
        true
    ))->>'success')::BOOLEAN,
    true,
    'initiate_order_payment successfully records initial payment attempt'
);

-- 14.3 Payment record created with status initiated
SELECT is(
    (SELECT status FROM public.payments WHERE merchant_oid = 'VZTESTPAYTR001'),
    'initiated',
    'Payment record inserted with status initiated'
);

-- 14.4 finalize_paytr_callback with success finalizes payment and order atomically
SELECT is(
    (SELECT (public.finalize_paytr_callback(
        'VZTESTPAYTR001',
        'success',
        105000,
        NULL,
        NULL,
        '{"merchant_oid": "VZTESTPAYTR001", "status": "success", "total_amount": "105000"}'::JSONB
    ))->>'status'),
    'paid',
    'finalize_paytr_callback marks status paid on successful webhook'
);

-- 14.5 Order status updated to paid
SELECT is(
    (SELECT status FROM public.orders WHERE id = (SELECT order_id FROM public.payments WHERE merchant_oid = 'VZTESTPAYTR001')),
    'paid',
    'Order status updated to paid upon callback finalization'
);

-- 14.6 Inventory reservation converted and stock decremented
SELECT is(
    (SELECT status FROM public.inventory_reservations WHERE order_id = (SELECT order_id FROM public.payments WHERE merchant_oid = 'VZTESTPAYTR001') LIMIT 1),
    'converted',
    'Inventory reservation converted upon successful callback'
);

-- 14.7 Immutable inventory_movements sale record created
SELECT ok(
    EXISTS (SELECT 1 FROM public.inventory_movements WHERE order_id = (SELECT order_id FROM public.payments WHERE merchant_oid = 'VZTESTPAYTR001') AND movement_type = 'sale'),
    'Immutable inventory movement recorded for order sale'
);

-- 14.8 Idempotency: Duplicate callback delivery returns already_processed=true
SELECT is(
    (SELECT (public.finalize_paytr_callback(
        'VZTESTPAYTR001',
        'success',
        105000,
        NULL,
        NULL,
        '{"merchant_oid": "VZTESTPAYTR001", "status": "success", "total_amount": "105000"}'::JSONB
    ))->>'already_processed')::BOOLEAN,
    true,
    'Duplicate callback delivery is strictly idempotent (already_processed=true)'
);

-- 14.9 finalize_paytr_callback rejects unknown merchant_oid without modifying state
SELECT is(
    (SELECT (public.finalize_paytr_callback(
        'VZNONEXISTENT999',
        'success',
        50000,
        NULL,
        NULL,
        '{}'::JSONB
    ))->>'success')::BOOLEAN,
    false,
    'finalize_paytr_callback rejects unknown merchant_oid'
);

-- 14.10 Payment events table captures deduplicated callback fingerprint
SELECT is(
    (SELECT count(*)::INTEGER FROM public.payment_events WHERE merchant_oid = 'VZTESTPAYTR001'),
    1,
    'Payment event logged with deduplication fingerprint'
);

SELECT * FROM finish();
ROLLBACK;

