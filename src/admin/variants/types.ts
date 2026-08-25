export interface AdminProductVariant {
  id: string;
  product_id: string;
  sku: string;
  variant_name: string;
  color_name: string;
  color_hex: string | null;
  finish: string | null;
  size_label: string | null;
  height_cm: number | null;
  diameter_cm: number | null;
  width_cm: number | null;
  depth_cm: number | null;
  weight_kg: number | null;
  retail_price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  is_available_for_retail: boolean;
  is_available_for_wholesale: boolean;
  image_url: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  // Joined for display
  product_name?: string;
  product_slug?: string;
}

export interface CreateVariantInput {
  product_id: string;
  sku: string;
  variant_name: string;
  color_name: string;
  color_hex?: string | null;
  finish?: string | null;
  size_label?: string | null;
  height_cm?: number | null;
  diameter_cm?: number | null;
  width_cm?: number | null;
  depth_cm?: number | null;
  weight_kg?: number | null;
  retail_price: number;
  compare_at_price?: number | null;
  stock_quantity?: number;
  is_available_for_retail?: boolean;
  is_available_for_wholesale?: boolean;
  image_url?: string | null;
  sort_order?: number;
  active?: boolean;
}

export interface UpdateVariantInput {
  sku?: string;
  variant_name?: string;
  color_name?: string;
  color_hex?: string | null;
  finish?: string | null;
  size_label?: string | null;
  height_cm?: number | null;
  diameter_cm?: number | null;
  width_cm?: number | null;
  depth_cm?: number | null;
  weight_kg?: number | null;
  retail_price?: number;
  compare_at_price?: number | null;
  stock_quantity?: number;
  is_available_for_retail?: boolean;
  is_available_for_wholesale?: boolean;
  image_url?: string | null;
  sort_order?: number;
  active?: boolean;
}
