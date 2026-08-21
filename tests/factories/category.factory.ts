import { Category } from '@/entities/category/types';

export function createCategory(overrides?: Partial<Category>): Category {
  return {
    id: 'cat-1',
    slug: 'masa-ustu-vazolar',
    name: 'Masa Üstü Vazolar',
    description: 'Konsol ve sehpalar için zarif tasarımlar.',
    imageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    productCount: 8,
    order: 1,
    ...overrides,
  };
}
