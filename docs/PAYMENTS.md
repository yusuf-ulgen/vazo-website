# PayTR Payment Integration & Commerce Boundary

This document defines the technical specifications, security contracts, domain abstractions, and webhook lifecycle for the **PayTR Payment Gateway** integration in the Vazo E-Commerce Platform.

---

## 1. Gateway Selection & Architecture Overview

Following [ADR-010](ADR.md#adr-010), **PayTR** is selected as the primary payment gateway for the Vazo E-Commerce platform.

### Core Payment Experience
- **Inline iFrame Integration**: The customer completes the transaction directly inside the storefront checkout view (`https://shop.monocactus.com/checkout`). The customer does not leave the storefront under normal operation.
- **Hosted Redirect Fallback**: Maintained purely as a documented emergency/fallback recovery strategy if PayTR iFrame rendering fails on unsupported legacy user agents.
- **Installment Policy**: Disabled in Phase 3 V1 (`no_installment = 1`). No installment selection UI is displayed.
- **Active Currency**: `TRY` (Turkish Lira). Future-ready for `USD`, `EUR`, and `GBP`.
- **Payment Attempts Schema**: Multiple payment attempts per order are supported via `public.payments` (`merchant_oid` unique, alphanumeric <= 64 chars).
- **Payment Event Audit**: Callback processing history is safely captured in `public.payment_events` with `event_fingerprint` deduplication and zero secret storage.

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                 Browser (Checkout Page)                                   │
│  - Displays server-calculated totals                                                      │
│  - Mounts PayTR Inline iFrame via token                                                   │
└─────────────────────────────┬─────────────────────────────────────────────────────────────┘
                              │
                    (1) POST /checkout/init
                              │
                              ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                     Supabase Edge Function: `create-paytr-token`                          │
│  - Authenticates Customer (Supabase Auth JWT)                                             │
│  - Fetches product prices from DB & re-verifies inventory + MOQ + shipping                │
│  - Generates unique `merchant_oid` (e.g. "VZ-20260828-XXXXX")                             │
│  - Builds PayTR HMAC-SHA256 hash using server secrets                                     │
│  - Calls PayTR GetToken API -> Returns `token` to browser                                 │
└─────────────────────────────┬─────────────────────────────────────────────────────────────┘
                              │
                    (2) Token Exchange
                              ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                PayTR Token API Gateway                                    │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Currency Boundary & Mapping Adapter

To ensure the core commerce domain remains clean and provider-neutral, PayTR-specific currency representations are isolated behind a boundary adapter:

| Application Currency | PayTR Currency Code | Status in Phase 3 V1 | Minor Unit Multiplier |
| :--- | :--- | :--- | :--- |
| `TRY` | `TL` | **Active (Enabled)** | 100 (1 TRY = 100 Kuruş) |
| `USD` | `USD` | Future-Ready (Disabled in V1) | 100 (1 USD = 100 Cents) |
| `EUR` | `EUR` | Future-Ready (Disabled in V1) | 100 (1 EUR = 100 Cents) |
| `GBP` | `GBP` | Future-Ready (Disabled in V1) | 100 (1 GBP = 100 Pence) |

> [!IMPORTANT]
> **No PayTR Currency Leaks**: Never scatter `TL` string literals across domain entities, UI components, or database tables. The domain strictly operates with ISO code `TRY`.

---

## 3. Server-Authoritative Token Generation (`create-paytr-token`)

When the customer clicks "Siparişi Onayla ve Öde" on `/checkout`, the browser dispatches a request to the `create-paytr-token` Supabase Edge Function:

### 3.1 Server-Side Validation Pipeline
1. **Customer Verification**: Validates Supabase Auth JWT (`auth.uid()`). Rejects unauthenticated requests.
2. **Catalog Price Re-Verification**: Queries `products` and `product_variants` directly from PostgreSQL. Ignores all prices sent in the request payload.
3. **Wholesale Verification**: If purchasing under wholesale channel, verifies `trade_applications.status = 'approved'` and enforces MOQ.
4. **Shipping Fee Calculation**: Validates the selected delivery address and retrieves authoritative shipping rates from `shipping_rates`.
5. **KDV Semantics**: Reconfirms that item prices already contain 20% KDV (`tax_included = true`).
6. **Payment Amount Calculation**:
   $$\text{payment\_amount} = (\text{subtotal} + \text{shipping\_fee}) \times 100 \quad (\text{integer minor units})$$
7. **Draft Order Insertion**: Inserts draft order and draft payment record with state `pending_payment` and generated `merchant_oid`.

### 3.2 PayTR Token Request Parameters
```typescript
interface PayTRTokenRequest {
  merchant_id: string;          // From Edge Function Secret
  user_ip: string;              // Client IP address
  merchant_oid: string;         // Unique Order ID (e.g. "VZ-20260828-94821")
  email: string;                // Customer verified email
  payment_amount: number;       // Minor units integer (e.g. 315000 for 3,150.00 TRY)
  user_basket: string;          // Base64 encoded JSON matrix [[name, unit_price, quantity]]
  no_installment: 1;            // Strictly 1 (Installments disabled)
  max_installment: 0;           // Strictly 0
  currency: 'TL';               // Provider mapped currency
  test_mode: 0 | 1;             // 1 in staging/dev, 0 in production
  merchant_ok_url: string;      // "https://shop.monocactus.com/checkout/success"
  merchant_fail_url: string;    // "https://shop.monocactus.com/checkout/fail"
  paytr_token: string;          // HMAC-SHA256 generated on server
}
```

---

## 4. Server-to-Server Callback Verification (`paytr-callback`)

The PayTR callback is the **single authoritative source of truth** for payment confirmation.

```
PayTR Server                     Supabase Edge Function (`paytr-callback`)          PostgreSQL Database
     │                                                   │                                   │
     │ 1. HTTPS POST /functions/v1/paytr-callback        │                                   │
     │    (merchant_oid, status, total_amount, hash...)  │                                   │
     ├──────────────────────────────────────────────────►│                                   │
     │                                                   │ 2. Compute Expected HMAC Hash     │
     │                                                   │ 3. Compare with incoming `hash`   │
     │                                                   │ 4. If invalid -> Return "PAYTR    │
     │                                                   │    notification failed: bad hash" │
     │                                                   │ 5. If valid: Check merchant_oid   │
     │                                                   │ 6. If already paid -> Return "OK" │
     │                                                   │ 7. If status == 'success':        │
     │                                                   │    Transition Order to 'paid'     │
     │                                                   │    Deduct variant stock           │
     │                                                   │    Trigger transactional email    │
     │                                                   ├──────────────────────────────────►│
     │                                                   │◄──────────────────────────────────┤
     │ 8. Response: "OK" (Exact Plaintext)               │                                   │
     │◄──────────────────────────────────────────────────┤                                   │
```

### 4.1 HMAC-SHA256 Verification Formula
$$\text{HashString} = \text{merchant\_oid} + \text{merchant\_salt} + \text{status} + \text{total\_amount}$$
$$\text{ExpectedHash} = \text{Base64}(\text{HMAC\_SHA256}(\text{HashString}, \text{merchant\_key}))$$

If `ExpectedHash !== incoming_hash`, the request is immediately rejected with HTTP 400.

### 4.2 Callback Idempotency Contract
- If PayTR resends a callback for an already finalized (`paid` or `failed`) order, the handler must:
  1. Verify the HMAC signature.
  2. Confirm the existing order state in PostgreSQL.
  3. **Return exact plain-text `"OK"` immediately** without re-executing stock deductions, duplicate email dispatches, or duplicate audit logs.

---

## 5. Refunds Subsystem (Full & Partial)

Refunds are processed exclusively through server-side administrative Edge Functions (`paytr-refund`):

```
Admin Browser                     Admin Backend (Edge Function)                 PayTR Refund API
     │                                         │                                      │
     │ 1. POST /admin/payments/refund          │                                      │
     │    (orderId, refundAmount, reason)      │                                      │
     ├────────────────────────────────────────►│                                      │
     │                                         │ 2. Validate Admin RBAC (is_admin())  │
     │                                         │ 3. Check Remaining Refundable Balance│
     │                                         │ 4. Build PayTR Refund HMAC Signature │
     │                                         │ 5. Dispatch PayTR Return Request     │
     │                                         ├─────────────────────────────────────►│
     │                                         │◄─────────────────────────────────────┤
     │                                         │ 6. Record Refund in `refund_records` │
     │                                         │ 7. If balance == 0: Order 'refunded' │
     │                                         │    If balance > 0: 'partially_refunded'
     │                                         │ 8. Append to `admin_audit_logs`      │
     │ 9. Return Refund Confirmation           │                                      │
     │◄────────────────────────────────────────┤                                      │
```

### Refund Safeguards
1. **Balance Check**: Ensures $\text{refund\_amount} \le \text{paid\_amount} - \sum \text{previous\_refunds}$.
2. **Zero Client Credentials**: The Admin UI never handles `merchant_key` or `merchant_salt`.
3. **Audit Ledger**: Every refund records `admin_id`, `admin_email`, timestamp, refund amount, reason, and PayTR reference.

---

## 6. Secrets & Environment Configuration

| Variable Name | Environment Location | Purpose | Client-Side Exposure |
| :--- | :--- | :--- | :--- |
| `PAYTR_MERCHANT_ID` | Supabase Edge Function Secret | PayTR Merchant Account ID | **STRICTLY FORBIDDEN (No)** |
| `PAYTR_MERCHANT_KEY` | Supabase Edge Function Secret | PayTR Private Signing Key | **STRICTLY FORBIDDEN (No)** |
| `PAYTR_MERCHANT_SALT` | Supabase Edge Function Secret | PayTR Secret Salt | **STRICTLY FORBIDDEN (No)** |
| `PAYTR_TEST_MODE` | Supabase Edge Function Secret | `1` for test/sandbox, `0` for production | **STRICTLY FORBIDDEN (No)** |

---

## 7. Truthful Payment Security Disclosure & Merchant Readiness (Phase 3.10)

Following Turkish consumer protection regulations (6502 sayılı Kanun) and payment industry standards (PCI-DSS):
- **Payment Processing Infrastructure**: All card transactions are processed securely through **PayTR Ödeme ve Elektronik Para Kuruluşu A.Ş.** (licensed by the Central Bank of the Republic of Turkey - TCMB).
- **Zero Card Data Storage**: Monocactus application servers and databases **never receive, process, or store** sensitive credit card numbers, CVV/CVC codes, or expiration dates. All card interactions occur strictly inside PayTR's 256-bit SSL encrypted iframe.
- **Card Scheme Support**: Visa, Mastercard, and TROY cards are supported subject to the merchant's active PayTR contract. International foreign cards require explicit merchant approval from the PayTR panel and are not guaranteed without provider activation.

### 7.1 Safe Checkout Activation Switch (`checkout_enabled`)
- Stored securely in `site_settings.commerce.checkout_enabled` (boolean).
- **Safety Gate**: The checkout activation toggle in `Admin -> Settings -> Entegrasyon Hazırlığı` can only be switched to `true` when:
  1. `seller_legal_complete === true` (all 9 mandatory legal fields for sole proprietorship are filled).
  2. `has_active_shipping === true` (at least 1 active shipping rate exists).
- **Disabled State Experience**:
  - Storefront Cart page disables checkout navigation with message: *"Sipariş Sistemi Hazırlık Aşamasında"*.
  - `/checkout` displays a maintenance explanation with buttons to return to cart or browse products.
  - Server-side edge functions `create-paytr-token` and `create-checkout-order` reject incoming requests with HTTP 403.

### 7.2 Return URLs and HTTPS Enforcement
- Return endpoints strictly constructed via centralized helper `getPaytrReturnUrls(orderId)`:
  - `merchant_ok_url`: `https://shop.monocactus.com/payment/success?order_id=<order_id>`
  - `merchant_fail_url`: `https://shop.monocactus.com/payment/failure?order_id=<order_id>`
- Local development preserves `http://localhost:<port>` for automated testing. Insecure `http://` is strictly prohibited on production domains.

---

## 8. Testing Strategy

1. **Unit & Contract Testing**: Mock PayTR adapter simulating token generation, valid/invalid HMAC signatures, and timeout handling in Vitest.
2. **Webhook Idempotency Testing**: Test replay of duplicate callbacks against in-memory and pgTAP databases to ensure zero duplicate mutations.
3. **Refund Boundary Testing**: Automated verification that exceeding the refundable amount or refunding unpaid orders is rejected with explicit errors.
4. **Checkout Gate Testing**: Verified disabled state gates on Cart and Checkout pages, as well as Edge Function enforcement.
5. **E2E Integration Testing**: End-to-end checkout flow with test card numbers in sandbox mode verifying the inline iFrame mount and callback lifecycle.
