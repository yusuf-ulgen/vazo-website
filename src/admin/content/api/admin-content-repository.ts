import { requireAdminSupabase } from '@/admin/shared/api/require-admin-supabase';
import type {
  AdminHeroSlide,
  CreateHeroSlideInput,
  UpdateHeroSlideInput,
  AdminWholesaleBenefit,
  CreateWholesaleBenefitInput,
  UpdateWholesaleBenefitInput,
} from '../types';

export const adminContentRepository = {
  // --------------------------------------------------------------------------
  // HERO SLIDES
  // --------------------------------------------------------------------------
  async getHeroSlides(): Promise<AdminHeroSlide[]> {
    const client = requireAdminSupabase();

    const { data, error } = await client
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
    const client = requireAdminSupabase();

    const { data, error } = await client
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
    const client = requireAdminSupabase();

    const { data, error } = await client
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
    const client = requireAdminSupabase();

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

    const { data, error } = await client
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
    const client = requireAdminSupabase();

    const { error } = await client.from('hero_slides').delete().eq('id', id);
    if (error) {
      console.error('[adminContentRepository.deleteHeroSlide] Error:', error.message);
      throw new Error(`Hero slayt silinemedi: ${error.message}`);
    }
  },

  // --------------------------------------------------------------------------
  // WHOLESALE BENEFITS
  // --------------------------------------------------------------------------
  async getWholesaleBenefits(): Promise<AdminWholesaleBenefit[]> {
    const client = requireAdminSupabase();

    const { data, error } = await client
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
    const client = requireAdminSupabase();

    const { data, error } = await client
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
    const client = requireAdminSupabase();

    const updatePayload: Record<string, unknown> = {};
    if (input.title !== undefined) updatePayload.title = input.title;
    if (input.description !== undefined) updatePayload.description = input.description;
    if (input.icon_name !== undefined) updatePayload.icon_name = input.icon_name;
    if (input.sort_order !== undefined) updatePayload.sort_order = input.sort_order;
    if (input.active !== undefined) updatePayload.active = input.active;

    const { data, error } = await client
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
    const client = requireAdminSupabase();

    const { error } = await client.from('wholesale_benefits').delete().eq('id', id);
    if (error) {
      console.error('[adminContentRepository.deleteWholesaleBenefit] Error:', error.message);
      throw new Error(`Ticari avantaj silinemedi: ${error.message}`);
    }
  },
};
