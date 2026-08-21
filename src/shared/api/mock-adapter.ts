import { Product } from '@/entities/product/types';
import { productRepository, ProductFilterOptions } from '@/entities/product/api/product-repository';
import { categoryRepository } from '@/entities/category/api/category-repository';
import { collectionRepository } from '@/entities/collection/api/collection-repository';
import { contentRepository } from '@/entities/content/api/content-repository';

export interface ApiAdapter {
  getProducts: (filters?: ProductFilterOptions) => Promise<Product[]>;
  getProductBySlug: (slug: string) => Promise<Product | null>;
  getProductById: (id: string) => Promise<Product | null>;
}

/**
 * Unified data adapter bridging between domain repositories and consumer components.
 */
export const mockApiAdapter: ApiAdapter = {
  async getProducts(filters?: ProductFilterOptions): Promise<Product[]> {
    return productRepository.getProducts(filters);
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    return productRepository.getProductBySlug(slug);
  },

  async getProductById(id: string): Promise<Product | null> {
    const products = await productRepository.getProducts();
    return products.find((p) => p.id === id) || null;
  },
};

export { productRepository, categoryRepository, collectionRepository, contentRepository };
