import { useEffect, useState, useCallback } from "react"
import { useSupabase } from "@/context/SupabaseProvider"
import { GlobalDateFilter } from "@/components/dashboard/GlobalDateFilter"
import { OperationalKPIs } from "@/components/dashboard/OperationalKPIs"
import { SalesHistoryWidget } from "@/components/dashboard/SalesHistoryWidget"
import { UnbilledWidget } from "@/components/dashboard/UnbilledWidget"
import { PendingDebtWidget } from "@/components/dashboard/PendingDebtWidget"
import { PrintableInvoice, type PrintFormat } from "@/components/pos/print/PrintableInvoice"
import { fetchDashboardMetrics, getPresetRange, type DateRange, type DashboardMetrics } from "@/lib/services/dashboard"
import { fetchSaleForPrint, type SaleForPrint } from "@/lib/services/pos"
import { getBranchInfo, type BranchInfo } from "@/lib/services/branches"
import { RefreshCw } from "lucide-react"

export default function DashboardPage() {
  const { supabase, profile } = useSupabase()
  const branchId = profile?.branch_id

  // ── State: Date Filter & Metrics Data ───────────────────────────────────────
  const [dateRange, setDateRange] = useState<DateRange>(() => getPresetRange("today"))
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── State: Reprint & Print Invoice ──────────────────────────────────────────
  const [branchInfo, setBranchInfo] = useState<BranchInfo | null>(null)
  const [printData, setPrintData] = useState<SaleForPrint | null>(null)
  const [reprintingId, setReprintingId] = useState<string | null>(null)
  const [printFormat] = useState<PrintFormat>("ticket")

  // ── Fetch branch info once branchId is known ────────────────────────────────
  useEffect(() => {
    if (!branchId) return
    getBranchInfo(supabase, branchId)
      .then((info) => setBranchInfo(info))
      .catch((err) => console.error("[Dashboard] Failed to fetch branch info:", err))
  }, [supabase, branchId])

  // ── Load dashboard data on dateRange or branchId change ─────────────────────
  const loadDashboard = useCallback(async () => {
    if (!branchId) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchDashboardMetrics(supabase, branchId, dateRange)
      setMetrics(data)
    } catch (err) {
      console.error("[Dashboard] Error loading dashboard metrics:", err)
      setError("No se pudieron cargar los datos del panel. Por favor intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }, [supabase, branchId, dateRange])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  // ── Print effect: trigger window.print() when printData changes ────────────
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

  // ── Reprint handler ────────────────────────────────────────────────────────
  const handleReprint = async (saleId: string) => {
    try {
      setReprintingId(saleId)
      const data = await fetchSaleForPrint(supabase, saleId)
      setPrintData(data)
    } catch (err) {
      console.error("[Dashboard] Failed to fetch sale for print:", err)
      alert("Error al cargar el comprobante para reimpresión.")
      setReprintingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header with Title and Global Date Filter */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Panel Operativo
          </h1>
          <p className="text-sm text-muted-foreground">
            Métricas del negocio, ventas directas y control de saldos pendientes
          </p>
        </div>

        <div className="flex items-center gap-3">
          <GlobalDateFilter value={dateRange} onChange={setDateRange} />
          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
            className="rounded-xl border border-border/40 bg-background/50 p-2 text-muted-foreground backdrop-blur-md hover:bg-accent hover:text-foreground transition-all shadow-sm disabled:opacity-50"
            title="Actualizar datos"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm backdrop-blur-md">
          {error}
        </div>
      )}

      {/* Operational KPIs row */}
      <OperationalKPIs data={metrics?.kpis} loading={loading} />

      {/* Direct Sales History Widget */}
      <SalesHistoryWidget
        sales={metrics?.salesHistory ?? []}
        loading={loading}
        onReprint={handleReprint}
        reprintingId={reprintingId}
      />

      {/* Bottom 2-column Grid: Unbilled Entities & Pending Debt */}
      <div className="grid gap-6 lg:grid-cols-2">
        <UnbilledWidget
          unbilledSales={metrics?.unbilledSales ?? []}
          unbilledOrders={metrics?.unbilledOrders ?? []}
          loading={loading}
        />
        <PendingDebtWidget
          orders={metrics?.pendingDebt ?? []}
          loading={loading}
        />
      </div>

      {/* Hidden printable invoice engine for reprint action */}
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
