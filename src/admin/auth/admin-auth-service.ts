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
    const storedPassword =
      typeof window !== 'undefined' ? localStorage.getItem('vazo_admin_pwd') : null;
    const isDevMatch =
      normalizedEmail === DEV_ADMIN_EMAIL.toLowerCase() &&
      (password === DEV_ADMIN_PASSWORD || (Boolean(storedPassword) && password === storedPassword));

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

    // When Supabase is configured, live authentication against auth.users is authoritative.
    // The old/dev password cannot bypass live authentication once updated.
    const { data, error } = await client.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error || !data.user) {
      throw new Error(translateAuthError(error?.message || 'Geçersiz yönetici e-posta adresi veya şifre.'));
    }

    const profile = await fetchAdminProfile(data.user);

    if (!profile) {
      // Immediately sign out unprivileged customer or deactivated user
      await client.auth.signOut();
      throw new Error('Bu hesabın yönetici paneline erişim yetkisi bulunmamaktadır.');
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem(DEV_ADMIN_STORAGE_KEY);
      localStorage.removeItem('vazo_admin_pwd');
    }
    return profile;
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

  /**
   * Verifies current password against the database / auth provider and updates the password.
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const currentAdmin = await this.getCurrentAdmin();
    if (!currentAdmin?.email) {
      throw new Error('Oturum süreniz doldu. Güvenliğiniz için lütfen yeniden giriş yapınız.');
    }

    const client = supabaseModule.supabase;
    const isDevAdmin = currentAdmin.email.toLowerCase() === DEV_ADMIN_EMAIL.toLowerCase();

    if (client && supabaseModule.isSupabaseConfigured) {
      // 1. Authoritative RPC update directly in PostgreSQL auth.users with bcrypt cost 10
      try {
        const { data: rpcData, error: rpcError } = await client.rpc('admin_change_own_password', {
          p_current_password: currentPassword,
          p_new_password: newPassword,
        });

        if (!rpcError && rpcData?.success) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('vazo_admin_pwd');
            localStorage.removeItem(DEV_ADMIN_STORAGE_KEY);
          }
          // Refresh GoTrue session with new password
          await client.auth.signInWithPassword({
            email: currentAdmin.email,
            password: newPassword,
          }).catch(() => {});
          return;
        }

        if (rpcError) {
          const msg = rpcError.message || '';
          if (msg.includes('Güncel şifreniz uyuşmuyor')) {
            throw new Error('Güncel şifreniz uyuşmuyor.');
          }
          if (msg.includes('en az 6 karakter')) {
            throw new Error('Yeni şifre en az 6 karakter uzunluğunda olmalıdır.');
          }
          throw new Error(translateAuthError(msg));
        }
      } catch (err: unknown) {
        if (
          err instanceof Error &&
          (err.message === 'Güncel şifreniz uyuşmuyor.' || err.message.includes('en az 6 karakter'))
        ) {
          throw err;
        }
      }

      // 2. GoTrue auth verification fallback
      const { data, error: signInError } = await client.auth.signInWithPassword({
        email: currentAdmin.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('Güncel şifreniz uyuşmuyor.');
      }

      if (data?.session || data?.user) {
        const { error: updateError } = await client.auth.updateUser({ password: newPassword });
        if (updateError) {
          throw new Error(translateAuthError(updateError.message));
        }
        if (typeof window !== 'undefined') {
          localStorage.removeItem('vazo_admin_pwd');
          localStorage.removeItem(DEV_ADMIN_STORAGE_KEY);
        }
        return;
      }
    }

    // Fallback in offline / dev mock environment
    const storedPwd = typeof window !== 'undefined' ? localStorage.getItem('vazo_admin_pwd') : null;
    if (isDevAdmin) {
      if (currentPassword !== DEV_ADMIN_PASSWORD && currentPassword !== storedPwd) {
        throw new Error('Güncel şifreniz uyuşmuyor.');
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('vazo_admin_pwd', newPassword);
      }
      return;
    }

    throw new Error('Oturum süreniz doldu. Güvenliğiniz için lütfen yeniden giriş yapınız.');
  },
};

