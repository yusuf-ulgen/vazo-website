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
  checkoutEnabled: boolean;
}

export interface SocialSettings {
  instagram: string;
  facebook: string;
  pinterest: string;
}

/** Legal seller identity — stored server-side in site_settings key='seller_legal'. */
export interface SellerLegalSettings {
  business_type: string;
  owner_full_name: string;
  legal_trade_title: string;
  brand_name: string | null;
  tax_office: string;
  tax_number: string;
  registered_address: string;
  kep_address: string;
  business_email: string;
  business_phone: string;
  chamber_name: string | null;
  chamber_registration_number: string | null;
  trade_registry_number: string | null;
  /** Optional for şahıs firması / sole proprietors */
  mersis_number: string | null;
}

export const SELLER_LEGAL_REQUIRED_FIELDS: (keyof SellerLegalSettings)[] = [
  'business_type',
  'owner_full_name',
  'legal_trade_title',
  'tax_office',
  'tax_number',
  'registered_address',
  'kep_address',
  'business_email',
  'business_phone',
];

export const DEFAULT_SELLER_LEGAL: SellerLegalSettings = {
  business_type: '',
  owner_full_name: '',
  legal_trade_title: '',
  brand_name: null,
  tax_office: '',
  tax_number: '',
  registered_address: '',
  kep_address: '',
  business_email: '',
  business_phone: '',
  chamber_name: null,
  chamber_registration_number: null,
  trade_registry_number: null,
  mersis_number: null,
};

/** Boolean-only readiness map — no secrets, no values. */
export interface CheckoutReadiness {
  seller_legal_complete: boolean;
  checkout_enabled: boolean;
  has_active_shipping: boolean;
  /** null = cannot verify from DB (Deno env only) */
  paytr_secrets_present: boolean | null;
  /** null = cannot verify from DB */
  gmail_secrets_present: boolean | null;
  seller_fields_summary: Record<string, boolean>;
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
    checkoutEnabled: false,
  },
  social: {
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
    pinterest: 'https://pinterest.com',
  },
};

