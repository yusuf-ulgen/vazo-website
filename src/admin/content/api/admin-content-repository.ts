import { supabase, isSupabaseConfigured } from '@/shared/lib/supabase';
import type {
  AdminHeroSlide,
  CreateHeroSlideInput,
  UpdateHeroSlideInput,
  AdminWholesaleBenefit,
  CreateWholesaleBenefitInput,
  UpdateWholesaleBenefitInput,
} from '../types';

let mockAdminHeroSlides: AdminHeroSlide[] = [
  {
    id: 'h0000000-0000-0000-0000-000000000001',
    eyebrow: 'BİREYSEL ALIŞVERİŞ',
    title: 'Perakende',
    subtitle: null,
    description: 'Evinize estetik dokunuşlar katacak vazo koleksiyonlarımızı keşfedin.',
    image_url: '/images/hero-retail.jpg',
    primary_cta_text: 'Alışverişe Başla',
    primary_cta_url: '/products',
    secondary_cta_text: null,
    secondary_cta_url: null,
    slot: 'retail',
    active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'h0000000-0000-0000-0000-000000000002',
    eyebrow: 'PROFESYONEL ALIŞVERİŞ',
    title: 'Toptan',
    subtitle: null,
    description: 'Projeleriniz için özel fiyatlar, geniş ürün seçeneği ve profesyonel destek alın.',
    image_url: '/images/hero-wholesale.jpg',
    primary_cta_text: 'Toptan Alışverişe Geç',
    primary_cta_url: '/wholesale',
    secondary_cta_text: null,
    secondary_cta_url: null,
    slot: 'wholesale',
    active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
];

let mockAdminBenefits: AdminWholesaleBenefit[] = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    title: 'Özel Toptan Fiyatlar',
    description: 'Hacminize özel avantajlı fiyatlandırma.',
    icon_name: 'Tag',
    sort_order: 1,
    active: true,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    title: 'Geniş Ürün Yelpazesi',
    description: 'Farklı koleksiyon ve boyut seçenekleri.',
    icon_name: 'Boxes',
    sort_order: 2,
    active: true,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    title: 'Kaliteli & Dayanıklı Ürünler',
    description: 'Uzun ömürlü, estetik ve premium üretim.',
    icon_name: 'Award',
    sort_order: 3,
    active: true,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000004',
    title: 'Hızlı & Güvenli Teslimat',
    description: 'Zamanında teslimat ve özenli paketleme.',
    icon_name: 'Truck',
    sort_order: 4,
    active: true,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000005',
    title: 'Profesyonel Destek',
    description: 'Sipariş öncesi ve sonrası uzman desteği.',
    icon_name: 'Headphones',
    sort_order: 5,
    active: true,
  },
];

export const adminContentRepository = {
  // --------------------------------------------------------------------------
  // HERO SLIDES
  // --------------------------------------------------------------------------
  async getHeroSlides(): Promise<AdminHeroSlide[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [...mockAdminHeroSlides].sort((a, b) => a.sort_order - b.sort_order);
    }

    const { data, error } = await supabase
      .from('hero_slides')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[adminContentRepository.getHeroSlides] Error:', error.message);
      throw new Error(`Hero slaytları yüklenemedi: ${error.message}`);
    }

    return (data || []) as AdminHeroSlide[];
  },

  async getHeroSlideById(id: string): Promise<AdminHeroSlide | null> {
    if (!isSupabaseConfigured || !supabase) {
      return mockAdminHeroSlides.find((s) => s.id === id) || null;
    }

    const { data, error } = await supabase
      .from('hero_slides')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[adminContentRepository.getHeroSlideById] Error:', error.message);
      throw new Error(`Hero slayt getirilemedi: ${error.message}`);
    }

    return data as AdminHeroSlide | null;
  },

  async createHeroSlide(input: CreateHeroSlideInput): Promise<AdminHeroSlide> {
    if (!isSupabaseConfigured || !supabase) {
      const newSlide: AdminHeroSlide = {
        id: `h-mock-${Date.now()}`,
        eyebrow: input.eyebrow ?? null,
        title: input.title,
        subtitle: input.subtitle ?? null,
        description: input.description,
        image_url: input.image_url,
        primary_cta_text: input.primary_cta_text,
        primary_cta_url: input.primary_cta_url,
        secondary_cta_text: input.secondary_cta_text ?? null,
        secondary_cta_url: input.secondary_cta_url ?? null,
        slot: input.slot ?? 'retail',
        active: input.active ?? true,
        sort_order: input.sort_order ?? mockAdminHeroSlides.length + 1,
        created_at: new Date().toISOString(),
      };
      mockAdminHeroSlides.push(newSlide);
      return newSlide;
    }

    const { data, error } = await supabase
      .from('hero_slides')
      .insert({
        eyebrow: input.eyebrow ?? null,
        title: input.title,
        subtitle: input.subtitle ?? null,
        description: input.description,
        image_url: input.image_url,
        primary_cta_text: input.primary_cta_text,
        primary_cta_url: input.primary_cta_url,
        secondary_cta_text: input.secondary_cta_text ?? null,
        secondary_cta_url: input.secondary_cta_url ?? null,
        slot: input.slot ?? 'retail',
        active: input.active ?? true,
        sort_order: input.sort_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      console.error('[adminContentRepository.createHeroSlide] Error:', error.message);
      throw new Error(`Hero slayt oluşturulamadı: ${error.message}`);
    }

    return data as AdminHeroSlide;
  },

  async updateHeroSlide(id: string, input: UpdateHeroSlideInput): Promise<AdminHeroSlide> {
    if (!isSupabaseConfigured || !supabase) {
      const existing = mockAdminHeroSlides.find((s) => s.id === id);
      if (!existing) throw new Error('Hero slide not found');
      const updatedSlide: AdminHeroSlide = {
        id: existing.id,
        eyebrow: input.eyebrow !== undefined ? input.eyebrow : existing.eyebrow,
        title: input.title !== undefined ? input.title : existing.title,
        subtitle: input.subtitle !== undefined ? input.subtitle : existing.subtitle,
        description: input.description !== undefined ? input.description : existing.description,
        image_url: input.image_url !== undefined ? input.image_url : existing.image_url,
        primary_cta_text: input.primary_cta_text !== undefined ? input.primary_cta_text : existing.primary_cta_text,
        primary_cta_url: input.primary_cta_url !== undefined ? input.primary_cta_url : existing.primary_cta_url,
        secondary_cta_text: input.secondary_cta_text !== undefined ? input.secondary_cta_text : existing.secondary_cta_text,
        secondary_cta_url: input.secondary_cta_url !== undefined ? input.secondary_cta_url : existing.secondary_cta_url,
        slot: input.slot !== undefined ? input.slot : existing.slot,
        active: input.active !== undefined ? input.active : existing.active,
        sort_order: input.sort_order !== undefined ? input.sort_order : existing.sort_order,
        created_at: existing.created_at,
      };
      const idx = mockAdminHeroSlides.findIndex((s) => s.id === id);
      mockAdminHeroSlides[idx] = updatedSlide;
      return updatedSlide;
    }

    const updatePayload: Record<string, unknown> = {};
    if (input.eyebrow !== undefined) updatePayload.eyebrow = input.eyebrow;
    if (input.title !== undefined) updatePayload.title = input.title;
    if (input.subtitle !== undefined) updatePayload.subtitle = input.subtitle;
    if (input.description !== undefined) updatePayload.description = input.description;
    if (input.image_url !== undefined) updatePayload.image_url = input.image_url;
    if (input.primary_cta_text !== undefined) updatePayload.primary_cta_text = input.primary_cta_text;
    if (input.primary_cta_url !== undefined) updatePayload.primary_cta_url = input.primary_cta_url;
    if (input.secondary_cta_text !== undefined) updatePayload.secondary_cta_text = input.secondary_cta_text;
    if (input.secondary_cta_url !== undefined) updatePayload.secondary_cta_url = input.secondary_cta_url;
    if (input.slot !== undefined) updatePayload.slot = input.slot;
    if (input.active !== undefined) updatePayload.active = input.active;
    if (input.sort_order !== undefined) updatePayload.sort_order = input.sort_order;

    const { data, error } = await supabase
      .from('hero_slides')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[adminContentRepository.updateHeroSlide] Error:', error.message);
      throw new Error(`Hero slayt güncellenemedi: ${error.message}`);
    }

    return data as AdminHeroSlide;
  },

  async deleteHeroSlide(id: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      mockAdminHeroSlides = mockAdminHeroSlides.filter((s) => s.id !== id);
      return;
    }

    const { error } = await supabase.from('hero_slides').delete().eq('id', id);
    if (error) {
      console.error('[adminContentRepository.deleteHeroSlide] Error:', error.message);
      throw new Error(`Hero slayt silinemedi: ${error.message}`);
    }
  },

  // --------------------------------------------------------------------------
  // WHOLESALE BENEFITS
  // --------------------------------------------------------------------------
  async getWholesaleBenefits(): Promise<AdminWholesaleBenefit[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [...mockAdminBenefits].sort((a, b) => a.sort_order - b.sort_order);
    }

    const { data, error } = await supabase
      .from('wholesale_benefits')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[adminContentRepository.getWholesaleBenefits] Error:', error.message);
      throw new Error(`Ticari avantajlar yüklenemedi: ${error.message}`);
    }

    return (data || []) as AdminWholesaleBenefit[];
  },

  async createWholesaleBenefit(input: CreateWholesaleBenefitInput): Promise<AdminWholesaleBenefit> {
    if (!isSupabaseConfigured || !supabase) {
      const newBenefit: AdminWholesaleBenefit = {
        id: `b-mock-${Date.now()}`,
        title: input.title,
        description: input.description,
        icon_name: input.icon_name,
        sort_order: input.sort_order ?? mockAdminBenefits.length + 1,
        active: input.active ?? true,
      };
      mockAdminBenefits.push(newBenefit);
      return newBenefit;
    }

    const { data, error } = await supabase
      .from('wholesale_benefits')
      .insert({
        title: input.title,
        description: input.description,
        icon_name: input.icon_name,
        sort_order: input.sort_order ?? 0,
        active: input.active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('[adminContentRepository.createWholesaleBenefit] Error:', error.message);
      throw new Error(`Ticari avantaj oluşturulamadı: ${error.message}`);
    }

    return data as AdminWholesaleBenefit;
  },

  async updateWholesaleBenefit(id: string, input: UpdateWholesaleBenefitInput): Promise<AdminWholesaleBenefit> {
    if (!isSupabaseConfigured || !supabase) {
      const existing = mockAdminBenefits.find((b) => b.id === id);
      if (!existing) throw new Error('Benefit not found');
      const updatedBenefit: AdminWholesaleBenefit = {
        id: existing.id,
        title: input.title !== undefined ? input.title : existing.title,
        description: input.description !== undefined ? input.description : existing.description,
        icon_name: input.icon_name !== undefined ? input.icon_name : existing.icon_name,
        sort_order: input.sort_order !== undefined ? input.sort_order : existing.sort_order,
        active: input.active !== undefined ? input.active : existing.active,
      };
      const idx = mockAdminBenefits.findIndex((b) => b.id === id);
      mockAdminBenefits[idx] = updatedBenefit;
      return updatedBenefit;
    }

    const updatePayload: Record<string, unknown> = {};
    if (input.title !== undefined) updatePayload.title = input.title;
    if (input.description !== undefined) updatePayload.description = input.description;
    if (input.icon_name !== undefined) updatePayload.icon_name = input.icon_name;
    if (input.sort_order !== undefined) updatePayload.sort_order = input.sort_order;
    if (input.active !== undefined) updatePayload.active = input.active;

    const { data, error } = await supabase
      .from('wholesale_benefits')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[adminContentRepository.updateWholesaleBenefit] Error:', error.message);
      throw new Error(`Ticari avantaj güncellenemedi: ${error.message}`);
    }

    return data as AdminWholesaleBenefit;
  },

  async deleteWholesaleBenefit(id: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      mockAdminBenefits = mockAdminBenefits.filter((b) => b.id !== id);
      return;
    }

    const { error } = await supabase.from('wholesale_benefits').delete().eq('id', id);
    if (error) {
      console.error('[adminContentRepository.deleteWholesaleBenefit] Error:', error.message);
      throw new Error(`Ticari avantaj silinemedi: ${error.message}`);
    }
  },
};
