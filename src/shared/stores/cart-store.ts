import { useState, useEffect } from 'react';
import { Product, ProductVariant } from '@/entities/product/types';

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
  quantity: number;
  imageUrl?: string;
}

const CART_STORAGE_KEY = 'vazo_cart_items';

type CartListener = (items: CartItem[]) => void;
const listeners = new Set<CartListener>();

function getInitialCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
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
    const chosenVariant = variant || product.variants[0];
    const itemId = `${product.id}_${chosenVariant?.id || 'default'}`;

    const existingIndex = cartItems.findIndex((item) => item.id === itemId);

    if (existingIndex > -1) {
      const existing = cartItems[existingIndex]!;
      cartItems[existingIndex] = {
        ...existing,
        quantity: existing.quantity + quantity,
      };
    } else {
      cartItems.push({
        id: itemId,
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        variantId: chosenVariant?.id || '',
        variantName: chosenVariant?.name || 'Standart',
        colorName: chosenVariant?.colorName || '',
        sku: chosenVariant?.sku || product.slug,
        retailPrice: chosenVariant?.retailPrice || product.retailPrice,
        quantity,
        imageUrl: chosenVariant?.imageUrl || product.images[0]?.url,
      });
    }

    notify();
  },

  updateQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeItem(itemId);
      return;
    }

    cartItems = cartItems.map((item) =>
      item.id === itemId ? { ...item, quantity } : item
    );
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
    (sum, item) => sum + item.retailPrice * item.quantity,
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
