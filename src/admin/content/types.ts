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
