import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { ProductPurchasePanel } from '@/site/components/pdp/ProductPurchasePanel';
import { renderWithRouter } from 'tests/utils/render-utils';
import { createProduct, createVariant } from 'tests/factories/product.factory';
import { cartStore } from '@/shared/stores/cart-store';
import { wishlistStore } from '@/shared/stores/wishlist-store';
import { customerAuthStore } from '@/shared/stores/customer-auth-store';
import type { User } from '@supabase/supabase-js';
import type { CustomerProfile } from '@/entities/customer/types';

describe('ProductPurchasePanel Component', () => {
  beforeEach(() => {
    cartStore.clear();
    wishlistStore.clear();
    customerAuthStore._setStateForTesting({ user: null, profile: null });
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

  it('does not display wholesale tier banner for retail customer, but displays it for approved wholesale customer', () => {
    const variant = createVariant({ retailPrice: 1450, stockQuantity: 20 });
    const product = createProduct({
      retailPrice: 1450,
      variants: [variant],
      wholesale: {
        isWholesaleEnabled: true,
        minOrderQuantity: 6,
        tiers: [{ minQuantity: 6, maxQuantity: 11, unitPrice: 1160, discountPercentage: 20 }],
      },
    });

    // 1. Retail / unauthenticated customer: selecting quantity 6 does not show discount banner
    const { unmount } = renderWithRouter(
      <ProductPurchasePanel
        product={product}
        selectedVariant={variant}
        onSelectVariant={vi.fn()}
      />
    );

    const incrementBtn = screen.getByRole('button', { name: 'Adet Artır' });
    for (let i = 0; i < 5; i++) {
      fireEvent.click(incrementBtn);
    }
    expect(screen.queryByText(/%20 Toplu Alım İndirimi/)).not.toBeInTheDocument();
    unmount();

    // 2. Approved wholesale customer: selecting quantity 6 DOES show discount banner
    customerAuthStore._setStateForTesting({
      user: { id: 'usr-ws' } as unknown as User,
      profile: { customer_type: 'wholesale', wholesale_approved_at: '2026-01-01' } as unknown as CustomerProfile,
    });

    renderWithRouter(
      <ProductPurchasePanel
        product={product}
        selectedVariant={variant}
        onSelectVariant={vi.fn()}
      />
    );

    const incrementBtnWs = screen.getByRole('button', { name: 'Adet Artır' });
    for (let i = 0; i < 5; i++) {
      fireEvent.click(incrementBtnWs);
    }

    expect(screen.getByText(/%20 Toplu Alım İndirimi/)).toBeInTheDocument();
    expect(screen.getAllByText(/1\.160/).length).toBeGreaterThan(0);
  });

  it('clamps quantity when active variant stock is lower than selected quantity', () => {
    const variantHighStock: ProductVariant = {
      id: 'v-high',
      sku: 'TEST-HIGH',
      variantName: 'Beyaz (Yüksek Stok)',
      colorName: 'Beyaz',
      colorHex: '#FFFFFF',
      retailPrice: 1000,
      stockQuantity: 10,
      isAvailableForRetail: true,
      isAvailableForWholesale: true,
    };

    const variantLowStock: ProductVariant = {
      id: 'v-low',
      sku: 'TEST-LOW',
      variantName: 'Siyah (Düşük Stok)',
      colorName: 'Siyah',
      colorHex: '#000000',
      retailPrice: 1000,
      stockQuantity: 5,
      isAvailableForRetail: true,
      isAvailableForWholesale: true,
    };

    const productMultiVariants = createProduct({
      variants: [variantHighStock, variantLowStock],
    });

    const { rerender } = renderWithRouter(
      <ProductPurchasePanel
        product={productMultiVariants}
        selectedVariant={variantHighStock}
        onSelectVariant={vi.fn()}
      />
    );

    // Increase quantity to 8
    const incrementBtn = screen.getByRole('button', { name: 'Adet Artır' });
    for (let i = 0; i < 7; i++) {
      fireEvent.click(incrementBtn);
    }
    expect(screen.getByText('8')).toBeInTheDocument();

    // Now switch variant to variantLowStock (max stock: 5)
    rerender(
      <ProductPurchasePanel
        product={productMultiVariants}
        selectedVariant={variantLowStock}
        onSelectVariant={vi.fn()}
      />
    );

    // Quantity should automatically clamp to 5
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText(/Stokta Mevcut \(5 adet\)/)).toBeInTheDocument();
  });
});
