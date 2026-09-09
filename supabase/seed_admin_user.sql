-- ==============================================================================
-- VAZO E-COMMERCE PLATFORM - OPERATOR ADMIN PROVISIONING TEMPLATE
-- ==============================================================================
-- Bu betik operatör tarafından Supabase Dashboard SQL Editor veya CLI üzerinden
-- güvenli yönetici hesabı oluşturmak / sıfırlamak için kullanılır.
-- ==============================================================================

DO $$
DECLARE
    v_admin_id UUID := 'a0000000-0000-0000-0000-000000000001';
    v_email TEXT := 'admin@vazostudio.com';
    v_password TEXT := 'VazoAdmin2026!';
BEGIN
    -- 1. auth.users Tablosuna Kullanıcı Ekleme / Güncelleme
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change_token_current,
        email_change,
        phone_change,
        phone_change_token,
        reauthentication_token,
        is_anonymous,
        is_sso_user,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
    ) VALUES (
        v_admin_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        extensions.crypt(v_password, extensions.gen_salt('bf', 10)),
        timezone('utc', now()),
        '', '', '', '', '', '', '', '',
        false, false,
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Vazo Geliştirme Yöneticisi","name":"Vazo Geliştirme Yöneticisi"}'::jsonb,
        timezone('utc', now()),
        timezone('utc', now())
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        encrypted_password = EXCLUDED.encrypted_password,
        email_confirmed_at = COALESCE(auth.users.email_confirmed_at, timezone('utc', now())),
        confirmation_token = '',
        recovery_token = '',
        email_change_token_new = '',
        email_change_token_current = '',
        email_change = '',
        phone_change = '',
        phone_change_token = '',
        reauthentication_token = '',
        is_anonymous = false,
        is_sso_user = false,
        raw_app_meta_data = EXCLUDED.raw_app_meta_data,
        raw_user_meta_data = EXCLUDED.raw_user_meta_data,
        updated_at = timezone('utc', now());

    -- 2. auth.identities Tablosuna E-posta Sağlayıcısı Ekleme (GoTrue şifre kontrolü için zorunludur)
    DELETE FROM auth.identities WHERE user_id = v_admin_id OR (provider = 'email' AND identity_data->>'email' = v_email);
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        v_admin_id,
        v_admin_id,
        jsonb_build_object('sub', v_admin_id::text, 'email', v_email),
        'email',
        v_admin_id::text,
        timezone('utc', now()),
        timezone('utc', now()),
        timezone('utc', now())
    );

    -- 3. public.admin_users Tablosuna RBAC Yetkisi Tanımlama
    INSERT INTO public.admin_users (
        user_id,
        role,
        active,
        created_at,
        updated_at
    ) VALUES (
        v_admin_id,
        'super_admin',
        true,
        timezone('utc', now()),
        timezone('utc', now())
    ) ON CONFLICT (user_id) DO UPDATE SET
        role = 'super_admin',
        active = true,
        updated_at = timezone('utc', now());
END $$;
