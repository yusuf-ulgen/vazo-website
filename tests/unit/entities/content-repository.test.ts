import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contentRepository } from '@/entities/content/api/content-repository';
import * as supabaseModule from '@/shared/lib/supabase';
import { createMockSupabaseClient } from 'tests/mocks/supabase-mock';

describe('contentRepository', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Mock Mode Methods', () => {
    it('returns mock announcement bar content', async () => {
      const announcement = await contentRepository.getAnnouncement();
      expect(announcement).not.toBeNull();
      expect(announcement?.message).toBeDefined();
    });

    it('returns mock hero content', async () => {
      const hero = await contentRepository.getHero();
      expect(hero).not.toBeNull();
      expect(hero?.title).toBeDefined();
      expect(hero?.primaryCtaText).toBeDefined();
    });

    it('returns mock split hero content', async () => {
      const splitHero = await contentRepository.getSplitHero();
      expect(splitHero.retail).not.toBeNull();
      expect(splitHero.retail?.title).toBe('Perakende');
      expect(splitHero.wholesale).not.toBeNull();
      expect(splitHero.wholesale?.title).toBe('Toptan');
    });

    it('returns mock editorial sections sorted by order', async () => {
      const sections = await contentRepository.getEditorialSections();
      expect(sections.length).toBeGreaterThan(0);
    });

    it('returns mock wholesale benefits', async () => {
      const benefits = await contentRepository.getWholesaleBenefits();
      expect(benefits.length).toBeGreaterThan(0);
    });

    it('returns mock mega menu for retail and wholesale keys', async () => {
      const retailMenu = await contentRepository.getMegaMenu('retail_mega');
      expect(retailMenu.groups.length).toBeGreaterThan(0);

      const wholesaleMenu = await contentRepository.getMegaMenu('wholesale_mega');
      expect(wholesaleMenu.groups.length).toBeGreaterThan(0);
    });
  });

  describe('Live Supabase Mode Content Queries', () => {
    it('throws error when live mode is requested without Supabase configuration (NO silent mock fallback)', async () => {
      vi.spyOn(supabaseModule, 'isStorefrontMockEnabled', 'get').mockReturnValue(false);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(false);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(null);

      await expect(contentRepository.getAnnouncement()).rejects.toThrow(
        'Supabase client is not configured. Live mode requires valid Supabase environment variables.'
      );
      await expect(contentRepository.getHero()).rejects.toThrow(
        'Supabase client is not configured. Live mode requires valid Supabase environment variables.'
      );
      await expect(contentRepository.getSplitHero()).rejects.toThrow(
        'Supabase client is not configured. Live mode requires valid Supabase environment variables.'
      );
      await expect(contentRepository.getEditorialSections()).rejects.toThrow(
        'Supabase client is not configured. Live mode requires valid Supabase environment variables.'
      );
      await expect(contentRepository.getWholesaleBenefits()).rejects.toThrow(
        'Supabase client is not configured. Live mode requires valid Supabase environment variables.'
      );
      await expect(contentRepository.getMegaMenu('retail_mega')).rejects.toThrow(
        'Supabase client is not configured. Live mode requires valid Supabase environment variables.'
      );
    });

    it('maps announcement from live database', async () => {
      const mockAnnouncementRow = {
        id: 'ann-1',
        active: true,
        message: 'Live Duyuru',
        link_text: 'Toptan',
        link_url: '/wholesale',
        sort_order: 1,
      };

      const mockClient = createMockSupabaseClient({
        announcement_bars: { data: mockAnnouncementRow, error: null },
      });

      vi.spyOn(supabaseModule, 'isStorefrontMockEnabled', 'get').mockReturnValue(false);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      const announcement = await contentRepository.getAnnouncement();
      expect(announcement?.message).toBe('Live Duyuru');
    });

    it('returns null when announcement query has zero rows in live mode', async () => {
      const mockClient = createMockSupabaseClient({
        announcement_bars: { data: null, error: null },
      });

      vi.spyOn(supabaseModule, 'isStorefrontMockEnabled', 'get').mockReturnValue(false);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      const announcement = await contentRepository.getAnnouncement();
      expect(announcement).toBeNull();
    });

    it('throws error when live database query fails (NO silent mock fallback)', async () => {
      const mockClient = createMockSupabaseClient({
        announcement_bars: { data: null, error: { message: 'Database query failed' } },
      });

      vi.spyOn(supabaseModule, 'isStorefrontMockEnabled', 'get').mockReturnValue(false);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      await expect(contentRepository.getAnnouncement()).rejects.toThrow('Failed to fetch announcement from Supabase');
    });

    it('maps hero content from hero_slides', async () => {
      const mockHeroRow = {
        id: 'hero-1',
        title: 'Live Hero',
        subtitle: 'Live Alt Başlık',
        description: 'Live Açıklama',
        image_url: 'https://example.com/hero.jpg',
        primary_cta_text: 'Keşfet',
        primary_cta_url: '/products',
        secondary_cta_text: 'Toptan',
        secondary_cta_url: '/wholesale',
        active: true,
      };

      const mockClient = createMockSupabaseClient({
        hero_slides: { data: mockHeroRow, error: null },
      });

      vi.spyOn(supabaseModule, 'isStorefrontMockEnabled', 'get').mockReturnValue(false);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      const hero = await contentRepository.getHero();
      expect(hero?.title).toBe('Live Hero');
    });

    it('maps split hero for retail and wholesale slots in live mode', async () => {
      const mockHeroRows = [
        {
          id: 'hero-ret',
          eyebrow: 'BİREYSEL',
          title: 'Perakende Canlı',
          description: 'Açıklama',
          image_url: 'https://example.com/ret.jpg',
          primary_cta_text: 'Başla',
          primary_cta_url: '/products',
          slot: 'retail',
          sort_order: 1,
          active: true,
        },
        {
          id: 'hero-who',
          eyebrow: 'PROFESYONEL',
          title: 'Toptan Canlı',
          description: 'Açıklama',
          image_url: 'https://example.com/who.jpg',
          primary_cta_text: 'Toptan Geç',
          primary_cta_url: '/wholesale',
          slot: 'wholesale',
          sort_order: 2,
          active: true,
        },
      ];

      const mockClient = createMockSupabaseClient({
        hero_slides: { data: mockHeroRows, error: null },
      });

      vi.spyOn(supabaseModule, 'isStorefrontMockEnabled', 'get').mockReturnValue(false);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      const split = await contentRepository.getSplitHero();
      expect(split.retail?.title).toBe('Perakende Canlı');
      expect(split.wholesale?.title).toBe('Toptan Canlı');
    });

    it('throws error when live split hero query fails (NO silent mock fallback)', async () => {
      const mockClient = createMockSupabaseClient({
        hero_slides: { data: null, error: { message: 'Hero fetch error' } },
      });

      vi.spyOn(supabaseModule, 'isStorefrontMockEnabled', 'get').mockReturnValue(false);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      await expect(contentRepository.getSplitHero()).rejects.toThrow(
        'Failed to fetch split hero from Supabase'
      );
    });

    it('maps editorial sections from editorial_sections', async () => {
      const mockSection = {
        id: 'ed-1',
        eyebrow: 'Zanaat',
        title: 'Heykel',
        description: 'Açıklama',
        image_url: 'https://example.com/ed.jpg',
        image_position: 'left',
        cta_text: 'İncele',
        cta_url: '/about',
        active: true,
        sort_order: 1,
      };

      const mockClient = createMockSupabaseClient({
        editorial_sections: { data: [mockSection], error: null },
      });

      vi.spyOn(supabaseModule, 'isStorefrontMockEnabled', 'get').mockReturnValue(false);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      const sections = await contentRepository.getEditorialSections();
      expect(sections.length).toBe(1);
      expect(sections[0]?.title).toBe('Heykel');
    });

    it('maps wholesale benefits from wholesale_benefits', async () => {
      const mockBenefit = {
        id: 'ben-1',
        icon_name: 'Tag',
        title: 'Toptan İskonto',
        description: 'Hacimli indirimler',
        active: true,
        sort_order: 1,
      };

      const mockClient = createMockSupabaseClient({
        wholesale_benefits: { data: [mockBenefit], error: null },
      });

      vi.spyOn(supabaseModule, 'isStorefrontMockEnabled', 'get').mockReturnValue(false);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      const benefits = await contentRepository.getWholesaleBenefits();
      expect(benefits.length).toBe(1);
      expect(benefits[0]?.title).toBe('Toptan İskonto');
    });

    it('maps mega menus from menu_groups', async () => {
      const mockGroup = {
        id: 'g-1',
        title: 'Kategoriler',
        column_order: 1,
        promo_title: 'Özel Seri',
        promo_subtitle: 'İnceleyin',
        promo_image_url: 'https://example.com/promo.jpg',
        promo_cta_text: 'Göz At',
        promo_cta_url: '/products',
        menu_items: [{ id: 'i-1', label: 'Vazolar', href: '/products', sort_order: 1, active: true }],
      };

      const mockClient = createMockSupabaseClient({
        menu_groups: { data: [mockGroup], error: null },
      });

      vi.spyOn(supabaseModule, 'isStorefrontMockEnabled', 'get').mockReturnValue(false);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      const mega = await contentRepository.getMegaMenu('retail_mega');
      expect(mega.groups.length).toBe(1);
      expect(mega.groups[0]?.title).toBe('Kategoriler');
      expect(mega.promo?.title).toBe('Özel Seri');
    });
  });
});
