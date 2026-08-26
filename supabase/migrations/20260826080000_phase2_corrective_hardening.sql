-- ==============================================================================
-- VAZO E-COMMERCE PLATFORM - PHASE 2.14 CORRECTIVE HARDENING & SECURITY GREEN GATE
-- Migration: 20260826080000_phase2_corrective_hardening.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. HARDENED RBAC HELPER FUNCTIONS & ANONYMOUS ENUMERATION PROTECTION
-- ------------------------------------------------------------------------------

-- Parameterized internal helper with privilege validation (prevents enumeration by non-admins)
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    -- If checking oneself or if caller is an authorized admin / service_role
    IF check_user_id IS NULL OR check_user_id = auth.uid() OR auth.role() = 'service_role' OR EXISTS (
        SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND active = true
    ) THEN
        RETURN EXISTS (
            SELECT 1
            FROM public.admin_users
            WHERE user_id = COALESCE(check_user_id, auth.uid())
              AND active = true
        );
    END IF;

    -- Non-admin callers cannot query arbitrary user IDs
    RETURN false;
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
    IF check_user_id IS NULL OR check_user_id = auth.uid() OR auth.role() = 'service_role' OR EXISTS (
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

-- Grant permissions explicitly
REVOKE ALL ON FUNCTION public.is_admin(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_admin_role(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_admin_role(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_admin_role(UUID) TO authenticated, service_role;



-- ------------------------------------------------------------------------------
-- 2. AUDIT TRAIL IMMUTABILITY TRIGGER (EXPLICIT SQLSTATE 27000)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_audit_log_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RAISE EXCEPTION 'Admin audit logs are strictly immutable: UPDATE and DELETE operations are forbidden.'
        USING ERRCODE = '27000';
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_audit_mutation ON public.admin_audit_logs;
CREATE TRIGGER trg_prevent_audit_mutation
    BEFORE UPDATE OR DELETE ON public.admin_audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_audit_log_immutability();


-- ------------------------------------------------------------------------------
-- 3. SECURE AUDIT LOGGING HELPER FUNCTION (SECURITY DEFINER + AUTH CHECK)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_admin_audit_event(
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id TEXT,
    p_entity_name TEXT DEFAULT NULL,
    p_safe_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_log_id UUID;
    v_actor_id UUID;
    v_actor_email TEXT;
BEGIN
    -- Verify the caller is an active Admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin authorization required'
            USING ERRCODE = '42501';
    END IF;

    -- Validate action
    IF p_action NOT IN ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'BULK_UPDATE') THEN
        RAISE EXCEPTION 'Invalid audit action: %', p_action
            USING ERRCODE = '22023';
    END IF;

    -- Validate entity type
    IF p_entity_type NOT IN (
        'product', 'variant', 'inventory', 'price', 'wholesale_tier',
        'category', 'collection', 'cms_page', 'cms_section',
        'faq_group', 'faq_item', 'menu_group', 'menu_item',
        'site_settings', 'trade_application', 'contact_message',
        'newsletter_subscription'
    ) THEN
        RAISE EXCEPTION 'Invalid audit entity type: %', p_entity_type
            USING ERRCODE = '22023';
    END IF;

    -- Actor identity originates server-side from auth context
    v_actor_id := auth.uid();
    
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
        COALESCE(v_actor_email, 'admin@vazo.design'),
        p_action,
        p_entity_type,
        p_entity_id,
        p_entity_name,
        COALESCE(p_safe_metadata, '{}'::jsonb)
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

-- Revoke default public execution & allow only authenticated users (who must pass is_admin() inside)
REVOKE ALL ON FUNCTION public.log_admin_audit_event(TEXT, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_admin_audit_event(TEXT, TEXT, TEXT, TEXT, JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.log_admin_audit_event(TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 4. DATABASE-TRIGGER BASED AUDIT LOGGING FOR REAL ADMIN MUTATIONS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.audit_admin_table_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_actor_email TEXT;
    v_action TEXT;
    v_entity_type TEXT;
    v_entity_id TEXT;
    v_entity_name TEXT;
    v_metadata JSONB;
    v_tbl TEXT;
    v_reason TEXT;
BEGIN
    v_actor_id := auth.uid();
    v_tbl := TG_TABLE_NAME;
    
    -- Only capture when an active admin is performing the mutation
    IF v_actor_id IS NULL OR NOT public.is_admin() THEN
        RETURN NULL;
    END IF;

    SELECT email INTO v_actor_email FROM auth.users WHERE id = v_actor_id;

    -- Determine Action
    IF TG_OP = 'INSERT' THEN
        v_action := 'CREATE';
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'DELETE';
    ELSIF TG_OP = 'UPDATE' THEN
        IF (TG_TABLE_NAME IN ('products', 'contact_messages', 'trade_applications', 'newsletter_subscriptions'))
           AND (OLD.status IS DISTINCT FROM NEW.status) THEN
            v_action := 'STATUS_CHANGE';
        ELSE
            v_action := 'UPDATE';
        END IF;
    END IF;

    -- Determine Entity Type, ID, Name & Metadata (excluding PII)
    IF v_tbl = 'products' THEN
        v_entity_type := 'product';
        IF TG_OP = 'DELETE' THEN
            v_entity_id := OLD.id::text;
            v_entity_name := OLD.name;
            v_metadata := jsonb_build_object('slug', OLD.slug, 'status', OLD.status);
        ELSE
            v_entity_id := NEW.id::text;
            v_entity_name := NEW.name;
            v_metadata := jsonb_build_object('slug', NEW.slug, 'status', NEW.status, 'retail_price', NEW.retail_price);
        END IF;
    ELSIF v_tbl = 'product_variants' THEN
        v_entity_type := 'variant';
        IF TG_OP = 'DELETE' THEN
            v_entity_id := OLD.id::text;
            v_entity_name := OLD.sku;
            v_metadata := jsonb_build_object('product_id', OLD.product_id, 'stock_quantity', OLD.stock_quantity);
        ELSE
            v_entity_id := NEW.id::text;
            v_entity_name := NEW.sku;
            IF TG_OP = 'UPDATE' AND OLD.stock_quantity IS DISTINCT FROM NEW.stock_quantity THEN
                v_entity_type := 'inventory';
                v_reason := NULLIF(current_setting('app.inventory_adjustment_reason', true), '');
                v_metadata := jsonb_build_object(
                    'product_id', NEW.product_id,
                    'previous_stock', OLD.stock_quantity,
                    'new_stock', NEW.stock_quantity
                );
                IF v_reason IS NOT NULL THEN
                    v_metadata := v_metadata || jsonb_build_object('reason', v_reason);
                END IF;
            ELSE
                v_metadata := jsonb_build_object(
                    'product_id', NEW.product_id,
                    'stock_quantity', NEW.stock_quantity,
                    'retail_price', NEW.retail_price
                );
            END IF;
        END IF;
    ELSIF v_tbl = 'wholesale_price_tiers' THEN
        v_entity_type := 'wholesale_tier';
        IF TG_OP = 'DELETE' THEN
            v_entity_id := OLD.id::text;
            v_entity_name := 'Wholesale Tier';
            v_metadata := jsonb_build_object('product_id', OLD.product_id, 'min_quantity', OLD.min_quantity);
        ELSE
            v_entity_id := NEW.id::text;
            v_entity_name := 'Wholesale Tier';
            v_metadata := jsonb_build_object('product_id', NEW.product_id, 'min_quantity', NEW.min_quantity, 'unit_price', NEW.unit_price);
        END IF;
    ELSIF v_tbl = 'categories' THEN
        v_entity_type := 'category';
        IF TG_OP = 'DELETE' THEN
            v_entity_id := OLD.id::text;
            v_entity_name := OLD.name;
            v_metadata := jsonb_build_object('slug', OLD.slug);
        ELSE
            v_entity_id := NEW.id::text;
            v_entity_name := NEW.name;
            v_metadata := jsonb_build_object('slug', NEW.slug, 'active', NEW.active);
        END IF;
    ELSIF v_tbl = 'collections' THEN
        v_entity_type := 'collection';
        IF TG_OP = 'DELETE' THEN
            v_entity_id := OLD.id::text;
            v_entity_name := OLD.name;
            v_metadata := jsonb_build_object('slug', OLD.slug);
        ELSE
            v_entity_id := NEW.id::text;
            v_entity_name := NEW.name;
            v_metadata := jsonb_build_object('slug', NEW.slug, 'active', NEW.active);
        END IF;
    ELSIF v_tbl = 'site_settings' THEN
        v_entity_type := 'site_settings';
        IF TG_OP = 'DELETE' THEN
            v_entity_id := OLD.key;
            v_entity_name := OLD.key;
            v_metadata := jsonb_build_object('key', OLD.key);
        ELSE
            v_entity_id := NEW.key;
            v_entity_name := NEW.key;
            v_metadata := jsonb_build_object('key', NEW.key);
        END IF;
    ELSIF v_tbl = 'contact_messages' THEN
        v_entity_type := 'contact_message';
        IF TG_OP = 'DELETE' THEN
            v_entity_id := OLD.id::text;
            v_entity_name := OLD.subject;
            v_metadata := jsonb_build_object('status', OLD.status);
        ELSE
            v_entity_id := NEW.id::text;
            v_entity_name := NEW.subject;
            v_metadata := jsonb_build_object('status', NEW.status);
        END IF;
    ELSIF v_tbl = 'trade_applications' THEN
        v_entity_type := 'trade_application';
        IF TG_OP = 'DELETE' THEN
            v_entity_id := OLD.id::text;
            v_entity_name := OLD.company_name;
            v_metadata := jsonb_build_object('status', OLD.status);
        ELSE
            v_entity_id := NEW.id::text;
            v_entity_name := NEW.company_name;
            v_metadata := jsonb_build_object('status', NEW.status);
        END IF;
    ELSIF v_tbl = 'newsletter_subscriptions' THEN
        v_entity_type := 'newsletter_subscription';
        IF TG_OP = 'DELETE' THEN
            v_entity_id := OLD.id::text;
            v_entity_name := 'Newsletter';
            v_metadata := jsonb_build_object('status', OLD.status);
        ELSE
            v_entity_id := NEW.id::text;
            v_entity_name := 'Newsletter';
            v_metadata := jsonb_build_object('status', NEW.status);
        END IF;
    ELSIF v_tbl = 'menu_groups' THEN
        v_entity_type := 'menu_group';
        IF TG_OP = 'DELETE' THEN
            v_entity_id := OLD.id::text;
            v_entity_name := OLD.title;
            v_metadata := jsonb_build_object('menu_type', OLD.menu_type);
        ELSE
            v_entity_id := NEW.id::text;
            v_entity_name := NEW.title;
            v_metadata := jsonb_build_object('menu_type', NEW.menu_type, 'active', NEW.active);
        END IF;
    ELSIF v_tbl = 'menu_items' THEN
        v_entity_type := 'menu_item';
        IF TG_OP = 'DELETE' THEN
            v_entity_id := OLD.id::text;
            v_entity_name := OLD.label;
            v_metadata := jsonb_build_object('href', OLD.href);
        ELSE
            v_entity_id := NEW.id::text;
            v_entity_name := NEW.label;
            v_metadata := jsonb_build_object('href', NEW.href, 'active', NEW.active);
        END IF;
    ELSIF v_tbl = 'content_pages' THEN
        v_entity_type := 'cms_page';
        IF TG_OP = 'DELETE' THEN
            v_entity_id := OLD.id::text;
            v_entity_name := OLD.title;
            v_metadata := jsonb_build_object('slug', OLD.page_key);
        ELSE
            v_entity_id := NEW.id::text;
            v_entity_name := NEW.title;
            v_metadata := jsonb_build_object('slug', NEW.page_key, 'published', NEW.published);
        END IF;
    ELSIF v_tbl = 'content_sections' THEN
        v_entity_type := 'cms_section';
        IF TG_OP = 'DELETE' THEN
            v_entity_id := OLD.id::text;
            v_entity_name := OLD.title;
            v_metadata := jsonb_build_object('section_key', OLD.section_key);
        ELSE
            v_entity_id := NEW.id::text;
            v_entity_name := NEW.title;
            v_metadata := jsonb_build_object('section_key', NEW.section_key, 'active', NEW.active);
        END IF;
    ELSIF v_tbl = 'faq_groups' THEN
        v_entity_type := 'faq_group';
        IF TG_OP = 'DELETE' THEN
            v_entity_id := OLD.id::text;
            v_entity_name := OLD.title;
            v_metadata := jsonb_build_object('active', OLD.active);
        ELSE
            v_entity_id := NEW.id::text;
            v_entity_name := NEW.title;
            v_metadata := jsonb_build_object('active', NEW.active);
        END IF;
    ELSIF v_tbl = 'faq_items' THEN
        v_entity_type := 'faq_item';
        IF TG_OP = 'DELETE' THEN
            v_entity_id := OLD.id::text;
            v_entity_name := OLD.question;
            v_metadata := jsonb_build_object('active', OLD.active);
        ELSE
            v_entity_id := NEW.id::text;
            v_entity_name := NEW.question;
            v_metadata := jsonb_build_object('active', NEW.active);
        END IF;
    ELSIF v_tbl = 'hero_slides' THEN
        v_entity_type := 'cms_section';
        IF TG_OP = 'DELETE' THEN
            v_entity_id := OLD.id::text;
            v_entity_name := OLD.title;
            v_metadata := jsonb_build_object('active', OLD.active);
        ELSE
            v_entity_id := NEW.id::text;
            v_entity_name := NEW.title;
            v_metadata := jsonb_build_object('active', NEW.active);
        END IF;
    ELSIF v_tbl = 'wholesale_benefits' THEN
        v_entity_type := 'cms_section';
        IF TG_OP = 'DELETE' THEN
            v_entity_id := OLD.id::text;
            v_entity_name := OLD.title;
            v_metadata := jsonb_build_object('active', OLD.active);
        ELSE
            v_entity_id := NEW.id::text;
            v_entity_name := NEW.title;
            v_metadata := jsonb_build_object('active', NEW.active);
        END IF;
    ELSIF v_tbl = 'editorial_sections' THEN
        v_entity_type := 'cms_section';
        IF TG_OP = 'DELETE' THEN
            v_entity_id := OLD.id::text;
            v_entity_name := OLD.title;
            v_metadata := jsonb_build_object('active', OLD.active);
        ELSE
            v_entity_id := NEW.id::text;
            v_entity_name := NEW.title;
            v_metadata := jsonb_build_object('active', NEW.active);
        END IF;
    ELSE
        RETURN NULL;
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
        COALESCE(v_actor_email, 'admin@vazo.design'),
        v_action,
        v_entity_type,
        v_entity_id,
        v_entity_name,
        COALESCE(v_metadata, '{}'::jsonb)
    );

    RETURN NULL;
END;
$$;

-- Attach triggers to mutation tables
DROP TRIGGER IF EXISTS trg_audit_products ON public.products;
CREATE TRIGGER trg_audit_products
    AFTER INSERT OR UPDATE OR DELETE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.audit_admin_table_mutation();

DROP TRIGGER IF EXISTS trg_audit_product_variants ON public.product_variants;
CREATE TRIGGER trg_audit_product_variants
    AFTER INSERT OR UPDATE OR DELETE ON public.product_variants
    FOR EACH ROW EXECUTE FUNCTION public.audit_admin_table_mutation();

DROP TRIGGER IF EXISTS trg_audit_wholesale_tiers ON public.wholesale_price_tiers;
CREATE TRIGGER trg_audit_wholesale_tiers
    AFTER INSERT OR UPDATE OR DELETE ON public.wholesale_price_tiers
    FOR EACH ROW EXECUTE FUNCTION public.audit_admin_table_mutation();

DROP TRIGGER IF EXISTS trg_audit_categories ON public.categories;
CREATE TRIGGER trg_audit_categories
    AFTER INSERT OR UPDATE OR DELETE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.audit_admin_table_mutation();

DROP TRIGGER IF EXISTS trg_audit_collections ON public.collections;
CREATE TRIGGER trg_audit_collections
    AFTER INSERT OR UPDATE OR DELETE ON public.collections
    FOR EACH ROW EXECUTE FUNCTION public.audit_admin_table_mutation();

DROP TRIGGER IF EXISTS trg_audit_site_settings ON public.site_settings;
CREATE TRIGGER trg_audit_site_settings
    AFTER INSERT OR UPDATE OR DELETE ON public.site_settings
    FOR EACH ROW EXECUTE FUNCTION public.audit_admin_table_mutation();

DROP TRIGGER IF EXISTS trg_audit_contact_messages ON public.contact_messages;
CREATE TRIGGER trg_audit_contact_messages
    AFTER UPDATE OR DELETE ON public.contact_messages
    FOR EACH ROW EXECUTE FUNCTION public.audit_admin_table_mutation();

DROP TRIGGER IF EXISTS trg_audit_trade_applications ON public.trade_applications;
CREATE TRIGGER trg_audit_trade_applications
    AFTER UPDATE OR DELETE ON public.trade_applications
    FOR EACH ROW EXECUTE FUNCTION public.audit_admin_table_mutation();

DROP TRIGGER IF EXISTS trg_audit_newsletter_subscriptions ON public.newsletter_subscriptions;
CREATE TRIGGER trg_audit_newsletter_subscriptions
    AFTER UPDATE OR DELETE ON public.newsletter_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.audit_admin_table_mutation();

DROP TRIGGER IF EXISTS trg_audit_menu_groups ON public.menu_groups;
CREATE TRIGGER trg_audit_menu_groups
    AFTER INSERT OR UPDATE OR DELETE ON public.menu_groups
    FOR EACH ROW EXECUTE FUNCTION public.audit_admin_table_mutation();

DROP TRIGGER IF EXISTS trg_audit_menu_items ON public.menu_items;
CREATE TRIGGER trg_audit_menu_items
    AFTER INSERT OR UPDATE OR DELETE ON public.menu_items
    FOR EACH ROW EXECUTE FUNCTION public.audit_admin_table_mutation();

DROP TRIGGER IF EXISTS trg_audit_content_pages ON public.content_pages;
CREATE TRIGGER trg_audit_content_pages
    AFTER INSERT OR UPDATE OR DELETE ON public.content_pages
    FOR EACH ROW EXECUTE FUNCTION public.audit_admin_table_mutation();

DROP TRIGGER IF EXISTS trg_audit_content_sections ON public.content_sections;
CREATE TRIGGER trg_audit_content_sections
    AFTER INSERT OR UPDATE OR DELETE ON public.content_sections
    FOR EACH ROW EXECUTE FUNCTION public.audit_admin_table_mutation();

DROP TRIGGER IF EXISTS trg_audit_faq_groups ON public.faq_groups;
CREATE TRIGGER trg_audit_faq_groups
    AFTER INSERT OR UPDATE OR DELETE ON public.faq_groups
    FOR EACH ROW EXECUTE FUNCTION public.audit_admin_table_mutation();

DROP TRIGGER IF EXISTS trg_audit_faq_items ON public.faq_items;
CREATE TRIGGER trg_audit_faq_items
    AFTER INSERT OR UPDATE OR DELETE ON public.faq_items
    FOR EACH ROW EXECUTE FUNCTION public.audit_admin_table_mutation();

DROP TRIGGER IF EXISTS trg_audit_hero_slides ON public.hero_slides;
CREATE TRIGGER trg_audit_hero_slides
    AFTER INSERT OR UPDATE OR DELETE ON public.hero_slides
    FOR EACH ROW EXECUTE FUNCTION public.audit_admin_table_mutation();

DROP TRIGGER IF EXISTS trg_audit_wholesale_benefits ON public.wholesale_benefits;
CREATE TRIGGER trg_audit_wholesale_benefits
    AFTER INSERT OR UPDATE OR DELETE ON public.wholesale_benefits
    FOR EACH ROW EXECUTE FUNCTION public.audit_admin_table_mutation();

DROP TRIGGER IF EXISTS trg_audit_editorial_sections ON public.editorial_sections;
CREATE TRIGGER trg_audit_editorial_sections
    AFTER INSERT OR UPDATE OR DELETE ON public.editorial_sections
    FOR EACH ROW EXECUTE FUNCTION public.audit_admin_table_mutation();


-- ------------------------------------------------------------------------------
-- 5. SITE SETTINGS PUBLIC RLS REPAIR
-- ------------------------------------------------------------------------------
-- Ensure only intended storefront settings are public
UPDATE public.site_settings
SET is_public = true
WHERE key IN ('general', 'contact', 'commerce', 'social');

UPDATE public.site_settings
SET is_public = false
WHERE key NOT IN ('general', 'contact', 'commerce', 'social');


-- ------------------------------------------------------------------------------
-- 6. STORAGE 5MB LIMIT & ATOMIC PRODUCT PRIMARY MEDIA INTEGRITY
-- ------------------------------------------------------------------------------
-- 6.1 Correct bucket size limit to canonical 5 MB (5 * 1024 * 1024 = 5242880)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'public-media',
    'public-media',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

-- 6.2 Database Unique Partial Index: One primary media per product
-- First clean up any accidental duplicate primary media per product before creating unique index
WITH duplicates AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY sort_order ASC, id ASC) as rn
    FROM public.product_media
    WHERE is_primary = true
)
UPDATE public.product_media
SET is_primary = false
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_media_single_primary
    ON public.product_media(product_id)
    WHERE is_primary = true;

-- 6.3 Atomic Primary Media Switching RPC
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
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin authorization required' USING ERRCODE = '42501';
    END IF;

    -- Verify the media belongs to the product
    IF NOT EXISTS (
        SELECT 1 FROM public.product_media
        WHERE id = p_media_id AND product_id = p_product_id
    ) THEN
        RAISE EXCEPTION 'Media item % does not belong to product %', p_media_id, p_product_id
            USING ERRCODE = 'P0002';
    END IF;

    -- Atomically toggle all others to false and the target to true
    UPDATE public.product_media
    SET is_primary = false
    WHERE product_id = p_product_id AND is_primary = true;

    UPDATE public.product_media
    SET is_primary = true
    WHERE id = p_media_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_primary_product_media(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_primary_product_media(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_primary_product_media(UUID, UUID) TO authenticated, service_role;

-- 6.4 Authoritative Inventory Stock Adjustment RPC (Atomic Mutation + Single Audit Log)
CREATE OR REPLACE FUNCTION public.adjust_inventory_stock(
    p_variant_id UUID,
    p_new_quantity INT,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_old_stock INT;
    v_sku TEXT;
    v_name TEXT;
    v_prod_id UUID;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin authorization required' USING ERRCODE = '42501';
    END IF;

    IF p_new_quantity < 0 THEN
        RAISE EXCEPTION 'Stock quantity cannot be negative' USING ERRCODE = '22003';
    END IF;

    SELECT stock_quantity, sku, variant_name, product_id
    INTO v_old_stock, v_sku, v_name, v_prod_id
    FROM public.product_variants
    WHERE id = p_variant_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Variant not found: %', p_variant_id USING ERRCODE = 'P0002';
    END IF;

    -- Store reason in transaction-local session config so audit trigger captures it
    IF p_reason IS NOT NULL AND p_reason <> '' THEN
        PERFORM set_config('app.inventory_adjustment_reason', p_reason, true);
    END IF;

    -- Update stock (fires audit trigger once with single authoritative log)
    UPDATE public.product_variants
    SET stock_quantity = p_new_quantity,
        updated_at = now()
    WHERE id = p_variant_id;

    RETURN jsonb_build_object(
        'variant_id', p_variant_id,
        'previous_stock', v_old_stock,
        'new_stock', p_new_quantity,
        'reason', p_reason
    );
END;
$$;

REVOKE ALL ON FUNCTION public.adjust_inventory_stock(UUID, INT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.adjust_inventory_stock(UUID, INT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.adjust_inventory_stock(UUID, INT, TEXT) TO authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 7. REPAIR SEEDED NAVIGATION LINKS (POINT AT REAL EXISTING ROUTES)
-- ------------------------------------------------------------------------------
UPDATE public.menu_items
SET href = '/wholesale/how-it-works'
WHERE href IN ('/wholesale/pricing', '/wholesale/moq', '/wholesale/lead-times');

UPDATE public.menu_items
SET href = '/wholesale/apply'
WHERE href IN (
    '/wholesale/samples',
    '/wholesale/architects',
    '/wholesale/hospitality',
    '/wholesale/retailers',
    '/wholesale/corporate',
    '/wholesale/custom'
);

UPDATE public.menu_items
SET href = '/wholesale/products'
WHERE href = '/wholesale/catalog';

UPDATE public.menu_items
SET href = '/policies/shipping-returns'
WHERE href = '/wholesale/shipping';

UPDATE public.menu_items
SET href = '/contact'
WHERE href = '/wholesale/contact';

-- ------------------------------------------------------------------------------
-- 10. SCHEMA & TABLE PRIVILEGES FOR POSTGREST (ANON & AUTHENTICATED ROLES)
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;

