import {
  SiteSettings,
  AnnouncementBarContent,
  HeroContent,
  EditorialSection,
  WholesaleBenefit,
  MegaMenuGroup,
} from '@/entities/content/types';

export function createSiteSettings(overrides?: Partial<SiteSettings>): SiteSettings {
  return {
    siteName: 'Vazo Studio',
    tagline: 'Heykelsi Formlar, Zamansız Dokunuşlar',
    description: 'El işçiliği seramik ve stoneware heykelsi vazo koleksiyonu.',
    contactEmail: 'info@vazostudio.com',
    contactPhone: '+90 (212) 555 0192',
    address: 'Tomtom Mah. Boğazkesen Cad. No:42/A Beyoğlu, İstanbul',
    currency: 'TRY',
    freeShippingThreshold: 5000,
    socialLinks: {
      instagram: 'https://instagram.com/vazostudio',
    },
    ...overrides,
  };
}

export function createAnnouncement(overrides?: Partial<AnnouncementBarContent>): AnnouncementBarContent {
  return {
    id: 'ann-1',
    text: 'Perakende ve toptan satışlarımız mevcuttur • 5.000 TL üzeri kargo ücretsiz',
    linkText: 'Toptan Bilgi Al',
    linkHref: '/wholesale',
    isActive: true,
    ...overrides,
  };
}

export function createHeroContent(overrides?: Partial<HeroContent>): HeroContent {
  return {
    id: 'hero-1',
    eyebrow: 'Yeni Sezon Koleksiyonu',
    title: 'Modern Formlar, Zamansız Dokunuşlar',
    description: 'El işçiliği stoneware ve seramik vazo koleksiyonumuzla yaşam alanlarınıza heykelsi bir dinginlik katın.',
    primaryButtonText: 'Koleksiyonu Keşfet',
    primaryButtonHref: '/products',
    secondaryButtonText: 'Toptan & Proje Talebi',
    secondaryButtonHref: '/wholesale',
    heroImageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1400&q=85',
    ...overrides,
  };
}

export function createEditorialSection(overrides?: Partial<EditorialSection>): EditorialSection {
  return {
    id: 'edit-1',
    eyebrow: 'Zanaat & Felsefe',
    title: 'Toprağın ve Ateşin Dingin Dengesi',
    bodyText: 'Her vazo, usta ellerde şekillenen doğal kilin 1250 derecede fırınlanmasıyla hayat bulur.',
    imageUrl: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?auto=format&fit=crop&w=1000&q=80',
    imagePosition: 'right',
    ctaText: 'Hikayemizi Keşfedin',
    ctaHref: '/about',
    order: 1,
    ...overrides,
  };
}

export function createWholesaleBenefit(overrides?: Partial<WholesaleBenefit>): WholesaleBenefit {
  return {
    id: 'ben-1',
    title: 'Kademeli Fiyat Avantajı',
    description: 'Minimum 6 adetten başlayan siparişlerde %25 ile %40 arasında değişen iskonto oranları.',
    iconName: 'Percent',
    order: 1,
    ...overrides,
  };
}

export function createMegaMenuGroup(overrides?: Partial<MegaMenuGroup>): MegaMenuGroup {
  return {
    title: 'Kategoriler',
    links: [
      { label: 'Tüm Modeller', href: '/products', isPopular: true },
      { label: 'Masa Üstü Vazolar', href: '/categories/masa-ustu-vazolar' },
    ],
    ...overrides,
  };
}
