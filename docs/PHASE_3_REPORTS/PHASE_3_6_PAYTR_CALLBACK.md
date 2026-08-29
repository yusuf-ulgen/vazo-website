# PHASE 3.6 — PayTR Callback, Idempotency & Atomic Payment Finalization

**Sub-Phase**: 3.6  
**Title**: PayTR Server-to-Server Callback & Webhook Verification  
**Branch**: `phase-3`  
**Starting HEAD**: `093df2d2e51af51f3c256766671df2167cba2458`  
**Quality Status**: 🟢 100% VERIFIED

---

## Scope & Deliverables

1. **Public Webhook Edge Function `paytr-callback` (`supabase/functions/paytr-callback/index.ts`)**:
   - Public webhook endpoint (`verify_jwt = false`) accepting POST `application/x-www-form-urlencoded`.
   - Computes expected HMAC-SHA256 hash:
     `merchant_oid + merchant_salt + status + total_amount`
   - Constant-time string comparison (`constantTimeEqual`) to protect against timing attacks.
   - Rejects invalid signatures with HTTP 400 `BAD HASH` without mutating the database.
   - Invokes `public.finalize_paytr_callback` atomic PostgreSQL RPC upon signature validation.
   - Returns exact plain-text `OK` response required by PayTR.

2. **Atomic PostgreSQL Finalization RPC `public.finalize_paytr_callback` (`supabase/migrations/20260829010000_phase3_paytr_callback_schema.sql`)**:
   - `SELECT ... FOR UPDATE` row locks on `payments` and `orders`.
   - **Idempotency Guard**: Repeated callback deliveries for terminal states (`paid`, `failed`, `manual_review`) return `{ already_processed: true }` without re-executing mutations.
   - **Success Flow**:
     - Enforces amount integrity (`expected_amount_minor === total_amount`). If mismatched, transitions order to `payment_review`.
     - Converts active reservations (`inventory_reservations.status = 'converted'`).
     - Atomically decrements physical variant stock (`product_variants.stock_quantity`).
     - Writes immutable audit entry to `inventory_movements` (`movement_type = 'sale'`).
     - Updates `payments` (`status = 'paid'`, `paid_at = now()`).
     - Updates `orders` (`status = 'paid'`, `paid_at = now()`).
     - Inserts `order_status_history` and `payment_events` with SHA256/MD5 event fingerprint.
     - Enqueues `transactional_emails` confirmation event (`template_key = 'order_confirmed'`).
   - **Failure Flow**:
     - Releases inventory reservations (`inventory_reservations.status = 'released'`).
     - Updates `payments` (`status = 'failed'`, failure code/message).
     - Updates `orders` (`status = 'payment_failed'`).
     - Inserts `order_status_history` and `payment_events`.

3. **Database Security & pgTAP Test Assertions (`supabase/tests/database_security.sql`)**:
   - 10 new pgTAP assertions (total plan: 145 tests).
   - Validates alphanumeric OID constraints, stock decrements, reservation lifecycle, idempotent duplicate deliveries, and amount mismatch reviews.

4. **External PayTR Dashboard Webhook Configuration**:
   - Status: **USER ACTION REQUIRED**
   - Notification URL to set in PayTR Merchant Portal:  
     `https://rnbrdypdxomiuzjyteti.supabase.co/functions/v1/paytr-callback`
