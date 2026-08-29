import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { CartPage } from '@/site/pages/CartPage';
import { renderWithRouter } from 'tests/utils/render-utils';
import { cartStore } from '@/shared/stores/cart-store';
import { useSiteSettings } from '@/shared/stores/settings-store';
import { createProduct, createVariant } from 'tests/factories/product.factory';
import { DEFAULT_PUBLIC_SITE_SETTINGS } from '@/entities/settings/types';

vi.mock('@/shared/stores/settings-store', () => ({
  useSiteSettings: vi.fn(),
}));

describe('CartPage Checkout Enablement Gate (Phase 3.10)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cartStore.clear();
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
});
