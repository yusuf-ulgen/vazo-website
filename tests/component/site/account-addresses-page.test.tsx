import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { AccountAddressesPage } from '@/site/pages/AccountAddressesPage';
import { renderWithRouter } from 'tests/utils/render-utils';
import * as customerAuthModule from '@/shared/stores/customer-auth-store';

describe('AccountAddressesPage Component', () => {
  const mockCreateAddress = vi.fn();
  const mockUpdateAddress = vi.fn();
  const mockDeleteAddress = vi.fn();
  const mockSetDefaultShipping = vi.fn();
  const mockSetDefaultBilling = vi.fn();

  const sampleAddress = {
    id: 'addr-1',
    user_id: 'u1',
    label: 'Evim',
    recipient_name: 'Ahmet Yılmaz',
    phone: '05551112233',
    address_line1: 'Bağdat Cad. No:10 Daire:4',
    address_line2: null,
    district: 'Kadıköy',
    city: 'İstanbul',
    state_province: null,
    postal_code: '34710',
    country_code: 'TR',
    country_name: 'Türkiye',
    is_default_shipping: true,
    is_default_billing: false,
    created_at: '2026-08-28T00:00:00Z',
    updated_at: '2026-08-28T00:00:00Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders saved addresses with badges and details', () => {
    vi.spyOn(customerAuthModule, 'useCustomerAuth').mockReturnValue({
      user: { id: 'u1', email: 'ahmet@example.com' } as unknown as customerAuthModule.CustomerAuthState['user'],
      profile: null,
      addresses: [sampleAddress],
      isLoading: false,
      error: null,
      isAuthenticated: true,
      displayName: 'Ahmet',
      email: 'ahmet@example.com',
      customerType: 'retail',
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      refresh: vi.fn(),
      updateProfile: vi.fn(),
      createAddress: mockCreateAddress,
      updateAddress: mockUpdateAddress,
      deleteAddress: mockDeleteAddress,
      setDefaultShipping: mockSetDefaultShipping,
      setDefaultBilling: mockSetDefaultBilling,
    });

    renderWithRouter(<AccountAddressesPage />);

    expect(screen.getByText('Kayıtlı Adreslerim')).toBeInTheDocument();
    expect(screen.getByText('Evim')).toBeInTheDocument();
    expect(screen.getByText('Varsayılan Teslimat')).toBeInTheDocument();
    expect(screen.getByText(/Bağdat Cad. No:10/)).toBeInTheDocument();
    expect(screen.getByText(/Kadıköy/)).toBeInTheDocument();
  });

  it('opens create modal and adds new address', async () => {
    mockCreateAddress.mockResolvedValue({});

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
      signOut: vi.fn(),
      refresh: vi.fn(),
      updateProfile: vi.fn(),
      createAddress: mockCreateAddress,
      updateAddress: mockUpdateAddress,
      deleteAddress: mockDeleteAddress,
      setDefaultShipping: mockSetDefaultShipping,
      setDefaultBilling: mockSetDefaultBilling,
    });

    renderWithRouter(<AccountAddressesPage />);

    const addBtn = screen.getByRole('button', { name: /Yeni Adres Ekle/i });
    fireEvent.click(addBtn);

    expect(screen.getByRole('dialog', { name: 'Yeni Adres Ekle' })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Ad Soyad'), {
      target: { value: 'Ahmet Yılmaz' },
    });
    fireEvent.change(screen.getByPlaceholderText('0555 123 45 67'), {
      target: { value: '05559998877' },
    });
    fireEvent.change(screen.getByPlaceholderText('Mahalle, Cadde, Bina No, Kapı No'), {
      target: { value: 'Barbaros Bulvarı No: 20' },
    });
    fireEvent.change(screen.getByPlaceholderText('İstanbul'), {
      target: { value: 'İstanbul' },
    });
    fireEvent.change(screen.getByPlaceholderText('34710'), {
      target: { value: '34349' },
    });

    const submitBtn = screen.getByRole('button', { name: 'Adresi Kaydet' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateAddress).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient_name: 'Ahmet Yılmaz',
          city: 'İstanbul',
          postal_code: '34349',
        })
      );
    });
  });

  it('triggers setDefaultBilling and deleteAddress actions', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockSetDefaultBilling.mockResolvedValue({});
    mockDeleteAddress.mockResolvedValue({});

    vi.spyOn(customerAuthModule, 'useCustomerAuth').mockReturnValue({
      user: { id: 'u1', email: 'ahmet@example.com' } as unknown as customerAuthModule.CustomerAuthState['user'],
      profile: null,
      addresses: [sampleAddress],
      isLoading: false,
      error: null,
      isAuthenticated: true,
      displayName: 'Ahmet',
      email: 'ahmet@example.com',
      customerType: 'retail',
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      refresh: vi.fn(),
      updateProfile: vi.fn(),
      createAddress: mockCreateAddress,
      updateAddress: mockUpdateAddress,
      deleteAddress: mockDeleteAddress,
      setDefaultShipping: mockSetDefaultShipping,
      setDefaultBilling: mockSetDefaultBilling,
    });

    renderWithRouter(<AccountAddressesPage />);

    const makeBillingDefaultBtn = screen.getByText('Fatura Yap');
    fireEvent.click(makeBillingDefaultBtn);
    expect(mockSetDefaultBilling).toHaveBeenCalledWith('addr-1');

    const deleteBtn = screen.getByRole('button', { name: 'Sil' });
    fireEvent.click(deleteBtn);
    expect(mockDeleteAddress).toHaveBeenCalledWith('addr-1');
  });

  it('cancels address deletion when confirm returns false', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    vi.spyOn(customerAuthModule, 'useCustomerAuth').mockReturnValue({
      user: { id: 'u1', email: 'ahmet@example.com' } as unknown as customerAuthModule.CustomerAuthState['user'],
      profile: null,
      addresses: [sampleAddress],
      isLoading: false,
      error: null,
      isAuthenticated: true,
      displayName: 'Ahmet',
      email: 'ahmet@example.com',
      customerType: 'retail',
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      refresh: vi.fn(),
      updateProfile: vi.fn(),
      createAddress: mockCreateAddress,
      updateAddress: mockUpdateAddress,
      deleteAddress: mockDeleteAddress,
      setDefaultShipping: mockSetDefaultShipping,
      setDefaultBilling: mockSetDefaultBilling,
    });

    renderWithRouter(<AccountAddressesPage />);

    const deleteBtn = screen.getByRole('button', { name: 'Sil' });
    fireEvent.click(deleteBtn);
    expect(mockDeleteAddress).not.toHaveBeenCalled();
  });

  it('renders default billing badge and triggers setDefaultShipping for non-default shipping address', () => {
    const billingAddress = {
      ...sampleAddress,
      id: 'addr-2',
      is_default_shipping: false,
      is_default_billing: true,
    };

    mockSetDefaultShipping.mockResolvedValue({});

    vi.spyOn(customerAuthModule, 'useCustomerAuth').mockReturnValue({
      user: { id: 'u1', email: 'ahmet@example.com' } as unknown as customerAuthModule.CustomerAuthState['user'],
      profile: null,
      addresses: [billingAddress],
      isLoading: false,
      error: null,
      isAuthenticated: true,
      displayName: 'Ahmet',
      email: 'ahmet@example.com',
      customerType: 'retail',
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      refresh: vi.fn(),
      updateProfile: vi.fn(),
      createAddress: mockCreateAddress,
      updateAddress: mockUpdateAddress,
      deleteAddress: mockDeleteAddress,
      setDefaultShipping: mockSetDefaultShipping,
      setDefaultBilling: mockSetDefaultBilling,
    });

    renderWithRouter(<AccountAddressesPage />);

    expect(screen.getByText('Varsayılan Fatura')).toBeInTheDocument();
    const makeShippingDefaultBtn = screen.getByText('Teslimat Yap');
    fireEvent.click(makeShippingDefaultBtn);
    expect(mockSetDefaultShipping).toHaveBeenCalledWith('addr-2');
  });

  it('opens edit modal and updates address', async () => {
    mockUpdateAddress.mockResolvedValue({});

    vi.spyOn(customerAuthModule, 'useCustomerAuth').mockReturnValue({
      user: { id: 'u1', email: 'ahmet@example.com' } as unknown as customerAuthModule.CustomerAuthState['user'],
      profile: null,
      addresses: [sampleAddress],
      isLoading: false,
      error: null,
      isAuthenticated: true,
      displayName: 'Ahmet',
      email: 'ahmet@example.com',
      customerType: 'retail',
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      refresh: vi.fn(),
      updateProfile: vi.fn(),
      createAddress: mockCreateAddress,
      updateAddress: mockUpdateAddress,
      deleteAddress: mockDeleteAddress,
      setDefaultShipping: mockSetDefaultShipping,
      setDefaultBilling: mockSetDefaultBilling,
    });

    renderWithRouter(<AccountAddressesPage />);

    const editBtn = screen.getByRole('button', { name: 'Düzenle' });
    fireEvent.click(editBtn);

    expect(screen.getByRole('dialog', { name: 'Adresi Düzenle' })).toBeInTheDocument();

    const labelInput = screen.getByDisplayValue('Evim');
    fireEvent.change(labelInput, { target: { value: 'Ofis' } });

    const saveBtn = screen.getByRole('button', { name: 'Güncelle' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateAddress).toHaveBeenCalledWith(
        'addr-1',
        expect.objectContaining({
          label: 'Ofis',
        })
      );
    });
  });

  it('renders empty address state correctly', () => {
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
      signOut: vi.fn(),
      refresh: vi.fn(),
      updateProfile: vi.fn(),
      createAddress: mockCreateAddress,
      updateAddress: mockUpdateAddress,
      deleteAddress: mockDeleteAddress,
      setDefaultShipping: mockSetDefaultShipping,
      setDefaultBilling: mockSetDefaultBilling,
    });

    renderWithRouter(<AccountAddressesPage />);

    expect(screen.getByText('Kayıtlı Adresiniz Yok')).toBeInTheDocument();
  });
});
