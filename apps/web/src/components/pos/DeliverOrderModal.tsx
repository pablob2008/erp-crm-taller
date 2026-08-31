import { useState } from "react"
import { Search, Loader2, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSupabase } from "@/context/SupabaseProvider"
import { searchOrderByNumber } from "@/lib/services/pos"
import type { OrderSearchResult } from "@/lib/services/pos"

interface DeliverOrderModalProps {
  open: boolean
  branchId: string
  onClose: () => void
  onConfirm: (order: OrderSearchResult) => void
}

export function DeliverOrderModal({ open, branchId, onClose, onConfirm }: DeliverOrderModalProps) {
  const { supabase } = useSupabase()
  const [orderNumber, setOrderNumber] = useState("")
  const [searching, setSearching] = useState(false)
  const [result, setResult] = useState<OrderSearchResult | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!orderNumber.trim()) return
    setSearching(true)
    setResult(null)
    setNotFound(false)
    setError(null)
    try {
      const found = await searchOrderByNumber(supabase, branchId, orderNumber.trim())
      if (found) {
        setResult(found)
      } else {
        setNotFound(true)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al buscar la orden.")
    } finally {
      setSearching(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch()
  }

  const handleConfirm = () => {
    if (!result) return
    onConfirm(result)
    handleClose()
  }

  const handleClose = () => {
    setOrderNumber("")
    setResult(null)
    setNotFound(false)
    setError(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Entregar Orden</DialogTitle>
          <DialogDescription>
            Buscá una orden por número para agregarla al ticket y cobrar el saldo pendiente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Número de Orden</Label>
            <div className="flex gap-2">
              <Input
                placeholder="ORD-001"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              <Button onClick={handleSearch} disabled={searching || !orderNumber.trim()} size="icon" className="shrink-0">
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {notFound && !error && (
            <p className="text-sm text-muted-foreground text-center py-2">
              No se encontró ninguna orden con ese número (o ya fue entregada/cancelada).
            </p>
          )}

          {result && (
            <div className="rounded-xl border border-border/40 bg-background/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  #{result.order_number}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium capitalize">
                  {result.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{result.customer_name}</p>
              <div className="pt-1 border-t border-border/30">
                <span className="text-xs text-muted-foreground">Saldo pendiente: </span>
                <span className={`text-lg font-bold ${result.balance > 0 ? "text-destructive" : "text-primary"}`}>
                  ${result.balance.toLocaleString("es-AR")}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={!result}>
            Agregar al Ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
