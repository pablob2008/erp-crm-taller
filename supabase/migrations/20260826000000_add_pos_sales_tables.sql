-- ============================================================================
-- MIGRATION: Add POS Sales Tables
-- Generated: 2026-08-26
-- Description: Introduces `sales` and `sale_items` tables for the Point of Sale
--              feature, with ARCA fiscal readiness fields, stock deduction trigger,
--              RLS policies, and performance indexes.
-- ============================================================================

-- 1. New ENUM for sale status
CREATE TYPE public.sale_status AS ENUM ('completed', 'voided');

-- 2. Sales table
CREATE TABLE IF NOT EXISTS public.sales (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id           UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    cash_register_id    UUID REFERENCES public.cash_registers(id) ON DELETE SET NULL,
    cash_movement_id    UUID REFERENCES public.cash_movements(id) ON DELETE SET NULL,
    work_order_id       UUID REFERENCES public.work_orders(id) ON DELETE SET NULL,
    payment_method      public.payment_method NOT NULL DEFAULT 'cash',
    subtotal            NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    discount_type       public.discount_type NOT NULL DEFAULT 'none',
    discount_value      NUMERIC(12,2) NOT NULL DEFAULT 0,
    total               NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    status              public.sale_status NOT NULL DEFAULT 'completed',
    customer_id         UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_doc_type   VARCHAR(20) DEFAULT '99',
    customer_doc_number VARCHAR(50),
    invoice_type        VARCHAR(10),
    invoice_number      VARCHAR(50),
    cae                 VARCHAR(50),
    cae_expires_at      DATE,
    afip_qr_data        TEXT,
    created_by          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Sale items table
CREATE TABLE IF NOT EXISTS public.sale_items (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id           UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
    description       VARCHAR(255) NOT NULL,
    quantity          NUMERIC(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price        NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_rate          NUMERIC(5,2) NOT NULL DEFAULT 21.00,
    total_price       NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Stock deduction trigger for sale_items
CREATE OR REPLACE FUNCTION public.fn_deduct_stock_on_sale_item()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.inventory_item_id IS NOT NULL THEN
            UPDATE public.inventory_items
            SET quantity = quantity - NEW.quantity
            WHERE id = NEW.inventory_item_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.inventory_item_id IS NOT NULL THEN
            UPDATE public.inventory_items
            SET quantity = quantity + OLD.quantity
            WHERE id = OLD.inventory_item_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_deduct_stock_on_sale_item
AFTER INSERT OR DELETE ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.fn_deduct_stock_on_sale_item();

-- 5. Enable RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
CREATE POLICY "Aislamiento Ventas" ON public.sales
FOR ALL TO authenticated
USING (branch_id = public.get_user_branch_id())
WITH CHECK (branch_id = public.get_user_branch_id());

CREATE POLICY "Aislamiento Items de Ventas" ON public.sale_items
FOR ALL TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.sales s
    WHERE s.id = sale_items.sale_id
    AND s.branch_id = public.get_user_branch_id()
));

-- 7. Performance indexes
CREATE INDEX IF NOT EXISTS idx_sales_branch_id ON public.sales(branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_branch_created ON public.sales(branch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_work_order_id ON public.sales(work_order_id);
CREATE INDEX IF NOT EXISTS idx_sales_cash_movement_id ON public.sales(cash_movement_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_inventory_item_id ON public.sale_items(inventory_item_id);
