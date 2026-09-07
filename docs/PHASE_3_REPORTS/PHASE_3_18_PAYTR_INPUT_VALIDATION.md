# Phase 3.18 Execution Report: PayTR Token Input & Customer Data Integrity

## 1. Executive Summary

- **Phase Objective**: Enforce strict customer data and input integrity before initiating PayTR payments. Ensure that fake/dummy fallback customer identity and contact information (`musteri@vazostudio.com`, `5550000000`, `Müşteri`, `Değerli Müşterimiz`, invented addresses) are never sent to PayTR. Implement rigorous server-side pre-validation in the edge function (`create-paytr-token`) and database RPC (`create_checkout_order`). Enforce trusted server origin safety (`APP_ORIGIN`). If provider token generation fails, transition the payment attempt truthfully to `status = 'failed'` instead of leaving a misleading permanent `initiated` state. Direct customers clearly via UI to update their address/profile if validation fails. Reconfirm currency (`TRY` -> `TL`), minor units, single installment, and preserve proven HMAC-SHA256 cryptography.
- **Branch**: `phase-3` (strictly isolated; `main` remains frozen).
- **Quality Gate Outcome**:
  - **Unit & Integration Tests**: 136 test files, 854 tests passed (100% pass rate).
  - **File Size Compliance (Rule 5)**: All 441 source files strictly adhere to the 600-line hard limit.
  - **Secret Hygiene (Rule 6)**: 0 exposed secrets or sensitive patterns detected (`check:repo` PASSED).
  - **Static DB Tests**: 176 planned pgTAP assertions verified in SQL migrations.
  - **TypeScript & ESLint**: 0 errors, 0 warnings.
  - **Production Build**: Clean production bundle generated via `vite build`.

---

## 2. Invariants & Architecture Hardening

### Absolute Invariant: Real Customer & Address Data (Zero Dummy Fallbacks)
- **Eliminated Fake Fallbacks**:
  - Removed all fallback code that defaulted empty or missing customer data to synthetic strings such as `musteri@vazostudio.com`, placeholder phone `5550000000`, or dummy name `Müşteri` / `Değerli Müşterimiz`.
- **Strict Server Pre-Validations (`create-paytr-token` & `create_checkout_order`)**:
  1. **Authenticated User**: Active JWT session strictly required; user ID verified against order ownership.
  2. **Order Ownership**: `order.customer_id === user.id` (HTTP 403 `Bu siparişe erişim yetkiniz bulunmamaktadır.`).
  3. **Order Status**: `order.status === 'pending_payment'` (HTTP 400 if order is already paid, cancelled, or processing).
  4. **Kill Switch**: `checkout_enabled === true` verified from `public.site_settings` commerce config (HTTP 403 `Ödeme ve sipariş sistemi şu anda kapalıdır.`).
  5. **Stock Reservation & Payment Expiry**: Checks `inventory_reservations` and `order.metadata.payment_expires_at`. If expired, returns HTTP 410 with `RESERVATION_EXPIRED`.
  6. **Positive Total & Currency**: `total_minor > 0` and currency is one of `['TRY', 'USD', 'EUR', 'GBP']`.
  7. **Real Email**: Validated by email regex and rejects placeholder patterns (`musteri@vazostudio.com`, `placeholder`, `test@test.com`) with code `INVALID_CUSTOMER_EMAIL`. Turkish characters sanitized per PayTR specification.
  8. **Real Recipient Name**: `recipient_name.length >= 2`, rejects dummy names (`Müşteri`, `Değerli Müşterimiz`) with code `INVALID_RECIPIENT_NAME`.
  9. **Real Phone**: Sanitized to digits; minimum 10 digits; rejects fake patterns like `5550000000`, `1234567890`, or repetitive digit strings (`/^(\d)\1+$/`) with code `INVALID_PHONE_NUMBER`.
  10. **Real Shipping Address**: `address_line1.length >= 5`, valid non-empty `city`, and full composite address >= 10 chars with code `INVALID_SHIPPING_ADDRESS`.
  11. **Non-Empty Basket**: `order_items.length > 0`.

### Origin Safety
- **Trusted Server Config (`APP_ORIGIN`)**:
  - Success and failure URLs (`merchant_ok_url`, `merchant_fail_url`) are constructed exclusively from server-side `APP_ORIGIN`. The browser cannot choose or manipulate redirect URLs.
  - In production / non-test mode (`PAYTR_TEST_MODE !== '1'`), if `APP_ORIGIN` is missing from the environment, token generation immediately fails with HTTP 500 (`Sunucu yapılandırma hatası: APP_ORIGIN tanımlanmamış.`).
  - URL format and protocol (`http:` / `https:`) are validated to eliminate open redirects.

### Truthful Payment Attempt State Transitions
- **Fail-Closed State on Provider Rejection**:
  - Payment records begin in `initiated` via `initiate_order_payment`.
  - If PayTR API rejects the token request (`status !== 'success'`), the payment record in `public.payments` is immediately updated to:
    - `status: 'failed'`
    - `failure_code: 'PAYTR_TOKEN_REJECTED'`
    - `failure_message_safe: paytrData.reason`
    - `failed_at: new Date().toISOString()`
  - If a network error or DNS resolution failure occurs while contacting PayTR, the payment record is updated to:
    - `status: 'failed'`
    - `failure_code: 'PAYTR_NETWORK_ERROR'`
    - `failure_message_safe: 'PayTR servisine bağlanırken ağ hatası oluştu.'`
    - `failed_at: new Date().toISOString()`
  - Prevents stale, misleading `initiated` rows in the database and audit dashboards.

### Storefront Customer UI Guidance
- **`PaymentBoundaryStep` Navigation Action**:
  - When customer data validation fails (e.g. invalid phone, missing address details, or unverified email), the error card renders a direct action button:
    - **"Adres & Profil Bilgilerini Güncelle"** linking directly to `/account/addresses`.
  - Turkish error messages provide actionable instructions for the customer to correct their profile or address before retrying payment.

### Reconfirmed Invariants
- `TRY` mapped to `TL` for PayTR provider specification.
- Authoritative amount in minor units (`kuruş`), passed as server-calculated integer string.
- Server-generated alphanumeric `merchant_oid` (`VZ` + order number + unique timestamped suffix).
- No installments (`no_installment = 1`, `max_installment = 0`).
- Proven HMAC-SHA256 signature algorithm strictly preserved without alteration.

---

## 3. Database Schema & Migration Changes

- **Migration**: `supabase/migrations/20260830040000_phase3_paytr_customer_data_integrity.sql`
  - Replaces `public.create_checkout_order` with strict validation rules.
  - Enforces real recipient name (>= 2 chars, non-dummy).
  - Enforces real street address (>= 5 chars, city present).
  - Enforces real customer email (valid email pattern, no dummy domain).
  - Enforces clean numeric phone (>= 10 digits, no `5550000000`, no repeating single-digit sequences).
  - Removes all `musteri@vazostudio.com`, `Müşteri`, and `5550000000` fallback constants.

---

## 4. Test Verification Summary

- **Integration Suite**: `tests/integration/paytr-token-input-validation.test.ts` (10 tests, 100% passing):
  1. `rejects token generation when customer phone is dummy / invalid` (passes).
  2. `rejects token generation when customer name is missing or fake (e.g. Müşteri)` (passes).
  3. `rejects token generation when customer email is placeholder / invalid` (passes).
  4. `rejects token generation when shipping address is missing or incomplete` (passes).
  5. `rejects token generation when requesting user is not the order owner` (passes).
  6. `rejects token generation when order status is not pending_payment` (passes).
  7. `rejects token generation when checkout is disabled (kill switch active)` (passes).
  8. `rejects token generation when APP_ORIGIN is missing from server configuration` (passes).
  9. `handles PayTR provider HTTP error and surfaces clear failure message` (passes).
  10. `generates PayTR token successfully when all customer and business data are valid` (passes).

---

## 5. Verification Gate Results

```bash
> npm run verify

✔ check:repo: PASSED (0 secrets leaked, safe repository)
✔ check:lines: PASSED (All 441 files <= 600 lines)
✔ lint: PASSED (0 errors, 0 warnings)
✔ typecheck: PASSED (0 TypeScript compilation errors)
✔ test:coverage: PASSED (136 test files, 854 tests passed; statements: 93.11%, lines: 93.11%)
✔ test:db:static: PASSED (176 planned pgTAP assertions verified)
✔ build: PASSED (Vite production bundle successfully generated)
```
