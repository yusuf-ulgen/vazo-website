import { describe, it, expect } from 'vitest';
import type { ProductVariant } from '@/entities/product/types';

describe('Product Variant Dimensions Preservation', () => {
  it('preserves all physical dimension attributes on ProductVariant', () => {
    const variant: ProductVariant = {
      id: 'var-1',
      sku: 'VAZO-TEST-01',
      name: 'Test Vazosu - Mat Terracotta',
      colorName: 'Terracotta',
      colorHex: '#C86D51',
      sizeLabel: 'Büyük Boy',
      finish: 'matte',
      dimensions: {
        heightCm: 32,
        diameterCm: 18,
        widthCm: 18,
        depthCm: 18,
        weightKg: 2.4,
      },
      retailPrice: 1250,
      compareAtPrice: 1500,
      stockQuantity: 15,
      isAvailableForRetail: true,
      isAvailableForWholesale: true,
      imageUrl: 'https://example.com/image.jpg',
    };

    expect(variant.sizeLabel).toBe('Büyük Boy');
    expect(variant.dimensions.heightCm).toBe(32);
    expect(variant.dimensions.diameterCm).toBe(18);
    expect(variant.dimensions.widthCm).toBe(18);
    expect(variant.dimensions.depthCm).toBe(18);
    expect(variant.dimensions.weightKg).toBe(2.4);
  });
});
