-- ==============================================================================
-- Migration: 20260909000000_fix_audit_trigger_variant_status.sql
-- Description: Fixes record "old" has no field "status" runtime error when mutating
--              tables without a status column (e.g. product_variants during stock adjustment).
-- ==============================================================================

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

    -- Determine Action safely without throwing when status column does not exist on table
    IF TG_OP = 'INSERT' THEN
        v_action := 'CREATE';
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'DELETE';
    ELSIF TG_OP = 'UPDATE' THEN
        IF TG_TABLE_NAME IN ('products', 'contact_messages', 'trade_applications', 'newsletter_subscriptions') THEN
            IF (to_jsonb(OLD)->>'status') IS DISTINCT FROM (to_jsonb(NEW)->>'status') THEN
                v_action := 'STATUS_CHANGE';
            ELSE
                v_action := 'UPDATE';
            END IF;
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
