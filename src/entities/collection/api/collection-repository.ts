import { Collection } from '../types';
import { supabase, isSupabaseConfigured, isStorefrontMockEnabled } from '@/shared/lib/supabase';

export const mockCollections: Collection[] = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    slug: 'nordik-sessizlik',
    name: 'Nordik Sessizlik Serisi',
    subtitle: 'Yumuşak kavisler ve mineral mat sırlı yüzeyler',
    storyMarkdown: 'Kuzey doğasının sakinliğinden ve ham taş dokularından ilham alan zamansız koleksiyon. Her parça mekanınıza dinginlik katar.',
    heroImageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=80',
    productIds: ['p0000000-0000-0000-0000-000000000001'],
    isFeaturedOnHomepage: true,
    order: 1,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    slug: 'amforik-kivrimlar',
    name: 'Amforik Kıvrımlar 2026',
    subtitle: 'Antik hatların çağdaş brütalizm ile buluşması',
    storyMarkdown: 'Akdeniz amfora geleneğini minimalist heykelsi çizgilerle buluşturan özel seri. Konsol ve sehpalar için heykelsi odak noktası.',
    heroImageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    productIds: [],
    isFeaturedOnHomepage: true,
    order: 2,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    slug: 'monokrom-brutalizm',
    name: 'Monokrom Brütalizm',
    subtitle: 'Antrasit, kömür ve bazalt taşın monolitik gücü',
    storyMarkdown: 'Keskin hatlar, monolitik oranlar ve koyu mineral dokular. Mimari projeler ve modern yaşam alanları için güçlü silüetler.',
    heroImageUrl: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=1200&q=80',
    productIds: ['p0000000-0000-0000-0000-000000000002'],
    isFeaturedOnHomepage: false,
    order: 3,
  },
];

export const collectionRepository = {
  async getCollections(): Promise<Collection[]> {
    if (isStorefrontMockEnabled) {
      return [...mockCollections].sort((a, b) => a.order - b.order);
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured. Live mode requires valid Supabase environment variables.');
    }

    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[collectionRepository.getCollections] Error:', error);
      throw new Error(`Failed to fetch collections: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      subtitle: row.subtitle || undefined,
      storyMarkdown: row.story_markdown || row.description || undefined,
      heroImageUrl: row.hero_image_url || undefined,
      productIds: [],
      isFeaturedOnHomepage: row.featured,
      order: row.sort_order,
    }));
  },

  async getCollectionBySlug(slug: string): Promise<Collection | null> {
    if (isStorefrontMockEnabled) {
      return mockCollections.find((c) => c.slug === slug) || null;
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured. Live mode requires valid Supabase environment variables.');
    }

    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('slug', slug)
      .eq('active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch collection: ${error.message}`);
    }

    return data
      ? {
          id: data.id,
          slug: data.slug,
          name: data.name,
          subtitle: data.subtitle || undefined,
          storyMarkdown: data.story_markdown || data.description || undefined,
          heroImageUrl: data.hero_image_url || undefined,
          productIds: [],
          isFeaturedOnHomepage: data.featured,
          order: data.sort_order,
        }
      : null;
  },
};
