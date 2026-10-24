import * as React from "react"
import { cn } from "@/lib/utils"

export type GlassIconButtonVariant = "default" | "success" | "info" | "destructive" | "warning"

export interface GlassIconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode
  variant?: GlassIconButtonVariant
  size?: "sm" | "default" | "lg"
  /** Muestra un punto indicador de alerta en la esquina superior */
  badgeDot?: boolean | "red" | "green" | "blue"
}

const variantClasses: Record<GlassIconButtonVariant, string> = {
  default:
    "text-muted-foreground bg-background/50 border-border/40 hover:text-foreground hover:bg-background/80",
  success:
    "text-kpi-green bg-kpi-green/15 border-kpi-green/30 hover:bg-kpi-green/25 shadow-[0_0_12px_0_hsl(var(--kpi-green)/0.12)]",
  info:
    "text-kpi-blue bg-kpi-blue/15 border-kpi-blue/30 hover:bg-kpi-blue/25 shadow-[0_0_12px_0_hsl(var(--kpi-blue)/0.12)]",
  destructive:
    "text-kpi-red bg-kpi-red/15 border-kpi-red/30 hover:bg-kpi-red/25 shadow-[0_0_12px_0_hsl(var(--kpi-red)/0.12)]",
  warning:
    "text-kpi-amber bg-kpi-amber/15 border-kpi-amber/30 hover:bg-kpi-amber/25 shadow-[0_0_12px_0_hsl(var(--kpi-amber)/0.12)]",
}

const dotColorClasses: Record<string, string> = {
  red: "bg-kpi-red shadow-[0_0_8px_0_hsl(var(--kpi-red)/0.8)]",
  green: "bg-kpi-green shadow-[0_0_8px_0_hsl(var(--kpi-green)/0.8)]",
  blue: "bg-kpi-blue shadow-[0_0_8px_0_hsl(var(--kpi-blue)/0.8)]",
}

export const GlassIconButton = React.forwardRef<HTMLButtonElement, GlassIconButtonProps>(
  (
    {
      icon,
      variant = "default",
      size = "default",
      badgeDot = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "w-8 h-8",
      default: "w-9 h-9",
      lg: "w-10 h-10",
    }[size]

    const dotColor = typeof badgeDot === "string" ? dotColorClasses[badgeDot] : dotColorClasses.red

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={cn(
          "relative flex items-center justify-center rounded-full border backdrop-blur-md shadow-sm transition-all duration-150 select-none",
          "hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none disabled:transform-none",
          sizeClasses,
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {icon}
        {badgeDot && (
          <span
            className={cn(
              "absolute right-0.5 top-0.5 flex h-2 w-2 rounded-full animate-pulse",
              dotColor
            )}
          />
        )}
      </button>
    )
  }
)
GlassIconButton.displayName = "GlassIconButton"
