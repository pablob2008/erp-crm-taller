import * as React from "react"
import { cn } from "@/lib/utils"

export type SegmentedAccent = "default" | "blue" | "green" | "purple" | "amber" | "red"

export interface SegmentedOption<T extends string = string> {
  value: T
  label: string
  icon?: React.ReactNode
  badge?: React.ReactNode
  accent?: SegmentedAccent
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  size?: "sm" | "default" | "lg"
  fullWidth?: boolean
  className?: string
}

const accentActiveClasses: Record<SegmentedAccent, string> = {
  default: "bg-primary text-primary-foreground shadow-sm",
  blue: "bg-kpi-blue/15 text-kpi-blue border border-kpi-blue/30 shadow-[0_0_12px_0_hsl(var(--kpi-blue)/0.15)] font-bold",
  green: "bg-kpi-green/15 text-kpi-green border border-kpi-green/30 shadow-[0_0_12px_0_hsl(var(--kpi-green)/0.15)] font-bold",
  purple: "bg-purple-500/15 text-purple-400 border border-purple-500/30 shadow-[0_0_12px_0_hsl(270_70%_60%/0.15)] font-bold",
  amber: "bg-kpi-amber/15 text-kpi-amber border border-kpi-amber/30 shadow-[0_0_12px_0_hsl(var(--kpi-amber)/0.15)] font-bold",
  red: "bg-kpi-red/15 text-kpi-red border border-kpi-red/30 shadow-[0_0_12px_0_hsl(var(--kpi-red)/0.15)] font-bold",
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = "default",
  fullWidth = false,
  className,
}: SegmentedControlProps<T>) {
  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs gap-1.5 rounded-lg",
    default: "px-3.5 py-1.5 text-xs font-semibold gap-2 rounded-xl",
    lg: "px-4 py-2 text-sm font-semibold gap-2.5 rounded-xl",
  }[size]

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-2xl bg-background/50 border border-border/40 backdrop-blur-md p-1 shadow-sm select-none",
        fullWidth ? "w-full flex" : "w-fit",
        className
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value
        const accent = option.accent || "default"

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "flex items-center justify-center transition-all duration-150",
              sizeClasses,
              fullWidth ? "flex-1" : "",
              isActive
                ? accentActiveClasses[accent]
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground border border-transparent"
            )}
          >
            {option.icon && (
              <span className="shrink-0 opacity-80">{option.icon}</span>
            )}
            <span>{option.label}</span>
            {option.badge && (
              <span className="ml-1 shrink-0">{option.badge}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
