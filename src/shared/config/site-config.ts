export interface SiteConfig {
  name: string;
  tagline: string;
  description: string;
  announcement: {
    enabled: boolean;
    text: string;
    actionText?: string;
    actionUrl?: string;
  };
  contact: {
    email: string;
    wholesaleEmail: string;
    phone: string;
    address: string;
  };
  social: {
    instagram: string;
    pinterest: string;
  };
}

export const siteConfig: SiteConfig = {
  name: 'Vazo Studio',
  tagline: 'Heykelsi Formlar & Çağdaş Seramik Tasarımlar',
  description: 'İskandinav estetiği ve zanaatkar dokunuşlarla şekillenen premium vazo koleksiyonları. Perakende ve toptan satış.',
  announcement: {
    enabled: true,
    text: 'Perakende ve toptan satışlarımız mevcuttur. Kurumsal ve mimari projeleriniz için özel üretim avantajları.',
    actionText: 'Toptan Başvuru',
    actionUrl: '/wholesale',
  },
  contact: {
    email: 'info@vazostudio.com',
    wholesaleEmail: 'b2b@vazostudio.com',
    phone: '+90 (212) 555 0192',
    address: 'Karaköy Tasarım Bölgesi, Kemankeş Cad. No: 42, Beyoğlu / İstanbul',
  },
  social: {
    instagram: 'https://instagram.com',
    pinterest: 'https://pinterest.com',
  },
};
