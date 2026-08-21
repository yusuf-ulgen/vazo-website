# Vazo E-Commerce Platform

> Premium designer ceramic vase e-commerce platform with a shared retail (B2C) and wholesale (B2B) catalog, integrated back-office administration (`/admin`), and centralized design token governance.

---

## 1. Project Overview

The **Vazo E-Commerce Platform** is a monolithic React application hosting both the public luxury storefront and the back-office administration panel in a single repository:

- **Public Storefront (`src/site/`)**: Scandinavian-inspired, editorial e-commerce experience featuring separate **Perakende** (Retail) and **Toptan** (Wholesale) mega menus, craftsmanship storytelling, and mobile navigation.
- **Admin Panel (`src/admin/`)**: Back-office control interface routed under `/admin/*` for managing products, categories, collections, wholesale trade applications, inventory, pricing, CMS content, and site settings.
- **Shared Catalog Architecture**: Single product identity with shared specifications and media, dynamically supporting retail pricing and volume-tiered wholesale terms (MOQ, tier discounts).
- **Centralized Design Tokens (`design-tokens/`)**: Primitive, semantic, and component token hierarchy compiled into CSS variables and Tailwind utility classes.

---

## 2. Technology Stack

- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Bundler & Tooling**: [Vite](https://vitejs.dev/)
- **Routing**: [React Router v6](https://reactrouter.com/)
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
│   ├── ADR.md                     # Formal Architecture Decision Records (ADR-001 to ADR-008)
│   ├── INSTRUCTIONS.md            # AI agent & developer engineering contract
│   ├── FRONTEND.md                # Storefront UX and mega-menu architecture
│   ├── ADMIN.md                   # Full admin scope & functional-or-disabled contract
│   ├── ECOMMERCE.md               # Domain models and pricing tier structures
│   ├── DESIGN_SYSTEM.md           # Semantic tokens, typography scales, palettes
│   ├── SECURITY.md                # Secrets policy, VITE_* warning, XSS safety
│   ├── DELIVERY.md                # Quality assurance gates & CI commands
│   └── ONBOARDING.md              # New developer bootstrap guide
├── scripts/
│   ├── check-file-length.mjs      # Hard 600-line source file limit enforcer
│   └── check-repository-safety.mjs# Secret leak & sensitive file scanner
├── src/
│   ├── app/                       # Global providers, router, and design token CSS
│   ├── site/                      # Public Storefront (components, features, layouts, pages)
│   ├── admin/                     # Admin Panel (components, features, layouts, pages)
│   ├── entities/                  # Domain models (Product, Category, Order, Customer, CMS)
│   ├── shared/                    # Reusable UI primitives, hooks, formatters, and mock API
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

## 6. Pending Architectural Decisions

As recorded in [`docs/ADR.md`](file:///D:/freelance/vazo-website/docs/ADR.md#adr-007), the following components remain unselected and will be integrated in subsequent phases:
- **Backend Framework / Database**: Pending explicit evaluation.
- **Authentication Provider**: Pending explicit evaluation.
- **Payment Gateway Provider**: Pending explicit evaluation.
- **Production Media / CDN Storage**: Pending explicit evaluation.
