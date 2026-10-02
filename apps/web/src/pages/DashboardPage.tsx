import { useEffect, useState, useCallback } from "react"
import { useSupabase } from "@/context/SupabaseProvider"
import { Wrench, CheckCircle, DollarSign, AlertTriangle, RefreshCw } from "lucide-react"
import { KpiCard } from "@/components/dashboard/KpiCard"
import { PipelineWidget } from "@/components/dashboard/PipelineWidget"
import { RecentOrdersWidget } from "@/components/dashboard/RecentOrdersWidget"
import { ActivityFeedWidget } from "@/components/dashboard/ActivityFeedWidget"
import { QuickActionsWidget } from "@/components/dashboard/QuickActionsWidget"
import { fetchDashboardData, type DashboardData } from "@/lib/services/dashboard"

export default function DashboardPage() {
  const { supabase, profile } = useSupabase()
  const branchId = profile?.branch_id

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    if (!branchId) return
    setLoading(true)
    setError(null)
    try {
      const result = await fetchDashboardData(supabase, branchId)
      setData(result)
    } catch (err) {
      console.error("[Dashboard] Error loading dashboard data:", err)
      setError("No se pudieron cargar los datos del taller. Por favor refrescá la página.")
    } finally {
      setLoading(false)
    }
  }, [supabase, branchId])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Panel Operativo del Taller
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Estado de reparaciones en tiempo real, equipos listos y alertas operativas
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-border/40 bg-background/50 px-3 py-2 text-xs font-semibold text-muted-foreground backdrop-blur-md hover:bg-accent hover:text-foreground transition-all shadow-sm disabled:opacity-50"
            title="Actualizar datos del taller"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm backdrop-blur-md">
          {error}
        </div>
      )}

      {/* Hero Workshop KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Taller Activo"
          value={data?.activeWorkshop ?? 0}
          icon={<Wrench className="h-5 w-5" />}
          accent="kpi-blue"
          loading={loading}
          hint="Órdenes de trabajo en curso (excluye entregadas y canceladas)"
        />
        <KpiCard
          label="Listos para Retiro"
          value={data?.readyForPickup ?? 0}
          icon={<CheckCircle className="h-5 w-5" />}
          accent="kpi-green"
          loading={loading}
          hint="Equipos reparados listos para que el cliente retire"
        />
        <KpiCard
          label="Caja Neta de Hoy"
          value={
            data
              ? `$${data.todaysCash.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "$0.00"
          }
          icon={<DollarSign className="h-5 w-5" />}
          accent="kpi-amber"
          loading={loading}
          hint="Ingresos menos egresos registrados hoy en la caja chica"
        />
        <KpiCard
          label="Alertas de Stock"
          value={data?.stockAlerts ?? 0}
          icon={<AlertTriangle className="h-5 w-5" />}
          accent="kpi-red"
          loading={loading}
          hint="Repuestos o productos en o por debajo del stock mínimo"
        />
      </div>

      {/* Pipeline visualization */}
      <PipelineWidget pipeline={data?.pipeline ?? []} loading={loading} />

      {/* Bottom grid: Recent Orders + Activity Feed + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Orders spans 2 columns on large screens */}
        <div className="lg:col-span-2">
          <RecentOrdersWidget orders={data?.recentOrders ?? []} loading={loading} />
        </div>

        {/* Activity Feed + Quick Actions stacked in third column */}
        <div className="flex flex-col gap-6">
          <ActivityFeedWidget activities={data?.recentActivity ?? []} loading={loading} />
          <QuickActionsWidget />
        </div>
      </div>
    </div>
  )
}
