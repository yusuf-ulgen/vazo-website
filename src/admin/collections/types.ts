export interface AdminCollection {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  story_markdown: string | null;
  hero_image_url: string | null;
  active: boolean;
  featured: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCollectionInput {
  name: string;
  slug: string;
  subtitle?: string | null;
  description?: string | null;
  story_markdown?: string | null;
  hero_image_url?: string | null;
  active?: boolean;
  featured?: boolean;
  sort_order?: number;
  seo_title?: string | null;
  seo_description?: string | null;
}

export interface UpdateCollectionInput {
  name?: string;
  slug?: string;
  subtitle?: string | null;
  description?: string | null;
  story_markdown?: string | null;
  hero_image_url?: string | null;
  active?: boolean;
  featured?: boolean;
  sort_order?: number;
  seo_title?: string | null;
  seo_description?: string | null;
}

export interface CollectionFilterParams {
  search?: string;
  active?: boolean | 'all';
  featured?: boolean | 'all';
}
