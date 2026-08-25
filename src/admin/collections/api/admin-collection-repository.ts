import { supabase, isSupabaseConfigured } from '@/shared/lib/supabase';
import {
  AdminCollection,
  CreateCollectionInput,
  UpdateCollectionInput,
  CollectionFilterParams,
} from '../types';
import { generateSlug, validateSlug } from '@/admin/categories/api/admin-category-repository';

function getClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase client is not configured. Admin operations require active Supabase connection.');
  }
  return supabase;
}

export const adminCollectionRepository = {
  async getAllCollections(params?: CollectionFilterParams): Promise<AdminCollection[]> {
    const client = getClient();
    let query = client.from('collections').select('*').order('sort_order', { ascending: true });

    if (params?.active !== undefined && params.active !== 'all') {
      query = query.eq('active', params.active);
    }

    if (params?.featured !== undefined && params.featured !== 'all') {
      query = query.eq('featured', params.featured);
    }

    if (params?.search && params.search.trim()) {
      const term = params.search.trim();
      query = query.or(`name.ilike.%${term}%,slug.ilike.%${term}%,subtitle.ilike.%${term}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[adminCollectionRepository.getAllCollections] Error:', error);
      throw new Error(`Koleksiyonlar yüklenirken hata oluştu: ${error.message}`);
    }

    return (data || []) as AdminCollection[];
  },

  async getCollectionById(id: string): Promise<AdminCollection | null> {
    const client = getClient();
    const { data, error } = await client.from('collections').select('*').eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Koleksiyon yüklenemedi: ${error.message}`);
    }

    return data as AdminCollection;
  },

  async createCollection(input: CreateCollectionInput): Promise<AdminCollection> {
    const name = input.name.trim();
    if (!name) {
      throw new Error('Koleksiyon adı zorunludur.');
    }

    const slug = (input.slug || generateSlug(name)).trim().toLowerCase();
    if (!validateSlug(slug)) {
      throw new Error('Geçersiz URL formatı (slug). Sadece küçük harfler, rakamlar ve tire (-) kullanılabilir.');
    }

    const client = getClient();

    const payload = {
      name,
      slug,
      subtitle: input.subtitle?.trim() || null,
      description: input.description?.trim() || null,
      story_markdown: input.story_markdown?.trim() || null,
      hero_image_url: input.hero_image_url?.trim() || null,
      active: input.active !== undefined ? input.active : true,
      featured: input.featured !== undefined ? input.featured : false,
      sort_order: input.sort_order ?? 0,
      seo_title: input.seo_title?.trim() || null,
      seo_description: input.seo_description?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client.from('collections').insert(payload).select().single();

    if (error) {
      if (error.code === '23505') {
        throw new Error(`"${slug}" slug adresine sahip bir koleksiyon zaten mevcut. Lütfen farklı bir slug belirleyin.`);
      }
      throw new Error(`Koleksiyon oluşturulamadı: ${error.message}`);
    }

    return data as AdminCollection;
  },

  async updateCollection(id: string, input: UpdateCollectionInput): Promise<AdminCollection> {
    if (input.name !== undefined && !input.name.trim()) {
      throw new Error('Koleksiyon adı zorunludur.');
    }

    if (input.slug !== undefined) {
      const slug = input.slug.trim().toLowerCase();
      if (!validateSlug(slug)) {
        throw new Error('Geçersiz URL formatı (slug). Sadece küçük harfler, rakamlar ve tire (-) kullanılabilir.');
      }
    }

    const client = getClient();

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) payload.name = input.name.trim();
    if (input.slug !== undefined) payload.slug = input.slug.trim().toLowerCase();
    if (input.subtitle !== undefined) payload.subtitle = input.subtitle?.trim() || null;
    if (input.description !== undefined) payload.description = input.description?.trim() || null;
    if (input.story_markdown !== undefined) payload.story_markdown = input.story_markdown?.trim() || null;
    if (input.hero_image_url !== undefined) payload.hero_image_url = input.hero_image_url?.trim() || null;
    if (input.active !== undefined) payload.active = input.active;
    if (input.featured !== undefined) payload.featured = input.featured;
    if (input.sort_order !== undefined) payload.sort_order = input.sort_order;
    if (input.seo_title !== undefined) payload.seo_title = input.seo_title?.trim() || null;
    if (input.seo_description !== undefined) payload.seo_description = input.seo_description?.trim() || null;

    const { data, error } = await client.from('collections').update(payload).eq('id', id).select().single();

    if (error) {
      if (error.code === '23505') {
        throw new Error(`Bu slug adresi başka bir koleksiyon tarafından kullanılıyor.`);
      }
      throw new Error(`Koleksiyon güncellenemedi: ${error.message}`);
    }

    return data as AdminCollection;
  },

  async toggleCollectionActive(id: string, active: boolean): Promise<AdminCollection> {
    return this.updateCollection(id, { active });
  },

  async toggleCollectionFeatured(id: string, featured: boolean): Promise<AdminCollection> {
    return this.updateCollection(id, { featured });
  },

  async deleteCollection(id: string): Promise<void> {
    const client = getClient();
    const { error } = await client.from('collections').delete().eq('id', id);

    if (error) {
      throw new Error(`Koleksiyon silinemedi: ${error.message}`);
    }
  },
};
