-- ============================================================================
-- Migration: 20260902000000_extend_cash_movement_trigger.sql
-- Purpose  : Extend fn_sync_cash_movement_to_work_order to handle all income
--            categories that represent customer payments, not just 'work_order_payment'.
--
-- Categories that count toward total_paid (customer collections):
--   - work_order_payment  : final or partial payment at pickup
--   - work_order_advance  : advance/deposit (seña) before repair
--   - manual_income       : ad-hoc income registered from the FinancesTab
--
-- Categories that do NOT count toward total_paid:
--   - purchase_payment    : expense paid by the workshop (repuesto)
--   - general_expense     : generic workshop expense
--   - manual_expense      : ad-hoc expense from FinancesTab
--   - sale                : POS sale (linked to sales table, not work_orders)
--
-- This replaces the client-side recalculateOrderFinancials() call which was
-- used as a workaround. With this trigger, total_paid is always consistent.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_sync_cash_movement_to_work_order()
RETURNS TRIGGER AS $$
DECLARE
    v_is_closed BOOLEAN;

BEGIN
    -- Validate: reject movements on a closed cash register
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        IF NEW.cash_register_id IS NOT NULL THEN
            SELECT is_closed INTO v_is_closed
              FROM public.cash_registers
             WHERE id = NEW.cash_register_id;
            IF COALESCE(v_is_closed, FALSE) THEN
                RAISE EXCEPTION 'No se pueden ingresar o modificar movimientos en una caja cerrada.';
            END IF;
        END IF;
    END IF;

    -- ── INSERT ───────────────────────────────────────────────────────────────
    IF TG_OP = 'INSERT' THEN
        IF NEW.type = 'income'
           AND NEW.category IN ('work_order_payment', 'manual_income')
           AND NEW.work_order_id IS NOT NULL
        THEN
            UPDATE public.work_orders
               SET total_paid  = total_paid + NEW.net_amount,
                   updated_at  = NOW()
             WHERE id = NEW.work_order_id;
        END IF;

    -- ── UPDATE ───────────────────────────────────────────────────────────────
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.work_order_id IS DISTINCT FROM NEW.work_order_id
           OR OLD.net_amount  IS DISTINCT FROM NEW.net_amount
           OR OLD.category    IS DISTINCT FROM NEW.category
           OR OLD.type        IS DISTINCT FROM NEW.type
        THEN
            -- Reverse (subtract) the old amount from the previous order
            IF OLD.type = 'income'
               AND OLD.category IN ('work_order_payment', 'manual_income')
               AND OLD.work_order_id IS NOT NULL
            THEN
                UPDATE public.work_orders
                   SET total_paid  = total_paid - OLD.net_amount,
                       updated_at  = NOW()
                 WHERE id = OLD.work_order_id;
            END IF;

            -- Apply (add) the new amount to the (possibly different) order
            IF NEW.type = 'income'
               AND NEW.category IN ('work_order_payment', 'manual_income')
               AND NEW.work_order_id IS NOT NULL
            THEN
                UPDATE public.work_orders
                   SET total_paid  = total_paid + NEW.net_amount,
                       updated_at  = NOW()
                 WHERE id = NEW.work_order_id;
            END IF;
        END IF;

    -- ── DELETE ───────────────────────────────────────────────────────────────
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.type = 'income'
           AND OLD.category IN ('work_order_payment', 'manual_income')
           AND OLD.work_order_id IS NOT NULL
        THEN
            UPDATE public.work_orders
               SET total_paid  = total_paid - OLD.net_amount,
                   updated_at  = NOW()
             WHERE id = OLD.work_order_id;
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- The trigger binding is unchanged; only the function body is replaced above.
-- Verify it still exists (idempotent):
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
         WHERE tgname = 'trg_sync_cash_movement_to_work_order'
    ) THEN
        CREATE TRIGGER trg_sync_cash_movement_to_work_order
        AFTER INSERT OR UPDATE OR DELETE ON public.cash_movements
        FOR EACH ROW
        EXECUTE FUNCTION public.fn_sync_cash_movement_to_work_order();
    END IF;
END $$;
