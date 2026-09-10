-- ==============================================================================
-- Auto-Confirm Customer Emails Migration
-- ==============================================================================
-- Ensures that new customer registrations automatically have their email confirmed,
-- allowing immediate valid authenticated JWT sessions and seamless checkout without
-- requiring external SMTP email verification during checkout.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_auto_confirm_customer_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, timezone('utc', now()));
    NEW.raw_user_meta_data := jsonb_set(COALESCE(NEW.raw_user_meta_data, '{}'::jsonb), '{email_verified}', 'true');
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_confirm_customer_email ON auth.users;
CREATE TRIGGER trg_auto_confirm_customer_email
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_auto_confirm_customer_email();

-- Also ensure identity_data has email_verified = true
CREATE OR REPLACE FUNCTION public.handle_auto_confirm_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    NEW.identity_data := jsonb_set(COALESCE(NEW.identity_data, '{}'::jsonb), '{email_verified}', 'true');
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_confirm_identity ON auth.identities;
CREATE TRIGGER trg_auto_confirm_identity
    BEFORE INSERT ON auth.identities
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_auto_confirm_identity();

-- Ensure all existing users and identities are verified
UPDATE auth.users
SET email_confirmed_at = timezone('utc', now()),
    raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{email_verified}', 'true')
WHERE email_confirmed_at IS NULL OR (raw_user_meta_data->>'email_verified')::boolean IS NOT true;

UPDATE auth.identities
SET identity_data = jsonb_set(COALESCE(identity_data, '{}'::jsonb), '{email_verified}', 'true')
WHERE (identity_data->>'email_verified')::boolean IS NOT true;
