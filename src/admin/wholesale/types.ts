export interface AdminWholesaleTier {
  id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  variant_id: string | null;
  variant_sku?: string | null;
  variant_name?: string | null;
  min_quantity: number;
  max_quantity: number | null;
  unit_price: number;
  discount_percentage: number | null;
  active: boolean;
  created_at: string;
}

export interface CreateWholesaleTierInput {
  product_id: string;
  variant_id?: string | null;
  min_quantity: number;
  max_quantity?: number | null;
  unit_price: number;
  discount_percentage?: number | null;
  active?: boolean;
}

export interface UpdateWholesaleTierInput {
  min_quantity?: number;
  max_quantity?: number | null;
  unit_price?: number;
  discount_percentage?: number | null;
  active?: boolean;
}

export interface ProductWholesaleConfig {
  productId: string;
  productName: string;
  wholesaleEnabled: boolean;
  wholesaleMoq: number;
  wholesaleLeadTimeDays: number | null;
}

export interface UpdateProductWholesaleConfigInput {
  wholesale_enabled: boolean;
  wholesale_moq: number;
  wholesale_lead_time_days?: number | null;
}
