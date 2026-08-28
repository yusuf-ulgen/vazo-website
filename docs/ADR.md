# Architecture Decision Records (ADR)

This document records the foundational architectural decisions for the **Vazo E-Commerce Platform**.

---

## ADR-001: Single Repository Architecture

- **Status**: Approved
- **Date**: 2026-08-21
- **Context**: The project encompasses a public storefront, retail and wholesale user journeys, back-office administration, shared UI components, and domain models. Splitting these into separate repositories would duplicate domain entities, design tokens, build scripts, and CI maintenance.
- **Decision**: All components, documentation, admin modules, storefront code, and shared utilities will reside in a single repository: `yusuf-ulgen/vazo-website`.
- **Consequences**:
  - Positive: Single dependency graph, unified TypeScript types, shared design tokens, atomic multi-module commits.
  - Negative: Requires disciplined module boundaries to prevent cross-module coupling.
- **Verification**: Verified via project structure and boundary rules in `docs/ARCHITECTURE.md`.

---

## ADR-002: Single React Application with `/admin/*` Namespace

- **Status**: Approved
- **Date**: 2026-08-21
- **Context**: Admin and Storefront need to share domain models and UI primitives without incurring multi-app bundle overhead during early phases.
- **Decision**: Host both the public storefront (`src/site/`) and admin panel (`src/admin/`) in the same React application using React Router. The admin panel is scoped strictly under `/admin/*`.
- **Consequences**:
  - Positive: Instant code sharing, single Vite dev server, unified routing configuration.
  - Negative: Code splitting is essential to prevent admin code from leaking into public bundles.
- **Verification**: Verified via React Router route hierarchy and lazy loading boundaries.

---

## ADR-003: Shared Retail & Wholesale Product Catalog

- **Status**: Approved
- **Date**: 2026-08-21
- **Context**: Both retail customers and wholesale trade partners browse the same ceramic vase collections. Creating disconnected catalogs would cause inventory desynchronization and content duplication.
- **Decision**: Model products with a single unified entity containing shared metadata (name, slug, images, dimensions, material, stock) and distinct pricing context (retail unit price vs. wholesale volume tiers and MOQ).
- **Consequences**:
  - Positive: Zero duplication of product assets and descriptions; unified inventory management.
  - Negative: Storefront UI must dynamically adapt pricing and CTA behaviors based on retail vs. wholesale user context.
- **Verification**: Verified via `src/entities/product/types.ts` and `docs/ECOMMERCE.md`.

---

## ADR-004: Centralized Design Token Architecture

- **Status**: Approved
- **Date**: 2026-08-21
- **Context**: Hardcoded colors, font families, and margins in JSX lead to visual drift, broken themes, and difficult re-branding.
- **Decision**: Maintain a multi-tier design token system (`primitive.json` -> `semantic.json` -> `component.json`) mapped directly into CSS variables and Tailwind utility classes.
- **Consequences**:
  - Positive: Visual source of truth is centralized, brand colors can be modified in one location, strict editorial aesthetics.
  - Negative: Developers must use semantic token classes rather than arbitrary Tailwind hex values.
- **Verification**: Verified via `design-tokens/` directory and `tailwind.config.js`.

---

## ADR-005: 600-Line Source-File Maximum

- **Status**: Approved
- **Date**: 2026-08-21
- **Context**: Unchecked file growth creates monolithic "god components" and unmaintainable modules that are difficult for both human engineers and AI agents to refactor safely.
- **Decision**: Enforce a strict maximum limit of **600 lines** (target `<= 350 lines`) for all manually maintained source files (`.ts`, `.tsx`, `.js`, `.jsx`, `.css`, `.mjs`).
- **Consequences**:
  - Positive: Forces clean modularization, high cohesion, smaller review diffs, and prevents context exhaustion.
  - Negative: Requires proactive decomposition when features expand.
- **Verification**: Verified via `npm run check:lines` and CI pipeline gate.

---

## ADR-006: Environment Variables and Secrets Security Strategy

- **Status**: Approved
- **Date**: 2026-08-21
- **Context**: Vite exposes all `VITE_*` environment variables to the browser bundle. Leaking private keys or server credentials into frontend source control is a severe security risk.
- **Decision**: Maintain `.env.example` with public non-sensitive placeholders only. Prohibit all secrets in source control. Forbid assigning server secrets to `VITE_*` variables.
- **Consequences**:
  - Positive: Complete isolation of machine-specific config; eliminates accidental secret leaks in frontend bundles.
  - Negative: Developers must manually configure local `.env.local` files.
- **Verification**: Verified via `.gitignore`, `scripts/check-repository-safety.mjs`, and `docs/SECURITY.md`.

---

## ADR-007: Backend, Database, and Payment Provider Selection Deferred

- **Status**: Superseded by ADR-009 (for Database & Backend Platform) and ADR-010 (for Payment Provider)
- **Date**: 2026-08-21 (Superseded 2026-08-21, 2026-08-28)
- **Context**: The backend infrastructure was initially deferred during Phase 0 foundation.
- **Decision**: Replaced by ADR-009 which selects Supabase, and ADR-010 which selects PayTR.
- **Consequences**: Retained in ADR log for complete historical traceability.
- **Verification**: Cross-referenced with ADR-009 and ADR-010.

---

## ADR-008: Admin Manages Dynamic Storefront Content Through Defined Content Contracts

- **Status**: Approved
- **Date**: 2026-08-21
- **Context**: Editorial hero sections, announcement bar banners, and mega menu promotions must be manageable by back-office administrators without modifying code.
- **Decision**: Define structured CMS content contracts (`AnnouncementBarConfig`, `HeroBannerConfig`, `MegaMenuPromoCard`, `EditorialSectionConfig`) that the admin panel can update and the storefront dynamically renders.
- **Consequences**:
  - Positive: True headless CMS-like control for store managers; consistent layout templates.
  - Negative: Storefront components must be resilient to missing or draft CMS fields.
- **Verification**: Verified via `src/entities/content/types.ts` and `docs/ADMIN.md`.

---

## ADR-009: Supabase Platform Selection (Database, Data API, Auth, Storage, Edge Functions)

- **Status**: Approved (Payment Gateway component superseded by ADR-010)
- **Date**: 2026-08-21
- **Context**: The storefront requires a robust PostgreSQL database, client Data API, and future Auth/Storage infrastructure without spinning up custom Node backend servers in early phases.
- **Decision**: Select **Supabase** as the primary platform:
  1. PostgreSQL for relational product, catalog, and CMS models.
  2. Supabase Data API accessed exclusively via public publishable keys (`VITE_SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_ANON_KEY`).
  3. Mandatory Row Level Security (RLS) on all exposed tables with strict anonymous read-only access for published records.
  4. Repository / data adapter abstraction (`src/entities/*/api/`) so presentation components never invoke raw `supabase.from(...)`.
  5. Service-role secrets (`sb_secret_*`) are strictly forbidden in client-side code.
  6. Payment gateway selection is resolved in ADR-010 (PayTR).
- **Consequences**:
  - Positive: Fast relational queries, out-of-the-box RLS, declarative migrations, seamless future Auth integration.
  - Negative: Requires disciplined query adapter boundary and strict RLS policy auditing.
- **Verification**: Verified via `supabase/migrations/`, `src/shared/lib/supabase.ts`, and `docs/SECURITY.md`.

---

## ADR-010: PayTR Selected as Primary Payment Gateway

- **Status**: Approved
- **Date**: 2026-08-28
- **Context**: E-commerce storefront checkout requires a secure, localized, and reliable payment solution in Turkey with future multi-currency readiness. Installment complexity is not required for V1 artisanal ceramics.
- **Decision**: Select **PayTR** as the primary payment gateway using inline iFrame integration (`no_installment = 1`). Hosted redirect is reserved only as documented emergency fallback. The integration uses server-side Supabase Edge Functions for token initialization and HMAC webhook signature verification.
- **Consequences**:
  - Positive: Seamless inline checkout UX (customer stays on `https://shop.monocactus.com`), zero PAN/CVV handling on client, robust server-side fraud prevention.
  - Negative: Requires secure Edge Function secrets (`merchant_id`, `merchant_key`, `merchant_salt`) and dedicated webhook callback endpoint returning exact string `OK`.
- **Verification**: Verified via `docs/PAYMENTS.md` and automated callback verification test suites.

---

## ADR-011: Authenticated Customer Checkout via Supabase Auth & Google OAuth

- **Status**: Approved
- **Date**: 2026-08-28
- **Context**: High-value designer ceramic orders require verified customer identities, contact traceability, and order history tracking. Guest checkout creates orphaned orders and complicates customer support.
- **Decision**: Disable guest checkout. Require all customers to authenticate via Supabase Auth using **Google OAuth** before completing checkout. The customer cart is preserved in local storage across the OAuth redirect cycle. Customer authentication is strictly isolated from Admin RBAC (`admin_users`).
- **Consequences**:
  - Positive: Clean customer identification, zero duplicate fake guest accounts, seamless one-click Google login, customer/admin separation.
  - Negative: Users without Google accounts or who refuse sign-in cannot purchase (accepted product decision for V1).
  - Verification: Verified via `docs/CUSTOMER_AUTH.md` and storefront authentication route guards.

---

## ADR-012: KDV-Inclusive Canonical Pricing and Currency-Ready Money Architecture

- **Status**: Approved
- **Date**: 2026-08-28
- **Context**: Turkish consumer law and luxury retail UX mandate that displayed prices reflect the total price paid by the customer. Adding +20% VAT at checkout causes cart abandonment. In addition, floating-point arithmetic in JavaScript leads to rounding discrepancies.
- **Decision**:
  1. All catalog retail and wholesale prices are canonical **KDV-inclusive consumer prices** (`tax_included = true`). No tax surcharge is added at checkout.
  2. Model monetary amounts using integer minor units (kuruş/cents) at provider boundaries and PostgreSQL `NUMERIC(12,2)` in persistence.
  3. Enable **TRY** as active V1 currency, while architecting schemas and domain models to be future-ready for **USD**, **EUR**, and **GBP**.
  4. Implement currency mapping as a provider boundary adapter (e.g. App `TRY` -> PayTR `TL`).
- **Consequences**:
  - Positive: Transparent checkout pricing, zero float rounding errors, legally compliant consumer pricing, future multi-currency readiness.
  - Negative: Tax breakdowns for accounting/invoices must be extracted backwards from the gross price (`price - (price / 1.20)`).
- **Verification**: Verified via `src/entities/order/` and checkout mathematical test suites.

---

## ADR-013: Server-Authoritative Payment/Callback Boundary and Zero Client Trust

- **Status**: Approved
- **Date**: 2026-08-28
- **Context**: Client-side checkout payloads can be tampered with by malicious actors to forge product prices, shipping fees, wholesale tier eligibility, or payment status.
- **Decision**:
  1. Never trust browser prices, totals, or payment tokens. All order amounts and wholesale MOQ rules are recalculated server-side in Supabase Edge Functions directly from the database.
  2. Client redirect URLs (`merchant_ok_url`, `merchant_fail_url`) are strictly **display-only** and have zero authority to mark orders as paid.
  3. The PayTR server-to-server webhook callback is the **sole authority** for payment confirmation.
  4. Callbacks must verify HMAC signatures, enforce `merchant_oid` uniqueness, execute idempotently, and return exact plaintext `"OK"`.
  5. Full and partial refunds are initiated strictly from authenticated admin backend functions.
- **Consequences**:
  - Positive: Complete protection against price tampering, replay attacks, and forged payments.
  - Negative: Requires public Edge Function availability and webhook endpoint reachability.
- **Verification**: Verified via `docs/SECURITY.md`, `docs/PAYMENTS.md`, and automated security tests.
