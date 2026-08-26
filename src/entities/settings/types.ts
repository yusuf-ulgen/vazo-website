export interface GeneralSettings {
  brandName: string;
  tagline: string;
  description: string;
}

export interface ContactSettings {
  email: string;
  wholesaleEmail: string;
  phone: string;
  address: string;
  businessHours: string;
}

export interface CommerceSettings {
  freeShippingThreshold: number;
  shippingEstimateText: string;
  shippingSummary: string;
  returnsPolicyText: string;
}

export interface SocialSettings {
  instagram: string;
  facebook: string;
  pinterest: string;
}

export interface PublicSiteSettings {
  general: GeneralSettings;
  contact: ContactSettings;
  commerce: CommerceSettings;
  social: SocialSettings;
}

export const DEFAULT_PUBLIC_SITE_SETTINGS: PublicSiteSettings = {
  general: {
    brandName: 'Vazo Studio',
    tagline: 'Heykelsi Formlar & Çağdaş Seramik Tasarımlar',
    description: 'İskandinav estetiği ve zanaatkar dokunuşlarla şekillenen premium vazo koleksiyonları. Perakende ve toptan satış.',
  },
  contact: {
    email: 'info@vazostudio.com',
    wholesaleEmail: 'toptan@vazostudio.com',
    phone: '+90 (212) 555 0192',
    address: 'Karaköy Tasarım Bölgesi, Kemankeş Cad. No: 42, Beyoğlu / İstanbul',
    businessHours: 'Pazartesi – Cumartesi: 10:00 – 19:00 (Pazar Kapalı)',
  },
  commerce: {
    freeShippingThreshold: 5000,
    shippingEstimateText: 'Ödeme adımında hesaplanır',
    shippingSummary: 'Güvenli Alışveriş ve Sigortalı Sevkiyat',
    returnsPolicyText: 'Teslimattan itibaren 14 gün içinde iade imkanı.',
  },
  social: {
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
    pinterest: 'https://pinterest.com',
  },
};
