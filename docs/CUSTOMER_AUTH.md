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

## 3. Implemented Customer Profile & Address Schema

Migration file: [`supabase/migrations/20260828010000_phase3_customer_auth.sql`](../supabase/migrations/20260828010000_phase3_customer_auth.sql)

```sql
-- Customer Profiles
CREATE TABLE public.customer_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    customer_type TEXT NOT NULL DEFAULT 'retail' CHECK (customer_type IN ('retail', 'wholesale')),
    wholesale_approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Customer Saved Addresses
CREATE TABLE public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label TEXT NOT NULL DEFAULT 'Ev',
    recipient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    district TEXT,
    city TEXT NOT NULL,
    state_province TEXT,
    postal_code TEXT NOT NULL,
    country_code TEXT NOT NULL CHECK (length(country_code) = 2 AND country_code = upper(country_code)),
    country_name TEXT NOT NULL,
    is_default_shipping BOOLEAN NOT NULL DEFAULT false,
    is_default_billing BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Enable RLS
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- Customers can only read and update their own profile and addresses
CREATE POLICY "Customers can select own profile"
    ON public.customer_profiles FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Customers can update own profile"
    ON public.customer_profiles FOR UPDATE TO authenticated
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Customers can select own addresses"
    ON public.customer_addresses FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Customers can insert own addresses"
    ON public.customer_addresses FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Customers can update own addresses"
    ON public.customer_addresses FOR UPDATE TO authenticated
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Customers can delete own addresses"
    ON public.customer_addresses FOR DELETE TO authenticated
    USING (user_id = auth.uid());
```

---

## 4. Automatic Profile Creation & Privileged Column Protection

1. **`handle_new_customer_user()` Trigger**:
   - Executes `AFTER INSERT ON auth.users` with `SECURITY DEFINER`.
   - Safely parses Google metadata (`given_name`, `family_name`, `full_name`, `name`, `phone`).
   - Inserts a new row in `public.customer_profiles` with `customer_type = 'retail'`.

2. **`protect_customer_profile_privileged_fields()` Trigger**:
   - Executes `BEFORE UPDATE ON public.customer_profiles` with `SECURITY DEFINER`.
   - Checks if `customer_type`, `wholesale_approved_at`, `user_id`, or `created_at` are being changed.
   - If not executed by an authorized administrator (`public.is_admin()`), raises SQL exception `42501`.

3. **`handle_default_customer_address()` Trigger**:
   - Ensures that when a customer designates an address as default shipping or billing, any existing default address for the same user is automatically unset.

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
