# Supabase Database & Migration Architecture

This directory contains version-controlled database migrations, seed datasets, Row Level Security (RLS) policies, and pgTAP security test suites for the **Vazo E-Commerce Platform**.

---

## 1. Migration History & Execution Sequence

All database schema definitions and security policies are version-controlled inside `supabase/migrations/` in chronological execution order:

| Migration File | Description |
| :--- | :--- |
| `20260821000000_initial_storefront_schema.sql` | Core schema: products, variants, media, categories, collections, wholesale price tiers, CMS tables, and initial RLS policies. |
| `20260821000001_phase_1_hardening.sql` | Hardening: Search path security, constraint validations, and helper RPC functions. |
| `20260826000001_phase_2_admin_schema.sql` | Admin RBAC: `admin_users` table, `public.is_admin()` security definer function, and full admin mutation RLS policies across all catalog tables. |
| `20260826000002_phase_2_content_schema.sql` | Structured CMS: `content_pages`, `content_sections`, `faq_groups`, `faq_items`, `navigation_menu_groups`, and `navigation_menu_items`. |
| `20260826000003_phase_2_audit_logs.sql` | Immutable Audit Trail: `admin_audit_logs` append-only table and `prevent_audit_log_tampering` trigger raising exception code `27000` on any UPDATE or DELETE. |

---

## 2. Row Level Security (RLS) Policy Baseline

In accordance with [`docs/SECURITY.md`](../docs/SECURITY.md):
- **All tables have RLS enabled.**
- **Public Anonymous Read**: Anonymous visitors (`anon`) and authenticated customers (`authenticated`) can only execute `SELECT` on records where `active = true` or `status = 'published'`.
- **Public Write Prohibition**: Public users have zero direct `INSERT`, `UPDATE`, or `DELETE` permissions on catalog, content, settings, or audit tables.
- **Edge Function Ingestion**: Public submissions (`trade_applications`, `contact_messages`, `newsletter_subscriptions`) ingest strictly through validated Supabase Edge Functions executing with `service_role` authority.
- **Admin Mutation Authority**: Back-office admin CRUD operations verify administrative authorization via `public.is_admin()`.
- **Audit Immutability**: `admin_audit_logs` cannot be updated or deleted by any user; attempts trigger exception `27000`.

---

## 3. How to Apply Migrations & Seed Data

### Option A: Via Supabase CLI (Local Development)
```bash
# Start local Supabase container
npx supabase start

# Apply all migrations and seeds
npx supabase db reset

# Run automated pgTAP database security tests
npm run test:db
```

### Option B: Via Supabase Dashboard (Remote Project)
1. Open your Supabase project dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Navigate to **SQL Editor**.
3. Run each migration file in `supabase/migrations/` in numerical order (000000 to 000003).
4. Run `supabase/seed/seed.sql` to populate initial demo products and editorial content.

---

## 4. Environment Variables

Storefront client access requires **only** public publishable credentials:
```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-anon-key"
VITE_ENABLE_MOCK_DATA="false" # set to false when connecting to live database
```

> [!CAUTION]
> **Zero Service-Role Secrets in Client**: Never add `sb_secret_*`, service-role keys, or database passwords to frontend environment files or source code.
