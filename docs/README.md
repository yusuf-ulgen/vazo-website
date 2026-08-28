# Vazo E-Commerce Platform — Documentation Index

This directory contains the canonical architectural, operational, design, and governance documentation for the **Vazo E-Commerce Platform** (`yusuf-ulgen/vazo-website`).

## Canonical Document Map

| Document | Purpose | When to Read | What It Governs |
| :--- | :--- | :--- | :--- |
| [`INSTRUCTIONS.md`](INSTRUCTIONS.md) | AI agent and developer operational contract | Before starting any code task | Engineering standards, 600-line limit, secret policy, modification rules |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | System topology and dependency boundaries | When designing features or modules | Single-repo rule, folder boundaries, routing, import directions, state separation |
| [`ADR.md`](ADR.md) | Architecture Decision Records | When proposing or reviewing structural choices | History of all formal architectural decisions (ADR-001 to ADR-013) |
| [`FRONTEND.md`](FRONTEND.md) | Storefront UX, layout, and mega-menu architecture | When implementing storefront features | Header, announcement bar, Perakende & Toptan mega menus, editorial layout |
| [`ADMIN.md`](ADMIN.md) | Admin panel architecture and module contracts | When touching `/admin` code | Full admin scope, CRUD contracts, functional-or-disabled rule, CMS management |
| [`ECOMMERCE.md`](ECOMMERCE.md) | Domain models, pricing semantics, and order entities | When modeling entities or checkout | Products, variants, wholesale pricing tiers, MOQ, KDV semantics, order snapshots |
| [`PAYMENTS.md`](PAYMENTS.md) | PayTR payment integration & security boundary | When implementing checkout or refunds | Inline iFrame, token generation, HMAC webhook verification, idempotency, refund API |
| [`ORDERS.md`](ORDERS.md) | Order lifecycle, snapshot architecture & fulfillment | When handling checkout or fulfillment | Order state machine, immutable purchase snapshots, address storage, fulfillment |
| [`CUSTOMER_AUTH.md`](CUSTOMER_AUTH.md) | Customer authentication & Google OAuth | When touching auth or customer accounts | Supabase Auth, Google OAuth, customer/admin separation, guest-blocking checkout |
| [`SHIPPING.md`](SHIPPING.md) | Global-ready shipping architecture & admin logistics | When modeling or managing shipping | Shipping zones, country rates, free shipping thresholds, address validation |
| [`INTEGRATIONS.md`](INTEGRATIONS.md) | Operational setup checklists for external services | When configuring third-party providers | PayTR, Google OAuth, Gmail API, and future e-Invoice integration checklists |
| [`PHASE_3_PLAN.md`](PHASE_3_PLAN.md) | Phase 3 implementation master plan (3.0 – 3.11) | When planning or executing Phase 3 tasks | Sub-phase scopes, dependencies, manual checkpoints, and green-gate criteria |
| [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) | Design token structure and visual rules | When styling any component | Semantic tokens, color palettes, typography, spacing, radius, responsive design |
| [`SECURITY.md`](SECURITY.md) | Security baseline, secret policies, XSS, auth | When handling data, env vars, or admin auth | Secret management, `VITE_*` boundaries, payment security, RLS policies |
| [`DELIVERY.md`](DELIVERY.md) | Quality assurance gates and verification commands | Before committing or completing any prompt | Linting, type checking, line checks, repo safety checks, Vitest, CI pipeline |
| [`ONBOARDING.md`](ONBOARDING.md) | Developer bootstrap and workflow guide | When setting up local environment | Node setup, env configuration, dev server execution, contribution workflow |
| [`PHASE_2_REPORT.md`](PHASE_2_REPORT.md) | Phase 2 complete master implementation report | Reference for Phase 2 baseline | Complete sub-phase log, database schema, verification results, green gate closure |
| [`PHASE_2_REPAIR_REPORT.md`](PHASE_2_REPAIR_REPORT.md) | Phase 2 repair & corrective hardening report | Reference for Phase 2 audit repairs | Audit findings, focus traps, mock segregation, UUID repairs, and green gate closure |

## Governance Principles

1. **Architecture Before Implementation**: Never introduce major libraries or backends without an approved ADR.
2. **Hard File Size Limit**: Every source file must remain under 600 lines (target <= 350 lines).
3. **Coexistence of Retail & Wholesale**: Products share a single catalog identity; commercial terms differ by purchasing channel.
4. **Admin Panel Contract**: Every UI control must be either functional or explicitly disabled. No decorative fake actions.
5. **Zero Client Trust in Commerce**: All prices, totals, shipping fees, wholesale tiers, and payment settlements are computed server-side.
