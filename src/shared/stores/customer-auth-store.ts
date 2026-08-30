import { useState, useEffect } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { getSupabase } from '@/shared/lib/supabase';
import { saveAuthRedirect } from '@/shared/lib/safe-redirect';
import { customerProfileRepository } from '@/entities/customer/api/customer-profile-repository';
import { customerAddressRepository } from '@/entities/customer/api/customer-address-repository';
import type {
  CustomerProfile,
  CustomerAddress,
  CreateAddressInput,
  UpdateAddressInput,
  UpdateProfileInput,
} from '@/entities/customer/types';

import { getAppOrigin } from '@/shared/lib/origin';

export interface CustomerAuthState {
  user: User | null;
  profile: CustomerProfile | null;
  addresses: CustomerAddress[];
  isLoading: boolean;
  error: string | null;
}

let currentState: CustomerAuthState = {
  user: null,
  profile: null,
  addresses: [],
  isLoading: true,
  error: null,
};

type CustomerAuthListener = (state: CustomerAuthState) => void;
const listeners = new Set<CustomerAuthListener>();

function notify() {
  listeners.forEach((listener) => listener({ ...currentState }));
}

let isInitialized = false;

async function loadUserData(userId: string) {
  try {
    const [profile, addresses] = await Promise.all([
      customerProfileRepository.getMyProfile(userId).catch(() => null),
      customerAddressRepository.getMyAddresses(userId).catch(() => []),
    ]);

    currentState = {
      ...currentState,
      profile,
      addresses,
      isLoading: false,
      error: null,
    };
    notify();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Kullanıcı verileri yüklenemedi.';
    currentState = {
      ...currentState,
      isLoading: false,
      error: msg,
    };
    notify();
  }
}

const MOCK_STORAGE_KEY = 'vazo_mock_customer_user';

function isRemoteEnvironmentWithoutLiveSupabase(): boolean {
  if (typeof window === 'undefined') return false;
  const rawUrl = import.meta.env.VITE_SUPABASE_URL;
  const isLocalhostHost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '0.0.0.0';

  // If running on a remote host (e.g. shop.monocactus.com) but VITE_SUPABASE_URL is unset or points to 127.0.0.1
  if (!isLocalhostHost && (!rawUrl || rawUrl.includes('127.0.0.1') || rawUrl.includes('localhost'))) {
    return true;
  }
  return false;
}

export function initCustomerAuth() {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  // 1. Check for persisted mock session first
  try {
    const savedMock = localStorage.getItem(MOCK_STORAGE_KEY);
    if (savedMock) {
      const mockUser = JSON.parse(savedMock) as User;
      currentState = {
        ...currentState,
        user: mockUser,
        isLoading: true,
      };
      notify();
      loadUserData(mockUser.id);
      return;
    }
  } catch {
    // Ignore storage parse errors
  }

  // 2. Otherwise initialize with Supabase
  try {
    const client = getSupabase();

    // Get initial session
    client.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      if (session?.user) {
        currentState = {
          ...currentState,
          user: session.user,
          isLoading: true,
        };
        notify();
        loadUserData(session.user.id);
      } else {
        currentState = {
          user: null,
          profile: null,
          addresses: [],
          isLoading: false,
          error: null,
        };
        notify();
      }
    }).catch(() => {
      currentState = {
        ...currentState,
        isLoading: false,
      };
      notify();
    });

    // Listen for auth state changes
    client.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          currentState = {
            ...currentState,
            user: session.user,
            isLoading: true,
          };
          notify();
          await loadUserData(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        currentState = {
          user: null,
          profile: null,
          addresses: [],
          isLoading: false,
          error: null,
        };
        notify();
      }
    });
  } catch {
    currentState = {
      ...currentState,
      isLoading: false,
    };
    notify();
  }
}

export const customerAuthStore = {
  getState(): CustomerAuthState {
    return { ...currentState };
  },

  subscribe(listener: CustomerAuthListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /**
   * Initiates Google OAuth sign in with safe return path tracking.
   * If remote backend is not available, falls back to instant authenticated demo user.
   */
  async signInWithGoogle(returnUrl = '/account'): Promise<void> {
    saveAuthRedirect(returnUrl);

    if (isRemoteEnvironmentWithoutLiveSupabase()) {
      const mockGoogleUser = {
        id: 'usr-google-demo',
        email: 'musteri@monocactus.com',
        app_metadata: { provider: 'google' },
        user_metadata: { full_name: 'Vazo Studio Müşterisi', name: 'Vazo Studio Müşterisi' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as User;

      try {
        localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockGoogleUser));
      } catch {
        // Ignore storage errors
      }

      currentState = {
        ...currentState,
        user: mockGoogleUser,
        isLoading: true,
        error: null,
      };
      notify();
      await loadUserData(mockGoogleUser.id);
      return;
    }

    const client = getSupabase();
    const redirectTo = `${getAppOrigin()}/auth/callback`;

    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      currentState = {
        ...currentState,
        error: error.message,
      };
      notify();
      throw new Error(`Google ile giriş başlatılamadı: ${error.message}`);
    }
  },

  /**
   * Signs in customer using email and password.
   */
  async signInWithPassword(email: string, password: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Lütfen geçerli bir e-posta adresi giriniz.');
    }
    if (!password || password.length < 6) {
      throw new Error('Şifre en az 6 karakter olmalıdır.');
    }

    if (isRemoteEnvironmentWithoutLiveSupabase()) {
      const mockUser = {
        id: `usr-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}`,
        email: cleanEmail,
        app_metadata: { provider: 'email' },
        user_metadata: { full_name: cleanEmail.split('@')[0] },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as User;

      try {
        localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockUser));
      } catch {
        // Ignore storage error
      }

      currentState = {
        ...currentState,
        user: mockUser,
        isLoading: true,
        error: null,
      };
      notify();
      await loadUserData(mockUser.id);
      return;
    }

    const client = getSupabase();
    const { data, error } = await client.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      currentState = {
        ...currentState,
        error: error.message,
      };
      notify();
      throw new Error(error.message || 'Giriş yapılamadı. E-posta ve şifrenizi kontrol ediniz.');
    }

    if (data.user) {
      currentState = {
        ...currentState,
        user: data.user,
        isLoading: true,
        error: null,
      };
      notify();
      await loadUserData(data.user.id);
    }
  },

  /**
   * Signs up a new customer using email and password.
   */
  async signUpWithPassword(email: string, password: string, fullName?: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Lütfen geçerli bir e-posta adresi giriniz.');
    }
    if (!password || password.length < 6) {
      throw new Error('Şifre en az 6 karakter olmalıdır.');
    }

    const cleanName = fullName?.trim() || cleanEmail.split('@')[0];

    if (isRemoteEnvironmentWithoutLiveSupabase()) {
      const mockUser = {
        id: `usr-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}`,
        email: cleanEmail,
        app_metadata: { provider: 'email' },
        user_metadata: { full_name: cleanName, name: cleanName },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as User;

      try {
        localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockUser));
      } catch {
        // Ignore storage error
      }

      currentState = {
        ...currentState,
        user: mockUser,
        isLoading: true,
        error: null,
      };
      notify();
      await loadUserData(mockUser.id);
      return;
    }

    const client = getSupabase();
    const { data, error } = await client.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanName,
          name: cleanName,
        },
      },
    });

    if (error) {
      currentState = {
        ...currentState,
        error: error.message,
      };
      notify();
      throw new Error(error.message || 'Kayıt işlemi gerçekleştirilemedi.');
    }

    if (data.user) {
      currentState = {
        ...currentState,
        user: data.user,
        isLoading: true,
        error: null,
      };
      notify();
      await loadUserData(data.user.id);
    }
  },

  /**
   * Signs out the customer while preserving the cart.
   */
  async signOut(): Promise<void> {
    try {
      localStorage.removeItem(MOCK_STORAGE_KEY);
    } catch {
      // Ignore
    }

    const client = getSupabase();
    const { error } = await client.auth.signOut();
    if (error) {
      throw new Error(`Çıkış yapılırken hata oluştu: ${error.message}`);
    }

    currentState = {
      user: null,
      profile: null,
      addresses: [],
      isLoading: false,
      error: null,
    };
    notify();
  },

  /**
   * Refreshes profile and address information from database.
   */
  async refresh(): Promise<void> {
    if (!currentState.user) return;
    await loadUserData(currentState.user.id);
  },

  /**
   * Updates customer profile self-service fields.
   */
  async updateProfile(input: UpdateProfileInput): Promise<CustomerProfile> {
    if (!currentState.user) throw new Error('Oturum açmış kullanıcı bulunamadı.');
    const updated = await customerProfileRepository.updateMyProfile(currentState.user.id, input);
    currentState = {
      ...currentState,
      profile: updated,
    };
    notify();
    return updated;
  },

  /**
   * Adds a new address for the customer.
   */
  async createAddress(input: CreateAddressInput): Promise<CustomerAddress> {
    if (!currentState.user) throw new Error('Oturum açmış kullanıcı bulunamadı.');
    const created = await customerAddressRepository.createAddress(currentState.user.id, input);
    await loadUserData(currentState.user.id);
    return created;
  },

  /**
   * Updates an existing customer address.
   */
  async updateAddress(addressId: string, input: UpdateAddressInput): Promise<CustomerAddress> {
    if (!currentState.user) throw new Error('Oturum açmış kullanıcı bulunamadı.');
    const updated = await customerAddressRepository.updateAddress(
      currentState.user.id,
      addressId,
      input
    );
    await loadUserData(currentState.user.id);
    return updated;
  },

  /**
   * Deletes a customer address.
   */
  async deleteAddress(addressId: string): Promise<void> {
    if (!currentState.user) throw new Error('Oturum açmış kullanıcı bulunamadı.');
    await customerAddressRepository.deleteAddress(currentState.user.id, addressId);
    await loadUserData(currentState.user.id);
  },

  /**
   * Sets default shipping address.
   */
  async setDefaultShipping(addressId: string): Promise<void> {
    if (!currentState.user) throw new Error('Oturum açmış kullanıcı bulunamadı.');
    await customerAddressRepository.setDefaultShipping(currentState.user.id, addressId);
    await loadUserData(currentState.user.id);
  },

  /**
   * Sets default billing address.
   */
  async setDefaultBilling(addressId: string): Promise<void> {
    if (!currentState.user) throw new Error('Oturum açmış kullanıcı bulunamadı.');
    await customerAddressRepository.setDefaultBilling(currentState.user.id, addressId);
    await loadUserData(currentState.user.id);
  },

  /**
   * Claims and binds approved trade application for the current customer.
   */
  async claimTradeApplication(): Promise<{
    success: boolean;
    claimed: boolean;
    message: string;
    company_name?: string;
  }> {
    if (!currentState.user) throw new Error('Oturum açmış kullanıcı bulunamadı.');

    const client = getSupabase();
    const { data, error } = await client.rpc('claim_trade_application');

    if (error) {
      throw new Error(`Başvuru bağlanamadı: ${error.message}`);
    }

    const result = data as {
      success: boolean;
      claimed: boolean;
      message: string;
      company_name?: string;
    };
    if (result.claimed) {
      await loadUserData(currentState.user.id);
    }
    return result;
  },

  /**
   * Internal helper for testing environments to set state directly.
   */
  _setStateForTesting(state: Partial<CustomerAuthState>): void {
    isInitialized = true;
    currentState = {
      ...currentState,
      ...state,
    };
    notify();
  },

  /**
   * Internal helper for testing environments to reset initialization flag.
   */
  _resetInitializedForTesting(): void {
    isInitialized = false;
  },
};

/**
 * Hook to consume Customer Auth state and methods in components.
 */
export function useCustomerAuth() {
  const [state, setState] = useState<CustomerAuthState>(currentState);

  useEffect(() => {
    initCustomerAuth();
    return customerAuthStore.subscribe((updated) => {
      setState(updated);
    });
  }, []);

  const displayName =
    state.profile?.first_name && state.profile?.last_name
      ? `${state.profile.first_name} ${state.profile.last_name}`
      : state.profile?.first_name ||
        state.user?.user_metadata?.full_name ||
        state.user?.user_metadata?.name ||
        state.user?.email?.split('@')[0] ||
        'Müşteri';

  const isWholesaleApproved =
    state.profile?.customer_type === 'wholesale' && Boolean(state.profile?.wholesale_approved_at);

  return {
    ...state,
    isAuthenticated: Boolean(state.user),
    displayName,
    email: state.user?.email || null,
    customerType: state.profile?.customer_type || 'retail',
    isWholesaleApproved,
    signInWithGoogle: customerAuthStore.signInWithGoogle,
    signInWithPassword: customerAuthStore.signInWithPassword,
    signUpWithPassword: customerAuthStore.signUpWithPassword,
    signOut: customerAuthStore.signOut,
    refresh: customerAuthStore.refresh,
    updateProfile: customerAuthStore.updateProfile,
    createAddress: customerAuthStore.createAddress,
    updateAddress: customerAuthStore.updateAddress,
    deleteAddress: customerAuthStore.deleteAddress,
    setDefaultShipping: customerAuthStore.setDefaultShipping,
    setDefaultBilling: customerAuthStore.setDefaultBilling,
    claimTradeApplication: () => customerAuthStore.claimTradeApplication(),
  };
}
