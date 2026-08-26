export interface AnnouncementBarConfig {
  isEnabled: boolean;
  message: string;
  linkText?: string;
  linkUrl?: string;
  backgroundColor?: string;
  textColor?: string;
}

export interface HeroBannerConfig {
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  primaryCtaText: string;
  primaryCtaUrl: string;
  secondaryCtaText: string;
  secondaryCtaUrl: string;
}

export interface HeroSlide {
  id: string;
  eyebrow?: string | null;
  title: string;
  subtitle?: string | null;
  description: string;
  imageUrl: string;
  primaryCtaText: string;
  primaryCtaUrl: string;
  secondaryCtaText?: string | null;
  secondaryCtaUrl?: string | null;
  slot: 'retail' | 'wholesale' | 'general';
  sortOrder: number;
  active: boolean;
}

export interface SplitHeroConfig {
  retail: HeroSlide | null;
  wholesale: HeroSlide | null;
}

export interface WholesaleBenefit {
  id: string;
  title: string;
  description: string;
  iconName: string;
  order: number;
}

export interface MegaMenuPromoCard {
  title: string;
  subtitle: string;
  imageUrl: string;
  linkText: string;
  linkUrl: string;
}

export interface EditorialSectionConfig {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  imageUrl: string;
  imagePosition: 'left' | 'right';
  ctaText: string;
  ctaUrl: string;
}

export type MenuType = 'retail_mega' | 'wholesale_mega' | 'primary' | 'footer';

export interface MenuItem {
  id: string;
  groupId: string;
  label: string;
  href: string;
  isNew: boolean;
  isPopular: boolean;
  sortOrder: number;
  active: boolean;
}

export interface MenuGroup {
  id: string;
  menuType: MenuType;
  title: string;
  promoTitle?: string | null;
  promoSubtitle?: string | null;
  promoImageUrl?: string | null;
  promoCtaText?: string | null;
  promoCtaUrl?: string | null;
  sortOrder: number;
  active: boolean;
  items: MenuItem[];
}

export interface ContentSection {
  id: string;
  pageId: string;
  sectionKey: string;
  eyebrow?: string | null;
  title: string;
  subtitle?: string | null;
  content?: string | null;
  imageUrl?: string | null;
  imagePosition?: 'left' | 'right' | string;
  ctaText?: string | null;
  ctaUrl?: string | null;
  sortOrder: number;
  active: boolean;
}

export interface ContentPage {
  id: string;
  pageKey: string;
  title: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  published: boolean;
  sections?: ContentSection[];
}

export interface FaqItem {
  id: string;
  groupId: string;
  question: string;
  answer: string;
  sortOrder: number;
  active: boolean;
}

export interface FaqGroup {
  id: string;
  title: string;
  sortOrder: number;
  active: boolean;
  items?: FaqItem[];
}


