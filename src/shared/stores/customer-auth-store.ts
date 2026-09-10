import type { User, Session } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '@/shared/lib/supabase';
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
import { translateAuthError } from '@/shared/utils/auth-error-translator';
import {
  isCustomerAuthMockAllowed,
  createMockCustomerUser,
  getPersistedMockCustomerUser,
  setPersistedMockCustomerUser,
  clearPersistedMockCustomerUser,
} from './customer-auth-helpers';
import { customerAddressActions } from './customer-address-actions';

export interface CustomerAuthState {
  user: User | null;
  profile: CustomerProfile | null;
  addresses: CustomerAddress[];
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
}

let currentState: CustomerAuthState = {
  user: null,
  profile: null,
  addresses: [],
  isAdmin: false,
  isLoading: true,
  error: null,
};

type CustomerAuthListener = (state: CustomerAuthState) => void;
const listeners = new Set<CustomerAuthListener>();

function notify() {
  listeners.forEach((listener) => listener({ ...currentState }));
}

let isInitialized = false;

function setAuthError(err: unknown): string {
  const msg = translateAuthError(err);
  currentState = { ...currentState, isLoading: false, error: msg };
  notify();
  return msg;
}

async function checkAdminUser(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const client = getSupabase();
    const { data } = await client
      .from('admin_users')
      .select('role, active')
      .eq('user_id', userId)
      .maybeSingle();
    return Boolean(data && (data as { active?: boolean }).active === true);
  } catch {
    return false;
  }
}

async function loadUserData(userId: string) {
  try {
    const [profile, addresses, adminCheck] = await Promise.all([
      customerProfileRepository.getMyProfile(userId).catch(() => null),
      customerAddressRepository.getMyAddresses(userId).catch(() => []),
      checkAdminUser(userId),
    ]);

    currentState = {
      ...currentState,
      profile,
      addresses,
      isAdmin: adminCheck,
      isLoading: false,
      error: null,
    };
    notify();
  } catch (err: unknown) {
    setAuthError(err);
  }
}

export function initCustomerAuth() {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  // 1. Check for persisted mock session ONLY if mock auth is allowed
  if (isCustomerAuthMockAllowed()) {
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
  } else {
    // Purge any stale mock customer session if running in live/production mode
    clearPersistedMockCustomerUser();
  }

  // 2. If Supabase is unconfigured in live mode, fail closed safely
  if (!isSupabaseConfigured) {
    currentState = {
      ...currentState,
      user: null,
      profile: null,
      addresses: [],
      isAdmin: false,
      isLoading: false,
      error: null,
    };
    notify();
    return;
  }

  // 3. Otherwise initialize with Supabase
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
          isAdmin: false,
          isLoading: false,
          error: null,
        };
        notify();
      }
    }).catch(() => {
      currentState = {
        ...currentState,
        isAdmin: false,
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
          isAdmin: false,
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
   * Prompts the Google Account Chooser screen for account selection.
   */
  async signInWithGoogle(returnUrl = '/account'): Promise<void> {
    if (!isSupabaseConfigured) {
      const errorMsg = 'Canlı Supabase yapılandırması eksik (VITE_SUPABASE_URL veya VITE_SUPABASE_ANON_KEY tanımlanmalıdır).';
      setAuthError(errorMsg);
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
      const msg = setAuthError(error.message);
      throw new Error(`Google ile giriş başlatılamadı: ${msg}`);
    }
  },

  /**
   * Signs in customer using chosen Google account (for preview/demo and mock sessions).
   */
  async signInWithGoogleAccount(accountEmail: string, accountName: string, returnUrl = '/account'): Promise<void> {
    if (!isCustomerAuthMockAllowed()) {
      const errorMsg = 'Mock Google girişi yalnızca yerel test ortamında kullanılabilir.';
      setAuthError(errorMsg);
      throw new Error(errorMsg);
    }

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

    // Controlled local mock customer auth
    if (isCustomerAuthMockAllowed()) {
      const mockUser = createMockCustomerUser(cleanEmail);
      setPersistedMockCustomerUser(mockUser);

      currentState = {
        ...currentState,
        user: mockUser,
        isAdmin: false,
        isLoading: true,
        error: null,
      };
      notify();
      await loadUserData(mockUser.id);
      return;
    }

    // Live mode requires configured Supabase
    if (!isSupabaseConfigured) {
      const errorMsg = 'Canlı ortamda kimlik doğrulama için Supabase yapılandırması zorunludur.';
      setAuthError(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      const client = getSupabase();
      const { data, error } = await client.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        const msg = setAuthError(error.message);
        throw new Error(msg);
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
    } catch (err) {
      const msg = setAuthError(err);
      throw new Error(msg);
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

    // Controlled local mock customer registration
    if (isCustomerAuthMockAllowed()) {
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

    // Live mode requires configured Supabase
    if (!isSupabaseConfigured) {
      const errorMsg = 'Canlı ortamda kayıt olmak için Supabase yapılandırması zorunludur.';
      setAuthError(errorMsg);
      throw new Error(errorMsg);
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
      const msg = setAuthError(error.message);
      throw new Error(msg);
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

    const client = getSupabase();
    const { error } = await client.auth.signOut();
    if (error) {
      throw new Error(translateAuthError(error.message));
    }

    currentState = {
      user: null,
      profile: null,
      addresses: [],
      isAdmin: false,
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

  async _withUser<T>(fn: (userId: string) => Promise<T>): Promise<T> {
    if (!currentState.user) throw new Error('Oturum açmış kullanıcı bulunamadı.');
    const res = await fn(currentState.user.id);
    await loadUserData(currentState.user.id);
    return res;
  },

  async createAddress(input: CreateAddressInput): Promise<CustomerAddress> {
    return customerAuthStore._withUser((uid) => customerAddressActions.createAddress(uid, input));
  },
  async updateAddress(addressId: string, input: UpdateAddressInput): Promise<CustomerAddress> {
    return customerAuthStore._withUser((uid) => customerAddressActions.updateAddress(uid, addressId, input));
  },
  async deleteAddress(addressId: string): Promise<void> {
    return customerAuthStore._withUser((uid) => customerAddressActions.deleteAddress(uid, addressId));
  },
  async setDefaultShipping(addressId: string): Promise<void> {
    return customerAuthStore._withUser((uid) => customerAddressActions.setDefaultShipping(uid, addressId));
  },
  async setDefaultBilling(addressId: string): Promise<void> {
    return customerAuthStore._withUser((uid) => customerAddressActions.setDefaultBilling(uid, addressId));
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

export { useCustomerAuth } from './use-customer-auth';
export { isWholesaleApprovedCustomer } from './customer-auth-helpers';
