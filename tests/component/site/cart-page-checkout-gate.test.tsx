import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { CartPage } from '@/site/pages/CartPage';
import { renderWithRouter } from 'tests/utils/render-utils';
import { cartStore } from '@/shared/stores/cart-store';
import { customerAuthStore } from '@/shared/stores/customer-auth-store';
import type { User } from '@supabase/supabase-js';
import type { CustomerProfile } from '@/entities/customer/types';
import { useSiteSettings } from '@/shared/stores/settings-store';
import { createProduct, createVariant } from 'tests/factories/product.factory';
import { DEFAULT_PUBLIC_SITE_SETTINGS } from '@/entities/settings/types';

vi.mock('@/shared/stores/settings-store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/stores/settings-store')>();
  return {
    ...actual,
    useSiteSettings: vi.fn(),
  };
});

describe('CartPage Checkout Enablement Gate (Phase 3.10)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cartStore.clear();
    customerAuthStore._setStateForTesting({ user: null, profile: null });
  });

  it('renders disabled checkout button when checkoutEnabled is false', () => {
    vi.mocked(useSiteSettings).mockReturnValue({
      settings: {
        ...DEFAULT_PUBLIC_SITE_SETTINGS,
        commerce: {
          ...DEFAULT_PUBLIC_SITE_SETTINGS.commerce,
          checkoutEnabled: false,
        },
      },
      isLoading: false,
      error: null,
    });

    const product = createProduct({ id: 'p-cart-01', name: 'Monocactus Vazo', retailPrice: 1200 });
    const variant = createVariant({ id: 'v-cart-01', title: 'Beyaz', retailPrice: 1200, stockQuantity: 5 });
    cartStore.addItem(product, variant, 1);

    renderWithRouter(<CartPage />);

    expect(screen.getByText('Sipariş Sistemi Hazırlık Aşamasında')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sipariş Sistemi Hazırlık Aşamasında/i })).toBeDisabled();
    expect(screen.queryByRole('link', { name: /Ödemeye Geç/i })).not.toBeInTheDocument();
  });

  it('renders active checkout CTA link when checkoutEnabled is true', () => {
    vi.mocked(useSiteSettings).mockReturnValue({
      settings: {
        ...DEFAULT_PUBLIC_SITE_SETTINGS,
        commerce: {
          ...DEFAULT_PUBLIC_SITE_SETTINGS.commerce,
          checkoutEnabled: true,
        },
      },
      isLoading: false,
      error: null,
    });

    const product = createProduct({ id: 'p-cart-02', name: 'Monocactus Vazo 2', retailPrice: 2000 });
    const variant = createVariant({ id: 'v-cart-02', title: 'Siyah', retailPrice: 2000, stockQuantity: 5 });
    cartStore.addItem(product, variant, 1);

    renderWithRouter(<CartPage />);

    expect(screen.getByRole('link', { name: /Ödemeye Geç/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Sipariş Sistemi Hazırlık Aşamasında/i })).not.toBeInTheDocument();
  });

  it('renders volume discount badge, strikethrough price, and discount text in CartPage for wholesale customer', () => {
    customerAuthStore._setStateForTesting({
      user: { id: 'usr-ws' } as unknown as User,
      profile: { customer_type: 'wholesale', wholesale_approved_at: '2026-01-01' } as unknown as CustomerProfile,
    });

    vi.mocked(useSiteSettings).mockReturnValue({
      settings: {
        ...DEFAULT_PUBLIC_SITE_SETTINGS,
        commerce: {
          ...DEFAULT_PUBLIC_SITE_SETTINGS.commerce,
          checkoutEnabled: true,
        },
      },
      isLoading: false,
      error: null,
    });

    const product = createProduct({
      id: 'p-cart-03',
      name: 'Lunea Form No.4',
      retailPrice: 1450,
      wholesale: {
        isWholesaleEnabled: true,
        minOrderQuantity: 6,
        tiers: [{ minQuantity: 6, maxQuantity: 11, unitPrice: 1160, discountPercentage: 20 }],
      },
    });
    const variant = createVariant({ id: 'v-cart-03', retailPrice: 1450, stockQuantity: 20 });
    cartStore.addItem(product, variant, 6);

    renderWithRouter(<CartPage />);

    expect(screen.getByText(/-%20 Toplu Alım/)).toBeInTheDocument();
    expect(screen.getByText(/%20 İskonto Uygulandı/)).toBeInTheDocument();
    expect(screen.getAllByText(/6\.960/).length).toBeGreaterThan(0);
  });

  it('renders dynamic shipping estimate, summary, and returns text from site settings in CartPage', () => {
    vi.mocked(useSiteSettings).mockReturnValue({
      settings: {
        ...DEFAULT_PUBLIC_SITE_SETTINGS,
        commerce: {
          ...DEFAULT_PUBLIC_SITE_SETTINGS.commerce,
          shippingEstimateText: 'Ödeme adımında hesaplanıraaa',
          shippingSummary: 'Güvenli Alışveriş ve Sigortalı Sevkiyataaa',
          returnsPolicyText: 'Teslimattan itibaren 14 gün içinde iade imkanı.aaa',
        },
      },
      isLoading: false,
      error: null,
    });

    const product = createProduct({ id: 'p-cart-04', name: 'Vazo Test', retailPrice: 1000 });
    const variant = createVariant({ id: 'v-cart-04', retailPrice: 1000, stockQuantity: 10 });
    cartStore.addItem(product, variant, 1);

    renderWithRouter(<CartPage />);

    expect(screen.getByText('Ödeme adımında hesaplanıraaa')).toBeInTheDocument();
    expect(screen.getByText('Güvenli Alışveriş ve Sigortalı Sevkiyataaa')).toBeInTheDocument();
    expect(screen.getByText('Teslimattan itibaren 14 gün içinde iade imkanı.aaa')).toBeInTheDocument();
  });
});
