import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminAuthService } from '@/admin/auth/admin-auth-service';
import * as supabaseModule from '@/shared/lib/supabase';
import { createMockSupabaseClient } from 'tests/mocks/supabase-mock';

describe('Admin Auth Service (Phase 2.2 Supabase Auth & RBAC)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('authenticates admin with valid credentials and active admin_users record', async () => {
    const mockClient = createMockSupabaseClient({
      admin_users: {
        data: [{ user_id: 'admin-uuid-1', role: 'super_admin', active: true }],
      },
    });

    mockClient.auth.signInWithPassword = vi.fn().mockResolvedValue({
      data: {
        user: { id: 'admin-uuid-1', email: 'superadmin@vazostudio.com' },
        session: { access_token: 'valid-jwt-token' },
      },
      error: null,
    });

    vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
    vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

    const profile = await adminAuthService.login('superadmin@vazostudio.com', 'SecurePassword123');

    expect(profile).toEqual({
      id: 'admin-uuid-1',
      email: 'superadmin@vazostudio.com',
      role: 'super_admin',
      active: true,
    });
    expect(mockClient.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'superadmin@vazostudio.com',
      password: 'SecurePassword123',
    });
  });

  it('rejects login when Supabase credentials are invalid', async () => {
    const mockClient = createMockSupabaseClient({});
    mockClient.auth.signInWithPassword = vi.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    });

    vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
    vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

    await expect(
      adminAuthService.login('wrong@vazostudio.com', 'BadPass')
    ).rejects.toThrow('Invalid login credentials');
  });

  it('denies access and signs out if user is valid in auth.users but absent from public.admin_users (RBAC denial)', async () => {
    const mockClient = createMockSupabaseClient({
      admin_users: {
        data: [], // No admin record for this customer
      },
    });

    mockClient.auth.signInWithPassword = vi.fn().mockResolvedValue({
      data: {
        user: { id: 'customer-uuid-2', email: 'customer@gmail.com' },
        session: { access_token: 'customer-jwt-token' },
      },
      error: null,
    });
    mockClient.auth.signOut = vi.fn().mockResolvedValue({ error: null });

    vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
    vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

    await expect(
      adminAuthService.login('customer@gmail.com', 'CustomerPass123')
    ).rejects.toThrow('Bu hesabın yönetici paneline erişim yetkisi bulunmamaktadır.');

    expect(mockClient.auth.signOut).toHaveBeenCalled();
  });

  it('denies access and signs out if admin account is deactivated (active: false)', async () => {
    const mockClient = createMockSupabaseClient({
      admin_users: {
        data: [{ user_id: 'deactivated-uuid-3', role: 'admin', active: false }],
      },
    });

    mockClient.auth.signInWithPassword = vi.fn().mockResolvedValue({
      data: {
        user: { id: 'deactivated-uuid-3', email: 'fired@vazostudio.com' },
        session: { access_token: 'jwt-token' },
      },
      error: null,
    });
    mockClient.auth.signOut = vi.fn().mockResolvedValue({ error: null });

    vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
    vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

    await expect(
      adminAuthService.login('fired@vazostudio.com', 'Pass123')
    ).rejects.toThrow('Bu hesabın yönetici paneline erişim yetkisi bulunmamaktadır.');

    expect(mockClient.auth.signOut).toHaveBeenCalled();
  });

  it('restores active admin profile on getCurrentAdmin', async () => {
    const mockClient = createMockSupabaseClient({
      admin_users: {
        data: [{ user_id: 'admin-uuid-4', role: 'admin', active: true }],
      },
    });

    mockClient.auth.getSession = vi.fn().mockResolvedValue({
      data: {
        session: {
          user: { id: 'admin-uuid-4', email: 'session-admin@vazo.com' },
        },
      },
      error: null,
    });

    vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
    vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

    const profile = await adminAuthService.getCurrentAdmin();
    expect(profile).toEqual({
      id: 'admin-uuid-4',
      email: 'session-admin@vazo.com',
      role: 'admin',
      active: true,
    });
  });

  it('returns null on getCurrentAdmin when no session exists', async () => {
    const mockClient = createMockSupabaseClient({});
    mockClient.auth.getSession = vi.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    });

    vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
    vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

    const profile = await adminAuthService.getCurrentAdmin();
    expect(profile).toBeNull();
  });

  it('logs out via Supabase auth.signOut', async () => {
    const mockClient = createMockSupabaseClient({});
    mockClient.auth.signOut = vi.fn().mockResolvedValue({ error: null });

    vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
    vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

    await adminAuthService.logout();
    expect(mockClient.auth.signOut).toHaveBeenCalled();
  });

  it('throws when login is attempted without configured Supabase client', async () => {
    vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(false);
    vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(null);

    await expect(
      adminAuthService.login('admin@vazo.com', 'pass')
    ).rejects.toThrow('Supabase istemcisi yapılandırılmamış');
  });
});
