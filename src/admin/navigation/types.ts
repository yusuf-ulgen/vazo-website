import type { MenuType } from '@/entities/content/types';

export type { MenuType };

export interface AdminMenuItem {
  id: string;
  group_id: string;
  label: string;
  href: string;
  is_new: boolean;
  is_popular: boolean;
  sort_order: number;
  active: boolean;
}

export interface AdminMenuGroup {
  id: string;
  menu_type: MenuType;
  title: string;
  promo_title?: string | null;
  promo_subtitle?: string | null;
  promo_image_url?: string | null;
  promo_cta_text?: string | null;
  promo_cta_url?: string | null;
  sort_order: number;
  active: boolean;
  items?: AdminMenuItem[];
}

export interface CreateMenuGroupInput {
  menu_type: MenuType;
  title: string;
  promo_title?: string | null;
  promo_subtitle?: string | null;
  promo_image_url?: string | null;
  promo_cta_text?: string | null;
  promo_cta_url?: string | null;
  sort_order?: number;
  active?: boolean;
}

export interface UpdateMenuGroupInput {
  menu_type?: MenuType;
  title?: string;
  promo_title?: string | null;
  promo_subtitle?: string | null;
  promo_image_url?: string | null;
  promo_cta_text?: string | null;
  promo_cta_url?: string | null;
  sort_order?: number;
  active?: boolean;
}

export interface CreateMenuItemInput {
  group_id: string;
  label: string;
  href: string;
  is_new?: boolean;
  is_popular?: boolean;
  sort_order?: number;
  active?: boolean;
}

export interface UpdateMenuItemInput {
  label?: string;
  href?: string;
  is_new?: boolean;
  is_popular?: boolean;
  sort_order?: number;
  active?: boolean;
}
