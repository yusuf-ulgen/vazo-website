-- ==============================================================================
-- VAZO E-COMMERCE PLATFORM - PHASE 2.12 IMMUTABLE ADMIN AUDIT TRAIL
-- Migration: 20260826070000_phase2_admin_audit.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Create Admin Audit Logs Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID,
    actor_email TEXT,
    action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'BULK_UPDATE')),
    entity_type TEXT NOT NULL CHECK (entity_type IN (
        'product', 'variant', 'inventory', 'price', 'wholesale_tier',
        'category', 'collection', 'cms_page', 'cms_section',
        'faq_group', 'faq_item', 'menu_group', 'menu_item',
        'site_settings', 'trade_application', 'contact_message',
        'newsletter_subscription'
    )),
    entity_id TEXT NOT NULL,
    entity_name TEXT,
    safe_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 2. Indexes for Fast Admin Querying & Timeline Filtering
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_entity_type ON public.admin_audit_logs(entity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_actor ON public.admin_audit_logs(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON public.admin_audit_logs(action, created_at DESC);

-- Submissions indexes for fast dashboard metric queries
CREATE INDEX IF NOT EXISTS idx_trade_applications_status_submitted ON public.trade_applications(status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status_created ON public.contact_messages(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_status_created ON public.newsletter_subscriptions(status, created_at DESC);

-- ------------------------------------------------------------------------------
-- 3. Row Level Security (RLS) Policies on Audit Log
-- ------------------------------------------------------------------------------
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 3.1 Admins can SELECT audit logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs
    FOR SELECT TO authenticated
    USING (public.is_admin());

-- 3.2 Deny direct browser INSERT/UPDATE/DELETE (Immutable ledger)
-- No INSERT policy for authenticated/anon. Only SECURITY DEFINER / triggers can write.
DROP POLICY IF EXISTS "Deny direct browser insert on audit logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Deny direct browser update on audit logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Deny direct browser delete on audit logs" ON public.admin_audit_logs;

-- ------------------------------------------------------------------------------
-- 4. Immutability Enforcement Trigger (Database Engine Level)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_audit_log_immutability()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Admin audit logs are strictly immutable: UPDATE and DELETE operations are forbidden.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_mutation ON public.admin_audit_logs;
CREATE TRIGGER trg_prevent_audit_mutation
    BEFORE UPDATE OR DELETE ON public.admin_audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_audit_log_immutability();

-- ------------------------------------------------------------------------------
-- 5. Safe Audit Logging Helper Function (SECURITY DEFINER)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_admin_audit_event(
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id TEXT,
    p_entity_name TEXT DEFAULT NULL,
    p_safe_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
    v_actor_id UUID;
    v_actor_email TEXT;
BEGIN
    v_actor_id := auth.uid();
    
    -- Lookup actor email if present
    IF v_actor_id IS NOT NULL THEN
        SELECT email INTO v_actor_email FROM auth.users WHERE id = v_actor_id;
    END IF;

    INSERT INTO public.admin_audit_logs (
        actor_user_id,
        actor_email,
        action,
        entity_type,
        entity_id,
        entity_name,
        safe_metadata
    ) VALUES (
        v_actor_id,
        COALESCE(v_actor_email, 'system/admin'),
        p_action,
        p_entity_type,
        p_entity_id,
        p_entity_name,
        COALESCE(p_safe_metadata, '{}'::jsonb)
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
