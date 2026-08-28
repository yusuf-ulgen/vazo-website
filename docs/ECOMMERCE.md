# E-Commerce Domain & Data Models

This document defines the canonical domain models, currency architectures, pricing semantics, and shared entities for the **Vazo E-Commerce Platform** (`src/entities/`).

---

## 1. Domain Architecture & Status Lifecycle

All domain models are provider-neutral TypeScript interfaces designed to support both retail consumers and wholesale trade partners with strict separation between client presentation and server-authoritative persistence.

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
         │
         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      Order      │◄──────┤  PaymentRecord  │◄──────┤  RefundRecord   │
│ (Immutable Snap)│       │ (PayTR Callback)│       │ (Full / Partial)│
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

---

## 2. Canonical Money & Currency Architecture

### 2.1 Currency Model & Provider Boundaries
- **Active V1 Currency**: `TRY` (Turkish Lira).
- **Future-Ready Currencies**: `USD`, `EUR`, `GBP`.
- **Currency Mapping Boundary**: Provider-specific values are translated at adapter boundaries only (e.g. Application: `TRY` -> PayTR: `TL`).
- **Precision & Arithmetic**: JavaScript floating-point arithmetic is strictly prohibited for authoritative monetary calculations. Calculations are performed either in integer minor units (kuruş/cents) or via PostgreSQL `NUMERIC(12, 2)` / server-side fixed-point helpers.

```typescript
export type CurrencyCode = 'TRY' | 'USD' | 'EUR' | 'GBP';

export interface Money {
  amountMinor: number; // Minor units integer (e.g. 300000 = 3,000.00 TRY)
  currency: CurrencyCode;
}
```

---

## 3. Pricing & VAT / KDV Semantics

> [!IMPORTANT]
> **KDV-Inclusive Consumer Pricing Principle**:
> All storefront retail and wholesale catalog prices are **KDV-inclusive consumer prices** (`tax_included = true`).
> - Example: Product displayed at `3.000 TRY`, Shipping `150 TRY` -> Total charged: `3.150 TRY`.
> - **DO NOT add an additional +20% VAT on top of the subtotal at checkout.**
> - Tax amounts are computed backwards from the gross price for legal invoice snapshots:
>   $$\text{Tax Amount} = \text{Gross Price} - \left( \frac{\text{Gross Price}}{1 + \text{Tax Rate}} \right)$$

---

## 4. Retail & Wholesale Channels

- **Retail (B2C)**: Standard consumer purchasing without quantity restrictions.
- **Wholesale (B2B)**:
  - Requires an authenticated user with an approved trade status (`trade_applications.status = 'approved'`).
  - Enforces Minimum Order Quantity (MOQ) and tiered volume discounts.
  - **Zero Browser Trust**: Wholesale eligibility, tier discounts, and MOQ compliance are re-evaluated server-side on every mutation.

---

## 5. Core Entity Definitions

### 5.1 Product & Variants [CURRENT]
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
  retailPrice: number; // KDV included
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
  material: string;
  originCountry: string;
  images: {
    id: string;
    url: string;
    alt: string;
    isPrimary: boolean;
  }[];
  variants: ProductVariant[];
  retailPrice: number; // KDV included
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

### 5.2 Customers & Trade Accounts [CURRENT & PHASE 3 TARGET]
```typescript
export type CustomerType = 'retail' | 'wholesale';
export type TradeApplicationStatus = 'pending' | 'approved' | 'rejected' | 'more_info_needed';

export interface Address {
  id?: string;
  title: string;          // e.g. "Ev", "Ofis"
  fullName: string;
  companyName?: string;
  taxNumber?: string;
  taxOffice?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince?: string;
  postalCode: string;
  countryCode: string;    // ISO 3166-1 alpha-2, e.g. "TR"
  phone: string;
}

export interface CustomerProfile {
  id: string;             // Supabase auth.users UUID
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  type: CustomerType;
  isTradeApproved: boolean;
  defaultShippingAddressId?: string;
  defaultBillingAddressId?: string;
}
```

### 5.3 Cart Model (Client Presentation) [PHASE 3 TARGET]
```typescript
export interface CartItem {
  productId: string;
  variantId: string;
  sku: string;
  name: string;
  variantName: string;
  colorName?: string;
  imageUrl?: string;
  quantity: number;
  channel: 'retail' | 'wholesale';
  unitPrice: number;      // KDV included
  totalPrice: number;     // unitPrice * quantity
}

export interface Cart {
  items: CartItem[];
  subtotal: number;       // Sum of items (KDV included)
  shippingFee: number;    // Calculated shipping fee
  taxAmount: number;      // Informational tax breakdown (already in subtotal)
  totalAmount: number;    // subtotal + shippingFee
  currency: CurrencyCode;
}
```

### 5.4 Order & Immutable Purchase Snapshots [PHASE 3 TARGET]
```typescript
export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded';

export interface OrderItemSnapshot {
  id: string;
  orderId: string;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  imageUrl?: string;
  quantity: number;
  channel: 'retail' | 'wholesale';
  unitPrice: number;      // Immutable purchase-time price (KDV included)
  taxRate: number;        // e.g. 0.20 for 20% KDV
  taxAmount: number;      // Backward-computed tax portion
  totalPrice: number;     // unitPrice * quantity
}

export interface Order {
  id: string;
  orderNumber: string;    // Human-readable, e.g. "VZ-2026-00101"
  customerId: string;     // References auth.users(id)
  channel: 'retail' | 'wholesale';
  status: OrderStatus;
  currency: CurrencyCode;
  subtotal: number;       // Gross subtotal (KDV included)
  shippingFee: number;    // Immutable shipping charge
  taxIncluded: boolean;   // Always true in V1
  taxTotal: number;       // Informational tax breakdown
  totalAmount: number;    // Authoritative total charged (subtotal + shippingFee)
  shippingAddress: Address;
  billingAddress: Address;
  items: OrderItemSnapshot[];
  shippingTrackingNumber?: string;
  shippingCarrier?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 5.5 Payment & Refund Transactions [PHASE 3 TARGET]
```typescript
export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';

export interface PaymentTransaction {
  id: string;
  orderId: string;
  provider: 'paytr';
  merchantOid: string;    // Unique PayTR order identifier
  amount: number;         // Authoritative payment amount in minor units or decimal
  currency: CurrencyCode;
  status: PaymentStatus;
  paytrReference?: string;
  errorMessage?: string;
  rawCallbackPayload?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface RefundRecord {
  id: string;
  orderId: string;
  paymentTransactionId: string;
  amount: number;         // Refunded amount
  currency: CurrencyCode;
  reason: string;
  adminId: string;        // Admin user who executed the refund
  paytrRefundId?: string;
  status: 'pending' | 'success' | 'failed';
  createdAt: string;
}
```

### 5.6 Invoice & E-Archive Scaffolding [FUTURE / PHASE 3 TARGET]
```typescript
export type InvoiceStatus = 'not_requested' | 'pending' | 'issued' | 'failed' | 'cancelled';

export interface InvoiceScaffolding {
  orderId: string;
  invoiceStatus: InvoiceStatus;
  invoiceNumber?: string;
  invoiceProvider?: string; // e.g. "gib", "parasut", "mock"
  invoiceIssuedAt?: string;
  invoiceError?: string;
  companyName?: string;
  taxNumber?: string;
  taxOffice?: string;
}
```

---

## 6. Server-Authoritative Checkout Contracts (Phase 3.4)

The checkout pipeline enforces server-side pricing through two Edge Functions backed by PostgreSQL RPCs.

### 6.1 Checkout Quote Request

```typescript
export interface CheckoutQuoteItemInput {
  variant_id: string;
  quantity: number;
}

export interface CheckoutQuoteRequest {
  items: CheckoutQuoteItemInput[];
  destination_country?: string;
  channel?: 'retail' | 'wholesale';
  currency?: string;
}
```

### 6.2 Checkout Quote Response

```typescript
export interface CheckoutQuoteResponse {
  supported: boolean;                 // false if destination country has no active shipping zone
  channel: 'retail' | 'wholesale';
  currency: string;
  destination_country: string;
  items: CheckoutQuoteItem[];
  subtotal_minor: number;
  shipping_minor: number;
  free_shipping_applied: boolean;
  estimated_delivery_text: string | null;
  discount_minor: number;
  tax_included: boolean;              // Always true — KDV dahildir
  tax_rate: number;                   // e.g. 20 for %20 KDV
  tax_included_minor: number;         // Extracted tax portion for display
  total_minor: number;
}
```

### 6.3 Create Order Request

```typescript
export interface CreateOrderRequest {
  items: CheckoutQuoteItemInput[];
  shipping_address: CustomerAddress;
  billing_address?: CustomerAddress;
  channel?: 'retail' | 'wholesale';
  currency?: string;
  coupon_code?: string;
  accepted_preliminary_info: boolean; // Must be true
  accepted_distance_sales: boolean;   // Must be true
}
```

### 6.4 Create Order Response

```typescript
export interface CreateOrderResponse {
  order_id: string;
  order_number: string;              // VZ-YYYYMMDD-XXXXX
  channel: 'retail' | 'wholesale';
  status: 'pending_payment';         // Always pending_payment at creation
  currency: string;
  total_minor: number;
  tax_included: boolean;
  expires_at: string;                // ISO timestamp, 40 minutes from creation
  reservation_timeout_minutes: number; // 40
  payment_timeout_minutes: number;     // 30
}
```

### 6.5 Checkout Security Rules

| Rule | Enforcement |
|---|---|
| Browser cannot set unit_price | Server resolves from `product_variants.retail_price_minor` |
| Browser cannot claim wholesale | `customer_profile.wholesale_approved` verified server-side |
| Browser cannot set shipping | Resolved by `shipping_resolver` via Phase 3.3 engine |
| Browser cannot bypass stock | `physical_quantity - active_unexpired_reservations` enforced atomically |
| Legal must be accepted | `accepted_preliminary_info AND accepted_distance_sales` required |
