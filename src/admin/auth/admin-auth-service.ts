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

import {
  EMBEDDED_ADMIN_CREDENTIALS,
  EMBEDDED_ADMIN_PROFILE,
  EMBEDDED_ADMIN_SESSION_KEY,
} from '@/shared/constants/admin-credentials';
import { translateAuthError } from '@/shared/utils/auth-error-translator';

export {
  EMBEDDED_ADMIN_CREDENTIALS,
  EMBEDDED_ADMIN_PROFILE,
  EMBEDDED_ADMIN_SESSION_KEY,
};

export const adminAuthService = {
  /**
   * Signs in an admin user using Supabase Auth or fallback embedded credentials.
   */
  async login(email: string, password: string): Promise<AdminProfile> {
    const normalizedEmail = email.trim().toLowerCase();
    const isEmbeddedMatch =
      normalizedEmail === EMBEDDED_ADMIN_CREDENTIALS.email &&
      password === EMBEDDED_ADMIN_CREDENTIALS.password;

    const client = supabaseModule.supabase;
    if (!client || !supabaseModule.isSupabaseConfigured) {
      if (isEmbeddedMatch) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(EMBEDDED_ADMIN_SESSION_KEY, JSON.stringify(EMBEDDED_ADMIN_PROFILE));
        }
        return EMBEDDED_ADMIN_PROFILE;
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
        if (isEmbeddedMatch) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(EMBEDDED_ADMIN_SESSION_KEY, JSON.stringify(EMBEDDED_ADMIN_PROFILE));
          }
          return EMBEDDED_ADMIN_PROFILE;
        }
        throw new Error(translateAuthError(error?.message || 'Geçersiz yönetici e-posta adresi veya şifre.'));
      }

      const profile = await fetchAdminProfile(data.user);

      if (!profile) {
        if (isEmbeddedMatch) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(EMBEDDED_ADMIN_SESSION_KEY, JSON.stringify(EMBEDDED_ADMIN_PROFILE));
          }
          return EMBEDDED_ADMIN_PROFILE;
        }
        // Immediately sign out unprivileged customer or deactivated user
        await client.auth.signOut();
        throw new Error('Bu hesabın yönetici paneline erişim yetkisi bulunmamaktadır.');
      }

      if (typeof window !== 'undefined') {
        localStorage.removeItem(EMBEDDED_ADMIN_SESSION_KEY);
      }
      return profile;
    } catch (err) {
      if (isEmbeddedMatch) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(EMBEDDED_ADMIN_SESSION_KEY, JSON.stringify(EMBEDDED_ADMIN_PROFILE));
        }
        return EMBEDDED_ADMIN_PROFILE;
      }
      throw err;
    }
  },

  /**
   * Logs out the current admin user and clears both Supabase and embedded sessions.
   */
  async logout(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(EMBEDDED_ADMIN_SESSION_KEY);
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
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(EMBEDDED_ADMIN_SESSION_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.email === EMBEDDED_ADMIN_CREDENTIALS.email) {
            return EMBEDDED_ADMIN_PROFILE;
          }
        }
      } catch {
        // Ignore parse error
      }
    }

    const client = supabaseModule.supabase;
    if (!client || !supabaseModule.isSupabaseConfigured) {
      return null;
    }

    try {
      const {
        data: { session },
        error,
      } = await client.auth.getSession();

      if (error || !session?.user) {
        return null;
      }

      return await fetchAdminProfile(session.user);
    } catch {
      return null;
    }
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
};

