-- ==============================================================================
-- VAZO E-COMMERCE PLATFORM - DEMO SEED DATA
-- File: supabase/seed/seed.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Site Settings
-- ------------------------------------------------------------------------------
INSERT INTO public.site_settings (key, value) VALUES
(
    'general',
    '{
        "brand_name": "Vazo Studio",
        "tagline": "Heykelsi Formlar & Çağdaş Seramik Tasarımlar",
        "description": "İskandinav estetiği ve zanaatkar dokunuşlarla şekillenen premium vazo koleksiyonları.",
        "contact_email": "info@vazostudio.com",
        "wholesale_email": "b2b@vazostudio.com",
        "phone": "+90 (212) 555 0192",
        "address": "Karaköy Tasarım Bölgesi, Kemankeş Cad. No: 42, Beyoğlu / İstanbul",
        "instagram_url": "https://instagram.com",
        "pinterest_url": "https://pinterest.com"
    }'::jsonb
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ------------------------------------------------------------------------------
-- 2. Announcement Bar
-- ------------------------------------------------------------------------------
INSERT INTO public.announcement_bars (id, message, link_text, link_url, active, sort_order)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Perakende ve toptan satışlarımız mevcuttur. Kurumsal ve mimari projeleriniz için özel üretim avantajları.',
    'Toptan Satış & Başvuru',
    '/wholesale',
    true,
    1
);

-- ------------------------------------------------------------------------------
-- 3. Hero Slides
-- ------------------------------------------------------------------------------
INSERT INTO public.hero_slides (id, eyebrow, title, subtitle, description, image_url, primary_cta_text, primary_cta_url, secondary_cta_text, secondary_cta_url, active, sort_order)
VALUES (
    'a1000000-0000-0000-0000-000000000001',
    '2026 Koleksiyonu • Heykelsi Seramikler',
    'Sessizliğin ve Ham Dokunun Mimari Formu',
    'Modern formlar. Zamansız dokunuşlar.',
    'İskandinav yalınlığı ile el işçiliği seramik zanaatını buluşturan koleksiyonumuz; yaşam alanları ve mimari projeler için heykelsi bir dinginlik sunar.',
    'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=1200&q=85',
    'Alışverişe Başla',
    '/products',
    'Toptan Satış',
    '/wholesale',
    true,
    1
);

-- ------------------------------------------------------------------------------
-- 4. Categories
-- ------------------------------------------------------------------------------
INSERT INTO public.categories (id, slug, name, description, image_url, sort_order, active)
VALUES
('c0000000-0000-0000-0000-000000000001', 'masa-ustu-vazolar', 'Masa Üstü Vazolar', 'Konsol, sehpa ve yemek masaları için tasarlanmış zarif formlar.', 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80', 1, true),
('c0000000-0000-0000-0000-000000000002', 'zemin-anit-vazolar', 'Zemin & Anıt Vazolar', 'Geniş mekanlar, lobiler ve köşeler için heykelsi monolitik formlar.', 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=800&q=80', 2, true),
('c0000000-0000-0000-0000-000000000003', 'heykelsi-objeler', 'Heykelsi Objeler', 'Işık ve gölge oyunları yaratan sanatsal soyut heykeller ve ark formlar.', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', 3, true),
('c0000000-0000-0000-0000-000000000004', 'vazo-kase-setleri', 'Vazo & Kase Setleri', 'Birbirini tamamlayan oran ve yüzey dokusuna sahip ikili ve üçlü seramik setler.', 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=800&q=80', 4, true),
('c0000000-0000-0000-0000-000000000005', 'ham-terakota-serisi', 'Ham Terakota & Toprak', 'Doğal killi gövde ve mineral katkılı ham dokulu yüzeyler.', 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?auto=format&fit=crop&w=800&q=80', 5, true);

-- ------------------------------------------------------------------------------
-- 5. Collections
-- ------------------------------------------------------------------------------
INSERT INTO public.collections (id, slug, name, subtitle, description, hero_image_url, featured, sort_order, active)
VALUES
('b0000000-0000-0000-0000-000000000001', 'nordik-sessizlik', 'Nordik Sessizlik Serisi', 'Yumuşak kavisler ve mineral mat sırlı yüzeyler', 'Kuzey doğasının sakinliğinden ve ham taş dokularından ilham alan zamansız koleksiyon.', 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=80', true, 1, true),
('b0000000-0000-0000-0000-000000000002', 'amforik-kivrimlar', 'Amforik Kıvrımlar 2026', 'Antik hatların çağdaş brütalizm ile buluşması', 'Akdeniz amfora geleneğini minimalist heykelsi çizgilerle buluşturan özel seri.', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80', true, 2, true),
('b0000000-0000-0000-0000-000000000003', 'monokrom-brutalizm', 'Monokrom Brütalizm', 'Antrasit, kömür ve bazalt taşın monolitik gücü', 'Keskin hatlar, monolitik oranlar ve koyu mineral dokular.', 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=1200&q=80', false, 3, true);

-- ------------------------------------------------------------------------------
-- 6. Products & Variants & Media
-- ------------------------------------------------------------------------------
-- 6.1 Amforik Taş Vazo No: 01
INSERT INTO public.products (id, slug, name, short_description, description, status, material, finish, origin_country, retail_price, compare_at_price, wholesale_enabled, wholesale_moq, featured, new_arrival, bestseller, tags)
VALUES (
    'a2000000-0000-0000-0000-000000000001',
    'amforik-tas-vazo-tebehir',
    'Amforik Taş Vazo',
    'Doğal mineralli kilden elde edilmiş heykelsi masa üstü vazo.',
    'Yumuşak kavisleri ve dokulu tebeşir beyazı yüzeyiyle İskandinav heykelsi sanatının dinginliğini mekanınıza taşır. El tornasında şekillendirilmiş, 1250°C fırınlanmış dayanıklı stoneware seramik.',
    'published',
    'Stoneware Seramik',
    'Mat Tebeşir Dokulu',
    'Türkiye',
    2450.00,
    2800.00,
    true,
    5,
    true,
    true,
    false,
    ARRAY['Yeni', 'Heykelsi', 'Masa Üstü', 'Mat']
);

INSERT INTO public.product_variants (id, product_id, sku, variant_name, color_name, color_hex, finish, size_label, height_cm, diameter_cm, weight_kg, retail_price, stock_quantity)
VALUES (
    'a3000000-0000-0000-0000-000000000001',
    'a2000000-0000-0000-0000-000000000001',
    'VAZ-AMF-WHT-M',
    'Medium / Tebeşir Beyazı',
    'Tebeşir Beyazı',
    '#FAF9F6',
    'Mat',
    'M (28 cm)',
    28.00,
    16.00,
    1.80,
    2450.00,
    24
);

INSERT INTO public.product_media (id, product_id, variant_id, url, alt_text, sort_order, is_primary)
VALUES
('a4000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80', 'Amforik Taş Vazo Tebeşir Beyazı Ana Görsel', 1, true),
('a4000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80', 'Amforik Taş Vazo Detay Açısı', 2, false);

INSERT INTO public.product_categories (product_id, category_id) VALUES
('a2000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001');

INSERT INTO public.product_collections (product_id, collection_id) VALUES
('a2000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001');

INSERT INTO public.wholesale_price_tiers (product_id, min_quantity, max_quantity, unit_price, discount_percentage) VALUES
('a2000000-0000-0000-0000-000000000001', 5, 19, 1650.00, 32.00),
('a2000000-0000-0000-0000-000000000001', 20, 49, 1400.00, 42.00),
('a2000000-0000-0000-0000-000000000001', 50, NULL, 1200.00, 51.00);

-- 6.2 Brütalist Silindirik Zemin Vazosu
INSERT INTO public.products (id, slug, name, short_description, description, status, material, finish, origin_country, retail_price, compare_at_price, wholesale_enabled, wholesale_moq, featured, new_arrival, bestseller, tags)
VALUES (
    'a2000000-0000-0000-0000-000000000002',
    'brutalist-silindirik-zemin-vazosu',
    'Brütalist Silindirik Zemin Vazosu',
    'Geniş mekanlar için tasarlanmış anıtsal monolitik seramik form.',
    'Ham volkanik kum katkılı terakota gövdesi ve brütalist silüetiyle lobiler, oturma salonları ve mimari alanlar için odak noktası oluşturur.',
    'published',
    'Doğal Bazalt Kili',
    'Ham Kum Dokulu',
    'Türkiye',
    4800.00,
    NULL,
    true,
    3,
    true,
    false,
    true,
    ARRAY['Bestseller', 'Zemin', 'Büyük Boy', 'Monolitik']
);

INSERT INTO public.product_variants (id, product_id, sku, variant_name, color_name, color_hex, finish, size_label, height_cm, diameter_cm, weight_kg, retail_price, stock_quantity)
VALUES (
    'a3000000-0000-0000-0000-000000000002',
    'a2000000-0000-0000-0000-000000000002',
    'VAZ-BRT-CHR-L',
    'Large / Antrasit Kömür',
    'Antrasit Taş',
    '#2D2923',
    'Kum Dokulu',
    'L (52 cm)',
    52.00,
    24.00,
    5.40,
    4800.00,
    14
);

INSERT INTO public.product_media (id, product_id, variant_id, url, alt_text, sort_order, is_primary)
VALUES
('a4000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000002', 'a3000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=800&q=80', 'Brütalist Zemin Vazosu Koyu Taş', 1, true);

INSERT INTO public.product_categories (product_id, category_id) VALUES
('a2000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002');

INSERT INTO public.product_collections (product_id, collection_id) VALUES
('a2000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003');

INSERT INTO public.wholesale_price_tiers (product_id, min_quantity, max_quantity, unit_price, discount_percentage) VALUES
('a2000000-0000-0000-0000-000000000002', 3, 9, 3200.00, 33.00),
('a2000000-0000-0000-0000-000000000002', 10, NULL, 2750.00, 42.00);

-- ------------------------------------------------------------------------------
-- 7. Editorial Storytelling Sections
-- ------------------------------------------------------------------------------
INSERT INTO public.editorial_sections (id, eyebrow, title, description, image_url, image_position, cta_text, cta_url, active, sort_order)
VALUES
(
    'e0000000-0000-0000-0000-000000000001',
    'Zanaat & Felsefe',
    'Toprağın Doğallığı, Mimari Heykelsilik.',
    'Her bir parça, mineral zengini stoneware kilinin geleneksel el tornasında şekillendirilmesi ve 1250°C fırınlama ile monolitik dayanıklılığa kavuşmasıyla üretilir. Seri üretimin tekdüzeliğinden uzak, her vazoda hafif ton ve doku farklılıkları barındıran özgün bir karaktere sahiptir.',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80',
    'left',
    'Stüdyo Hikayemiz',
    '/about',
    true,
    1
),
(
    'e0000000-0000-0000-0000-000000000002',
    'Materyal ve Doku',
    'Ham Mineraller, Dingin Renk Paleti.',
    'Toprağın ham minerallerini yüzeyde hissettiren mat dokular, İskandinav nötr renk skalasıyla birleşiyor. Parlak yapay cilalar yerine tebeşir, kum, bazalt ve ham terakota yüzeyler tercih ediyoruz.',
    'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=900&q=80',
    'right',
    'Koleksiyonu İncele',
    '/collections/nordic-silence',
    true,
    2
);

-- ------------------------------------------------------------------------------
-- 8. Wholesale Benefits
-- ------------------------------------------------------------------------------
INSERT INTO public.wholesale_benefits (id, title, description, icon_name, sort_order, active)
VALUES
('a5000000-0000-0000-0000-000000000001', 'İç Mimarlar & Projelere Özel', 'Otel, restoran, lobi ve konut projeleri için özel hacim iskontoları ve numune desteği.', 'Building2', 1, true),
('a5000000-0000-0000-0000-000000000002', 'Düşük Minimum Sipariş (MOQ)', 'Model başına 3-6 adet arası düşük MOQ ile butik mağazalar için esnek stok yönetimi.', 'PackageCheck', 2, true),
('a5000000-0000-0000-0000-000000000003', 'Özel Sır & Renk Üretimi', 'Büyük ölçekli mimari projeler için RAL/Pantone uyumlu özel mineral sır geliştirme.', 'Palette', 3, true),
('a5000000-0000-0000-0000-000000000004', 'Güvenli Sandıklı Lojistik', 'Kırılmaya karşı sigortalı, paletli ve özel köpük ambalajlı yurt içi & yurt dışı sevkiyat.', 'Truck', 4, true);
