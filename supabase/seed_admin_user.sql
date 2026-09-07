-- ==============================================================================
-- VAZO E-COMMERCE PLATFORM - ADMIN KULLANICI SEED BETİĞİ
-- Supabase SQL Editor üzerinden doğrudan çalıştırılabilir.
-- ==============================================================================
-- Yönetici E-Posta: admin@vazostudio.com
-- Yönetici Şifre:   VazoAdmin2026!
-- Rol:              super_admin
-- ==============================================================================
-- Bu betik hem mağaza müşteri girişinde hem de /admin yönetim panelinde
-- aynı kimlik bilgileriyle sorunsuz oturum açılabilmesi için gerekli tüm
-- Supabase Auth (auth.users, auth.identities) ve veritabanı tablolarını
-- (public.admin_users, public.customer_profiles) eksiksiz olarak hazırlar.
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
        '{"full_name":"Vazo Studio Yönetici","name":"Vazo Studio Yönetici"}'::jsonb,
        timezone('utc', now()),
        timezone('utc', now())
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        encrypted_password = EXCLUDED.encrypted_password,
        email_confirmed_at = EXCLUDED.email_confirmed_at,
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

    -- 3. public.customer_profiles Tablosuna Yönetici Müşteri Profili Ekleme
    INSERT INTO public.customer_profiles (
        user_id,
        first_name,
        last_name,
        customer_type,
        wholesale_approved_at,
        created_at,
        updated_at
    ) VALUES (
        v_admin_id,
        'Vazo Studio',
        'Yönetici',
        'wholesale',
        timezone('utc', now()),
        timezone('utc', now()),
        timezone('utc', now())
    ) ON CONFLICT (user_id) DO UPDATE SET
        first_name = 'Vazo Studio',
        last_name = 'Yönetici',
        customer_type = 'wholesale',
        wholesale_approved_at = timezone('utc', now()),
        updated_at = timezone('utc', now());

    -- 4. public.admin_users Tablosuna RBAC Yetkisi Tanımlama
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

    RAISE NOTICE 'Yönetici hesabı başarıyla oluşturuldu ve doğrulandı: % / %', v_email, v_password;
END $$;
