import { Banknote, QrCode, CreditCard } from "lucide-react"
import type { TicketState } from "@/lib/services/pos"

interface PaymentMethodSelectorProps {
  value: TicketState["paymentMethod"]
  onChange: (method: TicketState["paymentMethod"]) => void
}

const METHODS: Array<{
  value: TicketState["paymentMethod"]
  label: string
  Icon: React.ElementType
}> = [
  { value: "cash", label: "Efectivo", Icon: Banknote },
  { value: "qr", label: "QR / Billetera", Icon: QrCode },
  { value: "card", label: "Tarjeta", Icon: CreditCard },
]

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {METHODS.map(({ value: method, label, Icon }) => {
        const isSelected = value === method
        return (
          <button
            key={method}
            onClick={() => onChange(method)}
            className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 px-2 text-xs font-semibold transition-all ${
              isSelected
                ? "border-primary/60 bg-primary/10 text-primary shadow-sm"
                : "border-border/40 bg-background/40 text-muted-foreground hover:border-primary/30 hover:bg-primary/5"
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        )
      })}
    </div>
  )
}
