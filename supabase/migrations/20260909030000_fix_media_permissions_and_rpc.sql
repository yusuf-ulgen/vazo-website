-- ==============================================================================
-- Migration: 20260909030000_fix_media_permissions_and_rpc.sql
-- Description: Unrestrict set_primary_product_media RPC and ensure open permissions
--              for public-media uploads and product_media mutations.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.set_primary_product_media(
    p_product_id UUID,
    p_media_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Atomically toggle all others for this product to false and target to true
    UPDATE public.product_media
    SET is_primary = false
    WHERE product_id = p_product_id AND is_primary = true;

    UPDATE public.product_media
    SET is_primary = true
    WHERE id = p_media_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_primary_product_media(UUID, UUID) TO anon, authenticated, service_role;

-- Ensure table RLS is disabled and all permissions granted
ALTER TABLE public.product_media DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.product_media TO anon, authenticated, service_role;
