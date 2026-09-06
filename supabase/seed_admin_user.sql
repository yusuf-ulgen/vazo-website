-- ==============================================================================
-- VAZO E-COMMERCE PLATFORM - ADMIN KULLANICI SEED BETİĞİ
-- Supabase SQL Editor üzerinden doğrudan çalıştırılabilir.
-- ==============================================================================
-- Yönetici E-Posta: admin@vazostudio.com
-- Yönetici Şifre:   VazoAdmin2026!
-- Rol:              super_admin
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
        extensions.crypt(v_password, extensions.gen_salt('bf')),
        timezone('utc', now()),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Sistem Yöneticisi"}'::jsonb,
        timezone('utc', now()),
        timezone('utc', now())
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        encrypted_password = EXCLUDED.encrypted_password,
        email_confirmed_at = EXCLUDED.email_confirmed_at,
        raw_app_meta_data = EXCLUDED.raw_app_meta_data,
        updated_at = timezone('utc', now());

    -- 2. public.admin_users Tablosuna RBAC Yetkisi Tanımlama
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

    RAISE NOTICE 'Yönetici hesabı başarıyla oluşturuldu: % / %', v_email, v_password;
END $$;
