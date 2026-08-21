# Admin Panel Specifications & Module Contracts

This document governs the back-office management panel (`src/admin/`), routed strictly under `/admin/*`.

---

## 1. Core Admin Functionality Rule

> [!IMPORTANT]
> **Strict Action Contract**: Every button, switch, link, or form control rendered in the Admin Panel must strictly fall into one of two states:
> 1. **FUNCTIONAL**: Dispatches real mutations, updates state, triggers validation, provides feedback, and handles loading/error states.
> 2. **EXPLICITLY DISABLED**: Visually styled as disabled with a clear tooltip or badge indicating: `"Bu özellik henüz backend entegrasyonu aşamasındadır"` (Feature pending backend integration).
>
> **Never render decorative "fake" buttons that appear interactive but silently do nothing.**

When backend integration is completed, **CRUD** requires:
- **Create**: Validated form modal/page, submission loading spinner, error handling, cache invalidation, success toast.
- **Read**: Filterable, sortable, paginated data grid with empty states and loading skeletons.
- **Update**: Pre-filled form, dirty field tracking, optimistic or verified update, conflict resolution.
- **Delete**: Explicit confirmation dialog for destructive actions, immediate UI reconciliation.

---

## 2. Module Blueprint & Scope

```
/admin
├── /admin/dashboard         # Executive summary, sales & order KPIs, trade application alerts
├── /admin/products          # Product catalog CRUD, variant matrices, dimensions, media
├── /admin/categories        # Category hierarchy management
├── /admin/collections       # Editorial collection curation
├── /admin/inventory         # Stock tracking, low-stock threshold alerts, warehouse channels
├── /admin/pricing           # Retail pricing rules, bulk updates
├── /admin/wholesale         # Wholesale tiers, MOQ management, trade application review
├── /admin/orders            # Unified order grid (Retail vs Wholesale tabs, fulfillment, tracking)
├── /admin/content           # CMS Editor (Announcement bar, Hero banners, Mega-menu promos)
├── /admin/media             # Media asset library and image optimization manager
├── /admin/promotions        # Discount codes, tier discounts, commercial campaigns
├── /admin/forms             # Contact inquiries, custom ceramic requests, sample orders
├── /admin/seo               # Meta titles, descriptions, OpenGraph tags, sitemap controls
├── /admin/settings          # Public studio info, business hours, tax rates, shipping rules
└── /admin/audit             # Immutable audit log of administrative mutations
```

---

## 3. Detailed Module Contracts

### 3.1 Product Management (`/admin/products`)
- **General Info**: Title, SKU, slug, short summary, rich-text description, status (Draft, Published, Archived).
- **Physical Specifications**: Material (e.g., Terracotta, Stoneware, Porcelain), Finish (Matte, Glossy), Dimensions (Height, Diameter, Weight), Color palette.
- **Variants Matrix**: Size/color variants, individual variant SKUs, variant-specific stock.
- **Media Gallery**: Primary hero image, gallery thumbnails, drag-and-drop order, alt text.
- **Channel Availability**: Toggle for Retail availability and Wholesale catalog eligibility.

### 3.2 Wholesale & Trade Management (`/admin/wholesale`)
- **Trade Account Applications**: Review queue for architects, interior designers, and retail stockists. Actions: Approve (grants trade tier), Reject (with message), Request More Info.
- **Volume Pricing Tiers**: Configure dynamic quantity brackets (e.g., 10–49 units: 25% off; 50+ units: 40% off).
- **MOQ Rules**: Set minimum order units per product or category.
- **Custom Quote Requests**: Workflow for custom glazing or large-scale architectural projects.

### 3.3 Homepage & Navigation CMS (`/admin/content`)
- **Announcement Bar**: Enable/disable toggle, text editor, link target, background accent.
- **Hero Carousel / Split Hero**: Title, subtitle, background image, primary and secondary CTA buttons.
- **Mega Menu Cards**: Configurable featured promo cards rendered inside `Perakende` and `Toptan` dropdowns.
- **Editorial Blocks**: Ordering and content editing for homepage story sections.

### 3.4 Security & Secrets Isolation
- **No Secrets in Admin State**: Sensitive server credentials (API keys, SMTP passwords, database connection strings) must **never** be rendered in frontend inputs or stored in browser state.
- **Role-Based Access Control (RBAC)**: Future backend integration will enforce server-side token validation; client-side route guards serve purely for UX navigation.
