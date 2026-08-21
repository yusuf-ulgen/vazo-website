# Vazo E-Commerce Platform

> Premium designer ceramic vase e-commerce platform with a shared retail (B2C) and wholesale (B2B) catalog, integrated back-office administration (`/admin`), and centralized design token governance.

---

## 1. Project Overview

The **Vazo E-Commerce Platform** is a monolithic React application hosting both the public luxury storefront and the back-office administration panel in a single repository:

- **Public Storefront (`src/site/`) — [Phase 1 Complete]**:
  - High-fidelity Scandinavian-inspired, editorial e-commerce experience developed directly from 5 approved visual mockups.
  - Dual Mega Menus (**Perakende** / Retail and **Toptan** / Wholesale B2B).
  - Dynamic Announcement Bar, 9-part Homepage story flow, and responsive 4-column Catalog browsing.
  - Flagship Product Detail Page (PDP) with vertical thumbnail gallery, zoom viewer, interactive swatches, and live B2B volume pricing tier table.
  - Dedicated B2B & Trade Portal (`/wholesale`, `/wholesale/products`, `/wholesale/how-it-works`, `/wholesale/apply`).
  - Search modal (CMD+K / keyboard accessible), reactive Wishlist (`/wishlist`), and Slide-over Cart (`/cart`) with free shipping progress meter.
  - Supporting public pages (`/about`, `/contact`, `/faq`, `/policies/*`, `/404`).
- **Admin Panel (`src/admin/`) — [Phase 2 Scheduled]**:
  - Back-office control interface routed under `/admin/*` for managing products, categories, collections, wholesale trade applications, inventory, pricing, CMS content, and site settings.
- **Shared Catalog Architecture**:
  - Single unified product identity with shared specifications and media, dynamically supporting retail pricing and volume-tiered wholesale terms (MOQ, tier discounts).
- **Centralized Design Tokens (`design-tokens/`)**:
  - Primitive, semantic, and component token hierarchy compiled into CSS variables and Tailwind utility classes.

---

## 2. Technology Stack

- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Bundler & Tooling**: [Vite](https://vitejs.dev/)
- **Routing**: [React Router v6](https://reactrouter.com/)
- **Database & Backend Layer**: [Supabase](https://supabase.com/) (PostgreSQL 15, RLS policies, typed repositories, and mock toggle)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + CSS Custom Properties (Design Tokens)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Code Quality**: ESLint 9 Flat Config + Custom Line-Length and Repository Safety Scripts
- **Testing**: [Vitest](https://vitest.dev/)

---

## 3. Directory Structure

```
├── .gemini/
│   └── skills/
│       └── vazo-project-guardian/ # Workspace governance agent skill
├── .github/
│   └── workflows/ci.yml           # Automated CI verification pipeline
├── design-tokens/                 # Visual source of truth (primitive, semantic, component)
│   └── tokens/
├── docs/                          # Canonical architectural and operational documentation
│   ├── ARCHITECTURE.md            # Module boundaries, dependency diagram, import rules
│   ├── ADR.md                     # Formal Architecture Decision Records (ADR-001 to ADR-009)
│   ├── INSTRUCTIONS.md            # AI agent & developer engineering contract
│   ├── FRONTEND.md                # Storefront UX and mega-menu architecture
│   ├── ADMIN.md                   # Full admin scope & functional-or-disabled contract
│   ├── ECOMMERCE.md               # Domain models and pricing tier structures
│   ├── DESIGN_SYSTEM.md           # Semantic tokens, typography scales, palettes
│   ├── STOREFRONT_VISUAL_SPEC.md  # Approved mockup specifications & component contract
│   ├── STOREFRONT_COMMERCE_CONTRACT.md # Search, wishlist, cart & checkout contract
│   ├── SECURITY.md                # Secrets policy, VITE_* warning, XSS safety
│   ├── DELIVERY.md                # Quality assurance gates & CI commands
│   └── ONBOARDING.md              # New developer bootstrap guide
├── scripts/
│   ├── check-file-length.mjs      # Hard 600-line source file limit enforcer
│   └── check-repository-safety.mjs# Secret leak & sensitive file scanner
├── supabase/                      # Database schema, migrations, seeds & docs
│   ├── migrations/                # Initial storefront tables and RLS policies
│   ├── seed/                      # Deterministic demo seed SQL
│   └── README.md                  # Supabase bootstrap and connection guide
├── src/
│   ├── app/                       # Global providers, router, and design token CSS
│   ├── site/                      # Public Storefront (components, features, layouts, pages)
│   ├── admin/                     # Admin Panel (components, features, layouts, pages)
│   ├── entities/                  # Domain models & typed repositories (Product, Category, etc.)
│   ├── shared/                    # Reusable UI primitives, stores, formatters, and mock API
│   └── main.tsx                   # React application entry point
├── GEMINI.md                      # AI coding agent project contract
└── package.json
```

---

## 4. Local Development

### 4.1 Prerequisites
- **Node.js**: >= 20.x / 22.x
- **npm**: >= 10.x

### 4.2 Installation & Run
```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env.local

# 3. Start development server
npm run dev
```

Visit:
- **Public Storefront**: `http://localhost:5173/`
- **Admin Panel**: `http://localhost:5173/admin`

---

## 5. Verification & Quality Gates

Run the comprehensive verification suite before committing code:

```bash
npm run verify
```

This executes:
1. `npm run check:repo` — Scans for secret leaks and forbidden files.
2. `npm run check:lines` — Enforces the **hard 600-line maximum** per source file.
3. `npm run lint` — ESLint static analysis.
4. `npm run typecheck` — Strict TypeScript compilation check.
5. `npm run test` — Vitest unit and contract tests.
6. `npm run build` — Production Vite bundle compilation.

---

## 6. Development Status & Roadmap

- **Phase 1 (Storefront & Data Foundations)**: ✅ **100% COMPLETE & VERIFIED**
- **Phase 2 (Admin Panel & Store Management)**: ⏳ **NEXT**
  - Full Admin CRUD for Products, Categories, Collections, Inventory, Pricing, and Content.
  - Supabase Auth integration (Admin role & B2B customer accounts).
  - Trade Application Review & Approval Workflow.
  - Production Payment Gateway Integration (Iyzico / Stripe / PayTR).
