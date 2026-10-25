import { useEffect, useState, useCallback } from "react"
import { useSupabase } from "@/context/SupabaseProvider"
import { GlobalDateFilter } from "@/components/dashboard/GlobalDateFilter"
import { UnifiedVouchersWidget } from "@/components/dashboard/UnifiedVouchersWidget"
import { PendingDebtWidget } from "@/components/dashboard/PendingDebtWidget"
import { PrintableInvoice, type PrintFormat } from "@/components/pos/print/PrintableInvoice"
import { PageHeader } from "@/components/ui/page-header"
import { KpiMetricCard } from "@/components/ui/kpi-metric-card"
import { GlassCard } from "@/components/ui/glass-card"
import { PriceDisplay } from "@/components/ui/price-display"
import { PaymentMethodBadge } from "@/components/ui/payment-method-badge"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { EmptyState } from "@/components/ui/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  fetchDashboardMetrics,
  getPresetRange,
  type DateRange,
  type DashboardMetrics,
} from "@/lib/services/dashboard"
import { emitInvoice } from "@/lib/services/arca"
import { fetchSaleForPrint, type SaleForPrint } from "@/lib/services/pos"
import { getBranchInfo, type BranchInfo } from "@/lib/services/branches"
import { formatDateTime } from "@/lib/formatters"
import { translateCashCategory } from "@/lib/constants/payment-methods"
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Landmark,
  AlertCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// ─── Types ────────────────────────────────────────────────────────────────────

type TabKey = "movements" | "vouchers" | "debts"

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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FinancePage() {
  const { supabase, profile } = useSupabase()
  const { toast } = useToast()
  const branchId = profile?.branch_id

  // ── Tab & Filter States ─────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabKey>("movements")
  const [dateRange, setDateRange] = useState<DateRange>(() => getPresetRange("today"))

  // ── Data States ─────────────────────────────────────────────────────────────
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [movements, setMovements] = useState<Movement[]>([])
  const [totalMovementsCount, setTotalMovementsCount] = useState(0)
  const [movementsPage, setMovementsPage] = useState(0)
  const [periodIncome, setPeriodIncome] = useState(0)
  const [periodExpenses, setPeriodExpenses] = useState(0)

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

  // ── Load Financial Metrics & Vouchers ───────────────────────────────────────
  const loadFinancialData = useCallback(async () => {
    if (!branchId) return
    setLoading(true)
    try {
      const dashMetrics = await fetchDashboardMetrics(supabase, branchId, dateRange)
      setMetrics(dashMetrics)
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

  // ── Handlers: Direct In-Place ARCA Invoicing ────────────────────────────────
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
    (metrics?.salesHistory.filter((s) => !s.cae && s.status !== "voided").length ?? 0) +
    (metrics?.unbilledOrders.length ?? 0)
  const pendingDebtCount = metrics?.pendingDebt.length ?? 0

  return (
    <div className="flex flex-col gap-6">
      {/* Universal Page Header */}
      <PageHeader
        title="Caja, Comprobantes y Facturación"
        subtitle="Arqueo de ingresos/egresos, comprobantes unificados de venta y taller, y facturación oficial ARCA"
        actions={
          <div className="flex items-center gap-2.5">
            <GlobalDateFilter value={dateRange} onChange={setDateRange} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadFinancialData()
                loadMovements()
              }}
              disabled={loading || movementsLoading}
              className="p-2 rounded-xl border-border/40 bg-background/50 backdrop-blur-md shadow-sm"
              title="Actualizar datos financieros"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading || movementsLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        }
      />

      {/* Period Summary KPI Cards — KpiMetricCard estandarizadas */}
      <div className="grid gap-4 md:grid-cols-3">
        <KpiMetricCard
          title="Balance del Período"
          value={balance}
          isCurrency
          variant="blue"
          icon={<Wallet className="w-5 h-5" />}
          hint="Ingresos menos egresos registrados en el período"
        />

        <KpiMetricCard
          title="Ingresos Totales"
          value={periodIncome}
          isCurrency
          variant="green"
          pulse
          icon={<ArrowUpRight className="w-5 h-5" />}
          hint="Total de dinero ingresado por cobros de órdenes y ventas de mostrador"
        />

        <KpiMetricCard
          title="Egresos Totales"
          value={periodExpenses}
          isCurrency
          variant="red"
          icon={<ArrowDownRight className="w-5 h-5" />}
          hint="Total de dinero egresado por compras a proveedores y gastos manuales"
        />
      </div>

      {/* Styled Master Tabs Navigation Bar (3 Pestañas Claras) */}
      <SegmentedControl<TabKey>
        value={activeTab}
        onChange={setActiveTab}
        options={[
          {
            value: "movements",
            label: "Movimientos de Caja",
            icon: <Landmark className="h-4 w-4" />,
            badge: <span className="opacity-70 text-[10px]">({totalMovementsCount})</span>,
          },
          {
            value: "vouchers",
            label: "Comprobantes & Facturación ARCA",
            icon: <Receipt className="h-4 w-4" />,
            badge:
              unbilledCount > 0 ? (
                <Badge variant="warning" size="sm" className="font-bold">
                  {unbilledCount} pend.
                </Badge>
              ) : undefined,
          },
          {
            value: "debts",
            label: "Cuentas por Cobrar",
            icon: <AlertCircle className="h-4 w-4" />,
            badge:
              pendingDebtCount > 0 ? (
                <Badge variant="destructive" size="sm" className="font-bold">
                  {pendingDebtCount}
                </Badge>
              ) : undefined,
          },
        ]}
      />

      {/* ── Tab 1: Movimientos de Caja (Libro Diario & Arqueo) ─────────────────── */}
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
            <EmptyState
              icon={<Landmark className="w-8 h-8" />}
              title="Sin movimientos en el período"
              description="No hay ingresos ni egresos registrados en el rango de fechas seleccionado."
            />
          ) : (
            <div className="grid gap-3">
              {movements.map((m) => {
                const isIncome = m.type === "income"
                const Icon = isIncome ? ArrowUpRight : ArrowDownRight

                return (
                  <GlassCard
                    key={m.id}
                    accent={isIncome ? "green" : "red"}
                    accentStripe
                    interactive
                    padding="none"
                    className="flex items-center justify-between gap-4 p-4 pl-5"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full border ${
                          isIncome
                            ? "border-kpi-green/30 bg-kpi-green/10 text-kpi-green"
                            : "border-kpi-red/30 bg-kpi-red/10 text-kpi-red"
                        } shrink-0`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <p className="font-bold text-sm text-foreground capitalize">
                            {translateCashCategory(m.category)}
                          </p>
                          <Badge
                            variant={isIncome ? "success" : "destructive"}
                            size="sm"
                          >
                            {isIncome ? "Ingreso" : "Egreso"}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1 font-medium text-foreground/70">
                            <Receipt className="w-3 h-3 opacity-70" />
                            {formatDateTime(m.created_at)}
                          </span>
                          <span className="opacity-30">·</span>
                          <PaymentMethodBadge method={m.payment_method} variant="inline" />
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
                      <PriceDisplay
                        amount={m.net_amount}
                        variant={isIncome ? "income" : "expense"}
                        showSign
                        size="xl"
                      />
                    </div>
                  </GlassCard>
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

      {/* ── Tab 2: Comprobantes & Facturación ARCA Unificados ──────────────────── */}
      {activeTab === "vouchers" && (
        <div className="space-y-4">
          <UnifiedVouchersWidget
            sales={metrics?.salesHistory ?? []}
            unbilledOrders={metrics?.unbilledOrders ?? []}
            loading={loading}
            onReprintSale={handleReprint}
            reprintingId={reprintingId}
            onEmitInvoice={handleEmitInvoice}
            emittingId={emittingId}
          />
        </div>
      )}

      {/* ── Tab 3: Cuentas por Cobrar (Deudores con Saldo) ──────────────────────── */}
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
