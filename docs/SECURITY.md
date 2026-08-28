# Security Baseline & Data Protection Policies

This document establishes the security standards and operational policies for the **Vazo E-Commerce Platform**.

---

## 1. Secrets Management & Environment Policy

### 1.1 Never Commit Secrets to Git
- Under no circumstances may private API keys, database credentials, payment secret keys, SMTP passwords, or SSH certificates be committed to source control.
- `.gitignore` strictly excludes `.env`, `.env.local`, `.env.*.local`, and certificate extensions (`.pem`, `.key`).
- Automated repository safety checks (`npm run check:repo`) scan for accidental credential leaks before commits.

### 1.2 The `VITE_*` Browser Exposure Warning
- In Vite applications, any environment variable prefixed with `VITE_` is statically replaced into client-side JavaScript bundles during compilation.
- **Rule**: Never store private keys, webhook signing secrets, or database passwords in `VITE_*` variables.
- `VITE_*` variables are strictly limited to public endpoints, public feature flags, and non-sensitive application titles.

### 1.3 Supabase Key Policy & Row Level Security (RLS)
- Only the public **publishable/anon key** (`VITE_SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_ANON_KEY`) may be exposed to the browser.
- **Secret/service-role keys (`sb_secret_*`) are strictly forbidden** in browser bundles and source control.
- **Mandatory RLS**: Every PostgreSQL table exposed via the Supabase Data API must have Row Level Security enabled.
- Anonymous/public browser users are granted **SELECT ONLY** on published/active records. Unrestricted public write, update, and delete access is prohibited.

---

## 2. Authentication & Admin Panel Security

### 2.1 Supabase Auth & Database-Enforced RBAC
- Admin authentication is handled exclusively through official **Supabase Auth** (`supabase.auth.signInWithPassword` and `supabase.auth.signOut`).
- Storefront customer authentication is completely isolated from admin authority: storefront `auth-store` cannot grant admin privileges, and no client-side heuristics (email domains, prefixes, or `localStorage` manipulation) are trusted.
- **Database RBAC (`public.admin_users`)**:
  - The `public.admin_users` table maintains user IDs, roles (`admin`, `super_admin`), and active flags.
  - Hardened database helper `public.is_admin()` uses `SECURITY DEFINER` with fixed `search_path = public, auth, pg_temp` to prevent search path hijacking.
  - Zero browser INSERT/UPDATE/DELETE policies exist on `public.admin_users`. Role escalation from browser clients is mathematically impossible under Postgres RLS.
  - Admin user provisioning must be performed via Supabase Dashboard, secure SQL migrations, or backend service-role operations.

### 2.2 Client-Side Route Guards & Defense-in-Depth
- React Router guards (`AdminGuard`) provide UX routing, redirecting unauthenticated or unprivileged users to `/admin/login`.
- All admin management tables strictly enforce `is_admin()` in RLS policies. Even if a malicious actor bypasses client JavaScript, Postgres RLS blocks all unauthorized mutations with `42501 (insufficient_privilege)`.

### 2.3 Zero Hardcoded Credentials
- No admin passwords, demo credentials, or credential lists (`ADMIN_CREDENTIALS`, `LocalDev123`) exist in source code.

---

## 3. Row Level Security (RLS) Policy Matrix

| Table | Public / Anonymous Access | Authenticated Customer Access | Authenticated Admin Access |
| :--- | :--- | :--- | :--- |
| `admin_users` | DENIED (0 access) | DENIED (0 access) | SELECT (own record via `auth.uid()`) |
| `products` | SELECT (`status = 'published'`) | SELECT (`status = 'published'`) | ALL (SELECT, INSERT, UPDATE, DELETE) |
| `product_variants` | SELECT (`active = true` AND parent published) | SELECT (`active = true` AND parent published) | ALL (SELECT, INSERT, UPDATE, DELETE) |
| `categories` | SELECT (`active = true`) | SELECT (`active = true`) | ALL (SELECT, INSERT, UPDATE, DELETE) |
| `collections` | SELECT (`active = true`) | SELECT (`active = true`) | ALL (SELECT, INSERT, UPDATE, DELETE) |
| `wholesale_price_tiers` | SELECT (`active = true`) | SELECT (`active = true`) | ALL (SELECT, INSERT, UPDATE, DELETE) |
| `content_pages` | SELECT (`is_published = true`) | SELECT (`is_published = true`) | ALL (SELECT, INSERT, UPDATE, DELETE) |
| `content_sections` | SELECT (`active = true`) | SELECT (`active = true`) | ALL (SELECT, INSERT, UPDATE, DELETE) |
| `faq_groups` & `faq_items` | SELECT (`active = true`) | SELECT (`active = true`) | ALL (SELECT, INSERT, UPDATE, DELETE) |
| `navigation_menu_groups` & `items` | SELECT (`active = true`) | SELECT (`active = true`) | ALL (SELECT, INSERT, UPDATE, DELETE) |
| `site_settings` | SELECT (public read) | SELECT (public read) | UPDATE / INSERT (`is_admin()`) |
| `trade_applications` | DENIED (Ingested via Edge Function) | DENIED (Ingested via Edge Function) | ALL (`is_admin()`) |
| `contact_messages` | DENIED (Ingested via Edge Function) | DENIED (Ingested via Edge Function) | ALL (`is_admin()`) |
| `newsletter_subscriptions` | DENIED (Ingested via Edge Function) | DENIED (Ingested via Edge Function) | ALL (`is_admin()`) |
| `admin_audit_logs` | DENIED (0 access) | DENIED (0 access) | SELECT & INSERT (`is_admin()`); UPDATE & DELETE BLOCKED BY TRIGGER |
| `customer_profiles` | DENIED (0 access) | SELECT, UPDATE (`user_id = auth.uid()`, privileged columns protected by trigger) | ALL (`is_admin()`) |
| `customer_addresses` | DENIED (0 access) | SELECT, INSERT, UPDATE, DELETE (`user_id = auth.uid()`) | ALL (`is_admin()`) |
| `orders` | DENIED (0 access) | SELECT (`customer_id = auth.uid()`), mutations blocked | ALL (`is_admin()`) |
| `order_items` | DENIED (0 access) | SELECT (via parent order `customer_id = auth.uid()`) | ALL (`is_admin()`) |
| `payments` | DENIED (0 access) | SELECT (via parent order `customer_id = auth.uid()`) | ALL (`is_admin()`) |
| `payment_events` | DENIED (0 access) | DENIED (0 access) | SELECT (`is_admin()`) |
| `inventory_reservations` | DENIED (0 access) | DENIED (0 access) | SELECT (`is_admin()`) |
| `inventory_movements` | DENIED (0 access) | DENIED (0 access) | SELECT (`is_admin()`) |
| `order_status_history` | DENIED (0 access) | SELECT (via parent order `customer_id = auth.uid()`) | SELECT (`is_admin()`) |
| `order_legal_acceptances` | DENIED (0 access) | SELECT (via parent order `customer_id = auth.uid()`) | SELECT (`is_admin()`) |
| `refunds` | DENIED (0 access) | SELECT (via parent order `customer_id = auth.uid()`) | ALL (`is_admin()`) |
| `order_invoices` | DENIED (0 access) | SELECT (via parent order `customer_id = auth.uid()`) | ALL (`is_admin()`) |
| `transactional_emails` | DENIED (0 access) | DENIED (0 access) | SELECT (`is_admin()`) |

---

## 4. Submissions Ingestion Security Boundary

Public submissions (Trade Applications, Contact Inquiries, Newsletter Subscriptions) must NEVER be directly inserted via PostgreSQL table endpoints:

```
Browser Form Submission
        │
        ▼ (HTTPS POST with Honeypot + Rate Limiting)
Supabase Edge Function
        │
        ▼ (Server-side validation & Sanitization)
Service Role Backend Client
        │
        ▼ (INSERT into PostgreSQL)
Persisted Record
```

Direct PostgreSQL `INSERT` by anonymous users is blocked by RLS to prevent database spamming and table enumeration.

---

## 5. Storage Security Rules (`product-media` Bucket)

- **MIME Allowlist**: `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml`.
- **Max File Size**: 5MB per asset.
- **Path Sanitization**: Filenames are hashed with UUIDs and sanitized to prevent path traversal (`../`).
- **Access Policy**: Public read (`SELECT`) allowed; write, update, and delete access strictly restricted to authenticated administrators (`is_admin()`).

---

## 6. Immutable Audit Trail & Database Trigger Enforcement

- **Append-Only Schema**: The `admin_audit_logs` table records all administrative mutations.
- **Trigger Tamper-Proofing**: The `prevent_audit_log_tampering` trigger raises PostgreSQL exception `27000` on any attempted `UPDATE` or `DELETE` operation, even by administrative roles.
- **Zero-PII Compliance**: Excludes passwords, tokens, and payment data from audit payloads.
- **pgTAP Automated Testing**: Verified by 49 automated database security assertions (`supabase/tests/database_security.sql`).

---

## 7. Payment & Checkout Security Policies (PayTR & Supabase)

### 7.1 Server-Only Merchant Credentials
- PayTR merchant credentials (`merchant_id`, `merchant_key`, `merchant_salt`) must be stored **exclusively** in server-side runtime environments (Supabase Edge Function Secrets).
- **Prohibition**: Never expose `merchant_key` or `merchant_salt` through `VITE_*` variables, React components, client state, `localStorage`, public API responses, logs, or test fixtures.

### 7.2 Zero Card Data Retention (PCI-DSS Scoping)
- The storefront uses the **PayTR inline iFrame** hosted securely on PayTR's PCI-DSS Level 1 certified infrastructure.
- The client application never collects, processes, transmits, or stores Primary Account Numbers (PAN), CVVs, or cardholder credentials.

### 7.3 Server-Authoritative Totals & Zero Client Trust
- Browser totals, item unit prices, shipping fees, and wholesale discounts received from the client are treated as **untrusted display values**.
- The Supabase Edge Function (`create-paytr-token`) fetches canonical product prices directly from PostgreSQL, verifies wholesale trade eligibility, applies MOQ constraints, checks shipping zone rules, and computes the authoritative `payment_amount`.

### 7.4 HMAC Webhook Signature Verification & Idempotency
- PayTR server-to-server callbacks (`/functions/v1/paytr-callback`) must verify the cryptographic HMAC-SHA256 signature using `merchant_key` and `merchant_salt`.
- **Idempotency Guarantee**: If a callback for an already paid `merchant_oid` is received, the handler must return the exact plain-text response `"OK"` without duplicating inventory updates, audit records, or transactional emails.

### 7.5 Server-Side Refund Integrity
- All refund requests must be initiated through authenticated admin Edge Functions validating that:
  $$\text{Refund Amount} \le \text{Total Paid} - \text{Previously Refunded Amount}$$
- Direct browser calls to the PayTR Refund API with merchant credentials are strictly blocked.

