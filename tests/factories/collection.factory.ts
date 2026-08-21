import { Collection } from '@/entities/collection/types';

export function createCollection(overrides?: Partial<Collection>): Collection {
  return {
    id: 'col-1',
    slug: 'nordik-sessizlik',
    name: 'Nordik Sessizlik Serisi',
    subtitle: 'Yumuşak kavisler ve mineral mat sırlı yüzeyler',
    storyMarkdown: 'Kuzey doğasının sakinliğinden ve ham taş dokularından ilham alan zamansız koleksiyon.',
    heroImageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=80',
    productIds: ['prod-1'],
    isFeaturedOnHomepage: true,
    order: 1,
    ...overrides,
  };
}
