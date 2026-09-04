-- Migration: 20260831000000_strip_auto_cash_movement.sql
-- Purpose: Remove the automatic cash_movement INSERT from fn_sync_received_purchase_to_stock.
--          The trigger continues to update inventory stock on purchase receipt,
--          but expense creation is now fully handled by the frontend service layer
--          so that the user can select the payment method manually.

CREATE OR REPLACE FUNCTION public.fn_sync_received_purchase_to_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'received' THEN
        -- 1. Increment stock if the purchase is linked to an inventory item
        IF NEW.inventory_item_id IS NOT NULL THEN
            UPDATE public.inventory_items
            SET
                quantity = quantity + COALESCE(NEW.quantity, 0),
                cost_price = CASE WHEN NEW.actual_cost > 0 AND NEW.quantity > 0
                                  THEN (NEW.actual_cost / NEW.quantity)
                                  ELSE cost_price
                             END,
                updated_at = NOW()
            WHERE id = NEW.inventory_item_id;
        END IF;
        -- cash_movement creation is now handled by the frontend service (purchases.ts)
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
