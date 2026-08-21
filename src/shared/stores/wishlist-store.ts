import { useState, useEffect } from 'react';

const WISHLIST_STORAGE_KEY = 'vazo_wishlist_items';

type Listener = (items: string[]) => void;
const listeners = new Set<Listener>();

function getInitialWishlist(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
  } catch {
    return [];
  }
}

let wishlistItems: string[] = getInitialWishlist();

function notify() {
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistItems));
  } catch {
    // Ignore storage quota errors
  }
  listeners.forEach((listener) => listener([...wishlistItems]));
}

export const wishlistStore = {
  getItems(): string[] {
    return [...wishlistItems];
  },

  has(productId: string): boolean {
    if (!productId || typeof productId !== 'string') return false;
    return wishlistItems.includes(productId);
  },

  toggle(productId: string): boolean {
    if (!productId || typeof productId !== 'string') return false;
    if (wishlistItems.includes(productId)) {
      wishlistItems = wishlistItems.filter((id) => id !== productId);
      notify();
      return false;
    } else {
      wishlistItems = [...wishlistItems, productId];
      notify();
      return true;
    }
  },

  remove(productId: string) {
    if (!productId || typeof productId !== 'string') return;
    wishlistItems = wishlistItems.filter((id) => id !== productId);
    notify();
  },

  clear() {
    wishlistItems = [];
    notify();
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useWishlist() {
  const [items, setItems] = useState<string[]>(() => wishlistStore.getItems());

  useEffect(() => {
    return wishlistStore.subscribe((newItems) => {
      setItems(newItems);
    });
  }, []);

  return {
    items,
    count: items.length,
    has: (id: string) => wishlistStore.has(id),
    toggle: (id: string) => wishlistStore.toggle(id),
    remove: (id: string) => wishlistStore.remove(id),
    clear: () => wishlistStore.clear(),
  };
}
