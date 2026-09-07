import type { User } from '@supabase/supabase-js';
import type { CustomerProfile } from '@/entities/customer/types';

export const MOCK_STORAGE_KEY = 'vazo_mock_customer_user';

/**
 * Determines whether mock customer authentication (in-memory/demo users) is permitted.
 * In a deployed production origin or when live mode is active, mock customer auth
 * is strictly prohibited.
 */
export function isCustomerAuthMockAllowed(params?: {
  isProd?: boolean;
  hostname?: string;
  mockExplicit?: boolean;
}): boolean {
  if (typeof window === 'undefined') return false;

  const isProd =
    params?.isProd !== undefined
      ? params.isProd
      : Boolean(import.meta.env.PROD || import.meta.env.MODE === 'production');

  const hostname =
    params?.hostname !== undefined ? params.hostname : window.location.hostname;

  const isLocalHost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '';

  // In production builds or on remote origins, customer mock auth must NEVER exist
  if (isProd || !isLocalHost) {
    return false;
  }

  const mockExplicit =
    params?.mockExplicit !== undefined
      ? params.mockExplicit
      : import.meta.env.VITE_ENABLE_MOCK_DATA === 'true';

  return Boolean(mockExplicit && isLocalHost);
}

/**
 * Determines whether the customer profile is an authorized, approved wholesale customer.
 */
export function isWholesaleApprovedCustomer(profile?: CustomerProfile | null): boolean {
  if (!profile) return false;
  return profile.customer_type === 'wholesale' && Boolean(profile.wholesale_approved_at);
}

/**
 * Backwards-compatible alias for demo mode checks, gated by mock customer authorization.
 */
export function isRemoteEnvironmentWithoutLiveSupabase(): boolean {
  return isCustomerAuthMockAllowed();
}

/**
 * Creates a mock Supabase User object for offline or demo customer sessions.
 */
export function createMockCustomerUser(email: string, fullName?: string, provider = 'email'): User {
  const cleanEmail = email.trim().toLowerCase();
  const name = fullName?.trim() || cleanEmail.split('@')[0];
  return {
    id: `usr-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}`,
    email: cleanEmail,
    app_metadata: { provider },
    user_metadata: { full_name: name, name },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as unknown as User;
}

/**
 * Attempts to retrieve a persisted mock session from localStorage.
 */
export function getPersistedMockCustomerUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(MOCK_STORAGE_KEY);
    if (!saved) return null;
    return JSON.parse(saved) as User;
  } catch {
    return null;
  }
}

/**
 * Persists a mock customer user into localStorage.
 */
export function setPersistedMockCustomerUser(user: User): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Ignore storage quota or disabled errors
  }
}

/**
 * Clears persisted mock session from localStorage.
 */
export function clearPersistedMockCustomerUser(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(MOCK_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Persists the embedded admin session for admin panel synchronization.
 */
export function persistEmbeddedAdminSession(profile: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('vazo_embedded_admin_session', JSON.stringify(profile));
  } catch {
    // Ignore
  }
}

