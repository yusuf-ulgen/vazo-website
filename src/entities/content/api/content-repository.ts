import {
  AnnouncementBarConfig,
  HeroBannerConfig,
  EditorialSectionConfig,
} from '../types';
import { supabase, isSupabaseConfigured } from '@/shared/lib/supabase';
import { siteConfig } from '@/shared/config/site-config';

export interface WholesaleBenefit {
  id: string;
  title: string;
  description: string;
  iconName: string;
  order: number;
}

export interface TradeApplicationPayload {
  companyName: string;
  taxNumber: string;
  taxOffice: string;
  businessType: string;
  contactPerson: string;
  email: string;
  phone: string;
  website?: string;
  estimatedMonthlyVolume?: string;
  notes?: string;
}

const mockAnnouncement: AnnouncementBarConfig = {
  isEnabled: true,
  message: siteConfig.announcement.text,
  linkText: siteConfig.announcement.actionText,
  linkUrl: siteConfig.announcement.actionUrl,
};

const mockHero: HeroBannerConfig = {
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

const mockEditorialSections: EditorialSectionConfig[] = [
  {
    id: 'e0000000-0000-0000-0000-000000000001',
    eyebrow: 'Zanaat & Felsefe',
    title: 'Toprağın Doğallığı, Mimari Heykelsilik.',
    description:
      'Her bir parça, mineral zengini stoneware kilinin geleneksel el tornasında şekillendirilmesi ve 1250°C fırınlama ile monolitik dayanıklılığa kavuşmasıyla üretilir. Seri üretimin tekdüzeliğinden uzak, her vazoda hafif ton ve doku farklılıkları barındıran özgün bir karaktere sahiptir.',
    imageUrl:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80',
    imagePosition: 'left',
    ctaText: 'Stüdyo Hikayemiz',
    ctaUrl: '/about',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000002',
    eyebrow: 'Materyal ve Doku',
    title: 'Ham Mineraller, Dingin Renk Paleti.',
    description:
      'Toprağın ham minerallerini yüzeyde hissettiren mat dokular, İskandinav nötr renk skalasıyla birleşiyor. Parlak yapay cilalar yerine tebeşir, kum, bazalt ve ham terakota yüzeyler tercih ediyoruz.',
    imageUrl:
      'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=900&q=80',
    imagePosition: 'right',
    ctaText: 'Koleksiyonu İncele',
    ctaUrl: '/collections/nordic-silence',
  },
];

const mockWholesaleBenefits: WholesaleBenefit[] = [
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

export const contentRepository = {
  async getAnnouncement(): Promise<AnnouncementBarConfig> {
    if (!isSupabaseConfigured || import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
      return mockAnnouncement;
    }

    if (!supabase) return mockAnnouncement;

    try {
      const { data, error } = await supabase
        .from('announcement_bars')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error || !data) return mockAnnouncement;

      return {
        isEnabled: data.active,
        message: data.message,
        linkText: data.link_text || undefined,
        linkUrl: data.link_url || undefined,
        backgroundColor: data.background_color || undefined,
        textColor: data.text_color || undefined,
      };
    } catch {
      return mockAnnouncement;
    }
  },

  async getHero(): Promise<HeroBannerConfig> {
    if (!isSupabaseConfigured || import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
      return mockHero;
    }

    if (!supabase) return mockHero;

    try {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error || !data) return mockHero;

      return {
        title: data.title,
        subtitle: data.subtitle || '',
        description: data.description,
        imageUrl: data.image_url,
        primaryCtaText: data.primary_cta_text,
        primaryCtaUrl: data.primary_cta_url,
        secondaryCtaText: data.secondary_cta_text || '',
        secondaryCtaUrl: data.secondary_cta_url || '',
      };
    } catch {
      return mockHero;
    }
  },

  async getEditorialSections(): Promise<EditorialSectionConfig[]> {
    if (!isSupabaseConfigured || import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
      return mockEditorialSections;
    }

    if (!supabase) return mockEditorialSections;

    try {
      const { data, error } = await supabase
        .from('editorial_sections')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (error || !data || data.length === 0) return mockEditorialSections;

      return data.map((row) => ({
        id: row.id,
        eyebrow: row.eyebrow,
        title: row.title,
        description: row.description,
        imageUrl: row.image_url,
        imagePosition: (row.image_position as 'left' | 'right') || 'left',
        ctaText: row.cta_text || '',
        ctaUrl: row.cta_url || '',
      }));
    } catch {
      return mockEditorialSections;
    }
  },

  async getWholesaleBenefits(): Promise<WholesaleBenefit[]> {
    if (!isSupabaseConfigured || import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
      return mockWholesaleBenefits;
    }

    if (!supabase) return mockWholesaleBenefits;

    try {
      const { data, error } = await supabase
        .from('wholesale_benefits')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (error || !data || data.length === 0) return mockWholesaleBenefits;

      return data.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        iconName: row.icon_name,
        order: row.sort_order,
      }));
    } catch {
      return mockWholesaleBenefits;
    }
  },

  async submitTradeApplication(payload: TradeApplicationPayload): Promise<{ success: boolean; message: string }> {
    if (!isSupabaseConfigured || import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
      // Simulate successful submission in mock mode
      await new Promise((resolve) => setTimeout(resolve, 600));
      return {
        success: true,
        message: 'Toptan / Trade başvurunuz başarıyla alındı. B2B temsilcimiz 24 saat içinde sizinle iletişime geçecektir.',
      };
    }

    if (!supabase) {
      throw new Error('Supabase client is not available.');
    }

    const { error } = await supabase.from('trade_applications').insert({
      company_name: payload.companyName,
      tax_number: payload.taxNumber,
      tax_office: payload.taxOffice,
      business_type: payload.businessType,
      contact_person: payload.contactPerson,
      email: payload.email,
      phone: payload.phone,
      website: payload.website || null,
      estimated_monthly_volume: payload.estimatedMonthlyVolume || null,
      notes: payload.notes || null,
      status: 'pending',
    });

    if (error) {
      console.error('[contentRepository.submitTradeApplication] Error:', error);
      throw new Error(`Başvuru iletilemedi: ${error.message}`);
    }

    return {
      success: true,
      message: 'Toptan / Trade başvurunuz başarıyla alındı. B2B temsilcimiz en kısa sürede sizinle iletişime geçecektir.',
    };
  },
};
