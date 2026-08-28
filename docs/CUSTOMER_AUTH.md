# Customer Authentication, Google OAuth & Account Isolation

This document outlines the architecture, UX flows, role isolation, and security contracts for **Customer Authentication** in the Vazo E-Commerce Platform.

---

## 1. Core Authentication Principles

1. **Mandatory Authenticated Checkout**: Guest checkout is disabled. All customers must authenticate before placing an order.
2. **Google OAuth via Supabase Auth**: The primary sign-in flow is Google OAuth handled securely through Supabase Auth PKCE flow.
3. **Strict Separation of Customer & Admin Authority**:
   - Customer accounts have zero access to the `/admin/*` namespace or administrative tables.
   - Admin access is governed solely by `public.admin_users` and `public.is_admin()`.
   - Logging in as a customer never escalates permissions to admin status.
4. **Seamless Checkout Transition**: Unauthenticated users who initiate checkout are prompted to sign in with Google, and upon successful authentication, are returned immediately to `/checkout` with their cart contents completely intact.

---

## 2. Customer Sign-In & Checkout UX Journey

```
Customer browses Storefront & adds items to Cart
                    │
                    ▼
          Clicks "Siparişi Tamamla" (/cart)
                    │
                    ▼
     Is customer authenticated with Supabase?
          ├── YES ──► Proceed directly to /checkout
          │
          └── NO  ──► Render Google Sign-in Modal / Prompt
                         │
                         ├─ Stores return URL (/checkout) in session/local storage
                         ├─ Preserves Cart items in localStorage (vazo_cart_items)
                         │
                         ▼
             Trigger `supabase.auth.signInWithOAuth({ provider: 'google' })`
                         │
                         ▼
             Google Authorization Screen (User confirms account)
                         │
                         ▼
             Redirect to Supabase Auth Callback (`/auth/callback`)
                         │
                         ▼
             Session Established & Token Refreshed
                         │
                         ▼
             Auto-Redirect to `/checkout`
             (Cart remains intact, user identity is verified)
```

---

## 3. Customer Profile & Address Schema (Phase 3 Target)

```sql
-- Customer Profiles
CREATE TABLE public.customer_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    customer_type TEXT NOT NULL DEFAULT 'retail' CHECK (customer_type IN ('retail', 'wholesale')),
    is_trade_approved BOOLEAN NOT NULL DEFAULT false,
    default_shipping_address_id UUID,
    default_billing_address_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Customer Saved Addresses
CREATE TABLE public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Ev',
    full_name TEXT NOT NULL,
    company_name TEXT,
    tax_number TEXT,
    tax_office TEXT,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state_province TEXT,
    postal_code TEXT NOT NULL,
    country_code TEXT NOT NULL DEFAULT 'TR',
    phone TEXT NOT NULL,
    is_default_shipping BOOLEAN NOT NULL DEFAULT false,
    is_default_billing BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Enable RLS
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- Customers can only read and update their own profile and addresses
CREATE POLICY "Customers can manage own profile"
    ON public.customer_profiles
    FOR ALL
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "Customers can manage own addresses"
    ON public.customer_addresses
    FOR ALL
    TO authenticated
    USING (customer_id = auth.uid())
    WITH CHECK (customer_id = auth.uid());
```

---

## 4. Role Isolation: Customer vs. Admin RBAC

```
                 ┌────────────────────────────────────────┐
                 │          Supabase `auth.users`         │
                 └───────────────────┬────────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 │                                       │
     (Customer Registration)                 (Admin Provisioning)
                 │                                       │
                 ▼                                       ▼
    `public.customer_profiles`                 `public.admin_users`
    ├── role: 'customer' (implicit)            ├── role: 'admin' | 'super_admin'
    ├── Zero Admin Permissions                 ├── Checked via `is_admin()`
    └── RLS: Can only view own orders          └── RLS: Full admin CRUD authority
```

### Key Security Invariants
- **No Client Elevation**: Setting a local state `isAdmin: true` or manipulating browser tokens has zero effect on PostgreSQL queries. RLS strictly checks `public.is_admin()`.
- **Separate Tables**: Customer records never enter `admin_users`.
- **Zero Hardcoded Accounts**: All customer logins derive from cryptographically verified Supabase OAuth JWTs.

---

## 5. Google OAuth Setup & Configuration Checklist

To configure Google OAuth in production and staging:

1. **Google Cloud Console**:
   - Create a project: `Vazo Studio E-Commerce`.
   - Configure **OAuth Consent Screen** (User Type: External).
   - Set authorized domains: `monocactus.com`, `supabase.co`.
   - Create **OAuth 2.0 Client ID** (Web application).
   - Authorized JavaScript origins: `https://shop.monocactus.com`, `http://localhost:5173`.
   - Authorized redirect URIs: `https://<supabase-project-id>.supabase.co/auth/v1/callback`.
2. **Supabase Dashboard**:
   - Navigate to: **Authentication** -> **Providers** -> **Google**.
   - Enable Google provider.
   - Enter `Client ID` and `Client Secret` (Never commit these values to Git).
   - Save configuration.
