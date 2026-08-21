export type ProductStatus = 'draft' | 'published' | 'archived' | 'out_of_stock';

export interface ProductDimensions {
  heightCm: number;
  diameterCm: number;
  weightKg: number;
}

export interface WholesalePricingTier {
  minQuantity: number;
  maxQuantity?: number;
  unitPrice: number;
  discountPercentage?: number;
}

export interface WholesaleConfig {
  isWholesaleEnabled: boolean;
  minOrderQuantity: number; // MOQ
  tiers: WholesalePricingTier[];
  leadTimeDays?: number;
  allowsCustomGlaze?: boolean;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  width?: number;
  height?: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  colorName: string;
  colorHex?: string;
  finish: 'matte' | 'glossy' | 'raw_clay' | 'textured';
  dimensions: ProductDimensions;
  retailPrice: number;
  compareAtPrice?: number;
  stockQuantity: number;
  isAvailableForRetail: boolean;
  isAvailableForWholesale: boolean;
  imageUrl?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  status: ProductStatus;
  categoryId: string;
  categoryName?: string;
  collectionIds: string[];
  material: string;
  finish: string;
  originCountry: string;
  images: ProductImage[];
  variants: ProductVariant[];
  retailPrice: number;
  compareAtPrice?: number;
  wholesale: WholesaleConfig;
  tags: string[];
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestseller: boolean;
  createdAt: string;
  updatedAt: string;
}
