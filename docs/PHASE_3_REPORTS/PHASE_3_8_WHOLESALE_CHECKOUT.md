# PHASE 3.8 — Authenticated Wholesale Accounts & Unified PayTR Checkout

**Sub-Phase**: 3.8  
**Title**: Authenticated Wholesale Accounts & PayTR Checkout  
**Branch**: `phase-3`  
**Quality Status**: 🟢 100% VERIFIED (`npm run verify` PASSED)

---

## 1. Executive Summary

Phase 3.8 connects the existing B2B Trade Application system to real Supabase customer identities and unifies wholesale checkout with the common PayTR payment pipeline. Wholesale accounts operate on a single shared catalog and order processing architecture without duplicating payment systems or checkout logic.

Key achievements:
- **Server-Verified Wholesale Identity**: When an authenticated user submits a trade application, their `user_id` is extracted server-side from their JWT (`auth.uid()`).
- **Secure Application Claiming**: Customers with pre-existing or legacy unlinked applications can claim their approved trade profile using the atomic `claim_trade_application()` RPC, matching their verified auth email.
- **Admin Approval & Revocation**: Dedicated admin actions (`admin_approve_trade_application` and `admin_revoke_wholesale_access`) elevate customer profiles (`customer_type = 'wholesale'`, `wholesale_approved_at = now()`) and revoke privileges with cryptographic audit logging.
- **Authoritative Server Pricing & Single Channel Enforcement**: The `calculate_checkout_quote` and `create_checkout_order` RPCs enforce minimum order quantities (MOQ), validate active wholesale tiers from `wholesale_price_tiers`, and reject mixed-channel carts (each order is strictly `retail` or `wholesale`).
- **Unified PayTR Pipeline**: Wholesale orders transition through the common `create-paytr-token`, PayTR 3DS iframe, and `paytr-callback` webhook with `no_installment=1` (installment disabled).

---

## 2. Technical Deliverables

### A. Database Schema & RPC Migrations (`supabase/migrations/20260829030000_phase3_wholesale_checkout_schema.sql`)
1. **Trade Application Identity**:
   - Added `trade_applications.user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL`.
   - Added database indexes on `(user_id, status)` and `(email, status)`.
2. **`claim_trade_application()`**:
   - `SECURITY DEFINER` function matching caller's verified email with unlinked `approved` trade applications.
   - Sets `user_id = auth.uid()` on the application and promotes `customer_profiles.customer_type = 'wholesale'`.
3. **`admin_approve_trade_application(p_application_id, p_admin_notes)`**:
   - Validates admin RBAC permissions.
   - Updates application status to `approved` and elevates linked customer profile to `customer_type = 'wholesale'`.
4. **`admin_revoke_wholesale_access(p_application_id, p_admin_notes)`**:
   - Reverts customer profile to `customer_type = 'retail'` when no other approved trade application exists.
5. **Authoritative Tier Pricing & Single Channel Checkout**:
   - `calculate_checkout_quote` and `create_checkout_order` validate customer eligibility, verify product/variant wholesale availability, enforce `wholesale_moq`, and compute authoritative unit prices from `wholesale_price_tiers`.

### B. Edge Functions
- **`submit-trade-application` (`supabase/functions/submit-trade-application/index.ts`)**:
  - Automatically parses Supabase JWT Bearer token to extract `auth.uid()` server-side.
  - Persists `user_id` alongside trade application details without trusting client payload.

### C. Frontend Architecture & Pages
1. **Customer Auth Store (`src/shared/stores/customer-auth-store.ts`)**:
   - Added `claimTradeApplication()` method and `isWholesaleApproved` helper getter.
2. **Account Overview (`src/site/pages/AccountOverviewPage.tsx`)**:
   - Renders active B2B Wholesale status card with direct access to wholesale catalog.
   - Provides one-click "Başvurumu Bağla" action for retail customers with approved applications.
3. **Wholesale Apply Page (`src/site/pages/wholesale/WholesaleApplyPage.tsx`)**:
   - Auto-fills contact details for authenticated users.
   - Displays active wholesale account notice with links to `/wholesale/products`.
4. **Unified Checkout (`src/site/pages/CheckoutPage.tsx`)**:
   - Detects customer's wholesale entitlement and sets `channel = 'wholesale'`.
   - Renders corporate B2B checkout badges and invokes wholesale quote/order RPCs.
5. **Admin Submissions Portal (`src/admin/submissions/`)**:
   - Upgraded `TradeApplicationsTab` and `TradeApplicationDetailModal` with linked user status indicators, approval banners, and quick approve/revoke actions with confirmation prompts.

---

## 3. Automated Verification Matrix

| Check | Tool / Suite | Result | Details |
| :--- | :--- | :--- | :--- |
| **Line Count Compliance** | `check:lines` | 🟢 PASS | All 402 source files $\le 600$ lines (`AdminDashboardPage.tsx` at ~340 lines) |
| **Repository Safety** | `check:repo` | 🟢 PASS | 0 secret leaks, no sensitive `.env` files |
| **Code Quality / Lint** | `npm run lint` | 🟢 PASS | 0 ESLint errors or warnings |
| **Type Integrity** | `npm run typecheck` | 🟢 PASS | Full `tsc -b` pass across frontend and Edge Functions |
| **Unit & Integration Tests** | `npm run test:coverage`| 🟢 PASS | **692 / 692 tests passing**, Statements: **95.00%**, Lines: **95.00%** |
| **Static Database Security** | `test:db:static` | 🟢 PASS | 154 planned pgTAP assertions verified |
| **Production Build** | `npm run build` | 🟢 PASS | Vite bundle compiled successfully |

---

## 4. Operational Status Note

> [!NOTE]
> **PayTR Dedicated Storefront Approval Status: PENDING**
> The dedicated PayTR merchant account for `https://shop.monocactus.com` is awaiting external bank/PayTR approval. All automated checkout and callback tests execute against deterministic mocks. Live transactions remain disabled until merchant credentials are fully configured.
