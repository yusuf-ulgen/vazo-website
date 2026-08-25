export interface AdminCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  active: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  parent_id?: string | null;
  active?: boolean;
  sort_order?: number;
  seo_title?: string | null;
  seo_description?: string | null;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string | null;
  image_url?: string | null;
  parent_id?: string | null;
  active?: boolean;
  sort_order?: number;
  seo_title?: string | null;
  seo_description?: string | null;
}

export interface CategoryFilterParams {
  search?: string;
  active?: boolean | 'all';
}
