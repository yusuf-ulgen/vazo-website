import type {
  AnnouncementBarConfig,
  HeroBannerConfig,
  EditorialSectionConfig,
  SplitHeroConfig,
  WholesaleBenefit,
} from '../types';
import { siteConfig } from '@/shared/config/site-config';
import type { MegaMenuData } from '@/shared/mocks/navigation';
import { mockPolicyPages } from './policy-mocks';

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
    id: 'a1000000-0000-0000-0000-000000000001',
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
    id: 'a1000000-0000-0000-0000-000000000002',
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
    id: 'a5000000-0000-0000-0000-000000000001',
    title: 'İç Mimarlar & Projelere Özel',
    description: 'Otel, restoran, lobi ve konut projeleri için özel hacim iskontoları ve numune desteği.',
    iconName: 'Building2',
    order: 1,
  },
  {
    id: 'a5000000-0000-0000-0000-000000000002',
    title: 'Düşük Minimum Sipariş (MOQ)',
    description: 'Model başına 3-6 adet arası düşük MOQ ile butik mağazalar için esnek stok yönetimi.',
    iconName: 'PackageCheck',
    order: 2,
  },
  {
    id: 'a5000000-0000-0000-0000-000000000003',
    title: 'Özel Sır & Renk Üretimi',
    description: 'Büyük ölçekli mimari projeler için RAL/Pantone uyumlu özel mineral sır geliştirme.',
    iconName: 'Palette',
    order: 3,
  },
  {
    id: 'a5000000-0000-0000-0000-000000000004',
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

export const mockContentPages: Record<string, {
  id: string;
  pageKey: string;
  title: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  published: boolean;
  sections: Array<{
    id: string;
    pageId: string;
    sectionKey: string;
    eyebrow?: string | null;
    title: string;
    subtitle?: string | null;
    content?: string | null;
    imageUrl?: string | null;
    imagePosition?: string;
    ctaText?: string | null;
    ctaUrl?: string | null;
    sortOrder: number;
    active: boolean;
  }>;
}> = {
  about: {
    id: 'cp-about',
    pageKey: 'about',
    title: 'Hakkımızda & Zanaat Hikayemiz',
    seoTitle: 'Hakkımızda & Zanaat Hikayemiz | Vazo Studio',
    seoDescription: 'Vazo Studio; İskandinav sadeliği ile geleneksel el yapımı seramik zanaatını buluşturan heykelsi vazo stüdyosudur.',
    published: true,
    sections: [
      {
        id: 'cs-about-1',
        pageId: 'cp-about',
        sectionKey: 'hero_header',
        eyebrow: 'Felsefemiz & Atölyemiz',
        title: 'Sessizliğin, Toprağın ve Heykelsi Formların Dengesi.',
        subtitle: 'Seri üretimin tekdüzeliğine karşı bir duruş.',
        content: 'Vazo Studio, seri üretimin tekdüzeliğine karşı bir duruş olarak doğdu. Doğal mineralli killerin el tornasında usta ellerle şekillendiği, her bir parçanın kendine has yüzey dokusu ve fırın izleri taşıdığı zamansız objeler üretiyoruz.',
        sortOrder: 1,
        active: true,
      },
      {
        id: 'cs-about-2',
        pageId: 'cp-about',
        sectionKey: 'story_craft',
        eyebrow: '01 / Geleneksel Zanaat',
        title: 'El Tornasında Şekillenen Karakter',
        content: 'Koleksiyonlarımızdaki her form, kalıplarla dökülmek yerine el tornasında tek tek döndürülerek yükselir. Bu sayede her parça, usta ellerin parmak izlerini ve kilin doğal akışını üzerinde taşır.\n\nKullandığımız mineral zengini stoneware kili, 1250°C yüksek sıcaklıkta fırınlanarak taş kıvamında monolitik bir sertliğe ve %100 su geçirimsizliğe ulaşır.',
        imageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=85',
        imagePosition: 'left',
        sortOrder: 2,
        active: true,
      },
      {
        id: 'cs-about-3',
        pageId: 'cp-about',
        sectionKey: 'story_material',
        eyebrow: '02 / Malzeme ve Doku',
        title: 'Ham Mineraller & Dingin Mat Yüzeyler',
        content: 'Parlak ve yapay sentetik cilalardan bilinçli olarak kaçınıyoruz. Tebeşir beyazı, ham terakota, volkanik bazalt kili ve kum beji tonlarındaki özel mat mineral sırlarımız mekanlara sakinleştirici bir dokunsallık kazandırır.',
        imageUrl: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1200&q=85',
        imagePosition: 'right',
        ctaText: 'Koleksiyonu Keşfet',
        ctaUrl: '/products',
        sortOrder: 3,
        active: true,
      },
    ],
  },
  wholesale_landing: {
    id: 'cp-wholesale',
    pageKey: 'wholesale_landing',
    title: 'Kurumsal & Toptan Çözümleri',
    seoTitle: 'Kurumsal & Toptan Satış | Vazo Studio',
    seoDescription: 'İç mimarlar, HoReCa ve seçkin mağazalar için özel toptan seramik vazo üretimi ve mimari danışmanlık.',
    published: true,
    sections: [
      {
        id: 'cs-ws-1',
        pageId: 'cp-wholesale',
        sectionKey: 'hero',
        eyebrow: 'Kurumsal & Toptan Çözümleri',
        title: 'Mimari Mekanlara Heykelsi Dokunuş. Özel Toptan Üretim.',
        content: 'Vazo Studio, iç mimarlar, otel projeleri ve seçkin tasarım mağazaları için yüksek kalite el yapımı seramik ve stoneware vazolar üretir. Esnek hacim kademeleri ve hızlı üretim kapasitesiyle projelerinize değer katın.',
        ctaText: 'Toptan Satışa Başvur',
        ctaUrl: '/wholesale/apply',
        sortOrder: 1,
        active: true,
      },
    ],
  },
  wholesale_how_it_works: {
    id: 'cp-how-it-works',
    pageKey: 'wholesale_how_it_works',
    title: 'Toptan Sipariş & Üretim Süreci',
    seoTitle: 'Toptan Nasıl Çalışır? | Vazo Studio',
    seoDescription: 'Toptan sipariş adımları, numune süreci, özel sır geliştirme ve lojistik teslimat aşamaları.',
    published: true,
    sections: [
      {
        id: 'cs-hiw-1',
        pageId: 'cp-how-it-works',
        sectionKey: 'step_1',
        eyebrow: 'Adım 01',
        title: 'Başvuru & İhtiyaç Belirleme',
        content: 'Online başvuru formumuz üzerinden veya doğrudan toptan temsilcimizle iletişime geçerek projenizin kapsamını, ilgilendiğiniz model ve yaklaşık adetleri paylaşırsınız.',
        sortOrder: 1,
        active: true,
      },
      {
        id: 'cs-hiw-2',
        pageId: 'cp-how-it-works',
        sectionKey: 'step_2',
        eyebrow: 'Adım 02',
        title: 'Numune & Sır Onayı',
        content: 'Karar verme sürecinizi kolaylaştırmak amacıyla, seçtiğiniz modellerin mini numunelerini veya özel sır renk kartelasını ofisinize kargoluyoruz.',
        sortOrder: 2,
        active: true,
      },
      {
        id: 'cs-hiw-3',
        pageId: 'cp-how-it-works',
        sectionKey: 'step_3',
        eyebrow: 'Adım 03',
        title: 'Resmi Teklif & Termin Takvimi',
        content: 'Onaylanan adet ve varyantlar doğrultusunda KDV hariç net toptan teklifiniz ve atölye üretim termin takvimi (genellikle 10-25 iş günü) hazırlanır.',
        sortOrder: 3,
        active: true,
      },
      {
        id: 'cs-hiw-4',
        pageId: 'cp-how-it-works',
        sectionKey: 'step_4',
        eyebrow: 'Adım 04',
        title: 'El Yapımı Üretim & Kalite Kontrol',
        content: 'Seramik ustalarımız el tornasında modelleri şekillendirir, sırlama işlemi tamamlanır ve 1250°C fırınlama sonrası her parça tek tek incelenir.',
        sortOrder: 4,
        active: true,
      },
      {
        id: 'cs-hiw-5',
        pageId: 'cp-how-it-works',
        sectionKey: 'step_5',
        eyebrow: 'Adım 05',
        title: 'Sigortalı Paletli Sevkiyat',
        content: 'Ürünler darbe sönümleyici özel kesim süngerlerle sandıklanır, paletlenir ve şantiye ya da mağaza adresinize tam kasko sigortalı teslim edilir.',
        sortOrder: 5,
        active: true,
      },
    ],
  },
  ...mockPolicyPages,
};

export const mockFaqGroups = [
  {
    id: 'fg-01',
    title: 'Sipariş & Teslimat',
    sortOrder: 1,
    active: true,
    items: [
      {
        id: 'fi-01',
        groupId: 'fg-01',
        question: 'Siparişler ne kadar sürede kargoya teslim edilir?',
        answer: 'Stokta bulunan ürünlerimiz özenle paketlenerek anlaşmalı kargo firmaları aracılığıyla en kısa sürede sevkiyata hazırlanır.',
        sortOrder: 1,
        active: true,
      },
      {
        id: 'fi-02',
        groupId: 'fg-01',
        question: 'Seramik ürünler kargoda hasar görürse ne yapmalıyım?',
        answer: 'Tüm gönderilerimiz kırılmaya karşı koruyucu ambalajlarla sevk edilir. Kargo teslimi anında hasar fark edilmesi durumunda bize iletilmesi halinde gerekli destek sağlanır.',
        sortOrder: 2,
        active: true,
      },
      {
        id: 'fi-03',
        groupId: 'fg-01',
        question: 'Kargo ücreti ne kadar?',
        answer: 'Belirlenen sepet tutarının üzerindeki perakende siparişlerde kargo ücretsizdir. Güncel kargo tutarı ve eşikleri sepet ve ödeme adımında görüntülenir.',
        sortOrder: 3,
        active: true,
      },
    ],
  },
  {
    id: 'fg-02',
    title: 'Ürün Bakımı & Özellikler',
    sortOrder: 2,
    active: true,
    items: [
      {
        id: 'fi-04',
        groupId: 'fg-02',
        question: 'Vazoların içine canlı çiçek ve su konulabilir mi?',
        answer: 'Evet. Tüm vazolarımız 1250°C fırınlanmış stoneware kilinden üretilir ve iç kısımları su geçirimsiz sırla kaplıdır. Canlı çiçeklerle su doldurarak güvenle kullanabilirsiniz.',
        sortOrder: 1,
        active: true,
      },
      {
        id: 'fi-05',
        groupId: 'fg-02',
        question: 'Seramik vazolar nasıl temizlenmelidir?',
        answer: 'Ilık su ve yumuşak mikrofiber bez yardımıyla temizlenmesi önerilir. Mat mineral sır dokusunu korumak amacıyla aşındırıcı kimyasallar ve sert süngerler kullanılmamalıdır.',
        sortOrder: 2,
        active: true,
      },
    ],
  },
  {
    id: 'fg-03',
    title: 'Toptan & Kurumsal Satış',
    sortOrder: 3,
    active: true,
    items: [
      {
        id: 'fi-06',
        groupId: 'fg-03',
        question: 'Toptan alımlarda minimum sipariş adedi (MOQ) nedir?',
        answer: 'Model başına Minimum Sipariş Adedimiz (MOQ) 6 adettir. Belirli adetlerin üzerindeki siparişlerde kademeli toptan iskonto oranları uygulanır.',
        sortOrder: 1,
        active: true,
      },
      {
        id: 'fi-07',
        groupId: 'fg-03',
        question: 'Mimari projeler için özel renk veya sır geliştiriyor musunuz?',
        answer: 'Evet. Belirli adetlerin üzerindeki otel, restoran ve konut projelerinde mimari ekibinizin renk kartelasına uygun özel mineral sırlar geliştirilebilmektedir.',
        sortOrder: 2,
        active: true,
      },
    ],
  },
];

export const mockPrimaryNavGroups = [
  {
    id: 'mock-primary-group',
    menuType: 'primary' as const,
    title: 'Ana Menü',
    sortOrder: 1,
    active: true,
    items: [
      { id: 'p1', groupId: 'mock-primary-group', label: 'Yeni', href: '/new', isNew: false, isPopular: false, sortOrder: 1, active: true },
      { id: 'p2', groupId: 'mock-primary-group', label: 'Perakende', href: '/products', isNew: false, isPopular: false, sortOrder: 2, active: true },
      { id: 'p3', groupId: 'mock-primary-group', label: 'Toptan', href: '/wholesale', isNew: false, isPopular: false, sortOrder: 3, active: true },
      { id: 'p4', groupId: 'mock-primary-group', label: 'Koleksiyonlar', href: '/collections', isNew: false, isPopular: false, sortOrder: 4, active: true },
      { id: 'p5', groupId: 'mock-primary-group', label: 'Hakkımızda', href: '/about', isNew: false, isPopular: false, sortOrder: 5, active: true },
      { id: 'p6', groupId: 'mock-primary-group', label: 'İletişim', href: '/contact', isNew: false, isPopular: false, sortOrder: 6, active: true },
    ],
  },
];

export const mockFooterNavGroups = [
  {
    id: 'mock-f1',
    menuType: 'footer' as const,
    title: 'Alışveriş',
    sortOrder: 1,
    active: true,
    items: [
      { id: 'f1-1', groupId: 'mock-f1', label: 'Tüm Modeller', href: '/products', isNew: false, isPopular: false, sortOrder: 1, active: true },
      { id: 'f1-2', groupId: 'mock-f1', label: 'Yeni Gelenler', href: '/new', isNew: false, isPopular: false, sortOrder: 2, active: true },
      { id: 'f1-3', groupId: 'mock-f1', label: 'Çok Satanlar', href: '/bestsellers', isNew: false, isPopular: false, sortOrder: 3, active: true },
      { id: 'f1-4', groupId: 'mock-f1', label: 'Koleksiyonlar', href: '/collections', isNew: false, isPopular: false, sortOrder: 4, active: true },
    ],
  },
  {
    id: 'mock-f2',
    menuType: 'footer' as const,
    title: 'Toptan',
    sortOrder: 2,
    active: true,
    items: [
      { id: 'f2-1', groupId: 'mock-f2', label: 'Toptan Satışımız', href: '/wholesale', isNew: false, isPopular: false, sortOrder: 1, active: true },
      { id: 'f2-2', groupId: 'mock-f2', label: 'Toptan Kataloğu', href: '/wholesale/products', isNew: false, isPopular: false, sortOrder: 2, active: true },
      { id: 'f2-3', groupId: 'mock-f2', label: 'Nasıl Çalışır?', href: '/wholesale/how-it-works', isNew: false, isPopular: false, sortOrder: 3, active: true },
      { id: 'f2-4', groupId: 'mock-f2', label: 'Ticari Hesap Başvurusu', href: '/wholesale/apply', isNew: false, isPopular: false, sortOrder: 4, active: true },
    ],
  },
  {
    id: 'mock-f3',
    menuType: 'footer' as const,
    title: 'Müşteri Deneyimi',
    sortOrder: 3,
    active: true,
    items: [
      { id: 'f3-1', groupId: 'mock-f3', label: 'Hakkımızda & Zanaat', href: '/about', isNew: false, isPopular: false, sortOrder: 1, active: true },
      { id: 'f3-2', groupId: 'mock-f3', label: 'İletişim & Showroom', href: '/contact', isNew: false, isPopular: false, sortOrder: 2, active: true },
      { id: 'f3-3', groupId: 'mock-f3', label: 'Sıkça Sorulan Sorular', href: '/faq', isNew: false, isPopular: false, sortOrder: 3, active: true },
      { id: 'f3-4', groupId: 'mock-f3', label: 'Kargo & İade Koşulları', href: '#policy-shipping', isNew: false, isPopular: false, sortOrder: 4, active: true },
    ],
  },
];


