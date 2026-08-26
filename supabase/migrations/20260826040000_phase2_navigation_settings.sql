-- ==============================================================================
-- Migration: 20260826040000_phase2_navigation_settings.sql
-- Description: Phase 2.9 Navigation & Site Settings Schema Indexes & Seeds
-- ==============================================================================

-- 1. Performance Indexes for Menu Groups & Menu Items
CREATE INDEX IF NOT EXISTS idx_menu_groups_type_active_sort
    ON public.menu_groups(menu_type, active, sort_order);

CREATE INDEX IF NOT EXISTS idx_menu_items_group_active_sort
    ON public.menu_items(group_id, active, sort_order);

-- 2. Seed Default Site Settings (Public / Non-Secret)
INSERT INTO public.site_settings (key, value)
VALUES
    ('general', '{
        "brand_name": "Vazo Studio",
        "tagline": "Heykelsi Formlar & Çağdaş Seramik Tasarımlar",
        "description": "İskandinav estetiği ve zanaatkar dokunuşlarla şekillenen premium vazo koleksiyonları. Perakende ve toptan satış."
    }'::jsonb),
    ('contact', '{
        "email": "info@vazostudio.com",
        "wholesale_email": "toptan@vazostudio.com",
        "phone": "+90 (212) 555 0192",
        "address": "Karaköy Tasarım Bölgesi, Kemankeş Cad. No: 42, Beyoğlu / İstanbul",
        "business_hours": "Pazartesi – Cumartesi: 10:00 – 19:00 (Pazar Kapalı)"
    }'::jsonb),
    ('commerce', '{
        "free_shipping_threshold": 5000,
        "shipping_estimate_text": "Ödeme adımında hesaplanır",
        "shipping_summary": "Güvenli Alışveriş ve Sigortalı Sevkiyat",
        "returns_policy_text": "Teslimattan itibaren 14 gün içinde iade imkanı."
    }'::jsonb),
    ('social', '{
        "instagram": "https://instagram.com",
        "facebook": "https://facebook.com",
        "pinterest": "https://pinterest.com"
    }'::jsonb)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = now();

-- 3. Seed Default Navigation Groups & Items

-- 3.1 Primary Menu
DO $$
DECLARE
    v_primary_id UUID;
BEGIN
    INSERT INTO public.menu_groups (id, menu_type, title, sort_order, active)
    VALUES ('a0000000-0000-0000-0000-000000000001', 'primary', 'Ana Menü', 1, true)
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO v_primary_id;

    IF v_primary_id IS NULL THEN
        v_primary_id := 'a0000000-0000-0000-0000-000000000001';
    END IF;

    INSERT INTO public.menu_items (group_id, label, href, sort_order, active)
    VALUES
        (v_primary_id, 'Yeni', '/new', 1, true),
        (v_primary_id, 'Perakende', '/products', 2, true),
        (v_primary_id, 'Toptan', '/wholesale', 3, true),
        (v_primary_id, 'Koleksiyonlar', '/collections', 4, true),
        (v_primary_id, 'Hakkımızda', '/about', 5, true),
        (v_primary_id, 'İletişim', '/contact', 6, true)
    ON CONFLICT DO NOTHING;
END $$;

-- 3.2 Retail Mega Menu
DO $$
DECLARE
    v_group_kat UUID := 'b0000000-0000-0000-0000-000000000001';
    v_group_mat UUID := 'b0000000-0000-0000-0000-000000000002';
    v_group_kol UUID := 'b0000000-0000-0000-0000-000000000003';
BEGIN
    INSERT INTO public.menu_groups (id, menu_type, title, promo_title, promo_subtitle, promo_image_url, promo_cta_text, promo_cta_url, sort_order, active)
    VALUES (
        v_group_kat,
        'retail_mega',
        'Kategoriler',
        'Yeni Sezon: Nordik Sessizlik',
        'Heykelsi silüetler ve mineral mat sırlı yüzeylerin dingin uyumu.',
        'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80',
        'Koleksiyonu İncele',
        '/collections/nordic-silence',
        1,
        true
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.menu_items (group_id, label, href, is_new, is_popular, sort_order, active)
    VALUES
        (v_group_kat, 'Tüm Koleksiyon', '/products', false, false, 1, true),
        (v_group_kat, 'Yeni Gelenler', '/products?filter=new', true, false, 2, true),
        (v_group_kat, 'Çok Satanlar', '/products?filter=bestseller', false, true, 3, true),
        (v_group_kat, 'Masa Üstü Vazolar', '/products?category=tabletop', false, false, 4, true),
        (v_group_kat, 'Zemin & Anıt Vazolar', '/products?category=floor', false, false, 5, true),
        (v_group_kat, 'Heykelsi Objeler', '/products?category=sculptural', false, false, 6, true),
        (v_group_kat, 'Vazo & Kase Setleri', '/products?category=sets', false, false, 7, true)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.menu_groups (id, menu_type, title, sort_order, active)
    VALUES (v_group_mat, 'retail_mega', 'Materyal & Doku', 2, true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.menu_items (group_id, label, href, is_new, is_popular, sort_order, active)
    VALUES
        (v_group_mat, 'Mat Stoneware Seramik', '/products?material=stoneware', false, false, 1, true),
        (v_group_mat, 'Ham Toprak & Terakota', '/products?material=terracotta', false, false, 2, true),
        (v_group_mat, 'Sırlı Porselen Formlar', '/products?material=porcelain', false, false, 3, true),
        (v_group_mat, 'Kum Doku & Dokulu Yüzeyler', '/products?finish=textured', false, false, 4, true),
        (v_group_mat, 'Doğal Bazalt Efekti', '/products?finish=basalt', false, false, 5, true)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.menu_groups (id, menu_type, title, sort_order, active)
    VALUES (v_group_kol, 'retail_mega', 'Koleksiyonlar', 3, true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.menu_items (group_id, label, href, is_new, is_popular, sort_order, active)
    VALUES
        (v_group_kol, 'Nordik Sessizlik Serisi', '/collections/nordic-silence', false, false, 1, true),
        (v_group_kol, 'Amforik Kıvrımlar 2026', '/collections/amphoric-curves', false, false, 2, true),
        (v_group_kol, 'Monokrom Brütalizm', '/collections/monochrome', false, false, 3, true),
        (v_group_kol, 'Doğal Toprak Tonları', '/collections/earth-tones', false, false, 4, true)
    ON CONFLICT DO NOTHING;
END $$;

-- 3.3 Wholesale Mega Menu
DO $$
DECLARE
    v_group_top UUID := 'c0000000-0000-0000-0000-000000000001';
    v_group_sek UUID := 'c0000000-0000-0000-0000-000000000002';
    v_group_sur UUID := 'c0000000-0000-0000-0000-000000000003';
BEGIN
    INSERT INTO public.menu_groups (id, menu_type, title, promo_title, promo_subtitle, promo_image_url, promo_cta_text, promo_cta_url, sort_order, active)
    VALUES (
        v_group_top,
        'wholesale_mega',
        'Toptan Çözümleri',
        'Mimari Projeler & Toptan Alım',
        '10+ adet alımlarda anında hacim indirimi ve projeye özel danışmanlık.',
        'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=600&q=80',
        'Kurumsal Başvuru Yap',
        '/wholesale/apply',
        1,
        true
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.menu_items (group_id, label, href, sort_order, active)
    VALUES
        (v_group_top, 'Toptan Satış Programı', '/wholesale', 1, true),
        (v_group_top, 'Kademeli Fiyatlandırma & İndirimler', '/wholesale/pricing', 2, true),
        (v_group_top, 'Minimum Sipariş (MOQ) Koşulları', '/wholesale/moq', 3, true),
        (v_group_top, 'Numune Seti Siparişi', '/wholesale/samples', 4, true),
        (v_group_top, 'Katalog & Fiyat Listesi İndir (PDF)', '/wholesale/catalog', 5, true)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.menu_groups (id, menu_type, title, sort_order, active)
    VALUES (v_group_sek, 'wholesale_mega', 'Sektörel Projeler', 2, true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.menu_items (group_id, label, href, sort_order, active)
    VALUES
        (v_group_sek, 'İç Mimarlar & Tasarım Ofisleri', '/wholesale/architects', 1, true),
        (v_group_sek, 'Otel, Restoran & Kafe (HORECA)', '/wholesale/hospitality', 2, true),
        (v_group_sek, 'Butik Konsept Mağazalar', '/wholesale/retailers', 3, true),
        (v_group_sek, 'Kurumsal VIP Hediye Projeleri', '/wholesale/corporate', 4, true),
        (v_group_sek, 'Özel Ölçü & Sır Üretimi', '/wholesale/custom', 5, true)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.menu_groups (id, menu_type, title, sort_order, active)
    VALUES (v_group_sur, 'wholesale_mega', 'Süreç & Başvuru', 3, true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.menu_items (group_id, label, href, sort_order, active)
    VALUES
        (v_group_sur, 'Bayilik & Trade Başvuru Formu', '/wholesale/apply', 1, true),
        (v_group_sur, 'Üretim & Teslimat Takvimi', '/wholesale/lead-times', 2, true),
        (v_group_sur, 'Paletli & Güvenli Lojistik', '/wholesale/shipping', 3, true),
        (v_group_sur, 'Toptan Müşteri Temsilcisi', '/wholesale/contact', 4, true)
    ON CONFLICT DO NOTHING;
END $$;

-- 3.4 Footer Menu
DO $$
DECLARE
    v_group_f_shop UUID := 'd0000000-0000-0000-0000-000000000001';
    v_group_f_whol UUID := 'd0000000-0000-0000-0000-000000000002';
    v_group_f_supp UUID := 'd0000000-0000-0000-0000-000000000003';
BEGIN
    INSERT INTO public.menu_groups (id, menu_type, title, sort_order, active)
    VALUES (v_group_f_shop, 'footer', 'Alışveriş', 1, true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.menu_items (group_id, label, href, sort_order, active)
    VALUES
        (v_group_f_shop, 'Tüm Modeller', '/products', 1, true),
        (v_group_f_shop, 'Yeni Gelenler', '/new', 2, true),
        (v_group_f_shop, 'Çok Satanlar', '/bestsellers', 3, true),
        (v_group_f_shop, 'Koleksiyonlar', '/collections', 4, true)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.menu_groups (id, menu_type, title, sort_order, active)
    VALUES (v_group_f_whol, 'footer', 'Toptan', 2, true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.menu_items (group_id, label, href, sort_order, active)
    VALUES
        (v_group_f_whol, 'Toptan Satışımız', '/wholesale', 1, true),
        (v_group_f_whol, 'Toptan Kataloğu', '/wholesale/products', 2, true),
        (v_group_f_whol, 'Nasıl Çalışır?', '/wholesale/how-it-works', 3, true),
        (v_group_f_whol, 'Ticari Hesap Başvurusu', '/wholesale/apply', 4, true)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.menu_groups (id, menu_type, title, sort_order, active)
    VALUES (v_group_f_supp, 'footer', 'Müşteri Deneyimi', 3, true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.menu_items (group_id, label, href, sort_order, active)
    VALUES
        (v_group_f_supp, 'Hakkımızda & Zanaat', '/about', 1, true),
        (v_group_f_supp, 'İletişim & Showroom', '/contact', 2, true),
        (v_group_f_supp, 'Sıkça Sorulan Sorular', '/faq', 3, true),
        (v_group_f_supp, 'Kargo & İade Koşulları', '#policy-shipping', 4, true)
    ON CONFLICT DO NOTHING;
END $$;
