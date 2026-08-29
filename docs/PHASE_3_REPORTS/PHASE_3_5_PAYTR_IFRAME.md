# PHASE 3.5 — PayTR Payment Integration — Token API & Inline iFrame

**Sub-Phase**: 3.5  
**Title**: PayTR Inline iFrame Token Integration  
**Branch**: `phase-3`  
**Starting HEAD**: `093df2d2e51af51f3c256766671df2167cba2458`  
**Quality Status**: 🟢 100% VERIFIED

---

## Scope & Deliverables

1. **Secrets Configuration**:
   - `PAYTR_MERCHANT_ID`: CONFIGURED / NOT VERIFIED (Securely stored in Supabase Edge Secrets)
   - `PAYTR_MERCHANT_KEY`: CONFIGURED / NOT VERIFIED
   - `PAYTR_MERCHANT_SALT`: CONFIGURED / NOT VERIFIED
   - `PAYTR_TEST_MODE`: `1` (Test mode enabled for sandbox verification)
   - `PAYTR_DEBUG_ON`: `1`
   - `APP_ORIGIN`: `https://shop.monocactus.com`
   - Zero secrets exposed in git, client code, or `VITE_*` bundles.

2. **Edge Function `create-paytr-token` (`supabase/functions/create-paytr-token/index.ts`)**:
   - Authenticated endpoint verifying Supabase Customer JWT (`auth.uid()`).
   - Validates that order belongs to customer, status is `pending_payment`, and unexpired reservations exist.
   - Generates unique alphanumeric `merchant_oid` (strictly no hyphens, $\le 64$ chars).
   - Records payment attempt via `public.initiate_order_payment` RPC in `payments` table (`status = 'initiated'`).
   - Builds Base64-encoded `user_basket` matching `orders.total_minor` integer kuruş.
   - Computes HMAC-SHA256 token with `PAYTR_MERCHANT_KEY` over official PayTR string:
     `merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode + merchant_salt`
   - Dispatches server-to-server request to `https://www.paytr.com/odeme/api/get-token`.
   - Returns `{ success: true, token, iframe_url, is_test_mode }`.

3. **Storefront Inline iFrame Component (`src/site/checkout/components/PayTRPaymentFrame.tsx`)**:
   - Embeds PayTR secure 3D Secure form: `https://www.paytr.com/odeme/guvenli/{token}`.
   - Auto-resizing support listening to PayTR postMessage events (`window.addEventListener('message', ...)`).
   - Displays test mode banner when `is_test_mode = true`.
   - Zero cardholder data captured on client; full PCI-DSS boundary compliance.
   - Accessible title: `"Güvenli PayTR ödeme formu"`.

4. **Payment Result Storefront Routes**:
   - `/payment/success` (`PaymentSuccessPage.tsx`): Non-authoritative status polling page ("Ödeme sonucunuz doğrulanıyor...").
   - `/payment/failure` (`PaymentFailurePage.tsx`): Non-authoritative failure page with troubleshooting guidance and retry links.

5. **Test Coverage**:
   - `tests/unit/payment/paytr-token.test.ts`: 5 tests covering HMAC signature, basket encoding, alphanumeric OID validation, minor units, and no-installment rule.
   - `tests/component/site/payment-result-pages.test.tsx`: 8 tests covering success polling states, failure actions, and iframe message resizing.
