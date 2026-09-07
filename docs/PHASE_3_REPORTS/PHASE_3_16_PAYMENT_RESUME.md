# Phase 3.16 Execution Report: Recoverable Pending Payment & Cart Lifecycle

## 1. Executive Summary

- **Phase Objective**: Implement a robust, secure, and recoverable payment resume architecture for pending checkout orders; prevent premature cart clearing; ensure server-authoritative resume validation (ownership, order status, financial eligibility, non-cancelled, unexpired reservation); handle reservation expiration safely with typed state; preserve recovery path on payment failure; and ensure cart is cleared strictly upon authoritative backend payment verification.
- **Branch**: `phase-3` (strictly isolated; `main` remains frozen).
- **Quality Gate Outcome**:
  - **Unit & Integration Tests**: 100% passing (134 test suites, 830 tests passed).
  - **Overall Code Coverage**: Meets and exceeds required thresholds across all modules.
  - **File Size Compliance (Rule 5)**: All 438 source files comply with the 600-line hard limit.
  - **Secret Hygiene (Rule 6)**: 0 exposed secrets, passed `npm run check:repo`.
  - **TypeScript & ESLint**: 0 errors, 0 warnings.
  - **Production Build**: Clean production bundle generated via `npm run build`.

---

## 2. Problem Statement & Root Cause

Previously in the checkout flow:
1. When a customer completed step 4 (Review & Submit), `create_checkout_order` was called, creating a `pending_payment` order.
2. The UI immediately called `cartStore.clear()`, wiping the customer's cart before PayTR was even initialized or paid.
3. If the user refreshed, closed the tab, had a network disconnection, or experienced payment failure at PayTR:
   - A `pending_payment` order existed in the database with an active 15-minute stock reservation.
   - The user was left with an empty cart.
   - There was no way for the customer to resume or retry payment for that pending order.
   - If the user re-added items and checked out again, a duplicate pending order was created, holding double inventory reservations.
4. On the Account Orders page, pending orders had no action button to complete payment.

---

## 3. Technical Implementation Details

### Goal 1 — Server-Authoritative Resume Evaluation (`check_payment_resume_eligibility` RPC)
- **Migration**: `supabase/migrations/20260830020000_phase3_recoverable_payment_schema.sql`
- **Security & Authorization**:
  - Validates `auth.uid()` against `order.customer_id`. Other customers are strictly denied (`UNAUTHORIZED`).
  - Validates commerce kill switch (`checkout_enabled`). If disabled, returns `CHECKOUT_DISABLED`.
  - Validates order payment status:
    - If already `paid`: returns `ALREADY_PAID`.
    - If `cancelled`: returns `CANCELLED`.
    - If `refunded` or `partially_refunded`: returns `NOT_RESUMABLE`.
    - If status is not `pending_payment`: returns `INVALID_STATUS`.
  - Validates stock reservation expiration:
    - Checks active reservations in `stock_reservations` for the order.
    - If `expires_at <= now()` or older than payment timeout: returns `RESERVATION_EXPIRED`.
  - When all checks pass: returns `eligible: true, reason: "OK"`, alongside order details (`order_number`, `total_amount`, `currency`, `expires_at`, `remaining_seconds`).

### Goal 2 — PayTR Token Generation Guard (`create-paytr-token`)
- Updated `supabase/functions/create-paytr-token/index.ts`:
  - Before generating PayTR merchant token, checks active stock reservations for the order.
  - If reservations have expired (`expires_at <= now()`), denies token generation with HTTP 410 `RESERVATION_EXPIRED` (`Sipariş için ayrılan stok rezervasyon süresi dolmuştur. Lütfen yeni bir sipariş oluşturun.`).
  - Prevents blind payments on expired orders or outdated prices.

### Goal 3 — Cart Lifecycle & Non-Destructive Recovery
- Updated `src/shared/stores/cart-store.ts`:
  - Added `PendingCheckoutInfo` interface (`orderId`, `orderNumber`, `createdAt`).
  - Stored in `localStorage` under `vazo_pending_checkout` to survive tab closures and page refreshes.
  - Added `getPendingOrder()`, `setPendingOrder()`, and `clearPendingOrder()`.
- Updated `src/site/pages/CheckoutPage.tsx`:
  - Removed immediate `clearCart()` from pending order creation.
  - Calls `cartStore.setPendingOrder(order.id, order.orderNumber)` upon order creation.
  - On mount: checks for pending order; queries `getPaymentResumeEligibility(pendingOrder.orderId)`. If eligible, automatically sets `orderId` and resumes Step 5 (Payment), preventing duplicate pending order creation.
  - If reservation is expired or cancelled, clears pending order reference while leaving cart items intact so the customer can review and re-order.

### Goal 4 — Authoritative Cart Clearing on Payment Success
- Updated `src/site/pages/payment/PaymentSuccessPage.tsx`:
  - A PayTR URL redirect is NOT treated as payment authority.
  - Queries `orderRepository.getOrder(orderId)` or relies on backend verification.
  - Cart and pending checkout state (`cartStore.clear()`, `cartStore.clearPendingOrder()`) are cleared **strictly after** backend confirms `fetchedOrder.status === 'paid'`.

### Goal 5 — Dedicated Payment Resume Route (`/payment/resume/:orderId`)
- Added `src/site/pages/payment/PaymentResumePage.tsx`:
  - Route: `/payment/resume/:orderId` registered in `src/app/router/index.tsx`.
  - Auth gate: prompts customer login if not authenticated.
  - Server validation: queries `orderRepository.getPaymentResumeEligibility(orderId)`.
  - Safely handles edge cases:
    - **Expired reservation**: Displays informative warning with button to return to cart or shop.
    - **Already paid**: Displays notice with button to view order or account.
    - **Cancelled / Unauthorized**: Displays clear Turkish error and navigation options.
  - **Payment Execution**: Reuses existing `PaymentBoundaryStep` component without duplicating provider logic.

### Goal 6 — Account Orders Integration
- Updated `src/site/pages/AccountOrderDetailPage.tsx`:
  - Queries `orderRepository.getPaymentResumeEligibility(order.id)` when order status is `pending_payment`.
  - If server says resumable: renders prominent "Ödemeyi Tamamla" action button routing to `/payment/resume/${order.id}`.
  - Never shown for `paid`, `cancelled`, or `refunded` orders.

### Goal 7 — Failure Recovery Path
- Updated `src/site/pages/payment/PaymentFailurePage.tsx`:
  - "Ödemeyi Tekrar Dene" button directs to `/payment/resume/${orderId}` instead of resetting checkout and creating a duplicate pending order.

---

## 4. Test Verification Summary

Integration test suite `tests/integration/payment-resume-cart-lifecycle.test.ts` covers all required scenarios:
1. **Pending order survives page refresh** (`cartStore.getPendingOrder()` persists).
2. **Resume works for authenticated order owner** (`eligible: true`).
3. **Other customer denied** (`eligible: false, reason: "UNAUTHORIZED"`).
4. **Already paid order denied** (`eligible: false, reason: "ALREADY_PAID"`).
5. **Cancelled order denied** (`eligible: false, reason: "CANCELLED"`).
6. **Reservation expiry handled with safe typed state** (`RESERVATION_EXPIRED`, PayTR token generation returns 410).
7. **Success URL alone does not clear cart** (`status: 'pending_payment'` leaves cart intact).
8. **Verified paid state authoritatively clears cart** (`status: 'paid'` triggers `cartStore.clear()`).
9. **Duplicate resume attempts are safe and idempotent**.

---

## 5. File Size & Quality Audit

All touched files adhere to Rule 5 (< 600 lines):
- `src/site/pages/CheckoutPage.tsx`: 556 lines
- `src/site/pages/payment/PaymentResumePage.tsx`: 283 lines
- `src/site/pages/AccountOrderDetailPage.tsx`: 365 lines
- `src/entities/order/api/order-repository.ts`: 464 lines
- `src/entities/order/types.ts`: 468 lines
- `src/shared/stores/cart-store.ts`: 296 lines
- `tests/integration/payment-resume-cart-lifecycle.test.ts`: 326 lines
