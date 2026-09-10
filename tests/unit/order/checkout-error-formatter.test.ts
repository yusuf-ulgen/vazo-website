import { describe, it, expect } from 'vitest';
import { formatCheckoutError } from '@/site/checkout/utils/checkout-error-formatter';
import type { CartItem } from '@/shared/stores/cart-store';

describe('formatCheckoutError', () => {
  const mockCartItems: CartItem[] = [
    {
      id: 'prod-1_c5cd01a7-abae-4163-b79f-c5ce8f56ed3b',
      productId: 'prod-1',
      productSlug: 'test-vazo',
      productName: 'Test vazo',
      variantId: 'c5cd01a7-abae-4163-b79f-c5ce8f56ed3b',
      variantName: 'Mat Siyah',
      colorName: 'Mat Siyah',
      sku: 'VZ-MATS-STD-37',
      retailPrice: 1699,
      unitPrice: 1699,
      quantity: 1,
    },
  ];

  it('returns empty string when raw error is null or undefined', () => {
    expect(formatCheckoutError(null, mockCartItems)).toBe('');
    expect(formatCheckoutError(undefined, mockCartItems)).toBe('');
  });

  it('replaces raw variant UUID with product and variant name', () => {
    const raw = 'Varyant bulunamadı veya aktif değil: c5cd01a7-abae-4163-b79f-c5ce8f56ed3b';
    const formatted = formatCheckoutError(raw, mockCartItems);
    expect(formatted).not.toContain('c5cd01a7-abae-4163-b79f-c5ce8f56ed3b');
    expect(formatted).toContain('Test vazo (Mat Siyah)');
  });

  it('preserves unrelated error messages without alteration', () => {
    const generic = 'Lütfen geçerli bir teslimat adresi seçiniz.';
    expect(formatCheckoutError(generic, mockCartItems)).toBe(generic);
  });
});
