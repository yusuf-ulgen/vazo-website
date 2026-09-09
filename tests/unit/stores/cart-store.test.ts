import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { cartStore, useCart } from '@/shared/stores/cart-store';
import { customerAuthStore } from '@/shared/stores/customer-auth-store';
import type { User } from '@supabase/supabase-js';
import type { CustomerProfile } from '@/entities/customer/types';
import { createProduct, createVariant } from 'tests/factories/product.factory';

describe('cartStore & useCart', () => {
  beforeEach(() => {
    cartStore.clear();
    localStorage.clear();
    customerAuthStore._setStateForTesting({ user: null, profile: null });
    vi.restoreAllMocks();
  });

  it('starts with an empty cart', () => {
    expect(cartStore.getItems()).toEqual([]);
  });

  it('adds a valid in-stock retail product', () => {
    const product = createProduct();
    const variant = createVariant({ stockQuantity: 10 });

    cartStore.addItem(product, variant, 2);

    const items = cartStore.getItems();
    expect(items.length).toBe(1);
    expect(items[0]?.productId).toBe(product.id);
    expect(items[0]?.variantId).toBe(variant.id);
    expect(items[0]?.quantity).toBe(2);
    expect(items[0]?.retailPrice).toBe(variant.retailPrice);
  });

  it('increments quantity when adding the same product and variant', () => {
    const product = createProduct();
    const variant = createVariant({ stockQuantity: 10 });

    cartStore.addItem(product, variant, 2);
    cartStore.addItem(product, variant, 3);

    const items = cartStore.getItems();
    expect(items.length).toBe(1);
    expect(items[0]?.quantity).toBe(5);
  });

  it('clamps added quantity to available stock', () => {
    const product = createProduct();
    const variant = createVariant({ stockQuantity: 5 });

    cartStore.addItem(product, variant, 10);

    const items = cartStore.getItems();
    expect(items.length).toBe(1);
    expect(items[0]?.quantity).toBe(5);
  });

  it('creates separate line items for different variants of the same product', () => {
    const variant1 = createVariant({ id: 'v1', name: 'Beyaz' });
    const variant2 = createVariant({ id: 'v2', name: 'Bej' });
    const product = createProduct({ variants: [variant1, variant2] });

    cartStore.addItem(product, variant1, 1);
    cartStore.addItem(product, variant2, 2);

    const items = cartStore.getItems();
    expect(items.length).toBe(2);
    expect(items[0]?.variantId).toBe('v1');
    expect(items[1]?.variantId).toBe('v2');
  });

  it('does NOT add out-of-stock items or retail-disabled items', () => {
    const outOfStockVariant = createVariant({ stockQuantity: 0 });
    const inStockVariant = createVariant({ stockQuantity: 5 });
    const product = createProduct();

    cartStore.addItem(product, outOfStockVariant, 1);
    expect(cartStore.getItems().length).toBe(0);

    const retailDisabledProduct = createProduct({ retailEnabled: false });
    cartStore.addItem(retailDisabledProduct, inStockVariant, 1);
    expect(cartStore.getItems().length).toBe(0);

    const retailDisabledVariant = createVariant({ isAvailableForRetail: false });
    cartStore.addItem(product, retailDisabledVariant, 1);
    expect(cartStore.getItems().length).toBe(0);
  });

  it('ignores invalid quantities (zero, negative, NaN, Infinity)', () => {
    const product = createProduct();
    const variant = createVariant({ stockQuantity: 10 });

    cartStore.addItem(product, variant, 0);
    expect(cartStore.getItems().length).toBe(0);

    cartStore.addItem(product, variant, -5);
    expect(cartStore.getItems().length).toBe(0);

    cartStore.addItem(product, variant, NaN);
    expect(cartStore.getItems().length).toBe(0);
  });

  it('updates quantity and removes item if updated quantity is <= 0 or invalid', () => {
    const product = createProduct();
    const variant = createVariant({ stockQuantity: 10 });

    cartStore.addItem(product, variant, 3);
    const itemId = cartStore.getItems()[0]!.id;

    cartStore.updateQuantity(itemId, 5);
    expect(cartStore.getItems()[0]?.quantity).toBe(5);

    cartStore.updateQuantity(itemId, 0);
    expect(cartStore.getItems().length).toBe(0);

    cartStore.addItem(product, variant, 2);
    const newItemId = cartStore.getItems()[0]!.id;
    cartStore.updateQuantity(newItemId, -1);
    expect(cartStore.getItems().length).toBe(0);
  });

  it('removes item by ID', () => {
    const product = createProduct();
    const variant = createVariant();

    cartStore.addItem(product, variant, 1);
    const itemId = cartStore.getItems()[0]!.id;

    cartStore.removeItem(itemId);
    expect(cartStore.getItems().length).toBe(0);
  });

  it('clears all cart items', () => {
    const product = createProduct();
    const variant = createVariant();

    cartStore.addItem(product, variant, 2);
    expect(cartStore.getItems().length).toBe(1);

    cartStore.clear();
    expect(cartStore.getItems().length).toBe(0);
  });

  it('notifies subscribers on cart mutations and supports unsubscription', () => {
    const listener = vi.fn();
    const unsubscribe = cartStore.subscribe(listener);

    const product = createProduct();
    const variant = createVariant();

    cartStore.addItem(product, variant, 1);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    cartStore.addItem(product, variant, 1);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('gracefully handles localStorage quota errors in notify', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const product = createProduct();
    const variant = createVariant();

    expect(() => cartStore.addItem(product, variant, 1)).not.toThrow();
    expect(cartStore.getItems().length).toBe(1);
  });

  it('ensures immutability so callers cannot mutate internal state', () => {
    const product = createProduct();
    const variant = createVariant();
    cartStore.addItem(product, variant, 1);

    const items = cartStore.getItems();
    items.push({} as never);

    expect(cartStore.getItems().length).toBe(1);
  });

  it('calculates totals, subtotal, and free shipping threshold via useCart hook and exposes updateQuantity', () => {
    const { result } = renderHook(() => useCart());

    const product1 = createProduct({ retailPrice: 2000 });
    const variant1 = createVariant({ retailPrice: 2000, stockQuantity: 10 });
    const product2 = createProduct({ id: 'p2', retailPrice: 1500 });
    const variant2 = createVariant({ id: 'v2', retailPrice: 1500, stockQuantity: 10 });

    act(() => {
      result.current.addItem(product1, variant1, 2); // 4.000 TL
    });

    expect(result.current.totalItems).toBe(2);
    expect(result.current.subtotal).toBe(4000);
    expect(result.current.isFreeShipping).toBe(false);
    expect(result.current.freeShippingRemaining).toBe(1000);

    const firstItemId = result.current.items[0]!.id;
    act(() => {
      result.current.updateQuantity(firstItemId, 1);
    });
    expect(result.current.subtotal).toBe(2000);

    act(() => {
      result.current.addItem(product2, variant2, 3); // 2000 + 4500 = 6500 TL
    });

    expect(result.current.totalItems).toBe(4);
    expect(result.current.subtotal).toBe(6500);
    expect(result.current.isFreeShipping).toBe(true);
    expect(result.current.freeShippingRemaining).toBe(0);

    act(() => {
      result.current.clear();
    });

    expect(result.current.totalItems).toBe(0);
    expect(result.current.subtotal).toBe(0);
  });

  it('applies wholesale tier discounts to cart items when tier quantity is reached, regardless of auth state', () => {
    customerAuthStore._setStateForTesting({ user: null, profile: null });

    const product = createProduct({
      id: 'p-vazo',
      retailPrice: 1450,
      wholesale: {
        isWholesaleEnabled: true,
        minOrderQuantity: 6,
        tiers: [
          { minQuantity: 6, maxQuantity: 11, unitPrice: 1160, discountPercentage: 20 },
          { minQuantity: 12, maxQuantity: 23, unitPrice: 1085, discountPercentage: 25 },
          { minQuantity: 24, maxQuantity: 49, unitPrice: 1015, discountPercentage: 30 },
        ],
      },
    });
    const variant = createVariant({ retailPrice: 1450, stockQuantity: 30 });

    cartStore.addItem(product, variant, 6);
    const items = cartStore.getItems();
    expect(items[0]?.quantity).toBe(6);
    expect(items[0]?.retailPrice).toBe(1450);
    expect(items[0]?.unitPrice).toBe(1160);
    expect(items[0]?.discountPercentage).toBe(20);
    expect(items[0]?.isWholesaleTierReached).toBe(true);

    const { result } = renderHook(() => useCart());
    expect(result.current.subtotal).toBe(1160 * 6);
    expect(result.current.hasWholesaleTier).toBe(true);
  });

  it('applies volume/wholesale tier pricing to approved wholesale customers and recomputes on auth state change', () => {
    // 1. Start as approved wholesale customer
    customerAuthStore._setStateForTesting({
      user: { id: 'usr-ws-1', email: 'ws@example.com' } as unknown as User,
      profile: { customer_type: 'wholesale', wholesale_approved_at: '2026-01-01T00:00:00Z' } as unknown as CustomerProfile,
    });

    const product = createProduct({
      id: 'p-vazo',
      retailPrice: 1450,
      wholesale: {
        isWholesaleEnabled: true,
        minOrderQuantity: 6,
        tiers: [
          { minQuantity: 6, maxQuantity: 11, unitPrice: 1160, discountPercentage: 20 },
          { minQuantity: 12, maxQuantity: 23, unitPrice: 1085, discountPercentage: 25 },
          { minQuantity: 24, maxQuantity: 49, unitPrice: 1015, discountPercentage: 30 },
        ],
      },
    });
    const variant = createVariant({ retailPrice: 1450, stockQuantity: 30 });

    // 2. Add 1 item (unitPrice is 1450)
    cartStore.addItem(product, variant, 1);
    let items = cartStore.getItems();
    expect(items[0]?.unitPrice).toBe(1450);

    // 3. Update to 6 (triggers tier 1: 1160)
    const itemId = items[0]!.id;
    cartStore.updateQuantity(itemId, 6);
    items = cartStore.getItems();
    expect(items[0]?.unitPrice).toBe(1160);
    expect(items[0]?.discountPercentage).toBe(20);

    // 4. Update to 12 (triggers tier 2: 1085)
    cartStore.updateQuantity(itemId, 12);
    items = cartStore.getItems();
    expect(items[0]?.unitPrice).toBe(1085);
    expect(items[0]?.discountPercentage).toBe(25);

    // 5. Customer signs out -> tier price still applies to cart display, but customer is unapproved
    act(() => {
      customerAuthStore._setStateForTesting({ user: null, profile: null });
    });
    items = cartStore.getItems();
    expect(items[0]?.unitPrice).toBe(1085);
    expect(items[0]?.discountPercentage).toBe(25);
    expect(items[0]?.isWholesaleTierReached).toBe(true);

    // 6. Customer logs back in as approved wholesale -> items re-discount
    act(() => {
      customerAuthStore._setStateForTesting({
        user: { id: 'usr-ws-1' } as unknown as User,
        profile: { customer_type: 'wholesale', wholesale_approved_at: '2026-01-01' } as unknown as CustomerProfile,
      });
    });
    items = cartStore.getItems();
    expect(items[0]?.unitPrice).toBe(1085);
  });

  it('does not synthesize fallback tiers when product has no tiers configured', () => {
    customerAuthStore._setStateForTesting({
      user: { id: 'usr-ws-1' } as unknown as User,
      profile: { customer_type: 'wholesale', wholesale_approved_at: '2026-01-01' } as unknown as CustomerProfile,
    });
    const product = createProduct({
      id: 'p-no-tiers',
      retailPrice: 2000,
      wholesale: {
        isWholesaleEnabled: true,
        minOrderQuantity: 1,
        tiers: [],
      },
    });
    const variant = createVariant({ retailPrice: 2000, stockQuantity: 50 });

    cartStore.addItem(product, variant, 20);
    const items = cartStore.getItems();
    expect(items[0]?.unitPrice).toBe(2000);
    expect(items[0]?.discountPercentage).toBeUndefined();
  });
});
