# System Architecture & Technical Specifications

This document defines the high-level architecture, module boundaries, and data flow patterns for the **Vazo E-Commerce Platform**.

---

## 1. Top-Level Architectural Decisions

### 1.1 Single Repository, Single Application
The platform is organized as a unified, monolithic frontend repository containing:
- **Public Storefront** (`src/site/`): High-end editorial e-commerce experience for both Retail (B2C) and Wholesale (B2B).
- **Admin Panel** (`src/admin/`): Back-office control interface routed under the `/admin/*` namespace.
- **Shared Entities & Domain Models** (`src/entities/`): Product, category, order, collection, and customer interfaces.
- **Shared Core & UI Components** (`src/shared/`): Common UI primitives, hooks, API adapters, formatters, and design token bridges.

```
                      ┌────────────────────────────────────────┐
                      │              Browser (App)             │
                      └───────────────────┬────────────────────┘
                                          │
                        ┌─────────────────┴─────────────────┐
                        │         React Router v6           │
                        └────────┬─────────────────┬────────┘
                                 │                 │
                  ┌──────────────▼──────┐   ┌──────▼──────────────┐
                  │    Storefront       │   │    Admin Panel      │
                  │   Path: `/*`        │   │   Path: `/admin/*`  │
                  │   Dir: `src/site/`  │   │   Dir: `src/admin/` │
                  └──────────────┬──────┘   └──────┬──────────────┘
                                 │                 │
                                 └────────┬────────┘
                                          │
                  ┌───────────────────────▼───────────────────────┐
                  │              Shared Domain Entities           │
                  │              Dir: `src/entities/`             │
                  └───────────────────────┬───────────────────────┘
                                          │
                  ┌───────────────────────▼───────────────────────┐
                  │            Shared Core & UI System            │
                  │              Dir: `src/shared/`               │
                  └───────────────────────┬───────────────────────┘
                                          │
                  ┌───────────────────────▼───────────────────────┐
                  │             Design Token System               │
                  │            Dir: `design-tokens/`              │
                  └───────────────────────────────────────────────┘
```

---

## 2. Directory Structure & Boundaries

```
src/
├── app/                  # Application bootstrap, root router, top-level providers, global CSS
│   ├── providers/        # Global context providers (Theme, Auth, Query, Notification)
│   ├── router/           # Root router definition combining site and admin route trees
│   └── styles/           # Global styles and Tailwind CSS variable imports
├── site/                 # Public Storefront
│   ├── components/       # Storefront-specific UI (Navbar, AnnouncementBar, Footer, MegaMenu)
│   ├── features/         # Storefront features (Catalog, Cart, WholesaleInquiry, Checkout)
│   ├── layouts/          # StorefrontLayout shell
│   └── pages/            # Public route pages (HomePage, ProductDetailPage, WholesalePage, etc.)
├── admin/                # Admin Panel
│   ├── components/       # Admin-specific UI (AdminHeader, AdminSidebar, StatsCard)
│   ├── features/         # Admin features (ProductManagement, OrderManagement, CMSManager)
│   ├── layouts/          # AdminLayout shell
│   └── pages/            # Admin route pages (AdminDashboard, AdminProducts, AdminOrders, etc.)
├── entities/             # Canonical domain models & type definitions
│   ├── product/          # Product, variant, dimensions, material, and pricing models
│   ├── category/         # Category hierarchy and metadata
│   ├── collection/       # Curated editorial collections
│   ├── order/            # Retail and wholesale order entities
│   └── customer/         # B2C customer, B2B trade account, and trade application models
└── shared/               # Reusable primitives across storefront and admin
    ├── api/              # Provider-neutral API contracts and HTTP client abstractions
    ├── config/           # Safe public site configuration and navigation definitions
    ├── hooks/            # Reusable React hooks (useDisclosure, useMediaQuery, etc.)
    ├── lib/              # Utility functions (formatting, validation, classnames)
    ├── mocks/            # Isolated mock datasets and mock service adapters
    ├── types/            # Global shared TypeScript utility types
    └── ui/               # Design-token-driven atomic UI primitives (Button, Badge, Input, Card)
```

---

## 3. Allowed Import Directions & Boundary Rules

To prevent spaghetti dependencies, imports must strictly respect the directional hierarchy:

1. **`src/site/`** may import from `src/entities/` and `src/shared/`.
2. **`src/admin/`** may import from `src/entities/` and `src/shared/`.
3. **`src/site/` and `src/admin/` must NEVER import directly from each other.**
4. **`src/shared/` and `src/entities/` must NEVER import from `src/site/`, `src/admin/`, or `src/app/`.**
5. **`src/app/`** stitches together `src/site/`, `src/admin/`, and global providers.

---

## 4. Retail & Wholesale Shared Catalog Architecture

The platform serves both individual retail buyers and commercial wholesale partners through a unified catalog:

- **Single Identity**: A product has one canonical ID, slug, name, imagery, dimensions, material, and stock inventory.
- **Contextual Pricing**:
  - **Retail**: Single unit price, standard cart addition, standard checkout.
  - **Wholesale**: Volume-tiered pricing, minimum order quantities (MOQ), commercial trade applications, quote request flows.
- **Shared Navigation**: Dedicated `Perakende` (Retail) and `Toptan` (Wholesale) mega menus providing clear entry points into both purchasing journeys while sharing common underlying product entities.

---

## 5. Backend & Data Layer Abstraction

Following [`ADR.md`](file:///D:/freelance/vazo-website/docs/ADR.md#adr-009), **Supabase** is selected as the primary backend platform (PostgreSQL, Data API, Auth, Storage, Edge Functions). Payment gateway selection remains pending.

### Data Access Rules
1. **Repository / Query Adapter Layer**: All database access is channeled through typed repository functions in `src/entities/*/api/` or `src/shared/api/`.
2. **No Raw DB Calls in UI**: UI components must **never** invoke `supabase.from(...)` directly.
3. **Public Publishable Key**: Browser code uses exclusively `VITE_SUPABASE_PUBLISHABLE_KEY` (or `VITE_SUPABASE_ANON_KEY`). Service-role secrets are forbidden.
4. **Mandatory Row Level Security (RLS)**: Public anonymous users can only query active/published records.
5. **Deterministic Mock Fallback**: When `VITE_ENABLE_MOCK_DATA="true"` or when Supabase is unconfigured, the application runs against isolated mock adapters in `src/shared/mocks/`. Real mode failure triggers clear error handling rather than silent fallback.

