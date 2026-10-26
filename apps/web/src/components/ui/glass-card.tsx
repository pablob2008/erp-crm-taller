import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

export type GlassAccent = "blue" | "green" | "amber" | "red" | "purple" | "muted"

const glassCardVariants = cva(
  "group relative rounded-2xl border border-border/45 bg-background/50 shadow-sm backdrop-blur-md transition-all overflow-hidden",
  {
    variants: {
      variant: {
        default: "",
        subtle: "bg-background/25 border-border/30",
        interactive:
          "cursor-pointer hover:bg-background/70 hover:border-primary/50 hover:shadow-md transition-all duration-150",
        glow: "",
      },
      padding: {
        none: "",
        sm: "p-3 sm:p-4",
        default: "p-4 sm:p-5",
        lg: "p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
    },
  }
)

const accentStyles: Record<
  GlassAccent,
  {
    border: string
    bg: string
    glow: string
    line: string
  }
> = {
  blue: {
    border: "border border-kpi-blue/40 hover:border-kpi-blue/60",
    bg: "bg-kpi-blue/10",
    glow: "shadow-[0_0_24px_0_hsl(var(--kpi-blue)/0.15)]",
    line: "bg-kpi-blue",
  },
  green: {
    border: "border border-kpi-green/40 hover:border-kpi-green/60",
    bg: "bg-kpi-green/10",
    glow: "shadow-[0_0_24px_0_hsl(var(--kpi-green)/0.15)]",
    line: "bg-kpi-green",
  },
  amber: {
    border: "border border-kpi-amber/40 hover:border-kpi-amber/60",
    bg: "bg-kpi-amber/10",
    glow: "shadow-[0_0_24px_0_hsl(var(--kpi-amber)/0.15)]",
    line: "bg-kpi-amber",
  },
  red: {
    border: "border border-kpi-red/40 hover:border-kpi-red/60",
    bg: "bg-kpi-red/10",
    glow: "shadow-[0_0_24px_0_hsl(var(--kpi-red)/0.15)]",
    line: "bg-kpi-red",
  },
  purple: {
    border: "border border-purple-500/40 hover:border-purple-500/60",
    bg: "bg-purple-500/10",
    glow: "shadow-[0_0_24px_0_hsl(270_70%_60%/0.15)]",
    line: "bg-purple-500",
  },
  muted: {
    border: "border border-border/45 hover:border-border/70",
    bg: "bg-muted/30",
    glow: "shadow-sm",
    line: "bg-muted-foreground",
  },
}

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {
  accent?: GlassAccent
  /** Muestra una línea de acento vertical en el borde izquierdo */
  accentStripe?: boolean
  /** Muestra un reflejo de luz superior en hover */
  shimmer?: boolean
  /** Atajo para hacer la tarjeta interactiva con hover zoom y cursor pointer */
  interactive?: boolean
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      className,
      variant,
      padding,
      accent,
      accentStripe = false,
      shimmer,
      interactive = false,
      children,
      ...props
    },
    ref
  ) => {
    const isGlow = variant === "glow" || !!accent
    const accentConfig = accent ? accentStyles[accent] : null
    const effectiveVariant = interactive ? "interactive" : variant
    const showShimmer =
      shimmer !== undefined
        ? shimmer
        : Boolean(accent || interactive || props.onClick)

    return (
      <div
        ref={ref}
        className={cn(
          glassCardVariants({ variant: effectiveVariant, padding }),
          accentConfig && isGlow && `${accentConfig.border} ${accentConfig.bg} ${accentConfig.glow}`,
          className
        )}
        {...props}
      >
        {/* Stripe vertical izquierdo de acento */}
        {accentStripe && accentConfig && (
          <div className={cn("absolute left-0 inset-y-0 w-1 rounded-l-2xl", accentConfig.line)} />
        )}

        {/* Reflejo de luz superior en hover */}
        {showShimmer && (
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        )}

        {children}
      </div>
    )
  }
)
GlassCard.displayName = "GlassCard"

const GlassCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 pb-3 border-b border-border/30", className)}
      {...props}
    />
  )
)
GlassCardHeader.displayName = "GlassCardHeader"

const GlassCardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-base font-semibold leading-none tracking-tight text-foreground", className)}
      {...props}
    />
  )
)
GlassCardTitle.displayName = "GlassCardTitle"

const GlassCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-xs text-muted-foreground", className)} {...props} />
))
GlassCardDescription.displayName = "GlassCardDescription"

const GlassCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("pt-3", className)} {...props} />
)
GlassCardContent.displayName = "GlassCardContent"

const GlassCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center pt-3 border-t border-border/30", className)}
      {...props}
    />
  )
)
GlassCardFooter.displayName = "GlassCardFooter"

export {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  GlassCardFooter,
}
