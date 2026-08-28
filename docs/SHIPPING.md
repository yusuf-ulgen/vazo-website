# Global Shipping Architecture, Zone Configuration & Admin Logistics

This document defines the data models, zone-based rate engine, country activation rules, and checkout validation for **Shipping & Logistics** in the Vazo E-Commerce Platform.

---

## 1. Global-Ready Shipping Principles

1. **Admin-Managed Configuration**: Shipping rates, destinations, and rules are **not hardcoded**. The store administrator manages all zones, countries, rates, and free-shipping thresholds via `/admin/shipping`.
2. **Global Architecture, Local Control**: The database schema supports worldwide shipping, but only countries explicitly enabled and assigned active rates by the merchant can be selected at checkout.
3. **No False Global Availability Claims**: The storefront UI avoids claiming universal international shipping until active international rates are configured.
4. **Unsupported Country UX**: If a customer inputs a destination country without active shipping coverage, the checkout interface renders a clear, graceful notice: *"Seçilen ülkeye şu anda standart teslimatımız bulunmamaktadır. Özel gönderim talebi için lütfen bizimle iletişime geçin."*

---

## 2. Shipping Data Models (Phase 3 Target)

```sql
-- Shipping Zones (e.g., "Türkiye İçi", "Avrupa Bölgesi", "Kuzey Amerika")
CREATE TABLE public.shipping_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Countries mapped to Zones
CREATE TABLE public.shipping_countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID NOT NULL REFERENCES public.shipping_zones(id) ON DELETE CASCADE,
    country_code TEXT NOT NULL UNIQUE, -- ISO 3166-1 alpha-2, e.g. "TR", "DE", "US"
    country_name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Shipping Rates per Zone
CREATE TABLE public.shipping_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID NOT NULL REFERENCES public.shipping_zones(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                -- e.g. "Standart Kargo", "Express Kurye"
    currency TEXT NOT NULL DEFAULT 'TRY' CHECK (currency IN ('TRY', 'USD', 'EUR', 'GBP')),
    rate_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (rate_amount >= 0),
    free_shipping_threshold NUMERIC(12, 2) CHECK (free_shipping_threshold >= 0),
    estimated_delivery_text TEXT,      -- e.g. "2-4 İş Günü"
    applies_to_retail BOOLEAN NOT NULL DEFAULT true,
    applies_to_wholesale BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
```

---

## 3. Shipping Fee Calculation Engine

When calculating shipping charges during cart review or token generation:

1. **Country Match**: Resolves the destination country code (e.g. `TR`) to an active `shipping_zone`.
2. **Channel Filter**: Selects rates where `is_active = true` and `applies_to_retail = true` (or `applies_to_wholesale = true`).
3. **Threshold Check**:
   $$\text{Shipping Fee} = \begin{cases} 
   0.00 & \text{if } \text{subtotal} \ge \text{free\_shipping\_threshold} \\
   \text{rate\_amount} & \text{otherwise}
   \end{cases}$$
4. **Server Re-Verification**: The shipping fee is always recomputed in the Supabase Edge Function (`create-paytr-token`) before passing amounts to PayTR.

---

## 4. Default Seed & Baseline Rates (Turkey)

| Zone Name | Assigned Countries | Rate Name | Flat Fee (TRY) | Free Shipping Above (TRY) | Estimated Delivery |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Türkiye İçi** | `TR` (Türkiye) | Standart Yurtiçi Kargo | `150,00 ₺` | `5.000,00 ₺` | 2–4 İş Günü |
| **Avrupa Bölgesi** | `DE`, `FR`, `NL`, `GB`, `IT` | Uluslararası Kargo (Pasif) | `1.250,00 ₺` | None | 5–10 İş Günü |

> [!NOTE]
> International shipping is created as inactive by default. The store owner can activate or adjust rates via `/admin/shipping` when international logistics agreements are established.
