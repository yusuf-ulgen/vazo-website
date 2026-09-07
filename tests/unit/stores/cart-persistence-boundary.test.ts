import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CART_STORAGE_KEY,
  CART_STORAGE_VERSION,
  cartStore,
  type CartStorageEnvelope,
} from '@/shared/stores/cart-store';
import { createProduct, createVariant } from 'tests/factories/product.factory';

describe('Cart Persistence Boundary (Phase 3.12 Goal C)', () => {
  beforeEach(() => {
    localStorage.clear();
    cartStore.clear();
    vi.restoreAllMocks();
  });

  it('persists cart using the versioned storage envelope', () => {
    const product = createProduct({ id: 'p-env-1', retailPrice: 1500 });
    const variant = createVariant({ id: 'v-env-1', retailPrice: 1500, stockQuantity: 20 });

    cartStore.addItem(product, variant, 2);

    const raw = localStorage.getItem(CART_STORAGE_KEY);
    expect(raw).toBeTruthy();

    const parsed: CartStorageEnvelope = JSON.parse(raw!);
    expect(parsed.version).toBe(CART_STORAGE_VERSION);
    expect(parsed.catalogMode).toBeDefined();
    expect(Array.isArray(parsed.items)).toBe(true);
    expect(parsed.items.length).toBe(1);
    expect(parsed.items[0]?.productId).toBe('p-env-1');
    expect(parsed.items[0]?.quantity).toBe(2);
  });

  it('gracefully handles malformed JSON without crashing or throwing', () => {
    localStorage.setItem(CART_STORAGE_KEY, '{ corrupt-json ::: !!!');

    // Initializing or reading from cartStore should not throw
    expect(() => {
      cartStore.init();
    }).not.toThrow();

    expect(cartStore.getItems()).toEqual([]);
  });

  it('migrates legacy raw array storage when running in mock mode', () => {
    const legacyItems = [
      {
        id: 'p1:v1',
        productId: 'p1',
        variantId: 'v1',
        productName: 'Eski Vazo',
        variantName: 'Beyaz',
        sku: 'VAZO-01',
        retailPrice: 1200,
        unitPrice: 1200,
        quantity: 1,
        imageUrl: null,
      },
    ];
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(legacyItems));

    cartStore.init();

    // In mock test environment, legacy items are loaded
    const items = cartStore.getItems();
    expect(items.length).toBe(1);
    expect(items[0]?.productId).toBe('p1');

    // And persisted back as a versioned envelope
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    const parsed: CartStorageEnvelope = JSON.parse(raw!);
    expect(parsed.version).toBe(CART_STORAGE_VERSION);
    expect(parsed.items.length).toBe(1);
  });

  it('isolates and clears stored items if envelope belongs to a different catalogMode', () => {
    // If the saved envelope was from 'live' mode with different DB UUIDs,
    // and current environment is 'mock', it must clear and not leak foreign items
    const foreignEnvelope: CartStorageEnvelope = {
      version: 1,
      catalogMode: 'live',
      items: [
        {
          id: 'live-p:live-v',
          productId: '11111111-1111-1111-1111-111111111111',
          variantId: '22222222-2222-2222-2222-222222222222',
          productName: 'Canlı DB Vazo',
          variantName: 'Siyah',
          sku: 'LIVE-01',
          retailPrice: 3500,
          unitPrice: 3500,
          quantity: 1,
          imageUrl: null,
        },
      ],
    };
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(foreignEnvelope));

    cartStore.init();

    // Since catalogMode differs from test runner's current mode ('mock'), it drops foreign items
    expect(cartStore.getItems()).toEqual([]);
  });

  it('rejects unsupported schema versions gracefully', () => {
    const futureEnvelope = {
      version: 999,
      catalogMode: 'mock',
      items: [{ id: 'future-item', productId: 'p', variantId: 'v', productName: 'p', variantName: 'v', sku: 's', retailPrice: 100, unitPrice: 100, quantity: 1, imageUrl: null }],
    };
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(futureEnvelope));

    cartStore.init();

    expect(cartStore.getItems()).toEqual([]);
  });
});
