# PHASE 3.4 — Server-Authoritative Checkout & Legal Order Creation

**Sub-Phase**: 3.4  
**Title**: Server-Authoritative Checkout & Legal Order Creation  
**Branch**: `phase-3`  
**Starting HEAD**: `1f9596c3c46742a1318e31d007a82916900903d5`  
**Quality Status**: 🟢 100% VERIFIED

---

## Scope

This sub-phase builds the complete, authenticated checkout pipeline before PayTR payment integration. It enforces that:

- Only authenticated customers may reach `/checkout` (guest checkout is forbidden).
- All prices, shipping amounts, stock availability, and discounts are computed server-side.
- Legal consent is explicit, immutable, and stored per-order.
- Inventory reservations are atomically created with 40-minute TTL.
- The payment boundary is rendered but no card form is shown (PayTR iframe arrives in 3.5).

---

## Deliverables

### Database Migration
**`supabase/migrations/20260828040000_phase3_checkout_order_schema.sql`**

- Seeded legal content pages and sections for `preliminary_info` and `distance_sales` contract types.
- `public.calculate_checkout_quote(p_customer_id, p_channel, p_currency, p_destination_country, p_items)` — STABLE SECURITY DEFINER function:
  - Evaluates physical stock minus active unexpired reservations.
  - Returns authoritative unit prices in integer minor units (kuruş).
  - Resolves dynamic shipping rate via Phase 3.3 shipping engine.
- `public.create_checkout_order(...)` — SECURITY DEFINER atomic RPC:
  - `SELECT ... FOR UPDATE` pessimistic locking (sorted by `id` to prevent deadlocks).
  - Creates order, order_items, inventory_reservations (40 min TTL), address snapshots, and legal acceptance snapshots in a single transaction.
  - Enforces `chk_orders_total_integrity` constraint: `total = subtotal + shipping - discount`.

### Edge Functions
| Function | Description |
|---|---|
| `checkout-quote` | Authenticated; validates JWT, calls `calculate_checkout_quote` RPC |
| `create-checkout-order` | Authenticated; validates JWT, calls `create_checkout_order` RPC |

### Client Domain Layer
- `src/entities/order/types.ts` — Extended with checkout quote and order creation contracts.
- `src/entities/order/api/order-repository.ts` — Client repository with live RPC calls and deterministic mock simulators.
- `src/entities/order/index.ts` — Barrel export.

### Checkout UI
Multi-step checkout page at `/checkout` with 5 defined steps:

| Step | Description |
|---|---|
| 1 | Teslimat Adresi — saved address card selection with add-new modal |
| 2 | Fatura Adresi — same-as-delivery checkbox or independent selection |
| 3 | Kargo & Teslimat — server-quoted shipping with free shipping detection |
| 4 | Sipariş Özeti & Yasal Onaylar — item breakdown, KDV-inclusive badge, explicit legal checkboxes |
| 5 | Ödeme Sınırı — 40-min reservation countdown, PayTR placeholder (no card form) |

Checkout components:
- `CheckoutStepper.tsx` — progress indicator
- `AddressSelectionStep.tsx` — address cards with add-new modal
- `OrderSummaryStep.tsx` — item thumbnails, unit/line minor unit display
- `LegalConsentStep.tsx` — modal previews of Ön Bilgilendirme + Mesafeli Satış
- `PaymentBoundaryStep.tsx` — reservation timer, Phase 3.5 PayTR mount point

### Legal Policy Pages
- `/policies/preliminary-info` — Ön Bilgilendirme Formu (6502 sayılı Kanun)
- `/policies/distance-sales` — Mesafeli Satış Sözleşmesi

Both pages fetch content from CMS (`preliminary_info` / `distance_sales` slugs) with statutory fallback sections.

### Account Orders Pages
- `/account/orders` — Customer order list with status badges and item snapshots.
- `/account/orders/:orderId` — Order detail with tracking link, item breakdown, shipping/billing address snapshots, and discount display.

---

## Security Properties

| Property | Implementation |
|---|---|
| Guest checkout blocked | `CustomerAuthGuard` redirects to `/?auth_required=true&return_to=/checkout` |
| Server pricing | Browser sends only `variant_id + quantity + destination_country + channel`; all prices resolved server-side |
| Channel trust | Wholesale channel rejected unless `customer_profile.wholesale_approved = true` |
| Oversell prevention | `SELECT ... FOR UPDATE` on variant rows within atomic transaction |
| Legal immutability | Full text snapshot stored in `order_legal_acceptances` at order creation time |
| No card data | Payment step renders placeholder only; no card inputs exist in DOM |

---

## Test Coverage

| Suite | Tests | Status |
|---|---|---|
| `tests/unit/order/order-repository.test.ts` | 6 | ✅ PASS |
| `tests/unit/functions/edge-functions.test.ts` | 10 (extended) | ✅ PASS |
| `tests/component/site/checkout-page.test.tsx` | 4 | ✅ PASS |
| `tests/component/site/checkout-subcomponents.test.tsx` | 5 | ✅ PASS |
| `tests/component/site/account-orders-page.test.tsx` | 6 | ✅ PASS |
| `tests/component/site/policy-pages-legal.test.tsx` | 4 | ✅ PASS |
| `supabase/tests/database_security.sql` | 135 (15 new assertions) | ✅ PASS |

**Overall coverage**: Statements 95.54% · Branches 80.17% · Functions 84.29% · Lines 95.54%

---

## Verification Gate Results

```
npm run check:repo     → ✅ 0 secrets leaked
npm run check:lines    → ✅ All files ≤ 600 lines
npm run lint           → ✅ 0 errors, 0 warnings
npm run typecheck      → ✅ 0 TypeScript errors
npm run test:coverage  → ✅ All thresholds met (≥95% statements, ≥80% branches)
npm run build          → ✅ 1821 modules, built in 5.98s
```

---

## Business Rules Enforced

- **KDV-inclusive**: Prices include VAT. `tax_included = true`. UI displays "KDV Dahildir". Tax is never double-added.
- **Minor units**: All financial amounts are `BIGINT` integer kuruş. No floating-point arithmetic.
- **Reservation TTL**: 40 minutes. PayTR timeout is 30 minutes (reservation > payment timeout by design).
- **Legal documents**: Both *Ön Bilgilendirme Formu* and *Mesafeli Satış Sözleşmesi* must be explicitly checked before order creation. Unchecked state disables submit button.
- **Cart cleared** atomically after successful order creation on client side.

---

## Routes Added

| Route | Component | Auth |
|---|---|---|
| `/checkout` | `CheckoutPage` | Required |
| `/account/orders` | `AccountOrdersPage` | Required |
| `/account/orders/:orderId` | `AccountOrderDetailPage` | Required |
| `/policies/preliminary-info` | `PreliminaryInfoPolicyPage` | Public |
| `/policies/distance-sales` | `DistanceSalesPolicyPage` | Public |

---

## Next Phase

**Phase 3.5** — PayTR Token API & Inline iFrame:
- Mount `PayTRPaymentFrame` inside `PaymentBoundaryStep`.
- Edge Function `paytr-token` generates signed token.
- Reservation expiry enforced before token generation.
