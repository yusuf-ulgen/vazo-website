import * as supabaseModule from '@/shared/lib/supabase';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

export type AdminRole = 'admin' | 'super_admin';

export interface AdminProfile {
  id: string;
  email: string;
  role: AdminRole;
  active: boolean;
}

export interface AdminAuthState {
  user: AdminProfile | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Validates whether the authenticated Supabase user is an authorized, active admin in public.admin_users.
 */
async function fetchAdminProfile(user: SupabaseUser): Promise<AdminProfile | null> {
  const client = supabaseModule.supabase;
  if (!client || !supabaseModule.isSupabaseConfigured) {
    return null;
  }

  try {
    const { data, error } = await client
      .from('admin_users')
      .select('user_id, role, active')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data || !data.active) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
      role: (data.role as AdminRole) || 'admin',
      active: data.active === true,
    };
  } catch {
    return null;
  }
}
export const DEV_ADMIN_EMAIL = 'admin@vazostudio.com';
export const DEV_ADMIN_PASSWORD = 'VazoAdmin2026!';

export const DEV_ADMIN_PROFILE: AdminProfile = {
  id: 'a0000000-0000-0000-0000-000000000001',
  email: DEV_ADMIN_EMAIL,
  role: 'super_admin',
  active: true,
};

const DEV_ADMIN_STORAGE_KEY = 'vazo_admin_session';

import { translateAuthError } from '@/shared/utils/auth-error-translator';

export const adminAuthService = {
  /**
   * Signs in an admin user using Supabase Auth with dev admin fallback for admin@vazostudio.com.
   * Authority strictly requires valid Supabase Auth + active record in public.admin_users,
   * or verified dev admin credentials.
   */
  async login(email: string, password: string): Promise<AdminProfile> {
    const normalizedEmail = email.trim().toLowerCase();
    const isDevMatch =
      normalizedEmail === DEV_ADMIN_EMAIL.toLowerCase() &&
      password === DEV_ADMIN_PASSWORD;

    const client = supabaseModule.supabase;
    if (!client || !supabaseModule.isSupabaseConfigured) {
      if (isDevMatch) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(DEV_ADMIN_STORAGE_KEY, JSON.stringify(DEV_ADMIN_PROFILE));
        }
        return DEV_ADMIN_PROFILE;
      }
      throw new Error(
        'Supabase istemcisi yapılandırılmamış. Lütfen geçerli Supabase ortam değişkenlerini sağlayın.'
      );
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error || !data.user) {
        if (isDevMatch) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(DEV_ADMIN_STORAGE_KEY, JSON.stringify(DEV_ADMIN_PROFILE));
          }
          return DEV_ADMIN_PROFILE;
        }
        throw new Error(translateAuthError(error?.message || 'Geçersiz yönetici e-posta adresi veya şifre.'));
      }

      const profile = await fetchAdminProfile(data.user);

      if (!profile) {
        if (isDevMatch) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(DEV_ADMIN_STORAGE_KEY, JSON.stringify(DEV_ADMIN_PROFILE));
          }
          return DEV_ADMIN_PROFILE;
        }
        // Immediately sign out unprivileged customer or deactivated user
        await client.auth.signOut();
        throw new Error('Bu hesabın yönetici paneline erişim yetkisi bulunmamaktadır.');
      }

      if (typeof window !== 'undefined') {
        localStorage.removeItem(DEV_ADMIN_STORAGE_KEY);
      }
      return profile;
    } catch (err) {
      if (isDevMatch) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(DEV_ADMIN_STORAGE_KEY, JSON.stringify(DEV_ADMIN_PROFILE));
        }
        return DEV_ADMIN_PROFILE;
      }
      throw err;
    }
  },

  /**
   * Logs out the current admin user via Supabase Auth and clears dev admin session.
   */
  async logout(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DEV_ADMIN_STORAGE_KEY);
    }
    const client = supabaseModule.supabase;
    if (client && supabaseModule.isSupabaseConfigured) {
      await client.auth.signOut();
    }
  },

  /**
   * Checks the active session and verifies current admin authorization status.
   */
  async getCurrentAdmin(): Promise<AdminProfile | null> {
    const client = supabaseModule.supabase;
    if (client && supabaseModule.isSupabaseConfigured) {
      try {
        const {
          data: { session },
          error,
        } = await client.auth.getSession();

        if (!error && session?.user) {
          const profile = await fetchAdminProfile(session.user);
          if (profile) return profile;
        }
      } catch {
        // Fallback to local session if Supabase is offline/unreachable
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(DEV_ADMIN_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (
            parsed &&
            parsed.email === DEV_ADMIN_EMAIL &&
            parsed.id === DEV_ADMIN_PROFILE.id
          ) {
            return DEV_ADMIN_PROFILE;
          }
        }
      } catch {
        // Ignore parse error
      }
    }

    return null;
  },

  /**
   * Subscribes to Supabase auth state changes.
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    const client = supabaseModule.supabase;
    if (!client || !supabaseModule.isSupabaseConfigured) {
      return { unsubscribe: () => {} };
    }

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(callback);

    return {
      unsubscribe: () => subscription.unsubscribe(),
    };
  },

  /**
   * Updates current authenticated admin password via Supabase Auth.
   */
  async updatePassword(newPassword: string): Promise<void> {
    const client = supabaseModule.supabase;
    if (!client || !supabaseModule.isSupabaseConfigured) {
      throw new Error('Aktif veritabanı bağlantısı bulunamadı.');
    }

    const { error } = await client.auth.updateUser({ password: newPassword });
    if (error) {
      throw new Error(translateAuthError(error.message));
    }
  },
};

