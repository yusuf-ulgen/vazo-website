-- ==============================================================================
-- PHASE 2.7: SECURE SUPABASE STORAGE AND PRODUCT MEDIA MANAGEMENT
-- ==============================================================================

-- 1. Create Public Media Storage Bucket
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'public-media',
    'public-media',
    true,
    10485760, -- 10 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

-- 2. Storage Row Level Security (RLS) Policies on storage.objects
-- ------------------------------------------------------------------------------

-- 2.1 Public Read Access for Intentionally Public Media
DROP POLICY IF EXISTS "Public can view public-media objects" ON storage.objects;
CREATE POLICY "Public can view public-media objects" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'public-media');

-- 2.2 Admin-Only Upload (INSERT)
DROP POLICY IF EXISTS "Admins can upload to public-media" ON storage.objects;
CREATE POLICY "Admins can upload to public-media" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'public-media'
        AND public.is_admin()
    );

-- 2.3 Admin-Only Update (UPDATE)
DROP POLICY IF EXISTS "Admins can update public-media objects" ON storage.objects;
CREATE POLICY "Admins can update public-media objects" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'public-media'
        AND public.is_admin()
    )
    WITH CHECK (
        bucket_id = 'public-media'
        AND public.is_admin()
    );

-- 2.4 Admin-Only Delete (DELETE)
DROP POLICY IF EXISTS "Admins can delete public-media objects" ON storage.objects;
CREATE POLICY "Admins can delete public-media objects" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'public-media'
        AND public.is_admin()
    );

-- 3. Additive Columns on public.product_media
-- ------------------------------------------------------------------------------
ALTER TABLE public.product_media
    ADD COLUMN IF NOT EXISTS storage_bucket TEXT NOT NULL DEFAULT 'public-media',
    ADD COLUMN IF NOT EXISTS storage_path TEXT,
    ADD COLUMN IF NOT EXISTS mime_type TEXT,
    ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT;

-- 4. Performance & Integrity Indexes
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_product_media_storage_path ON public.product_media(storage_path);
CREATE INDEX IF NOT EXISTS idx_product_media_primary ON public.product_media(product_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_product_media_sort ON public.product_media(product_id, sort_order);
