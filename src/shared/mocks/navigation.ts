export interface MegaMenuLink {
  label: string;
  href: string;
  isNew?: boolean;
  isPopular?: boolean;
}

export interface MegaMenuGroup {
  title: string;
  links: MegaMenuLink[];
}

export interface MegaMenuPromo {
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  ctaHref: string;
}

export interface MegaMenuData {
  groups: MegaMenuGroup[];
  promo: MegaMenuPromo;
}

export const perakendeMegaMenuData: MegaMenuData = {
  groups: [
    {
      title: 'Kategoriler',
      links: [
        { label: 'Tüm Koleksiyon', href: '/products' },
        { label: 'Yeni Gelenler', href: '/products?filter=new', isNew: true },
        { label: 'Çok Satanlar', href: '/products?filter=bestseller', isPopular: true },
        { label: 'Masa Üstü Vazolar', href: '/products?category=tabletop' },
        { label: 'Zemin & Anıt Vazolar', href: '/products?category=floor' },
        { label: 'Heykelsi Objeler', href: '/products?category=sculptural' },
        { label: 'Vazo & Kase Setleri', href: '/products?category=sets' },
      ],
    },
    {
      title: 'Materyal & Doku',
      links: [
        { label: 'Mat Stoneware Seramik', href: '/products?material=stoneware' },
        { label: 'Ham Toprak & Terakota', href: '/products?material=terracotta' },
        { label: 'Sırlı Porselen Formlar', href: '/products?material=porcelain' },
        { label: 'Kum Doku & Dokulu Yüzeyler', href: '/products?finish=textured' },
        { label: 'Doğal Bazalt Efekti', href: '/products?finish=basalt' },
      ],
    },
    {
      title: 'Koleksiyonlar',
      links: [
        { label: 'Nordik Sessizlik Serisi', href: '/collections/nordic-silence' },
        { label: 'Amforik Kıvrımlar 2026', href: '/collections/amphoric-curves' },
        { label: 'Monokrom Brütalizm', href: '/collections/monochrome' },
        { label: 'Doğal Toprak Tonları', href: '/collections/earth-tones' },
      ],
    },
  ],
  promo: {
    title: 'Yeni Sezon: Nordik Sessizlik',
    subtitle: 'Heykelsi silüetler ve mineral mat sırlı yüzeylerin dingin uyumu.',
    imageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80',
    ctaText: 'Koleksiyonu İncele',
    ctaHref: '/collections/nordic-silence',
  },
};

export const toptanMegaMenuData: MegaMenuData = {
  groups: [
    {
      title: 'Toptan Çözümleri',
      links: [
        { label: 'Toptan Satış Programı', href: '/wholesale' },
        { label: 'Kademeli Fiyatlandırma & İndirimler', href: '/wholesale/how-it-works' },
        { label: 'Minimum Sipariş (MOQ) Koşulları', href: '/wholesale/how-it-works' },
        { label: 'Numune Seti Siparişi', href: '/wholesale/apply' },
        { label: 'Toptan Ürün Kataloğu', href: '/wholesale/products' },
      ],
    },
    {
      title: 'Sektörel Projeler',
      links: [
        { label: 'İç Mimarlar & Tasarım Ofisleri', href: '/wholesale/apply' },
        { label: 'Otel, Restoran & Kafe (HORECA)', href: '/wholesale/apply' },
        { label: 'Butik Konsept Mağazalar', href: '/wholesale/apply' },
        { label: 'Kurumsal VIP Hediye Projeleri', href: '/wholesale/apply' },
        { label: 'Özel Ölçü & Sır Üretimi', href: '/wholesale/apply' },
      ],
    },
    {
      title: 'Süreç & Başvuru',
      links: [
        { label: 'Bayilik & Trade Başvuru Formu', href: '/wholesale/apply' },
        { label: 'Üretim & Teslimat Takvimi', href: '/wholesale/how-it-works' },
        { label: 'Paletli & Güvenli Lojistik', href: '/policies/shipping-returns' },
        { label: 'Toptan Müşteri Temsilcisi', href: '/contact' },
      ],
    },
  ],
  promo: {
    title: 'Mimari Projeler & Toptan Alım',
    subtitle: '10+ adet alımlarda anında hacim indirimi ve projeye özel danışmanlık.',
    imageUrl: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=600&q=80',
    ctaText: 'Kurumsal Başvuru Yap',
    ctaHref: '/wholesale/apply',
  },
};
