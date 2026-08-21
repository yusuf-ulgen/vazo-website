# Supabase Database & Migration Architecture

This directory contains version-controlled database migrations, seed datasets, and Row Level Security (RLS) policies for the **Vazo E-Commerce Platform**.

---

## 1. Migration Overview

All database schema definitions are versioned inside `supabase/migrations/`:

| Migration File | Description |
| :--- | :--- |
| `20260821000000_initial_storefront_schema.sql` | Core schema: products, variants, media, categories, collections, wholesale tiers, CMS tables, site settings, and RLS policies. |

---

## 2. Row Level Security (RLS) Policy

In accordance with [`docs/SECURITY.md`](file:///D:/freelance/vazo-website/docs/SECURITY.md):
- **All tables have RLS enabled.**
- **Public Anonymous Read**: Anonymous visitors (`anon`) and authenticated users (`authenticated`) can only execute `SELECT` on records where `active = true` or `status = 'published'`.
- **Public Write Restriction**: Public users have zero `INSERT`, `UPDATE`, or `DELETE` permissions on catalog and content tables.
- **Trade Application Submission**: A dedicated `INSERT` policy allows public B2B trade application submissions (`trade_applications`) without exposing read permissions to unauthenticated users.
- **Admin Mutations**: Back-office admin CRUD operations (Phase 2) will use authenticated administrative roles with verified RBAC policies.

---

## 3. How to Apply Migrations & Seed Data

### Option A: Via Supabase CLI (Local Development)
```bash
# Start local Supabase container
npx supabase start

# Apply migrations
npx supabase db reset
```

### Option B: Via Supabase Dashboard (Remote Project)
1. Open your Supabase project dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Navigate to **SQL Editor**.
3. Run `supabase/migrations/20260821000000_initial_storefront_schema.sql`.
4. Run `supabase/seed/seed.sql` to populate initial demo products and content.

---

## 4. Environment Variables

Storefront client access requires **only** public publishable credentials:
```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-anon-key"
VITE_ENABLE_MOCK_DATA="false" # set to false when connecting to live database
```

> [!CAUTION]
> **Zero Service-Role Secrets**: Never add `sb_secret_*`, service-role keys, or database passwords to frontend environment files or source code.
