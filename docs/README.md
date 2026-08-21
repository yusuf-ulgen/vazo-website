# Vazo E-Commerce Platform — Documentation Index

This directory contains the canonical architectural, operational, design, and governance documentation for the **Vazo E-Commerce Platform** (`yusuf-ulgen/vazo-website`).

## Canonical Document Map

| Document | Purpose | When to Read | What It Governs |
| :--- | :--- | :--- | :--- |
| [`INSTRUCTIONS.md`](file:///D:/freelance/vazo-website/docs/INSTRUCTIONS.md) | AI agent and developer operational contract | Before starting any code task | Engineering standards, 600-line limit, secret policy, modification rules |
| [`ARCHITECTURE.md`](file:///D:/freelance/vazo-website/docs/ARCHITECTURE.md) | System topology and dependency boundaries | When designing features or modules | Single-repo rule, folder boundaries, routing, import directions, state separation |
| [`ADR.md`](file:///D:/freelance/vazo-website/docs/ADR.md) | Architecture Decision Records | When proposing or reviewing structural choices | History of all formal architectural decisions (ADR-001 to ADR-008+) |
| [`FRONTEND.md`](file:///D:/freelance/vazo-website/docs/FRONTEND.md) | Storefront UX, layout, and mega-menu architecture | When implementing storefront features | Header, announcement bar, Perakende & Toptan mega menus, editorial layout |
| [`ADMIN.md`](file:///D:/freelance/vazo-website/docs/ADMIN.md) | Admin panel architecture and module contracts | When touching `/admin` code | Full admin scope, CRUD contracts, functional-or-disabled rule, CMS management |
| [`ECOMMERCE.md`](file:///D:/freelance/vazo-website/docs/ECOMMERCE.md) | Domain models, retail and wholesale catalog rules | When modeling entities or checkout | Products, variants, wholesale pricing tiers, MOQ, trade applications, orders |
| [`DESIGN_SYSTEM.md`](file:///D:/freelance/vazo-website/docs/DESIGN_SYSTEM.md) | Design token structure and visual rules | When styling any component | Semantic tokens, color palettes, typography, spacing, radius, responsive design |
| [`SECURITY.md`](file:///D:/freelance/vazo-website/docs/SECURITY.md) | Security baseline, secret policies, XSS, auth | When handling data, env vars, or admin auth | Secret management, `VITE_*` boundaries, input sanitization, admin protection |
| [`DELIVERY.md`](file:///D:/freelance/vazo-website/docs/DELIVERY.md) | Quality assurance gates and verification commands | Before committing or completing any prompt | Linting, type checking, line checks, repo safety checks, Vitest, CI pipeline |
| [`ONBOARDING.md`](file:///D:/freelance/vazo-website/docs/ONBOARDING.md) | Developer bootstrap and workflow guide | When setting up local environment | Node setup, env configuration, dev server execution, contribution workflow |

## Governance Principles

1. **Architecture Before Implementation**: Never introduce major libraries or backends without an approved ADR.
2. **Hard File Size Limit**: Every source file must remain under 600 lines (target <= 350 lines).
3. **Coexistence of Retail & Wholesale**: Products share a single catalog identity; commercial terms differ by purchasing channel.
4. **Admin Panel Contract**: Every UI control must be either functional or explicitly disabled. No decorative fake actions.
