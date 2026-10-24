import * as React from "react"
import { GlassCard, type GlassAccent } from "@/components/ui/glass-card"
import { cn } from "@/lib/utils"

export interface ActionTileProps {
  title: string
  description?: string
  icon: React.ReactNode
  accent?: GlassAccent
  badge?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  layout?: "horizontal" | "vertical"
  className?: string
}

const accentIconBg: Record<GlassAccent, string> = {
  blue: "bg-kpi-blue/15 text-kpi-blue border-kpi-blue/30",
  green: "bg-kpi-green/15 text-kpi-green border-kpi-green/30",
  amber: "bg-kpi-amber/15 text-kpi-amber border-kpi-amber/30",
  red: "bg-kpi-red/15 text-kpi-red border-kpi-red/30",
  purple: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  muted: "bg-muted/40 text-muted-foreground border-border/40",
}

export function ActionTile({
  title,
  description,
  icon,
  accent = "blue",
  badge,
  onClick,
  disabled = false,
  layout = "horizontal",
  className,
}: ActionTileProps) {
  const iconStyle = accentIconBg[accent]

  if (layout === "vertical") {
    return (
      <GlassCard
        accent={accent}
        accentStripe
        interactive={!disabled}
        padding="default"
        onClick={disabled ? undefined : onClick}
        className={cn(
          "flex flex-col items-center justify-center text-center gap-2.5 p-4 sm:p-5 select-none",
          disabled && "opacity-50 pointer-events-none",
          className
        )}
      >
        <div className={cn("p-2.5 rounded-xl border flex items-center justify-center shrink-0 shadow-sm", iconStyle)}>
          {icon}
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center justify-center gap-1.5">
            <h4 className="text-xs sm:text-sm font-bold text-foreground">{title}</h4>
            {badge}
          </div>
          {description && (
            <p className="text-[11px] text-muted-foreground line-clamp-1">{description}</p>
          )}
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard
      accent={accent}
      accentStripe
      interactive={!disabled}
      padding="sm"
      onClick={disabled ? undefined : onClick}
      className={cn(
        "flex items-center gap-3 p-3 select-none",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      <div className={cn("p-2 rounded-xl border flex items-center justify-center shrink-0 shadow-sm", iconStyle)}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h4 className="text-xs font-bold text-foreground truncate">{title}</h4>
          {badge}
        </div>
        {description && (
          <p className="text-[10px] text-muted-foreground truncate">{description}</p>
        )}
      </div>
    </GlassCard>
  )
}
