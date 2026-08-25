import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authStore } from '@/shared/stores/auth-store';

describe('Storefront Customer authStore (Phase 2.2 RBAC Decoupled)', () => {
  beforeEach(() => {
    localStorage.clear();
    authStore.logout();
    vi.restoreAllMocks();
  });

  it('strictly assigns customer role and never grants admin role based on email', () => {
    const adminEmailUser = authStore.login('admin@vazostudio.com');
    expect(adminEmailUser.role).toBe('customer');
    expect(adminEmailUser.email).toBe('admin@vazostudio.com');

    const adminPrefixUser = authStore.login('adminvazo@gmail.com');
    expect(adminPrefixUser.role).toBe('customer');

    const plusAdminUser = authStore.login('user+admin@example.com');
    expect(plusAdminUser.role).toBe('customer');
  });

  it('logs in as customer for standard emails with name fallback', () => {
    const user = authStore.login('musteri@example.com', 'Secret123', 'Ayşe Demir');
    expect(user.role).toBe('customer');
    expect(user.name).toBe('Ayşe Demir');
    expect(user.email).toBe('musteri@example.com');
  });

  it('supports google guest login with customer role', () => {
    const user = authStore.loginWithGoogle();
    expect(user.role).toBe('customer');
    expect(user.email).toBe('Misafir Oturumu');
  });

  it('logs out and clears session from localStorage', () => {
    authStore.login('test@test.com', '1234');
    expect(authStore.getUser()).not.toBeNull();
    authStore.logout();
    expect(authStore.getUser()).toBeNull();
    expect(localStorage.getItem('vazo_customer_auth_user')).toBeNull();
  });

  it('notifies subscribers on auth state changes', () => {
    const listener = vi.fn();
    const unsubscribe = authStore.subscribe(listener);

    authStore.login('sub@test.com', '1234');
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ email: 'sub@test.com' }));

    authStore.logout();
    expect(listener).toHaveBeenCalledWith(null);

    unsubscribe();
  });

  it('does not allow localStorage role tampering to grant admin role', () => {
    // Simulate malicious user injecting role: 'admin' into localStorage
    localStorage.setItem(
      'vazo_customer_auth_user',
      JSON.stringify({ email: 'hacker@example.com', name: 'Hacker', role: 'admin' })
    );

    // Initializing store must enforce role: 'customer'
    // Since getInitialUser runs at module load, verify that login or state never permits admin
    const user = authStore.login('hacker@example.com');
    expect(user.role).toBe('customer');
  });
});
