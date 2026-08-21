# Design System & Token Specifications

This document defines the visual token contracts, typography scales, color palettes, and component styling rules for the **Vazo E-Commerce Platform**.

---

## 1. Design Token Architecture

The design token system is structured in three hierarchical layers:

1. **Primitive Tokens (`design-tokens/tokens/primitive.json`)**: Raw palette definitions, base font families, absolute spacing values.
2. **Semantic Tokens (`design-tokens/tokens/semantic.json`)**: Role-based visual tokens (`surface-primary`, `text-primary`, `action-primary`).
3. **Component Tokens (`design-tokens/tokens/component.json`)**: Structural bindings for composite components (Navbar, AnnouncementBar, Sidebar).

---

## 2. Color System

### 2.1 Surfaces & Canvas
- `canvas-default`: `#FFFFFF` — Primary immaculate white canvas.
- `canvas-subtle`: `#FAF9F6` — Warm off-white background for alternate sections.
- `canvas-warm`: `#F7F5F0` — Warm stone background for editorial storytelling.
- `surface-primary`: `#FFFFFF` — Card and container surfaces.
- `surface-secondary`: `#FAF9F6` — Subtle container fills.
- `surface-muted`: `#F5F3EF` — Muted background for product showcases.
- `surface-inverse`: `#141311` — Deep charcoal for announcement bar and high-contrast badges.

### 2.2 Text Colors
- `text-primary`: `#141311` — High-contrast deep charcoal/black for titles, body, and navigation.
- `text-secondary`: `#635D53` — Refined warm gray for descriptions, subheadings, and specifications.
- `text-muted`: `#B8B0A2` — Light neutral for placeholders and secondary timestamps.
- `text-inverse`: `#FFFFFF` — White text for dark surfaces and primary buttons.

### 2.3 Borders & Accents
- `border-subtle`: `#F5F3EF` — Hairline dividers.
- `border-default`: `#EAE6DF` — Standard container and card borders.
- `border-strong`: `#B8B0A2` — Active inputs and focused outlines.
- `brand-stone`: `#DFD9CB` — Warm stone ceramic tint.
- `brand-sand`: `#E4D9C0` — Natural sand terracotta tint.
- `brand-taupe`: `#CFC9C5` — Earthy taupe glaze tint.

---

## 3. Typography System

| Token | Font Family | Size | Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `hero` | Cormorant Garamond (Serif) | 3.75rem / 4.5rem | 300 / Light | 1.05 | Homepage editorial hero titles |
| `h1` | Cormorant Garamond (Serif) | 2.25rem / 3rem | 400 / Regular | 1.15 | Page titles, collection headings |
| `h2` | Cormorant Garamond (Serif) | 1.875rem | 400 / Regular | 1.20 | Section headers, story titles |
| `h3` | Cormorant Garamond (Serif) | 1.5rem | 500 / Medium | 1.25 | Product card titles, modal headings |
| `editorialSubtitle` | Inter (Sans) | 0.875rem | 600 / SemiBold | 1.50 | Uppercase section overlines (0.15em spacing) |
| `body` | Inter (Sans) | 1rem | 400 / Regular | 1.60 | Primary body copy, descriptions |
| `bodySmall` | Inter (Sans) | 0.875rem | 400 / Regular | 1.50 | Secondary product details, table rows |
| `caption` | Inter (Sans) | 0.75rem | 400 / Regular | 1.40 | Form hints, footer copyright |

---

## 4. Spacing, Radius & Shadows

- **Spacing Scale**: Based on a standard 4px baseline unit (`0.25rem` to `8rem`).
- **Border Radius**: Architectural and sharp (`radius-none: 0px` for luxury editorial feel, `radius-sm: 2px` or `radius-md: 6px` for interface inputs and admin controls).
- **Elevation & Shadows**:
  - `shadow-subtle`: `0 1px 2px 0 rgba(20, 19, 17, 0.04)`
  - `shadow-card`: `0 4px 12px -2px rgba(20, 19, 17, 0.06)`
  - `shadow-dropdown`: `0 16px 40px -8px rgba(20, 19, 17, 0.12)`

---

## 5. Motion & Accessibility

- All CSS transitions use cubic-bezier easing (`cubic-bezier(0.16, 1, 0.3, 1)`).
- **Reduced Motion**: Wrapped with `@media (prefers-reduced-motion: reduce)` to disable non-essential motion for users with vestibular sensitivities.
