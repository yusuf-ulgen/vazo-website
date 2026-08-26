# Admin Panel Specifications & Module Contracts

This document governs the back-office management panel (`src/admin/`), routed strictly under `/admin/*`.

---

## 1. Core Admin Functionality Rule

> [!IMPORTANT]
> **Strict Action Contract**: Every button, switch, link, or form control rendered in the Admin Panel must strictly fall into one of two states:
> 1. **FUNCTIONAL**: Dispatches real mutations, updates state, triggers validation, provides feedback, and handles loading/error states.
> 2. **EXPLICITLY DISABLED**: Visually styled as disabled with a clear tooltip or badge indicating: `"Bu özellik henüz backend entegrasyonu aşamasındadır"` (Feature pending backend integration).
>
> **Never render decorative "fake" buttons that appear interactive but silently do nothing.**

When backend integration is completed, **CRUD** requires:
- **Create**: Validated form modal/page, submission loading spinner, error handling, cache invalidation, success toast.
- **Read**: Filterable, sortable, paginated data grid with empty states and loading skeletons.
- **Update**: Pre-filled form, dirty field tracking, optimistic or verified update, conflict resolution.
- **Delete**: Explicit confirmation dialog for destructive actions, immediate UI reconciliation.

---

## 2. Implemented Module Architecture

```
/admin
├── /admin/dashboard         # Real operational metrics, low stock alerts, pending submissions, quick action hub
├── /admin/products          # Product catalog CRUD, variant matrices, dimensions, media upload/remove
├── /admin/categories        # Category hierarchy CRUD & sorting
├── /admin/collections       # Editorial collection curation & banner management
├── /admin/inventory         # Stock tracking, low-stock threshold alerts, instant adjustment modal
├── /admin/pricing           # Retail pricing rules, bulk percentage & fixed updates
├── /admin/wholesale         # Wholesale tiers, MOQ management, commercial discounts
├── /admin/submissions       # Trade applications, contact messages, newsletter subscriptions
├── /admin/navigation        # Mega-menu group & link hierarchy builder (Retail & Wholesale)
├── /admin/content           # Structured CMS (About, Wholesale Landing/How It Works, Policies, FAQ)
├── /admin/settings          # Public studio info, business hours, commerce/shipping policies, social links
└── /admin/audit             # Immutable audit log with entity diff viewer & trigger-enforced immutability
```

---

## 3. Module Specifications & Operational Workflows

### 3.1 Executive Dashboard (`/admin/dashboard`)
- **Real Metrics Only**: Product counts (Total, Published, Draft, Archived), variant stock health (In Stock, Low Stock, Out of Stock), active taxonomies, and pending submissions.
- **Zero Fake KPIs**: Does not display fabricated revenue, fictional orders, or ungrounded financial charts.
- **Security & Health Banner**: Real-time Supabase Auth state, schema health, and zero-PII audit trail verification.
- **Quick Action Hub**: Direct keyboard-navigable shortcuts to add products, adjust stock, manage menus, and review submissions.

### 3.2 Product & Variant Management (`/admin/products`, `/admin/inventory`, `/admin/pricing`)
- **Product Entity**: Title, slug, SKU, category, collection, retail price, wholesale price, status (`draft`, `published`, `archived`), materials, dimensions, images.
- **Variants Matrix**: Size, color, SKU, barcode, stock quantity, low-stock threshold, price adjustments, and active state.
- **Stock Adjustments**: Direct mutation modal logging before/after stock levels and reason codes into `admin_audit_logs`.
- **Bulk Price Adjustments**: Percentage or fixed-amount increments/decrements with confirmation modals.

### 3.3 Navigation & Header Menu Builder (`/admin/navigation`)
- **Group Hierarchy**: Manage navigation menu groups for `retail_mega` and `wholesale_mega` menus.
- **Link Builder**: Label, destination URL, sort order, and badge tags (`Yeni`, `Popüler`).
- **Promotional Banners**: Hero promo card configuration with title, subtitle, image, and CTA link.

### 3.4 Structured CMS & Editorial Pages (`/admin/content`)
- **Structured Pages**: Manage editorial content for `/about`, `/wholesale`, `/wholesale/how-it-works`, `/policies/shipping-returns`, `/policies/privacy-kvkk`, and `/policies/terms`.
- **Section Ordering**: Ordered sections with title, subtitle, body, image, and CTA configurations.
- **FAQ Management**: Categorized FAQ groups and items with sort order and active toggles.

### 3.5 Submissions & Inquiries Management (`/admin/submissions`)
- **Trade Applications**: B2B customer applications (company name, tax ID, email, estimated volume) with status lifecycle (`pending`, `reviewed`, `approved`, `rejected`) and internal admin notes.
- **Contact Messages**: Customer inquiries with status tracking (`new`, `in_review`, `resolved`, `spam`) and response logs.
- **Newsletter Subscriptions**: Subscriber email list with source tracking and active status.
- **Edge Function Lockdown**: Public submissions ingest strictly through authenticated Supabase Edge Functions. Direct public PostgreSQL `INSERT` is blocked.

### 3.6 Site Settings (`/admin/settings`)
- **General**: Brand name, tagline, meta description.
- **Contact & Showroom**: Support email, wholesale email, phone, physical address, business hours.
- **Commerce & Logistics**: Currency, free shipping threshold, standard shipping fee, tax rate, shipping summary.
- **Social Media**: Instagram, Facebook, Pinterest URLs with URL format validation.

### 3.7 Immutable Audit Trail (`/admin/audit`)
- **Append-Only Ledger**: Records `admin_id`, `admin_email`, `action`, `entity_type`, `entity_id`, `old_data`, `new_data`, `metadata`, and `created_at`.
- **Database Trigger Enforcement**: `prevent_audit_log_tampering` trigger raises PostgreSQL exception `27000` on any attempted `UPDATE` or `DELETE`.
- **Zero-PII Compliance**: Excludes passwords, tokens, and payment data from audit payloads.

---

## 4. Admin Security & Authentication Contract

1. **Supabase Auth & RBAC**: Admin access requires an authenticated session validated server-side against `admin_users` table via `public.is_admin()`.
2. **Zero Client Trust**: No `localStorage` flags, no hardcoded credentials (`ADMIN_CREDENTIALS`), and no email regex heuristics grant admin privileges.
3. **Automatic Session Recovery & Logout**: State synchronizes with Supabase Auth events (`SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`). Unauthenticated access redirects immediately to `/admin/login`.
