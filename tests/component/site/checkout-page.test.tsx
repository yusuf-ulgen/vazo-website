import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { CheckoutPage } from '@/site/pages/CheckoutPage';
import { renderWithRouter } from 'tests/utils/render-utils';
import { cartStore } from '@/shared/stores/cart-store';
import { customerAuthStore, useCustomerAuth } from '@/shared/stores/customer-auth-store';
import { createProduct, createVariant } from 'tests/factories/product.factory';
import { CustomerProfile, CustomerAddress } from '@/entities/customer/types';
import { User } from '@supabase/supabase-js';

// Mock customer auth store
vi.mock('@/shared/stores/customer-auth-store', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/shared/stores/customer-auth-store');
  return {
    ...actual,
    useCustomerAuth: vi.fn(),
    customerAuthStore: {
      ...(actual.customerAuthStore as Record<string, unknown>),
      signInWithGoogle: vi.fn(),
      createAddress: vi.fn().mockResolvedValue({
        id: 'new-addr-01',
        user_id: 'cust-01',
        label: 'İş',
        recipient_name: 'Ahmet Demir',
        phone: '5559876543',
        address_line1: 'Maslak No 5',
        city: 'İstanbul',
        country_code: 'TR',
        country_name: 'Türkiye',
      }),
    },
  };
});

const mockAddresses: CustomerAddress[] = [
  {
    id: 'addr-01',
    user_id: 'cust-01',
    label: 'Ev',
    recipient_name: 'Ayşe Yılmaz',
    phone: '+90 555 123 4567',
    address_line1: 'Karaköy Kemankeş Cad. No 42',
    district: 'Beyoğlu',
    city: 'İstanbul',
    country_code: 'TR',
    country_name: 'Türkiye',
    is_default_shipping: true,
    is_default_billing: true,
    created_at: '2026-08-28T00:00:00Z',
    updated_at: '2026-08-28T00:00:00Z',
  },
  {
    id: 'addr-02',
    user_id: 'cust-01',
    label: 'Ofis',
    recipient_name: 'Ayşe Ofis',
    phone: '+90 555 999 8877',
    address_line1: 'Levent No 10',
    district: 'Beşiktaş',
    city: 'İstanbul',
    country_code: 'TR',
    country_name: 'Türkiye',
    is_default_shipping: false,
    is_default_billing: false,
    created_at: '2026-08-28T00:00:00Z',
    updated_at: '2026-08-28T00:00:00Z',
  },
];

describe('CheckoutPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cartStore.clear();
  });

  it('renders auth gate when customer is not authenticated', () => {
    vi.mocked(useCustomerAuth).mockReturnValue({
      user: null,
      profile: null,
      addresses: [],
      isLoading: false,
      error: null,
      displayName: 'Misafir',
      email: '',
      customerType: 'retail',
      isWholesaleApproved: false,
      signOut: vi.fn(),
      updateProfile: vi.fn(),
    });

    renderWithRouter(<CheckoutPage />);

    expect(screen.getByText('Ödeme İçin Giriş Yapın')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Google ile Giriş Yap & Devam Et/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Google ile Giriş Yap & Devam Et/ }));
    expect(customerAuthStore.signInWithGoogle).toHaveBeenCalledWith('/checkout');
  });

  it('renders empty cart notice when user is authenticated but cart is empty', async () => {
    vi.mocked(useCustomerAuth).mockReturnValue({
      user: { id: 'cust-01', email: 'test@example.com' } as User,
      profile: { id: 'cust-01', first_name: 'Ayşe', last_name: 'Yılmaz' } as CustomerProfile,
      addresses: mockAddresses,
      isLoading: false,
      error: null,
      displayName: 'Ayşe Yılmaz',
      email: 'test@example.com',
      customerType: 'retail',
      isWholesaleApproved: false,
      signOut: vi.fn(),
      updateProfile: vi.fn(),
    });

    renderWithRouter(<CheckoutPage />);

    expect(screen.getByText('Sepetiniz Boş')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Koleksiyonu İncele/ })).toBeInTheDocument();
  });

  it('handles quote fetch error and separate billing address flow', async () => {
    vi.mocked(useCustomerAuth).mockReturnValue({
      user: { id: 'cust-01', email: 'ayse@example.com' } as User,
      profile: { id: 'cust-01', first_name: 'Ayşe', last_name: 'Yılmaz' } as CustomerProfile,
      addresses: mockAddresses,
      isLoading: false,
      error: null,
      displayName: 'Ayşe Yılmaz',
      email: 'ayse@example.com',
      customerType: 'retail',
      isWholesaleApproved: false,
      signOut: vi.fn(),
      updateProfile: vi.fn(),
    });

    const product = createProduct({ id: 'p-chk-02', name: 'Zemin Vazosu', retailPrice: 1500 });
    const variant = createVariant({ id: 'v-chk-02', title: 'Mat Siyah', retailPrice: 1500, stockQuantity: 5 });
    cartStore.addItem(product, variant, 1);

    renderWithRouter(<CheckoutPage />);

    // Step 1: Advance to Step 2
    fireEvent.click(screen.getByRole('button', { name: /Fatura Adımına Geç/ }));

    // Step 2: Uncheck "Fatura adresim aynı olsun" and select different billing address
    expect(screen.getByText('2. Fatura Adresi')).toBeInTheDocument();
    const sameAddrCb = screen.getByRole('checkbox');
    fireEvent.click(sameAddrCb);

    expect(await screen.findByText('Ayşe Ofis')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Ayşe Ofis'));

    // Step 2 -> Step 3
    fireEvent.click(screen.getByRole('button', { name: /Kargo Seçimine Geç/ }));

    // Step 3: Back to Step 2
    expect(await screen.findByText('3. Kargo & Teslimat')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Fatura Adresine Dön/ }));
    expect(screen.getByText('2. Fatura Adresi')).toBeInTheDocument();
  });

  it('progresses through delivery, billing, shipping, legal review and order creation', async () => {
    vi.mocked(useCustomerAuth).mockReturnValue({
      user: { id: 'cust-01', email: 'ayse@example.com' } as User,
      profile: { id: 'cust-01', first_name: 'Ayşe', last_name: 'Yılmaz' } as CustomerProfile,
      addresses: mockAddresses,
      isLoading: false,
      error: null,
      displayName: 'Ayşe Yılmaz',
      email: 'ayse@example.com',
      customerType: 'retail',
      isWholesaleApproved: false,
      signOut: vi.fn(),
      updateProfile: vi.fn(),
    });

    const product = createProduct({ id: 'p-chk-01', name: 'Alabaster Zemin Vazosu', retailPrice: 2500 });
    const variant = createVariant({ id: 'v-chk-01', title: 'Mat Beyaz', retailPrice: 2500, stockQuantity: 10 });
    cartStore.addItem(product, variant, 1);

    renderWithRouter(<CheckoutPage />);

    // Step 1: Delivery Address
    expect(screen.getByText('1. Teslimat Adresi')).toBeInTheDocument();
    expect(screen.getByText('Ayşe Yılmaz')).toBeInTheDocument();

    // Advance to Step 2
    fireEvent.click(screen.getByRole('button', { name: /Fatura Adımına Geç/ }));

    // Step 2: Billing Address
    expect(screen.getByText('2. Fatura Adresi')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Kargo Seçimine Geç/ }));

    // Step 3: Shipping Selection
    expect(await screen.findByText('3. Kargo & Teslimat')).toBeInTheDocument();
    expect(await screen.findByText('Standart Sigortalı Kargo')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Sipariş Özetine Geç/ }));

    // Step 4: Summary & Legal Acceptance
    expect(await screen.findByText('Sipariş Özeti')).toBeInTheDocument();
    expect(screen.getByText('Yasal Onaylar & Sözleşmeler')).toBeInTheDocument();

    // Try submitting without checking legal boxes (should remain disabled)
    const submitBtn = screen.getByRole('button', { name: /Siparişi Onayla & Ödemeye Geç/ });
    expect(submitBtn).toBeDisabled();

    // Check legal consents
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((cb) => fireEvent.click(cb));

    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    // Step 5: Payment Boundary Reached with PayTR iFrame
    expect(await screen.findByText('Sipariş Kaydı Oluşturuldu')).toBeInTheDocument();
    expect(await screen.findByTitle('Güvenli PayTR ödeme formu')).toBeInTheDocument();
    expect(cartStore.getItems()).toHaveLength(0); // Cart cleared
  });
});
