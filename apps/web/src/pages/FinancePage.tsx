import { useEffect, useState, useCallback } from "react"
import { useSupabase } from "@/context/SupabaseProvider"
import { GlobalDateFilter } from "@/components/dashboard/GlobalDateFilter"
import { getPresetRange, type DateRange } from "@/lib/services/dashboard"
import {
  Landmark,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Receipt,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type Movement = {
  id: string
  type: "income" | "expense"
  category: string
  payment_method: string
  net_amount: number
  description: string
  created_at: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50

const CATEGORY_LABELS: Record<string, string> = {
  work_order_payment: "Pago de orden",
  work_order_advance: "Adelanto / Seña",
  manual_income: "Ingreso manual",
  purchase_payment: "Compra de repuestos",
  general_expense: "Gasto general",
  manual_expense: "Gasto manual",
  sale: "Venta directa",
  refund: "Reintegro / Devolución",
}

const METHOD_LABELS: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
  qr: "QR / Billetera",
}

const translateCategory = (cat: string) =>
  CATEGORY_LABELS[cat] ?? cat.replace(/_/g, " ")

const translateMethod = (method: string) => METHOD_LABELS[method] ?? method

// ─── Component ────────────────────────────────────────────────────────────────

export default function FinancePage() {
  const { supabase, profile } = useSupabase()
  const branchId = profile?.branch_id

  const [dateRange, setDateRange] = useState<DateRange>(() => getPresetRange("today"))
  const [movements, setMovements] = useState<Movement[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchMovements = useCallback(async () => {
    if (!branchId) return
    setLoading(true)

    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data, error, count } = await supabase
      .from("cash_movements")
      .select("*", { count: "exact" })
      .eq("branch_id", branchId)
      .gte("created_at", dateRange.from)
      .lte("created_at", dateRange.to)
      .order("created_at", { ascending: false })
      .range(from, to)

    if (!error && data) {
      setMovements(data as Movement[])
      setTotalCount(count ?? 0)
    }
    setLoading(false)
  }, [supabase, branchId, dateRange, page])

  useEffect(() => {
    setPage(0) // reset to first page when date range changes
  }, [dateRange])

  useEffect(() => {
    fetchMovements()
  }, [fetchMovements])

  // ── KPI calculations (from current page — full period requires server aggregation) ──
  // For the KPI summary we need totals for the full period, not just the current page.
  // We run a separate lightweight query for aggregates.
  const [periodIncome, setPeriodIncome] = useState(0)
  const [periodExpenses, setPeriodExpenses] = useState(0)

  useEffect(() => {
    if (!branchId) return
    async function fetchAggregates() {
      const { data } = await supabase
        .from("cash_movements")
        .select("type, net_amount")
        .eq("branch_id", branchId!)
        .gte("created_at", dateRange.from)
        .lte("created_at", dateRange.to)

      if (!data) return
      let inc = 0
      let exp = 0
      for (const m of data as { type: string; net_amount: number }[]) {
        const amt = Number(m.net_amount)
        if (m.type === "income") inc += amt
        else exp += amt
      }
      setPeriodIncome(inc)
      setPeriodExpenses(exp)
    }
    fetchAggregates()
  }, [supabase, branchId, dateRange])

  const balance = periodIncome - periodExpenses
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative space-y-6">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-10 -left-10 w-80 h-80 rounded-full bg-kpi-blue/6 blur-3xl -z-10" />
      <div className="pointer-events-none absolute top-40 right-0 w-64 h-64 rounded-full bg-kpi-green/5 blur-3xl -z-10" />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Caja y Finanzas</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading
              ? "Cargando movimientos..."
              : `${totalCount} ${totalCount === 1 ? "movimiento" : "movimientos"} en el período`}
          </p>
        </div>
        {/* Date filter */}
        <GlobalDateFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Balance */}
        <div className="group relative rounded-2xl p-5 overflow-hidden border border-kpi-blue/30 bg-kpi-blue/10 shadow-[0_0_24px_0_hsl(var(--kpi-blue)/0.12)] transition-all duration-200 hover:scale-[1.02] hover:brightness-105">
          <div className="absolute left-0 inset-y-0 w-1 bg-kpi-blue rounded-l-2xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center justify-between mb-4 pl-2">
            <h3 className="text-xs font-semibold text-kpi-blue uppercase tracking-wider">Balance del período</h3>
            <div className="p-2 rounded-full bg-kpi-blue/15 text-kpi-blue border border-kpi-blue/30">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="relative pl-2">
            <span className="text-3xl font-bold text-foreground">
              ${balance.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Income */}
        <div className="group relative rounded-2xl p-5 overflow-hidden border border-kpi-green/30 bg-kpi-green/10 shadow-[0_0_24px_0_hsl(var(--kpi-green)/0.12)] transition-all duration-200 hover:scale-[1.02] hover:brightness-105">
          <div className="absolute left-0 inset-y-0 w-1 bg-kpi-green rounded-l-2xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center justify-between mb-4 pl-2">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-kpi-green animate-pulse" />
              <h3 className="text-xs font-semibold text-kpi-green uppercase tracking-wider">Ingresos</h3>
            </div>
            <div className="p-2 rounded-full bg-kpi-green/15 text-kpi-green border border-kpi-green/30">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="relative pl-2">
            <span className="text-3xl font-bold text-kpi-green">
              ${periodIncome.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Expenses */}
        <div className="group relative rounded-2xl p-5 overflow-hidden border border-kpi-red/30 bg-kpi-red/10 shadow-[0_0_24px_0_hsl(var(--kpi-red)/0.12)] transition-all duration-200 hover:scale-[1.02] hover:brightness-105">
          <div className="absolute left-0 inset-y-0 w-1 bg-kpi-red rounded-l-2xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center justify-between mb-4 pl-2">
            <h3 className="text-xs font-semibold text-kpi-red uppercase tracking-wider">Egresos</h3>
            <div className="p-2 rounded-full bg-kpi-red/15 text-kpi-red border border-kpi-red/30">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="relative pl-2">
            <span className="text-3xl font-bold text-kpi-red">
              ${periodExpenses.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Movements List Header */}
      <div className="flex items-center justify-between pt-2">
        <h3 className="text-lg font-bold tracking-tight text-foreground">
          Movimientos del Período
        </h3>
        {totalPages > 1 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="tabular-nums font-medium">
              Pág. {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Movements */}
      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-4 bg-background/40 border border-border/40 animate-pulse backdrop-blur-md shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-1 self-stretch rounded-full bg-muted" />
                <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-36 rounded-full bg-muted" />
                  <div className="h-3 w-48 rounded-full bg-muted" />
                </div>
                <div className="h-6 w-24 rounded-full bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : movements.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground rounded-2xl border border-border/40 bg-background/40 backdrop-blur-md shadow-sm">
          <Landmark className="w-12 h-12 opacity-15" />
          <p className="font-medium text-base">No hay movimientos en el período seleccionado.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {movements.map((m) => {
            const isIncome = m.type === "income"
            const accentClass = isIncome ? "text-kpi-green" : "text-kpi-red"
            const bgClass = isIncome ? "bg-kpi-green/10" : "bg-kpi-red/10"
            const borderClass = isIncome ? "border-kpi-green/30" : "border-kpi-red/30"
            const glowClass = isIncome
              ? "shadow-[0_0_20px_0_hsl(var(--kpi-green)/0.08)]"
              : "shadow-[0_0_20px_0_hsl(var(--kpi-red)/0.08)]"
            const dotClass = isIncome ? "bg-kpi-green" : "bg-kpi-red"
            const Icon = isIncome ? ArrowUpRight : ArrowDownRight

            return (
              <div
                key={m.id}
                className={`group relative flex items-center justify-between gap-4 p-4 pl-5 rounded-2xl border ${borderClass} ${bgClass} ${glowClass} transition-all duration-200 hover:scale-[1.01] hover:brightness-105 overflow-hidden`}
              >
                <div className={`absolute left-0 inset-y-0 w-1 ${dotClass} rounded-l-2xl`} />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-center gap-4 min-w-0">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border ${borderClass} ${bgClass} ${accentClass} shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <p className="font-bold text-sm text-foreground capitalize">
                        {translateCategory(m.category)}
                      </p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${borderClass} ${bgClass} ${accentClass}`}>
                        {isIncome && <span className="w-1.5 h-1.5 rounded-full bg-kpi-green animate-pulse" />}
                        {isIncome ? "Ingreso" : "Egreso"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1 font-medium text-foreground/70">
                        <Receipt className="w-3 h-3 opacity-70" />
                        {new Date(m.created_at).toLocaleString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="opacity-30">·</span>
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3 opacity-70" />
                        {translateMethod(m.payment_method)}
                      </span>
                      {m.description && (
                        <>
                          <span className="opacity-30">·</span>
                          <span className="truncate max-w-[200px] sm:max-w-xs text-foreground/80 font-medium">
                            {m.description}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className={`inline-block font-mono font-bold text-lg sm:text-xl ${accentClass}`}>
                    {isIncome ? "+" : "-"}${Number(m.net_amount).toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Bottom pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/40 bg-background/40 text-sm font-medium hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          <span className="text-sm text-muted-foreground tabular-nums">
            {page + 1} / {totalPages} — {totalCount} movimientos
          </span>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/40 bg-background/40 text-sm font-medium hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
