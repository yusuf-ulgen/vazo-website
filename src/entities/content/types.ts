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
