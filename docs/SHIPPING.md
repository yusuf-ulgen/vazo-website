# Global Shipping Architecture, Zone Configuration & Admin Logistics

This document defines the data models, zone-based rate engine, country activation rules, and checkout validation for **Shipping & Logistics** in the Vazo E-Commerce Platform.

---

## 1. Global-Ready Shipping Principles

1. **Admin-Managed Configuration**: Shipping rates, destinations, and rules are **not hardcoded**. The store administrator manages all zones, countries, rates, and free-shipping thresholds via `/admin/shipping`.
2. **Global Architecture, Local Control**: The database schema supports worldwide shipping, but only countries explicitly enabled and assigned active rates by the merchant can be selected at checkout.
3. **No False Global Availability Claims**: The storefront UI avoids claiming universal international shipping until active international rates are configured.
4. **Unsupported Country UX**: If a customer inputs a destination country without active shipping coverage, the checkout interface renders a clear, graceful notice: *"Bu teslimat ülkesi henüz aktif değil."*
5. **Minor Units Financial Standard**: All flat shipping fees and free shipping thresholds are stored in integer minor units (e.g. 15000 = 150.00 TRY) conforming to ISO-4217 minor currency rules.

---

## 2. Implemented Database Schema (Phase 3.3)

```sql
-- 1. Shipping Zones Master Table
CREATE TABLE public.shipping_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 0,
    retail_enabled BOOLEAN NOT NULL DEFAULT true,
    wholesale_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2. Shipping Zone Countries
CREATE TABLE public.shipping_zone_countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID NOT NULL REFERENCES public.shipping_zones(id) ON DELETE CASCADE,
    country_code TEXT NOT NULL UNIQUE CHECK (
        length(country_code) = 2 AND country_code = upper(country_code)
    ),
    country_name TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3. Shipping Rates per Zone (Minor Units)
CREATE TABLE public.shipping_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID NOT NULL REFERENCES public.shipping_zones(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'TRY' CHECK (currency IN ('TRY', 'USD', 'EUR', 'GBP')),
    flat_amount_minor BIGINT NOT NULL CHECK (flat_amount_minor >= 0),
    free_shipping_threshold_minor BIGINT CHECK (free_shipping_threshold_minor >= 0),
    minimum_order_minor BIGINT CHECK (minimum_order_minor >= 0),
    maximum_order_minor BIGINT CHECK (maximum_order_minor >= 0),
    estimated_delivery_text TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

    CONSTRAINT chk_shipping_rates_order_bounds CHECK (
        maximum_order_minor IS NULL OR minimum_order_minor IS NULL OR maximum_order_minor >= minimum_order_minor
    )
);
```

---

## 3. Shipping Fee Calculation Engine

When calculating shipping charges during cart review or token generation:

1. **Country Match**: Resolves the destination country code (e.g. `TR`) to an active `shipping_zone_countries` record where the parent `shipping_zones.active = true`.
2. **Channel & Currency Filter**: Matches rates where `active = true`, currency matches cart currency, and channel (`retail_enabled` vs `wholesale_enabled`) is respected.
3. **Threshold & Bounds Check**:
   $$\text{Shipping Fee} = \begin{cases} 
   0 & \text{if } \text{subtotal\_minor} \ge \text{free\_shipping\_threshold\_minor} \\
   \text{flat\_amount\_minor} & \text{otherwise}
   \end{cases}$$
4. **Server-Authoritative Resolution**: Both client TypeScript resolver (`resolveShippingLocally`) and PostgreSQL RPC (`public.resolve_shipping_rate`) execute identical deterministic logic.

---

## 4. Default Seed & Baseline Rates (Turkey)

| Zone Name | Assigned Countries | Rate Name | Flat Fee (TRY) | Free Shipping Above (TRY) | Estimated Delivery |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Türkiye İçi** | `TR` (Türkiye) | Standart Yurtiçi Teslimat | `150,00 ₺` (`15000`) | `5.000,00 ₺` (`500000`) | 2–4 İş Günü |

> [!NOTE]
> No fabricated international rates are seeded. The merchant activates international shipping zones and rates through `/admin/shipping` as logistics contracts are established.
