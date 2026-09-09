-- ==============================================================================
-- Migration: 20260909040000_fix_admin_auth_and_tokens.sql
-- Description: Sanitize auth.users string columns to avoid GoTrue NULL scanner error,
--              and update admin_change_own_password RPC to maintain token hygiene.
-- ==============================================================================

-- 1. Sanitize any NULL token columns in auth.users for existing accounts
UPDATE auth.users
SET
    confirmation_token = COALESCE(confirmation_token, ''),
    recovery_token = COALESCE(recovery_token, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    email_change_token_current = COALESCE(email_change_token_current, ''),
    email_change = COALESCE(email_change, ''),
    phone_change = COALESCE(phone_change, ''),
    phone_change_token = COALESCE(phone_change_token, ''),
    reauthentication_token = COALESCE(reauthentication_token, ''),
    is_anonymous = COALESCE(is_anonymous, false),
    is_sso_user = COALESCE(is_sso_user, false)
WHERE
    confirmation_token IS NULL
    OR recovery_token IS NULL
    OR email_change_token_new IS NULL
    OR email_change_token_current IS NULL
    OR email_change IS NULL
    OR phone_change IS NULL
    OR phone_change_token IS NULL
    OR reauthentication_token IS NULL;

-- 2. Ensure admin_change_own_password verifies true current password and preserves token hygiene
CREATE OR REPLACE FUNCTION public.admin_change_own_password(
    p_current_password TEXT,
    p_new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_enc_pass TEXT;
BEGIN
    -- 1. Identify user: either active JWT user or dev admin
    v_user_id := auth.uid();

    IF v_user_id IS NOT NULL THEN
        SELECT encrypted_password INTO v_enc_pass
        FROM auth.users
        WHERE id = v_user_id;
    END IF;

    -- Fallback to seeded admin user if session is in dev mode
    IF v_user_id IS NULL OR v_enc_pass IS NULL THEN
        SELECT id, encrypted_password INTO v_user_id, v_enc_pass
        FROM auth.users
        WHERE email = 'admin@vazostudio.com'
        LIMIT 1;
    END IF;

    IF v_user_id IS NULL OR v_enc_pass IS NULL THEN
        RAISE EXCEPTION 'Yönetici hesabı bulunamadı.';
    END IF;

    -- 2. Strictly verify current password against stored encrypted_password
    IF v_enc_pass <> extensions.crypt(p_current_password, v_enc_pass) THEN
        RAISE EXCEPTION 'Güncel şifreniz uyuşmuyor.';
    END IF;

    -- 3. Validate new password length
    IF length(p_new_password) < 6 THEN
        RAISE EXCEPTION 'Yeni şifre en az 6 karakter uzunluğunda olmalıdır.';
    END IF;

    -- 4. Update encrypted password with standard bcrypt (cost 10) and ensure tokens remain clean
    UPDATE auth.users
    SET encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf', 10)),
        confirmation_token = COALESCE(confirmation_token, ''),
        recovery_token = COALESCE(recovery_token, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        email_change_token_current = COALESCE(email_change_token_current, ''),
        email_change = COALESCE(email_change, ''),
        phone_change = COALESCE(phone_change, ''),
        phone_change_token = COALESCE(phone_change_token, ''),
        reauthentication_token = COALESCE(reauthentication_token, ''),
        updated_at = now()
    WHERE id = v_user_id;

    RETURN jsonb_build_object('success', true, 'user_id', v_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_change_own_password(TEXT, TEXT) TO anon, authenticated, service_role;
