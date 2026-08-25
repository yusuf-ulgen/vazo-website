export interface AdminPricingItem {
  id: string; // product id or variant id
  type: 'product' | 'variant';
  productId: string;
  variantId?: string;
  name: string;
  sku?: string;
  categoryName?: string;
  retailPrice: number;
  compareAtPrice: number | null;
  retailEnabled: boolean;
  wholesaleEnabled: boolean;
  updatedAt: string;
}

export interface AdminPricingListParams {
  search?: string;
  categoryId?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminPricingListResult {
  data: AdminPricingItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UpdatePriceInput {
  id: string;
  type: 'product' | 'variant';
  retailPrice: number;
  compareAtPrice?: number | null;
}
