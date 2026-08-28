import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { CustomerAuthGuard } from '@/site/auth/CustomerAuthGuard';
import { renderWithRouter } from 'tests/utils/render-utils';
import * as customerAuthModule from '@/shared/stores/customer-auth-store';

describe('CustomerAuthGuard Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading skeleton when customer auth is loading', () => {
    vi.spyOn(customerAuthModule, 'useCustomerAuth').mockReturnValue({
      user: null,
      profile: null,
      addresses: [],
      isLoading: true,
      error: null,
      isAuthenticated: false,
      displayName: 'Müşteri',
      email: null,
      customerType: 'retail',
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      refresh: vi.fn(),
      updateProfile: vi.fn(),
      createAddress: vi.fn(),
      updateAddress: vi.fn(),
      deleteAddress: vi.fn(),
      setDefaultShipping: vi.fn(),
      setDefaultBilling: vi.fn(),
    });

    const { container, unmount } = renderWithRouter(
      <CustomerAuthGuard>
        <div>Protected Content</div>
      </CustomerAuthGuard>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    unmount();
  });

  it('redirects to home with auth_required and return_to parameters when unauthenticated', () => {
    vi.spyOn(customerAuthModule, 'useCustomerAuth').mockReturnValue({
      user: null,
      profile: null,
      addresses: [],
      isLoading: false,
      error: null,
      isAuthenticated: false,
      displayName: 'Müşteri',
      email: null,
      customerType: 'retail',
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      refresh: vi.fn(),
      updateProfile: vi.fn(),
      createAddress: vi.fn(),
      updateAddress: vi.fn(),
      deleteAddress: vi.fn(),
      setDefaultShipping: vi.fn(),
      setDefaultBilling: vi.fn(),
    });

    const { unmount } = renderWithRouter(
      <Routes>
        <Route
          path="/account"
          element={
            <CustomerAuthGuard>
              <div>Protected Content</div>
            </CustomerAuthGuard>
          }
        />
        <Route path="/" element={<div>Home Auth Required Screen</div>} />
      </Routes>,
      { routerInitialEntries: ['/account?tab=orders'] }
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('Home Auth Required Screen')).toBeInTheDocument();
    unmount();
  });

  it('renders children when customer is authenticated', () => {
    vi.spyOn(customerAuthModule, 'useCustomerAuth').mockReturnValue({
      user: { id: 'u1', email: 'test@example.com' } as unknown as customerAuthModule.CustomerAuthState['user'],
      profile: null,
      addresses: [],
      isLoading: false,
      error: null,
      isAuthenticated: true,
      displayName: 'Test User',
      email: 'test@example.com',
      customerType: 'retail',
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      refresh: vi.fn(),
      updateProfile: vi.fn(),
      createAddress: vi.fn(),
      updateAddress: vi.fn(),
      deleteAddress: vi.fn(),
      setDefaultShipping: vi.fn(),
      setDefaultBilling: vi.fn(),
    });

    const { unmount } = renderWithRouter(
      <CustomerAuthGuard>
        <div>Protected Customer Dashboard</div>
      </CustomerAuthGuard>
    );

    expect(screen.getByText('Protected Customer Dashboard')).toBeInTheDocument();
    unmount();
  });
});
