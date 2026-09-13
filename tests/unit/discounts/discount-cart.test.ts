import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateDiscountAmount,
  validateDiscountCode,
  MOCK_DISCOUNT_CODES_KEY,
} from '@/shared/stores/cart-discount';
import { cartStore } from '@/shared/stores/cart-store';
import type { DiscountCode } from '@/admin/discounts/types';
import type { Product, ProductVariant } from '@/entities/product/types';

describe('Discount System Unit Tests', () => {
  const sampleItems = [
    {
      id: 'prod1_var1',
      productId: 'prod-1',
      productSlug: 'prod-1',
      productName: 'Test Vazo 1',
      variantId: 'var-1',
      variantName: 'Standart',
      colorName: 'Krem',
      sku: 'VZ-1',
      retailPrice: 1000,
      unitPrice: 1000,
      quantity: 2,
      categoryIds: ['cat-vases'],
      collectionIds: ['col-minimalist'],
    },
    {
      id: 'prod2_var1',
      productId: 'prod-2',
      productSlug: 'prod-2',
      productName: 'Test Vazo 2',
      variantId: 'var-2',
      variantName: 'Standart',
      colorName: 'Siyah',
      sku: 'VZ-2',
      retailPrice: 500,
      unitPrice: 500,
      quantity: 1,
      categoryIds: ['cat-accessories'],
      collectionIds: ['col-sculptural'],
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    cartStore.clear();
  });

  describe('calculateDiscountAmount', () => {
    it('returns 0 when discount is null or items is empty', () => {
      expect(calculateDiscountAmount(null, sampleItems)).toBe(0);
      const discount: DiscountCode = {
        id: '1',
        code: 'TEST20',
        discount_percentage: 20,
        scope: 'all',
        scope_id: null,
        scope_label: null,
        is_active: true,
        usage_limit: null,
        usage_count: 0,
        expires_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      expect(calculateDiscountAmount(discount, [])).toBe(0);
    });

    it('calculates percentage for scope=all across whole subtotal', () => {
      // Total subtotal: (1000 * 2) + (500 * 1) = 2500
      // 20% of 2500 = 500
      const discount: DiscountCode = {
        id: '1',
        code: 'TEST20',
        discount_percentage: 20,
        scope: 'all',
        scope_id: null,
        scope_label: null,
        is_active: true,
        usage_limit: null,
        usage_count: 0,
        expires_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = calculateDiscountAmount(discount, sampleItems);
      expect(result).toBe(500);
    });

    it('calculates percentage only for eligible items with scope=category', () => {
      // cat-vases items: (1000 * 2) = 2000
      // 10% of 2000 = 200
      const discount: DiscountCode = {
        id: '2',
        code: 'CAT10',
        discount_percentage: 10,
        scope: 'category',
        scope_id: 'cat-vases',
        scope_label: 'Kategori: Vazolar',
        is_active: true,
        usage_limit: null,
        usage_count: 0,
        expires_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = calculateDiscountAmount(discount, sampleItems);
      expect(result).toBe(200);
    });

    it('calculates percentage only for eligible items with scope=collection', () => {
      // col-sculptural items: (500 * 1) = 500
      // 50% of 500 = 250
      const discount: DiscountCode = {
        id: '3',
        code: 'COL50',
        discount_percentage: 50,
        scope: 'collection',
        scope_id: 'col-sculptural',
        scope_label: 'Koleksiyon: Heykelsi',
        is_active: true,
        usage_limit: null,
        usage_count: 0,
        expires_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = calculateDiscountAmount(discount, sampleItems);
      expect(result).toBe(250);
    });
  });

  describe('Single Coupon Enforcement in CartStore', () => {
    it('applies a discount code and enforces maximum 1 code (replaces previous)', async () => {
      const mockCode1: DiscountCode = {
        id: 'd1',
        code: 'INDIRIM10',
        discount_percentage: 10,
        scope: 'all',
        scope_id: null,
        scope_label: null,
        is_active: true,
        usage_limit: null,
        usage_count: 0,
        expires_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockCode2: DiscountCode = {
        id: 'd2',
        code: 'BUYUK20',
        discount_percentage: 20,
        scope: 'all',
        scope_id: null,
        scope_label: null,
        is_active: true,
        usage_limit: null,
        usage_count: 0,
        expires_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      localStorage.setItem(MOCK_DISCOUNT_CODES_KEY, JSON.stringify([mockCode1, mockCode2]));

      // Add item to cart
      cartStore.addItem({
        id: 'p1',
        slug: 'p1',
        name: 'Vazo',
        retailPrice: 1000,
        variants: [{ id: 'v1', name: 'Standart', retailPrice: 1000, stockQuantity: 10 } as unknown as ProductVariant],
      } as unknown as Product);

      // Apply first code
      await cartStore.applyDiscountCode('INDIRIM10');
      expect(cartStore.getAppliedDiscount()?.code).toBe('INDIRIM10');

      // Apply second code -> MUST replace the first (max 1 code allowed)
      await cartStore.applyDiscountCode('BUYUK20');
      expect(cartStore.getAppliedDiscount()?.code).toBe('BUYUK20');

      // Remove discount
      cartStore.removeDiscount();
      expect(cartStore.getAppliedDiscount()).toBeNull();
    });

    it('rejects expired codes and inactive codes', async () => {
      const expiredCode: DiscountCode = {
        id: 'd-exp',
        code: 'ESKI10',
        discount_percentage: 10,
        scope: 'all',
        scope_id: null,
        scope_label: null,
        is_active: true,
        usage_limit: null,
        usage_count: 0,
        expires_at: new Date(Date.now() - 10000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const inactiveCode: DiscountCode = {
        ...expiredCode,
        code: 'PASIF10',
        is_active: false,
        expires_at: null,
      };

      const limitCode: DiscountCode = {
        ...expiredCode,
        code: 'LIMIT10',
        is_active: true,
        expires_at: null,
        usage_limit: 5,
        usage_count: 5,
      };

      const catMismatchCode: DiscountCode = {
        ...expiredCode,
        code: 'CATDIFF',
        is_active: true,
        expires_at: null,
        scope: 'category',
        scope_id: 'non-existing-cat',
        scope_label: 'Özel Seri',
      };

      const colMismatchCode: DiscountCode = {
        ...expiredCode,
        code: 'COLDIFF',
        is_active: true,
        expires_at: null,
        scope: 'collection',
        scope_id: 'non-existing-col',
        scope_label: 'Özel Koleksiyon',
      };

      localStorage.setItem(
        MOCK_DISCOUNT_CODES_KEY,
        JSON.stringify([expiredCode, inactiveCode, limitCode, catMismatchCode, colMismatchCode])
      );

      await expect(validateDiscountCode('', sampleItems)).rejects.toThrow('Lütfen bir indirim kodu girin.');
      await expect(validateDiscountCode('TEST', [])).rejects.toThrow('İndirim kodu uygulamak için sepetinizde ürün bulunmalıdır.');
      await expect(validateDiscountCode('ESKI10', sampleItems)).rejects.toThrow('Bu indirim kodunun geçerlilik süresi dolmuştur.');
      await expect(validateDiscountCode('PASIF10', sampleItems)).rejects.toThrow('Bu indirim kodu şu anda aktif değildir.');
      await expect(validateDiscountCode('LIMIT10', sampleItems)).rejects.toThrow('Bu indirim kodunun kullanım limiti dolmuştur.');
      await expect(validateDiscountCode('CATDIFF', sampleItems)).rejects.toThrow('Bu indirim kodu sadece "Özel Seri" ürünlerinde geçerlidir.');
      await expect(validateDiscountCode('COLDIFF', sampleItems)).rejects.toThrow('Bu indirim kodu sadece "Özel Koleksiyon" ürünlerinde geçerlidir.');
    });
  });
});
