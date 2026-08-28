# Storefront Commerce & Interaction Contract

This document outlines the state architecture, persistence models, and payment provider integration guidelines for **Search, Wishlist, Cart, and Checkout** in the Vazo E-Commerce platform.

---

## 1. Search Architecture

- **Trigger Points**: Top navigation search icon, CMD+K / Ctrl+K keyboard shortcut, mobile navigation drawer search button.
- **Debounce & Performance**: 200ms input debounce calling `productRepository.getProducts({ searchQuery })`.
- **Keyboard Navigation**:
  - `CMD + K` or `/`: Opens search modal and autofocuses input.
  - `ESC`: Dismisses search modal.
  - Quick term click: Instantly populates and runs suggested queries.
- **Empty State**: Renders popular search queries and direct link into `/products`.

---

## 2. Wishlist Architecture & Persistence

- **Storage Key**: `vazo_wishlist_items` (JSON array of product UUIDs).
- **Reactive Store**: `src/shared/stores/wishlist-store.ts` using listener subscription pattern.
- **Client-Side Staging**: Operates without requiring prior user login, allowing guest browsing and zero friction.
- **Future Supabase Auth Migration Strategy**:
  - When Supabase Auth is enabled, guest wishlist IDs will be merged into the `user_wishlists` table upon login (`ON CONFLICT DO NOTHING`).
  - No secrets or sensitive user data are stored in localStorage.

---

## 3. Cart Architecture & Free Shipping Meter

- **Storage Key**: `vazo_cart_items` (JSON array of cart items with product ID, variant ID, SKU, unit retail price, quantity, and image preview).
- **Reactive Store**: `src/shared/stores/cart-store.ts`.
- **Free Shipping Threshold**: Configured at `₺5.000` (Turkish Lira). Reactively calculates remaining amount and fills progress bar.
- **Drawer vs. Page**:
  - `CartDrawer.tsx`: Instant slide-over upon adding items or clicking header cart icon.
  - `CartPage.tsx`: Full-page checkout preparation at `/cart`.

---

## 4. Checkout & Payment Gateway Strategy (Phase 3 Contract)

- **Architectural Principle**: **Zero Fake Payment Processing & Zero Client Trust**.
- **Payment Provider Selection**: **PayTR** is selected as the primary payment gateway ([ADR-010](ADR.md#adr-010)).
- **Integration Mode**: **PayTR inline iFrame** embedded directly inside the storefront checkout page (`https://shop.monocactus.com/checkout`). The customer does not leave the storefront under normal operation.
- **Installments**: Disabled (`no_installment = 1`). No installment selection UI is exposed.

---

## 5. Target Checkout Journey

```
Cart (/cart)
    │
    ▼ (Click "Siparişi Tamamla")
Customer Authenticated?
    ├── NO  ──► Prompt Google OAuth via Supabase Auth
    │           (Cart preserved in localStorage across redirect)
    │           └── Auto-redirect to /checkout on successful login
    └── YES ──► Proceed to /checkout
                    │
                    ▼
           1. Delivery Address Selection / Entry
                    │
                    ▼
           2. Shipping Zone & Rate Selection
                    │
                    ▼
           3. Legal Policy Acceptance (Mesafeli Satış Sözleşmesi & Ön Bilgilendirme)
                    │
                    ▼
           4. Server-Authoritative Total Calculation (Supabase Edge Function)
                    │
                    ▼
           5. PayTR Inline iFrame Rendered (Token retrieved securely from Edge Function)
                    │
                    ▼
           6. Customer Completes Card Submission Inside PayTR iFrame
                    │
                    ▼
           7. Server-to-Server HMAC Callback Finalizes Order (PostgreSQL 'paid' state)
                    │
                    ▼
           8. Non-Authoritative Client Redirect to /checkout/success
```

### 5.1 Non-Authoritative Redirect URLs
- `merchant_ok_url` and `merchant_fail_url` are client-facing informational endpoints only.
- **Rule**: `merchant_ok_url != payment authority`.
- **Rule**: `merchant_fail_url != payment authority`.
- Only the verified server-to-server webhook callback from PayTR to the Supabase Edge Function marks an order as paid and triggers fulfillment.

