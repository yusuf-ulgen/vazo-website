-- ==============================================================================
-- Migration: 20260910173000_fix_admin_rbac_for_service_role.sql
-- Description: Fix is_admin and get_admin_role to correctly recognize service_role
--              allowing Edge Functions using supabaseAdmin to execute protected RPCs.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    -- System / Edge Functions calling via service_role natively bypass RBAC
    IF auth.role() = 'service_role' THEN
        RETURN TRUE;
    END IF;

    -- If checking oneself or if caller is an authorized admin
    IF check_user_id IS NULL OR check_user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND active = true
    ) THEN
        RETURN EXISTS (
            SELECT 1
            FROM public.admin_users
            WHERE user_id = COALESCE(check_user_id, auth.uid())
              AND active = true
        );
    END IF;

    RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_role(check_user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    IF auth.role() = 'service_role' THEN
        RETURN 'super_admin';
    END IF;

    IF check_user_id IS NULL OR check_user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND active = true
    ) THEN
        RETURN (
            SELECT role
            FROM public.admin_users
            WHERE user_id = COALESCE(check_user_id, auth.uid())
              AND active = true
            LIMIT 1
        );
    END IF;

    RETURN NULL;
END;
$$;
