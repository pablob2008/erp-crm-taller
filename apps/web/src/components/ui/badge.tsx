import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-destructive/30 bg-destructive/10 text-destructive shadow-sm hover:bg-destructive/20",
        outline:
          "border-border/40 bg-background/50 text-foreground shadow-sm hover:bg-accent",
        success:
          "border-kpi-green/30 bg-kpi-green/10 text-kpi-green shadow-sm hover:bg-kpi-green/20",
        warning:
          "border-kpi-amber/30 bg-kpi-amber/10 text-kpi-amber shadow-sm hover:bg-kpi-amber/20",
        info:
          "border-kpi-blue/30 bg-kpi-blue/10 text-kpi-blue shadow-sm hover:bg-kpi-blue/20",
        purple:
          "border-purple-500/30 bg-purple-500/10 text-purple-400 shadow-sm hover:bg-purple-500/20",
        muted:
          "border-border/40 bg-muted/40 text-muted-foreground shadow-sm",
      },
      size: {
        default: "text-xs px-2.5 py-0.5",
        sm: "text-[10px] px-2 py-0.5 leading-tight",
        lg: "text-sm px-3.5 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
