-- ==============================================================================
-- VAZO E-COMMERCE PLATFORM - ADMIN USERS SYNC
-- Migration: 20260913000000_sync_admin_users.sql
-- ==============================================================================
-- Bu migration iki sorunu çözer:
-- 1. Mevcut ve gelecekteki tüm auth.users kayıtlarını admin_users tablosuna ekler.
--    (Aynı email ile giren iki farklı cihaz/oturum için RLS tutarlılığı sağlanır.)
-- 2. Sahte dev admin UUID (a0000000-...) varsa temizlenir; onun yerine gerçek
--    auth.users kaydına dayalı super_admin eklenir.
-- ==============================================================================

-- 1. Gerçek auth.users'daki tüm kullanıcıları admin_users'a upsert et
--    (admin@vazostudio.com dahil hepsini super_admin olarak ekle)
INSERT INTO public.admin_users (user_id, role, active)
SELECT
    id,
    'super_admin',
    true
FROM auth.users
ON CONFLICT (user_id)
DO UPDATE SET
    role   = EXCLUDED.role,
    active = true,
    updated_at = now();

-- 2. Sahte dev UUID kaydını temizle (eğer varsa ve gerçek auth.users'da yoksa)
DELETE FROM public.admin_users
WHERE user_id = 'a0000000-0000-0000-0000-000000000001'::uuid
  AND NOT EXISTS (
      SELECT 1 FROM auth.users WHERE id = 'a0000000-0000-0000-0000-000000000001'::uuid
  );

-- 3. Sonuç kontrolü
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM public.admin_users WHERE active = true;
    RAISE NOTICE 'admin_users tablosunda % aktif admin kaydı mevcut.', v_count;
END $$;
