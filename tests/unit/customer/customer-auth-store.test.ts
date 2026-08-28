import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  customerAuthStore,
  useCustomerAuth,
  initCustomerAuth,
  type CustomerAuthState,
} from '@/shared/stores/customer-auth-store';
import { cartStore } from '@/shared/stores/cart-store';
import * as supabaseModule from '@/shared/lib/supabase';
import { customerProfileRepository } from '@/entities/customer/api/customer-profile-repository';
import { customerAddressRepository } from '@/entities/customer/api/customer-address-repository';

describe('customerAuthStore & useCustomerAuth Hook', () => {
  const mockSignInWithOAuth = vi.fn();
  const mockSignOut = vi.fn();
  const mockGetSession = vi.fn();
  const mockOnAuthStateChange = vi.fn();

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();
    customerAuthStore._resetInitializedForTesting();

    mockSignInWithOAuth.mockResolvedValue({ error: null });
    mockSignOut.mockResolvedValue({ error: null });
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    vi.spyOn(supabaseModule, 'getSupabase').mockReturnValue({
      auth: {
        signInWithOAuth: mockSignInWithOAuth,
        signOut: mockSignOut,
        getSession: mockGetSession,
        onAuthStateChange: mockOnAuthStateChange,
      },
    } as unknown as ReturnType<typeof supabaseModule.getSupabase>);
  });

  it('initiates Google OAuth and saves safe return URL in sessionStorage', async () => {
    await customerAuthStore.signInWithGoogle('/checkout');

    expect(sessionStorage.getItem('vazo_auth_redirect')).toBe('/checkout');
    expect(mockSignInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'google',
        options: expect.objectContaining({
          redirectTo: expect.stringContaining('/auth/callback'),
        }),
      })
    );
  });

  it('signs out user cleanly without clearing browser cart in localStorage', async () => {
    const dummyProduct = {
      id: 'p1',
      slug: 'vazo-01',
      name: 'Vazo 01',
      material: 'Seramik',
      finish: 'Mat',
      retailPrice: 1500,
      wholesalePrice: 900,
      variants: [
        {
          id: 'v1',
          name: 'Standart',
          colorName: 'Terracotta',
          colorHex: '#C86D51',
          retailPrice: 1500,
          wholesalePrice: 900,
          stockQuantity: 10,
          isAvailableForRetail: true,
          isAvailableForWholesale: true,
          images: [],
        },
      ],
      categories: [],
      collections: [],
      images: [],
      tags: [],
      isActive: true,
      retailEnabled: true,
      wholesaleEnabled: true,
      status: 'published' as const,
      createdAt: '2026-08-28T00:00:00Z',
      updatedAt: '2026-08-28T00:00:00Z',
    };

    cartStore.addItem(dummyProduct, dummyProduct.variants[0], 2);
    expect(cartStore.getItems()).toHaveLength(1);
    expect(localStorage.getItem('vazo_cart_items')).not.toBeNull();

    await customerAuthStore.signOut();

    expect(mockSignOut).toHaveBeenCalled();
    const state = customerAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.profile).toBeNull();
    expect(state.addresses).toEqual([]);

    expect(cartStore.getItems()).toHaveLength(1);
    expect(cartStore.getItems()[0].productId).toBe('p1');
    expect(localStorage.getItem('vazo_cart_items')).not.toBeNull();
  });

  it('manages address CRUD and default address toggles for authenticated user', async () => {
    const sampleAddress = {
      id: 'addr-99',
      user_id: 'u-1',
      label: 'Ev',
      recipient_name: 'Zeynep Kaya',
      phone: '05552223344',
      address_line1: 'Cadde 1',
      address_line2: null,
      district: 'Kadıköy',
      city: 'İstanbul',
      state_province: null,
      postal_code: '34710',
      country_code: 'TR',
      country_name: 'Türkiye',
      is_default_shipping: true,
      is_default_billing: true,
      created_at: '2026-08-28T00:00:00Z',
      updated_at: '2026-08-28T00:00:00Z',
    };

    vi.spyOn(customerAddressRepository, 'createAddress').mockResolvedValue(sampleAddress);
    vi.spyOn(customerAddressRepository, 'updateAddress').mockResolvedValue(sampleAddress);
    vi.spyOn(customerAddressRepository, 'deleteAddress').mockResolvedValue(undefined);
    vi.spyOn(customerAddressRepository, 'setDefaultShipping').mockResolvedValue(undefined);
    vi.spyOn(customerAddressRepository, 'setDefaultBilling').mockResolvedValue(undefined);
    vi.spyOn(customerAddressRepository, 'getMyAddresses').mockResolvedValue([sampleAddress]);
    vi.spyOn(customerProfileRepository, 'getMyProfile').mockResolvedValue(null);

    customerAuthStore._setStateForTesting({
      user: { id: 'u-1', email: 'zeynep@example.com' } as unknown as CustomerAuthState['user'],
    });

    await customerAuthStore.createAddress({
      label: 'Ev',
      recipient_name: 'Zeynep Kaya',
      phone: '05552223344',
      address_line1: 'Cadde 1',
      address_line2: null,
      district: 'Kadıköy',
      city: 'İstanbul',
      state_province: null,
      postal_code: '34710',
      country_code: 'TR',
      country_name: 'Türkiye',
      is_default_shipping: true,
      is_default_billing: true,
    });
    expect(customerAddressRepository.createAddress).toHaveBeenCalled();

    await customerAuthStore.updateAddress('addr-99', { city: 'Ankara' });
    expect(customerAddressRepository.updateAddress).toHaveBeenCalledWith('u-1', 'addr-99', { city: 'Ankara' });

    await customerAuthStore.setDefaultShipping('addr-99');
    expect(customerAddressRepository.setDefaultShipping).toHaveBeenCalledWith('u-1', 'addr-99');

    await customerAuthStore.setDefaultBilling('addr-99');
    expect(customerAddressRepository.setDefaultBilling).toHaveBeenCalledWith('u-1', 'addr-99');

    await customerAuthStore.deleteAddress('addr-99');
    expect(customerAddressRepository.deleteAddress).toHaveBeenCalledWith('u-1', 'addr-99');

    await customerAuthStore.refresh();
    expect(customerAddressRepository.getMyAddresses).toHaveBeenCalledWith('u-1');
  });

  it('throws descriptive errors when mutators are called without logged-in user', async () => {
    customerAuthStore._setStateForTesting({ user: null, profile: null, addresses: [] });

    await expect(customerAuthStore.updateProfile({ first_name: 'Test' })).rejects.toThrow(
      'Oturum açmış kullanıcı bulunamadı.'
    );
    await expect(
      customerAuthStore.createAddress({
        label: 'Ev',
        recipient_name: 'Test',
        phone: '123',
        address_line1: 'Test',
        address_line2: null,
        district: null,
        city: 'İst',
        state_province: null,
        postal_code: '34000',
        country_code: 'TR',
        country_name: 'TR',
        is_default_shipping: false,
        is_default_billing: false,
      })
    ).rejects.toThrow('Oturum açmış kullanıcı bulunamadı.');
    await expect(customerAuthStore.updateAddress('id', {})).rejects.toThrow(
      'Oturum açmış kullanıcı bulunamadı.'
    );
    await expect(customerAuthStore.deleteAddress('id')).rejects.toThrow(
      'Oturum açmış kullanıcı bulunamadı.'
    );
    await expect(customerAuthStore.setDefaultShipping('id')).rejects.toThrow(
      'Oturum açmış kullanıcı bulunamadı.'
    );
    await expect(customerAuthStore.setDefaultBilling('id')).rejects.toThrow(
      'Oturum açmış kullanıcı bulunamadı.'
    );
  });

  it('tests useCustomerAuth hook displayName derivation', () => {
    customerAuthStore._setStateForTesting({
      user: {
        id: 'u-2',
        email: 'ahmet@vazostudio.com',
        user_metadata: { full_name: 'Ahmet Yılmaz' },
      } as unknown as CustomerAuthState['user'],
      profile: {
        user_id: 'u-2',
        first_name: 'Ahmet',
        last_name: 'Yılmaz',
        phone: '123',
        customer_type: 'wholesale',
        wholesale_approved_at: '2026-08-28T00:00:00Z',
        created_at: '2026-08-28T00:00:00Z',
        updated_at: '2026-08-28T00:00:00Z',
      },
    });

    const { result, unmount } = renderHook(() => useCustomerAuth());
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.displayName).toBe('Ahmet Yılmaz');
    expect(result.current.customerType).toBe('wholesale');
    expect(result.current.email).toBe('ahmet@vazostudio.com');
    unmount();
  });

  it('tests displayName fallbacks across various metadata states', () => {
    // 1. Only first name
    customerAuthStore._setStateForTesting({
      user: { id: 'u-3', email: 'test@vazostudio.com' } as unknown as CustomerAuthState['user'],
      profile: {
        user_id: 'u-3',
        first_name: 'Mehmet',
        last_name: null,
        phone: null,
        customer_type: null as unknown as 'retail',
        wholesale_approved_at: null,
        created_at: '2026-08-28T00:00:00Z',
        updated_at: '2026-08-28T00:00:00Z',
      },
    });
    const h1 = renderHook(() => useCustomerAuth());
    expect(h1.result.current.displayName).toBe('Mehmet');
    expect(h1.result.current.customerType).toBe('retail');
    h1.unmount();

    // 2. Only user_metadata name
    customerAuthStore._setStateForTesting({
      user: {
        id: 'u-4',
        email: 'meta@vazostudio.com',
        user_metadata: { name: 'Meta Name' },
      } as unknown as CustomerAuthState['user'],
      profile: null,
    });
    const h2 = renderHook(() => useCustomerAuth());
    expect(h2.result.current.displayName).toBe('Meta Name');
    h2.unmount();

    // 3. Only email prefix
    customerAuthStore._setStateForTesting({
      user: {
        id: 'u-5',
        email: 'onlyemail@vazostudio.com',
        user_metadata: {},
      } as unknown as CustomerAuthState['user'],
      profile: null,
    });
    const h3 = renderHook(() => useCustomerAuth());
    expect(h3.result.current.displayName).toBe('onlyemail');
    h3.unmount();

    // 4. Anonymous/unauthenticated fallback
    customerAuthStore._setStateForTesting({
      user: null,
      profile: null,
    });
    const h4 = renderHook(() => useCustomerAuth());
    expect(h4.result.current.displayName).toBe('Müşteri');
    expect(h4.result.current.customerType).toBe('retail');
    h4.unmount();
  });

  it('handles signInWithGoogle and signOut errors', async () => {
    mockSignInWithOAuth.mockResolvedValueOnce({
      data: null,
      error: { message: 'OAuth Provider Error' },
    });

    await expect(customerAuthStore.signInWithGoogle()).rejects.toThrow('OAuth Provider Error');

    mockSignOut.mockResolvedValueOnce({
      error: { message: 'SignOut Network Error' },
    });

    await expect(customerAuthStore.signOut()).rejects.toThrow('SignOut Network Error');
  });

  it('safely handles refresh when user is unauthenticated', async () => {
    const spy = vi.spyOn(customerProfileRepository, 'getMyProfile');
    customerAuthStore._setStateForTesting({ user: null, profile: null, addresses: [] });
    await customerAuthStore.refresh();
    expect(spy).not.toHaveBeenCalled();
  });

  it('invokes initCustomerAuth on mount safely without double subscribing', () => {
    initCustomerAuth();
    initCustomerAuth(); // Idempotency test
    expect(mockOnAuthStateChange).toHaveBeenCalled();
  });
});
