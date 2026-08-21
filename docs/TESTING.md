# Vazo E-Commerce — Testing Architecture & Test Matrix (Phases T1 & T2)

This document defines the automated test architecture, testing standards, test harness conventions, and coverage contract for the **Vazo E-Commerce Platform (Phase 1 Storefront)**.

---

## 1. Testing Stack & Philosophy

The repository implements a multi-tier testing pyramid ensuring correctness, security, accessibility, and visual fidelity without reliance on production dependencies:

- **Unit, Component & Integration**: **Vitest** (v3) + **React Testing Library** + **JSDOM** + `@vitest/coverage-v8`
- **Database Security & RLS**: **pgTAP** schema and Row-Level Security assertions in `supabase/tests/database_security.sql` validated via `scripts/check-db-tests.mjs`
- **Browser E2E & User Journeys**: **Playwright** (Chromium Desktop 1440x900 & Mobile Pixel 5)
- **Automated Accessibility (A11y)**: **@axe-core/playwright** (WCAG 2.1 AA zero critical/serious violation gate)
- **Deterministic Test Design**: Zero network calls to production Supabase or external CDNs; deterministic test factories, local preview server, and mock adapters.

### Core Testing Principles
1. **Behavioral Testing Over Implementation Details**: Tests assert what users and domain services observe (rendering, user events, accessible semantics, API calls, state updates), not private component state or CSS styling details.
2. **Exhaustive Branch & Error Coverage**: Every success, empty, invalid input, timeout/race condition, and network/database failure branch is explicitly exercised.
3. **Strict Console & Secret Hygiene**: Unexpected `console.error` logs fail tests. Production client bundle is scanned to ensure zero leaks of service role keys or environment secrets.
4. **Isolated Storage State**: `localStorage` is completely isolated and corrupted data recovery is asserted.

---

## 2. Directory Structure

```text
tests/
  setup.ts                   # Global JSDOM setup, matchers, cleanup, and console spies
  factories/                 # Typed, deterministic test data factories
    product.factory.ts
    category.factory.ts
    collection.factory.ts
    content.factory.ts
  mocks/                     # Reusable mock helpers
    supabase-mock.ts
    local-storage-mock.ts
  utils/                     # Test rendering and navigation helpers
    render-utils.tsx
    test-helpers.ts
  unit/                      # Pure function, store, configuration, and entity repository tests
    shared/                  # cn, formatters, seo, supabase config, hooks, site-config
    entities/                # product, category, collection, content repositories & mutations
    stores/                  # cart-store, wishlist-store
  component/                 # UI primitives and composite storefront component tests
    shared-ui/               # primitives, quantity-selector
    site/                    # announcement-bar, navbar, mega-menus, drawers, modals, cards, footer
    pdp/                     # gallery, purchase-panel, tiers, story, inspiration, accordions
    home/                    # hero, editorial, split, categories, benefits, newsletter
  integration/               # Full route integrations with mock data & router harness
    catalog-pages.test.tsx
    category-page.test.tsx
    collection-pages.test.tsx
    product-detail-page.test.tsx
    wholesale-pages.test.tsx
    content-pages.test.tsx
    router-integration.test.tsx
  e2e/                       # Playwright Browser End-to-End Test Suite
    smoke.spec.ts            # 21 public routes clean load & title checks (42 tests Desktop/Mobile)
    homepage.spec.ts         # Announcement dismissal, hero dual toggle, newsletter, category nav
    navigation.spec.ts       # CMD+K search modal, debounced results, mega menus, mobile drawer
    catalog.spec.ts          # Category filters, price sorting, zero result recovery
    pdp.spec.ts              # Flagship PDP, swatches, accordions, add to cart, zoom modal
    cart-wishlist.spec.ts    # Cart lifecycle, wishlist persistence, corrupt localStorage recovery
    wholesale-trade.spec.ts  # B2B landing, models, Trade application form submission
    a11y.spec.ts             # Axe-core automated WCAG 2.1 AA audit across all templates
    responsive.spec.ts       # 9-viewport matrix (320px to 1920px) zero horizontal scroll audit
    visual-regression.spec.ts# Layout alignment with approved design references 01-05
    security-resilience.spec.ts # Production bundle secret scan & offline degradation
supabase/tests/
  database_security.sql      # 28 pgTAP assertions checking RLS and anonymous restrictions
```

---

## 3. Database Security & RLS Test Contract

The database test suite (`supabase/tests/database_security.sql`) enforces Postgres Row-Level Security rules:

1. **Table RLS Status**: All 6 public tables (`products`, `product_variants`, `trade_applications`, `contact_messages`, `newsletter_subscriptions`, `site_settings`) must have Row-Level Security enabled.
2. **Catalog & Settings Read Protection**: Anonymous `anon` role can SELECT only `status = 'published'` products/variants and active site settings.
3. **Catalog Write Prohibition**: Anonymous `anon` role CANNOT INSERT, UPDATE, or DELETE any catalog items or site settings.
4. **Lead & Form Ingestion Security**: Anonymous role can INSERT into `trade_applications`, `contact_messages`, and `newsletter_subscriptions` but CANNOT SELECT, UPDATE, or DELETE records from other users.
5. **Newsletter Idempotency**: Unique constraint on `newsletter_subscriptions(email)` prevents duplicate insertions.

---

## 4. E2E & Accessibility Test Matrix

| Suite | Target Area | Key Scenarios Verified |
| :--- | :--- | :--- |
| **Smoke** | 21 Public Routes | HTTP 200, clean React render, expected heading/title, zero console errors. |
| **Homepage** | Hero & Interactivity | Announcement bar dismissal, Hero dual Retail/B2B toggle, newsletter submission feedback, category tile routing. |
| **Navigation** | Header & Drawers | Search trigger via CMD+K / button, 200ms debounce, desktop mega menus on hover, mobile drawer accordion navigation. |
| **Catalog** | Catalog & Filtering | Product grid, category filter badge toggle, price sort (low-to-high, high-to-low), clear filters empty state recovery. |
| **PDP** | Flagship Product | Gallery thumbs, color variant selection, out-of-stock badge behavior, accordions, add to cart, zoom modal with Escape. |
| **Cart & Wishlist** | Persistence & State | Cart drawer, item quantity change, item removal, wishlist toggle, wishlist page display, corrupted `localStorage` graceful recovery. |
| **Wholesale** | B2B & Application | Wholesale landing page, target audience tiles, volume discount tiers, Trade Application form submit with success confirmation. |
| **Accessibility** | Axe-core & WCAG AA | Automated axe-core scan on all templates with zero critical/serious violations; modal dialog focus trapping & restoration. |
| **Responsive** | 9 Viewports | 320px, 375px, 390px, 430px, 768px, 1024px, 1280px, 1440px, 1920px verified with zero horizontal overflow (`scrollWidth <= clientWidth`). |
| **Visual Regr.** | Approved References | Layout alignment against Reference 01 (Mega Menu), 02 (Editorial), 03 (Split), 04 (PDP), and 05 (Hybrid Hero). |
| **Security** | Secrets & Resilience | Client JS bundle scan ensures 0 secret keys; offline/network error graceful degradation. |

---

## 5. Verification Commands & CI Pipeline

```bash
# Run unit & component test suite
npm run test:unit

# Run tests with coverage threshold gate (98%+ line coverage)
npm run test:coverage

# Run database security RLS validation
npm run test:db

# Run Playwright Browser E2E tests (Desktop & Mobile)
npm run test:e2e

# Run Axe-core WCAG 2.1 AA Accessibility audit
npm run test:a11y

# Run full project verification gate (repo safety, line limits, linter, typecheck, DB, coverage, build)
npm run verify
```
