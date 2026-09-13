export type DiscountScope = 'all' | 'category' | 'collection';

export interface DiscountCode {
  id: string;
  code: string;
  discount_percentage: number;
  scope: DiscountScope;
  scope_id: string | null;
  scope_label: string | null;
  is_active: boolean;
  usage_limit: number | null;
  usage_count: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDiscountCodeInput {
  code: string;
  discount_percentage: number;
  scope: DiscountScope;
  scope_id?: string | null;
  scope_label?: string | null;
  is_active?: boolean;
  usage_limit?: number | null;
  expires_at?: string | null;
}

export interface UpdateDiscountCodeInput {
  code?: string;
  discount_percentage?: number;
  scope?: DiscountScope;
  scope_id?: string | null;
  scope_label?: string | null;
  is_active?: boolean;
  usage_limit?: number | null;
  expires_at?: string | null;
}

export interface DiscountCodeFilterParams {
  search?: string;
  scope?: DiscountScope | 'all';
  is_active?: boolean | 'all';
}
