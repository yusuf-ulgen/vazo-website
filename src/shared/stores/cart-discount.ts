import { supabase, isSupabaseConfigured } from '@/shared/lib/supabase';
import type { DiscountCode } from '@/admin/discounts/types';
import type { CartItem } from './cart-store';

export const APPLIED_DISCOUNT_KEY = 'vazo_applied_discount';
export const MOCK_DISCOUNT_CODES_KEY = 'vazo_discount_codes';

export function getStoredAppliedDiscount(): DiscountCode | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(APPLIED_DISCOUNT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DiscountCode;
  } catch {
    return null;
  }
}

export function saveStoredAppliedDiscount(discount: DiscountCode | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (discount) {
      localStorage.setItem(APPLIED_DISCOUNT_KEY, JSON.stringify(discount));
    } else {
      localStorage.removeItem(APPLIED_DISCOUNT_KEY);
    }
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Fetch a discount code from Supabase, or fall back to localStorage in offline/mock mode.
 */
export async function fetchDiscountCode(code: string): Promise<DiscountCode | null> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) return null;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .ilike('code', cleanCode)
        .maybeSingle();

      if (!error && data) {
        return data as DiscountCode;
      }
    } catch (err) {
      console.warn('Supabase discount query failed, falling back to local storage', err);
    }
  }

  // LocalStorage fallback for demo/mock testing
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(MOCK_DISCOUNT_CODES_KEY);
      if (raw) {
        const codes = JSON.parse(raw) as DiscountCode[];
        const found = codes.find((c) => c.code.toUpperCase() === cleanCode);
        if (found) return found;
      }
    } catch {
      // Ignore parse error
    }
  }

  return null;
}

/**
 * Calculate the discount amount in minor currency (or integer lira) given items and discount.
 */
export function calculateDiscountAmount(discount: DiscountCode | null, items: CartItem[]): number {
  if (!discount || items.length === 0) return 0;

  const totalSubtotal = items.reduce(
    (sum, item) => sum + (item.unitPrice ?? item.retailPrice) * item.quantity,
    0
  );

  let eligibleSubtotal = totalSubtotal;

  if (discount.scope === 'category' && discount.scope_id) {
    const matchingItems = items.filter(
      (item) => item.categoryIds && item.categoryIds.includes(discount.scope_id!)
    );
    eligibleSubtotal = matchingItems.reduce(
      (sum, item) => sum + (item.unitPrice ?? item.retailPrice) * item.quantity,
      0
    );
  } else if (discount.scope === 'collection' && discount.scope_id) {
    const matchingItems = items.filter(
      (item) => item.collectionIds && item.collectionIds.includes(discount.scope_id!)
    );
    eligibleSubtotal = matchingItems.reduce(
      (sum, item) => sum + (item.unitPrice ?? item.retailPrice) * item.quantity,
      0
    );
  }

  if (eligibleSubtotal <= 0) return 0;

  const amount = Math.round(eligibleSubtotal * (discount.discount_percentage / 100));
  return Math.min(amount, totalSubtotal);
}

/**
 * Validate and resolve a discount code against current cart items.
 * Throws a user-friendly error message in Turkish if invalid.
 */
export async function validateDiscountCode(
  code: string,
  items: CartItem[]
): Promise<DiscountCode> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) {
    throw new Error('Lütfen bir indirim kodu girin.');
  }

  if (items.length === 0) {
    throw new Error('İndirim kodu uygulamak için sepetinizde ürün bulunmalıdır.');
  }

  const discount = await fetchDiscountCode(cleanCode);
  if (!discount) {
    throw new Error('Girdiğiniz indirim kodu bulunamadı.');
  }

  if (!discount.is_active) {
    throw new Error('Bu indirim kodu şu anda aktif değildir.');
  }

  if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
    throw new Error('Bu indirim kodunun geçerlilik süresi dolmuştur.');
  }

  if (discount.usage_limit && discount.usage_count >= discount.usage_limit) {
    throw new Error('Bu indirim kodunun kullanım limiti dolmuştur.');
  }

  // Check scope applicability
  if (discount.scope === 'category' && discount.scope_id) {
    // If items have categoryIds populated, ensure at least one matches
    const strictlyChecked = items.some(
      (item) => item.categoryIds && item.categoryIds.includes(discount.scope_id!)
    );
    const anyItemHasCategoryIds = items.some((item) => item.categoryIds && item.categoryIds.length > 0);

    if (anyItemHasCategoryIds && !strictlyChecked) {
      throw new Error(`Bu indirim kodu sadece "${discount.scope_label || 'seçili kategori'}" ürünlerinde geçerlidir.`);
    }
  } else if (discount.scope === 'collection' && discount.scope_id) {
    const strictlyChecked = items.some(
      (item) => item.collectionIds && item.collectionIds.includes(discount.scope_id!)
    );
    const anyItemHasCollectionIds = items.some((item) => item.collectionIds && item.collectionIds.length > 0);

    if (anyItemHasCollectionIds && !strictlyChecked) {
      throw new Error(`Bu indirim kodu sadece "${discount.scope_label || 'seçili koleksiyon'}" ürünlerinde geçerlidir.`);
    }
  }

  return discount;
}
