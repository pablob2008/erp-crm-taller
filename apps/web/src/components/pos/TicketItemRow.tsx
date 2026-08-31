import { Minus, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { TicketItem } from "@/lib/services/pos"

interface TicketItemRowProps {
  item: TicketItem
  onIncrement: () => void
  onDecrement: () => void
  onRemove: () => void
}

export function TicketItemRow({ item, onIncrement, onDecrement, onRemove }: TicketItemRowProps) {
  const lineTotal = item.quantity * item.unitPrice

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0">
      {/* Item info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-tight truncate">
          {item.description}
        </p>
        <p className="text-xs text-muted-foreground">
          ${Number(item.unitPrice).toLocaleString("es-AR")} c/u
        </p>
      </div>

      {/* Qty controls */}
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-background/60"
          onClick={onDecrement}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="w-6 text-center text-sm font-bold tabular-nums">
          {item.quantity}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-background/60"
          onClick={onIncrement}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Line total */}
      <span className="text-sm font-bold text-foreground tabular-nums w-20 text-right shrink-0">
        ${lineTotal.toLocaleString("es-AR")}
      </span>

      {/* Remove */}
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
        onClick={onRemove}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
