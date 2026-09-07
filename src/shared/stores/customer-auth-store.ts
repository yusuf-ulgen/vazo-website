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
import {
  EMBEDDED_ADMIN_PROFILE,
  EMBEDDED_ADMIN_SESSION_KEY,
  isEmbeddedAdminCredentials,
  isAdminEmail,
  createAdminCustomerUser,
  ADMIN_CUSTOMER_PROFILE,
} from '@/shared/constants/admin-credentials';
import { translateAuthError } from '@/shared/utils/auth-error-translator';
import {
  isRemoteEnvironmentWithoutLiveSupabase,
  createMockCustomerUser,
  getPersistedMockCustomerUser,
  setPersistedMockCustomerUser,
  clearPersistedMockCustomerUser,
  persistEmbeddedAdminSession,
} from './customer-auth-helpers';
import { customerAddressActions } from './customer-address-actions';

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

    const activeProfile =
      profile ||
      (isAdminEmail(currentState.user?.email) ? ADMIN_CUSTOMER_PROFILE : null);

    currentState = {
      ...currentState,
      profile: activeProfile,
      addresses,
      isLoading: false,
      error: null,
    };
    notify();
  } catch (err: unknown) {
    const msg = translateAuthError(err);
    currentState = {
      ...currentState,
      isLoading: false,
      error: msg,
    };
    notify();
  }
}

export function initCustomerAuth() {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  // 1. Check for persisted mock session first
  const mockUser = getPersistedMockCustomerUser();
  if (mockUser) {
    currentState = {
      ...currentState,
      user: mockUser,
      isLoading: true,
    };
    notify();
    loadUserData(mockUser.id);
    return;
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

function signInAsEmbeddedAdmin(): void {
  const adminUser = createAdminCustomerUser();
  setPersistedMockCustomerUser(adminUser);
  persistEmbeddedAdminSession(EMBEDDED_ADMIN_PROFILE);
  currentState = {
    ...currentState,
    user: adminUser,
    profile: ADMIN_CUSTOMER_PROFILE,
    isLoading: false,
    error: null,
  };
  notify();
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
   * Prompts the Google Account Chooser screen for account selection.
   */
  async signInWithGoogle(returnUrl = '/account'): Promise<void> {
    if (isRemoteEnvironmentWithoutLiveSupabase()) {
      const errorMsg =
        'Canlı Supabase yapılandırması eksik (VITE_SUPABASE_URL ortam değişkeni tanımlanmamış veya localhost gösteriyor). Google ile giriş için sunucunuzda VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY tanımlanmalıdır.';
      currentState = {
        ...currentState,
        error: errorMsg,
      };
      notify();
      throw new Error(errorMsg);
    }

    saveAuthRedirect(returnUrl);

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
      const translated = translateAuthError(error.message);
      currentState = {
        ...currentState,
        error: translated,
      };
      notify();
      throw new Error(`Google ile giriş başlatılamadı: ${translated}`);
    }
  },

  /**
   * Signs in customer using chosen Google account (for preview/demo and mock sessions).
   */
  async signInWithGoogleAccount(accountEmail: string, accountName: string, returnUrl = '/account'): Promise<void> {
    saveAuthRedirect(returnUrl);
    const mockUser = createMockCustomerUser(accountEmail, accountName, 'google');
    setPersistedMockCustomerUser(mockUser);

    currentState = {
      ...currentState,
      user: mockUser,
      isLoading: true,
      error: null,
    };
    notify();
    await loadUserData(mockUser.id);
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

    const isEmbeddedAdmin = isEmbeddedAdminCredentials(cleanEmail, password);

    if (isRemoteEnvironmentWithoutLiveSupabase()) {
      if (isEmbeddedAdmin) {
        signInAsEmbeddedAdmin();
        return;
      }

      const mockUser = createMockCustomerUser(cleanEmail);
      setPersistedMockCustomerUser(mockUser);

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

    try {
      const client = getSupabase();
      const { data, error } = await client.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        if (isEmbeddedAdmin) {
          signInAsEmbeddedAdmin();
          return;
        }

        const translated = translateAuthError(error.message);
        currentState = {
          ...currentState,
          error: translated,
        };
        notify();
        throw new Error(translated);
      }

      if (data.user) {
        if (isEmbeddedAdmin && typeof window !== 'undefined') {
          try {
            localStorage.setItem(EMBEDDED_ADMIN_SESSION_KEY, JSON.stringify(EMBEDDED_ADMIN_PROFILE));
          } catch {
            // Ignore
          }
        }
        currentState = {
          ...currentState,
          user: data.user,
          isLoading: true,
          error: null,
        };
        notify();
        await loadUserData(data.user.id);
      }
    } catch (err) {
      if (isEmbeddedAdmin) {
        signInAsEmbeddedAdmin();
        return;
      }
      const translated = translateAuthError(err);
      currentState = {
        ...currentState,
        error: translated,
      };
      notify();
      throw new Error(translated);
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
      const mockUser = createMockCustomerUser(cleanEmail, cleanName);
      setPersistedMockCustomerUser(mockUser);

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
      const translated = translateAuthError(error.message);
      currentState = {
        ...currentState,
        error: translated,
      };
      notify();
      throw new Error(translated);
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
    clearPersistedMockCustomerUser();
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(EMBEDDED_ADMIN_SESSION_KEY);
      } catch {
        // Ignore
      }
    }

    const client = getSupabase();
    const { error } = await client.auth.signOut();
    if (error) {
      throw new Error(translateAuthError(error.message));
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

  async createAddress(input: CreateAddressInput): Promise<CustomerAddress> {
    if (!currentState.user) throw new Error('Oturum açmış kullanıcı bulunamadı.');
    const created = await customerAddressActions.createAddress(currentState.user.id, input);
    await loadUserData(currentState.user.id);
    return created;
  },
  async updateAddress(addressId: string, input: UpdateAddressInput): Promise<CustomerAddress> {
    if (!currentState.user) throw new Error('Oturum açmış kullanıcı bulunamadı.');
    const updated = await customerAddressActions.updateAddress(currentState.user.id, addressId, input);
    await loadUserData(currentState.user.id);
    return updated;
  },
  async deleteAddress(addressId: string): Promise<void> {
    if (!currentState.user) throw new Error('Oturum açmış kullanıcı bulunamadı.');
    await customerAddressActions.deleteAddress(currentState.user.id, addressId);
    await loadUserData(currentState.user.id);
  },
  async setDefaultShipping(addressId: string): Promise<void> {
    if (!currentState.user) throw new Error('Oturum açmış kullanıcı bulunamadı.');
    await customerAddressActions.setDefaultShipping(currentState.user.id, addressId);
    await loadUserData(currentState.user.id);
  },
  async setDefaultBilling(addressId: string): Promise<void> {
    if (!currentState.user) throw new Error('Oturum açmış kullanıcı bulunamadı.');
    await customerAddressActions.setDefaultBilling(currentState.user.id, addressId);
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
    isAdmin: isAdminEmail(state.user?.email),
    isWholesaleApproved,
    isRemoteDemoMode: isRemoteEnvironmentWithoutLiveSupabase(),
    signInWithGoogle: customerAuthStore.signInWithGoogle,
    signInWithGoogleAccount: customerAuthStore.signInWithGoogleAccount,
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
