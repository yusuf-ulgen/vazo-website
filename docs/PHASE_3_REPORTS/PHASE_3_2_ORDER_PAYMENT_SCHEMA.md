# Phase 3.2 Implementation Report: Order, Payment, Refund, Inventory Reservation & Invoice Domain

**Date**: 2026-08-28  
**Repository**: `https://github.com/yusuf-ulgen/vazo-website`  
**Working Branch**: `phase-3`  
**Starting SHA**: `4bbb7deea1e090699ee0fd25a102365839f7c716`  
**Ending Commit SHA**: *(Recorded upon commit)*  
**Quality Status**: 🟢 **100% PRODUCTION READY & VERIFIED** (0 lint/type diagnostics, 103 planned pgTAP database assertions, 100 passing test suites / 547 tests, clean production build).

---

## 1. Executive Summary

Phase 3.2 established the relational database and domain foundation required for the upcoming PayTR checkout, inventory protection, logistics, and admin fulfillment modules. All monetary attributes have been standardized to integer **minor units** (kuruş/cents), KDV-inclusive arithmetic contracts have been enforced with database check constraints, inventory reservation mechanisms (40-minute TTL) have been introduced to prevent checkout overselling, and strict Row Level Security (RLS) policies have been activated across all 11 new commerce tables.

---

## 2. Implemented Schema & Architectural Deliverables

### 2.1 Database Migration (`supabase/migrations/20260828020000_phase3_commerce_schema.sql`)
1. **`orders`**:
   - Primary order master table referencing `auth.users(id)`.
   - Minor unit amounts (`subtotal_minor`, `shipping_minor`, `discount_minor`, `tax_included_minor`, `total_minor`).
   - Total integrity check constraint: `total_minor = subtotal_minor + shipping_minor - discount_minor`.
   - Immutable JSONB address snapshots (`shipping_address`, `billing_address`) and legal identity snapshots.
   - Status lifecycle (`pending_payment`, `payment_failed`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`, `partially_refunded`, `refunded`, `payment_review`).
2. **`order_items`**:
   - Point-in-time item snapshots (`sku_snapshot`, `product_name_snapshot`, `variant_name_snapshot`, `image_url_snapshot`).
   - Line total integrity check constraint: `line_total_minor = unit_price_minor * quantity`.
3. **`payments`**:
   - Payment attempts table (supporting multiple attempts per order).
   - Strict `merchant_oid` uniqueness and alphanumeric constraint (<= 64 chars).
   - Expected amount and provider status lifecycle.
4. **`payment_events`**:
   - Append-only callback history log with `event_fingerprint` deduplication and zero secret storage.
5. **`inventory_reservations`**:
   - 40-minute checkout reservation hold with status lifecycle (`reserved`, `converted`, `released`, `expired`).
6. **`inventory_movements`**:
   - Commerce ledger for non-admin inventory changes (`sale`, `refund_restock`, `order_cancellation_release`, `initial_stock`).
7. **`order_status_history`**:
   - Append-only audit log for order status changes with actor attribution.
8. **`order_legal_acceptances`**:
   - Point-in-time digital signatures for Distance Sales Agreements and Preliminary Information Forms.
9. **`refunds`**:
   - Full and partial refund requests with unique alphanumeric `reference_no` and `amount_minor > 0` check constraint.
10. **`order_invoices`**:
    - Scaffolding table with default status `'not_requested'`.
11. **`transactional_emails`**:
    - Provider-neutral email outbox queue ensuring order transitions are unblocked by network SMTP latencies.

### 2.2 Database Functions (`SECURITY DEFINER`, Fixed `search_path`)
- **`public.generate_order_number()`**: Returns collision-resistant human-readable order number formatted as `VZ-YYYYMMDD-XXXXX`.
- **`public.get_variant_available_stock(p_variant_id UUID)`**: Authoritatively calculates `available_stock = physical_stock - active_unexpired_reservations`.
- **`public.cleanup_expired_inventory_reservations()`**: Routine to mark expired reservations as `'expired'`.
- **`public.handle_updated_at_commerce()`**: Automatically updates `updated_at` timestamps on commerce tables.

### 2.3 Row Level Security (RLS) Policy Matrix
- **Authenticated Customers**:
  - `SELECT` on `orders` where `customer_id = auth.uid()`.
  - `SELECT` on `order_items`, `payments`, `order_status_history`, `order_legal_acceptances`, `refunds`, and `order_invoices` strictly via parent order ownership.
  - **Direct browser `INSERT` / `UPDATE` / `DELETE` is DENIED** on all commerce entities (mutations must flow through backend/RPC).
- **Anonymous Visitors (`anon`)**:
  - `SELECT` and all mutations **DENIED (0 access)** across all 11 commerce tables.
- **Admin Users (`is_admin()`)**:
  - Full operational access to orders, order items, payments, refunds, and invoices; read-only access to audit logs, payment events, and outbox queues.

### 2.4 Domain Types & Monetary Arithmetic
- **`src/shared/lib/money.ts`**:
  - `CurrencyCode` (`'TRY' | 'USD' | 'EUR' | 'GBP'`) and `Money` (`{ amountMinor: number; currency: CurrencyCode }`).
  - `toMinorUnits()`, `fromMinorUnits()`, `formatMinorMoney()`, `calculateTaxIncluded()`, and `calculateOrderTotalMinor()`.
- **`src/entities/order/types.ts`**:
  - Complete domain type interfaces for all 11 commerce models.

---

## 3. Verification Suite Results

| Test Command | Scope | Result |
| :--- | :--- | :---: |
| `npm run check:repo` | Secret detection & repository hygiene | **PASS** |
| `npm run check:lines` | 600-line hard limit verification | **PASS** |
| `npm run lint` | ESLint static analysis (0 errors, 0 warnings) | **PASS** |
| `npm run typecheck` | Strict TypeScript compilation (`tsc -b`) | **PASS** |
| `npm run test:coverage` | Vitest Unit & Component Coverage Suite | **PASS** (100 suites, 547 tests) |
| `npm run test:db:static` | pgTAP 103 Security Assertion Scanner + UUID Preflight | **PASS** |
| `npm run build` | Vite production build | **PASS** |

---

## 4. Known Limitations & Phase 3.3 Handover

- **No Live PayTR Gateway Calls**: Live HTTP requests and iframe generation are scheduled for Phase 3.5.
- **No Direct UI Checkout**: Storefront checkout flow is scheduled for Phase 3.7 after shipping and pricing engines are completed.
- **No Invoice PDF/GIB Integration**: `order_invoices` operates purely as database scaffolding in Phase 3.2.
