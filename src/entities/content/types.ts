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
