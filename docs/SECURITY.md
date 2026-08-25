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

## 2. Authentication & Admin Panel Security (Phase 2.2 Architecture)

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
- However, all admin management tables (`products`, `categories`, `collections`, `wholesale_price_tiers`, `site_settings`, `trade_applications`, etc.) strictly enforce `is_admin()` in RLS policies. Even if a malicious actor bypasses client JavaScript, Postgres RLS blocks all unauthorized mutations with `42501 (insufficient_privilege)`.

### 2.3 Zero Hardcoded Credentials
- No admin passwords, demo credentials, or credential lists (`ADMIN_CREDENTIALS`) may ever exist in source code.


---

## 3. Data Validation & Injection Prevention

### 3.1 XSS (Cross-Site Scripting) Prevention
- Always rely on React's automatic string escaping.
- Avoid `dangerouslySetInnerHTML` unless rendering sanitized rich-text product descriptions parsed through a strict DOMPurify pipeline.
- All user inputs in contact forms and trade applications must be sanitized and validated using structured schema validation (e.g., Zod) on both client and server.

### 3.2 File Upload Safety (Future Media Module)
- When implementing the Media Library in future phases:
  - File types must be validated by MIME-type and magic bytes (strictly allowing `.jpg`, `.jpeg`, `.png`, `.webp`, `.svg`).
  - Prohibit direct execution of uploaded media on the host server.
  - Image files must be served from an isolated CDN/bucket with appropriate Content-Disposition headers.

---

## 4. Logging & Audit Trails

- Application logs must never print sensitive customer payment details (credit card numbers, CVVs) or authentication credentials.
- All administrative data mutations (product creation, wholesale price changes, trade customer approval) must generate immutable audit records in the backend audit trail.
