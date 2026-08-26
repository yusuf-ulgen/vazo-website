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
  ContentPage,
  ContentSection,
  FaqGroup,
  FaqItem,
} from '../types';
import { supabase, isSupabaseConfigured, isStorefrontMockEnabled } from '@/shared/lib/supabase';
import {
  MegaMenuData,
  perakendeMegaMenuData,
  toptanMegaMenuData,
} from '@/shared/mocks/navigation';
import {
  mockAnnouncement,
  mockHero,
  mockSplitHero,
  mockEditorialSections,
  mockWholesaleBenefits,
  emptyMegaMenu,
  mockContentPages,
  mockFaqGroups,
  mockPrimaryNavGroups,
  mockFooterNavGroups,
} from './content-mocks';
import {
  contentSubmissions,
  TradeApplicationPayload,
  ContactMessagePayload,
  NewsletterSubscriptionPayload,
} from './content-submissions';

export type {
  WholesaleBenefit,
  MenuGroup,
  MenuItem,
  MenuType,
  ContentPage,
  ContentSection,
  FaqGroup,
  FaqItem,
  TradeApplicationPayload,
  ContactMessagePayload,
  NewsletterSubscriptionPayload,
};

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
        return mockPrimaryNavGroups;
      }
      if (menuType === 'footer') {
        return mockFooterNavGroups;
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

  async getContentPage(pageKey: string): Promise<ContentPage | null> {
    if (isStorefrontMockEnabled) {
      const mock = mockContentPages[pageKey];
      if (!mock) return null;
      return {
        id: mock.id,
        pageKey: mock.pageKey,
        title: mock.title,
        seoTitle: mock.seoTitle,
        seoDescription: mock.seoDescription,
        published: mock.published,
        sections: (mock.sections || []).map((s) => ({
          id: s.id,
          pageId: s.pageId,
          sectionKey: s.sectionKey,
          eyebrow: s.eyebrow,
          title: s.title,
          subtitle: s.subtitle,
          content: s.content,
          imageUrl: s.imageUrl,
          imagePosition: s.imagePosition,
          ctaText: s.ctaText,
          ctaUrl: s.ctaUrl,
          sortOrder: s.sortOrder,
          active: s.active,
        })),
      };
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured. Live mode requires valid Supabase environment variables.');
    }

    const { data, error } = await supabase
      .from('content_pages')
      .select(`
        *,
        content_sections (*)
      `)
      .eq('page_key', pageKey)
      .eq('published', true)
      .maybeSingle();

    if (error) {
      console.error(`[contentRepository.getContentPage:${pageKey}] Live error:`, error.message);
      throw new Error(`İçerik sayfası yüklenemedi: ${error.message}`);
    }

    if (!data) return null;

    return {
      id: data.id,
      pageKey: data.page_key,
      title: data.title,
      seoTitle: data.seo_title,
      seoDescription: data.seo_description,
      published: data.published,
      sections: (data.content_sections || [])
        .filter((s: { active: boolean }) => s.active)
        .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
        .map((s: {
          id: string;
          page_id: string;
          section_key: string;
          eyebrow: string | null;
          title: string;
          subtitle: string | null;
          content: string | null;
          image_url: string | null;
          image_position: string | null;
          cta_text: string | null;
          cta_url: string | null;
          sort_order: number;
          active: boolean;
        }) => ({
          id: s.id,
          pageId: s.page_id,
          sectionKey: s.section_key,
          eyebrow: s.eyebrow,
          title: s.title,
          subtitle: s.subtitle,
          content: s.content,
          imageUrl: s.image_url,
          imagePosition: s.image_position || 'left',
          ctaText: s.cta_text,
          ctaUrl: s.cta_url,
          sortOrder: s.sort_order,
          active: s.active,
        })),
    };
  },

  async getFaqGroups(): Promise<FaqGroup[]> {
    if (isStorefrontMockEnabled) {
      return mockFaqGroups;
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured. Live mode requires valid Supabase environment variables.');
    }

    const { data, error } = await supabase
      .from('faq_groups')
      .select(`
        *,
        faq_items (*)
      `)
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[contentRepository.getFaqGroups] Live error:', error.message);
      throw new Error(`Sıkça sorulan sorular yüklenemedi: ${error.message}`);
    }

    return (data || []).map((g) => ({
      id: g.id,
      title: g.title,
      sortOrder: g.sort_order,
      active: g.active,
      items: (g.faq_items || [])
        .filter((item: { active: boolean }) => item.active)
        .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
        .map((item: {
          id: string;
          group_id: string;
          question: string;
          answer: string;
          sort_order: number;
          active: boolean;
        }) => ({
          id: item.id,
          groupId: item.group_id,
          question: item.question,
          answer: item.answer,
          sortOrder: item.sort_order,
          active: item.active,
        })),
    }));
  },

  async getPolicyContent(policyType: 'privacy' | 'terms' | 'shipping'): Promise<ContentPage | null> {
    const keyMap: Record<'privacy' | 'terms' | 'shipping', string> = {
      privacy: 'privacy_kvkk',
      terms: 'terms',
      shipping: 'shipping_returns',
    };
    return this.getContentPage(keyMap[policyType]);
  },

  async submitTradeApplication(payload: TradeApplicationPayload): Promise<{ success: boolean; message: string }> {
    return contentSubmissions.submitTradeApplication(payload);
  },

  async submitContactMessage(payload: ContactMessagePayload): Promise<{ success: boolean; message: string }> {
    return contentSubmissions.submitContactMessage(payload);
  },

  async subscribeNewsletter(payload: NewsletterSubscriptionPayload): Promise<{ success: boolean; message: string }> {
    return contentSubmissions.subscribeNewsletter(payload);
  },
};
