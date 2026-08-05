-- ============================================================================
-- ERP & CRM PARA TALLER DE REPARACIONES (SUPABASE POSTGRESQL CANONICAL SCHEMA)
-- ============================================================================
-- Autor: Senior Database Architect
-- Fecha: 2026-07-27
-- Descripción: Esquema relacional optimizado para Supabase que incluye aislamiento 
--              multi-sucursal (RLS), auditorías de estado, sincronización de 
--              inventarios y contabilidad atómica de caja diaria en mutaciones completas.
-- ============================================================================

-- 0. EXTENSIONES REQUERIDAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TIPOS ENUMERADOS (ENUMS)
CREATE TYPE public.user_role AS ENUM ('admin', 'technician', 'cashier', 'receptionist');

CREATE TYPE public.order_status AS ENUM (
    'received',          -- Recibido
    'waiting_client',    -- Esperando Cliente
    'waiting_parts',     -- Esperando Repuesto
    'ready_for_pickup',  -- Listo para Retirar
    'cancelled',         -- Cancelado
    'delivered'          -- Entregado
);

CREATE TYPE public.note_type AS ENUM ('internal', 'client_visible');

CREATE TYPE public.purchase_status AS ENUM ('pending', 'ordered', 'received', 'cancelled');

CREATE TYPE public.cash_movement_type AS ENUM ('income', 'expense');

CREATE TYPE public.cash_category AS ENUM (
    'work_order_payment',  -- Cobro de orden
    'stock_sale',          -- Venta directa de stock
    'manual_income',       -- Ingreso manual
    'manual_expense',      -- Gasto manual
    'purchase_payment',    -- Compra de repuesto/producto
    'utility_expense'      -- Expensas (luz, alquiler, contador, etc.)
);

CREATE TYPE public.payment_method AS ENUM ('cash', 'qr', 'transfer', 'card');

CREATE TYPE public.discount_type AS ENUM ('none', 'fixed', 'percentage');

-- ============================================================================
-- 2. TABLAS DEL SISTEMA
-- ============================================================================

-- A. SUCURSALES Y AJUSTES
CREATE TABLE public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    tax_id VARCHAR(50), -- CUIT / DNI del taller
    logo_url TEXT,
    favicon_url TEXT,
    service_conditions TEXT, -- Condiciones del servicio y garantía
    print_settings JSONB NOT NULL DEFAULT '{
        "show_costs": false,
        "show_technician_notes": false,
        "show_header_logo": true
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- B. PERFILES DE USUARIO (Vinculados a auth.users de Supabase)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role public.user_role NOT NULL DEFAULT 'technician',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- C. PERMISOS GRANULARES POR USUARIO
CREATE TABLE public.user_permissions (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    can_manage_stock BOOLEAN NOT NULL DEFAULT TRUE,
    can_delete_orders BOOLEAN NOT NULL DEFAULT FALSE,
    can_modify_closed_cash BOOLEAN NOT NULL DEFAULT FALSE,
    can_view_costs BOOLEAN NOT NULL DEFAULT FALSE,
    can_manage_settings BOOLEAN NOT NULL DEFAULT FALSE,
    custom_permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- D. CLIENTES
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    tax_id VARCHAR(50), -- DNI / CUIT (Opcional)
    phone VARCHAR(50),  -- Contacto (Opcional)
    email VARCHAR(255), -- Correo (Opcional)
    address TEXT,       -- Domicilio (Opcional)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- E. STOCK / INVENTARIO
CREATE TABLE public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    code VARCHAR(100) NOT NULL, -- Alfanumérico o autogenerado
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    cost_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
    sale_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (sale_price >= 0),
    min_stock NUMERIC(10,2) DEFAULT 5, -- Para alertas y checklist de compras
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_code_per_branch UNIQUE (branch_id, code)
);

-- F. ÓRDENES DE TRABAJO
CREATE TABLE public.work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    order_number VARCHAR(50) NOT NULL, -- Formato: ORD-001, ORD-002, etc.
    order_sequence INTEGER NOT NULL,    -- Número correlativo por sucursal
    
    -- Dispositivo
    device_brand VARCHAR(100) NOT NULL,
    device_model VARCHAR(100) NOT NULL,
    device_color VARCHAR(50),
    aesthetic_condition TEXT,
    accessories TEXT,
    reported_problem TEXT NOT NULL,
    suggested_solution TEXT,
    
    -- Estado actual
    status public.order_status NOT NULL DEFAULT 'received',
    
    -- Fechas y Zona Horaria
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    estimated_delivery_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
    
    -- Finanzas de la orden
    estimated_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_expenses NUMERIC(12,2) NOT NULL DEFAULT 0,
    balance NUMERIC(12,2) GENERATED ALWAYS AS (estimated_cost - total_paid) STORED,
    
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_order_number_per_branch UNIQUE (branch_id, order_number)
);

-- G. REPUESTOS / GASTOS ASOCIADOS A LA ÓRDEN
CREATE TABLE public.work_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
    cost_price NUMERIC(12,2) NOT NULL DEFAULT 0, -- Costo CONGELADO al momento del uso
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_price NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- H. AUDITORÍA DE CAMBIOS DE ESTADO DE ÓRDENES (PIPELINE)
CREATE TABLE public.work_order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
    previous_status public.order_status,
    new_status public.order_status NOT NULL,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reason TEXT
);

-- I. REGISTRO DE NOTAS DE LA ÓRDEN
CREATE TABLE public.work_order_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    note_type public.note_type NOT NULL DEFAULT 'internal',
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- J. TAREAS (CHECKLIST DE ÓRDENES O MANUALES)
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    work_order_id UUID REFERENCES public.work_orders(id) ON DELETE CASCADE, -- Opcional: origen desde orden
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- K. COMPRAS / REPOSICIONES (DE STOCK O BAJO DEMANDA)
CREATE TABLE public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    work_order_id UUID REFERENCES public.work_orders(id) ON DELETE SET NULL,       -- Origen desde orden
    inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL, -- Origen stock bajo
    title VARCHAR(255) NOT NULL,
    supplier VARCHAR(255),
    status public.purchase_status NOT NULL DEFAULT 'pending',
    quantity NUMERIC(10,2) DEFAULT 1,
    estimated_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    actual_cost NUMERIC(12,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- L. SESIONES DE CAJA CHICA (CAJA DIARIA)
CREATE TABLE public.cash_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    opened_by UUID NOT NULL REFERENCES public.profiles(id),
    closed_by UUID REFERENCES public.profiles(id),
    initial_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
    final_balance NUMERIC(12,2),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT
);

-- M. MOVIMIENTOS DETALLADOS DE CAJA
CREATE TABLE public.cash_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    cash_register_id UUID REFERENCES public.cash_registers(id) ON DELETE SET NULL,
    work_order_id UUID REFERENCES public.work_orders(id) ON DELETE SET NULL,
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE SET NULL,
    inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
    type public.cash_movement_type NOT NULL,
    category public.cash_category NOT NULL,
    payment_method public.payment_method NOT NULL DEFAULT 'cash',
    gross_amount NUMERIC(12,2) NOT NULL CHECK (gross_amount >= 0),
    discount_type public.discount_type NOT NULL DEFAULT 'none',
    discount_value NUMERIC(12,2) NOT NULL DEFAULT 0,
    net_amount NUMERIC(12,2) NOT NULL CHECK (net_amount >= 0),
    description TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- N. INVITACIONES DE NUEVOS EMPLEADOS
CREATE TABLE public.employee_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role public.user_role NOT NULL DEFAULT 'technician',
    token VARCHAR(64) NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. FUNCIONES DE NEGOCIO Y TRIGGERS DE AUTOMATIZACIÓN (ACID)
-- ============================================================================

-- A. Generación Atómica de Número de Orden ORD-XXX por Sucursal
CREATE OR REPLACE FUNCTION public.fn_generate_work_order_number()
RETURNS TRIGGER AS $$
DECLARE
    v_next_seq INT;
BEGIN
    SELECT COALESCE(MAX(order_sequence), 0) + 1
    INTO v_next_seq
    FROM public.work_orders
    WHERE branch_id = NEW.branch_id;

    NEW.order_sequence := v_next_seq;
    NEW.order_number := 'ORD-' || LPAD(v_next_seq::TEXT, 3, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_generate_work_order_number
BEFORE INSERT ON public.work_orders
FOR EACH ROW
WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
EXECUTE FUNCTION public.fn_generate_work_order_number();


-- B. Auditoría de Estados y Timestamp de Entrega de Órdenes
CREATE OR REPLACE FUNCTION public.fn_audit_work_order_status()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.work_order_status_history (
            work_order_id,
            previous_status,
            new_status,
            changed_by
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            auth.uid()
        );
        
        IF NEW.status = 'delivered' THEN
            NEW.delivered_at := NOW();
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_audit_work_order_status
BEFORE UPDATE ON public.work_orders
FOR EACH ROW
EXECUTE FUNCTION public.fn_audit_work_order_status();


-- C. Manejo de Repuestos en Orden: Sincronización Completa de Costos y Stock (INSERT, UPDATE, DELETE)
CREATE OR REPLACE FUNCTION public.fn_freeze_item_cost_and_update_stock()
RETURNS TRIGGER AS $$
DECLARE
    v_stock_cost public.inventory_items.cost_price%TYPE;
BEGIN
    -- 1. CASO INSERCIÓN (INSERT)
    IF TG_OP = 'INSERT' THEN
        IF NEW.inventory_item_id IS NOT NULL THEN
            SELECT cost_price INTO v_stock_cost
            FROM public.inventory_items
            WHERE id = NEW.inventory_item_id;

            IF NEW.cost_price = 0 THEN
                NEW.cost_price := COALESCE(v_stock_cost, 0);
            END IF;

            -- Descontar del stock
            UPDATE public.inventory_items
            SET quantity = quantity - NEW.quantity
            WHERE id = NEW.inventory_item_id;
        END IF;

        -- Registrar gasto acumulado en la orden
        UPDATE public.work_orders
        SET total_expenses = total_expenses + (NEW.quantity * NEW.cost_price), updated_at = NOW()
        WHERE id = NEW.work_order_id;

    -- 2. CASO EDICIÓN (UPDATE)
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.inventory_item_id IS DISTINCT FROM NEW.inventory_item_id OR OLD.quantity IS DISTINCT FROM NEW.quantity OR OLD.cost_price IS DISTINCT FROM NEW.cost_price THEN
            -- Devolvemos la cantidad vieja al stock viejo
            IF OLD.inventory_item_id IS NOT NULL THEN
                UPDATE public.inventory_items
                SET quantity = quantity + OLD.quantity
                WHERE id = OLD.inventory_item_id;
            END IF;

            -- Descontamos la nueva cantidad del stock nuevo
            IF NEW.inventory_item_id IS NOT NULL THEN
                SELECT cost_price INTO v_stock_cost
                FROM public.inventory_items
                WHERE id = NEW.inventory_item_id;

                IF NEW.cost_price = 0 THEN
                    NEW.cost_price := COALESCE(v_stock_cost, 0);
                END IF;

                UPDATE public.inventory_items
                SET quantity = quantity - NEW.quantity
                WHERE id = NEW.inventory_item_id;
            END IF;

            -- Ajustamos la diferencia del gasto en la orden
            UPDATE public.work_orders
            SET total_expenses = (total_expenses - (OLD.quantity * OLD.cost_price)) + (NEW.quantity * NEW.cost_price), updated_at = NOW()
            WHERE id = NEW.work_order_id;
        END IF;

    -- 3. CASO ELIMINACIÓN (DELETE)
    ELSIF TG_OP = 'DELETE' THEN
        -- Devolver los productos de vuelta al stock de inventario
        IF OLD.inventory_item_id IS NOT NULL THEN
            UPDATE public.inventory_items
            SET quantity = quantity + OLD.quantity
            WHERE id = OLD.inventory_item_id;
        END IF;

        -- Restar el gasto de la orden
        UPDATE public.work_orders
        SET total_expenses = total_expenses - (OLD.quantity * OLD.cost_price), updated_at = NOW()
        WHERE id = OLD.work_order_id;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_freeze_item_cost_and_update_stock
BEFORE INSERT OR UPDATE OR DELETE ON public.work_order_items
FOR EACH ROW
EXECUTE FUNCTION public.fn_freeze_item_cost_and_update_stock();


-- D. Creación Automática de Perfil del Usuario al Registrarse en Supabase Auth
CREATE OR REPLACE FUNCTION public.fn_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'Usuario'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', 'Nuevo'),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'technician')
    );

    INSERT INTO public.user_permissions (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.fn_handle_new_user();


-- E. Movimientos de Caja Chica hacia Órdenes: Sincronización de Pagos (INSERT, UPDATE, DELETE)
CREATE OR REPLACE FUNCTION public.fn_sync_cash_movement_to_work_order()
RETURNS TRIGGER AS $$
DECLARE
    v_is_closed BOOLEAN;
BEGIN
    -- Validar que la caja esté abierta solo para inserciones y actualizaciones
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        IF NEW.cash_register_id IS NOT NULL THEN
            SELECT is_closed INTO v_is_closed FROM public.cash_registers WHERE id = NEW.cash_register_id;
            IF COALESCE(v_is_closed, FALSE) THEN
                RAISE EXCEPTION 'No se pueden ingresar o modificar movimientos en una caja cerrada.';
            END IF;
        END IF;
    END IF;

    -- 1. CASO INSERCIÓN (INSERT)
    IF TG_OP = 'INSERT' THEN
        IF NEW.category = 'work_order_payment' AND NEW.work_order_id IS NOT NULL THEN
            UPDATE public.work_orders
            SET total_paid = total_paid + NEW.net_amount, updated_at = NOW()
            WHERE id = NEW.work_order_id;
        END IF;

    -- 2. CASO EDICIÓN (UPDATE)
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.work_order_id IS DISTINCT FROM NEW.work_order_id OR OLD.net_amount IS DISTINCT FROM NEW.net_amount THEN
            -- Reversamos (restamos) el monto viejo de la orden anterior
            IF OLD.category = 'work_order_payment' AND OLD.work_order_id IS NOT NULL THEN
                UPDATE public.work_orders
                SET total_paid = total_paid - OLD.net_amount, updated_at = NOW()
                WHERE id = OLD.work_order_id;
            END IF;
            -- Sumamos el nuevo monto a la orden correspondiente
            IF NEW.category = 'work_order_payment' AND NEW.work_order_id IS NOT NULL THEN
                UPDATE public.work_orders
                SET total_paid = total_paid + NEW.net_amount, updated_at = NOW()
                WHERE id = NEW.work_order_id;
            END IF;
        END IF;

    -- 3. CASO ELIMINACIÓN (DELETE)
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.category = 'work_order_payment' AND OLD.work_order_id IS NOT NULL THEN
            UPDATE public.work_orders
            SET total_paid = total_paid - OLD.net_amount, updated_at = NOW()
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

CREATE TRIGGER trg_sync_cash_movement_to_work_order
AFTER INSERT OR UPDATE OR DELETE ON public.cash_movements
FOR EACH ROW
EXECUTE FUNCTION public.fn_sync_cash_movement_to_work_order();


-- F. Sincronización de Compra Recibida a Incremento de Stock y Egreso Contable
CREATE OR REPLACE FUNCTION public.fn_sync_received_purchase_to_stock()
RETURNS TRIGGER AS $$
DECLARE
    v_open_register_id UUID;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'received' THEN
        -- 1. Sumar cantidad al stock si el item está linkeado
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

        -- 2. Buscar si hay una caja abierta para registrar el gasto automáticamente
        SELECT id INTO v_open_register_id 
        FROM public.cash_registers 
        WHERE branch_id = NEW.branch_id AND is_closed = FALSE 
        LIMIT 1;

        IF v_open_register_id IS NOT NULL AND NEW.actual_cost > 0 THEN
            INSERT INTO public.cash_movements (
                branch_id,
                cash_register_id,
                purchase_id,
                type,
                category,
                gross_amount,
                net_amount,
                description
            ) VALUES (
                NEW.branch_id,
                v_open_register_id,
                NEW.id,
                'expense',
                'purchase_payment',
                NEW.actual_cost,
                NEW.actual_cost,
                'Pago automático por compra recibida: ' || NEW.title
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_sync_received_purchase_to_stock
AFTER UPDATE ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION public.fn_sync_received_purchase_to_stock();


-- G. Generación Automática de Tickets de Compra por Stock Mínimo (Reposición)
CREATE OR REPLACE FUNCTION public.fn_alert_low_stock_to_purchases()
RETURNS TRIGGER AS $$
DECLARE
    v_pending_exists BOOLEAN;
BEGIN
    IF NEW.quantity <= NEW.min_stock AND OLD.quantity > NEW.min_stock THEN
        SELECT EXISTS (
            SELECT 1 FROM public.purchases
            WHERE inventory_item_id = NEW.id
            AND status IN ('pending', 'ordered')
        ) INTO v_pending_exists;

        IF NOT v_pending_exists THEN
            INSERT INTO public.purchases (
                branch_id,
                inventory_item_id,
                title,
                quantity,
                estimated_cost,
                notes
            ) VALUES (
                NEW.branch_id,
                NEW.id,
                'Reposición automática: ' || NEW.name,
                (NEW.min_stock * 2),
                (NEW.cost_price * (NEW.min_stock * 2)),
                'Sugerido automáticamente por control de inventario de stock bajo.'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_alert_low_stock_to_purchases
AFTER UPDATE ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.fn_alert_low_stock_to_purchases();

-- ============================================================================
-- 4. SEGURIDAD Y AISLAMIENTO DE DATOS (ROW LEVEL SECURITY - RLS)
-- ============================================================================

-- Helper para obtener la sucursal del usuario logueado de manera estable
CREATE OR REPLACE FUNCTION public.get_user_branch_id()
RETURNS UUID AS $$
    SELECT branch_id FROM public.profiles WHERE id = (SELECT auth.uid());
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Habilitar RLS en todas las tablas expuestas
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_invitations ENABLE ROW LEVEL SECURITY;

-- DEFINICIÓN DE POLÍTICAS RLS (Tenant Isolation por branch_id)
CREATE POLICY "Aislamiento Sucursales" ON public.branches
FOR ALL TO authenticated
USING (id = public.get_user_branch_id() OR public.get_user_branch_id() IS NULL);

CREATE POLICY "Aislamiento Perfiles" ON public.profiles
FOR ALL TO authenticated
USING (branch_id = public.get_user_branch_id() OR id = (SELECT auth.uid()));

CREATE POLICY "Aislamiento Clientes" ON public.customers
FOR ALL TO authenticated
USING (branch_id = public.get_user_branch_id())
WITH CHECK (branch_id = public.get_user_branch_id());

CREATE POLICY "Aislamiento Stock" ON public.inventory_items
FOR ALL TO authenticated
USING (branch_id = public.get_user_branch_id())
WITH CHECK (branch_id = public.get_user_branch_id());

CREATE POLICY "Aislamiento Órdenes" ON public.work_orders
FOR ALL TO authenticated
USING (branch_id = public.get_user_branch_id())
WITH CHECK (branch_id = public.get_user_branch_id());

CREATE POLICY "Aislamiento Items de Órdenes" ON public.work_order_items
FOR ALL TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.work_orders wo
    WHERE wo.id = work_order_items.work_order_id
    AND wo.branch_id = public.get_user_branch_id()
));

CREATE POLICY "Aislamiento Tareas" ON public.tasks
FOR ALL TO authenticated
USING (branch_id = public.get_user_branch_id())
WITH CHECK (branch_id = public.get_user_branch_id());

CREATE POLICY "Aislamiento Compras" ON public.purchases
FOR ALL TO authenticated
USING (branch_id = public.get_user_branch_id())
WITH CHECK (branch_id = public.get_user_branch_id());

CREATE POLICY "Aislamiento Cajas" ON public.cash_registers
FOR ALL TO authenticated
USING (branch_id = public.get_user_branch_id())
WITH CHECK (branch_id = public.get_user_branch_id());

CREATE POLICY "Aislamiento Movimientos Caja" ON public.cash_movements
FOR ALL TO authenticated
USING (branch_id = public.get_user_branch_id())
WITH CHECK (branch_id = public.get_user_branch_id());

CREATE POLICY "Aislamiento Invitaciones" ON public.employee_invitations
FOR ALL TO authenticated
USING (branch_id = public.get_user_branch_id())
WITH CHECK (branch_id = public.get_user_branch_id());

-- ============================================================================
-- 4.1. ÍNDICES DE RENDIMIENTO Y ESCALABILIDAD (MULTITENANT & RLS INDEXES)
-- ============================================================================
-- Los índices sobre branch_id y claves foráneas son VITALES para que las consultas 
-- con Row Level Security (RLS) no realicen Full Table Scans al crecer la base.

CREATE INDEX IF NOT EXISTS idx_profiles_branch_id ON public.profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_customers_branch_id ON public.customers(branch_id);
CREATE INDEX IF NOT EXISTS idx_customers_tax_id ON public.customers(tax_id);

CREATE INDEX IF NOT EXISTS idx_inventory_branch_id ON public.inventory_items(branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_code ON public.inventory_items(branch_id, code);

CREATE INDEX IF NOT EXISTS idx_work_orders_branch_status ON public.work_orders(branch_id, status);
CREATE INDEX IF NOT EXISTS idx_work_orders_customer_id ON public.work_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_created_at ON public.work_orders(branch_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_work_order_items_order_id ON public.work_order_items(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_items_item_id ON public.work_order_items(inventory_item_id);

CREATE INDEX IF NOT EXISTS idx_tasks_branch_status ON public.tasks(branch_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_tasks_work_order_id ON public.tasks(work_order_id);

CREATE INDEX IF NOT EXISTS idx_purchases_branch_status ON public.purchases(branch_id, status);
CREATE INDEX IF NOT EXISTS idx_purchases_work_order_id ON public.purchases(work_order_id);

CREATE INDEX IF NOT EXISTS idx_cash_registers_branch_closed ON public.cash_registers(branch_id, is_closed);
CREATE INDEX IF NOT EXISTS idx_cash_movements_branch_register ON public.cash_movements(branch_id, cash_register_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_work_order ON public.cash_movements(work_order_id);

-- ============================================================================
-- 5. PROCEDIMIENTOS ALMACENADOS DE FLUJO DE TRABAJO (RPCs)
-- ============================================================================

-- A. Onboarding: Creación Inicial de Sucursal y Asignación de Admin Propietario
CREATE OR REPLACE FUNCTION public.create_initial_branch_and_setup_owner(
    p_name VARCHAR(255),
    p_address TEXT DEFAULT NULL,
    p_phone VARCHAR(50) DEFAULT NULL,
    p_email VARCHAR(255) DEFAULT NULL,
    p_tax_id VARCHAR(50) DEFAULT NULL,
    p_service_conditions TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_current_branch_id UUID;
    v_new_branch_id UUID;
BEGIN
    v_user_id := (SELECT auth.uid());
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado.';
    END IF;

    SELECT branch_id INTO v_current_branch_id
    FROM public.profiles
    WHERE id = v_user_id;

    IF v_current_branch_id IS NOT NULL THEN
        RAISE EXCEPTION 'El usuario ya está vinculado a una sucursal existente.';
    END IF;

    INSERT INTO public.branches (
        name,
        address,
        phone,
        email,
        tax_id,
        service_conditions
    ) VALUES (
        p_name,
        p_address,
        p_phone,
        p_email,
        p_tax_id,
        p_service_conditions
    )
    RETURNING id INTO v_new_branch_id;

    UPDATE public.profiles
    SET 
        branch_id = v_new_branch_id,
        role = 'admin',
        updated_at = NOW()
    WHERE id = v_user_id;

    INSERT INTO public.user_permissions (
        user_id,
        can_manage_stock,
        can_delete_orders,
        can_modify_closed_cash,
        can_view_costs,
        can_manage_settings
    ) VALUES (
        v_user_id,
        TRUE,
        TRUE,
        TRUE,
        TRUE,
        TRUE
    )
    ON CONFLICT (user_id) DO UPDATE
    SET 
        can_manage_stock = TRUE,
        can_delete_orders = TRUE,
        can_modify_closed_cash = TRUE,
        can_view_costs = TRUE,
        can_manage_settings = TRUE,
        updated_at = NOW();

    RETURN jsonb_build_object(
        'success', true,
        'branch_id', v_new_branch_id,
        'message', 'Sucursal creada y administrador configurado correctamente.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- B. Ingreso de Orden: Transacción Atómica de Cliente, Orden y Seña inicial
CREATE OR REPLACE FUNCTION public.create_work_order_with_new_customer_and_deposit(
    -- Parámetros obligatorios (Sin valor por defecto)
    p_customer_first_name VARCHAR(100),
    p_customer_last_name VARCHAR(100),
    p_device_brand VARCHAR(100),
    p_device_model VARCHAR(100),
    p_reported_problem TEXT,
    
    -- Parámetros opcionales (Con valor por defecto)
    p_customer_tax_id VARCHAR(50) DEFAULT NULL,
    p_customer_phone VARCHAR(50) DEFAULT NULL,
    p_customer_email VARCHAR(255) DEFAULT NULL,
    p_customer_address TEXT DEFAULT NULL,
    p_device_color VARCHAR(50) DEFAULT NULL,
    p_aesthetic_condition TEXT DEFAULT NULL,
    p_accessories TEXT DEFAULT NULL,
    p_suggested_solution TEXT DEFAULT NULL,
    p_estimated_cost NUMERIC(12,2) DEFAULT 0,
    p_deposit_amount NUMERIC(12,2) DEFAULT 0,
    p_payment_method public.payment_method DEFAULT 'cash'
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_branch_id UUID;
    v_customer_id UUID;
    v_order_id UUID;
    v_order_number VARCHAR(50);
    v_open_register_id UUID;
BEGIN
    v_user_id := (SELECT auth.uid());
    SELECT branch_id INTO v_branch_id FROM public.profiles WHERE id = v_user_id;

    IF v_branch_id IS NULL THEN
        RAISE EXCEPTION 'El usuario no pertenece a ninguna sucursal activa.';
    END IF;

    INSERT INTO public.customers (
        branch_id,
        first_name,
        last_name,
        tax_id,
        phone,
        email,
        address
    ) VALUES (
        v_branch_id,
        p_customer_first_name,
        p_customer_last_name,
        p_customer_tax_id,
        p_customer_phone,
        p_customer_email,
        p_customer_address
    )
    RETURNING id INTO v_customer_id;

    INSERT INTO public.work_orders (
        branch_id,
        customer_id,
        device_brand,
        device_model,
        device_color,
        aesthetic_condition,
        accessories,
        reported_problem,
        suggested_solution,
        estimated_cost,
        created_by
    ) VALUES (
        v_branch_id,
        v_customer_id,
        p_device_brand,
        p_device_model,
        p_device_color,
        p_aesthetic_condition,
        p_accessories,
        p_reported_problem,
        p_suggested_solution,
        p_estimated_cost,
        v_user_id
    )
    RETURNING id, order_number INTO v_order_id, v_order_number;

    IF p_deposit_amount > 0 THEN
        SELECT id INTO v_open_register_id 
        FROM public.cash_registers 
        WHERE branch_id = v_branch_id AND is_closed = FALSE 
        LIMIT 1;

        IF v_open_register_id IS NULL THEN
            RAISE EXCEPTION 'No se puede registrar la seña porque no hay ninguna caja diaria abierta para esta sucursal.';
        END IF;

        INSERT INTO public.cash_movements (
            branch_id,
            cash_register_id,
            work_order_id,
            type,
            category,
            payment_method,
            gross_amount,
            net_amount,
            description,
            created_by
        ) VALUES (
            v_branch_id,
            v_open_register_id,
            v_order_id,
            'income',
            'work_order_payment',
            p_payment_method,
            p_deposit_amount,
            p_deposit_amount,
            'Seña inicial recibida al ingresar órden ' || v_order_number,
            v_user_id
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'customer_id', v_customer_id,
        'work_order_id', v_order_id,
        'order_number', v_order_number,
        'message', 'Orden creada exitosamente junto al cliente y la seña correspondiente.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- C. Aceptar Invitación de Empleado (Proceso Seguro)
CREATE OR REPLACE FUNCTION public.accept_employee_invitation(p_token VARCHAR(64))
RETURNS JSONB AS $$
DECLARE
    v_invitation RECORD;
    v_user_id UUID;
BEGIN
    v_user_id := (SELECT auth.uid());
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado.';
    END IF;

    SELECT * INTO v_invitation
    FROM public.employee_invitations
    WHERE token = p_token AND accepted_at IS NULL AND expires_at > NOW();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Token de invitación inválido, expirado o ya utilizado.';
    END IF;

    UPDATE public.profiles
    SET 
        branch_id = v_invitation.branch_id,
        role = v_invitation.role,
        updated_at = NOW()
    WHERE id = v_user_id;

    UPDATE public.employee_invitations
    SET accepted_at = NOW()
    WHERE id = v_invitation.id;

    RETURN jsonb_build_object(
        'success', true,
        'branch_id', v_invitation.branch_id,
        'role', v_invitation.role,
        'message', 'Te has unido exitosamente a la sucursal.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- 6. CONFIGURACIÓN DE STORAGE DE SUPABASE (LOGOS & IMÁGENES)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('branch_assets', 'branch_assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Lectura publica de assets" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'branch_assets');

CREATE POLICY "Gestion de assets para autenticados" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'branch_assets')
WITH CHECK (bucket_id = 'branch_assets');

-- ============================================================================
-- 7. FACTURACIÓN ELECTRÓNICA ARCA (EX-AFIP WSFE V1)
-- ============================================================================

-- A. CONFIGURACIÓN FISCAL POR SUCURSAL
CREATE TABLE public.arca_configs (
    branch_id UUID PRIMARY KEY REFERENCES public.branches(id) ON DELETE CASCADE,
    cuit VARCHAR(11) NOT NULL,
    pto_vta INT NOT NULL DEFAULT 1,
    environment VARCHAR(20) NOT NULL DEFAULT 'homologacion', -- 'homologacion' | 'produccion'
    wsaa_token TEXT,
    wsaa_sign TEXT,
    wsaa_expiration TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.arca_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "arca_configs_isolation_policy" ON public.arca_configs
FOR ALL TO authenticated
USING (branch_id = public.get_user_branch_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (branch_id = public.get_user_branch_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


-- B. TABLA DE COMPROBANTES / FACTURAS DIGITALES ARCA
CREATE TABLE public.arca_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    work_order_id UUID REFERENCES public.work_orders(id) ON DELETE SET NULL,
    cash_movement_id UUID REFERENCES public.cash_movements(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    cbte_tipo INT NOT NULL, -- 1: Factura A, 6: Factura B, 11: Factura C, 3: NC A, 8: NC B, 13: NC C
    pto_vta INT NOT NULL DEFAULT 1,
    cbte_nro BIGINT,
    doc_tipo INT NOT NULL DEFAULT 99, -- 80: CUIT, 96: DNI, 99: Consumidor Final
    doc_nro VARCHAR(20) NOT NULL DEFAULT '0',
    imp_total NUMERIC(12, 2) NOT NULL,
    imp_neto NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    imp_iva NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    cae VARCHAR(20),
    cae_fch_vto DATE,
    resultado VARCHAR(1) NOT NULL DEFAULT 'P', -- 'A': Aprobado, 'R': Rechazado, 'P': Pendiente
    observaciones JSONB NOT NULL DEFAULT '[]'::jsonb,
    qr_payload TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_arca_invoices_branch ON public.arca_invoices(branch_id);
CREATE INDEX idx_arca_invoices_work_order ON public.arca_invoices(work_order_id);
CREATE INDEX idx_arca_invoices_cae ON public.arca_invoices(cae);

-- Restricciones de unicidad para evitar doble facturación (Solo 1 factura aprobada por orden/movimiento)
CREATE UNIQUE INDEX idx_unica_factura_orden ON public.arca_invoices(work_order_id) WHERE (work_order_id IS NOT NULL AND resultado = 'A');
CREATE UNIQUE INDEX idx_unica_factura_movimiento ON public.arca_invoices(cash_movement_id) WHERE (cash_movement_id IS NOT NULL AND resultado = 'A');

ALTER TABLE public.arca_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "arca_invoices_isolation_policy" ON public.arca_invoices
FOR ALL TO authenticated
USING (branch_id = public.get_user_branch_id())
WITH CHECK (branch_id = public.get_user_branch_id());

-- =======================================================================================
-- NOTIFICACIONES INTERNAS (SISTEMA)
-- =======================================================================================
CREATE TABLE public.app_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Si es null, es global para la sucursal
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- info, warning, success, error
    is_read BOOLEAN DEFAULT false,
    link TEXT, -- Opcional: ruta interna a la que redirigir
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indices para optimizar busquedas
CREATE INDEX idx_app_notifications_branch ON public.app_notifications(branch_id);
CREATE INDEX idx_app_notifications_user ON public.app_notifications(user_id);
CREATE INDEX idx_app_notifications_read ON public.app_notifications(is_read);

-- RLS
ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_notifications_isolation_policy" ON public.app_notifications
FOR ALL TO authenticated
USING (
    branch_id = public.get_user_branch_id()
    AND (user_id IS NULL OR user_id = auth.uid())
)
WITH CHECK (
    branch_id = public.get_user_branch_id()
);

-- =======================================================================================
-- ALMACENAMIENTO SEGURO (STORAGE) PARA CERTIFICADOS ARCA
-- =======================================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('arca_certs', 'arca_certs', false)
ON CONFLICT (id) DO NOTHING;

-- Por defecto Supabase bloquea todo acceso. Esto asegura que nadie (ni siquiera 
-- un usuario logueado en el CRM) pueda leer o descargar los certificados .key o .crt
-- La Edge Function de facturación lo bypasseará usando su token service_role.

