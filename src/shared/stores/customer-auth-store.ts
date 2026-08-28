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

export function initCustomerAuth() {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

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
   */
  async signInWithGoogle(returnUrl = '/account'): Promise<void> {
    saveAuthRedirect(returnUrl);
    const client = getSupabase();
    const redirectTo = `${window.location.origin}/auth/callback`;

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
   * Signs out the customer while preserving the cart.
   */
  async signOut(): Promise<void> {
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
   * Internal helper for testing environments to set state directly.
   */
  _setStateForTesting(state: Partial<CustomerAuthState>): void {
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

  return {
    ...state,
    isAuthenticated: Boolean(state.user),
    displayName,
    email: state.user?.email || null,
    customerType: state.profile?.customer_type || 'retail',
    signInWithGoogle: customerAuthStore.signInWithGoogle,
    signOut: customerAuthStore.signOut,
    refresh: customerAuthStore.refresh,
    updateProfile: customerAuthStore.updateProfile,
    createAddress: customerAuthStore.createAddress,
    updateAddress: customerAuthStore.updateAddress,
    deleteAddress: customerAuthStore.deleteAddress,
    setDefaultShipping: customerAuthStore.setDefaultShipping,
    setDefaultBilling: customerAuthStore.setDefaultBilling,
  };
}
