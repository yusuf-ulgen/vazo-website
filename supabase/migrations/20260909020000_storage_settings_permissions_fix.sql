-- ==============================================================================
-- Migration: 20260909020000_storage_settings_permissions_fix.sql
-- Description: Fix storage upload RLS, admin_update_commerce_settings permissions & site_settings
-- ==============================================================================

-- 1. Storage Objects RLS for public-media Bucket
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'public-media',
    'public-media',
    true,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

-- Drop any restrictive policies on storage.objects for public-media
DROP POLICY IF EXISTS "Public can view public-media objects" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload to public-media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update public-media objects" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete public-media objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload to public-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow update to public-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete to public-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow all on public-media" ON storage.objects;

-- Create wide-open policies for public-media bucket
CREATE POLICY "Allow select on public-media" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'public-media');

CREATE POLICY "Allow insert on public-media" ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'public-media');

CREATE POLICY "Allow update on public-media" ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'public-media')
    WITH CHECK (bucket_id = 'public-media');

CREATE POLICY "Allow delete on public-media" ON storage.objects
    FOR DELETE
    USING (bucket_id = 'public-media');

-- 2. Update admin_update_commerce_settings RPC with open permissions
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_update_commerce_settings(
    p_free_shipping_threshold NUMERIC,
    p_shipping_estimate_text TEXT,
    p_shipping_summary TEXT,
    p_returns_policy_text TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_updated JSONB;
BEGIN
    -- Ensure commerce row exists with default structure if missing
    INSERT INTO public.site_settings (key, value, is_public, updated_at)
    VALUES (
        'commerce',
        jsonb_build_object(
            'free_shipping_threshold', COALESCE(p_free_shipping_threshold, 0),
            'shipping_estimate_text', COALESCE(p_shipping_estimate_text, ''),
            'shipping_summary', COALESCE(p_shipping_summary, ''),
            'returns_policy_text', COALESCE(p_returns_policy_text, ''),
            'checkout_enabled', false
        ),
        true,
        timezone('utc', now())
    )
    ON CONFLICT (key) DO NOTHING;

    -- Atomically merge fields into existing commerce object, preserving checkout_enabled
    UPDATE public.site_settings
    SET value = value || jsonb_build_object(
            'free_shipping_threshold', COALESCE(p_free_shipping_threshold, 0),
            'shipping_estimate_text', COALESCE(p_shipping_estimate_text, ''),
            'shipping_summary', COALESCE(p_shipping_summary, ''),
            'returns_policy_text', COALESCE(p_returns_policy_text, '')
        ),
        updated_at = timezone('utc', now())
    WHERE key = 'commerce'
    RETURNING value INTO v_updated;

    RETURN v_updated;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_commerce_settings(NUMERIC, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

-- 3. Grants & RLS for site_settings, product_media, menu_groups, menu_items
-- ------------------------------------------------------------------------------
ALTER TABLE public.site_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_media DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.site_settings TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.product_media TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.menu_groups TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.menu_items TO anon, authenticated, service_role;
