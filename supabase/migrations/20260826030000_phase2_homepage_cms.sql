-- ==============================================================================
-- PHASE 2.8: HOMEPAGE CMS AND LIVE STOREFRONT WIRING
-- ==============================================================================

-- 1. Additive Slot Column to hero_slides
-- ------------------------------------------------------------------------------
ALTER TABLE public.hero_slides
    ADD COLUMN IF NOT EXISTS slot TEXT NOT NULL DEFAULT 'retail' CHECK (slot IN ('retail', 'wholesale', 'general'));

-- Index for fast slot filtering
CREATE INDEX IF NOT EXISTS idx_hero_slides_slot_active ON public.hero_slides(slot, active, sort_order);

-- 2. Seed Default Hero Slides (if table is empty)
-- ------------------------------------------------------------------------------
INSERT INTO public.hero_slides (
    id,
    eyebrow,
    title,
    subtitle,
    description,
    image_url,
    primary_cta_text,
    primary_cta_url,
    secondary_cta_text,
    secondary_cta_url,
    slot,
    active,
    sort_order
)
VALUES
(
    'a1000000-0000-0000-0000-000000000001',
    'BİREYSEL ALIŞVERİŞ',
    'Perakende',
    NULL,
    'Evinize estetik dokunuşlar katacak vazo koleksiyonlarımızı keşfedin.',
    'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=1200&q=85',
    'Alışverişe Başla',
    '/products',
    NULL,
    NULL,
    'retail',
    true,
    1
),
(
    'a1000000-0000-0000-0000-000000000002',
    'PROFESYONEL ALIŞVERİŞ',
    'Toptan',
    NULL,
    'Projeleriniz için özel fiyatlar, geniş ürün seçeneği ve profesyonel destek alın.',
    'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=1200&q=85',
    'Toptan Alışverişe Geç',
    '/wholesale',
    NULL,
    NULL,
    'wholesale',
    true,
    2
)
ON CONFLICT (id) DO UPDATE SET
    slot = EXCLUDED.slot;

-- 3. Seed Default Wholesale Benefits (if table is empty)
-- ------------------------------------------------------------------------------
INSERT INTO public.wholesale_benefits (id, title, description, icon_name, sort_order, active)
VALUES
('b0000000-0000-0000-0000-000000000001', 'Özel Toptan Fiyatlar', 'Hacminize özel avantajlı fiyatlandırma.', 'Tag', 1, true),
('b0000000-0000-0000-0000-000000000002', 'Geniş Ürün Yelpazesi', 'Farklı koleksiyon ve boyut seçenekleri.', 'Boxes', 2, true),
('b0000000-0000-0000-0000-000000000003', 'Kaliteli & Dayanıklı Ürünler', 'Uzun ömürlü, estetik ve premium üretim.', 'Award', 3, true),
('b0000000-0000-0000-0000-000000000004', 'Hızlı & Güvenli Teslimat', 'Zamanında teslimat ve özenli paketleme.', 'Truck', 4, true),
('b0000000-0000-0000-0000-000000000005', 'Profesyonel Destek', 'Sipariş öncesi ve sonrası uzman desteği.', 'Headphones', 5, true)
ON CONFLICT (id) DO NOTHING;
