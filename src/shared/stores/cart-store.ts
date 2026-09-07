import { useState, useEffect } from 'react';
import { Product, ProductVariant, WholesalePricingTier } from '@/entities/product/types';
import { isStorefrontMockEnabled } from '@/shared/lib/supabase';
import { customerAuthStore } from './customer-auth-store';
import { isWholesaleApprovedCustomer } from './customer-auth-helpers';

export interface CartItem {
  id: string; // product_id + variant_id
  productId: string;
  productSlug: string;
  productName: string;
  variantId: string;
  variantName: string;
  colorName: string;
  sku: string;
  retailPrice: number;
  unitPrice: number; // Effective unit price after authorized tier discount
  discountPercentage?: number;
  quantity: number;
  maxStock?: number;
  imageUrl?: string;
  wholesaleTiers?: WholesalePricingTier[];
}

export const CART_STORAGE_KEY = 'vazo_cart_items';
export const CURRENT_CART_STORAGE_VERSION = 1;
export const CART_STORAGE_VERSION = CURRENT_CART_STORAGE_VERSION;

export type CartCatalogMode = 'mock' | 'live';

export interface CartStorageEnvelope {
  version: number;
  catalogMode: CartCatalogMode;
  items: CartItem[];
}

export const PENDING_CHECKOUT_KEY = 'vazo_pending_checkout';

export interface PendingCheckoutInfo {
  orderId: string;
  orderNumber: string;
  createdAt: number;
}

export function getPendingCheckoutInfo(): PendingCheckoutInfo | null {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(PENDING_CHECKOUT_KEY) : null;
    if (!raw) return null;
    return JSON.parse(raw) as PendingCheckoutInfo;
  } catch {
    return null;
  }
}

export function savePendingCheckoutInfo(info: PendingCheckoutInfo | null): void {
  try {
    if (typeof window === 'undefined') return;
    if (info) {
      localStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(info));
    } else {
      localStorage.removeItem(PENDING_CHECKOUT_KEY);
    }
  } catch {
    // Ignore storage quota errors
  }
}

type CartListener = (items: CartItem[]) => void;
const listeners = new Set<CartListener>();

export function getCurrentCatalogMode(): CartCatalogMode {
  return isStorefrontMockEnabled ? 'mock' : 'live';
}

export function isWholesaleAuthorized(): boolean {
  try {
    const profile = customerAuthStore.getState().profile;
    return isWholesaleApprovedCustomer(profile);
  } catch {
    return false;
  }
}

/**
 * Resolves effective unit price and discount percentage.
 * Wholesale tier pricing is ONLY applied if the customer is authorized for wholesale.
 * Retail customers always pay the authoritative retail price.
 */
export function resolveCartItemPricing(
  basePrice: number,
  quantity: number,
  tiers?: WholesalePricingTier[],
  authorized = false
): {
  unitPrice: number;
  discountPercentage?: number;
} {
  // If not authorized for wholesale, or no tiers configured, retail price always applies
  if (!authorized || !tiers || tiers.length === 0 || quantity < 1) {
    return { unitPrice: basePrice, discountPercentage: undefined };
  }

  // Authorized wholesale customer: find matching configured tier
  const matchingTier = tiers.find(
    (t) => quantity >= t.minQuantity && (t.maxQuantity === undefined || quantity <= t.maxQuantity)
  );

  if (matchingTier) {
    const unitPrice =
      matchingTier.unitPrice && matchingTier.unitPrice > 0
        ? matchingTier.unitPrice
        : matchingTier.discountPercentage
        ? Math.round(basePrice * (1 - matchingTier.discountPercentage / 100))
        : basePrice;

    const discountPercentage =
      matchingTier.discountPercentage ||
      (basePrice > 0 && unitPrice < basePrice ? Math.round(((basePrice - unitPrice) / basePrice) * 100) : undefined);

    return {
      unitPrice,
      discountPercentage,
    };
  }

  return { unitPrice: basePrice, discountPercentage: undefined };
}

export function sanitizeCartItem(raw: unknown, authorized = isWholesaleAuthorized()): CartItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;

  const productSlug =
    typeof item.productSlug === 'string' && item.productSlug
      ? item.productSlug
      : typeof item.productId === 'string'
      ? item.productId
      : '';

  if (
    typeof item.id !== 'string' ||
    typeof item.productId !== 'string' ||
    !productSlug ||
    typeof item.productName !== 'string' ||
    typeof item.retailPrice !== 'number' ||
    !Number.isFinite(item.retailPrice) ||
    item.retailPrice < 0 ||
    typeof item.quantity !== 'number' ||
    !Number.isFinite(item.quantity) ||
    item.quantity <= 0
  ) {
    return null;
  }

  const basePrice = item.retailPrice;
  const qty = Math.floor(item.quantity);
  const rawTiers = Array.isArray(item.wholesaleTiers) ? (item.wholesaleTiers as WholesalePricingTier[]) : undefined;
  const pricing = resolveCartItemPricing(basePrice, qty, rawTiers, authorized);

  return {
    id: item.id,
    productId: item.productId,
    productSlug,
    productName: item.productName,
    variantId: typeof item.variantId === 'string' ? item.variantId : '',
    variantName: typeof item.variantName === 'string' ? item.variantName : 'Standart',
    colorName: typeof item.colorName === 'string' ? item.colorName : '',
    sku: typeof item.sku === 'string' ? item.sku : productSlug,
    retailPrice: basePrice,
    unitPrice: pricing.unitPrice,
    discountPercentage: pricing.discountPercentage,
    quantity: qty,
    maxStock: typeof item.maxStock === 'number' && Number.isFinite(item.maxStock) ? item.maxStock : undefined,
    imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : undefined,
    wholesaleTiers: rawTiers,
  };
}

export function saveCartEnvelope(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    const envelope: CartStorageEnvelope = {
      version: CURRENT_CART_STORAGE_VERSION,
      catalogMode: getCurrentCatalogMode(),
      items,
    };
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // Ignore storage quota errors
  }
}

export function getInitialCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  const currentMode = getCurrentCatalogMode();
  const authorized = isWholesaleAuthorized();

  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Malformed JSON: safely reset storage without crashing
      saveCartEnvelope([]);
      return [];
    }

    // 1. Legacy array-only storage: [ ... ]
    if (Array.isArray(parsed)) {
      if (currentMode === 'mock') {
        const sanitized = parsed
          .map((i) => sanitizeCartItem(i, authorized))
          .filter((item): item is CartItem => item !== null);
        saveCartEnvelope(sanitized);
        return sanitized;
      }
      // Live mode: unversioned legacy array cannot become live checkout items
      saveCartEnvelope([]);
      return [];
    }

    // 2. Storage envelope object
    if (parsed && typeof parsed === 'object') {
      const envelope = parsed as Partial<CartStorageEnvelope>;

      if (typeof envelope.version !== 'number' || envelope.version !== CURRENT_CART_STORAGE_VERSION) {
        saveCartEnvelope([]);
        return [];
      }

      // Channel boundary: mock cart cannot become live, live cart cannot become mock
      if (envelope.catalogMode !== currentMode) {
        saveCartEnvelope([]);
        return [];
      }

      if (Array.isArray(envelope.items)) {
        const sanitized = envelope.items
          .map((i) => sanitizeCartItem(i, authorized))
          .filter((item): item is CartItem => item !== null);
        return sanitized;
      }
    }

    saveCartEnvelope([]);
    return [];
  } catch {
    return [];
  }
}

let cartItems: CartItem[] = getInitialCart();

function notify() {
  saveCartEnvelope(cartItems);
  listeners.forEach((listener) => listener([...cartItems]));
}

// Automatically synchronize cart item pricing when customer authorization changes
customerAuthStore.subscribe(() => {
  cartStore.recalculatePricing();
});

export const cartStore = {
  init(): void {
    cartItems = getInitialCart();
    notify();
  },

  getItems(): CartItem[] {
    return [...cartItems];
  },

  recalculatePricing(): void {
    const authorized = isWholesaleAuthorized();
    let hasChanged = false;
    cartItems = cartItems.map((item) => {
      const pricing = resolveCartItemPricing(item.retailPrice, item.quantity, item.wholesaleTiers, authorized);
      if (item.unitPrice !== pricing.unitPrice || item.discountPercentage !== pricing.discountPercentage) {
        hasChanged = true;
        return {
          ...item,
          unitPrice: pricing.unitPrice,
          discountPercentage: pricing.discountPercentage,
        };
      }
      return item;
    });

    if (hasChanged) {
      notify();
    }
  },

  addItem(product: Product, variant?: ProductVariant, quantity = 1) {
    if (product.retailEnabled === false) return;

    const chosenVariant = variant || product.variants[0];
    if (chosenVariant && chosenVariant.isAvailableForRetail === false) return;

    const availableStock = chosenVariant ? (chosenVariant.stockQuantity ?? 0) : 0;
    if (availableStock <= 0) return;

    if (quantity === undefined || Number.isNaN(quantity) || quantity <= 0) return;
    const rawQty = Math.floor(Number(quantity));
    if (!Number.isFinite(rawQty) || rawQty <= 0) return;

    const authorized = isWholesaleAuthorized();
    const baseRetailPrice = chosenVariant?.retailPrice ?? product.retailPrice;

    // Authoritative tiers only - NEVER invent synthetic fallback tiers!
    const tiers: WholesalePricingTier[] | undefined =
      product.wholesale?.tiers && product.wholesale.tiers.length > 0
        ? product.wholesale.tiers
        : undefined;

    const itemId = `${product.id}_${chosenVariant?.id || 'default'}`;
    const existingIndex = cartItems.findIndex((item) => item.id === itemId);

    if (existingIndex > -1) {
      const existing = cartItems[existingIndex]!;
      const newQuantity = Math.min(availableStock, existing.quantity + rawQty);
      const effectiveTiers = existing.wholesaleTiers || tiers;
      const pricing = resolveCartItemPricing(existing.retailPrice, newQuantity, effectiveTiers, authorized);
      cartItems[existingIndex] = {
        ...existing,
        quantity: newQuantity,
        unitPrice: pricing.unitPrice,
        discountPercentage: pricing.discountPercentage,
        wholesaleTiers: effectiveTiers,
        maxStock: availableStock,
      };
    } else {
      const initialQuantity = Math.min(availableStock, rawQty);
      const pricing = resolveCartItemPricing(baseRetailPrice, initialQuantity, tiers, authorized);
      cartItems.push({
        id: itemId,
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        variantId: chosenVariant?.id || '',
        variantName: chosenVariant?.name || 'Standart',
        colorName: chosenVariant?.colorName || '',
        sku: chosenVariant?.sku || product.slug,
        retailPrice: baseRetailPrice,
        unitPrice: pricing.unitPrice,
        discountPercentage: pricing.discountPercentage,
        wholesaleTiers: tiers,
        quantity: initialQuantity,
        maxStock: availableStock,
        imageUrl: chosenVariant?.imageUrl || product.images[0]?.url,
      });
    }

    notify();
  },

  updateQuantity(itemId: string, quantity: number) {
    const rawQty = Math.floor(Number(quantity));
    if (!Number.isFinite(rawQty) || rawQty <= 0) {
      this.removeItem(itemId);
      return;
    }

    const authorized = isWholesaleAuthorized();
    cartItems = cartItems.map((item) => {
      if (item.id !== itemId) return item;
      const targetQty = item.maxStock ? Math.min(item.maxStock, rawQty) : rawQty;
      const pricing = resolveCartItemPricing(item.retailPrice, targetQty, item.wholesaleTiers, authorized);
      return {
        ...item,
        quantity: targetQty,
        unitPrice: pricing.unitPrice,
        discountPercentage: pricing.discountPercentage,
      };
    });
    notify();
  },

  removeItem(itemId: string) {
    cartItems = cartItems.filter((item) => item.id !== itemId);
    notify();
  },

  clear() {
    cartItems = [];
    savePendingCheckoutInfo(null);
    notify();
  },

  getPendingOrder(): PendingCheckoutInfo | null {
    return getPendingCheckoutInfo();
  },

  setPendingOrder(orderId: string, orderNumber: string): void {
    savePendingCheckoutInfo({
      orderId,
      orderNumber,
      createdAt: Date.now(),
    });
  },

  clearPendingOrder(): void {
    savePendingCheckoutInfo(null);
  },

  subscribe(listener: CartListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => cartStore.getItems());

  useEffect(() => {
    return cartStore.subscribe((newItems) => {
      setItems(newItems);
    });
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + (item.unitPrice ?? item.retailPrice) * item.quantity,
    0
  );
  const freeShippingThreshold = 5000;
  const isFreeShipping = subtotal >= freeShippingThreshold;
  const freeShippingRemaining = Math.max(0, freeShippingThreshold - subtotal);

  return {
    items,
    totalItems,
    subtotal,
    freeShippingThreshold,
    isFreeShipping,
    freeShippingRemaining,
    addItem: (product: Product, variant?: ProductVariant, qty?: number) =>
      cartStore.addItem(product, variant, qty),
    updateQuantity: (id: string, qty: number) =>
      cartStore.updateQuantity(id, qty),
    removeItem: (id: string) => cartStore.removeItem(id),
    clear: () => cartStore.clear(),
  };
}
