import { supabase, isSupabaseConfigured } from '@/shared/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Reusable helper for back-office admin panel.
 * Throws a clear error if invoked when Supabase database is not configured.
 * Admin must NEVER use mock fallbacks or display fake business data.
 */
export function requireAdminSupabase(): SupabaseClient {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      'Yönetici paneli için aktif veritabanı bağlantısı zorunludur. Supabase yapılandırması eksik veya geçersiz.'
    );
  }
  return supabase;
}

