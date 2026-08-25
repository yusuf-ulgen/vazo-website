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

export const adminAuthService = {
  /**
   * Signs in an admin user using Supabase Auth and validates database RBAC privileges.
   */
  async login(email: string, password: string): Promise<AdminProfile> {
    const client = supabaseModule.supabase;
    if (!client || !supabaseModule.isSupabaseConfigured) {
      throw new Error(
        'Supabase istemcisi yapılandırılmamış. Lütfen geçerli Supabase ortam değişkenlerini sağlayın.'
      );
    }

    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error || !data.user) {
      throw new Error(error?.message || 'Geçersiz yönetici e-posta adresi veya şifre.');
    }

    const profile = await fetchAdminProfile(data.user);

    if (!profile) {
      // Immediately sign out unprivileged customer or deactivated user
      await client.auth.signOut();
      throw new Error('Bu hesabın yönetici paneline erişim yetkisi bulunmamaktadır.');
    }

    return profile;
  },

  /**
   * Logs out the current admin user and clears the Supabase session.
   */
  async logout(): Promise<void> {
    const client = supabaseModule.supabase;
    if (client && supabaseModule.isSupabaseConfigured) {
      await client.auth.signOut();
    }
  },

  /**
   * Checks the active Supabase session and verifies current admin authorization status.
   */
  async getCurrentAdmin(): Promise<AdminProfile | null> {
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

