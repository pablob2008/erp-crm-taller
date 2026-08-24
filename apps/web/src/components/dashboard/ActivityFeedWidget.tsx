import { ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import type { ActivityEntry } from "@/lib/services/dashboard"

function relativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} min ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH} h ago`
  const diffD = Math.floor(diffH / 24)
  return `${diffD} d ago`
}

interface ActivityFeedWidgetProps {
  activities: ActivityEntry[]
  loading?: boolean
}

export function ActivityFeedWidget({ activities, loading = false }: ActivityFeedWidgetProps) {
  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-kpi-amber/10 via-kpi-amber/5 to-background border border-kpi-amber/20 shadow-[0_0_30px_0_hsl(var(--kpi-amber)/0.05)] p-6 flex flex-col gap-4 overflow-hidden">
      {/* Ambient background light */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-kpi-amber/20 blur-3xl pointer-events-none -z-10" />

      <h3 className="text-lg font-bold text-foreground">Actividad Reciente</h3>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-background/50 border border-border/40" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay movimientos recientes.</p>
      ) : (
        <div className="grid gap-3">
          {activities.map((activity) => {
            const isIncome = activity.type === "income"
            const shadowClass = isIncome ? 'shadow-[0_0_15px_0_hsl(var(--kpi-green)/0.1)]' : 'shadow-[0_0_15px_0_hsl(var(--kpi-red)/0.1)]'
            const bgClass = isIncome ? 'bg-kpi-green/5' : 'bg-kpi-red/5'
            const borderClass = isIncome ? 'border-kpi-green/30' : 'border-kpi-red/30'
            const dotClass = isIncome ? 'bg-kpi-green' : 'bg-kpi-red'

            return (
              <div 
                key={activity.id} 
                className={`group relative flex items-center gap-3 rounded-xl border ${borderClass} ${bgClass} ${shadowClass} p-3 transition-all duration-200 hover:scale-[1.02] hover:brightness-105 overflow-hidden`}
              >
                {/* Left accent bar */}
                <div className={`absolute left-0 inset-y-0 w-1 ${dotClass} rounded-l-xl`} />
                {/* Shimmer on hover */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="ml-3 shrink-0">
                  {isIncome ? (
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-kpi-green/15 text-kpi-green border border-kpi-green/30`}>
                      <ArrowUpCircle className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-kpi-red/15 text-kpi-red border border-kpi-red/30`}>
                      <ArrowDownCircle className="h-4 w-4" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 pr-4">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {activity.description || activity.category.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-muted-foreground">{relativeTime(activity.created_at)}</p>
                </div>

                <div className={`shrink-0 font-mono font-bold text-sm ${isIncome ? 'text-kpi-green' : 'text-kpi-red'}`}>
                  {isIncome ? "+" : "−"}${Number(activity.net_amount).toLocaleString("es-AR")}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
