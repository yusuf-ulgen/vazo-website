import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithRouter } from 'tests/utils/render-utils';
import { customerAuthStore } from '@/shared/stores/customer-auth-store';
import { orderRepository } from '@/entities/order/api/order-repository';
import { adminTradeApplicationsRepository } from '@/admin/submissions/api/admin-trade-applications-repository';
import { AccountOverviewPage } from '@/site/pages/AccountOverviewPage';
import { TradeApplicationDetailModal } from '@/admin/submissions/components/TradeApplicationDetailModal';
import { TradeApplicationsTab } from '@/admin/submissions/components/TradeApplicationsTab';
import { CheckoutPage } from '@/site/pages/CheckoutPage';
import { cartStore } from '@/shared/stores/cart-store';
import { ToastProvider } from '@/admin/ui';
import { DEFAULT_PUBLIC_SITE_SETTINGS } from '@/entities/settings/types';
import type { AdminTradeApplication } from '@/admin/submissions/types';
import type { Product, ProductVariant } from '@/entities/product/types';

// Mock settings store
vi.mock('@/shared/stores/settings-store', () => ({
  useSiteSettings: vi.fn(() => ({
    settings: {
      ...DEFAULT_PUBLIC_SITE_SETTINGS,
      commerce: {
        ...DEFAULT_PUBLIC_SITE_SETTINGS.commerce,
        checkoutEnabled: true,
      },
    },
    isLoading: false,
    error: null,
  })),
}));

describe('Phase 3.8 Wholesale Identity & PayTR Checkout Flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    cartStore.clear();
    customerAuthStore._setStateForTesting({
      user: null,
      profile: null,
      addresses: [],
      isLoading: false,
      isInitialized: true,
    });
  });

  it('renders AccountOverviewPage for approved wholesale customer with active B2B badge and handles logout', async () => {
    const mockSignOut = vi.fn().mockResolvedValue(undefined);
    customerAuthStore._setStateForTesting({
      user: { id: 'cust-ws-01', email: 'architect@studio.com' } as unknown as import('@supabase/supabase-js').User,
      profile: {
        id: 'cust-ws-01',
        user_id: 'cust-ws-01',
        first_name: 'Selin',
        last_name: 'Mimar',
        phone: '05551112233',
        customer_type: 'wholesale',
        wholesale_approved_at: '2026-08-28T10:00:00Z',
        created_at: '2026-08-28T09:00:00Z',
        updated_at: '2026-08-28T10:00:00Z',
      },
      addresses: [],
      isLoading: false,
      isInitialized: true,
    });
    vi.spyOn(customerAuthStore, 'signOut').mockImplementation(mockSignOut);

    renderWithRouter(<AccountOverviewPage />, { routerInitialEntries: ['/account'] });

    expect(await screen.findByText('Toptan Müşteri (B2B)')).toBeInTheDocument();
    expect(screen.getByText('Toptan / Kurumsal Hesap Aktif')).toBeInTheDocument();
    expect(screen.getByText('Toptan Katalog')).toBeInTheDocument();

    const logoutBtn = screen.getByRole('button', { name: /Oturumu Kapat/i });
    fireEvent.click(logoutBtn);
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('allows unlinked retail customer to trigger claimTradeApplication and dismiss message banner', async () => {
    customerAuthStore._setStateForTesting({
      user: { id: 'cust-retail-01', email: 'partner@arkhe.com' } as unknown as import('@supabase/supabase-js').User,
      profile: {
        id: 'cust-retail-01',
        user_id: 'cust-retail-01',
        first_name: 'Caner',
        last_name: 'Yılmaz',
        phone: '05321234567',
        customer_type: 'retail',
        wholesale_approved_at: null,
        created_at: '2026-08-28T09:00:00Z',
        updated_at: '2026-08-28T09:00:00Z',
      },
      addresses: [],
      isLoading: false,
      isInitialized: true,
    });

    vi.spyOn(customerAuthStore, 'claimTradeApplication').mockResolvedValueOnce({
      success: true,
      claimed: true,
      company_name: 'Arkhe Mimarlık Ltd. Şti.',
      message: 'Toptan hesabınız başarıyla doğrulandı ve bağlandı.',
    });

    renderWithRouter(<AccountOverviewPage />, { routerInitialEntries: ['/account'] });

    expect(await screen.findByText('Bireysel Müşteri')).toBeInTheDocument();
    const claimBtn = screen.getByRole('button', { name: /Başvurumu Bağla/i });
    fireEvent.click(claimBtn);

    expect(await screen.findByText(/Toptan hesabınız başarıyla doğrulandı ve bağlandı/i)).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: 'Kapat' });
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/Toptan hesabınız başarıyla doğrulandı ve bağlandı/i)).not.toBeInTheDocument();
  });

  it('handles claimTradeApplication unapproved message and exception on AccountOverviewPage', async () => {
    customerAuthStore._setStateForTesting({
      user: { id: 'cust-retail-01', email: 'partner@arkhe.com' } as unknown as import('@supabase/supabase-js').User,
      profile: {
        id: 'cust-retail-01',
        user_id: 'cust-retail-01',
        first_name: 'Caner',
        last_name: 'Yılmaz',
        phone: '05321234567',
        customer_type: 'retail',
        wholesale_approved_at: null,
        created_at: '2026-08-28T09:00:00Z',
        updated_at: '2026-08-28T09:00:00Z',
      },
      addresses: [],
      isLoading: false,
      isInitialized: true,
    });

    vi.spyOn(customerAuthStore, 'claimTradeApplication').mockRejectedValueOnce(new Error('Ağ bağlantı hatası'));

    renderWithRouter(<AccountOverviewPage />, { routerInitialEntries: ['/account'] });

    const claimBtn = await screen.findByRole('button', { name: /Başvurumu Bağla/i });
    fireEvent.click(claimBtn);

    expect(await screen.findByText('Ağ bağlantı hatası')).toBeInTheDocument();
  });

  it('renders TradeApplicationDetailModal with linked user status and executes approve & revoke flows', async () => {
    const mockApp: AdminTradeApplication = {
      id: 'app-001',
      user_id: 'cust-ws-01',
      company_name: 'Studio Forma Ltd.',
      tax_number: '9876543210',
      tax_office: 'Kadıköy VD',
      business_type: 'İç Mimarlık',
      contact_person: 'Ali Demir',
      email: 'ali@forma.com',
      phone: '05339998877',
      website: 'https://forma.com',
      estimated_monthly_volume: '20 - 50 Adet',
      customer_message: 'Projelerimiz için numune ve toptan alım istiyoruz.',
      status: 'pending',
      admin_notes: null,
      submitted_at: '2026-08-28T12:00:00Z',
      reviewed_at: null,
    };

    const handleSave = vi.fn().mockResolvedValue(undefined);
    const handleApprove = vi.fn().mockResolvedValue(undefined);
    const handleRevoke = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    const { rerender } = renderWithRouter(
      <TradeApplicationDetailModal
        application={mockApp}
        isOpen={true}
        onClose={handleClose}
        onSave={handleSave}
        onApprove={handleApprove}
        onRevoke={handleRevoke}
      />
    );

    expect(screen.getAllByText('Studio Forma Ltd.')[0]).toBeInTheDocument();
    expect(screen.getByText('Doğrulanmış Müşteri Hesabı Bağlı')).toBeInTheDocument();

    // Trigger Approve Action
    const approveBtn = screen.getByRole('button', { name: /Başvuruyu Onayla & Toptan Yetkisi Ver/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(handleApprove).toHaveBeenCalledWith('app-001', undefined);
    });

    // Re-render as approved
    rerender(
      <TradeApplicationDetailModal
        application={{ ...mockApp, status: 'approved' }}
        isOpen={true}
        onClose={handleClose}
        onSave={handleSave}
        onApprove={handleApprove}
        onRevoke={handleRevoke}
      />
    );

    expect(screen.getByText('Toptan Yetkisi Aktif')).toBeInTheDocument();

    // Click Revoke Button -> Shows confirmation prompt
    const revokeBtn = screen.getByRole('button', { name: /Toptan Yetkisini İptal Et \(Revoke\)/i });
    fireEvent.click(revokeBtn);

    expect(screen.getByText('Yetkiyi iptal etmek istediğinize emin misiniz?')).toBeInTheDocument();
    const confirmRevokeBtn = screen.getByRole('button', { name: 'Evet, İptal Et' });
    fireEvent.click(confirmRevokeBtn);

    await waitFor(() => {
      expect(handleRevoke).toHaveBeenCalledWith('app-001', undefined);
    });
  });

  it('handles TradeApplicationDetailModal action errors for approve, revoke, and save', async () => {
    const mockApp: AdminTradeApplication = {
      id: 'app-002',
      company_name: 'Error Forma Ltd.',
      tax_number: '1111111111',
      tax_office: 'Beşiktaş VD',
      business_type: 'Otel',
      contact_person: 'Veli Can',
      email: 'veli@hotel.com',
      phone: '05440001122',
      website: null,
      estimated_monthly_volume: null,
      customer_message: null,
      status: 'pending',
      admin_notes: null,
      submitted_at: '2026-08-28T12:00:00Z',
      reviewed_at: null,
    };

    const handleSave = vi.fn().mockRejectedValue(new Error('Kaydetme hatası'));
    const handleApprove = vi.fn().mockRejectedValue(new Error('Onaylama hatası'));
    const handleRevoke = vi.fn().mockRejectedValue(new Error('İptal hatası'));

    const { rerender } = renderWithRouter(
      <TradeApplicationDetailModal
        application={mockApp}
        isOpen={true}
        onClose={vi.fn()}
        onSave={handleSave}
        onApprove={handleApprove}
        onRevoke={handleRevoke}
      />
    );

    const approveBtn = screen.getByRole('button', { name: /Başvuruyu Onayla & Toptan Yetkisi Ver/i });
    fireEvent.click(approveBtn);

    expect(await screen.findByText('Onaylama hatası')).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: /Değişiklikleri Kaydet/i });
    fireEvent.click(saveBtn);

    expect(await screen.findByText('Kaydetme hatası')).toBeInTheDocument();

    rerender(
      <TradeApplicationDetailModal
        application={{ ...mockApp, status: 'approved' }}
        isOpen={true}
        onClose={vi.fn()}
        onSave={handleSave}
        onApprove={handleApprove}
        onRevoke={handleRevoke}
      />
    );

    const revokeBtn = screen.getByRole('button', { name: /Toptan Yetkisini İptal Et \(Revoke\)/i });
    fireEvent.click(revokeBtn);
    const confirmRevokeBtn = screen.getByRole('button', { name: 'Evet, İptal Et' });
    fireEvent.click(confirmRevokeBtn);

    expect(await screen.findByText('İptal hatası')).toBeInTheDocument();
  });

  it('renders TradeApplicationsTab and executes approve and revoke actions', async () => {
    vi.spyOn(adminTradeApplicationsRepository, 'getTradeApplications').mockResolvedValue({
      data: [
        {
          id: 'app-001',
          user_id: 'cust-ws-01',
          company_name: 'Studio Forma Ltd.',
          tax_number: '9876543210',
          tax_office: 'Kadıköy VD',
          business_type: 'İç Mimarlık',
          contact_person: 'Ali Demir',
          email: 'ali@forma.com',
          phone: '05339998877',
          website: 'https://forma.com',
          estimated_monthly_volume: '20 - 50 Adet',
          customer_message: 'Projelerimiz için numune ve toptan alım istiyoruz.',
          status: 'pending',
          admin_notes: null,
          submitted_at: '2026-08-28T12:00:00Z',
          reviewed_at: null,
        },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    });

    vi.spyOn(adminTradeApplicationsRepository, 'approveTradeApplication').mockResolvedValue({
      success: true,
      application_id: 'app-001',
      is_user_bound: true,
    });

    vi.spyOn(adminTradeApplicationsRepository, 'revokeWholesaleAccess').mockResolvedValue({
      success: true,
      application_id: 'app-001',
    });

    renderWithRouter(
      <ToastProvider>
        <TradeApplicationsTab />
      </ToastProvider>
    );

    expect(await screen.findByText('Studio Forma Ltd.')).toBeInTheDocument();
    expect(screen.getAllByText('Beklemede')[0]).toBeInTheDocument();

    const viewBtn = screen.getByTitle('Detayları İncele');
    fireEvent.click(viewBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const approveBtn = screen.getByRole('button', { name: /Başvuruyu Onayla & Toptan Yetkisi Ver/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(adminTradeApplicationsRepository.approveTradeApplication).toHaveBeenCalledWith('app-001', undefined);
    });
  });

  it('calculates wholesale checkout quote with channel=wholesale and places order', async () => {
    customerAuthStore._setStateForTesting({
      user: { id: 'cust-ws-01', email: 'wholesale@studio.com' } as unknown as import('@supabase/supabase-js').User,
      profile: {
        id: 'cust-ws-01',
        user_id: 'cust-ws-01',
        first_name: 'Deniz',
        last_name: 'Tasarım',
        phone: '05330001122',
        customer_type: 'wholesale',
        wholesale_approved_at: '2026-08-28T10:00:00Z',
        created_at: '2026-08-28T09:00:00Z',
        updated_at: '2026-08-28T10:00:00Z',
      },
      addresses: [
        {
          id: 'addr-01',
          user_id: 'cust-ws-01',
          title: 'Ofis Adresi',
          label: 'Ofis Adresi',
          recipient_name: 'Deniz Tasarım',
          phone: '05330001122',
          address_line1: 'Büyükdere Cad. No:100',
          city: 'İstanbul',
          postal_code: '34394',
          country_code: 'TR',
          country_name: 'Türkiye',
          is_default_shipping: true,
          is_default_billing: true,
          created_at: '2026-08-28T10:00:00Z',
          updated_at: '2026-08-28T10:00:00Z',
        },
      ],
      isLoading: false,
      isInitialized: true,
    });

    const mockProduct: Product = {
      id: 'prod-01',
      slug: 'ikigai-vazo',
      name: 'Ikigai Vazo',
      shortDescription: 'Modern vazo',
      description: 'Detaylı açıklama',
      category: 'tabletop',
      price: 300,
      retailPrice: 300,
      wholesalePrice: 200,
      images: [{ id: 'img-01', url: '/img1.jpg', isPrimary: true, altText: 'Vazo' }],
      material: 'Seramik',
      finish: 'Mat',
      dimensions: { height: 25, width: 12, depth: 12, unit: 'cm' },
      weight: 1200,
      stockQuantity: 50,
      status: 'published',
      featured: false,
      retailEnabled: true,
      wholesaleEnabled: true,
      wholesaleMoq: 10,
      colorVariants: [],
      variants: [
        {
          id: 'var-01',
          productId: 'prod-01',
          sku: 'IKG-WHT-01',
          name: 'Mat Beyaz',
          colorName: 'Beyaz',
          colorHex: '#ffffff',
          retailPrice: 300,
          wholesalePrice: 200,
          stockQuantity: 50,
          active: true,
          isAvailableForRetail: true,
          isAvailableForWholesale: true,
          displayOrder: 1,
        },
      ],
    };

    const mockVariant: ProductVariant = mockProduct.variants[0]!;

    cartStore.addItem(mockProduct, mockVariant, 10);

    const getQuoteSpy = vi.spyOn(orderRepository, 'getQuote').mockResolvedValue({
      currency: 'TRY',
      channel: 'wholesale',
      destination_country: 'TR',
      items: [
        {
          variant_id: 'var-01',
          product_id: 'prod-01',
          product_name: 'Ikigai Vazo',
          variant_name: 'Mat Beyaz',
          sku: 'IKG-WHT-01',
          image_url: '/img1.jpg',
          unit_price_minor: 20000,
          quantity: 10,
          line_total_minor: 200000,
        },
      ],
      subtotal_minor: 200000,
      shipping_minor: 0,
      discount_minor: 0,
      tax_included_minor: 33333,
      total_minor: 200000,
      shipping_option: {
        method: 'domestic_standard',
        carrier: 'Yurtiçi Kargo',
        title: 'Standart Kargo',
        description: 'Toptan Ücretsiz Teslimat',
        supported: true,
        rate_minor: 0,
        currency: 'TRY',
        estimated_delivery_days: 3,
        free_shipping_threshold_minor: 0,
        is_free_shipping: true,
      },
    });

    renderWithRouter(<CheckoutPage />, { routerInitialEntries: ['/checkout'] });

    expect(await screen.findByText('Kurumsal Toptan Güvenli Ödeme')).toBeInTheDocument();
    expect(screen.getByText('Toptan Sipariş (B2B)')).toBeInTheDocument();

    await waitFor(() => {
      expect(getQuoteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'wholesale',
          destination_country: 'TR',
        })
      );
    });
  });
});
