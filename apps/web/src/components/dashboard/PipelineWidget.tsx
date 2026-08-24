import type { PipelineEntry } from "@/lib/services/dashboard"

// Status display configuration
const STATUS_CONFIG: Record<string, { label: string; colorClass: string }> = {
  quotation: { label: "Cotización", colorClass: "bg-kpi-amber" },
  received: { label: "Recibido", colorClass: "bg-kpi-blue" },
  waiting_client: { label: "Esperando Cliente", colorClass: "bg-kpi-amber" },
  waiting_parts: { label: "Esperando Repuesto", colorClass: "bg-kpi-red" },
  ready_for_pickup: { label: "Listo", colorClass: "bg-kpi-green" },
}

// Fallback for any unknown status
const FALLBACK_CONFIG = { label: "Other", colorClass: "bg-muted-foreground" }

interface PipelineWidgetProps {
  pipeline: PipelineEntry[]
  loading?: boolean
}

export function PipelineWidget({ pipeline, loading = false }: PipelineWidgetProps) {
  const total = pipeline.reduce((acc, e) => acc + e.count, 0)

  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-kpi-blue/10 via-background/40 to-background border border-kpi-blue/20 shadow-[0_0_30px_0_hsl(var(--kpi-blue)/0.05)] p-6 backdrop-blur-md overflow-hidden">
      {/* Ambient background light */}
      <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-kpi-blue/20 blur-3xl pointer-events-none -z-10" />

      <h3 className="text-lg font-bold text-foreground mb-4">Pipeline de Órdenes</h3>

      {loading || pipeline.length === 0 ? (
        <div>
          {loading ? (
            <div className="h-6 w-full animate-pulse rounded bg-muted" />
          ) : (
            <p className="text-xs text-muted-foreground">No hay órdenes activas en el pipeline.</p>
          )}
        </div>
      ) : (
        <>
          {/* Stacked bar */}
          <div className="flex h-6 w-full overflow-hidden rounded-full gap-0.5 border border-border/40 shadow-sm">
            {pipeline.map((entry) => {
              const config = STATUS_CONFIG[entry.status] ?? FALLBACK_CONFIG
              const pct = total > 0 ? (entry.count / total) * 100 : 0
              return (
                <div
                  key={entry.status}
                  className={`${config.colorClass} transition-all`}
                  // Enforce min-width of 4px per segment per design decision
                  style={{ width: `max(4px, ${pct.toFixed(2)}%)` }}
                  title={`${config.label}: ${entry.count}`}
                />
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-2 mt-4 bg-background/50 rounded-xl p-3 border border-border/40 shadow-sm">
            {pipeline.map((entry) => {
              const config = STATUS_CONFIG[entry.status] ?? FALLBACK_CONFIG
              return (
                <div key={entry.status} className="flex items-center gap-1.5 text-xs">
                  <span className={`inline-block h-2.5 w-2.5 rounded-sm ${config.colorClass} shadow-sm`} />
                  <span className="text-muted-foreground font-medium">{config.label}</span>
                  <span className="font-bold text-foreground">{entry.count}</span>
                </div>
              )
            })}
            <div className="flex items-center gap-1.5 text-xs ml-auto border-l border-border/40 pl-4">
              <span className="text-muted-foreground font-medium">Total</span>
              <span className="font-bold text-foreground text-sm">{total}</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
