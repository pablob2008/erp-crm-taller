import type { SupabaseClient } from "@supabase/supabase-js"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DateRange {
  from: string; // ISO string (start of period, inclusive)
  to: string;   // ISO string (end of period, inclusive)
}

export type DatePreset = "today" | "yesterday" | "this_week" | "this_month" | "last_30_days" | "custom"

export function getPresetRange(preset: DatePreset): DateRange {
  const now = new Date()

  if (preset === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    return { from: start.toISOString(), to: end.toISOString() }
  }

  if (preset === "yesterday") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0)
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999)
    return { from: start.toISOString(), to: end.toISOString() }
  }

  if (preset === "this_week") {
    const day = now.getDay()
    const diff = (day === 0 ? -6 : 1) - day // Monday
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff, 0, 0, 0, 0)
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    return { from: start.toISOString(), to: end.toISOString() }
  }

  if (preset === "this_month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    return { from: start.toISOString(), to: end.toISOString() }
  }

  if (preset === "last_30_days") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0)
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    return { from: start.toISOString(), to: end.toISOString() }
  }

  // fallback to today
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  return { from: start.toISOString(), to: end.toISOString() }
}

export interface OperationalKPIsData {
  totalRevenue: number;
  ticketCount: number;
  readyOrDeliveredOrders: number;
}

export interface SalesHistoryItem {
  id: string;
  created_at: string;
  total: number;
  payment_method: string;
  status: string;
  customer_name?: string | null;
  customer_doc_number?: string | null;
  items_count?: number;
  cae?: string | null;
  invoice_type?: string | null;
  invoice_number?: string | null;
}

export interface UnbilledSaleItem {
  id: string;
  created_at: string;
  total: number;
  payment_method: string;
  status: string;
  customer_name?: string | null;
  customer_doc_number?: string | null;
  work_order_id?: string | null;
}

export interface UnbilledOrderItem {
  id: string;
  order_number: string;
  created_at: string;
  total: number;
  balance: number;
  status: string;
  customer_name?: string | null;
}

export interface PendingDebtItem {
  id: string;
  order_number: string;
  created_at: string;
  total: number;
  balance: number;
  status: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  device_brand?: string | null;
  device_model?: string | null;
}

export interface DashboardMetrics {
  kpis: OperationalKPIsData;
  salesHistory: SalesHistoryItem[];
  unbilledSales: UnbilledSaleItem[];
  unbilledOrders: UnbilledOrderItem[];
  pendingDebt: PendingDebtItem[];
}

export interface PipelineEntry {
  status: string
  count: number
}

export interface RecentOrder {
  id: string
  order_number: string
  device_brand: string
  device_model: string
  status: string
  created_at: string
  customers: {
    first_name: string
    last_name: string
    phone: string | null
  } | null
}

export interface ActivityEntry {
  id: string
  type: "income" | "expense"
  category: string
  description: string | null
  net_amount: number
  created_at: string
}

export interface DashboardData {
  activeWorkshop: number
  readyForPickup: number
  todaysCash: number
  stockAlerts: number
  pipeline: PipelineEntry[]
  recentOrders: RecentOrder[]
  recentActivity: ActivityEntry[]
}

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * Fetches all dashboard widget data in parallel via Promise.all.
 * All queries are scoped to the provided branchId.
 */
export async function fetchDashboardData(
  supabase: SupabaseClient,
  branchId: string
): Promise<DashboardData> {
  // Today's midnight boundary in ISO format
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayStartISO = todayStart.toISOString()

  const [
    activeResult,
    readyResult,
    cashResult,
    stockResult,
    pipelineResult,
    ordersResult,
    activityResult,
  ] = await Promise.all([
    // 2.3 — Active Workshop KPI: orders not yet delivered or cancelled
    supabase
      .from("work_orders")
      .select("*", { count: "exact", head: true })
      .eq("branch_id", branchId)
      .not("status", "in", "(delivered,cancelled)"),

    // 2.4 — Ready for Pickup KPI
    supabase
      .from("work_orders")
      .select("*", { count: "exact", head: true })
      .eq("branch_id", branchId)
      .eq("status", "ready_for_pickup"),

    // 2.5 — Today's Cash KPI: all movements today (income & expense) to compute net
    supabase
      .from("cash_movements")
      .select("type, net_amount")
      .eq("branch_id", branchId)
      .gte("created_at", todayStartISO),

    // 2.6 — Stock Alerts KPI: items where quantity <= min_stock
    // PostgREST column comparison: quantity.lte.min_stock is not directly supported,
    // so we fetch relevant columns and filter client-side.
    supabase
      .from("inventory_items")
      .select("quantity, min_stock")
      .eq("branch_id", branchId),

    // 2.7 — Pipeline: all non-terminal statuses with their statuses (aggregate client-side)
    supabase
      .from("work_orders")
      .select("status")
      .eq("branch_id", branchId)
      .not("status", "in", "(delivered,cancelled)"),

    // 2.8 — Recent Orders: last 10, joined with customers
    supabase
      .from("work_orders")
      .select(
        "id, order_number, device_brand, device_model, status, created_at, customers ( first_name, last_name, phone )"
      )
      .eq("branch_id", branchId)
      .order("created_at", { ascending: false })
      .limit(10),

    // 2.9 — Activity Feed: last 5 cash movements
    supabase
      .from("cash_movements")
      .select("id, type, category, description, net_amount, created_at")
      .eq("branch_id", branchId)
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  // ── KPI: Active Workshop ──────────────────────────────────────────────────
  const activeWorkshop = activeResult.count ?? 0

  // ── KPI: Ready for Pickup ─────────────────────────────────────────────────
  const readyForPickup = readyResult.count ?? 0

  // ── KPI: Today's Cash (net income minus expenses) ─────────────────────────
  const movements = (cashResult.data ?? []) as { type: string; net_amount: number }[]
  const todaysCash = movements.reduce((acc, m) => {
    const amount = Number(m.net_amount)
    return m.type === "income" ? acc + amount : acc - amount
  }, 0)

  // ── KPI: Stock Alerts (client-side column comparison) ────────────────────
  const inventoryRows = (stockResult.data ?? []) as { quantity: number; min_stock: number | null }[]
  const stockAlerts = inventoryRows.filter(
    (row) => row.quantity <= (row.min_stock ?? 5)
  ).length

  // ── Pipeline: aggregate status counts ────────────────────────────────────
  const rawStatuses = (pipelineResult.data ?? []) as { status: string }[]
  const statusMap: Record<string, number> = {}
  for (const row of rawStatuses) {
    statusMap[row.status] = (statusMap[row.status] ?? 0) + 1
  }
  const pipeline: PipelineEntry[] = Object.entries(statusMap).map(([status, count]) => ({
    status,
    count,
  }))

  // ── Recent Orders ─────────────────────────────────────────────────────────
  const recentOrders = ((ordersResult.data ?? []) as any[]).map((order) => ({
    ...order,
    customers: Array.isArray(order.customers) ? (order.customers[0] ?? null) : (order.customers ?? null),
  })) as RecentOrder[]

  // ── Activity Feed ─────────────────────────────────────────────────────────
  const recentActivity = (activityResult.data ?? []) as ActivityEntry[]

  return {
    activeWorkshop,
    readyForPickup,
    todaysCash,
    stockAlerts,
    pipeline,
    recentOrders,
    recentActivity,
  }
}

function formatCustomerName(cust: unknown): string | null {
  if (!cust) return null
  const customer = Array.isArray(cust) ? cust[0] : cust
  if (!customer) return null
  const { first_name, last_name } = customer as { first_name?: string; last_name?: string }
  const name = [first_name, last_name].filter(Boolean).join(" ")
  return name.length > 0 ? name : null
}

/**
 * Fetches operational and financial dashboard metrics.
 * - Filtered by dateRange: Sales History, Total Revenue, Ticket Count, Ready/Delivered Orders.
 * - Statefully unfiltered by date: Unbilled Sales, Unbilled Work Orders, Pending Debt.
 */
export async function fetchDashboardMetrics(
  supabase: SupabaseClient,
  branchId: string,
  dateRange: DateRange
): Promise<DashboardMetrics> {
  const [
    salesRes,
    readyOrDeliveredOrdersRes,
    unbilledSalesRes,
    unbilledOrdersRes,
    pendingDebtRes,
  ] = await Promise.all([
    // 1. Sales history & KPI revenue / tickets in date range
    supabase
      .from("sales")
      .select(`
        id,
        created_at,
        total,
        payment_method,
        status,
        customer_doc_number,
        invoice_type,
        invoice_number,
        cae,
        customers ( first_name, last_name ),
        sale_items ( id )
      `)
      .eq("branch_id", branchId)
      .gte("created_at", dateRange.from)
      .lte("created_at", dateRange.to)
      .order("created_at", { ascending: false }),

    // 2. Ready or Delivered orders count in date range
    supabase
      .from("work_orders")
      .select("id", { count: "exact", head: true })
      .eq("branch_id", branchId)
      .in("status", ["ready_for_pickup", "delivered"])
      .gte("created_at", dateRange.from)
      .lte("created_at", dateRange.to),

    // 3. Unbilled sales (stateful, unfiltered by date)
    supabase
      .from("sales")
      .select(`
        id,
        created_at,
        total,
        payment_method,
        status,
        customer_doc_number,
        work_order_id,
        customers ( first_name, last_name )
      `)
      .eq("branch_id", branchId)
      .is("cae", null)
      .neq("status", "voided")
      .order("created_at", { ascending: false }),

    // 4. Unbilled work orders (stateful, unfiltered by date)
    supabase
      .from("work_orders")
      .select(`
        id,
        order_number,
        created_at,
        estimated_cost,
        balance,
        status,
        customers ( first_name, last_name )
      `)
      .eq("branch_id", branchId)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false }),

    // 5. Pending debt work orders (stateful, unfiltered by date)
    supabase
      .from("work_orders")
      .select(`
        id,
        order_number,
        created_at,
        estimated_cost,
        balance,
        status,
        device_brand,
        device_model,
        customers ( first_name, last_name, phone )
      `)
      .eq("branch_id", branchId)
      .gt("balance", 0)
      .in("status", ["ready_for_pickup", "delivered"])
      .order("created_at", { ascending: false }),
  ])

  if (salesRes.error) throw salesRes.error
  if (readyOrDeliveredOrdersRes.error) throw readyOrDeliveredOrdersRes.error
  if (unbilledSalesRes.error) throw unbilledSalesRes.error
  if (unbilledOrdersRes.error) throw unbilledOrdersRes.error
  if (pendingDebtRes.error) throw pendingDebtRes.error

  const rawSales = (salesRes.data ?? []) as any[]
  const salesHistory: SalesHistoryItem[] = rawSales.map((row) => ({
    id: row.id,
    created_at: row.created_at,
    total: Number(row.total ?? 0),
    payment_method: row.payment_method,
    status: row.status,
    customer_name: formatCustomerName(row.customers),
    customer_doc_number: row.customer_doc_number,
    items_count: Array.isArray(row.sale_items) ? row.sale_items.length : 0,
    cae: row.cae,
    invoice_type: row.invoice_type,
    invoice_number: row.invoice_number,
  }))

  const totalRevenue = rawSales.reduce((acc, s) => {
    if (s.status === "voided") return acc
    return acc + Number(s.total ?? 0)
  }, 0)

  const ticketCount = rawSales.length
  const readyOrDeliveredOrders = readyOrDeliveredOrdersRes.count ?? 0

  const rawUnbilledSales = (unbilledSalesRes.data ?? []) as any[]
  const unbilledSales: UnbilledSaleItem[] = rawUnbilledSales.map((row) => ({
    id: row.id,
    created_at: row.created_at,
    total: Number(row.total ?? 0),
    payment_method: row.payment_method,
    status: row.status,
    customer_name: formatCustomerName(row.customers),
    customer_doc_number: row.customer_doc_number,
    work_order_id: row.work_order_id,
  }))

  const rawUnbilledOrders = (unbilledOrdersRes.data ?? []) as any[]
  const unbilledOrders: UnbilledOrderItem[] = rawUnbilledOrders.map((row) => ({
    id: row.id,
    order_number: row.order_number,
    created_at: row.created_at,
    total: Number(row.estimated_cost ?? 0),
    balance: Number(row.balance ?? 0),
    status: row.status,
    customer_name: formatCustomerName(row.customers),
  }))

  const rawPendingDebt = (pendingDebtRes.data ?? []) as any[]
  const pendingDebt: PendingDebtItem[] = rawPendingDebt.map((row) => {
    const cust = Array.isArray(row.customers) ? row.customers[0] : row.customers
    return {
      id: row.id,
      order_number: row.order_number,
      created_at: row.created_at,
      total: Number(row.estimated_cost ?? 0),
      balance: Number(row.balance ?? 0),
      status: row.status,
      customer_name: formatCustomerName(row.customers),
      customer_phone: cust?.phone ?? null,
      device_brand: row.device_brand ?? null,
      device_model: row.device_model ?? null,
    }
  })

  return {
    kpis: {
      totalRevenue,
      ticketCount,
      readyOrDeliveredOrders,
    },
    salesHistory,
    unbilledSales,
    unbilledOrders,
    pendingDebt,
  }
}

