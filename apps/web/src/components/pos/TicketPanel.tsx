import { ShoppingCart, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TicketItemRow } from "@/components/pos/TicketItemRow"
import { PaymentMethodSelector } from "@/components/pos/PaymentMethodSelector"
import type { TicketState } from "@/lib/services/pos"

interface TicketPanelProps {
  ticketState: TicketState
  subtotal: number
  isCheckingOut: boolean
  onIncrement: (tempId: string) => void
  onDecrement: (tempId: string) => void
  onRemove: (tempId: string) => void
  onSetPaymentMethod: (method: TicketState["paymentMethod"]) => void
  onCheckout: () => void
}

export function TicketPanel({
  ticketState,
  subtotal,
  isCheckingOut,
  onIncrement,
  onDecrement,
  onRemove,
  onSetPaymentMethod,
  onCheckout,
}: TicketPanelProps) {
  const isEmpty = ticketState.items.length === 0

  return (
    <div className="flex flex-col gap-4 lg:sticky lg:top-4">
      {/* Ticket card */}
      <div className="rounded-2xl border border-border/40 bg-background/40 backdrop-blur-md shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
          <Receipt className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Ticket Actual</h3>
          <span className="ml-auto text-xs text-muted-foreground">
            {ticketState.items.length} ítem(s)
          </span>
        </div>

        {/* Item list */}
        <div className="min-h-[120px] max-h-[40vh] overflow-y-auto px-4">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
              <ShoppingCart className="h-10 w-10 opacity-20" />
              <p className="text-sm">El ticket está vacío.</p>
              <p className="text-xs opacity-60">Seleccioná productos del catálogo.</p>
            </div>
          ) : (
            ticketState.items.map((item) => (
              <TicketItemRow
                key={item.tempId}
                item={item}
                onIncrement={() => onIncrement(item.tempId)}
                onDecrement={() => onDecrement(item.tempId)}
                onRemove={() => onRemove(item.tempId)}
              />
            ))
          )}
        </div>

        {/* Subtotal bar */}
        {!isEmpty && (
          <div className="px-4 py-3 border-t border-border/30 flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-medium">Subtotal</span>
            <span className="text-xl font-bold text-foreground tabular-nums">
              ${subtotal.toLocaleString("es-AR")}
            </span>
          </div>
        )}
      </div>

      {/* Work order indicator */}
      {ticketState.workOrderId && (
        <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 text-xs text-primary font-medium">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Orden vinculada — se marcará como entregada al cobrar.
        </div>
      )}

      {/* Payment method selector */}
      <div className="rounded-2xl border border-border/40 bg-background/40 backdrop-blur-md shadow-sm p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Método de Pago
        </p>
        <PaymentMethodSelector
          value={ticketState.paymentMethod}
          onChange={onSetPaymentMethod}
        />
      </div>

      {/* Checkout button */}
      <Button
        size="lg"
        disabled={isEmpty || isCheckingOut}
        onClick={onCheckout}
        className="w-full h-14 text-base font-bold rounded-2xl shadow-sm"
      >
        {isCheckingOut
          ? "Procesando..."
          : `Cobrar $${subtotal.toLocaleString("es-AR")}`}
      </Button>
    </div>
  )
}
