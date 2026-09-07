import type { User } from '@supabase/supabase-js';

export const MOCK_STORAGE_KEY = 'vazo_mock_customer_user';

/**
 * Determines whether the current client is executing in a remote preview environment
 * where a live Supabase backend is unconfigured or unreachable.
 */
export function isRemoteEnvironmentWithoutLiveSupabase(): boolean {
  if (typeof window === 'undefined') return false;
  const rawUrl = import.meta.env.VITE_SUPABASE_URL;
  const isLocalhostHost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '0.0.0.0';

  if (
    !isLocalhostHost &&
    (!rawUrl || rawUrl.includes('127.0.0.1') || rawUrl.includes('localhost'))
  ) {
    return true;
  }
  return false;
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

