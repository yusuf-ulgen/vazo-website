-- ==============================================================================
-- Migration: 20260828010000_phase3_customer_auth.sql
-- Description: Phase 3.1 - Real Customer Accounts, Profiles & Addresses
-- ==============================================================================

-- 1. Customer Profiles Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    customer_type TEXT NOT NULL DEFAULT 'retail' CHECK (customer_type IN ('retail', 'wholesale')),
    wholesale_approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

COMMENT ON TABLE public.customer_profiles IS 'Customer profile metadata tied 1:1 with auth.users.';
COMMENT ON COLUMN public.customer_profiles.customer_type IS 'Commercial channel: retail (standard) or wholesale (approved trade partner).';

CREATE INDEX IF NOT EXISTS idx_customer_profiles_customer_type ON public.customer_profiles(customer_type);

-- 2. Customer Addresses Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label TEXT NOT NULL DEFAULT 'Ev',
    recipient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    district TEXT,
    city TEXT NOT NULL,
    state_province TEXT,
    postal_code TEXT NOT NULL,
    country_code TEXT NOT NULL CHECK (length(country_code) = 2 AND country_code = upper(country_code)),
    country_name TEXT NOT NULL,
    is_default_shipping BOOLEAN NOT NULL DEFAULT false,
    is_default_billing BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

COMMENT ON TABLE public.customer_addresses IS 'Saved customer shipping and billing addresses with ISO country codes.';

CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id ON public.customer_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_default_shipping ON public.customer_addresses(user_id) WHERE is_default_shipping = true;
CREATE INDEX IF NOT EXISTS idx_customer_addresses_default_billing ON public.customer_addresses(user_id) WHERE is_default_billing = true;

-- 3. Automatic Profile Creation Trigger on auth.users
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_customer_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_first_name TEXT;
    v_last_name TEXT;
    v_full_name TEXT;
BEGIN
    -- Safely extract metadata from Google OAuth or email sign-up
    v_first_name := COALESCE(
        NEW.raw_user_meta_data->>'given_name',
        NEW.raw_user_meta_data->>'first_name'
    );
    v_last_name := COALESCE(
        NEW.raw_user_meta_data->>'family_name',
        NEW.raw_user_meta_data->>'last_name'
    );
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name'
    );

    IF v_first_name IS NULL AND v_full_name IS NOT NULL THEN
        IF position(' ' in v_full_name) > 0 THEN
            v_first_name := split_part(v_full_name, ' ', 1);
            v_last_name := substring(v_full_name from position(' ' in v_full_name) + 1);
        ELSE
            v_first_name := v_full_name;
        END IF;
    END IF;

    INSERT INTO public.customer_profiles (
        user_id,
        first_name,
        last_name,
        phone,
        customer_type,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        v_first_name,
        v_last_name,
        NEW.raw_user_meta_data->>'phone',
        'retail',
        timezone('utc', now()),
        timezone('utc', now())
    )
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Fallback: ensure profile exists even if metadata parsing fails
        INSERT INTO public.customer_profiles (
            user_id,
            customer_type,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            'retail',
            timezone('utc', now()),
            timezone('utc', now())
        )
        ON CONFLICT (user_id) DO NOTHING;
        RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_customer_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_customer_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_customer_user();

-- 4. Privileged Profile Field Protection Trigger
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_customer_profile_privileged_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    -- Check if user is attempting to modify privileged or immutable columns
    IF (NEW.customer_type IS DISTINCT FROM OLD.customer_type OR
        NEW.wholesale_approved_at IS DISTINCT FROM OLD.wholesale_approved_at OR
        NEW.user_id IS DISTINCT FROM OLD.user_id OR
        NEW.created_at IS DISTINCT FROM OLD.created_at) THEN
        
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Privileged profile fields (customer_type, wholesale_approved_at, user_id, created_at) may only be modified by administrators.'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    NEW.updated_at := timezone('utc', now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_customer_profile_fields ON public.customer_profiles;
CREATE TRIGGER trg_protect_customer_profile_fields
    BEFORE UPDATE ON public.customer_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_customer_profile_privileged_fields();

-- 5. Default Address Switching Trigger
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_default_customer_address()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    IF NEW.is_default_shipping = true THEN
        UPDATE public.customer_addresses
        SET is_default_shipping = false
        WHERE user_id = NEW.user_id
          AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
    END IF;

    IF NEW.is_default_billing = true THEN
        UPDATE public.customer_addresses
        SET is_default_billing = false
        WHERE user_id = NEW.user_id
          AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
    END IF;

    NEW.updated_at := timezone('utc', now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_default_customer_address ON public.customer_addresses;
CREATE TRIGGER trg_handle_default_customer_address
    BEFORE INSERT OR UPDATE ON public.customer_addresses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_default_customer_address();

-- 6. Row Level Security (RLS) Policies
-- ------------------------------------------------------------------------------
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- Profiles: Customer Policies
DROP POLICY IF EXISTS "Customers can select own profile" ON public.customer_profiles;
CREATE POLICY "Customers can select own profile"
    ON public.customer_profiles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Customers can update own profile" ON public.customer_profiles;
CREATE POLICY "Customers can update own profile"
    ON public.customer_profiles
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Profiles: Admin Policy
DROP POLICY IF EXISTS "Admins have full access to customer profiles" ON public.customer_profiles;
CREATE POLICY "Admins have full access to customer profiles"
    ON public.customer_profiles
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Addresses: Customer Policies
DROP POLICY IF EXISTS "Customers can select own addresses" ON public.customer_addresses;
CREATE POLICY "Customers can select own addresses"
    ON public.customer_addresses
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Customers can insert own addresses" ON public.customer_addresses;
CREATE POLICY "Customers can insert own addresses"
    ON public.customer_addresses
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Customers can update own addresses" ON public.customer_addresses;
CREATE POLICY "Customers can update own addresses"
    ON public.customer_addresses
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Customers can delete own addresses" ON public.customer_addresses;
CREATE POLICY "Customers can delete own addresses"
    ON public.customer_addresses
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Addresses: Admin Policy
DROP POLICY IF EXISTS "Admins have full access to customer addresses" ON public.customer_addresses;
CREATE POLICY "Admins have full access to customer addresses"
    ON public.customer_addresses
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
