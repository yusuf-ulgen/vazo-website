#!/usr/bin/env node
/**
 * ==============================================================================
 * Vazo E-Commerce Platform - Admin Provisioning CLI Tool
 * ==============================================================================
 * Bu araç admin kullanıcısını (admin@vazostudio.com) Supabase veya PostgreSQL
 * veritabanına eklemek / şifresini sıfırlamak için kullanılır.
 *
 * Kullanım:
 *   node scripts/provision-admin.mjs
 *   npm run seed:admin
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const ADMIN_EMAIL = 'admin@vazostudio.com';
const ADMIN_PASS = 'VazoAdmin2026!';
const ADMIN_ID = 'a0000000-0000-0000-0000-000000000001';

console.log('================================================================');
console.log('🛡️  VAZO E-COMMERCE - YÖNETİCİ HESABI HAZIRLAMA ARACI');
console.log('================================================================');
console.log(`👤 Hedef E-Posta : ${ADMIN_EMAIL}`);
console.log(`🔑 Hedef Şifre   : ${ADMIN_PASS}`);
console.log(`🆔 Yönetici UUID : ${ADMIN_ID}`);
console.log('----------------------------------------------------------------');

const sqlFilePath = path.join(rootDir, 'supabase', 'seed_admin_user.sql');
let sqlContent = '';

if (fs.existsSync(sqlFilePath)) {
  sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
} else {
  sqlContent = `-- Admin Kullanıcısı Tanımlama / Güncelleme SQL
DO $$
DECLARE
    v_admin_id UUID := '${ADMIN_ID}';
    v_email TEXT := '${ADMIN_EMAIL}';
    v_password TEXT := '${ADMIN_PASS}';
BEGIN
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at
    ) VALUES (
        v_admin_id, '00000000-0000-0000-0000-000000000000',
        'authenticated', 'authenticated', v_email,
        extensions.crypt(v_password, extensions.gen_salt('bf')),
        timezone('utc', now()),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Vazo Studio Admin","name":"Vazo Studio Admin"}'::jsonb,
        timezone('utc', now()), timezone('utc', now())
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        encrypted_password = EXCLUDED.encrypted_password,
        email_confirmed_at = EXCLUDED.email_confirmed_at,
        updated_at = timezone('utc', now());

    DELETE FROM auth.identities WHERE user_id = v_admin_id OR (provider = 'email' AND identity_data->>'email' = v_email);
    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id,
        last_sign_in_at, created_at, updated_at
    ) VALUES (
        v_admin_id, v_admin_id,
        jsonb_build_object('sub', v_admin_id::text, 'email', v_email),
        'email', v_admin_id::text,
        timezone('utc', now()), timezone('utc', now()), timezone('utc', now())
    );

    INSERT INTO public.admin_users (user_id, role, active, created_at, updated_at)
    VALUES (v_admin_id, 'super_admin', true, timezone('utc', now()), timezone('utc', now()))
    ON CONFLICT (user_id) DO UPDATE SET
        role = 'super_admin', active = true, updated_at = timezone('utc', now());
END $$;
`;
}

console.log('✅ SQL Tanımı Hazırlandı (supabase/seed_admin_user.sql).');
console.log('');
console.log('📋 YÖNETİCİ HESABINI AKTİFLEŞTİRME YÖNTEMLERİ:');
console.log('1. Supabase Dashboard Kullanarak:');
console.log('   - Supabase Dashboard -> Projeniz -> SQL Editor sayfasına gidin.');
console.log('   - supabase/seed_admin_user.sql dosyasındaki SQL sorgusunu yapıştırıp "Run" butonuna basın.');
console.log('');
console.log('2. Supabase CLI ile:');
console.log('   - Terminalde: supabase db query --file supabase/seed_admin_user.sql');
console.log('');
console.log('3. Yerel PostgreSQL (psql) ile:');
console.log('   - psql -U postgres -d <veritabani_adi> -f supabase/seed_admin_user.sql');
console.log('');
console.log('4. Tarayıcı Geliştirme Modu:');
console.log('   - Web uygulamasında /admin/login sayfasına gidin.');
console.log('   - "Varsayılan Yönetici Bilgileri" alanından "Otomatik Doldur"a tıklayın veya');
console.log(`     E-posta: ${ADMIN_EMAIL}`);
console.log(`     Şifre  : ${ADMIN_PASS}`);
console.log('   - "Yönetici Olarak Giriş Yap" butonuna basarak doğrudan panele erişebilirsiniz.');
console.log('================================================================');
