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

## 4. Checkout & Payment Gateway Strategy

- **Architectural Principle**: **Zero Fake Payment Processing**.
- **Pending Gateway Integration**:
  - Production checkout requires a verified Turkish or international payment aggregator (e.g. **Iyzico API 3D Secure**, **PayTR iFrame**, or **Stripe Checkout**).
  - The UI explicitly informs the user that checkout infrastructure is pending live merchant credentials.
  - Under no circumstance are credit card numbers collected or stored on client-side state.
