-- ============================================================================
-- MIGRATION: Add Atomic Ticket Numbering to Sales Table (POS)
-- Generated: 2026-09-03
-- Description: Adds ticket_sequence and ticket_number to sales table.
--              Implements PostgreSQL BEFORE INSERT trigger to atomically
--              generate sequential ticket numbers (TKT-00001, TKT-00002...)
--              partitioned by branch_id, exactly like work order numbers.
--              Backfills all existing sales with sequential numbers.
-- ============================================================================

-- 1. Add columns to sales table
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS ticket_sequence INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS ticket_number VARCHAR(50);

-- 2. Create unique index for branch_id and ticket_number
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_branch_ticket_number
ON public.sales(branch_id, ticket_number)
WHERE ticket_number IS NOT NULL;

-- 3. Atomic ticket number generator function
CREATE OR REPLACE FUNCTION public.fn_generate_sale_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
    v_next_seq INT;
BEGIN
    SELECT COALESCE(MAX(ticket_sequence), 0) + 1
    INTO v_next_seq
    FROM public.sales
    WHERE branch_id = NEW.branch_id;

    NEW.ticket_sequence := v_next_seq;
    NEW.ticket_number := 'TKT-' || LPAD(v_next_seq::TEXT, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Trigger before insert
DROP TRIGGER IF EXISTS trg_generate_sale_ticket_number ON public.sales;
CREATE TRIGGER trg_generate_sale_ticket_number
BEFORE INSERT ON public.sales
FOR EACH ROW
WHEN (NEW.ticket_number IS NULL OR NEW.ticket_number = '')
EXECUTE FUNCTION public.fn_generate_sale_ticket_number();

-- 5. Backfill historical sales ordered by created_at
WITH numbered_sales AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY branch_id ORDER BY created_at ASC) as seq
    FROM public.sales
)
UPDATE public.sales s
SET ticket_sequence = ns.seq,
    ticket_number = 'TKT-' || LPAD(ns.seq::TEXT, 5, '0')
FROM numbered_sales ns
WHERE s.id = ns.id AND s.ticket_number IS NULL;
