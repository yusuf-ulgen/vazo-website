import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { ProductPurchasePanel } from '@/site/components/pdp/ProductPurchasePanel';
import { renderWithRouter } from 'tests/utils/render-utils';
import { createProduct, createVariant } from 'tests/factories/product.factory';
import { cartStore } from '@/shared/stores/cart-store';
import { wishlistStore } from '@/shared/stores/wishlist-store';

describe('ProductPurchasePanel Component', () => {
  beforeEach(() => {
    cartStore.clear();
    wishlistStore.clear();
  });

  it('renders in-stock product, selects quantity, and adds to cart', () => {
    const variant = createVariant({ retailPrice: 1850, stockQuantity: 20 });
    const product = createProduct({ variants: [variant] });

    renderWithRouter(
      <ProductPurchasePanel
        product={product}
        selectedVariant={variant}
        onSelectVariant={vi.fn()}
      />
    );

    expect(screen.getByText('Stokta Mevcut (20 adet)')).toBeInTheDocument();
    expect(screen.getByText(/1\.850/)).toBeInTheDocument();

    const addToCartBtn = screen.getByRole('button', { name: 'Sepete Ekle' });
    fireEvent.click(addToCartBtn);

    expect(cartStore.getItems().length).toBe(1);
    expect(cartStore.getItems()[0]?.quantity).toBe(1);
  });

  it('correctly handles zero stock (stockQuantity = 0): shows out of stock and disables Add to Cart', () => {
    const zeroStockVariant = createVariant({ stockQuantity: 0 });
    const product = createProduct({ variants: [zeroStockVariant] });

    renderWithRouter(
      <ProductPurchasePanel
        product={product}
        selectedVariant={zeroStockVariant}
        onSelectVariant={vi.fn()}
      />
    );

    expect(screen.getByText('Tükendi (Stokta Yok)')).toBeInTheDocument();

    const disabledBtn = screen.getByRole('button', { name: 'Stokta Yok' });
    expect(disabledBtn).toBeDisabled();

    fireEvent.click(disabledBtn);
    expect(cartStore.getItems().length).toBe(0);
  });

  it('handles retail disabled product / variant', () => {
    const wholesaleOnlyVariant = createVariant({
      stockQuantity: 10,
      isAvailableForRetail: false,
    });
    const product = createProduct({
      retailEnabled: false,
      variants: [wholesaleOnlyVariant],
    });

    renderWithRouter(
      <ProductPurchasePanel
        product={product}
        selectedVariant={wholesaleOnlyVariant}
        onSelectVariant={vi.fn()}
      />
    );

    expect(screen.getByText('Yalnızca Toptan Satış')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Perakende Kapalı' })).toBeDisabled();
  });

  it('switches variant when clicking color swatch', () => {
    const variant1 = createVariant({ id: 'v1', colorName: 'Beyaz' });
    const variant2 = createVariant({ id: 'v2', colorName: 'Antrasit' });
    const product = createProduct({ variants: [variant1, variant2] });
    const handleSelectVariant = vi.fn();

    renderWithRouter(
      <ProductPurchasePanel
        product={product}
        selectedVariant={variant1}
        onSelectVariant={handleSelectVariant}
      />
    );

    const swatch2 = screen.getByRole('button', { name: 'Renk: Antrasit' });
    fireEvent.click(swatch2);

    expect(handleSelectVariant).toHaveBeenCalledWith(variant2);
  });

  it('toggles wishlist status', () => {
    const product = createProduct({ id: 'p-wish' });
    const variant = createVariant();

    renderWithRouter(
      <ProductPurchasePanel
        product={product}
        selectedVariant={variant}
        onSelectVariant={vi.fn()}
      />
    );

    const wishBtn = screen.getByRole('button', { name: 'Favorilere Ekle' });
    fireEvent.click(wishBtn);

    expect(wishlistStore.has('p-wish')).toBe(true);
  });
});
