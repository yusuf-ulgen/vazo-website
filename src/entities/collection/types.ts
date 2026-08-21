export interface Collection {
  id: string;
  slug: string;
  name: string;
  subtitle?: string;
  storyMarkdown?: string;
  heroImageUrl?: string;
  productIds: string[];
  isFeaturedOnHomepage: boolean;
  order: number;
}
