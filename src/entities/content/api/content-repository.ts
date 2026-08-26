import {
  AnnouncementBarConfig,
  HeroBannerConfig,
  EditorialSectionConfig,
  HeroSlide,
  SplitHeroConfig,
  WholesaleBenefit,
  MenuGroup,
  MenuItem,
  MenuType,
} from '../types';
import { supabase, isSupabaseConfigured, isStorefrontMockEnabled } from '@/shared/lib/supabase';
import {
  MegaMenuData,
  perakendeMegaMenuData,
  toptanMegaMenuData,
} from '@/shared/mocks/navigation';

export type { WholesaleBenefit, MenuGroup, MenuItem, MenuType };

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

import {
  mockAnnouncement,
  mockHero,
  mockSplitHero,
  mockEditorialSections,
  mockWholesaleBenefits,
  emptyMegaMenu,
} from './content-mocks';

export const contentRepository = {
  async getAnnouncement(): Promise<AnnouncementBarConfig | null> {
    if (isStorefrontMockEnabled) {
      return mockAnnouncement;
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured. Live mode requires valid Supabase environment variables.');
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
    if (isStorefrontMockEnabled) {
      return mockHero;
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured. Live mode requires valid Supabase environment variables.');
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

  async getSplitHero(): Promise<SplitHeroConfig> {
    if (isStorefrontMockEnabled) {
      return mockSplitHero;
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured. Live mode requires valid Supabase environment variables.');
    }

    const { data, error } = await supabase
      .from('hero_slides')
      .select('*')
      .eq('active', true)
      .in('slot', ['retail', 'wholesale'])
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[contentRepository.getSplitHero] Live Supabase error:', error.message);
      throw new Error(`Failed to fetch split hero from Supabase: ${error.message}`);
    }

    interface HeroSlideDbRow {
      id: string;
      eyebrow: string | null;
      title: string;
      subtitle: string | null;
      description: string;
      image_url: string;
      primary_cta_text: string;
      primary_cta_url: string;
      secondary_cta_text: string | null;
      secondary_cta_url: string | null;
      slot: 'retail' | 'wholesale' | 'general';
      sort_order: number;
      active: boolean;
    }

    const rows = (data || []) as unknown as HeroSlideDbRow[];
    const retailRow = rows.find((s) => s.slot === 'retail');
    const wholesaleRow = rows.find((s) => s.slot === 'wholesale');

    const mapRowToSlide = (row: HeroSlideDbRow | undefined): HeroSlide | null => {
      if (!row) return null;
      return {
        id: row.id,
        eyebrow: row.eyebrow,
        title: row.title,
        subtitle: row.subtitle,
        description: row.description,
        imageUrl: row.image_url,
        primaryCtaText: row.primary_cta_text,
        primaryCtaUrl: row.primary_cta_url,
        secondaryCtaText: row.secondary_cta_text,
        secondaryCtaUrl: row.secondary_cta_url,
        slot: row.slot || 'retail',
        sortOrder: row.sort_order,
        active: row.active,
      };
    };

    return {
      retail: mapRowToSlide(retailRow),
      wholesale: mapRowToSlide(wholesaleRow),
    };
  },

  async getEditorialSections(): Promise<EditorialSectionConfig[]> {
    if (isStorefrontMockEnabled) {
      return mockEditorialSections;
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured. Live mode requires valid Supabase environment variables.');
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
    if (isStorefrontMockEnabled) {
      return mockWholesaleBenefits;
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured. Live mode requires valid Supabase environment variables.');
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
    if (isStorefrontMockEnabled) {
      return menuType === 'retail_mega' ? perakendeMegaMenuData : toptanMegaMenuData;
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured. Live mode requires valid Supabase environment variables.');
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

  async getNavMenu(menuType: MenuType): Promise<MenuGroup[]> {
    if (isStorefrontMockEnabled) {
      if (menuType === 'primary') {
        return [
          {
            id: 'mock-primary-group',
            menuType: 'primary',
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
      }
      if (menuType === 'footer') {
        return [
          {
            id: 'mock-f1',
            menuType: 'footer',
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
            menuType: 'footer',
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
            menuType: 'footer',
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
      }
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured. Live mode requires valid Supabase environment variables.');
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
      console.error(`[contentRepository.getNavMenu:${menuType}] Live Supabase error:`, error.message);
      throw new Error(`Failed to fetch navigation menu from Supabase: ${error.message}`);
    }

    return (data || []).map((g) => ({
      id: g.id,
      menuType: g.menu_type,
      title: g.title,
      promoTitle: g.promo_title,
      promoSubtitle: g.promo_subtitle,
      promoImageUrl: g.promo_image_url,
      promoCtaText: g.promo_cta_text,
      promoCtaUrl: g.promo_cta_url,
      sortOrder: g.sort_order,
      active: g.active,
      items: (g.menu_items || [])
        .filter((item: { active: boolean }) => item.active)
        .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
        .map((item: { id: string; group_id: string; label: string; href: string; is_new: boolean; is_popular: boolean; sort_order: number; active: boolean }) => ({
          id: item.id,
          groupId: item.group_id,
          label: item.label,
          href: item.href,
          isNew: item.is_new,
          isPopular: item.is_popular,
          sortOrder: item.sort_order,
          active: item.active,
        })),
    }));
  },

  async submitTradeApplication(payload: TradeApplicationPayload): Promise<{ success: boolean; message: string }> {
    if (isStorefrontMockEnabled) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        success: true,
        message: 'Toptan başvurunuz başarıyla alındı. Müşteri temsilcimiz en kısa sürede sizinle iletişime geçecektir.',
      };
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured. Live mode requires valid Supabase environment variables.');
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
    if (isStorefrontMockEnabled) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        success: true,
        message: 'Mesajınız stüdyo ekibimize iletilmiştir.',
      };
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured. Live mode requires valid Supabase environment variables.');
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
    if (isStorefrontMockEnabled) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        success: true,
        message: 'Bülten kaydınız tamamlandı.',
      };
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured. Live mode requires valid Supabase environment variables.');
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
