import * as React from "react"
import { Banknote, CreditCard, Landmark, QrCode, HelpCircle } from "lucide-react"
import { getPaymentMethodConfig } from "@/lib/constants/payment-methods"
import { cn } from "@/lib/utils"

export interface PaymentMethodBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  method: string | null | undefined
  showIcon?: boolean
  variant?: "badge" | "inline"
}

export function PaymentMethodBadge({
  method,
  showIcon = true,
  variant = "badge",
  className,
  ...props
}: PaymentMethodBadgeProps) {
  const config = getPaymentMethodConfig(method)

  const Icon = (() => {
    switch (method) {
      case "cash":
        return Banknote
      case "card":
        return CreditCard
      case "transfer":
        return Landmark
      case "qr":
        return QrCode
      default:
        return HelpCircle
    }
  })()

  if (variant === "inline") {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)} {...props}>
        {showIcon && <Icon className="h-3.5 w-3.5 opacity-70 shrink-0" />}
        <span>{config.label}</span>
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border border-border/40 bg-background/50 shadow-sm backdrop-blur-sm",
        className
      )}
      {...props}
    >
      {showIcon && <Icon className={cn("h-3 w-3 shrink-0", config.color)} />}
      <span className="text-foreground">{config.label}</span>
    </span>
  )
}
