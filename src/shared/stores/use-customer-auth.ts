import { useState, useEffect } from 'react';
import {
  customerAuthStore,
  initCustomerAuth,
  CustomerAuthState,
} from './customer-auth-store';
import { isRemoteEnvironmentWithoutLiveSupabase } from './customer-auth-helpers';

/**
 * Hook to consume Customer Auth state and methods in components.
 */
export function useCustomerAuth() {
  const [state, setState] = useState<CustomerAuthState>(() => customerAuthStore.getState());

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
    isAdmin: Boolean(state.isAdmin),
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
