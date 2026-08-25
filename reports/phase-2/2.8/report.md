# Phase 2.8 Report — Homepage CMS and Live Storefront Wiring

## Objective
The primary goal of Phase 2.8 was to transform the active Reference-03 Homepage from static, hardcoded marketing fixtures into dynamic, Supabase-backed CMS and catalog-driven components, and to build a dedicated Admin Homepage CMS management interface at `/admin/content`.

Key objectives achieved:
1. Replaced hardcoded hero slides in `SplitHeroReference03` with dynamic dual-slot (Retail vs Wholesale) content fetched via `contentRepository.getSplitHero()`.
2. Removed hardcoded product arrays in `BestSellersRailReference03`, wiring live data fetching to `productRepository.getBestsellers(6)` while preserving smooth horizontal scrolling, wishlist interactions, and responsive card presentation.
3. Connected `CommercialBenefitsReference03` to `contentRepository.getWholesaleBenefits()` with safe allowlisted Lucide icon rendering.
4. Created real Admin CMS management at `/admin/content` supporting CRUD for Hero vitrines (with Supabase Storage media upload via `AssetUploadButton`) and Wholesale commercial benefits.
5. Enforced strict data mode contracts: Live mode failure presents explicit loading/error states with retry capabilities, never silently falling back to mock fixtures.

---

## Starting Commit
`44ac37418c05f0676dd7999df33521a1b1b2cf4e`

## Implementation Commit
`7bac181d7a783f643194c57c1afeeb8de8b98222`

---

## Current Homepage Components
The storefront HomePage (`src/site/pages/HomePage.tsx`) actively renders the Reference-03 design composition:
1. `SplitHeroReference03`: Dual split-screen visual hero showcasing distinct B2C (Perakende) and B2B (Toptan) value propositions, dynamic imagery, custom CTAs, and eyebrow badges.
2. `BestSellersRailReference03`: Curated product carousel showcasing 6 published bestseller products with price formatting, tag badges, wishlist toggle, and responsive horizontal rail controls.
3. `CommercialBenefitsReference03`: Five-column commercial value proposition section detailing bulk pricing, custom production, MOQ flexibility, and dedicated logistics for B2B buyers.

---

## CMS Mapping

### 1. Split Hero (`public.hero_slides`)
- `slot`: `'retail' | 'wholesale' | 'general'` (identifies left vs right homepage vitrine slot)
- `eyebrow`: Optional pill badge above main title (e.g. "BİREYSEL ALIŞVERİŞ", "KURUMSAL & TOPTAN")
- `title`: Hero headline (e.g. "Perakende", "Toptan Satış")
- `description`: Value proposition paragraph
- `image_url`: Curated hero photograph (supports direct upload to `public-media/cms/...`)
- `primary_cta_text` & `primary_cta_url`: Action button target (e.g. "Alışverişe Başla" -> `/products`)
- `sort_order`: Display precedence
- `active`: Boolean publication toggle

### 2. Commercial Benefits (`public.wholesale_benefits`)
- `title`: Benefit header
- `description`: Benefit explanation
- `icon_name`: Allowlisted Lucide icon name (`Tag`, `Boxes`, `Award`, `Truck`, `Headphones`, `Building2`, `PackageCheck`, `Palette`, `ShieldCheck`, `Zap`, `Sparkles`)
- `sort_order`: Sequence order in the 5-column grid
- `active`: Boolean publication toggle

---

## Hardcoded Content Removed
1. `BestSellersRailReference03.tsx`: Completely excised the inline 6-product mock array (`MOCK_BESTSELLERS`). All cards are now populated strictly from `productRepository.getBestsellers(6)`.
2. `SplitHeroReference03.tsx`: Removed static inline Turkish marketing copy and hardcoded Unsplash URLs.
3. `CommercialBenefitsReference03.tsx`: Replaced static inline 5-card array with database-driven queries.

---

## Remaining Hardcoded Business Content
- Static site metadata & legal policy copy (located in policy bottom sheet and footer, intentionally static until legal CMS phase).
- Static navigation categories/links in `SiteNavbar.tsx` (mirroring current taxonomy categories).

---

## Schema Changes
Additive migration applied: `supabase/migrations/20260826030000_phase2_homepage_cms.sql`
- Added column `slot TEXT NOT NULL DEFAULT 'retail' CHECK (slot IN ('retail', 'wholesale', 'general'))` to `public.hero_slides`.
- Created index `idx_hero_slides_slot_active ON public.hero_slides(slot, active, sort_order)`.
- Seeded default retail & wholesale hero slides and 5 standard commercial benefits into `public.hero_slides` and `public.wholesale_benefits`.

---

## Storefront Live Behavior
- **Data Source**: Queries Supabase tables `hero_slides`, `wholesale_benefits`, and `products` (filtered by `bestseller = true AND active = true AND status = 'published'`).
- **Failure Isolation**: On Supabase query failure or network disconnection, components display truthful error states with a retry button (`Yeniden Dene`). Under no circumstances do live failures silently fall back to mock fixtures.
- **Loading UX**: Smooth animated skeleton loaders prevent layout shift during asynchronous data retrieval.

---

## Storefront Mock Behavior
- In offline/mock development mode (`VITE_DATA_MODE=mock` or when Supabase credentials are not configured), repositories seamlessly serve realistic in-memory fixtures (`mockSplitHero`, `mockWholesaleBenefits`, `mockProducts`).

---

## Tests
Comprehensive unit, component, and integration tests have been implemented and validated:
1. `tests/unit/admin/admin-content-repository.test.ts` (8 tests): Validates hero and benefit CRUD operations, sorting, and slot querying.
2. `tests/unit/entities/content-repository.test.ts` (16 tests): Validates `getSplitHero()`, `getWholesaleBenefits()`, and strict error throwing on live failures.
3. `tests/component/site/split-hero-reference03.test.tsx` (2 tests): Tests dynamic split hero rendering and retry flow.
4. `tests/component/site/bestsellers-rail-reference03.test.tsx` (3 tests): Tests real bestseller fetching, wishlist toggle, and error handling.
5. `tests/component/site/commercial-benefits-reference03.test.tsx` (2 tests): Tests 5-column benefit grid rendering with allowlisted icons.
6. `tests/component/admin/admin-content-page.test.tsx` (5 tests): Tests tab switching, modal editing, slide creation, and benefit deletion with confirmation dialogs.

### Quality Gate Results
- `npm run check:repo`: PASSED (0 secret leaks / sensitive file violations)
- `npm run check:lines`: PASSED (all files <= 600 lines)
- `npm run lint`: PASSED (0 errors, 0 warnings)
- `npm run typecheck`: PASSED (0 TypeScript errors)
- `npm run test`: PASSED (66 test suites, 404/404 tests passing)
- `npm run test:db`: PASSED (38 pgTAP database assertions passing)
- `npm run build`: PASSED (production bundle built successfully in 4.87s)

---

Main branch modified: NO
Main branch pushed: NO
Merge performed: NO
Working branch: phase-2
