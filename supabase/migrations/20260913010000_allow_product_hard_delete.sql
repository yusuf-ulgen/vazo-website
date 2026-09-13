-- ==============================================================================
-- VAZO E-COMMERCE PLATFORM - ALLOW PRODUCT DELETION WITH ORDER HISTORY
-- Migration: 20260913010000_allow_product_hard_delete.sql
-- ==============================================================================
-- inventory_reservations.variant_id ve inventory_movements.variant_id
-- FK kısıtlamaları RESTRICT → CASCADE olarak değiştiriliyor.
-- Böylece bir ürün/varyant silindiğinde rezervasyon ve stok hareketleri de
-- otomatik olarak temizlenir.
-- order_items.variant_id zaten SET NULL (sipariş geçmişi korunur).
-- ==============================================================================

-- 1. inventory_reservations: RESTRICT → CASCADE
ALTER TABLE public.inventory_reservations
    DROP CONSTRAINT IF EXISTS inventory_reservations_variant_id_fkey;

ALTER TABLE public.inventory_reservations
    ADD CONSTRAINT inventory_reservations_variant_id_fkey
    FOREIGN KEY (variant_id)
    REFERENCES public.product_variants(id)
    ON DELETE CASCADE;

-- 2. inventory_movements: RESTRICT → CASCADE
ALTER TABLE public.inventory_movements
    DROP CONSTRAINT IF EXISTS inventory_movements_variant_id_fkey;

ALTER TABLE public.inventory_movements
    ADD CONSTRAINT inventory_movements_variant_id_fkey
    FOREIGN KEY (variant_id)
    REFERENCES public.product_variants(id)
    ON DELETE CASCADE;

DO $$
BEGIN
    RAISE NOTICE 'inventory_reservations ve inventory_movements FK kısıtlamaları CASCADE olarak güncellendi.';
END $$;
