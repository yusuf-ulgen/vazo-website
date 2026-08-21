# Design Tokens

This directory is the single visual source of truth for the Vazo E-Commerce platform design system.

## Token Hierarchy

```
primitive.json  (Raw color scales, font families, base spacing, radius values)
      │
      ▼
semantic.json   (Design intent: canvas, surface, text-primary, action-primary, etc.)
      │
      ▼
component.json  (Component-level bindings: navbar, product-card, admin-sidebar)
      │
      ▼
CSS Variables / Tailwind Theme (Consumed by UI components)
```

## Rules for Developers and AI Agents

1. **Never hardcode hex colors or arbitrary visual values in component JSX/TSX.**
   - ❌ `className="bg-[#141311] text-[#FFFFFF] p-[17px]"`
   - ✅ `className="bg-action-primary text-action-primary-text px-6 py-3"` or `className="bg-surface text-primary"`
2. **Primitive tokens** define raw scales and should not be consumed directly by UI components.
3. **Semantic tokens** represent visual meaning (`surface-primary`, `text-secondary`, `border-subtle`) and are mapped into Tailwind utility classes and CSS variables.
4. **Component tokens** define structural parameters for global elements such as headers, mega menus, and admin shells.
5. **Reduced Motion**: All animations and transitions must respect `prefers-reduced-motion: reduce`.
