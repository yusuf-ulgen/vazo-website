# Order Lifecycle, Snapshot Architecture & Fulfillment Contracts

This document governs the database schema, snapshot persistence, state machines, and fulfillment procedures for **Orders** in the Vazo E-Commerce Platform.

---

## 1. Core Order Principles

1. **Mandatory Authenticated Customer**: Guest checkout is disabled. Every order strictly references an authenticated Supabase customer (`customer_id UUID REFERENCES auth.users(id)`).
2. **Immutable Point-in-Time Snapshots**: Product titles, variant descriptions, dimensions, materials, SKUs, and unit prices are snapshotted at the moment of order creation. Future catalog edits never alter historical order lines.
3. **KDV-Inclusive Financial Truth**: All product and shipping amounts are KDV-inclusive consumer prices (`tax_included = true`). Tax breakdowns are extracted for accounting snapshots without adding extra fees.
4. **Integer Minor Units**: All monetary amounts are recorded in integer minor units (kuruş/cents) to prevent floating-point precision issues.
5. **Channel-Aware Processing**: Orders record their channel (`retail` vs `wholesale`). Wholesale pricing and MOQ rules are verified server-side.
6. **Separation of Concerns**: Human order numbers (`VZ-YYYYMMDD-XXXXX`) are strictly separated from payment provider transaction IDs (PayTR `merchant_oid`).

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
- **`cancelled`**: Triggered before shipment for unfulfilled or failed orders.
- **`partially_refunded`**: Recorded when a portion of the paid amount is refunded.
- **`refunded`**: Recorded when 100% of the paid order amount is returned.
- **`payment_failed`**: Recorded when a payment attempt fails.
- **`payment_review`**: Flagged for manual merchant review.

| State | Allowed Transitions | Stock Impact | Customer Notification |
| :--- | :--- | :--- | :--- |
| `pending_payment` | `paid`, `payment_failed`, `cancelled` | Stock reserved (timeout 40 min) | None |
| `paid` | `processing`, `cancelled`, `refunded`, `partially_refunded` | Stock decremented | "Siparişiniz Alındı & Ödeme Onaylandı" |
| `processing` | `shipped`, `cancelled`, `refunded` | Stock decremented | Internal queue |
| `shipped` | `delivered`, `refunded` | Stock decremented | "Siparişiniz Kargoya Verildi" (with tracking) |
| `delivered` | `refunded`, `partially_refunded` | Finalized | "Siparişiniz Teslim Edildi" |
| `cancelled` | None (Terminal) | Stock replenished if reserved | "Sipariş İptal Edildi" |
| `refunded` | None (Terminal) | Manual inventory return | "İade Onaylandı" |

---

## 3. Order Numbering vs PayTR Merchant OID

- **Order Number (`order_number`)**: `VZ-YYYYMMDD-XXXXX` (e.g. `VZ-20260828-74912`).
- **PayTR Merchant OID (`merchant_oid`)**: Formatted as a strictly alphanumeric unique identifier (<= 64 chars) stored on the `payments` attempt table (e.g. `VZ2026082874912PAY1`).
- **Collision Resistance**: Generated via database function `public.generate_order_number()` with retry loop.

---

## 4. Implemented Database Schema (Phase 3.2)

### 4.1 Orders Master Table (`public.orders`)
```sql
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    channel TEXT NOT NULL CHECK (channel IN ('retail', 'wholesale')),
    status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (
        status IN (
            'pending_payment', 'payment_failed', 'paid', 'processing',
            'shipped', 'delivered', 'cancelled', 'partially_refunded',
            'refunded', 'payment_review'
        )
    ),
    currency TEXT NOT NULL DEFAULT 'TRY' CHECK (currency IN ('TRY', 'USD', 'EUR', 'GBP')),
    tax_included BOOLEAN NOT NULL DEFAULT true,

    subtotal_minor BIGINT NOT NULL CHECK (subtotal_minor >= 0),
    shipping_minor BIGINT NOT NULL DEFAULT 0 CHECK (shipping_minor >= 0),
    discount_minor BIGINT NOT NULL DEFAULT 0 CHECK (discount_minor >= 0),
    tax_included_minor BIGINT DEFAULT 0 CHECK (tax_included_minor >= 0),
    total_minor BIGINT NOT NULL CHECK (total_minor >= 0),

    shipping_address JSONB NOT NULL,
    billing_address JSONB NOT NULL,
    seller_legal_snapshot JSONB,
    customer_legal_snapshot JSONB,

    shipping_carrier TEXT,
    shipping_tracking_number TEXT,
    shipping_tracking_url TEXT,

    cancellation_reason TEXT,
    admin_notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    paid_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,

    CONSTRAINT chk_orders_total_integrity CHECK (
        total_minor = (subtotal_minor + shipping_minor - discount_minor)
    )
);
```

### 4.2 Order Items Snapshot Table (`public.order_items`)
```sql
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,

    sku_snapshot TEXT NOT NULL,
    product_name_snapshot TEXT NOT NULL,
    variant_name_snapshot TEXT NOT NULL,
    image_url_snapshot TEXT,

    unit_price_minor BIGINT NOT NULL CHECK (unit_price_minor >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    line_total_minor BIGINT NOT NULL CHECK (line_total_minor >= 0),
    currency TEXT NOT NULL DEFAULT 'TRY' CHECK (currency IN ('TRY', 'USD', 'EUR', 'GBP')),
    channel TEXT NOT NULL CHECK (channel IN ('retail', 'wholesale')),

    metadata_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

    CONSTRAINT chk_order_items_line_total CHECK (
        line_total_minor = (unit_price_minor * quantity)
    )
);
```

---

## 5. Supporting Commerce Tables

1. **`payments`**: Payment attempts with unique alphanumeric `merchant_oid`, `expected_amount_minor`, and timeout timestamps.
2. **`payment_events`**: Append-only log of callback processing events with `event_fingerprint` deduplication.
3. **`inventory_reservations`**: Temporary 40-minute reservations protecting cart checkout from overselling.
4. **`inventory_movements`**: Immutable stock movement ledger (`sale`, `refund_restock`, `order_cancellation_release`).
5. **`order_status_history`**: Append-only history of status changes with actor attribution.
6. **`order_legal_acceptances`**: Customer acceptance records for Distance Sales Agreements and Preliminary Information Forms.
7. **`refunds`**: Full and partial refund requests with unique `reference_no` and minor unit amounts.
8. **`order_invoices`**: Invoice status tracking scaffolding (`not_requested`, `pending`, `issued`).
9. **`transactional_emails`**: Outbox queue for order confirmations and shipping notices.

---

## 6. Checkout Quote & Order Creation RPCs (Phase 3.4)

### `public.calculate_checkout_quote(...)`

A STABLE SECURITY DEFINER function that:

1. Validates product/variant availability and retail/wholesale pricing.
2. Evaluates physical stock minus active unexpired reservations.
3. Resolves dynamic shipping rate via Phase 3.3 shipping engine.
4. Returns all amounts as integer minor units (kuruş/cents), with `tax_included = true`.

Called by the `checkout-quote` Edge Function. Browser sends only `variant_id + quantity + destination_country + channel`. All prices are resolved server-side.

### `public.create_checkout_order(...)`

A SECURITY DEFINER atomic transaction RPC that:

1. Validates customer JWT and channel eligibility.
2. Locks variant rows with `SELECT ... FOR UPDATE` (sorted by `id` to prevent deadlocks).
3. Validates stock availability (physical stock minus active reservations).
4. Creates the order record, order_items with immutable snapshots, inventory_reservations (40 min TTL), address snapshots, and `order_legal_acceptances` entries.
5. Enforces total integrity: `total_minor = subtotal_minor + shipping_minor - discount_minor`.

**Reservation TTL**: 40 minutes. **PayTR timeout**: 30 minutes (reservation always outlasts payment window).

### Legal Acceptance Snapshot

Both *Ön Bilgilendirme Formu* (`preliminary_info`) and *Mesafeli Satış Sözleşmesi* (`distance_sales`) must be explicitly accepted before order creation. The full text is captured in `order_legal_acceptances` at the moment of acceptance and is immutable thereafter.
