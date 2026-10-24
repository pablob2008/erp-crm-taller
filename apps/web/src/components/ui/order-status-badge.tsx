import * as React from "react"
import { getOrderStatusConfig } from "@/lib/constants/order-status"
import { cn } from "@/lib/utils"

export interface OrderStatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: string | null | undefined
  size?: "sm" | "default" | "lg"
  showDot?: boolean
  showPulse?: boolean
}

export function OrderStatusBadge({
  status,
  size = "default",
  showDot = true,
  showPulse = true,
  className,
  ...props
}: OrderStatusBadgeProps) {
  const config = getOrderStatusConfig(status)

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    default: "px-2.5 py-0.5 text-xs gap-1.5",
    lg: "px-3.5 py-1 text-sm gap-2 font-bold",
  }[size]

  const dotSizeClasses = {
    sm: "w-1 h-1",
    default: "w-1.5 h-1.5",
    lg: "w-2 h-2",
  }[size]

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold border transition-all select-none",
        config.bg,
        config.border,
        config.text,
        config.glow,
        sizeClasses,
        className
      )}
      {...props}
    >
      {showDot && (
        <span
          className={cn(
            "rounded-full shrink-0",
            dotSizeClasses,
            config.dot,
            config.pulse && showPulse && "animate-pulse"
          )}
        />
      )}
      <span>{config.label}</span>
    </span>
  )
}
