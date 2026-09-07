-- ==============================================================================
-- VAZO E-COMMERCE PLATFORM - OPERATOR ADMIN PROVISIONING TEMPLATE
-- ==============================================================================
-- Bu betik operatör tarafından Supabase Dashboard SQL Editor veya CLI üzerinden
-- güvenli yönetici hesabı oluşturmak / sıfırlamak için kullanılır.
--
-- GÜVENLİK TALİMATI:
-- 1. Üretim ortamında aşağıdaki v_email ve v_password değişkenlerini kendi belirlediğiniz
--    güçlü değerlerle güncelleyiniz.
-- 2. Bu dosyaya asla gerçek üretim şifrelerini yazıp git reposuna kaydetmeyiniz.
-- 3. Yerel geliştirme için varsayılan test değerleri aşağıda tanımlanmıştır.
-- ==============================================================================

DO $$
DECLARE
    v_admin_id UUID := 'a0000000-0000-0000-0000-000000000001';
    v_email TEXT := 'dev-admin@vazo.local';
    v_password TEXT := 'LocalDevOnlyPassword_DoNotUseInProd123!';
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
        '{"full_name":"Vazo Geliştirme Yöneticisi","name":"Vazo Geliştirme Yöneticisi"}'::jsonb,
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

