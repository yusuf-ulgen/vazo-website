export type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

export interface AdminInventoryItem {
  id: string; // variant id
  product_id: string;
  product_name: string;
  product_slug: string;
  sku: string;
  variant_name: string;
  color_name: string;
  color_hex: string | null;
  size_label: string | null;
  stock_quantity: number;
  retail_price: number;
  is_available_for_retail: boolean;
  is_available_for_wholesale: boolean;
  active: boolean;
  updated_at: string;
}

export interface AdminInventoryListParams {
  search?: string;
  stockFilter?: StockFilter;
  page?: number;
  pageSize?: number;
}

export interface AdminInventoryListResult {
  data: AdminInventoryItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  metrics: {
    totalVariants: number;
    inStockCount: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalUnits: number;
  };
}

export interface StockAdjustmentInput {
  variantId: string;
  newStockQuantity: number;
}
