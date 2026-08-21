import { Product } from '@/entities/product/types';
import { mockProducts } from '@/shared/mocks/products';

export interface ProductQueryFilters {
  categoryId?: string;
  collectionId?: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestseller?: boolean;
  wholesaleOnly?: boolean;
}

export interface ApiAdapter {
  getProducts: (filters?: ProductQueryFilters) => Promise<Product[]>;
  getProductBySlug: (slug: string) => Promise<Product | null>;
  getProductById: (id: string) => Promise<Product | null>;
}

/**
 * Provider-neutral mock API adapter.
 * When a real backend is introduced (see docs/ADR.md ADR-007),
 * this adapter can be replaced without changing UI consumer components.
 */
export const mockApiAdapter: ApiAdapter = {
  async getProducts(filters?: ProductQueryFilters): Promise<Product[]> {
    let result = [...mockProducts];

    if (!filters) return result;

    if (filters.categoryId) {
      result = result.filter((p) => p.categoryId === filters.categoryId);
    }
    if (filters.collectionId) {
      result = result.filter((p) => p.collectionIds.includes(filters.collectionId!));
    }
    if (filters.isFeatured !== undefined) {
      result = result.filter((p) => p.isFeatured === filters.isFeatured);
    }
    if (filters.isNewArrival !== undefined) {
      result = result.filter((p) => p.isNewArrival === filters.isNewArrival);
    }
    if (filters.isBestseller !== undefined) {
      result = result.filter((p) => p.isBestseller === filters.isBestseller);
    }
    if (filters.wholesaleOnly) {
      result = result.filter((p) => p.wholesale.isWholesaleEnabled);
    }

    return result;
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    const product = mockProducts.find((p) => p.slug === slug);
    return product || null;
  },

  async getProductById(id: string): Promise<Product | null> {
    const product = mockProducts.find((p) => p.id === id);
    return product || null;
  },
};
