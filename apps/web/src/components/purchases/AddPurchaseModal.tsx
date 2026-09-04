import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface AddPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: { title: string; quantity: number; estimatedCost: number; supplier?: string }) => Promise<void>
}

export function AddPurchaseModal({ isOpen, onClose, onConfirm }: AddPurchaseModalProps) {
  const [title, setTitle] = useState("")
  const [quantity, setQuantity] = useState<number>(1)
  const [estimatedCost, setEstimatedCost] = useState<number>(0)
  const [supplier, setSupplier] = useState("")
  const [loading, setLoading] = useState(false)

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
      setTitle("")
      setQuantity(1)
      setEstimatedCost(0)
      setSupplier("")
    }
  }

  const handleConfirm = async () => {
    if (!title.trim()) return
    setLoading(true)
    try {
      await onConfirm({
        title: title.trim(),
        quantity,
        estimatedCost,
        supplier: supplier.trim() || undefined,
      })
      handleOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Nueva Compra Manual</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="purchase-title">Título / Descripción <span className="text-red-500">*</span></Label>
            <Input
              id="purchase-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Aceite de motor 5W-30"
              className="shadow-neu-inset bg-background/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="purchase-quantity">Cantidad</Label>
              <Input
                id="purchase-quantity"
                type="number"
                min="1"
                value={quantity === 0 ? "" : quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="shadow-neu-inset bg-background/50"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="purchase-cost">Costo Est. ($)</Label>
              <Input
                id="purchase-cost"
                type="number"
                step="0.01"
                min="0"
                value={estimatedCost === 0 ? "" : estimatedCost}
                placeholder="0.00"
                onChange={(e) => setEstimatedCost(Number(e.target.value))}
                className="shadow-neu-inset bg-background/50"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="purchase-supplier">Proveedor (Opcional)</Label>
            <Input
              id="purchase-supplier"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Ej. Repuestos Pepe"
              className="shadow-neu-inset bg-background/50"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading || !title.trim()}>
            {loading ? "Guardando..." : "Crear Compra"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
