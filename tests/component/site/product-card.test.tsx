import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '@/site/components/ProductCard';
import { renderWithRouter } from 'tests/utils/render-utils';
import { createProduct } from 'tests/factories/product.factory';
import { wishlistStore } from '@/shared/stores/wishlist-store';

describe('ProductCard Component', () => {
  beforeEach(() => {
    wishlistStore.clear();
  });

  it('renders product name, material, retail price, and image', () => {
    const product = createProduct({
      name: 'Amforik Vazo',
      material: 'Stoneware',
      retailPrice: 1850,
      images: [{ id: 'img-1', url: 'https://example.com/1.jpg', alt: 'Amforik Vazo', isPrimary: true }],
    });

    renderWithRouter(<ProductCard product={product} showWholesaleBadge />);

    expect(screen.getByText('Amforik Vazo')).toBeInTheDocument();
    expect(screen.getByText('Stoneware')).toBeInTheDocument();
    expect(screen.getByText(/1\.850/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Amforik Vazo' })).toBeInTheDocument();
  });

  it('toggles wishlist favorite button and updates accessible label', () => {
    const product = createProduct({ id: 'prod-favorite-test' });

    renderWithRouter(<ProductCard product={product} />);

    const favoriteBtn = screen.getByRole('button', { name: 'Favorilere Ekle' });
    fireEvent.click(favoriteBtn);

    expect(wishlistStore.has('prod-favorite-test')).toBe(true);
    expect(screen.getByRole('button', { name: 'Favorilerden Çıkar' })).toBeInTheDocument();
  });

  it('displays B2B starting wholesale price when enabled', () => {
    const product = createProduct({
      wholesale: {
        isWholesaleEnabled: true,
        minOrderQuantity: 6,
        startingWholesalePrice: 1387.5,
        tiers: [{ minQuantity: 6, unitPrice: 1387.5 }],
      },
    });

    renderWithRouter(<ProductCard product={product} showWholesaleBadge />);

    expect(screen.getByText(/B2B:/)).toBeInTheDocument();
  });
});
