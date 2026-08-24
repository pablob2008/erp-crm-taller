import { useEffect, useState } from "react"
import { useSupabase } from "@/context/SupabaseProvider"
import { Wrench, CheckCircle, DollarSign, AlertTriangle } from "lucide-react"
import { KpiCard } from "@/components/dashboard/KpiCard"
import { PipelineWidget } from "@/components/dashboard/PipelineWidget"
import { RecentOrdersWidget } from "@/components/dashboard/RecentOrdersWidget"
import { ActivityFeedWidget } from "@/components/dashboard/ActivityFeedWidget"
import { QuickActionsWidget } from "@/components/dashboard/QuickActionsWidget"
import { fetchDashboardData } from "@/lib/services/dashboard"
import type { DashboardData } from "@/lib/services/dashboard"

export default function DashboardPage() {
  const { supabase, profile } = useSupabase()

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Wait until the profile (and its branch_id) is available
    if (!profile?.branch_id) return

    async function loadDashboard() {
      setLoading(true)
      setError(null)
      try {
        const result = await fetchDashboardData(supabase, profile!.branch_id!)
        setData(result)
      } catch (err) {
        console.error("Error loading dashboard:", err)
        setError("Failed to load dashboard data. Please refresh the page.")
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [supabase, profile])

  return (
    <>
      {/* Page header */}
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Hero KPI row — 4 columns */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Active Workshop"
          value={data?.activeWorkshop ?? 0}
          icon={<Wrench className="h-6 w-6" />}
          accent="kpi-blue"
          loading={loading}
          hint="Work orders currently in progress (excludes delivered & cancelled)"
        />
        <KpiCard
          label="Ready for Pickup"
          value={data?.readyForPickup ?? 0}
          icon={<CheckCircle className="h-6 w-6" />}
          accent="kpi-green"
          loading={loading}
          hint="Orders ready and waiting for customer pickup"
        />
        <KpiCard
          label="Today's Cash"
          value={
            data
              ? `$${data.todaysCash.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
              : "$0"
          }
          icon={<DollarSign className="h-6 w-6" />}
          accent="kpi-amber"
          loading={loading}
          hint="Net cash today (income minus expenses)"
        />
        <KpiCard
          label="Stock Alerts"
          value={data?.stockAlerts ?? 0}
          icon={<AlertTriangle className="h-6 w-6" />}
          accent="kpi-red"
          loading={loading}
          hint="Inventory items at or below their minimum stock threshold"
        />
      </div>

      {/* Pipeline visualization */}
      <div className="mt-4">
        <PipelineWidget pipeline={data?.pipeline ?? []} loading={loading} />
      </div>

      {/* Bottom grid: Recent Orders + Activity Feed + Quick Actions */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Recent Orders spans 2 columns on large screens */}
        <div className="lg:col-span-2">
          <RecentOrdersWidget orders={data?.recentOrders ?? []} loading={loading} />
        </div>

        {/* Activity Feed + Quick Actions stacked in the third column */}
        <div className="flex flex-col gap-4">
          <ActivityFeedWidget activities={data?.recentActivity ?? []} loading={loading} />
          <QuickActionsWidget />
        </div>
      </div>
    </>
  )
}
