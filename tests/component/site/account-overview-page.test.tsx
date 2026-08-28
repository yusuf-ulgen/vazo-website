import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { AccountOverviewPage } from '@/site/pages/AccountOverviewPage';
import { renderWithRouter } from 'tests/utils/render-utils';
import * as customerAuthModule from '@/shared/stores/customer-auth-store';

describe('AccountOverviewPage Component', () => {
  const mockSignOut = vi.fn();
  const mockUpdateProfile = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders customer profile information and address summary for authenticated user', () => {
    vi.spyOn(customerAuthModule, 'useCustomerAuth').mockReturnValue({
      user: { id: 'u1', email: 'ahmet@example.com' } as unknown as customerAuthModule.CustomerAuthState['user'],
      profile: {
        user_id: 'u1',
        first_name: 'Ahmet',
        last_name: 'Yılmaz',
        phone: '05551112233',
        customer_type: 'retail',
        wholesale_approved_at: null,
        created_at: '2026-08-28T00:00:00Z',
        updated_at: '2026-08-28T00:00:00Z',
      },
      addresses: [
        {
          id: 'a1',
          user_id: 'u1',
          label: 'Evim',
          recipient_name: 'Ahmet Yılmaz',
          phone: '05551112233',
          address_line1: 'Bağdat Cad. No:10',
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
        },
      ],
      isLoading: false,
      error: null,
      isAuthenticated: true,
      displayName: 'Ahmet Yılmaz',
      email: 'ahmet@example.com',
      customerType: 'retail',
      signInWithGoogle: vi.fn(),
      signOut: mockSignOut,
      refresh: vi.fn(),
      updateProfile: mockUpdateProfile,
      createAddress: vi.fn(),
      updateAddress: vi.fn(),
      deleteAddress: vi.fn(),
      setDefaultShipping: vi.fn(),
      setDefaultBilling: vi.fn(),
    });

    renderWithRouter(<AccountOverviewPage />);

    expect(screen.getByText('Hesabım')).toBeInTheDocument();
    expect(screen.getByText('Ahmet Yılmaz')).toBeInTheDocument();
    expect(screen.getByText('ahmet@example.com')).toBeInTheDocument();
    expect(screen.getByText('05551112233')).toBeInTheDocument();
    expect(screen.getByText('Bireysel Müşteri')).toBeInTheDocument();
    expect(screen.getByText('Kayıtlı Adreslerim')).toBeInTheDocument();
    expect(screen.getByText('Evim')).toBeInTheDocument();
    expect(screen.getByText('Yakında (Phase 3.8)')).toBeInTheDocument();
  });

  it('opens profile edit modal and updates customer details', async () => {
    mockUpdateProfile.mockResolvedValue({});

    vi.spyOn(customerAuthModule, 'useCustomerAuth').mockReturnValue({
      user: { id: 'u1', email: 'ahmet@example.com' } as unknown as customerAuthModule.CustomerAuthState['user'],
      profile: {
        user_id: 'u1',
        first_name: 'Ahmet',
        last_name: 'Yılmaz',
        phone: '05551112233',
        customer_type: 'retail',
        wholesale_approved_at: null,
        created_at: '2026-08-28T00:00:00Z',
        updated_at: '2026-08-28T00:00:00Z',
      },
      addresses: [],
      isLoading: false,
      error: null,
      isAuthenticated: true,
      displayName: 'Ahmet Yılmaz',
      email: 'ahmet@example.com',
      customerType: 'retail',
      signInWithGoogle: vi.fn(),
      signOut: mockSignOut,
      refresh: vi.fn(),
      updateProfile: mockUpdateProfile,
      createAddress: vi.fn(),
      updateAddress: vi.fn(),
      deleteAddress: vi.fn(),
      setDefaultShipping: vi.fn(),
      setDefaultBilling: vi.fn(),
    });

    renderWithRouter(<AccountOverviewPage />);

    const editBtn = screen.getByRole('button', { name: 'Düzenle' });
    fireEvent.click(editBtn);

    expect(screen.getByRole('dialog', { name: 'Profil Bilgilerini Düzenle' })).toBeInTheDocument();
    const firstNameInput = screen.getByPlaceholderText('Adınız');
    fireEvent.change(firstNameInput, { target: { value: 'Ahmet Can' } });

    const submitBtn = screen.getByRole('button', { name: 'Kaydet' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: 'Ahmet Can',
        })
      );
    });
  });

  it('triggers logout on button click', async () => {
    mockSignOut.mockResolvedValue(undefined);

    vi.spyOn(customerAuthModule, 'useCustomerAuth').mockReturnValue({
      user: { id: 'u1', email: 'ahmet@example.com' } as unknown as customerAuthModule.CustomerAuthState['user'],
      profile: null,
      addresses: [],
      isLoading: false,
      error: null,
      isAuthenticated: true,
      displayName: 'Ahmet',
      email: 'ahmet@example.com',
      customerType: 'retail',
      signInWithGoogle: vi.fn(),
      signOut: mockSignOut,
      refresh: vi.fn(),
      updateProfile: mockUpdateProfile,
      createAddress: vi.fn(),
      updateAddress: vi.fn(),
      deleteAddress: vi.fn(),
      setDefaultShipping: vi.fn(),
      setDefaultBilling: vi.fn(),
    });

    renderWithRouter(<AccountOverviewPage />);

    const logoutBtn = screen.getByRole('button', { name: /Oturumu Kapat/i });
    fireEvent.click(logoutBtn);

    expect(mockSignOut).toHaveBeenCalled();
  });
});
