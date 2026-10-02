-- ============================================================================
-- Migration: 20260902010000_recalculate_historical_work_order_balances.sql
-- Purpose  : Sync historical total_paid on all work orders from cash_movements.
--            Since the trigger fn_sync_cash_movement_to_work_order is only
--            incremental (AFTER INSERT/UPDATE/DELETE), any work_order_advance 
--            or manual_income records added *before* the trigger was extended 
--            in migration 20260902000000 would leave total_paid out of sync.
--            This script recalculates total_paid organically from the DB as 
--            the Single Source of Truth.
-- ============================================================================

DO $$
DECLARE
    r RECORD;
    v_total_paid NUMERIC(12,2);
BEGIN
    FOR r IN SELECT id FROM public.work_orders LOOP
        -- Calculate the exact sum of all valid customer payments for this order
        SELECT COALESCE(SUM(net_amount), 0) INTO v_total_paid
          FROM public.cash_movements
         WHERE work_order_id = r.id
           AND type = 'income'
           AND category IN ('work_order_payment', 'manual_income');

        -- Update the order (this will automatically recalculate the generated "balance" column)
        UPDATE public.work_orders
           SET total_paid = v_total_paid
         WHERE id = r.id;
    END LOOP;
END;
$$;
