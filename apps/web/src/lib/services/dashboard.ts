import type { SupabaseClient } from "@supabase/supabase-js"

// ─── Types ───────────────────────────────────────────────────────────────────

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
