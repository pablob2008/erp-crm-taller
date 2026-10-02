import { useEffect, useState, useCallback } from "react"
import { useSupabase } from "@/context/SupabaseProvider"
import { GlobalDateFilter } from "@/components/dashboard/GlobalDateFilter"
import { SalesHistoryWidget } from "@/components/dashboard/SalesHistoryWidget"
import { UnbilledWidget } from "@/components/dashboard/UnbilledWidget"
import { FiscalInvoicesWidget } from "@/components/dashboard/FiscalInvoicesWidget"
import { PendingDebtWidget } from "@/components/dashboard/PendingDebtWidget"
import { PrintableInvoice, type PrintFormat } from "@/components/pos/print/PrintableInvoice"
import {
  fetchDashboardMetrics,
  getPresetRange,
  type DateRange,
  type DashboardMetrics,
} from "@/lib/services/dashboard"
import {
  emitInvoice,
  fetchInvoicesByBranch,
  type ArcaInvoice,
} from "@/lib/services/arca"
import { fetchSaleForPrint, type SaleForPrint } from "@/lib/services/pos"
import { getBranchInfo, type BranchInfo } from "@/lib/services/branches"
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Landmark,
  FileText,
  AlertCircle,
  ShieldCheck,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// ─── Types & Constants ────────────────────────────────────────────────────────

type TabKey = "movements" | "sales" | "fiscal" | "debts"
type FiscalSubTab = "unbilled" | "invoices"

type Movement = {
  id: string
  type: "income" | "expense"
  category: string
  payment_method: string
  net_amount: number
  description: string
  created_at: string
}

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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FinancePage() {
  const { supabase, profile } = useSupabase()
  const { toast } = useToast()
  const branchId = profile?.branch_id

  // ── Tab & Filter States ─────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabKey>("movements")
  const [fiscalSubTab, setFiscalSubTab] = useState<FiscalSubTab>("unbilled")
  const [dateRange, setDateRange] = useState<DateRange>(() => getPresetRange("today"))

  // ── Data States ─────────────────────────────────────────────────────────────
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [movements, setMovements] = useState<Movement[]>([])
  const [totalMovementsCount, setTotalMovementsCount] = useState(0)
  const [movementsPage, setMovementsPage] = useState(0)
  const [periodIncome, setPeriodIncome] = useState(0)
  const [periodExpenses, setPeriodExpenses] = useState(0)
  const [fiscalInvoices, setFiscalInvoices] = useState<ArcaInvoice[]>([])

  const [loading, setLoading] = useState(true)
  const [movementsLoading, setMovementsLoading] = useState(true)
  const [emittingId, setEmittingId] = useState<string | null>(null)

  // ── Print States ────────────────────────────────────────────────────────────
  const [branchInfo, setBranchInfo] = useState<BranchInfo | null>(null)
  const [printData, setPrintData] = useState<SaleForPrint | null>(null)
  const [reprintingId, setReprintingId] = useState<string | null>(null)
  const [printFormat] = useState<PrintFormat>("ticket")

  // ── Fetch Branch Info for Printing ──────────────────────────────────────────
  useEffect(() => {
    if (!branchId) return
    getBranchInfo(supabase, branchId)
      .then((info) => setBranchInfo(info))
      .catch((err) => console.error("[Finance] Failed to fetch branch info:", err))
  }, [supabase, branchId])

  // ── Load Financial Metrics, Sales & Fiscal Invoices ─────────────────────────
  const loadFinancialData = useCallback(async () => {
    if (!branchId) return
    setLoading(true)
    try {
      const [dashMetrics, invResult] = await Promise.all([
        fetchDashboardMetrics(supabase, branchId, dateRange),
        fetchInvoicesByBranch(supabase, branchId, { resultado: "A", limit: 100 }),
      ])
      setMetrics(dashMetrics)
      setFiscalInvoices(invResult.invoices)
    } catch (err) {
      console.error("[Finance] Error loading financial data:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los datos financieros del período.",
      })
    } finally {
      setLoading(false)
    }
  }, [supabase, branchId, dateRange, toast])

  // ── Load Cash Movements List & Aggregate Totals ─────────────────────────────
  const loadMovements = useCallback(async () => {
    if (!branchId) return
    setMovementsLoading(true)
    try {
      const from = movementsPage * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const [listRes, aggRes] = await Promise.all([
        supabase
          .from("cash_movements")
          .select("*", { count: "exact" })
          .eq("branch_id", branchId)
          .gte("created_at", dateRange.from)
          .lte("created_at", dateRange.to)
          .order("created_at", { ascending: false })
          .range(from, to),

        supabase
          .from("cash_movements")
          .select("type, net_amount")
          .eq("branch_id", branchId)
          .gte("created_at", dateRange.from)
          .lte("created_at", dateRange.to),
      ])

      if (listRes.data) {
        setMovements(listRes.data as Movement[])
        setTotalMovementsCount(listRes.count ?? 0)
      }

      if (aggRes.data) {
        let inc = 0
        let exp = 0
        for (const m of aggRes.data as { type: string; net_amount: number }[]) {
          const amt = Number(m.net_amount)
          if (m.type === "income") inc += amt
          else exp += amt
        }
        setPeriodIncome(inc)
        setPeriodExpenses(exp)
      }
    } catch (err) {
      console.error("[Finance] Error loading cash movements:", err)
    } finally {
      setMovementsLoading(false)
    }
  }, [supabase, branchId, dateRange, movementsPage])

  // Reset page when dateRange changes
  useEffect(() => {
    setMovementsPage(0)
  }, [dateRange])

  useEffect(() => {
    loadFinancialData()
  }, [loadFinancialData])

  useEffect(() => {
    loadMovements()
  }, [loadMovements])

  // ── Print Effect: Trigger window.print() ────────────────────────────────────
  useEffect(() => {
    if (!printData) return
    const timer = setTimeout(() => {
      window.print()
      window.onafterprint = () => {
        setPrintData(null)
        setReprintingId(null)
        window.onafterprint = null
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [printData])

  // ── Handlers: Reprint ───────────────────────────────────────────────────────
  const handleReprint = async (saleId: string) => {
    try {
      setReprintingId(saleId)
      const data = await fetchSaleForPrint(supabase, saleId)
      setPrintData(data)
    } catch (err) {
      console.error("[Finance] Error fetching sale for reprint:", err)
      toast({
        variant: "destructive",
        title: "Error al reimprimir",
        description: "No se pudo cargar el comprobante para impresión.",
      })
      setReprintingId(null)
    }
  }

  // ── Handlers: Direct ARCA Invoicing from Unbilled List ───────────────────────
  const handleEmitInvoice = async (
    targetType: "sale" | "work_order",
    targetId: string
  ) => {
    setEmittingId(targetId)
    try {
      const res = await emitInvoice(supabase, {
        target_type: targetType,
        target_id: targetId,
      })

      if (res.success) {
        toast({
          title: res.already_invoiced
            ? "Comprobante ya existente"
            : "Factura emitida exitosamente",
          description: res.mock
            ? `CAE simulado: ${res.cae} (modo homologación)`
            : `CAE otorgado por AFIP: ${res.cae}`,
        })
        // Reload financial metrics & fiscal invoices list
        await loadFinancialData()
      } else {
        toast({
          variant: "destructive",
          title: "Error al emitir factura",
          description: res.error || res.message || "La solicitud fue rechazada por AFIP/ARCA.",
        })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido."
      toast({
        variant: "destructive",
        title: "Error de facturación",
        description: msg,
      })
    } finally {
      setEmittingId(null)
    }
  }

  const balance = periodIncome - periodExpenses
  const totalPages = Math.ceil(totalMovementsCount / PAGE_SIZE)
  const unbilledCount =
    (metrics?.unbilledSales.length ?? 0) + (metrics?.unbilledOrders.length ?? 0)
  const pendingDebtCount = metrics?.pendingDebt.length ?? 0

  return (
    <div className="relative space-y-6">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-10 -left-10 w-80 h-80 rounded-full bg-kpi-blue/6 blur-3xl -z-10" />
      <div className="pointer-events-none absolute top-40 right-0 w-64 h-64 rounded-full bg-kpi-green/5 blur-3xl -z-10" />

      {/* Header with Title and Global Date Filter */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Caja, Comprobantes y Facturación
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestión integral de ingresos/egresos, comprobantes de venta, facturas ARCA y cuentas por cobrar
          </p>
        </div>

        <div className="flex items-center gap-3">
          <GlobalDateFilter value={dateRange} onChange={setDateRange} />
          <button
            type="button"
            onClick={() => {
              loadFinancialData()
              loadMovements()
            }}
            disabled={loading || movementsLoading}
            className="rounded-xl border border-border/40 bg-background/50 p-2 text-muted-foreground backdrop-blur-md hover:bg-accent hover:text-foreground transition-all shadow-sm disabled:opacity-50"
            title="Actualizar datos"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading || movementsLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Period Summary KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Balance Card */}
        <div className="group relative rounded-2xl p-5 overflow-hidden border border-kpi-blue/30 bg-kpi-blue/10 shadow-[0_0_24px_0_hsl(var(--kpi-blue)/0.12)] transition-all duration-200 hover:scale-[1.01] hover:brightness-105">
          <div className="absolute left-0 inset-y-0 w-1 bg-kpi-blue rounded-l-2xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center justify-between mb-3 pl-2">
            <h3 className="text-xs font-semibold text-kpi-blue uppercase tracking-wider">
              Balance del Período
            </h3>
            <div className="p-2 rounded-full bg-kpi-blue/15 text-kpi-blue border border-kpi-blue/30">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="relative pl-2">
            <span className="text-3xl font-bold text-foreground">
              ${balance.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        {/* Income Card */}
        <div className="group relative rounded-2xl p-5 overflow-hidden border border-kpi-green/30 bg-kpi-green/10 shadow-[0_0_24px_0_hsl(var(--kpi-green)/0.12)] transition-all duration-200 hover:scale-[1.01] hover:brightness-105">
          <div className="absolute left-0 inset-y-0 w-1 bg-kpi-green rounded-l-2xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center justify-between mb-3 pl-2">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-kpi-green animate-pulse" />
              <h3 className="text-xs font-semibold text-kpi-green uppercase tracking-wider">
                Ingresos Totales
              </h3>
            </div>
            <div className="p-2 rounded-full bg-kpi-green/15 text-kpi-green border border-kpi-green/30">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="relative pl-2">
            <span className="text-3xl font-bold text-kpi-green">
              ${periodIncome.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="group relative rounded-2xl p-5 overflow-hidden border border-kpi-red/30 bg-kpi-red/10 shadow-[0_0_24px_0_hsl(var(--kpi-red)/0.12)] transition-all duration-200 hover:scale-[1.01] hover:brightness-105">
          <div className="absolute left-0 inset-y-0 w-1 bg-kpi-red rounded-l-2xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center justify-between mb-3 pl-2">
            <h3 className="text-xs font-semibold text-kpi-red uppercase tracking-wider">
              Egresos Totales
            </h3>
            <div className="p-2 rounded-full bg-kpi-red/15 text-kpi-red border border-kpi-red/30">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="relative pl-2">
            <span className="text-3xl font-bold text-kpi-red">
              ${periodExpenses.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Styled Tabs Navigation Bar */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-background/50 backdrop-blur-md p-1.5 border border-border/40 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab("movements")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === "movements"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          <Landmark className="h-4 w-4" />
          <span>Movimientos de Caja</span>
          <span className="ml-1 rounded-full bg-background/30 px-2 py-0.5 text-[10px]">
            {totalMovementsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sales")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === "sales"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          <Receipt className="h-4 w-4" />
          <span>Comprobantes de Venta</span>
          <span className="ml-1 rounded-full bg-background/30 px-2 py-0.5 text-[10px]">
            {metrics?.salesHistory.length ?? 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("fiscal")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === "fiscal"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Facturación ARCA</span>
          {unbilledCount > 0 && (
            <span className="ml-1 rounded-full bg-amber-500/20 text-amber-500 px-2 py-0.5 text-[10px] font-bold">
              {unbilledCount} pend.
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("debts")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === "debts"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          <AlertCircle className="h-4 w-4" />
          <span>Cuentas por Cobrar</span>
          {pendingDebtCount > 0 && (
            <span className="ml-1 rounded-full bg-kpi-red/20 text-kpi-red px-2 py-0.5 text-[10px] font-bold">
              {pendingDebtCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Tab 1: Movimientos de Caja ────────────────────────────────────────── */}
      {activeTab === "movements" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">
              Historial de Ingresos y Egresos
            </h3>
            {totalPages > 1 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <button
                  type="button"
                  disabled={movementsPage === 0}
                  onClick={() => setMovementsPage((p) => Math.max(0, p - 1))}
                  className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="tabular-nums font-medium text-xs">
                  Pág. {movementsPage + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={movementsPage >= totalPages - 1}
                  onClick={() =>
                    setMovementsPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {movementsLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-4 bg-background/40 border border-border/40 animate-pulse backdrop-blur-md shadow-sm"
                >
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
              <p className="font-medium text-base">
                No hay movimientos registrados en el período seleccionado.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {movements.map((m) => {
                const isIncome = m.type === "income"
                const accentClass = isIncome ? "text-kpi-green" : "text-kpi-red"
                const bgClass = isIncome ? "bg-kpi-green/10" : "bg-kpi-red/10"
                const borderClass = isIncome
                  ? "border-kpi-green/30"
                  : "border-kpi-red/30"
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
                    <div
                      className={`absolute left-0 inset-y-0 w-1 ${dotClass} rounded-l-2xl`}
                    />
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full border ${borderClass} ${bgClass} ${accentClass} shrink-0`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <p className="font-bold text-sm text-foreground capitalize">
                            {translateCategory(m.category)}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${borderClass} ${bgClass} ${accentClass}`}
                          >
                            {isIncome && (
                              <span className="w-1.5 h-1.5 rounded-full bg-kpi-green animate-pulse" />
                            )}
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
                      <span
                        className={`inline-block font-mono font-bold text-lg sm:text-xl ${accentClass}`}
                      >
                        {isIncome ? "+" : "-"}$
                        {Number(m.net_amount).toLocaleString("es-AR", {
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

          {totalPages > 1 && !movementsLoading && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={movementsPage === 0}
                onClick={() => setMovementsPage((p) => Math.max(0, p - 1))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/40 bg-background/40 text-sm font-medium hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
              <span className="text-xs text-muted-foreground tabular-nums">
                {movementsPage + 1} / {totalPages} — {totalMovementsCount} movimientos
              </span>
              <button
                type="button"
                disabled={movementsPage >= totalPages - 1}
                onClick={() =>
                  setMovementsPage((p) => Math.min(totalPages - 1, p + 1))
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/40 bg-background/40 text-sm font-medium hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: Comprobantes de Venta ──────────────────────────────────────── */}
      {activeTab === "sales" && (
        <div className="space-y-4">
          <SalesHistoryWidget
            sales={metrics?.salesHistory ?? []}
            loading={loading}
            onReprint={handleReprint}
            reprintingId={reprintingId}
          />
        </div>
      )}

      {/* ── Tab 3: Facturación Electrónica ARCA ─────────────────────────────────── */}
      {activeTab === "fiscal" && (
        <div className="space-y-4">
          {/* Sub-selector: Pendientes vs Emitidas */}
          <div className="flex items-center gap-1 rounded-xl bg-background/60 p-1 border border-border/40 w-fit">
            <button
              type="button"
              onClick={() => setFiscalSubTab("unbilled")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                fiscalSubTab === "unbilled"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Pendientes de Facturar ({unbilledCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setFiscalSubTab("invoices")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                fiscalSubTab === "invoices"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Facturas Emitidas ({fiscalInvoices.length})</span>
            </button>
          </div>

          {fiscalSubTab === "unbilled" ? (
            <UnbilledWidget
              unbilledSales={metrics?.unbilledSales ?? []}
              unbilledOrders={metrics?.unbilledOrders ?? []}
              loading={loading}
              onEmitInvoice={handleEmitInvoice}
              emittingId={emittingId}
            />
          ) : (
            <FiscalInvoicesWidget
              invoices={fiscalInvoices}
              loading={loading}
              onReprint={handleReprint}
              reprintingId={reprintingId}
            />
          )}
        </div>
      )}

      {/* ── Tab 4: Cuentas por Cobrar (Deudas) ─────────────────────────────────── */}
      {activeTab === "debts" && (
        <div className="space-y-4">
          <PendingDebtWidget
            orders={metrics?.pendingDebt ?? []}
            loading={loading}
          />
        </div>
      )}

      {/* Hidden printable invoice engine for reprint action (Tickets / A4) */}
      {printData && branchInfo && (
        <PrintableInvoice
          format={printFormat}
          sale={printData.sale}
          saleItems={printData.items}
          branch={branchInfo}
        />
      )}
    </div>
  )
}
