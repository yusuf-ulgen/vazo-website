# Order Lifecycle, Snapshot Architecture & Fulfillment Contracts

This document governs the database schema, snapshot persistence, state machines, and fulfillment procedures for **Orders** in the Vazo E-Commerce Platform.

---

## 1. Core Order Principles

1. **Mandatory Authenticated Customer**: Guest checkout is disabled. Every order strictly references an authenticated Supabase customer (`customer_id UUID REFERENCES auth.users(id)`).
2. **Immutable Point-in-Time Snapshots**: Product titles, variant descriptions, dimensions, materials, SKUs, and unit prices are snapshotted at the moment of order creation. Future catalog edits never alter historical order lines.
3. **KDV-Inclusive Financial Truth**: All product and shipping amounts are KDV-inclusive consumer prices (`tax_included = true`). Tax breakdowns are extracted for accounting snapshots without adding extra fees.
4. **Channel-Aware Processing**: Orders record their channel (`retail` vs `wholesale`). Wholesale pricing and MOQ rules are verified server-side.

---

## 2. Order State Machine

```
              ┌──────────────────────────┐
              │     pending_payment      │
              └────────────┬─────────────┘
                           │
            (Verified PayTR Callback)
                           ▼
              ┌──────────────────────────┐
              │           paid           │
              └────────────┬─────────────┘
                           │
             (Admin Marks Processing)
                           ▼
              ┌──────────────────────────┐
              │        processing        │
              └────────────┬─────────────┘
                           │
             (Carrier Tracking Assigned)
                           ▼
              ┌──────────────────────────┐
              │         shipped          │
              └────────────┬─────────────┘
                           │
             (Carrier / Manual Delivery)
                           ▼
              ┌──────────────────────────┐
              │        delivered         │
              └──────────────────────────┘
```

### Exception & Terminal States
- **`cancelled`**: Can be triggered before shipment for unfulfilled or failed orders.
- **`partially_refunded`**: Recorded when a portion of the paid amount is refunded via PayTR.
- **`refunded`**: Recorded when 100% of the paid order amount is returned.

| State | Allowed Transitions | Stock Impact | Customer Notification |
| :--- | :--- | :--- | :--- |
| `pending_payment` | `paid`, `cancelled` | Stock reserved (timeout 30 min) | None |
| `paid` | `processing`, `cancelled`, `refunded` | Stock decremented | "Siparişiniz Alındı & Ödeme Onaylandı" |
| `processing` | `shipped`, `cancelled`, `refunded` | Stock decremented | Internal queue |
| `shipped` | `delivered`, `refunded` | Stock decremented | "Siparişiniz Kargoya Verildi" (with tracking) |
| `delivered` | `refunded`, `partially_refunded` | Finalized | "Siparişiniz Teslim Edildi" |
| `cancelled` | None (Terminal) | Stock replenished if reserved | "Sipariş İptal Edildi" |
| `refunded` | None (Terminal) | Manual inventory return | "İade Onaylandı" |

---

## 3. Order Numbering & Collision Resistance

- **Format**: `VZ-YYYYMMDD-XXXXX` (e.g. `VZ-20260828-74912`).
- **Generation Rule**: Formatted using date prefix and a cryptographically secure random alphanumeric suffix or database sequence.
- **Uniqueness**: Enforced by `UNIQUE` index in PostgreSQL.
- **PayTR Mapping**: The order number maps 1:1 with the PayTR `merchant_oid`.

---

## 4. Database Schema Specification (Phase 3 Target)

```sql
-- Orders Master Table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    channel TEXT NOT NULL CHECK (channel IN ('retail', 'wholesale')),
    status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (
        status IN ('pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'partially_refunded')
    ),
    currency TEXT NOT NULL DEFAULT 'TRY' CHECK (currency IN ('TRY', 'USD', 'EUR', 'GBP')),
    subtotal_amount NUMERIC(12, 2) NOT NULL CHECK (subtotal_amount >= 0),
    shipping_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (shipping_amount >= 0),
    tax_included BOOLEAN NOT NULL DEFAULT true,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    
    -- Address Snapshots (Immutable JSONB)
    shipping_address JSONB NOT NULL,
    billing_address JSONB NOT NULL,
    
    -- Fulfillment Details
    shipping_carrier TEXT,
    shipping_tracking_number TEXT,
    shipping_tracking_url TEXT,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    
    -- Cancellation / Notes
    cancellation_reason TEXT,
    admin_notes TEXT,
    
    -- Invoice / E-Archive Scaffolding
    invoice_status TEXT NOT NULL DEFAULT 'not_requested' CHECK (
        invoice_status IN ('not_requested', 'pending', 'issued', 'failed', 'cancelled')
    ),
    invoice_number TEXT,
    invoice_provider TEXT,
    invoice_issued_at TIMESTAMPTZ,
    invoice_error TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Order Items Snapshot Table
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    
    -- Immutable Item Snapshots
    product_name TEXT NOT NULL,
    variant_name TEXT NOT NULL,
    sku TEXT NOT NULL,
    color_name TEXT,
    material TEXT,
    image_url TEXT,
    
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    tax_rate NUMERIC(4, 2) NOT NULL DEFAULT 0.20,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
```

---

## 5. Address Snapshot Structure

Address records are persisted as complete JSON snapshots to ensure that future address updates by the customer do not alter historical order records:

```json
{
  "full_name": "Ayşe Yılmaz",
  "company_name": "Studio Yılmaz Tasarım",
  "tax_number": "1234567890",
  "tax_office": "Kadıköy VD",
  "address_line1": "Bağdat Caddesi No: 124 D: 6",
  "address_line2": "Erenköy",
  "city": "İstanbul",
  "state_province": "Kadıköy",
  "postal_code": "34728",
  "country_code": "TR",
  "country_name": "Türkiye",
  "phone": "+90 532 123 4567"
}
```

---

## 6. Invoice & E-Archive Scaffolding Contract

While real GIB / e-Archive integration is scheduled for a later milestone, the order schema is architecturally prepared:

- `invoice_status`: Default `'not_requested'` for standard retail; `'pending'` when corporate invoice details are provided.
- **Allowed Statuses**: `not_requested`, `pending`, `issued`, `failed`, `cancelled`.
- **Zero Fake Invoices**: The system will not generate fake PDF invoices or pretend that documents have been transmitted to GIB.

---

## 7. Row Level Security (RLS) Policy Contract

1. **Customers**:
   - `SELECT`: Allowed only for orders where `orders.customer_id = auth.uid()`.
   - `INSERT / UPDATE / DELETE`: Blocked for customers. Order creation and mutation happens exclusively via server-side Edge Functions.
2. **Administrators**:
   - `ALL` operations allowed subject to `public.is_admin()` check.
