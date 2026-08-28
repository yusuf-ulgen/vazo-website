-- ==============================================================================
-- Migration: 20260828020000_phase3_commerce_schema.sql
-- Description: Phase 3.2 Order, Payment, Refund, Inventory Reservation, Movement,
--              Status History, Legal Acceptance, Invoice & Email Outbox Schema
-- Author: Yusuf Ulgen / Vazo Platform Engineering
-- Standards: ISO-4217 minor units, KDV-inclusive arithmetic, RLS isolated,
--            Zero provider credential leaks, SECURITY DEFINER functions.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Orders Master Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    channel TEXT NOT NULL CHECK (channel IN ('retail', 'wholesale')),
    status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (
        status IN (
            'pending_payment',
            'payment_failed',
            'paid',
            'processing',
            'shipped',
            'delivered',
            'cancelled',
            'partially_refunded',
            'refunded',
            'payment_review'
        )
    ),
    currency TEXT NOT NULL DEFAULT 'TRY' CHECK (currency IN ('TRY', 'USD', 'EUR', 'GBP')),
    tax_included BOOLEAN NOT NULL DEFAULT true,

    -- Minor Units (Integer Kuruş / Cents)
    subtotal_minor BIGINT NOT NULL CHECK (subtotal_minor >= 0),
    shipping_minor BIGINT NOT NULL DEFAULT 0 CHECK (shipping_minor >= 0),
    discount_minor BIGINT NOT NULL DEFAULT 0 CHECK (discount_minor >= 0),
    tax_included_minor BIGINT DEFAULT 0 CHECK (tax_included_minor >= 0),
    total_minor BIGINT NOT NULL CHECK (total_minor >= 0),

    -- Address Snapshots (Immutable JSONB)
    shipping_address JSONB NOT NULL,
    billing_address JSONB NOT NULL,

    -- Legal & Identity Snapshots
    seller_legal_snapshot JSONB,
    customer_legal_snapshot JSONB,

    -- Fulfillment Details
    shipping_carrier TEXT,
    shipping_tracking_number TEXT,
    shipping_tracking_url TEXT,

    -- Cancellation & Admin Notes
    cancellation_reason TEXT,
    admin_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    paid_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,

    -- Invariant: total = subtotal + shipping - discount
    CONSTRAINT chk_orders_total_integrity CHECK (
        total_minor = (subtotal_minor + shipping_minor - discount_minor)
    )
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- ------------------------------------------------------------------------------
-- 2. Order Items Snapshot Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,

    -- Immutable Item Snapshots
    sku_snapshot TEXT NOT NULL,
    product_name_snapshot TEXT NOT NULL,
    variant_name_snapshot TEXT NOT NULL,
    image_url_snapshot TEXT,

    -- Financials in Minor Units
    unit_price_minor BIGINT NOT NULL CHECK (unit_price_minor >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    line_total_minor BIGINT NOT NULL CHECK (line_total_minor >= 0),
    currency TEXT NOT NULL DEFAULT 'TRY' CHECK (currency IN ('TRY', 'USD', 'EUR', 'GBP')),
    channel TEXT NOT NULL CHECK (channel IN ('retail', 'wholesale')),

    -- Metadata
    metadata_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

    -- Line total integrity: line_total = unit_price * quantity
    CONSTRAINT chk_order_items_line_total CHECK (
        line_total_minor = (unit_price_minor * quantity)
    )
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON public.order_items(variant_id);

-- ------------------------------------------------------------------------------
-- 3. Payments Table (Payment Attempts)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    provider TEXT NOT NULL DEFAULT 'paytr',
    merchant_oid TEXT NOT NULL UNIQUE CHECK (
        length(merchant_oid) <= 64 AND merchant_oid ~ '^[a-zA-Z0-9]+$'
    ),
    status TEXT NOT NULL DEFAULT 'initiated' CHECK (
        status IN (
            'initiated',
            'pending',
            'paid',
            'failed',
            'partially_refunded',
            'refunded',
            'manual_review'
        )
    ),

    expected_amount_minor BIGINT NOT NULL CHECK (expected_amount_minor >= 0),
    provider_total_amount_minor BIGINT CHECK (provider_total_amount_minor >= 0),
    currency TEXT NOT NULL DEFAULT 'TRY' CHECK (currency IN ('TRY', 'USD', 'EUR', 'GBP')),

    test_mode BOOLEAN NOT NULL DEFAULT false,
    failure_code TEXT,
    failure_message_safe TEXT,

    initiated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    expires_at TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_merchant_oid ON public.payments(merchant_oid);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- ------------------------------------------------------------------------------
-- 4. Payment Events Table (Append-Only Callback History)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    merchant_oid TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_fingerprint TEXT NOT NULL UNIQUE,
    safe_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    received_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_payment_events_payment_id ON public.payment_events(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_order_id ON public.payment_events(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_fingerprint ON public.payment_events(event_fingerprint);

-- ------------------------------------------------------------------------------
-- 5. Inventory Reservations Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    status TEXT NOT NULL DEFAULT 'reserved' CHECK (
        status IN ('reserved', 'converted', 'released', 'expired')
    ),
    reserved_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    expires_at TIMESTAMPTZ NOT NULL,
    converted_at TIMESTAMPTZ,
    released_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_inv_res_variant_status ON public.inventory_reservations(variant_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_inv_res_order_id ON public.inventory_reservations(order_id);

-- ------------------------------------------------------------------------------
-- 6. Inventory Movements Ledger
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    quantity_delta INTEGER NOT NULL,
    movement_type TEXT NOT NULL CHECK (
        movement_type IN (
            'sale',
            'refund_restock',
            'order_cancellation_release',
            'manual_adjustment_reference',
            'initial_stock',
            'scrap_loss'
        )
    ),
    safe_reason TEXT NOT NULL,
    actor_type TEXT NOT NULL CHECK (actor_type IN ('system', 'customer', 'admin')),
    actor_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_inv_mov_variant_id ON public.inventory_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_inv_mov_order_id ON public.inventory_movements(order_id);
CREATE INDEX IF NOT EXISTS idx_inv_mov_created_at ON public.inventory_movements(created_at DESC);

-- ------------------------------------------------------------------------------
-- 7. Order Status History (Append-Only Audit)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    actor_type TEXT NOT NULL CHECK (actor_type IN ('system', 'customer', 'admin')),
    actor_id UUID,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_order_hist_order_id ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_hist_created_at ON public.order_status_history(created_at DESC);

-- ------------------------------------------------------------------------------
-- 8. Order Legal Acceptances (Immutable Signatures)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_legal_acceptances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    document_key TEXT NOT NULL CHECK (
        document_key IN (
            'distance_sales_agreement',
            'preliminary_information_form',
            'terms_of_service',
            'privacy_policy'
        )
    ),
    document_version TEXT NOT NULL,
    content_snapshot JSONB NOT NULL,
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_legal_acc_order_id ON public.order_legal_acceptances(order_id);

-- ------------------------------------------------------------------------------
-- 9. Refunds Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
    request_id TEXT NOT NULL UNIQUE,
    reference_no TEXT NOT NULL UNIQUE CHECK (
        length(reference_no) <= 64 AND reference_no ~ '^[a-zA-Z0-9]+$'
    ),
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    currency TEXT NOT NULL DEFAULT 'TRY' CHECK (currency IN ('TRY', 'USD', 'EUR', 'GBP')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'succeeded', 'failed', 'cancelled')
    ),
    requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    safe_reason TEXT,
    provider_error_code TEXT,
    provider_error_message TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON public.refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON public.refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_reference_no ON public.refunds(reference_no);

-- ------------------------------------------------------------------------------
-- 10. Order Invoices Scaffolding Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'not_requested' CHECK (
        status IN ('not_requested', 'pending', 'issued', 'failed', 'cancelled')
    ),
    provider TEXT,
    invoice_number TEXT,
    issued_at TIMESTAMPTZ,
    error_message_safe TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_order_invoices_order_id ON public.order_invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_order_invoices_status ON public.order_invoices(status);

-- ------------------------------------------------------------------------------
-- 11. Transactional Email Outbox Queue Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactional_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    recipient_email TEXT NOT NULL,
    template_key TEXT NOT NULL,
    payload_safe JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'processing', 'sent', 'failed')
    ),
    attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    available_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    sent_at TIMESTAMPTZ,
    last_error_safe TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_trans_emails_status_available ON public.transactional_emails(status, available_at);
CREATE INDEX IF NOT EXISTS idx_trans_emails_order_id ON public.transactional_emails(order_id);

-- ------------------------------------------------------------------------------
-- 12. Helper Database Functions (SECURITY DEFINER, Fixed search_path)
-- ------------------------------------------------------------------------------

-- 12.1 Format-compliant collision-resistant Order Number Generator
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_date TEXT;
    v_suffix TEXT;
    v_order_number TEXT;
    v_exists BOOLEAN;
    v_attempts INTEGER := 0;
BEGIN
    v_date := to_char(timezone('utc', now()), 'YYYYMMDD');
    LOOP
        v_attempts := v_attempts + 1;
        IF v_attempts > 20 THEN
            RAISE EXCEPTION 'Order number generation exceeded maximum collision retries';
        END IF;

        -- Generate 5-character alphanumeric random string
        v_suffix := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 5));
        v_order_number := 'VZ-' || v_date || '-' || v_suffix;

        SELECT EXISTS (
            SELECT 1 FROM public.orders WHERE order_number = v_order_number
        ) INTO v_exists;

        IF NOT v_exists THEN
            RETURN v_order_number;
        END IF;
    END LOOP;
END;
$$;

-- 12.2 Available Stock Calculator (Physical Stock minus Unexpired Active Reservations)
CREATE OR REPLACE FUNCTION public.get_variant_available_stock(p_variant_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_physical_stock INTEGER;
    v_reserved_stock INTEGER;
BEGIN
    SELECT stock_quantity INTO v_physical_stock
    FROM public.product_variants
    WHERE id = p_variant_id;

    IF v_physical_stock IS NULL THEN
        RETURN 0;
    END IF;

    SELECT COALESCE(SUM(quantity), 0) INTO v_reserved_stock
    FROM public.inventory_reservations
    WHERE variant_id = p_variant_id
      AND status = 'reserved'
      AND expires_at > timezone('utc', now());

    RETURN GREATEST(0, v_physical_stock - v_reserved_stock);
END;
$$;

-- 12.3 Expired Reservation Cleanup Trigger / Routine
CREATE OR REPLACE FUNCTION public.cleanup_expired_inventory_reservations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE public.inventory_reservations
    SET status = 'expired'
    WHERE status = 'reserved'
      AND expires_at <= timezone('utc', now());

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RETURN v_updated_count;
END;
$$;

-- 12.4 Order Updated_At Timestamp Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at_commerce()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at_commerce();

DROP TRIGGER IF EXISTS trg_payments_updated_at ON public.payments;
CREATE TRIGGER trg_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at_commerce();

DROP TRIGGER IF EXISTS trg_refunds_updated_at ON public.refunds;
CREATE TRIGGER trg_refunds_updated_at
BEFORE UPDATE ON public.refunds
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at_commerce();

DROP TRIGGER IF EXISTS trg_order_invoices_updated_at ON public.order_invoices;
CREATE TRIGGER trg_order_invoices_updated_at
BEFORE UPDATE ON public.order_invoices
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at_commerce();

DROP TRIGGER IF EXISTS trg_transactional_emails_updated_at ON public.transactional_emails;
CREATE TRIGGER trg_transactional_emails_updated_at
BEFORE UPDATE ON public.transactional_emails
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at_commerce();

-- ------------------------------------------------------------------------------
-- 13. Enable Row Level Security (RLS) on All Tables
-- ------------------------------------------------------------------------------
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_legal_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactional_emails ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 14. RLS Policies Definition
-- ------------------------------------------------------------------------------

-- 14.1 Orders Policies
-- Customers can SELECT only their own orders
CREATE POLICY "Customers can view their own orders"
ON public.orders FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

-- Admins have full access
CREATE POLICY "Admins have full access to orders"
ON public.orders FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 14.2 Order Items Policies
-- Customers can SELECT items from their own orders
CREATE POLICY "Customers can view their own order items"
ON public.order_items FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = order_items.order_id
          AND orders.customer_id = auth.uid()
    )
);

CREATE POLICY "Admins have full access to order items"
ON public.order_items FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 14.3 Payments Policies
-- Customers can view safe payment records for their own orders
CREATE POLICY "Customers can view payments for their own orders"
ON public.payments FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = payments.order_id
          AND orders.customer_id = auth.uid()
    )
);

CREATE POLICY "Admins have full access to payments"
ON public.payments FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 14.4 Payment Events Policies (Append-only by backend, Admin view only)
CREATE POLICY "Admins can view payment events"
ON public.payment_events FOR SELECT
TO authenticated
USING (public.is_admin());

-- 14.5 Inventory Reservations Policies
CREATE POLICY "Admins can view inventory reservations"
ON public.inventory_reservations FOR SELECT
TO authenticated
USING (public.is_admin());

-- 14.6 Inventory Movements Policies
CREATE POLICY "Admins can view inventory movements"
ON public.inventory_movements FOR SELECT
TO authenticated
USING (public.is_admin());

-- 14.7 Order Status History Policies
CREATE POLICY "Customers can view status history for their own orders"
ON public.order_status_history FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = order_status_history.order_id
          AND orders.customer_id = auth.uid()
    )
);

CREATE POLICY "Admins can view order status history"
ON public.order_status_history FOR SELECT
TO authenticated
USING (public.is_admin());

-- 14.8 Order Legal Acceptances Policies
CREATE POLICY "Customers can view legal acceptances for their own orders"
ON public.order_legal_acceptances FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = order_legal_acceptances.order_id
          AND orders.customer_id = auth.uid()
    )
);

CREATE POLICY "Admins can view order legal acceptances"
ON public.order_legal_acceptances FOR SELECT
TO authenticated
USING (public.is_admin());

-- 14.9 Refunds Policies
CREATE POLICY "Customers can view refunds for their own orders"
ON public.refunds FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = refunds.order_id
          AND orders.customer_id = auth.uid()
    )
);

CREATE POLICY "Admins have full access to refunds"
ON public.refunds FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 14.10 Order Invoices Policies
CREATE POLICY "Customers can view invoices for their own orders"
ON public.order_invoices FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = order_invoices.order_id
          AND orders.customer_id = auth.uid()
    )
);

CREATE POLICY "Admins have full access to order invoices"
ON public.order_invoices FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 14.11 Transactional Emails Policies
CREATE POLICY "Admins can view transactional emails"
ON public.transactional_emails FOR SELECT
TO authenticated
USING (public.is_admin());

COMMIT;
