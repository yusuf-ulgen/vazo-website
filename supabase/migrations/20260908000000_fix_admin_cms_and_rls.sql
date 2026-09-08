-- ==============================================================================
-- VAZO E-COMMERCE PLATFORM - ADMIN CMS & CATALOG RLS PERMISSIONS FIX
-- Migration: 20260908000000_fix_admin_cms_and_rls.sql
-- ==============================================================================
-- Bu betik, Supabase SQL Editor üzerinden çalıştırılarak admin panelindeki
-- "new row violates row-level security policy" ve
-- "Cannot coerce the result to a single JSON object" (0 row update)
-- RLS kilitlerini çözer ve admin kullanıcısını yetkilendirir.
-- ==============================================================================

-- 1. admin@vazostudio.com Kullanıcısını public.admin_users Tablosuna Bağla
INSERT INTO public.admin_users (user_id, role, active)
SELECT id, 'super_admin', true
FROM auth.users
WHERE email = 'admin@vazostudio.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin', active = true;

-- 2. İçerik ve Vitrin (CMS) Tabloları Üzerindeki RLS Kilidini Kaldır
-- (Hero Vitrinleri, Ticari Avantajlar ve Kategoriler için kesintisiz güncelleme)
ALTER TABLE public.hero_slides DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wholesale_benefits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;

-- 3. Ürün Kataloğu ve Koleksiyon Tabloları Üzerindeki RLS Kilidini Kaldır
-- (Admin panelinden ürün, varyant ve koleksiyon ekleme/düzenlemenin engellenmemesi için)
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_media DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_collections DISABLE ROW LEVEL SECURITY;

-- 4. Gezinme (Menü) ve İçerik Sayfaları Tabloları
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'menu_groups') THEN
        ALTER TABLE public.menu_groups DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'menu_items') THEN
        ALTER TABLE public.menu_items DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'content_pages') THEN
        ALTER TABLE public.content_pages DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'faqs') THEN
        ALTER TABLE public.faqs DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;
