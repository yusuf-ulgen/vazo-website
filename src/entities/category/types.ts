export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  parentId?: string;
  imageUrl?: string;
  productCount?: number;
  order: number;
}
