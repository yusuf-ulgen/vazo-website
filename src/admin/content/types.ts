export type HeroSlot = 'retail' | 'wholesale' | 'general';

export interface AdminHeroSlide {
  id: string;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  description: string;
  image_url: string;
  primary_cta_text: string;
  primary_cta_url: string;
  secondary_cta_text: string | null;
  secondary_cta_url: string | null;
  slot: HeroSlot;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export interface CreateHeroSlideInput {
  eyebrow?: string | null;
  title: string;
  subtitle?: string | null;
  description: string;
  image_url: string;
  primary_cta_text: string;
  primary_cta_url: string;
  secondary_cta_text?: string | null;
  secondary_cta_url?: string | null;
  slot?: HeroSlot;
  active?: boolean;
  sort_order?: number;
}

export interface UpdateHeroSlideInput {
  eyebrow?: string | null;
  title?: string;
  subtitle?: string | null;
  description?: string;
  image_url?: string;
  primary_cta_text?: string;
  primary_cta_url?: string;
  secondary_cta_text?: string | null;
  secondary_cta_url?: string | null;
  slot?: HeroSlot;
  active?: boolean;
  sort_order?: number;
}

export interface AdminWholesaleBenefit {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  sort_order: number;
  active: boolean;
}

export interface CreateWholesaleBenefitInput {
  title: string;
  description: string;
  icon_name: string;
  sort_order?: number;
  active?: boolean;
}

export interface UpdateWholesaleBenefitInput {
  title?: string;
  description?: string;
  icon_name?: string;
  sort_order?: number;
  active?: boolean;
}

export interface AdminContentSection {
  id: string;
  page_id: string;
  section_key: string;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  content: string | null;
  image_url: string | null;
  image_position: string;
  cta_text: string | null;
  cta_url: string | null;
  sort_order: number;
  active: boolean;
}

export interface AdminContentPageItem {
  id: string;
  page_key: string;
  title: string;
  seo_title: string | null;
  seo_description: string | null;
  published: boolean;
  created_at?: string;
  updated_at?: string;
  sections?: AdminContentSection[];
}

export interface CreateContentPageInput {
  page_key: string;
  title: string;
  seo_title?: string | null;
  seo_description?: string | null;
  published?: boolean;
}

export interface UpdateContentPageInput {
  page_key?: string;
  title?: string;
  seo_title?: string | null;
  seo_description?: string | null;
  published?: boolean;
}

export interface CreateContentSectionInput {
  page_id: string;
  section_key: string;
  eyebrow?: string | null;
  title: string;
  subtitle?: string | null;
  content?: string | null;
  image_url?: string | null;
  image_position?: string;
  cta_text?: string | null;
  cta_url?: string | null;
  sort_order?: number;
  active?: boolean;
}

export interface UpdateContentSectionInput {
  section_key?: string;
  eyebrow?: string | null;
  title?: string;
  subtitle?: string | null;
  content?: string | null;
  image_url?: string | null;
  image_position?: string;
  cta_text?: string | null;
  cta_url?: string | null;
  sort_order?: number;
  active?: boolean;
}

export interface AdminFaqItem {
  id: string;
  group_id: string;
  question: string;
  answer: string;
  sort_order: number;
  active: boolean;
}

export interface AdminFaqGroup {
  id: string;
  title: string;
  sort_order: number;
  active: boolean;
  items?: AdminFaqItem[];
}

export interface CreateFaqGroupInput {
  title: string;
  sort_order?: number;
  active?: boolean;
}

export interface UpdateFaqGroupInput {
  title?: string;
  sort_order?: number;
  active?: boolean;
}

export interface CreateFaqItemInput {
  group_id: string;
  question: string;
  answer: string;
  sort_order?: number;
  active?: boolean;
}

export interface UpdateFaqItemInput {
  question?: string;
  answer?: string;
  sort_order?: number;
  active?: boolean;
}

