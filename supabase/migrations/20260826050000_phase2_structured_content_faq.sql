-- ==============================================================================
-- VAZO E-COMMERCE: PHASE 2.10 — Structured Content Pages and FAQ Management
-- ==============================================================================
-- Creates additive tables for structured editorial content and FAQs:
-- 1. content_pages
-- 2. content_sections
-- 3. faq_groups
-- 4. faq_items
-- Includes performance indexes, RLS policies, and canonical seed records.
-- ==============================================================================

-- 1. CONTENT PAGES TABLE
CREATE TABLE IF NOT EXISTS public.content_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_key TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    seo_title TEXT,
    seo_description TEXT,
    published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. CONTENT SECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.content_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL REFERENCES public.content_pages(id) ON DELETE CASCADE,
    section_key TEXT NOT NULL,
    eyebrow TEXT,
    title TEXT NOT NULL,
    subtitle TEXT,
    content TEXT,
    image_url TEXT,
    image_position TEXT DEFAULT 'left',
    cta_text TEXT,
    cta_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. FAQ GROUPS TABLE
CREATE TABLE IF NOT EXISTS public.faq_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. FAQ ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.faq_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.faq_groups(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_content_pages_key_published 
    ON public.content_pages (page_key, published);

CREATE INDEX IF NOT EXISTS idx_content_sections_page_sort 
    ON public.content_sections (page_id, active, sort_order);

CREATE INDEX IF NOT EXISTS idx_faq_groups_active_sort 
    ON public.faq_groups (active, sort_order);

CREATE INDEX IF NOT EXISTS idx_faq_items_group_active_sort 
    ON public.faq_items (group_id, active, sort_order);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.content_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

-- Content Pages Policies
CREATE POLICY "Public users can view published content pages"
    ON public.content_pages
    FOR SELECT
    USING (published = true);

CREATE POLICY "Admins have full access to content pages"
    ON public.content_pages
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Content Sections Policies
CREATE POLICY "Public users can view active content sections"
    ON public.content_sections
    FOR SELECT
    USING (
        active = true AND 
        EXISTS (
            SELECT 1 FROM public.content_pages cp 
            WHERE cp.id = page_id AND cp.published = true
        )
    );

CREATE POLICY "Admins have full access to content sections"
    ON public.content_sections
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- FAQ Groups Policies
CREATE POLICY "Public users can view active FAQ groups"
    ON public.faq_groups
    FOR SELECT
    USING (active = true);

CREATE POLICY "Admins have full access to FAQ groups"
    ON public.faq_groups
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- FAQ Items Policies
CREATE POLICY "Public users can view active FAQ items"
    ON public.faq_items
    FOR SELECT
    USING (
        active = true AND 
        EXISTS (
            SELECT 1 FROM public.faq_groups fg 
            WHERE fg.id = group_id AND fg.active = true
        )
    );

CREATE POLICY "Admins have full access to FAQ items"
    ON public.faq_items
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ==============================================================================
-- SEED DATA
-- ==============================================================================

-- 1. SEED CONTENT PAGES
INSERT INTO public.content_pages (id, page_key, title, seo_title, seo_description, published)
VALUES
    (
        'cp000000-0000-0000-0000-000000000001',
        'about',
        'Hakkımızda & Zanaat Hikayemiz',
        'Hakkımızda & Zanaat Hikayemiz | Vazo Studio',
        'Vazo Studio; İskandinav sadeliği ile geleneksel el yapımı seramik zanaatını buluşturan heykelsi vazo stüdyosudur.',
        true
    ),
    (
        'cp000000-0000-0000-0000-000000000002',
        'wholesale_landing',
        'Kurumsal & Toptan Çözümleri',
        'Kurumsal & Toptan Satış | Vazo Studio',
        'İç mimarlar, HoReCa ve seçkin mağazalar için özel toptan seramik vazo üretimi ve mimari danışmanlık.',
        true
    ),
    (
        'cp000000-0000-0000-0000-000000000003',
        'wholesale_how_it_works',
        'Toptan Sipariş & Üretim Süreci',
        'Toptan Nasıl Çalışır? | Vazo Studio',
        'Toptan sipariş adımları, numune süreci, özel sır geliştirme ve lojistik teslimat aşamaları.',
        true
    ),
    (
        'cp000000-0000-0000-0000-000000000004',
        'shipping_returns',
        'Teslimat & İade Koşulları',
        'Teslimat & İade Koşulları | Vazo Studio',
        'Vazo Studio sigortalı kargo teslimatı, darbe sönümleyici ambalaj ve 14 gün koşulsuz iade süreci.',
        true
    ),
    (
        'cp000000-0000-0000-0000-000000000005',
        'privacy_kvkk',
        'Gizlilik Politikası & KVKK Aydınlatma Metni',
        'Gizlilik Politikası & KVKK | Vazo Studio',
        '6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca aydınlatma ve veri gizliliği bildirimi.',
        true
    ),
    (
        'cp000000-0000-0000-0000-000000000006',
        'terms',
        'Mesafeli Satış & Kullanım Koşulları',
        'Kullanım Koşulları | Vazo Studio',
        'Vazo Studio web sitesi kullanım şartları, fikri mülkiyet ve mesafeli satış sözleşmesi detayları.',
        true
    )
ON CONFLICT (page_key) DO UPDATE SET
    title = EXCLUDED.title,
    seo_title = EXCLUDED.seo_title,
    seo_description = EXCLUDED.seo_description,
    published = EXCLUDED.published;

-- 2. SEED CONTENT SECTIONS (About Page Sections)
INSERT INTO public.content_sections (id, page_id, section_key, eyebrow, title, subtitle, content, image_url, image_position, cta_text, cta_url, sort_order, active)
VALUES
    (
        'cs000000-0000-0000-0000-000000000001',
        'cp000000-0000-0000-0000-000000000001',
        'hero_header',
        'Felsefemiz & Atölyemiz',
        'Sessizliğin, Toprağın ve Heykelsi Formların Dengesi.',
        'Seri üretimin tekdüzeliğine karşı bir duruş.',
        'Vazo Studio, seri üretimin tekdüzeliğine karşı bir duruş olarak doğdu. Doğal mineralli killerin el tornasında usta ellerle şekillendiği, her bir parçanın kendine has yüzey dokusu ve fırın izleri taşıdığı zamansız objeler üretiyoruz.',
        NULL,
        'left',
        NULL,
        NULL,
        1,
        true
    ),
    (
        'cs000000-0000-0000-0000-000000000002',
        'cp000000-0000-0000-0000-000000000001',
        'story_craft',
        '01 / Geleneksel Zanaat',
        'El Tornasında Şekillenen Karakter',
        NULL,
        'Koleksiyonlarımızdaki her form, kalıplarla dökülmek yerine el tornasında tek tek döndürülerek yükselir. Bu sayede her parça, usta ellerin parmak izlerini ve kilin doğal akışını üzerinde taşır. Kullandığımız mineral zengini stoneware kili, 1250°C yüksek sıcaklıkta fırınlanarak taş kıvamında monolitik bir sertliğe ve %100 su geçirimsizliğe ulaşır.',
        'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=85',
        'left',
        NULL,
        NULL,
        2,
        true
    ),
    (
        'cs000000-0000-0000-0000-000000000003',
        'cp000000-0000-0000-0000-000000000001',
        'story_material',
        '02 / Malzeme ve Doku',
        'Ham Mineraller & Dingin Mat Yüzeyler',
        NULL,
        'Parlak ve yapay sentetik cilalardan bilinçli olarak kaçınıyoruz. Tebeşir beyazı, ham terakota, volkanik bazalt kili ve kum beji tonlarındaki özel mat mineral sırlarımız mekanlara sakinleştirici bir dokunsallık kazandırır.',
        'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1200&q=85',
        'right',
        'Koleksiyonu Keşfet',
        '/products',
        3,
        true
    )
ON CONFLICT (id) DO NOTHING;

-- 3. SEED FAQ GROUPS
INSERT INTO public.faq_groups (id, title, sort_order, active)
VALUES
    ('fg000000-0000-0000-0000-000000000001', 'Sipariş & Teslimat', 1, true),
    ('fg000000-0000-0000-0000-000000000002', 'Ürün Bakımı & Özellikler', 2, true),
    ('fg000000-0000-0000-0000-000000000003', 'Toptan & Kurumsal Satış', 3, true)
ON CONFLICT (id) DO NOTHING;

-- 4. SEED FAQ ITEMS
INSERT INTO public.faq_items (id, group_id, question, answer, sort_order, active)
VALUES
    (
        'fi000000-0000-0000-0000-000000000001',
        'fg000000-0000-0000-0000-000000000001',
        'Siparişler ne kadar sürede kargoya teslim edilir?',
        'Stokta bulunan ürünlerimiz özenle paketlenerek anlaşmalı kargo firmaları aracılığıyla en kısa sürede sevkiyata hazırlanır.',
        1,
        true
    ),
    (
        'fi000000-0000-0000-0000-000000000002',
        'fg000000-0000-0000-0000-000000000001',
        'Seramik ürünler kargoda hasar görürse ne yapmalıyım?',
        'Tüm gönderilerimiz kırılmaya karşı koruyucu ambalajlarla sevk edilir. Kargo teslimi anında hasar fark edilmesi durumunda kargo görevlisine tutanak tutturulması veya hasarlı ambalajın fotoğraflanarak bize iletilmesi halinde anında yenisi gönderilir.',
        2,
        true
    ),
    (
        'fi000000-0000-0000-0000-000000000003',
        'fg000000-0000-0000-0000-000000000001',
        'Kargo ücreti ne kadar?',
        'Belirlenen sepet tutarının üzerindeki perakende siparişlerde kargo ücretsizdir. Güncel kargo tutarı ve eşikleri sepet ve ödeme adımında görüntülenir.',
        3,
        true
    ),
    (
        'fi000000-0000-0000-0000-000000000004',
        'fg000000-0000-0000-0000-000000000002',
        'Vazoların içine canlı çiçek ve su konulabilir mi?',
        'Evet. Tüm vazolarımız 1250°C fırınlanmış stoneware kilinden üretilir ve iç kısımları su geçirimsiz sırla kaplıdır. Canlı çiçeklerle su doldurarak güvenle kullanabilirsiniz.',
        1,
        true
    ),
    (
        'fi000000-0000-0000-0000-000000000005',
        'fg000000-0000-0000-0000-000000000002',
        'Seramik vazolar nasıl temizlenmelidir?',
        'Ilık su ve yumuşak mikrofiber bez yardımıyla temizlenmesi önerilir. Mat mineral sır dokusunu korumak amacıyla aşındırıcı kimyasallar ve sert süngerler kullanılmamalıdır.',
        2,
        true
    ),
    (
        'fi000000-0000-0000-0000-000000000006',
        'fg000000-0000-0000-0000-000000000003',
        'Toptan alımlarda minimum sipariş adedi (MOQ) nedir?',
        'Model başına Minimum Sipariş Adedimiz (MOQ) 6 adettir. Belirli adetlerin üzerindeki siparişlerde kademeli toptan iskonto oranları uygulanır.',
        1,
        true
    ),
    (
        'fi000000-0000-0000-0000-000000000007',
        'fg000000-0000-0000-0000-000000000003',
        'Mimari projeler için özel renk veya sır geliştiriyor musunuz?',
        'Evet. Belirli adetlerin üzerindeki otel, restoran ve konut projelerinde mimari ekibinizin renk kartelasına uygun özel mineral sırlar geliştirilebilmektedir.',
        2,
        true
    )
ON CONFLICT (id) DO NOTHING;
