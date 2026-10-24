import { Banknote, QrCode, CreditCard, Landmark } from "lucide-react"
import type { TicketState } from "@/lib/services/pos"

interface PaymentMethodSelectorProps {
  value: TicketState["paymentMethod"]
  onChange: (method: TicketState["paymentMethod"]) => void
}

const METHODS: Array<{
  value: TicketState["paymentMethod"]
  label: string
  Icon: React.ElementType
  selectedClass: string
}> = [
  {
    value: "cash",
    label: "Efectivo",
    Icon: Banknote,
    selectedClass:
      "border-kpi-green/50 bg-kpi-green/15 text-kpi-green shadow-[0_0_16px_0_hsl(var(--kpi-green)/0.18)] font-bold",
  },
  {
    value: "qr",
    label: "QR / Billetera",
    Icon: QrCode,
    selectedClass:
      "border-sky-500/50 bg-sky-500/15 text-sky-400 shadow-[0_0_16px_0_hsl(199_89%_48%/0.18)] font-bold",
  },
  {
    value: "card",
    label: "Tarjeta",
    Icon: CreditCard,
    selectedClass:
      "border-purple-500/50 bg-purple-500/15 text-purple-400 shadow-[0_0_16px_0_hsl(270_70%_60%/0.18)] font-bold",
  },
  {
    value: "transfer",
    label: "Transferencia",
    Icon: Landmark,
    selectedClass:
      "border-kpi-blue/50 bg-kpi-blue/15 text-kpi-blue shadow-[0_0_16px_0_hsl(var(--kpi-blue)/0.18)] font-bold",
  },
]

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {METHODS.map(({ value: method, label, Icon, selectedClass }) => {
        const isSelected = value === method
        return (
          <button
            key={method}
            type="button"
            onClick={() => onChange(method)}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border py-3 px-2 text-xs font-semibold transition-all duration-150 select-none ${
              isSelected
                ? selectedClass
                : "border-border/40 bg-background/40 text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-foreground"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
