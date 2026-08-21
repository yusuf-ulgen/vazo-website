import { Product, ProductVariant, WholesaleTier, ProductImage } from '@/entities/product/types';

export function createWholesaleTier(overrides?: Partial<WholesaleTier>): WholesaleTier {
  return {
    id: 'tier-1',
    minQuantity: 6,
    maxQuantity: 19,
    discountPercentage: 25,
    unitPrice: 1387.5,
    tierLabel: '6 – 19 Adet (%25 İskonto)',
    ...overrides,
  };
}

export function createVariant(overrides?: Partial<ProductVariant>): ProductVariant {
  return {
    id: 'var-1',
    sku: 'VAZO-TEST-WHT',
    name: 'Tebeşir Beyazı',
    colorName: 'Tebeşir Beyazı',
    colorHex: '#FAF9F6',
    finish: 'matte',
    dimensions: {
      heightCm: 28,
      diameterCm: 18,
      weightKg: 1.8,
    },
    retailPrice: 1850,
    compareAtPrice: 2200,
    stockQuantity: 25,
    isAvailableForRetail: true,
    isAvailableForWholesale: true,
    ...overrides,
  };
}

export function createProductImage(overrides?: Partial<ProductImage>): ProductImage {
  return {
    id: 'img-1',
    url: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80',
    alt: 'Test Vazo Görseli',
    isPrimary: true,
    sortOrder: 1,
    ...overrides,
  };
}

export function createProduct(overrides?: Partial<Product>): Product {
  return {
    id: 'prod-1',
    slug: 'test-heykelsi-vazo',
    name: 'Test Heykelsi Vazo',
    subtitle: 'Doğal mineral mat sır ve heykelsi kıvrımlar',
    description: '1250°C sıcaklıkta fırınlanmış stoneware seramik test vazosu.',
    material: 'Stoneware Seramik',
    finish: 'Mat Mineral Sır',
    retailPrice: 1850,
    compareAtPrice: 2200,
    retailEnabled: true,
    isFeatured: true,
    isNewArrival: false,
    isBestseller: true,
    categoryIds: ['cat-1'],
    primaryCategoryId: 'cat-1',
    collectionIds: ['col-1'],
    images: [createProductImage()],
    variants: [createVariant()],
    wholesale: {
      isWholesaleEnabled: true,
      minOrderQuantity: 6,
      startingWholesalePrice: 1387.5,
      tiers: [createWholesaleTier()],
    },
    ...overrides,
  };
}
