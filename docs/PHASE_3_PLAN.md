# Phase 3 Master Implementation Plan: Commerce, PayTR, Customer Auth & Logistics

This document defines the complete roadmap, sub-phase specifications, dependency graph, manual checkpoints, and green-gate criteria for **Phase 3 (Customer Auth, PayTR Commerce, Real Orders & Logistics)**.

---

## 1. Phase 3 Architecture & Flow Overview

```
                                  ┌────────────────────────────────────────┐
                                  │          Storefront & Checkout         │
                                  └───────────────────┬────────────────────┘
                                                      │
                            ┌─────────────────────────┴─────────────────────────┐
                            │                                                   │
                  (Google OAuth Flow)                                (Checkout Initiation)
                            │                                                   │
                            ▼                                                   ▼
                 Supabase Auth Service                               Supabase Edge Functions
                 (Customer Profiles)                                  - `create-paytr-token`
                            │                                         - `paytr-callback`
                            │                                         - `paytr-refund`
                            ▼                                                   │
   ┌────────────────────────────────────────────────────────────────────────────┴───────────────────────────┐
   │                                        Supabase PostgreSQL 15                                         │
   │  ├── Commerce Schema: orders, order_items, payment_transactions, refund_records                       │
   │  ├── Logistics Schema: shipping_zones, shipping_countries, shipping_rates                             │
   │  ├── Customer Schema: customer_profiles, customer_addresses                                           │
   │  └── Security & Audit: RLS per customer, append-only triggers, immutable purchase snapshots           │
   └────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Phase 3 Sub-Phase Breakdown (Phases 3.0 – 3.11)

---

### Phase 3.0: Documentation & Baseline Reconciliation (CURRENT)
- **Objective**: Align all canonical architectural documents, ADRs, operational guides, and Phase 2 closure reports with finalized Phase 3 product decisions.
- **Scope**:
  - Reconcile `docs/ARCHITECTURE.md`, `docs/ADR.md`, `docs/ECOMMERCE.md`, `docs/ADMIN.md`, `docs/SECURITY.md`, `docs/STOREFRONT_COMMERCE_CONTRACT.md`.
  - Record Final Phase 2 Green Gate closure (HEAD: `f3ea6cd17bebf2b0d05dda8e85a298b37b62b095`, CI Run #30 Success).
  - Create `docs/PAYMENTS.md`, `docs/ORDERS.md`, `docs/CUSTOMER_AUTH.md`, `docs/SHIPPING.md`, `docs/INTEGRATIONS.md`, `docs/PHASE_3_PLAN.md`.
  - Fix local file URLs to repository-relative markdown links.
- **Out of Scope**: Source code modifications, migrations, or backend functions.
- **Dependencies**: Verified Phase 2 baseline.
- **Green Gate Criteria**: Clean line limit checks, repository safety, zero lint/type errors, passing Vitest suite, clean Vite build.

---

### Phase 3.1: Customer Authentication & Profile Subsystem
- **Objective**: Implement customer authentication using Supabase Auth with Google OAuth, guest checkout blocking, and profile/address management.
- **Scope**:
  - Add migrations for `customer_profiles` and `customer_addresses` with strict customer RLS.
  - Build `CustomerAuthModal` and `/auth/callback` handler.
  - Implement cart persistence across Google OAuth redirect cycle.
  - Isolate customer auth state from Admin RBAC (`admin_users`).
- **Out of Scope**: Payment processing, order placement.
- **Dependencies**: Phase 3.0.
- **Manual Checkpoint**: Google Cloud Console OAuth client configuration.
- **Green Gate Criteria**: Unit tests for customer auth store, address validation, and customer RLS policies.

---

### Phase 3.2: Database Schema for Commerce & Logistics
- **Objective**: Deploy relational PostgreSQL schema for orders, order items, payment transactions, refunds, shipping zones, and shipping rates.
- **Scope**:
  - Migration for `orders` and `order_items` with immutable snapshots and JSONB addresses.
  - Migration for `payment_transactions` and `refund_records`.
  - Migration for `shipping_zones`, `shipping_countries`, and `shipping_rates`.
  - Database triggers for `updated_at` timestamps and RLS policies.
- **Out of Scope**: Frontend UI wiring, Edge Functions.
- **Dependencies**: Phase 3.1.
- **Green Gate Criteria**: Static DB preflight scanner pass, valid hexadecimal UUIDs, pgTAP assertions for new tables and RLS.

---

### Phase 3.3: Global Shipping Architecture & Admin Management
- **Objective**: Build the `/admin/shipping` management module and storefront shipping fee calculation adapter.
- **Scope**:
  - Admin UI for Shipping Zones, Country activation, Rate rules, and Free shipping thresholds.
  - Admin Shipping Repository (`admin-shipping-repository.ts`).
  - Storefront shipping fee calculation helper respecting active zones and free-shipping thresholds.
- **Out of Scope**: Live payment tokens.
- **Dependencies**: Phase 3.2.
- **Green Gate Criteria**: Admin CRUD tests for shipping zones/rates, a11y audit on shipping modals.

---

### Phase 3.4: Server-Authoritative Pricing & Cart Checkout Engine
- **Objective**: Implement server-side cart validation and authoritative order calculation in Supabase Edge Functions.
- **Scope**:
  - Edge Function endpoint to validate cart items, check stock, verify wholesale MOQ, and calculate KDV-inclusive totals.
  - Safe monetary calculations using integer minor units or fixed-point arithmetic.
  - Creation of draft orders in PostgreSQL with status `pending_payment`.
- **Out of Scope**: PayTR API call.
- **Dependencies**: Phase 3.3.
- **Green Gate Criteria**: Vitest unit tests verifying price recalculation, MOQ enforcement, and zero trust in client prices.

---

### Phase 3.5: PayTR Payment Integration — Token API & Inline iFrame
- **Objective**: Implement server-side PayTR token request and embed the inline iFrame in storefront checkout.
- **Scope**:
  - Supabase Edge Function `create-paytr-token` building HMAC-SHA256 hash and requesting PayTR token.
  - Storefront checkout component mounting PayTR iFrame (`no_installment = 1`).
  - Graceful loading skeleton and iframe error boundary.
- **Out of Scope**: Webhook handling.
- **Dependencies**: Phase 3.4.
- **Manual Checkpoint**: PayTR test merchant credentials configured in Supabase Edge Secrets.
- **Green Gate Criteria**: Mock adapter tests for token generation, valid hash creation.

---

### Phase 3.6: PayTR Server-to-Server Callback & Webhook Verification
- **Objective**: Implement the authoritative server-to-server webhook callback handler.
- **Scope**:
  - Supabase Edge Function `paytr-callback` listening for PayTR POST notifications.
  - Cryptographic HMAC-SHA256 signature verification using `merchant_key` and `merchant_salt`.
  - Idempotent order status update to `paid` in PostgreSQL.
  - Inventory decrement and transactional event trigger.
  - Return exact plain-text `"OK"`.
- **Out of Scope**: Email dispatch implementation (handled in Phase 3.10).
- **Dependencies**: Phase 3.5.
- **Green Gate Criteria**: Unit and integration tests for HMAC verification, replay attack prevention, and `"OK"` response contract.

---

### Phase 3.7: Storefront Checkout Flow & Order Review
- **Objective**: Assemble the complete end-to-end customer checkout journey at `/checkout`.
- **Scope**:
  - Multi-step checkout UI: Customer auth check -> Address entry -> Shipping method -> Legal contracts acceptance (`Mesafeli Satış Sözleşmesi`) -> Order summary -> PayTR iFrame.
  - Non-authoritative result pages (`/checkout/success`, `/checkout/fail`).
  - Clear customer messaging that success page is informational while server callback finalizes payment.
- **Out of Scope**: Admin fulfillment UI.
- **Dependencies**: Phase 3.6.
- **Green Gate Criteria**: Component tests for checkout steps, form validation, and responsive mobile testing.

---

### Phase 3.8: Admin Orders & Fulfillment Management
- **Objective**: Build the back-office Order Management module at `/admin/orders`.
- **Scope**:
  - Paginated orders grid with filters (Status, Date, Channel, Search).
  - Order Detail Drawer showing customer details, immutable line items, totals, addresses, and payment references.
  - Fulfillment actions: Status transitions (`processing`, `shipped`, `delivered`, `cancelled`), shipping carrier assignment, and tracking code entry.
  - Invoice metadata scaffolding viewer.
- **Out of Scope**: Refund execution (handled in Phase 3.9).
- **Dependencies**: Phase 3.7.
- **Green Gate Criteria**: Admin order repository tests, status transition tests, WCAG 2.1 AA focus trap verification.

---

### Phase 3.9: Admin Payments & Server-Side Refunds
- **Objective**: Build `/admin/payments` and implement server-authoritative full and partial refunds.
- **Scope**:
  - Real-time PayTR transaction ledger with payment statuses.
  - Supabase Edge Function `paytr-refund` executing PayTR Return API calls.
  - Full and partial refund modal with maximum balance validation.
  - Immutable audit logging for every refund action in `admin_audit_logs`.
- **Out of Scope**: Email dispatch.
- **Dependencies**: Phase 3.8.
- **Green Gate Criteria**: Refund boundary tests, balance calculation tests, audit log insertion tests.

---

### Phase 3.10: Transactional Email Infrastructure
- **Objective**: Implement transactional email sending for order and payment events via Gmail API / verified SMTP provider.
- **Scope**:
  - Sender configuration for `yulgen995@gmail.com`.
  - Clean HTML email templates for: Order Received & Paid, Payment Failed, Order Shipped (with Tracking Link), Order Delivered, and Refund Confirmed.
  - Asynchronous email dispatch from Supabase Edge Functions.
- **Out of Scope**: Marketing / campaign newsletters.
- **Dependencies**: Phase 3.9.
- **Manual Checkpoint**: Gmail API credentials / service configuration.
- **Green Gate Criteria**: Email template rendering tests, mock dispatch tests.

---

### Phase 3.11: Phase 3 Final Quality Gate, Security Audit & E2E Testing
- **Objective**: Execute full end-to-end testing, accessibility audit, database security assertions, and produce final Phase 3 master report.
- **Scope**:
  - Expand pgTAP database security assertions for orders, payments, refunds, and shipping.
  - Playwright E2E test suite covering full customer checkout with mock PayTR and Admin fulfillment workflows.
  - Axe-Core accessibility audit across all new checkout and admin screens.
  - Production build verification and final documentation update.
- **Dependencies**: Phases 3.0 – 3.10.
- **Green Gate Criteria**: 100% green tests, 0 lint/type diagnostics, clean production build, 0 secret leaks.
