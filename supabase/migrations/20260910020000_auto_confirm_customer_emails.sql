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
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_confirm_customer_email ON auth.users;
CREATE TRIGGER trg_auto_confirm_customer_email
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_auto_confirm_customer_email();

-- Also ensure any existing unconfirmed users are marked confirmed
UPDATE auth.users
SET email_confirmed_at = timezone('utc', now())
WHERE email_confirmed_at IS NULL;
