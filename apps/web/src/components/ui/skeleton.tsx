import * as React from "react"
import { cn } from "@/lib/utils"

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Activa o desactiva la animación de brillo de luz (shimmer) */
  shimmer?: boolean
}

export function Skeleton({
  className,
  shimmer = true,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-muted/30 border border-border/20 backdrop-blur-sm",
        shimmer &&
          "before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/30 dark:before:via-white/10 before:to-transparent",
        className
      )}
      {...props}
    />
  )
}

/**
 * Esqueleto con la silueta de una tarjeta de orden o cliente.
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-border/30 bg-background/40 p-4 backdrop-blur-md shadow-sm space-y-3 overflow-hidden",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/20 dark:before:via-white/10 before:to-transparent",
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="h-4 w-28 rounded-lg bg-muted/50" />
        <div className="h-5 w-20 rounded-full bg-muted/40" />
      </div>
      <div className="space-y-1.5">
        <div className="h-4 w-44 rounded-lg bg-muted/60" />
        <div className="h-3 w-60 rounded-lg bg-muted/40" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border/20">
        <div className="h-4 w-24 rounded-lg bg-muted/40" />
        <div className="h-7 w-20 rounded-xl bg-muted/50" />
      </div>
    </div>
  )
}

/**
 * Esqueleto con la silueta de una fila de tabla.
 */
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="animate-pulse border-b border-border/20">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <div className="h-4 w-full max-w-[120px] rounded-lg bg-muted/40" />
        </td>
      ))}
    </tr>
  )
}
