import { useEffect, useState, useCallback } from "react"
import { useSupabase } from "@/context/SupabaseProvider"
import { Wrench, CheckCircle, DollarSign, AlertTriangle, RefreshCw } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { KpiMetricCard } from "@/components/ui/kpi-metric-card"
import { Button } from "@/components/ui/button"
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
      {/* Universal Page Header */}
      <PageHeader
        title="Panel Operativo del Taller"
        subtitle="Estado de reparaciones en tiempo real, equipos listos y alertas operativas"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboard}
            disabled={loading}
            className="gap-2 rounded-xl border-border/40 bg-background/50 backdrop-blur-md shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </Button>
        }
      />

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm backdrop-blur-md">
          {error}
        </div>
      )}

      {/* Hero Workshop KPIs con KpiMetricCard estandarizada */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiMetricCard
          title="Taller Activo"
          value={data?.activeWorkshop ?? 0}
          icon={<Wrench className="h-5 w-5" />}
          variant="blue"
          pulse
          loading={loading}
          hint="Órdenes de trabajo en curso (excluye entregadas y canceladas)"
        />
        <KpiMetricCard
          title="Listos para Retiro"
          value={data?.readyForPickup ?? 0}
          icon={<CheckCircle className="h-5 w-5" />}
          variant="green"
          pulse
          loading={loading}
          hint="Equipos reparados listos para que el cliente retire"
        />
        <KpiMetricCard
          title="Caja Neta de Hoy"
          value={data?.todaysCash ?? 0}
          isCurrency
          icon={<DollarSign className="h-5 w-5" />}
          variant="amber"
          loading={loading}
          hint="Ingresos menos egresos registrados hoy en la caja chica (en pesos sin centavos)"
        />
        <KpiMetricCard
          title="Alertas de Stock"
          value={data?.stockAlerts ?? 0}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="red"
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

        {/* Activity Feed + Quick Actions */}
        <div className="flex flex-col gap-6">
          <ActivityFeedWidget activities={data?.recentActivity ?? []} loading={loading} />
          <QuickActionsWidget />
        </div>
      </div>
    </div>
  )
}
