import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { wishlistStore, useWishlist } from '@/shared/stores/wishlist-store';

describe('wishlistStore & useWishlist', () => {
  beforeEach(() => {
    wishlistStore.clear();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('starts with an empty wishlist', () => {
    expect(wishlistStore.getItems()).toEqual([]);
    expect(wishlistStore.has('prod-1')).toBe(false);
  });

  it('toggles adding and removing a product ID', () => {
    const isAdded = wishlistStore.toggle('prod-1');
    expect(isAdded).toBe(true);
    expect(wishlistStore.has('prod-1')).toBe(true);
    expect(wishlistStore.getItems()).toEqual(['prod-1']);

    const isRemoved = wishlistStore.toggle('prod-1');
    expect(isRemoved).toBe(false);
    expect(wishlistStore.has('prod-1')).toBe(false);
    expect(wishlistStore.getItems()).toEqual([]);
  });

  it('ignores invalid or empty product IDs', () => {
    expect(wishlistStore.toggle('')).toBe(false);
    expect(wishlistStore.has('')).toBe(false);
    expect(wishlistStore.getItems()).toEqual([]);
  });

  it('removes item by product ID', () => {
    wishlistStore.toggle('prod-1');
    wishlistStore.toggle('prod-2');

    expect(wishlistStore.getItems().length).toBe(2);

    wishlistStore.remove('prod-1');
    expect(wishlistStore.has('prod-1')).toBe(false);
    expect(wishlistStore.has('prod-2')).toBe(true);

    // Calling remove with non-existent or invalid ID does not error
    wishlistStore.remove('non-existent');
    expect(wishlistStore.getItems().length).toBe(1);
  });

  it('clears all wishlist items', () => {
    wishlistStore.toggle('prod-1');
    wishlistStore.toggle('prod-2');
    expect(wishlistStore.getItems().length).toBe(2);

    wishlistStore.clear();
    expect(wishlistStore.getItems()).toEqual([]);
  });

  it('notifies subscribers and supports unsubscription', () => {
    const listener = vi.fn();
    const unsubscribe = wishlistStore.subscribe(listener);

    wishlistStore.toggle('prod-1');
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    wishlistStore.toggle('prod-2');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('gracefully handles localStorage quota errors in notify', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => wishlistStore.toggle('prod-quota')).not.toThrow();
    expect(wishlistStore.getItems()).toEqual(['prod-quota']);
  });

  it('provides reactive state via useWishlist hook', () => {
    const { result } = renderHook(() => useWishlist());

    expect(result.current.count).toBe(0);

    act(() => {
      result.current.toggle('prod-1');
    });

    expect(result.current.count).toBe(1);
    expect(result.current.has('prod-1')).toBe(true);

    act(() => {
      result.current.remove('prod-1');
    });

    expect(result.current.count).toBe(0);

    act(() => {
      result.current.toggle('prod-2');
      result.current.clear();
    });

    expect(result.current.count).toBe(0);
  });
});
