-- ============================================================================
-- Migration: Extend ARCA fiscal tables for production readiness
-- Date: 2026-09-01
-- Description:
--   1. Extend arca_configs with tax regime fields for scalable SaaS deployment
--   2. Add sale_id to arca_invoices for POS invoice linkage
--   3. Add arca_invoice_id to sales for bidirectional reference
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. EXTEND arca_configs: Tax regime and business identity
-- ──────────────────────────────────────────────────────────────────────────────

-- Tax condition enum for scalability (Monotributo now, RI and Exento later)
DO $$ BEGIN
  CREATE TYPE public.tax_condition AS ENUM ('monotributo', 'responsable_inscripto', 'exento');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.arca_configs
  ADD COLUMN IF NOT EXISTS tax_condition public.tax_condition NOT NULL DEFAULT 'monotributo',
  ADD COLUMN IF NOT EXISTS business_name VARCHAR(255),       -- Razón Social
  ADD COLUMN IF NOT EXISTS fantasy_name VARCHAR(255),        -- Nombre de Fantasía
  ADD COLUMN IF NOT EXISTS iibb VARCHAR(30),                 -- Número de Ingresos Brutos
  ADD COLUMN IF NOT EXISTS activity_start_date DATE,         -- Inicio de Actividades
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT false;  -- Kill switch for fiscal billing

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. LINK arca_invoices → sales (optional FK for POS-originated invoices)
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.arca_invoices
  ADD COLUMN IF NOT EXISTS sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL;

-- Unique partial index: at most one approved invoice per sale (anti-double billing)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unica_factura_venta
  ON public.arca_invoices(sale_id)
  WHERE (sale_id IS NOT NULL AND resultado = 'A');

CREATE INDEX IF NOT EXISTS idx_arca_invoices_sale
  ON public.arca_invoices(sale_id)
  WHERE sale_id IS NOT NULL;

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. LINK sales → arca_invoices (reverse lookup for printing engine)
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS arca_invoice_id UUID REFERENCES public.arca_invoices(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sales_arca_invoice
  ON public.sales(arca_invoice_id)
  WHERE arca_invoice_id IS NOT NULL;
