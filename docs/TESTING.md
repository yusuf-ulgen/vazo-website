# Vazo E-Commerce — Testing Architecture & Test Matrix (Phase 2 Green Gate)

This document defines the automated test architecture, testing standards, test harness conventions, and coverage contract for the **Vazo E-Commerce Platform**.

---

## 1. Testing Stack & Philosophy

The repository implements a multi-tier testing pyramid ensuring correctness, security, accessibility, and visual fidelity without reliance on production dependencies:

- **Unit, Component & Integration**: **Vitest** (v3) + **React Testing Library** + **JSDOM** + `@vitest/coverage-v8` (479 tests across 87 suites, >96% line coverage)
- **Database Security & RLS**: **pgTAP** schema, Row-Level Security, and audit immutability assertions in `supabase/tests/database_security.sql` (44 planned assertions validated via `scripts/check-db-tests.mjs`)
- **Edge Functions Security**: Service role authority, payload allowlists, size limits, and honeypot anti-spam verification in `tests/unit/functions/edge-functions.test.ts`
- **Browser E2E & User Journeys**: **Playwright** (Chromium Desktop 1440x900 & Mobile Pixel 5)
- **Automated Accessibility (A11y)**: **@axe-core/playwright** (WCAG 2.1 AA zero critical/serious violation gate)
- **Deterministic Test Design**: Zero network calls to production Supabase or external CDNs; deterministic test factories, local preview server, and mock adapters.

### Core Testing Principles
1. **Behavioral Testing Over Implementation Details**: Tests assert what users and domain services observe (rendering, user events, accessible semantics, API calls, state updates), not private component state or CSS styling details.
2. **Exhaustive Branch & Error Coverage**: Every success, empty, invalid input, timeout/race condition, and network/database failure branch is explicitly exercised.
3. **Public Mutation Security Boundary**: Browser client communicates with Edge Functions (`supabase.functions.invoke(...)`) with Service Role authority for public mutations (`trade_applications`, `contact_messages`, `newsletter_subscriptions`). Direct anonymous PostgreSQL INSERT is prohibited by RLS.
4. **Strict Console & Secret Hygiene**: Unexpected `console.error` logs fail tests. Production client bundle is scanned to ensure zero leaks of service role keys or environment secrets.
5. **Isolated Storage State**: `localStorage` is completely isolated and corrupted data recovery is asserted.
6. **Immutable Audit Enforcement**: Database trigger prevents `UPDATE` and `DELETE` on `admin_audit_logs` under error code `27000`.

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
    admin/                   # admin inventory, pricing, products, collections, categories, content, audit repos
    functions/               # edge functions security rules, allowlists, honeypot
    stores/                  # cart-store, wishlist-store, policy-drawer-store, settings-store
  component/                 # UI primitives and composite storefront & admin component tests
    admin/                   # admin pages, modals, data tables, status badges, forms, audit viewer
    shared-ui/               # primitives, quantity-selector, dialogs, form fields
    site/                    # announcement-bar, navbar, mega-menus, drawers, modals, cards, footer
    pdp/                     # gallery, purchase-panel, tiers, story, inspiration, accordions
    home/                    # split hero, best sellers rail, commercial benefits
  integration/               # Full route integrations with mock data & router harness
    admin/                   # admin-app-integration, admin-crud-flow
    site/                    # catalog-pages, category-page, collection-pages, pdp, wholesale, content-pages
  e2e/                       # Playwright Browser End-to-End Test Suite (126 tests)
    smoke.spec.ts            # 21 public routes clean load & title checks (42 tests Desktop/Mobile)
    homepage.spec.ts         # Announcement dismissal, Split Hero Reference-03, Best Sellers rail
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
  database_security.sql      # 44 pgTAP assertions checking RLS, anonymous denials, and audit trigger immutability
```

---

## 3. Database Security & RLS Test Contract (44 pgTAP Assertions)

The database test suite (`supabase/tests/database_security.sql`) enforces Postgres Row-Level Security rules:

1. **Table RLS Status**: All public tables (`admin_users`, `products`, `product_variants`, `categories`, `collections`, `wholesale_price_tiers`, `content_pages`, `content_sections`, `faq_groups`, `faq_items`, `navigation_menu_groups`, `navigation_menu_items`, `site_settings`, `trade_applications`, `contact_messages`, `newsletter_subscriptions`, `admin_audit_logs`) have Row-Level Security enabled.
2. **Catalog & Settings Read Protection**: Anonymous `anon` role can SELECT only `status = 'published'` products/variants and active public site settings.
3. **Catalog Write Prohibition**: Anonymous `anon` role CANNOT INSERT, UPDATE, or DELETE any catalog items, content pages, or site settings.
4. **Public Mutation Edge Function Boundary**: Direct anonymous INSERT into `trade_applications`, `contact_messages`, and `newsletter_subscriptions` is explicitly DENIED (SQL code 42501). Ingestion occurs strictly via validated Edge Functions executing with `service_role` authority.
5. **Hidden Parent Isolation**: Draft parent products completely hide associated child variants from anonymous users.
6. **Immutable Audit Ledger**: Anonymous users have 0 access to `admin_audit_logs`. Authenticated administrators can SELECT and INSERT, while UPDATE and DELETE are blocked by database triggers with exception code `27000`.

---

## 4. E2E & Accessibility Test Matrix

| Suite | Target Area | Key Scenarios Verified |
| :--- | :--- | :--- |
| **Smoke** | 21 Public Routes | HTTP 200, clean React render, expected heading/title, zero console errors. |
| **Homepage** | Hero & Interactivity | Announcement bar dismissal, Split Hero Reference-03, Commercial Benefits, Best Sellers rail. |
| **Navigation** | Header & Drawers | Search trigger via CMD+K / button, 200ms debounce, desktop mega menus on click, mobile drawer accordion navigation. |
| **Catalog** | Catalog & Filtering | Product grid, category filter badge toggle, price sort (low-to-high, high-to-low), clear filters empty state recovery. |
| **PDP** | Flagship Product | Gallery thumbs, color variant selection, out-of-stock badge behavior, accordions, add to cart, zoom modal with Escape. |
| **Cart & Wishlist** | Persistence & State | Cart drawer, item quantity change, item removal, wishlist toggle, wishlist page display, corrupted `localStorage` graceful recovery. |
| **Wholesale & Trade** | B2B Portal | Wholesale landing page, models catalog, multi-step trade application submission, success confirmation. |
| **Accessibility (A11y)** | WCAG 2.1 AA | Axe-Core automated scan across all 8 key storefront templates + dialog focus trapping / restoration. |
| **Responsive Matrix** | Viewport Layouts | 9 viewport widths (320px, 375px, 390px, 430px, 768px, 1024px, 1280px, 1440px, 1920px) tested for zero horizontal scroll. |
| **Visual Regression** | Reference Layouts | Reference 01 (Header & Mega Menu), Reference 02 (Alternating Sections), Reference 03 (Split Hero), Reference 04 (Flagship PDP). |
| **Security & Resilience** | Secret Scanning | Zero API secrets in production bundle, graceful offline fallback, resilient network handling. |

---

## 5. Verification Commands

```bash
npm run check:repo       # Verify no .env files or secrets are staged
npm run check:lines      # Verify hard 600 line limit across all source files
npm run lint             # ESLint analysis
npm run typecheck        # TypeScript compiler verification
npm run test:coverage    # Vitest 479 unit/component tests & coverage check
npm run test:db          # pgTAP 44 database security assertions
npm run build            # Vite production bundle build
npm run test:a11y        # Axe-Core WCAG 2.1 AA automated accessibility tests
npm run test:e2e         # Full Playwright 126 E2E tests
```
