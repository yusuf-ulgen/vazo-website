# Vazo E-Commerce — Phase T1 Testing Architecture & Test Matrix

This document defines the automated test architecture, testing standards, test harness conventions, and coverage contract for the **Vazo E-Commerce Platform (Phase 1 Storefront)**.

---

## 1. Testing Stack & Philosophy

The test suite runs on **Vitest** in combination with **React Testing Library** and **JSDOM**:

- **Test Runner**: Vitest (v3) with `@vitest/coverage-v8`
- **Component Testing**: `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`
- **DOM Environment**: JSDOM with clean globals and automatic DOM cleanup
- **Deterministic Test Design**: Zero network calls to production Supabase or external CDNs; deterministic test factories and mock adapters.

### Core Testing Principles
1. **Behavioral Testing Over Implementation Details**: Tests assert what users and domain services observe (rendering, user events, accessible semantics, API calls, state updates), not private component state or CSS styling details.
2. **Exhaustive Branch & Error Coverage**: Every success, empty, invalid input, timeout/race condition, and network/database failure branch is explicitly exercised.
3. **Strict Console Hygiene**: Unexpected `console.error` or `console.warn` outputs immediately fail the test suite.
4. **Isolated Storage State**: `localStorage` is completely mocked and cleared between every test run to prevent bleed.

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
    shared/
      cn.test.ts
      formatters.test.ts
      seo.test.ts
      supabase-config.test.ts
      hooks.test.ts
      site-config.test.ts
    entities/
      product-repository.test.ts
      category-repository.test.ts
      collection-repository.test.ts
      content-repository.test.ts
      mutations.test.ts
    stores/
      cart-store.test.ts
      wishlist-store.test.ts
  component/                 # UI primitives and composite storefront component tests
    shared-ui/
      ui-primitives.test.tsx
      quantity-selector.test.tsx
    site/
      announcement-bar.test.tsx
      site-navbar.test.tsx
      mega-menus.test.tsx
      mobile-nav-drawer.test.tsx
      search-modal.test.tsx
      cart-drawer.test.tsx
      product-card.test.tsx
      site-footer.test.tsx
    pdp/
      product-gallery.test.tsx
      product-purchase-panel.test.tsx
      pdp-supporting.test.tsx
    home/
      homepage-sections.test.tsx
  integration/               # Full route integrations with mock data & router harness
    catalog-pages.test.tsx
    category-page.test.tsx
    collection-pages.test.tsx
    product-detail-page.test.tsx
    wholesale-pages.test.tsx
    content-pages.test.tsx
    router-integration.test.tsx
```

---

## 3. Coverage Contract & Documented Exclusions

The test target for all first-party storefront logic is **100% Statements, 100% Branches, 100% Functions, 100% Lines**.

### Legitimate Documented Exclusions
The following files are strictly excluded from code coverage calculation:
1. `src/**/*.d.ts` & `src/vite-env.d.ts`: Pure TypeScript type definitions with no emitted JavaScript runtime code.
2. `src/entities/*/types.ts`: Pure TypeScript interfaces and types.
3. `src/main.tsx`: Application DOM mount bootstrap point (`ReactDOM.createRoot`).
4. `src/admin/**`: Phase 2 Back-office admin panel scaffold modules. (Tested at router lazy boundary level to ensure storefront does not break).

---

## 4. Test Matrix by Module

| Category | Target Module / Component | Key Scenarios Tested |
| :--- | :--- | :--- |
| **Pure Utilities** | `src/shared/lib/cn.ts` | Single class, multiple classes, conditionals, falsy values, Tailwind conflict resolution (`px-2 px-4`). |
| **Pure Utilities** | `src/shared/lib/formatters.ts` | Currency (`₺`, decimals, zero, negative), dimension specs, date formatters. |
| **Pure Utilities** | `src/shared/lib/seo.ts` | Document title, meta description, OG tags, canonical link creation, unmount restoration/cleanup. |
| **Pure Utilities** | `src/shared/lib/supabase.ts` | Mock mode, live client configuration, missing credentials, invalid placeholder, secret prevention. |
| **Hooks** | `src/shared/hooks/useDisclosure.ts` | Default state, open, close, toggle, controlled handlers. |
| **Hooks** | `src/shared/hooks/useMediaQuery.ts` | MatchMedia mock, resize listener, state update, cleanup on unmount. |
| **Stores** | `src/shared/stores/cart-store.ts` | Initial state, add new product, add existing product + variant (increment), different variant, stock clamping, out-of-stock rejection, retail-disabled rejection, update quantity, remove, clear, subtotal/free shipping calculations, localStorage persistence, malformed/corrupted JSON recovery, immutability, subscription listener. |
| **Stores** | `src/shared/stores/wishlist-store.ts` | Empty, toggle add/remove, has, remove, clear, duplicates prevention, hydration, corrupt JSON recovery, listener subscription/unsubscription. |
| **Repositories** | `src/entities/product/api/product-repository.ts` | Mock & Live parity, retailOnly, wholesaleOnly, category filtering, collection filtering, searchQuery sanitization, sort options (recommended, newest, price_asc, price_desc), pagination, getProductBySlug, not found (PGRST116), error throwing in live mode without silent mock fallback, multi-category matching, zero stock mapping. |
| **Repositories** | `src/entities/category/api/category-repository.ts` | Mock & Live parity, getCategories, active filter, sort order, getCategoryBySlug, missing slug, error throwing in live mode. |
| **Repositories** | `src/entities/collection/api/collection-repository.ts` | Mock & Live parity, getCollections, featured filter, getCollectionBySlug, missing slug, error throwing in live mode. |
| **Repositories** | `src/entities/content/api/content-repository.ts` | Mock & Live parity for getSiteSettings, getAnnouncement, getHeroContent, getEditorialSections, getWholesaleBenefits, getMegaMenu ('retail_mega', 'wholesale_mega'), error throwing in live mode, mutation clients (submitTradeApplication, submitContactMessage, subscribeNewsletter) with edge function fallback. |
| **UI Primitives** | `Badge`, `Button`, `IconButton`, `PriceDisplay`, `ProductImage`, `Container`, `Section`, `Divider`, `EditorialHeading`, `Eyebrow`, `SectionHeader`, `QuantitySelector` | Render, variants, sizes, onClick events, disabled states, accessibility attributes (`aria-label`, keyboard interaction, min/max limits). |
| **Navigation & Header** | `AnnouncementBar`, `SiteNavbar`, `PerakendeMegaMenu`, `ToptanMegaMenu`, `MobileNavDrawer` | Live CMS fetch, open/close hover & click, keyboard Escape, focus management, active links, mobile drawer accordions, search trigger. |
| **Storefront Modals** | `SearchModal` | Open/close, autofocus, 200ms debounce, query results, empty results, error state, race condition prevention (stale search sequencing), keyboard Escape, backdrop click, body scroll locking, A11y dialog attributes. |
| **Storefront Modals** | `CartDrawer` | Open/close, item display, quantity change, removal, free shipping meter, empty state, checkout action, Escape key, body scroll locking. |
| **Product Detail Components** | `ProductGallery`, `ProductPurchasePanel`, `ProductWholesaleTiers`, `ProductStoryHighlights`, `ProductInspirationGrid`, `ProductAccordions` | Thumbnails click, zoom modal open/close with Escape, variant selection, price update, stock zero handling (disables Add to Cart, shows Stokta Yok), quantity clamping, wholesale MOQ tier calculations, accordion expand/collapse with aria-expanded. |
| **Homepage Sections** | `HeroSection`, `FeaturedProductsSection`, `AlternatingEditorialSection`, `RetailWholesaleSplitSection`, `CategoryTilesSection`, `WholesaleBenefitsSection`, `FeaturedCollectionSection`, `InspirationStorySection`, `NewsletterSection` | CMS and mock rendering, product grid, collection links, real newsletter submit with loading/success/error. |
| **Storefront Pages** | `HomePage`, `CatalogPage` (`/products`, `/new`, `/bestsellers`), `CategoryPage`, `CollectionsIndexPage`, `CollectionDetailPage`, `ProductDetailPage`, `WholesaleLandingPage`, `WholesaleProductsPage`, `WholesaleHowItWorksPage`, `WholesaleApplyPage`, `WishlistPage`, `CartPage`, `AboutPage`, `ContactPage`, `FaqPage`, `PolicyPages`, `NotFoundPage` | Initial load, query filters, sort dropdown, error state retry, trade application form submission, contact form submission, SEO tag updates, 404 handling. |
| **Router** | `src/app/router/index.tsx` | Route table resolution, SiteLayout rendering, 404 wildcard matching, lazy admin route suspense boundary. |

---

## 5. Verification Commands

```bash
# Run unit & component test suite
npm run test

# Run tests with strict coverage report
npm run test:coverage

# Full automated project gate
npm run verify
```
