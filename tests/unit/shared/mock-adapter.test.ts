import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockApiAdapter } from '@/shared/api/mock-adapter';
import { productRepository } from '@/entities/product/api/product-repository';
import { createProduct } from 'tests/factories/product.factory';

describe('mockApiAdapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('delegates getProducts to productRepository', async () => {
    const mockProd = createProduct({ name: 'Adapter Vazo' });
    vi.spyOn(productRepository, 'getProducts').mockResolvedValue([mockProd]);

    const products = await mockApiAdapter.getProducts({ isFeatured: true });
    expect(products).toEqual([mockProd]);
    expect(productRepository.getProducts).toHaveBeenCalledWith({ isFeatured: true });
  });

  it('delegates getProductBySlug to productRepository', async () => {
    const mockProd = createProduct({ slug: 'adapter-slug' });
    vi.spyOn(productRepository, 'getProductBySlug').mockResolvedValue(mockProd);

    const product = await mockApiAdapter.getProductBySlug('adapter-slug');
    expect(product).toEqual(mockProd);
  });

  it('finds product by id via getProductById and returns null if missing', async () => {
    const mockProd = createProduct({ id: 'target-id' });
    vi.spyOn(productRepository, 'getProducts').mockResolvedValue([mockProd]);

    const found = await mockApiAdapter.getProductById('target-id');
    expect(found).toEqual(mockProd);

    const missing = await mockApiAdapter.getProductById('unknown-id');
    expect(missing).toBeNull();
  });
});
