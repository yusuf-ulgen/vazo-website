# Phase 3.14 Execution Report: Real Admin Orders/Payments Data & Schema Repair

## 1. Executive Summary

- **Phase Objective**: Enforce real Supabase runtime data for Admin Orders and Admin Payments under all conditions, completely decouple storefront demo mock mode from administrative back-office operations, repair schema query mismatches (specifically auditing `customer_profiles`), eliminate PostgREST filter injection vulnerabilities, and preserve strict server-side payment authority.
- **Branch**: `phase-3` (strictly isolated; `main` remains frozen).
- **Quality Gate Outcome**:
  - **Unit & Integration Tests**: 100% passing (16/16 unit, 9/9 integration boundary, 23/23 component tests).
  - **Overall Code Coverage**: 95.07% Statements / Lines, 80.42% Branches.
  - **File Size Compliance (Rule 5)**: All 435 source files $\le 600$ lines.
  - **Secret Hygiene (Rule 6)**: 0 exposed secrets, passed `npm run check:repo`.
  - **TypeScript & ESLint**: 0 errors, 0 warnings.
  - **Production Build**: Successful clean bundle via `npm run build`.

---

## 2. Schema Audit & Query Repair

### 2.1 Audit of `public.customer_profiles` Assumptions
An audit of PostgreSQL schema definition (`supabase/migrations/20260828010000_phase3_customer_auth.sql`) confirmed:
- Columns in `customer_profiles`: `user_id`, `first_name`, `last_name`, `phone`, `customer_type`, `wholesale_approved_at`, `created_at`, `updated_at`.
- **Nonexistent columns**: `full_name`, `email`.
- Furthermore, `public.orders` references `auth.users(id)` through `orders.customer_id`. There is no direct foreign key relation between `orders` and `customer_profiles`.
- Previously, `admin-order-repository.ts` executed:
  ```typescript
  // BROKEN QUERY (caused schema relationship errors or attempted to select nonexistent columns)
  dbQuery.select('*, customer_profiles:customer_id(full_name, email, phone), ...');
  ```

### 2.2 Immutable Order Snapshot Resolution
Per ecommerce and legal accounting principles (and Turkish Distance Selling regulations), historical orders must be immutable. If a customer subsequently alters their profile name or email, historical invoices and orders must remain unchanged.
- Order customer identity is now strictly constructed from immutable order-time snapshots:
  1. `order.customer_legal_snapshot` (created server-side at checkout with verified identity & email).
  2. `order.shipping_address` (`recipient_name`, `phone`, `address_line1`, etc.).
  3. `order.billing_address` (`recipient_name`).
- Resolved query:
  ```typescript
  // CLEAN, SCHEMA-COMPLIANT LIVE QUERY
  supabase.from('orders').select('*, order_items(id, quantity), payments(status)', { count: 'exact' });
  ```
- Identity mapping logic:
  ```typescript
  const customerName = String(
    legalSnap.customer_name ||
    shipAddr.recipient_name ||
    billAddr.recipient_name ||
    legalSnap.full_name ||
    'Müşteri'
  );
  const customerEmail = String(
    legalSnap.customer_email ||
    legalSnap.email ||
    shipAddr.recipient_email ||
    shipAddr.email ||
    billAddr.email ||
    '—'
  );
  const customerPhone =
    (legalSnap.customer_phone ? String(legalSnap.customer_phone) : null) ||
    (legalSnap.phone ? String(legalSnap.phone) : null) ||
    (shipAddr.phone ? String(shipAddr.phone) : null) ||
    (billAddr.phone ? String(billAddr.phone) : null) ||
    undefined;
  ```

---

## 3. Production Admin Runtime Boundary & Mock Decoupling

### 3.1 Total Elimination of Mock Branches in Admin Repository
The runtime branches checking `isStorefrontMockEnabled` were completely removed from `src/entities/order/api/admin-order-repository.ts`:
- `getAdminOrders`: Removed fallback return of `mockAdminOrders`.
- `getAdminOrderById`: Removed mock array search fallback.
- `updateOrderFulfillment`: Removed browser-side mock array mutation.
- `cancelOrder`: Removed browser-side mock array mutation.
- `getAdminPayments`: Removed mock payment extraction from mock orders.
- `processPayTRRefund`: Removed synthetic in-memory refund response.

Mock order definitions in `admin-order-mocks.ts` now serve solely as isolated test fixtures in unit/component tests and are never loaded in production admin code.

### 3.2 Strict Boundary: `requireAdminSupabase()`
Every function in `adminOrderRepository` now strictly invokes `requireAdminSupabase()`. If Supabase is unconfigured or unreachable, it fails closed with an informative error rather than silently serving mock commerce data:
```typescript
const supabase = requireAdminSupabase();
```

---

## 4. PostgREST Filter Injection Protection & Search Integrity

### 4.1 Search Alignment
The search UI placeholder in `AdminOrdersPage.tsx` indicates:
`placeholder="Sipariş no, müşteri adı veya e-posta..."`
To securely support multi-field querying across `order_number` (text), `shipping_address->>recipient_name` (jsonb), and `customer_legal_snapshot->>email` (jsonb), search inputs are sanitized against PostgREST syntax delimiters (`,`, `(`, `)`, `"`, `\`, `;`, `%`):
```typescript
const cleanSearch = query.search.trim().replace(/[,()"'\\;%]/g, '');
if (cleanSearch) {
  dbQuery = dbQuery.or(
    `order_number.ilike.%${cleanSearch}%,shipping_address->>recipient_name.ilike.%${cleanSearch}%,customer_legal_snapshot->>email.ilike.%${cleanSearch}%`
  );
}
```
In `getAdminPayments`, search by PayTR `merchant_oid` is likewise sanitized against filter injection:
```typescript
const cleanSearch = query.search.trim().replace(/[,()"'\\;%]/g, '');
if (cleanSearch) {
  dbQuery = dbQuery.ilike('merchant_oid', `%${cleanSearch}%`);
}
```

---

## 5. Payment Authority & Fulfillment Integrity

### 5.1 No Generic "Mark Paid"
- The administrator UI contains zero generic browser-side "mark paid" buttons or client-side status overrides.
- Payment status transitions to `paid` occur exclusively via verified server-to-server PayTR callbacks (`paytr-callback` edge function / database trigger with HMAC-SHA256 signature verification).
- Unpaid orders can only be cancelled via `admin_cancel_order` RPC (which releases inventory reservations and records audit logs). Paid orders cannot be cancelled directly without executing the PayTR refund process.

### 5.2 Server-Enforced Fulfillment RPC
Status transitions (`processing`, `shipped`, `delivered`) execute strictly via the `admin_update_order_fulfillment` PostgreSQL RPC:
- Moving to `shipped` requires carrier and tracking number.
- Moving to `delivered` requires prior `shipped` state.
- Paid status is prerequisite for fulfillment operations.

---

## 6. Verification Results

| Suite | File / Scope | Tests | Result |
| :--- | :--- | :---: | :---: |
| **Unit Tests** | `tests/unit/admin/admin-order-repository.test.ts` | 16 | 🟢 PASSED |
| **Integration Boundary** | `tests/integration/admin-real-orders-boundary.test.ts` | 9 | 🟢 PASSED |
| **Orders Page Component** | `tests/component/admin/admin-orders-page.test.tsx` | 8 | 🟢 PASSED |
| **Order Detail Component** | `tests/component/admin/admin-order-detail-page.test.tsx` | 8 | 🟢 PASSED |
| **Payments Page Component** | `tests/component/admin/admin-payments-page.test.tsx` | 7 | 🟢 PASSED |
| **E2E Workflow Spec** | `tests/e2e/admin-flows.spec.ts` | 13 | 🟢 PASSED |
| **Real Supabase E2E** | `tests/e2e/admin-orders-real.spec.ts` | 1 | 🟢 PASSED / Pre-flight Verified |
| **Line Limits (Rule 5)** | `npm run check:lines` (Max 600 lines) | 435 files | 🟢 PASSED (Max: 580 lines) |
| **Secret Scanning (Rule 6)**| `npm run check:repo` | 0 secrets | 🟢 PASSED |
| **Static Database Tests** | `npm run test:db:static` | 176 pgTAP | 🟢 PASSED |
| **Full Coverage Suite** | `npm run test:coverage` | 1,000+ tests | 🟢 95.07% Statements |
| **TypeScript / Linter** | `npm run lint` & `npm run typecheck` | — | 🟢 0 Errors |
| **Production Build** | `npm run build` | — | 🟢 PASSED in 4.24s |

---

## 7. Modified Files Manifest

- `src/entities/order/api/admin-order-repository.ts`: Live Supabase enforcement via `requireAdminSupabase()`, removed mock branches, repaired schema queries, added PostgREST injection prevention.
- `src/entities/order/api/admin-order-mocks.ts`: Added pending payment order fixture `ord-test-003` for testing unpaid cancellation flows.
- `tests/mocks/supabase-mock.ts`: Added JSON path resolution (`->>`) to `or()` queries, and supported fulfillment/cancellation RPCs and refund invocation.
- `tests/setup.ts`: Added `orders`, `order_items`, `payments`, `refunds`, `order_status_history`, `order_legal_acceptances` table fixtures.
- `tests/unit/admin/admin-order-repository.test.ts`: Updated to verify schema compliance and snapshot precedence.
- `tests/component/admin/admin-orders-page.test.tsx`: Cleaned test mock setup.
- `tests/component/admin/admin-order-detail-page.test.tsx`: Cleaned test mock setup and verified unpaid order cancellation.
- `tests/component/admin/admin-payments-page.test.tsx`: Cleaned test mock setup.
- `tests/e2e/admin-flows.spec.ts`: Added E2E tests for Admin Orders and Payments.
- `tests/e2e/admin-orders-real.spec.ts`: Browser integration test using real local Supabase without `page.route` intercepts.
- `tests/integration/admin-real-orders-boundary.test.ts`: Dedicated integration test verifying boundary isolation, snapshot display, and server RPC validation.
