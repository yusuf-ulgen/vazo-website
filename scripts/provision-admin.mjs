#!/usr/bin/env node
/**
 * ==============================================================================
 * Vazo E-Commerce Platform - Admin Provisioning CLI Tool
 * ==============================================================================
 * Bu araç admin kullanıcısını (admin@vazostudio.com) Supabase veritabanına
 * ekler / şifresini VazoAdmin2026! olarak sıfırlar ve doğrular.
 *
 * Kullanım:
 *   node scripts/provision-admin.mjs
 *   npm run seed:admin
 * ==============================================================================
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const ADMIN_EMAIL = 'admin@vazostudio.com';
const ADMIN_PASS = 'VazoAdmin2026!';
const ADMIN_ID = 'a0000000-0000-0000-0000-000000000001';
const SUPABASE_URL = 'https://rnbrdypdxomiuzjyteti.supabase.co';
const SUPABASE_KEY = 'sb_publishable_T1pmN17s5jaMChdOhF4LPw_L5an-TB2';

console.log('================================================================');
console.log('🛡️  VAZO E-COMMERCE - YÖNETİCİ HESABI HAZIRLAMA VE DOĞRULAMA');
console.log('================================================================');
console.log(`👤 Hedef E-Posta : ${ADMIN_EMAIL}`);
console.log(`🔑 Hedef Şifre   : ${ADMIN_PASS}`);
console.log(`🆔 Yönetici UUID : ${ADMIN_ID}`);
console.log('----------------------------------------------------------------');

const sqlFilePath = path.join(rootDir, 'supabase', 'seed_admin_user.sql');

if (!fs.existsSync(sqlFilePath)) {
  console.error('❌ Hata: supabase/seed_admin_user.sql dosyası bulunamadı!');
  process.exit(1);
}

try {
  console.log('⏳ 1. Veritabanına yönetici kaydı ve şifresi işleniyor (Supabase CLI)...');
  const queryResult = execSync(`npx supabase db query --linked -f "${sqlFilePath}"`, {
    cwd: rootDir,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  console.log('✅ Veritabanı sorgusu başarıyla uygulandı.');
} catch (err) {
  console.warn('⚠️ CLI üzerinden doğrudan yürütme uyarısı:', err?.message || err);
  console.log('   Doğrulama aşamasına geçiliyor...');
}

console.log('⏳ 2. Supabase Auth API üzerinden kimlik doğrulama test ediliyor...');

const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

try {
  const { data, error } = await client.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASS,
  });

  if (error || !data.user) {
    console.error('❌ Kimlik doğrulama başarısız:', error?.message || 'Kullanıcı bulunamadı.');
    process.exit(1);
  }

  console.log(`✅ Supabase Auth Girişi BAŞARILI! (Kullanıcı ID: ${data.user.id})`);

  const { data: profile, error: profileErr } = await client
    .from('admin_users')
    .select('user_id, role, active')
    .eq('user_id', data.user.id)
    .single();

  if (profileErr || !profile || !profile.active) {
    console.error('❌ Yönetici RBAC profili doğrulanamadı:', profileErr?.message || 'Profil pasif.');
    process.exit(1);
  }

  console.log(`✅ Yönetici Yetki Rolü: ${profile.role} (Aktif: ${profile.active})`);
  console.log('================================================================');
  console.log('🎉 TEBRİKLER! Yönetici hesabı aktif ve kullanıma hazır.');
  console.log(`   Giriş Adresi: https://shop.monocactus.com/admin/login`);
  console.log(`   E-posta     : ${ADMIN_EMAIL}`);
  console.log(`   Şifre       : ${ADMIN_PASS}`);
  console.log('================================================================');
} catch (err) {
  console.error('❌ Beklenmeyen hata:', err?.message || err);
  process.exit(1);
}
