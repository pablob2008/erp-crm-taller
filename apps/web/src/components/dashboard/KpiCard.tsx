import type { ReactNode } from "react"

// Allowed accent color tokens from the design system
export type KpiAccent = "kpi-blue" | "kpi-green" | "kpi-amber" | "kpi-red"

interface KpiCardProps {
  label: string
  value: string | number
  icon: ReactNode
  accent: KpiAccent
  loading?: boolean
  /** Optional tooltip text shown in a title attribute on the card */
  hint?: string
}

// Map accent token name → comprehensive styling (background tint, border, ambient glow, icon badge)
const accentConfig: Record<
  KpiAccent,
  {
    card: string
    border: string
    glow: string
    iconBg: string
    iconColor: string
    labelColor: string
  }
> = {
  "kpi-blue": {
    card: "bg-gradient-to-br from-kpi-blue/15 via-kpi-blue/5 to-background/90",
    border: "border border-kpi-blue/30 hover:border-kpi-blue/50",
    glow: "bg-kpi-blue/20",
    iconBg: "bg-kpi-blue/20 ring-1 ring-kpi-blue/40 shadow-sm",
    iconColor: "text-kpi-blue",
    labelColor: "text-kpi-blue/90 dark:text-kpi-blue/80",
  },
  "kpi-green": {
    card: "bg-gradient-to-br from-kpi-green/15 via-kpi-green/5 to-background/90",
    border: "border border-kpi-green/30 hover:border-kpi-green/50",
    glow: "bg-kpi-green/20",
    iconBg: "bg-kpi-green/20 ring-1 ring-kpi-green/40 shadow-sm",
    iconColor: "text-kpi-green",
    labelColor: "text-kpi-green/90 dark:text-kpi-green/80",
  },
  "kpi-amber": {
    card: "bg-gradient-to-br from-kpi-amber/15 via-kpi-amber/5 to-background/90",
    border: "border border-kpi-amber/30 hover:border-kpi-amber/50",
    glow: "bg-kpi-amber/20",
    iconBg: "bg-kpi-amber/20 ring-1 ring-kpi-amber/40 shadow-sm",
    iconColor: "text-kpi-amber",
    labelColor: "text-kpi-amber/90 dark:text-kpi-amber/80",
  },
  "kpi-red": {
    card: "bg-gradient-to-br from-kpi-red/15 via-kpi-red/5 to-background/90",
    border: "border border-kpi-red/30 hover:border-kpi-red/50",
    glow: "bg-kpi-red/20",
    iconBg: "bg-kpi-red/20 ring-1 ring-kpi-red/40 shadow-sm",
    iconColor: "text-kpi-red",
    labelColor: "text-kpi-red/90 dark:text-kpi-red/80",
  },
}

export function KpiCard({ label, value, icon, accent, loading = false, hint }: KpiCardProps) {
  const config = accentConfig[accent]

  return (
    <div
      className={`relative overflow-hidden rounded-xl p-5 shadow-sm border border-border/40 backdrop-blur-md transition-all duration-200 ${config.card} ${config.border}`}
      title={hint}
    >
      {/* Ambient background light in corner */}
      <div
        className={`absolute -right-6 -bottom-6 h-28 w-28 rounded-full ${config.glow} blur-2xl pointer-events-none`}
        aria-hidden="true"
      />

      <div className="relative flex items-center gap-4">
        {/* Icon with frosted/tinted badge container */}
        <div className={`shrink-0 rounded-xl p-3 ${config.iconBg} ${config.iconColor}`}>
          {icon}
        </div>

        {/* Text area */}
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-semibold uppercase tracking-wider ${config.labelColor} truncate`}>
            {label}
          </p>
          {loading ? (
            <div className="mt-1 h-8 w-20 animate-pulse rounded bg-muted" />
          ) : (
            <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-none">
              {value}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
