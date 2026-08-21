import { describe, it, expect } from 'vitest';
import { mockProducts } from '@/shared/mocks/products';
import { mockApiAdapter } from '@/shared/api/mock-adapter';

describe('Product Entity & Shared Catalog Architecture', () => {
  it('contains valid mock products with retail and wholesale configurations', () => {
    expect(mockProducts.length).toBeGreaterThan(0);

    for (const product of mockProducts) {
      expect(product.id).toBeDefined();
      expect(product.slug).toBeDefined();
      expect(product.name).toBeDefined();
      expect(product.retailPrice).toBeGreaterThan(0);
      expect(product.wholesale).toBeDefined();

      if (product.wholesale.isWholesaleEnabled) {
        expect(product.wholesale.minOrderQuantity).toBeGreaterThanOrEqual(1);
        expect(product.wholesale.tiers.length).toBeGreaterThan(0);

        // Wholesale unit price should be lower than retail price
        for (const tier of product.wholesale.tiers) {
          expect(tier.unitPrice).toBeLessThan(product.retailPrice);
        }
      }
    }
  });

  it('filters products correctly via the API adapter', async () => {
    const allProducts = await mockApiAdapter.getProducts();
    expect(allProducts.length).toBe(mockProducts.length);

    const featured = await mockApiAdapter.getProducts({ isFeatured: true });
    expect(featured.every((p) => p.isFeatured)).toBe(true);

    const singleProduct = await mockApiAdapter.getProductBySlug('amforik-tas-vazo-tebehir');
    expect(singleProduct).not.toBeNull();
    expect(singleProduct?.name).toBe('Amforik Taş Vazo');
  });
});
