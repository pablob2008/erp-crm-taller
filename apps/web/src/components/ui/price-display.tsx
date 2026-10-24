import * as React from "react"
import { formatPrice, formatPriceFiscal } from "@/lib/formatters"
import { cn } from "@/lib/utils"

export interface PriceDisplayProps extends React.HTMLAttributes<HTMLSpanElement> {
  amount: number | null | undefined
  variant?: "neutral" | "income" | "expense" | "debt"
  size?: "xs" | "sm" | "default" | "lg" | "xl" | "2xl"
  /** Si es true, muestra el signo + explícito para ingresos */
  showSign?: boolean
  /** Si es true, muestra formato fiscal con centavos ($10.000,00) */
  fiscal?: boolean
}

export function PriceDisplay({
  amount,
  variant = "neutral",
  size = "default",
  showSign = false,
  fiscal = false,
  className,
  ...props
}: PriceDisplayProps) {
  const value = amount ?? 0
  const formatted = fiscal ? formatPriceFiscal(value) : formatPrice(value)

  const variantClasses = {
    neutral: "text-foreground",
    income: "text-kpi-green",
    expense: "text-kpi-red",
    debt: value > 0 ? "text-kpi-amber" : "text-kpi-green",
  }[variant]

  const sizeClasses = {
    xs: "text-xs font-medium",
    sm: "text-xs font-semibold",
    default: "text-sm font-semibold",
    lg: "text-lg font-bold",
    xl: "text-xl sm:text-2xl font-bold",
    "2xl": "text-2xl sm:text-3xl font-extrabold",
  }[size]

  let displayText = formatted
  if (showSign && variant === "income" && value > 0) {
    displayText = `+${formatted}`
  }

  return (
    <span
      className={cn("font-mono tabular-nums tracking-tight select-all", variantClasses, sizeClasses, className)}
      {...props}
    >
      {displayText}
    </span>
  )
}
