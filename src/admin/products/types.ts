import { ProductStatus } from '@/entities/product/types';

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  description: string;
  status: ProductStatus;
  primary_category_id: string | null;
  material: string;
  finish: string;
  care_instructions: string | null;
  origin_country: string;
  retail_price: number;
  compare_at_price: number | null;
  retail_enabled: boolean;
  wholesale_enabled: boolean;
  wholesale_moq: number;
  wholesale_lead_time_days: number | null;
  featured: boolean;
  new_arrival: boolean;
  bestseller: boolean;
  tags: string[];
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  // Joined relation fields for admin display
  category_ids?: string[];
  collection_ids?: string[];
  primary_category_name?: string;
  thumbnail_url?: string | null;
  variants_count?: number;
}

export interface CreateProductInput {
  name: string;
  slug: string;
  short_description: string;
  description: string;
  status?: ProductStatus;
  primary_category_id?: string | null;
  category_ids?: string[];
  collection_ids?: string[];
  material: string;
  finish: string;
  care_instructions?: string | null;
  origin_country?: string;
  retail_price: number;
  compare_at_price?: number | null;
  retail_enabled?: boolean;
  wholesale_enabled?: boolean;
  wholesale_moq?: number;
  wholesale_lead_time_days?: number | null;
  featured?: boolean;
  new_arrival?: boolean;
  bestseller?: boolean;
  tags?: string[];
  seo_title?: string | null;
  seo_description?: string | null;
}

export interface UpdateProductInput {
  name?: string;
  slug?: string;
  short_description?: string;
  description?: string;
  status?: ProductStatus;
  primary_category_id?: string | null;
  category_ids?: string[];
  collection_ids?: string[];
  material?: string;
  finish?: string;
  care_instructions?: string | null;
  origin_country?: string;
  retail_price?: number;
  compare_at_price?: number | null;
  retail_enabled?: boolean;
  wholesale_enabled?: boolean;
  wholesale_moq?: number;
  wholesale_lead_time_days?: number | null;
  featured?: boolean;
  new_arrival?: boolean;
  bestseller?: boolean;
  tags?: string[];
  seo_title?: string | null;
  seo_description?: string | null;
}

export interface AdminProductListParams {
  search?: string;
  status?: ProductStatus | 'all';
  categoryId?: string;
  collectionId?: string;
  retailEnabled?: boolean | 'all';
  wholesaleEnabled?: boolean | 'all';
  featured?: boolean | 'all';
  bestseller?: boolean | 'all';
  newArrival?: boolean | 'all';
  page?: number;
  pageSize?: number;
  sortBy?: 'created_at_desc' | 'created_at_asc' | 'price_desc' | 'price_asc' | 'name_asc';
}

export interface AdminProductListResult {
  data: AdminProduct[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
