import {
  AnnouncementBarConfig,
  HeroBannerConfig,
  EditorialSectionConfig,
} from '../types';
import { supabase, isSupabaseConfigured } from '@/shared/lib/supabase';
import { siteConfig } from '@/shared/config/site-config';
import {
  MegaMenuData,
  perakendeMegaMenuData,
  toptanMegaMenuData,
} from '@/shared/mocks/navigation';

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
  customerMessage?: string;
  notes?: string;
  company_website_confirm?: string;
}

export interface ContactMessagePayload {
  name: string;
  email: string;
  subject: string;
  message: string;
  company_website_confirm?: string;
}

export interface NewsletterSubscriptionPayload {
  email: string;
  source?: string;
  company_website_confirm?: string;
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

const emptyMegaMenu: MegaMenuData = {
  groups: [],
  promo: {
    title: '',
    subtitle: '',
    imageUrl: '',
    ctaText: 'Keşfet',
    ctaHref: '/products',
  },
};

export const contentRepository = {
  async getAnnouncement(): Promise<AnnouncementBarConfig | null> {
    if (!isSupabaseConfigured || import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
      return mockAnnouncement;
    }

    if (!supabase) {
      throw new Error('Supabase client is not available in live mode.');
    }

    const { data, error } = await supabase
      .from('announcement_bars')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[contentRepository.getAnnouncement] Live Supabase error:', error.message);
      throw new Error(`Failed to fetch announcement from Supabase: ${error.message}`);
    }

    if (!data) return null;

    return {
      isEnabled: data.active,
      message: data.message,
      linkText: data.link_text || undefined,
      linkUrl: data.link_url || undefined,
      backgroundColor: data.background_color || undefined,
      textColor: data.text_color || undefined,
    };
  },

  async getHero(): Promise<HeroBannerConfig | null> {
    if (!isSupabaseConfigured || import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
      return mockHero;
    }

    if (!supabase) {
      throw new Error('Supabase client is not available in live mode.');
    }

    const { data, error } = await supabase
      .from('hero_slides')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[contentRepository.getHero] Live Supabase error:', error.message);
      throw new Error(`Failed to fetch hero from Supabase: ${error.message}`);
    }

    if (!data) return null;

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
  },

  async getEditorialSections(): Promise<EditorialSectionConfig[]> {
    if (!isSupabaseConfigured || import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
      return mockEditorialSections;
    }

    if (!supabase) {
      throw new Error('Supabase client is not available in live mode.');
    }

    const { data, error } = await supabase
      .from('editorial_sections')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[contentRepository.getEditorialSections] Live Supabase error:', error.message);
      throw new Error(`Failed to fetch editorial sections from Supabase: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      eyebrow: row.eyebrow,
      title: row.title,
      description: row.description,
      imageUrl: row.image_url,
      imagePosition: (row.image_position as 'left' | 'right') || 'left',
      ctaText: row.cta_text || '',
      ctaUrl: row.cta_url || '',
    }));
  },

  async getWholesaleBenefits(): Promise<WholesaleBenefit[]> {
    if (!isSupabaseConfigured || import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
      return mockWholesaleBenefits;
    }

    if (!supabase) {
      throw new Error('Supabase client is not available in live mode.');
    }

    const { data, error } = await supabase
      .from('wholesale_benefits')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[contentRepository.getWholesaleBenefits] Live Supabase error:', error.message);
      throw new Error(`Failed to fetch wholesale benefits from Supabase: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      iconName: row.icon_name,
      order: row.sort_order,
    }));
  },

  async getMegaMenu(menuType: 'retail_mega' | 'wholesale_mega'): Promise<MegaMenuData> {
    if (!isSupabaseConfigured || import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
      return menuType === 'retail_mega' ? perakendeMegaMenuData : toptanMegaMenuData;
    }

    if (!supabase) {
      throw new Error('Supabase client is not available in live mode.');
    }

    const { data, error } = await supabase
      .from('menu_groups')
      .select(`
        *,
        menu_items (*)
      `)
      .eq('menu_type', menuType)
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[contentRepository.getMegaMenu] Live Supabase error:', error.message);
      throw new Error(`Failed to fetch navigation menu from Supabase: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return emptyMegaMenu;
    }

    const firstGroupWithPromo = data.find((g) => g.promo_title);

    const groups = data.map((g) => ({
      title: g.title,
      links: (g.menu_items || [])
        .filter((item: { active: boolean }) => item.active)
        .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
        .map((item: { label: string; href: string; is_new: boolean; is_popular: boolean }) => ({
          label: item.label,
          href: item.href,
          isNew: item.is_new,
          isPopular: item.is_popular,
        })),
    }));

    const promo = firstGroupWithPromo
      ? {
          title: firstGroupWithPromo.promo_title || '',
          subtitle: firstGroupWithPromo.promo_subtitle || '',
          imageUrl: firstGroupWithPromo.promo_image_url || '',
          ctaText: firstGroupWithPromo.promo_cta_text || 'Keşfet',
          ctaHref: firstGroupWithPromo.promo_cta_url || '/products',
        }
      : emptyMegaMenu.promo;

    return { groups, promo };
  },

  async submitTradeApplication(payload: TradeApplicationPayload): Promise<{ success: boolean; message: string }> {
    if (!isSupabaseConfigured || import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        success: true,
        message: 'Toptan başvurunuz başarıyla alındı. Müşteri temsilcimiz en kısa sürede sizinle iletişime geçecektir.',
      };
    }

    if (!supabase) {
      throw new Error('Supabase client is not available in live mode.');
    }

    try {
      const { data, error } = await supabase.functions.invoke('submit-trade-application', {
        body: payload,
      });

      if (error) {
        throw new Error(error.message || 'Başvuru sunucuya iletilemedi.');
      }

      if (data && data.error) {
        throw new Error(data.error);
      }

      return {
        success: true,
        message: data?.message || 'Toptan / Trade başvurunuz başarıyla alındı.',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Başvuru iletilirken beklenmeyen bir hata oluştu.';
      console.error('[contentRepository.submitTradeApplication] Error:', msg);
      throw new Error(msg);
    }
  },

  async submitContactMessage(payload: ContactMessagePayload): Promise<{ success: boolean; message: string }> {
    if (!isSupabaseConfigured || import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        success: true,
        message: 'Mesajınız stüdyo ekibimize iletilmiştir.',
      };
    }

    if (!supabase) {
      throw new Error('Supabase client is not available in live mode.');
    }

    try {
      const { data, error } = await supabase.functions.invoke('submit-contact-message', {
        body: payload,
      });

      if (error) {
        throw new Error(error.message || 'Mesaj sunucuya iletilemedi.');
      }

      if (data && data.error) {
        throw new Error(data.error);
      }

      return {
        success: true,
        message: data?.message || 'Mesajınız stüdyo ekibimize iletilmiştir.',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Mesaj iletilirken bir hata oluştu.';
      console.error('[contentRepository.submitContactMessage] Error:', msg);
      throw new Error(msg);
    }
  },

  async subscribeNewsletter(payload: NewsletterSubscriptionPayload): Promise<{ success: boolean; message: string }> {
    if (!isSupabaseConfigured || import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        success: true,
        message: 'Bülten kaydınız tamamlandı.',
      };
    }

    if (!supabase) {
      throw new Error('Supabase client is not available in live mode.');
    }

    try {
      const { data, error } = await supabase.functions.invoke('subscribe-newsletter', {
        body: payload,
      });

      if (error) {
        throw new Error(error.message || 'Bülten kaydı oluşturulamadı.');
      }

      if (data && data.error) {
        throw new Error(data.error);
      }

      return {
        success: true,
        message: data?.message || 'Bülten kaydınız tamamlandı.',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bülten kaydı oluşturulamadı.';
      console.error('[contentRepository.subscribeNewsletter] Error:', msg);
      throw new Error(msg);
    }
  },
};
