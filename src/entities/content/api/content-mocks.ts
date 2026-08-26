import type {
  AnnouncementBarConfig,
  HeroBannerConfig,
  EditorialSectionConfig,
  SplitHeroConfig,
  WholesaleBenefit,
} from '../types';
import { siteConfig } from '@/shared/config/site-config';
import type { MegaMenuData } from '@/shared/mocks/navigation';

export const mockAnnouncement: AnnouncementBarConfig = {
  isEnabled: true,
  message: siteConfig.announcement.text,
  linkText: siteConfig.announcement.actionText,
  linkUrl: siteConfig.announcement.actionUrl,
};

export const mockHero: HeroBannerConfig = {
  title: 'Sessizliğin ve Ham Dokunun Mimari Formu',
  subtitle: 'Modern formlar. Zamansız dokunuşlar.',
  description:
    'İskandinav yalınlığı ile el işçiliği seramik zanaatını buluşturan koleksiyonumuz; yaşam alanları ve mimari projeler için heykelsi bir dinginlik sunar.',
  imageUrl:
    'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=1200&q=85',
  primaryCtaText: 'Alışverişe Başla',
  primaryCtaUrl: '/products',
  secondaryCtaText: 'Toptan Satış',
  secondaryCtaUrl: '/wholesale',
};

export const mockSplitHero: SplitHeroConfig = {
  retail: {
    id: 'h0000000-0000-0000-0000-000000000001',
    eyebrow: 'BİREYSEL ALIŞVERİŞ',
    title: 'Perakende',
    subtitle: null,
    description: 'Evinize estetik dokunuşlar katacak vazo koleksiyonlarımızı keşfedin.',
    imageUrl: '/images/hero-retail.jpg',
    primaryCtaText: 'Alışverişe Başla',
    primaryCtaUrl: '/products',
    secondaryCtaText: null,
    secondaryCtaUrl: null,
    slot: 'retail',
    sortOrder: 1,
    active: true,
  },
  wholesale: {
    id: 'h0000000-0000-0000-0000-000000000002',
    eyebrow: 'PROFESYONEL ALIŞVERİŞ',
    title: 'Toptan',
    subtitle: null,
    description: 'Projeleriniz için özel fiyatlar, geniş ürün seçeneği ve profesyonel destek alın.',
    imageUrl: '/images/hero-wholesale.jpg',
    primaryCtaText: 'Toptan Alışverişe Geç',
    primaryCtaUrl: '/wholesale',
    secondaryCtaText: null,
    secondaryCtaUrl: null,
    slot: 'wholesale',
    sortOrder: 2,
    active: true,
  },
};

export const mockEditorialSections: EditorialSectionConfig[] = [
  {
    id: 'e0000000-0000-0000-0000-000000000001',
    eyebrow: 'Yeni Koleksiyon',
    title: 'Formun sadeliği, mekâna anlam katar.',
    description:
      'Zamana meydan okuyan tasarımları ve doğal mineral malzemeleri buluşturarak yaşam alanlarınıza sade ve güçlü bir estetik kazandırıyoruz.',
    imageUrl:
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1000&q=85',
    imagePosition: 'left',
    ctaText: 'Keşfet',
    ctaUrl: '/collections/nordik-sessizlik',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000002',
    eyebrow: 'El Yapımı Seramik',
    title: 'Doğadan ilham alan özgün tasarımlar.',
    description:
      'Her bir parça, usta ellerde el tornasında şekillenir ve 1250°C fırınlama ile kendine has yüzey dokusu ve ton farklılıklarına kavuşur.',
    imageUrl:
      'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1000&q=85',
    imagePosition: 'right',
    ctaText: 'Koleksiyonu İncele',
    ctaUrl: '/products',
  },
];

export const mockWholesaleBenefits: WholesaleBenefit[] = [
  {
    id: 'w0000000-0000-0000-0000-000000000001',
    title: 'İç Mimarlar & Projelere Özel',
    description: 'Otel, restoran, lobi ve konut projeleri için özel hacim iskontoları ve numune desteği.',
    iconName: 'Building2',
    order: 1,
  },
  {
    id: 'w0000000-0000-0000-0000-000000000002',
    title: 'Düşük Minimum Sipariş (MOQ)',
    description: 'Model başına 3-6 adet arası düşük MOQ ile butik mağazalar için esnek stok yönetimi.',
    iconName: 'PackageCheck',
    order: 2,
  },
  {
    id: 'w0000000-0000-0000-0000-000000000003',
    title: 'Özel Sır & Renk Üretimi',
    description: 'Büyük ölçekli mimari projeler için RAL/Pantone uyumlu özel mineral sır geliştirme.',
    iconName: 'Palette',
    order: 3,
  },
  {
    id: 'w0000000-0000-0000-0000-000000000004',
    title: 'Güvenli Sandıklı Lojistik',
    description: 'Kırılmaya karşı sigortalı, paletli ve özel köpük ambalajlı yurt içi & yurt dışı sevkiyat.',
    iconName: 'Truck',
    order: 4,
  },
];

export const emptyMegaMenu: MegaMenuData = {
  groups: [],
  promo: {
    title: '',
    subtitle: '',
    imageUrl: '',
    ctaText: 'Keşfet',
    ctaHref: '/products',
  },
};
