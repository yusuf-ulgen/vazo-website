import { Category } from '../types';
import { supabase, isSupabaseConfigured, isStorefrontMockEnabled } from '@/shared/lib/supabase';

export const mockCategories: Category[] = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    slug: 'masa-ustu-vazolar',
    name: 'Masa Üstü Vazolar',
    description: 'Konsol, sehpa ve yemek masaları için tasarlanmış zarif formlar.',
    imageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    productCount: 8,
    order: 1,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    slug: 'zemin-anit-vazolar',
    name: 'Zemin & Anıt Vazolar',
    description: 'Geniş mekanlar, lobiler ve köşeler için heykelsi monolitik formlar.',
    imageUrl: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=800&q=80',
    productCount: 4,
    order: 2,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    slug: 'heykelsi-objeler',
    name: 'Heykelsi Objeler',
    description: 'Işık ve gölge oyunları yaratan sanatsal soyut heykeller ve ark formlar.',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    productCount: 5,
    order: 3,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000004',
    slug: 'vazo-kase-setleri',
    name: 'Vazo & Kase Setleri',
    description: 'Birbirini tamamlayan oran ve yüzey dokusuna sahip ikili ve üçlü seramik setler.',
    imageUrl: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=800&q=80',
    productCount: 3,
    order: 4,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000005',
    slug: 'ham-terakota-serisi',
    name: 'Ham Terakota & Toprak',
    description: 'Doğal killi gövde ve mineral katkılı ham dokulu yüzeyler.',
    imageUrl: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?auto=format&fit=crop&w=800&q=80',
    productCount: 4,
    order: 5,
  },
];

export const categoryRepository = {
  async getCategories(): Promise<Category[]> {
    if (isStorefrontMockEnabled) {
      return [...mockCategories].sort((a, b) => a.order - b.order);
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured. Live mode requires valid Supabase environment variables.');
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[categoryRepository.getCategories] Error:', error);
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description || undefined,
      parentId: row.parent_id || undefined,
      imageUrl: row.image_url || undefined,
      order: row.sort_order,
    }));
  },

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    if (isStorefrontMockEnabled) {
      return mockCategories.find((c) => c.slug === slug) || null;
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured. Live mode requires valid Supabase environment variables.');
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .eq('active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch category: ${error.message}`);
    }

    return data
      ? {
          id: data.id,
          slug: data.slug,
          name: data.name,
          description: data.description || undefined,
          parentId: data.parent_id || undefined,
          imageUrl: data.image_url || undefined,
          order: data.sort_order,
        }
      : null;
  },
};
