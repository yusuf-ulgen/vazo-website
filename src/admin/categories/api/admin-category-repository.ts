import { supabase, isSupabaseConfigured } from '@/shared/lib/supabase';
import {
  AdminCategory,
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryFilterParams,
} from '../types';

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateSlug(slug: string): boolean {
  return SLUG_REGEX.test(slug);
}

export function generateSlug(text: string): string {
  const trMap: Record<string, string> = {
    ç: 'c',
    Ç: 'c',
    ğ: 'g',
    Ğ: 'g',
    ı: 'i',
    İ: 'i',
    ö: 'o',
    Ö: 'o',
    ş: 's',
    Ş: 's',
    ü: 'u',
    Ü: 'u',
  };

  const normalized = text
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (char) => trMap[char] || char)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  return normalized;
}

export function detectCategoryCycle(
  categoryId: string,
  candidateParentId: string | null,
  allCategories: AdminCategory[]
): boolean {
  if (!candidateParentId) return false;
  if (categoryId === candidateParentId) return true;

  const categoryMap = new Map<string, AdminCategory>(allCategories.map((c) => [c.id, c]));
  let currentId: string | null = candidateParentId;
  const visited = new Set<string>([categoryId]);

  while (currentId) {
    if (visited.has(currentId)) {
      return true; // Cycle detected
    }
    visited.add(currentId);
    const parentCategory = categoryMap.get(currentId);
    currentId = parentCategory?.parent_id || null;
  }

  return false;
}

function getClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase client is not configured. Admin operations require active Supabase connection.');
  }
  return supabase;
}

export const adminCategoryRepository = {
  async getAllCategories(params?: CategoryFilterParams): Promise<AdminCategory[]> {
    const client = getClient();
    let query = client.from('categories').select('*').order('sort_order', { ascending: true });

    if (params?.active !== undefined && params.active !== 'all') {
      query = query.eq('active', params.active);
    }

    if (params?.search && params.search.trim()) {
      const term = params.search.trim();
      query = query.or(`name.ilike.%${term}%,slug.ilike.%${term}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[adminCategoryRepository.getAllCategories] Error:', error);
      throw new Error(`Kategoriler yüklenirken hata oluştu: ${error.message}`);
    }

    return (data || []) as AdminCategory[];
  },

  async getCategoryById(id: string): Promise<AdminCategory | null> {
    const client = getClient();
    const { data, error } = await client.from('categories').select('*').eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Kategori yüklenemedi: ${error.message}`);
    }

    return data as AdminCategory;
  },

  async createCategory(input: CreateCategoryInput): Promise<AdminCategory> {
    const name = input.name.trim();
    if (!name) {
      throw new Error('Kategori adı zorunludur.');
    }

    const slug = (input.slug || generateSlug(name)).trim().toLowerCase();
    if (!validateSlug(slug)) {
      throw new Error('Geçersiz URL formatı (slug). Sadece küçük harfler, rakamlar ve tire (-) kullanılabilir.');
    }

    const client = getClient();

    const payload = {
      name,
      slug,
      description: input.description?.trim() || null,
      image_url: input.image_url?.trim() || null,
      parent_id: input.parent_id || null,
      active: input.active !== undefined ? input.active : true,
      sort_order: input.sort_order ?? 0,
      seo_title: input.seo_title?.trim() || null,
      seo_description: input.seo_description?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client.from('categories').insert(payload).select().single();

    if (error) {
      if (error.code === '23505') {
        throw new Error(`"${slug}" slug adresine sahip bir kategori zaten mevcut. Lütfen farklı bir slug belirleyin.`);
      }
      throw new Error(`Kategori oluşturulamadı: ${error.message}`);
    }

    return data as AdminCategory;
  },

  async updateCategory(id: string, input: UpdateCategoryInput): Promise<AdminCategory> {
    if (input.name !== undefined && !input.name.trim()) {
      throw new Error('Kategori adı zorunludur.');
    }

    if (input.slug !== undefined) {
      const slug = input.slug.trim().toLowerCase();
      if (!validateSlug(slug)) {
        throw new Error('Geçersiz URL formatı (slug). Sadece küçük harfler, rakamlar ve tire (-) kullanılabilir.');
      }
    }

    if (input.parent_id === id) {
      throw new Error('Bir kategori kendisinin üst kategorisi olamaz.');
    }

    const client = getClient();

    // Hierarchy cycle check if parent_id is being modified
    if (input.parent_id !== undefined && input.parent_id !== null) {
      const allCategories = await this.getAllCategories();
      if (detectCategoryCycle(id, input.parent_id, allCategories)) {
        throw new Error('Geçersiz kategori hiyerarşisi: Döngüsel üst kategori ilişkisi tespit edildi.');
      }
    }

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) payload.name = input.name.trim();
    if (input.slug !== undefined) payload.slug = input.slug.trim().toLowerCase();
    if (input.description !== undefined) payload.description = input.description?.trim() || null;
    if (input.image_url !== undefined) payload.image_url = input.image_url?.trim() || null;
    if (input.parent_id !== undefined) payload.parent_id = input.parent_id || null;
    if (input.active !== undefined) payload.active = input.active;
    if (input.sort_order !== undefined) payload.sort_order = input.sort_order;
    if (input.seo_title !== undefined) payload.seo_title = input.seo_title?.trim() || null;
    if (input.seo_description !== undefined) payload.seo_description = input.seo_description?.trim() || null;

    const { data, error } = await client.from('categories').update(payload).eq('id', id).select().single();

    if (error) {
      if (error.code === '23505') {
        throw new Error(`Bu slug adresi başka bir kategori tarafından kullanılıyor.`);
      }
      throw new Error(`Kategori güncellenemedi: ${error.message}`);
    }

    return data as AdminCategory;
  },

  async toggleCategoryActive(id: string, active: boolean): Promise<AdminCategory> {
    return this.updateCategory(id, { active });
  },

  async deleteCategory(id: string): Promise<void> {
    const client = getClient();
    const { error } = await client.from('categories').delete().eq('id', id);

    if (error) {
      throw new Error(`Kategori silinemedi: ${error.message}`);
    }
  },
};
