import * as React from "react"
import { formatPrice } from "@/lib/formatters"
import { cn } from "@/lib/utils"

export type KpiMetricVariant = "blue" | "green" | "amber" | "red" | "purple"

const variantStyles: Record<
  KpiMetricVariant,
  {
    card: string
    border: string
    glow: string
    line: string
    iconBg: string
    iconColor: string
    labelColor: string
    valueColor: string
  }
> = {
  blue: {
    card: "bg-kpi-blue/10",
    border: "border-kpi-blue/30 hover:border-kpi-blue/50",
    glow: "shadow-[0_0_24px_0_hsl(var(--kpi-blue)/0.12)]",
    line: "bg-kpi-blue",
    iconBg: "bg-kpi-blue/15 border-kpi-blue/30",
    iconColor: "text-kpi-blue",
    labelColor: "text-kpi-blue",
    valueColor: "text-foreground",
  },
  green: {
    card: "bg-kpi-green/10",
    border: "border-kpi-green/30 hover:border-kpi-green/50",
    glow: "shadow-[0_0_24px_0_hsl(var(--kpi-green)/0.12)]",
    line: "bg-kpi-green",
    iconBg: "bg-kpi-green/15 border-kpi-green/30",
    iconColor: "text-kpi-green",
    labelColor: "text-kpi-green",
    valueColor: "text-kpi-green",
  },
  amber: {
    card: "bg-kpi-amber/10",
    border: "border-kpi-amber/30 hover:border-kpi-amber/50",
    glow: "shadow-[0_0_24px_0_hsl(var(--kpi-amber)/0.12)]",
    line: "bg-kpi-amber",
    iconBg: "bg-kpi-amber/15 border-kpi-amber/30",
    iconColor: "text-kpi-amber",
    labelColor: "text-kpi-amber",
    valueColor: "text-foreground",
  },
  red: {
    card: "bg-kpi-red/10",
    border: "border-kpi-red/30 hover:border-kpi-red/50",
    glow: "shadow-[0_0_24px_0_hsl(var(--kpi-red)/0.12)]",
    line: "bg-kpi-red",
    iconBg: "bg-kpi-red/15 border-kpi-red/30",
    iconColor: "text-kpi-red",
    labelColor: "text-kpi-red",
    valueColor: "text-kpi-red",
  },
  purple: {
    card: "bg-purple-500/10",
    border: "border-purple-500/30 hover:border-purple-500/50",
    glow: "shadow-[0_0_24px_0_hsl(270_70%_60%/0.12)]",
    line: "bg-purple-500",
    iconBg: "bg-purple-500/15 border-purple-500/30",
    iconColor: "text-purple-400",
    labelColor: "text-purple-400",
    valueColor: "text-foreground",
  },
}

export interface KpiMetricCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  variant?: KpiMetricVariant
  /** Si es true, y value es un número, lo formatea con formatPrice ("$10.000") */
  isCurrency?: boolean
  pulse?: boolean
  loading?: boolean
  hint?: string
  trend?: {
    value: string | number
    isPositive?: boolean
    label?: string
  }
  className?: string
  onClick?: () => void
}

export function KpiMetricCard({
  title,
  value,
  icon,
  variant = "blue",
  isCurrency = false,
  pulse = false,
  loading = false,
  hint,
  trend,
  className,
  onClick,
}: KpiMetricCardProps) {
  const config = variantStyles[variant]

  const displayValue = React.useMemo(() => {
    if (loading) return "—"
    if (typeof value === "number") {
      return isCurrency ? formatPrice(value) : value.toLocaleString("es-AR")
    }
    return value
  }, [value, isCurrency, loading])

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl p-5 overflow-hidden border backdrop-blur-md transition-all duration-200 select-none",
        config.card,
        config.border,
        config.glow,
        onClick ? "cursor-pointer hover:scale-[1.01] active:scale-[0.99]" : "hover:brightness-105",
        className
      )}
      title={hint}
    >
      {/* Stripe vertical izquierdo de acento */}
      <div className={cn("absolute left-0 inset-y-0 w-1 rounded-l-2xl", config.line)} />

      {/* Brillo superior en hover */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Cabecera de la métrica */}
      <div className="relative flex items-center justify-between mb-3 pl-2">
        <div className="flex items-center gap-2">
          {pulse && <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", config.line)} />}
          <h3 className={cn("text-xs font-semibold uppercase tracking-wider", config.labelColor)}>
            {title}
          </h3>
        </div>

        <div
          className={cn(
            "p-2 rounded-xl border flex items-center justify-center shrink-0 shadow-sm",
            config.iconBg,
            config.iconColor
          )}
        >
          {icon}
        </div>
      </div>

      {/* Valor numérico principal */}
      <div className="relative pl-2">
        {loading ? (
          <div className="h-8 w-28 rounded-lg bg-muted/40 animate-pulse my-1" />
        ) : (
          <span className={cn("font-mono font-bold text-2xl sm:text-3xl tracking-tight", config.valueColor)}>
            {displayValue}
          </span>
        )}

        {/* Tendencia / etiqueta secundaria */}
        {trend && !loading && (
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <span className={trend.isPositive ? "text-kpi-green font-semibold" : "text-kpi-red font-semibold"}>
              {trend.isPositive ? "▲" : "▼"} {trend.value}
            </span>
            {trend.label && <span>{trend.label}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
