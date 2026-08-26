import { requireAdminSupabase } from '@/admin/shared/api/require-admin-supabase';
import type {
  AdminContentPageItem,
  AdminContentSection,
  CreateContentPageInput,
  UpdateContentPageInput,
  CreateContentSectionInput,
  UpdateContentSectionInput,
} from '../types';

export const adminContentPagesRepository = {
  async getContentPages(): Promise<AdminContentPageItem[]> {
    const client = requireAdminSupabase();

    const { data, error } = await client
      .from('content_pages')
      .select(`
        *,
        content_sections (*)
      `)
      .order('title', { ascending: true });

    if (error) {
      console.error('[adminContentPagesRepository.getContentPages] Error:', error.message);
      throw new Error(`İçerik sayfaları yüklenemedi: ${error.message}`);
    }

    return (data || []).map((p) => ({
      id: p.id,
      page_key: p.page_key,
      title: p.title,
      seo_title: p.seo_title,
      seo_description: p.seo_description,
      published: p.published,
      created_at: p.created_at,
      updated_at: p.updated_at,
      sections: (p.content_sections || [])
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
          page_id: s.page_id,
          section_key: s.section_key,
          eyebrow: s.eyebrow,
          title: s.title,
          subtitle: s.subtitle,
          content: s.content,
          image_url: s.image_url,
          image_position: s.image_position || 'left',
          cta_text: s.cta_text,
          cta_url: s.cta_url,
          sort_order: s.sort_order,
          active: s.active,
        })),
    }));
  },

  async getContentPageById(id: string): Promise<AdminContentPageItem | null> {
    const client = requireAdminSupabase();

    const { data, error } = await client
      .from('content_pages')
      .select(`
        *,
        content_sections (*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[adminContentPagesRepository.getContentPageById] Error:', error.message);
      throw new Error(`Sayfa yüklenemedi: ${error.message}`);
    }

    if (!data) return null;

    return {
      id: data.id,
      page_key: data.page_key,
      title: data.title,
      seo_title: data.seo_title,
      seo_description: data.seo_description,
      published: data.published,
      created_at: data.created_at,
      updated_at: data.updated_at,
      sections: (data.content_sections || [])
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
          page_id: s.page_id,
          section_key: s.section_key,
          eyebrow: s.eyebrow,
          title: s.title,
          subtitle: s.subtitle,
          content: s.content,
          image_url: s.image_url,
          image_position: s.image_position || 'left',
          cta_text: s.cta_text,
          cta_url: s.cta_url,
          sort_order: s.sort_order,
          active: s.active,
        })),
    };
  },

  async createContentPage(input: CreateContentPageInput): Promise<AdminContentPageItem> {
    const client = requireAdminSupabase();

    const { data, error } = await client
      .from('content_pages')
      .insert([
        {
          page_key: input.page_key,
          title: input.title,
          seo_title: input.seo_title || null,
          seo_description: input.seo_description || null,
          published: input.published ?? true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[adminContentPagesRepository.createContentPage] Error:', error.message);
      throw new Error(`İçerik sayfası oluşturulamadı: ${error.message}`);
    }

    return {
      id: data.id,
      page_key: data.page_key,
      title: data.title,
      seo_title: data.seo_title,
      seo_description: data.seo_description,
      published: data.published,
      created_at: data.created_at,
      updated_at: data.updated_at,
      sections: [],
    };
  },

  async updateContentPage(id: string, input: UpdateContentPageInput): Promise<AdminContentPageItem> {
    const client = requireAdminSupabase();

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.page_key !== undefined) payload.page_key = input.page_key;
    if (input.title !== undefined) payload.title = input.title;
    if (input.seo_title !== undefined) payload.seo_title = input.seo_title;
    if (input.seo_description !== undefined) payload.seo_description = input.seo_description;
    if (input.published !== undefined) payload.published = input.published;

    const { data, error } = await client
      .from('content_pages')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[adminContentPagesRepository.updateContentPage] Error:', error.message);
      throw new Error(`Sayfa güncellenemedi: ${error.message}`);
    }

    return {
      id: data.id,
      page_key: data.page_key,
      title: data.title,
      seo_title: data.seo_title,
      seo_description: data.seo_description,
      published: data.published,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  },

  async deleteContentPage(id: string): Promise<void> {
    const client = requireAdminSupabase();

    const { error } = await client.from('content_pages').delete().eq('id', id);
    if (error) {
      console.error('[adminContentPagesRepository.deleteContentPage] Error:', error.message);
      throw new Error(`Sayfa silinemedi: ${error.message}`);
    }
  },

  async createContentSection(input: CreateContentSectionInput): Promise<AdminContentSection> {
    const client = requireAdminSupabase();

    const { data, error } = await client
      .from('content_sections')
      .insert([
        {
          page_id: input.page_id,
          section_key: input.section_key,
          eyebrow: input.eyebrow || null,
          title: input.title,
          subtitle: input.subtitle || null,
          content: input.content || null,
          image_url: input.image_url || null,
          image_position: input.image_position || 'left',
          cta_text: input.cta_text || null,
          cta_url: input.cta_url || null,
          sort_order: input.sort_order ?? 0,
          active: input.active ?? true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[adminContentPagesRepository.createContentSection] Error:', error.message);
      throw new Error(`Bölüm oluşturulamadı: ${error.message}`);
    }

    return {
      id: data.id,
      page_id: data.page_id,
      section_key: data.section_key,
      eyebrow: data.eyebrow,
      title: data.title,
      subtitle: data.subtitle,
      content: data.content,
      image_url: data.image_url,
      image_position: data.image_position || 'left',
      cta_text: data.cta_text,
      cta_url: data.cta_url,
      sort_order: data.sort_order,
      active: data.active,
    };
  },

  async updateContentSection(id: string, input: UpdateContentSectionInput): Promise<AdminContentSection> {
    const client = requireAdminSupabase();

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.section_key !== undefined) payload.section_key = input.section_key;
    if (input.eyebrow !== undefined) payload.eyebrow = input.eyebrow;
    if (input.title !== undefined) payload.title = input.title;
    if (input.subtitle !== undefined) payload.subtitle = input.subtitle;
    if (input.content !== undefined) payload.content = input.content;
    if (input.image_url !== undefined) payload.image_url = input.image_url;
    if (input.image_position !== undefined) payload.image_position = input.image_position;
    if (input.cta_text !== undefined) payload.cta_text = input.cta_text;
    if (input.cta_url !== undefined) payload.cta_url = input.cta_url;
    if (input.sort_order !== undefined) payload.sort_order = input.sort_order;
    if (input.active !== undefined) payload.active = input.active;

    const { data, error } = await client
      .from('content_sections')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[adminContentPagesRepository.updateContentSection] Error:', error.message);
      throw new Error(`Bölüm güncellenemedi: ${error.message}`);
    }

    return {
      id: data.id,
      page_id: data.page_id,
      section_key: data.section_key,
      eyebrow: data.eyebrow,
      title: data.title,
      subtitle: data.subtitle,
      content: data.content,
      image_url: data.image_url,
      image_position: data.image_position || 'left',
      cta_text: data.cta_text,
      cta_url: data.cta_url,
      sort_order: data.sort_order,
      active: data.active,
    };
  },

  async deleteContentSection(id: string): Promise<void> {
    const client = requireAdminSupabase();

    const { error } = await client.from('content_sections').delete().eq('id', id);
    if (error) {
      console.error('[adminContentPagesRepository.deleteContentSection] Error:', error.message);
      throw new Error(`Bölüm silinemedi: ${error.message}`);
    }
  },

  async reorderContentSections(orders: { id: string; sort_order: number }[]): Promise<void> {
    const client = requireAdminSupabase();

    await Promise.all(
      orders.map(({ id, sort_order }) =>
        client.from('content_sections').update({ sort_order }).eq('id', id)
      )
    );
  },
};
