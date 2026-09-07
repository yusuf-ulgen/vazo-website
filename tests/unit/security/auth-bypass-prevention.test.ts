import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminAuthService } from '@/admin/auth/admin-auth-service';
import { customerAuthStore } from '@/shared/stores/customer-auth-store';
import * as supabaseModule from '@/shared/lib/supabase';
import { translateAuthError } from '@/shared/utils/auth-error-translator';
import { createMockSupabaseClient } from 'tests/mocks/supabase-mock';

describe('Phase 3.13 Auth Bypass Prevention & Security Contract', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('1. Valid real Supabase Admin works and receives AdminProfile from database RBAC', async () => {
    const mockClient = createMockSupabaseClient({
      admin_users: {
        data: [{ user_id: 'real-admin-uuid', role: 'super_admin', active: true }],
      },
    });

    mockClient.auth.signInWithPassword = vi.fn().mockResolvedValue({
      data: {
        user: { id: 'real-admin-uuid', email: 'admin@vazostudio.com' },
        session: { access_token: 'valid-jwt' },
      },
      error: null,
    });

    vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
    vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

    const profile = await adminAuthService.login('admin@vazostudio.com', 'RealAdminPass123!');
    expect(profile).toEqual({
      id: 'real-admin-uuid',
      email: 'admin@vazostudio.com',
      role: 'super_admin',
      active: true,
    });
  });

  it('2. Normal customer without admin_users record is denied Admin access and signed out', async () => {
    const mockClient = createMockSupabaseClient({
      admin_users: { data: [] },
    });

    mockClient.auth.signInWithPassword = vi.fn().mockResolvedValue({
      data: {
        user: { id: 'customer-uuid-44', email: 'customer@gmail.com' },
        session: { access_token: 'customer-jwt' },
      },
      error: null,
    });
    mockClient.auth.signOut = vi.fn().mockResolvedValue({ error: null });

    vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
    vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

    await expect(
      adminAuthService.login('customer@gmail.com', 'CustomerPass123!')
    ).rejects.toThrow('Bu hesabın yönetici paneline erişim yetkisi bulunmamaktadır.');

    expect(mockClient.auth.signOut).toHaveBeenCalled();
  });

  it('3. Inactive Admin (active: false) is denied Admin access and signed out', async () => {
    const mockClient = createMockSupabaseClient({
      admin_users: {
        data: [{ user_id: 'deactivated-uuid', role: 'admin', active: false }],
      },
    });

    mockClient.auth.signInWithPassword = vi.fn().mockResolvedValue({
      data: {
        user: { id: 'deactivated-uuid', email: 'suspended@vazostudio.com' },
        session: { access_token: 'suspended-jwt' },
      },
      error: null,
    });
    mockClient.auth.signOut = vi.fn().mockResolvedValue({ error: null });

    vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
    vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

    await expect(
      adminAuthService.login('suspended@vazostudio.com', 'SuspendedPass123!')
    ).rejects.toThrow('Bu hesabın yönetici paneline erişim yetkisi bulunmamaktadır.');

    expect(mockClient.auth.signOut).toHaveBeenCalled();
  });

  it('4. Invalid password is denied with translated Turkish error', async () => {
    const mockClient = createMockSupabaseClient({});
    mockClient.auth.signInWithPassword = vi.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    });

    vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
    vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

    await expect(
      adminAuthService.login('admin@vazostudio.com', 'WrongPass!')
    ).rejects.toThrow('Geçersiz e-posta adresi veya şifre.');
  });

  it('5. Supabase missing or unconfigured fails closed for admin login', async () => {
    vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(false);
    vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(null);

    await expect(
      adminAuthService.login('admin@vazostudio.com', 'Pass123!')
    ).rejects.toThrow('Supabase istemcisi yapılandırılmamış');
  });

  it('6. Fake localStorage session key cannot grant admin authorization', async () => {
    localStorage.setItem(
      'vazo_embedded_admin_session',
      JSON.stringify({
        id: 'fake-id',
        email: 'admin@vazostudio.com',
        role: 'super_admin',
        active: true,
      })
    );

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

  it('7. Legitimate Supabase session is restored on getCurrentAdmin()', async () => {
    const mockClient = createMockSupabaseClient({
      admin_users: {
        data: [{ user_id: 'session-user-1', role: 'admin', active: true }],
      },
    });

    mockClient.auth.getSession = vi.fn().mockResolvedValue({
      data: {
        session: {
          user: { id: 'session-user-1', email: 'verified@vazo.com' },
        },
      },
      error: null,
    });

    vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
    vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

    const profile = await adminAuthService.getCurrentAdmin();
    expect(profile).toEqual({
      id: 'session-user-1',
      email: 'verified@vazo.com',
      role: 'admin',
      active: true,
    });
  });

  it('8. Logout removes session via Supabase auth.signOut', async () => {
    const mockClient = createMockSupabaseClient({});
    mockClient.auth.signOut = vi.fn().mockResolvedValue({ error: null });

    vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
    vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

    await adminAuthService.logout();
    expect(mockClient.auth.signOut).toHaveBeenCalled();
  });

  it('9. Email address matching alone never grants wholesale or admin status in customer auth', async () => {
    const mockUser = {
      id: 'usr-admin-attempt',
      email: 'admin@vazostudio.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };

    const mockSignInWithPassword = vi.fn().mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock PostgreSQL returning NO admin_users record and NO wholesale profile
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'admin_users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      };
    });

    vi.spyOn(supabaseModule, 'getSupabase').mockReturnValue({
      auth: {
        signInWithPassword: mockSignInWithPassword,
      },
      from: mockFrom,
    } as unknown as ReturnType<typeof supabaseModule.getSupabase>);

    vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);

    await customerAuthStore.signInWithPassword('admin@vazostudio.com', 'SomePassword123!');

    const state = customerAuthStore.getState();
    expect(state.user?.email).toBe('admin@vazostudio.com');
    expect(state.isAdmin).toBe(false);
    expect(state.profile).toBeNull();
  });

  it('10. Customer production auth fails closed when Supabase is unconfigured', async () => {
    vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(false);

    await expect(
      customerAuthStore.signInWithPassword('customer@example.com', 'Pass12345!')
    ).rejects.toThrow('Canlı ortamda kimlik doğrulama için Supabase yapılandırması zorunludur.');
  });

  it('11. Turkish error translator converts standard Supabase errors correctly', () => {
    expect(translateAuthError('Invalid login credentials')).toBe('Geçersiz e-posta adresi veya şifre.');
    expect(translateAuthError('Email not confirmed')).toContain('doğrulanmamış');
    expect(translateAuthError('Email rate limit exceeded')).toContain('fazla deneme');
    expect(translateAuthError('Password should be at least 6 characters')).toContain('en az 6 karakter');
  });
});
