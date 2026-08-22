import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authStore, isEmailAdmin } from '@/shared/stores/auth-store';

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear();
    authStore.logout();
    vi.restoreAllMocks();
  });

  it('identifies admin emails accurately', () => {
    expect(isEmailAdmin('adminvazo@gmail.com')).toBe(true);
    expect(isEmailAdmin('admin@vazostudio.com')).toBe(true);
    expect(isEmailAdmin('admin@vazo.com')).toBe(true);
    expect(isEmailAdmin('admin@admin.com')).toBe(true);
    expect(isEmailAdmin('yusuf@vazostudio.com')).toBe(true);
    expect(isEmailAdmin('musteri@gmail.com')).toBe(false);
  });

  it('logs in as admin with valid credentials', () => {
    const user = authStore.login('adminvazo@gmail.com', 'LocalDev123');
    expect(user.role).toBe('admin');
    expect(user.email).toBe('adminvazo@gmail.com');
    expect(authStore.getUser()).toEqual(user);
  });

  it('throws error when admin password is wrong', () => {
    expect(() => {
      authStore.login('adminvazo@gmail.com', 'WrongPassword');
    }).toThrow('Yönetici şifresi hatalı.');
  });

  it('logs in as customer for standard emails', () => {
    const user = authStore.login('musteri@example.com', 'Secret123', 'Ayşe Demir');
    expect(user.role).toBe('customer');
    expect(user.name).toBe('Ayşe Demir');
  });

  it('supports google login', () => {
    const user = authStore.loginWithGoogle();
    expect(user.role).toBe('customer');
    expect(user.email).toBe('Misafir Oturumu');
  });

  it('logs out and clears session', () => {
    authStore.login('test@test.com', '1234');
    expect(authStore.getUser()).not.toBeNull();
    authStore.logout();
    expect(authStore.getUser()).toBeNull();
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
});
