import type { User } from '@supabase/supabase-js';
import type { CustomerProfile } from '@/entities/customer/types';

export type AdminRole = 'admin' | 'super_admin';

export interface AdminProfile {
  id: string;
  email: string;
  role: AdminRole;
  active: boolean;
}

export const EMBEDDED_ADMIN_CREDENTIALS = {
  email: 'admin@vazostudio.com',
  password: 'VazoAdmin2026!',
};

export const EMBEDDED_ADMIN_PROFILE: AdminProfile = {
  id: 'a0000000-0000-0000-0000-000000000001',
  email: 'admin@vazostudio.com',
  role: 'super_admin',
  active: true,
};

export const EMBEDDED_ADMIN_SESSION_KEY = 'vazo_embedded_admin_session';

/**
 * Checks if provided email and password match the embedded administrator credentials.
 */
export function isEmbeddedAdminCredentials(email: string, password: string): boolean {
  if (!email || !password) return false;
  return (
    email.trim().toLowerCase() === EMBEDDED_ADMIN_CREDENTIALS.email &&
    password === EMBEDDED_ADMIN_CREDENTIALS.password
  );
}

/**
 * Checks if an email belongs to the administrator account.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === EMBEDDED_ADMIN_CREDENTIALS.email;
}

/**
 * Constructs a mock customer User entity for the administrator.
 */
export function createAdminCustomerUser(): User {
  return {
    id: EMBEDDED_ADMIN_PROFILE.id,
    email: EMBEDDED_ADMIN_CREDENTIALS.email,
    app_metadata: { provider: 'email', role: 'super_admin' },
    user_metadata: {
      full_name: 'Vazo Studio Admin',
      name: 'Vazo Studio Admin',
      role: 'super_admin',
    },
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00.000Z',
  } as unknown as User;
}

/**
 * Default customer profile for the administrator.
 */
export const ADMIN_CUSTOMER_PROFILE: CustomerProfile = {
  user_id: EMBEDDED_ADMIN_PROFILE.id,
  first_name: 'Vazo Studio',
  last_name: 'Admin',
  phone: null,
  customer_type: 'wholesale',
  wholesale_approved_at: '2026-01-01T00:00:00.000Z',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

