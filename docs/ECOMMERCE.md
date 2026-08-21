# E-Commerce Domain & Data Models

This document defines the canonical domain models and shared entities for the **Vazo E-Commerce Platform** (`src/entities/`).

---

## 1. Domain Entities Architecture

All domain models are provider-neutral TypeScript interfaces designed to support both retail consumers and wholesale trade buyers.

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     Product     │◄──────┤ ProductVariant  │◄──────┤  WholesaleTier  │
└────────┬────────┘       └─────────────────┘       └─────────────────┘
         │
         ├────────────────┬─────────────────┐
         ▼                ▼                 ▼
┌─────────────────┐┌────────────────┐┌─────────────────┐
│    Category     ││   Collection   ││  MediaAsset     │
└─────────────────┘└────────────────┘└─────────────────┘
```

---

## 2. Core Entity Definitions

### 2.1 Product & Variants
```typescript
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
  collectionIds: string[];
  material: string; // e.g. "Stoneware Seramik", "Doğal Kil", "Porselen"
  originCountry: string;
  images: {
    id: string;
    url: string;
    alt: string;
    isPrimary: boolean;
  }[];
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
```

### 2.2 Category & Collection
```typescript
export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  parentId?: string;
  imageUrl?: string;
  order: number;
}

export interface Collection {
  id: string;
  slug: string;
  name: string;
  subtitle?: string;
  storyMarkdown?: string;
  heroImageUrl?: string;
  isFeaturedOnHomepage: boolean;
}
```

### 2.3 Customers & Trade Accounts
```typescript
export type CustomerType = 'retail' | 'wholesale';
export type TradeApplicationStatus = 'pending' | 'approved' | 'rejected' | 'more_info_needed';

export interface Customer {
  id: string;
  type: CustomerType;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  addresses: Address[];
}

export interface TradeApplication {
  id: string;
  companyName: string;
  taxNumber: string;
  taxOffice: string;
  businessType: 'interior_designer' | 'boutique_retailer' | 'hotel_restaurant' | 'architect' | 'other';
  contactPerson: string;
  email: string;
  phone: string;
  website?: string;
  estimatedMonthlyVolume: string;
  status: TradeApplicationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewerNotes?: string;
}
```

### 2.4 Cart & Orders
```typescript
export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  channel: 'retail' | 'wholesale';
  unitPrice: number;
  totalPrice: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  estimatedShipping: number;
  tax: number;
  total: number;
}

export type OrderStatus = 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  channel: 'retail' | 'wholesale';
  customerId: string;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  taxAmount: number;
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: Address;
  billingAddress: Address;
  createdAt: string;
}
```
