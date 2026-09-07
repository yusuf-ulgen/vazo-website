import { useState, useEffect } from 'react';
import { Product, ProductVariant, WholesalePricingTier } from '@/entities/product/types';

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
  unitPrice: number; // Effective unit price after tier discount
  discountPercentage?: number;
  quantity: number;
  maxStock?: number;
  imageUrl?: string;
  wholesaleTiers?: WholesalePricingTier[];
}

const CART_STORAGE_KEY = 'vazo_cart_items';

type CartListener = (items: CartItem[]) => void;
const listeners = new Set<CartListener>();

export function resolveCartItemPricing(
  basePrice: number,
  quantity: number,
  tiers?: WholesalePricingTier[]
): {
  unitPrice: number;
  discountPercentage?: number;
} {
  if (!tiers || tiers.length === 0 || quantity < 1) {
    return { unitPrice: basePrice, discountPercentage: undefined };
  }

  // Find matching tier
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

function sanitizeCartItem(raw: unknown): CartItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;

  if (
    typeof item.id !== 'string' ||
    typeof item.productId !== 'string' ||
    typeof item.productSlug !== 'string' ||
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
  const pricing = resolveCartItemPricing(basePrice, qty, rawTiers);

  return {
    id: item.id,
    productId: item.productId,
    productSlug: item.productSlug,
    productName: item.productName,
    variantId: typeof item.variantId === 'string' ? item.variantId : '',
    variantName: typeof item.variantName === 'string' ? item.variantName : 'Standart',
    colorName: typeof item.colorName === 'string' ? item.colorName : '',
    sku: typeof item.sku === 'string' ? item.sku : item.productSlug,
    retailPrice: basePrice,
    unitPrice: pricing.unitPrice,
    discountPercentage: pricing.discountPercentage,
    quantity: qty,
    maxStock: typeof item.maxStock === 'number' && Number.isFinite(item.maxStock) ? item.maxStock : undefined,
    imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : undefined,
    wholesaleTiers: rawTiers,
  };
}

function getInitialCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    const sanitized = parsed.map(sanitizeCartItem).filter((item): item is CartItem => item !== null);
    return sanitized;
  } catch {
    return [];
  }
}

let cartItems: CartItem[] = getInitialCart();

function notify() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  } catch {
    // Ignore storage quota errors
  }
  listeners.forEach((listener) => listener([...cartItems]));
}

export const cartStore = {
  getItems(): CartItem[] {
    return [...cartItems];
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

    const baseRetailPrice = chosenVariant?.retailPrice ?? product.retailPrice;
    const tiers: WholesalePricingTier[] =
      product.wholesale?.tiers && product.wholesale.tiers.length > 0
        ? product.wholesale.tiers
        : product.wholesale?.isWholesaleEnabled
        ? [
            { minQuantity: 6, maxQuantity: 11, unitPrice: Math.round(baseRetailPrice * 0.8), discountPercentage: 20 },
            { minQuantity: 12, maxQuantity: 23, unitPrice: Math.round(baseRetailPrice * 0.75), discountPercentage: 25 },
            { minQuantity: 24, maxQuantity: 49, unitPrice: Math.round(baseRetailPrice * 0.7), discountPercentage: 30 },
            { minQuantity: 50, maxQuantity: undefined, unitPrice: Math.round(baseRetailPrice * 0.6), discountPercentage: 40 },
          ]
        : [];

    const itemId = `${product.id}_${chosenVariant?.id || 'default'}`;
    const existingIndex = cartItems.findIndex((item) => item.id === itemId);

    if (existingIndex > -1) {
      const existing = cartItems[existingIndex]!;
      const newQuantity = Math.min(availableStock, existing.quantity + rawQty);
      const pricing = resolveCartItemPricing(existing.retailPrice, newQuantity, existing.wholesaleTiers || tiers);
      cartItems[existingIndex] = {
        ...existing,
        quantity: newQuantity,
        unitPrice: pricing.unitPrice,
        discountPercentage: pricing.discountPercentage,
        wholesaleTiers: existing.wholesaleTiers || (tiers.length > 0 ? tiers : undefined),
        maxStock: availableStock,
      };
    } else {
      const initialQuantity = Math.min(availableStock, rawQty);
      const pricing = resolveCartItemPricing(baseRetailPrice, initialQuantity, tiers);
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
        wholesaleTiers: tiers.length > 0 ? tiers : undefined,
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

    cartItems = cartItems.map((item) => {
      if (item.id !== itemId) return item;
      const targetQty = item.maxStock ? Math.min(item.maxStock, rawQty) : rawQty;
      const pricing = resolveCartItemPricing(item.retailPrice, targetQty, item.wholesaleTiers);
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
    notify();
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
