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

- **Status**: Deferred / Pending Architectural Decision
- **Date**: 2026-08-21
- **Context**: The backend infrastructure (Supabase, Firebase, custom Node API, PostgreSQL), authentication provider, and payment processor (iyzico, Stripe) have not been finalized.
- **Decision**: Do not guess or scaffold any speculative backend framework. Build provider-neutral API contracts and mock data adapters in `src/shared/api/` and `src/shared/mocks/`.
- **Consequences**:
  - Positive: Zero vendor lock-in; clean separation of concerns; instant frontend mocking.
  - Negative: Backend integrations will require explicit implementation in a subsequent phase.
- **Verification**: Recorded in `docs/ADR.md` and `docs/ARCHITECTURE.md`.

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
