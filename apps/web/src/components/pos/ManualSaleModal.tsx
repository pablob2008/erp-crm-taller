import { useState } from "react"
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

interface ManualSaleModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (description: string, unitPrice: number) => void
}

export function ManualSaleModal({ open, onClose, onConfirm }: ManualSaleModalProps) {
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState<number | "">("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!description.trim()) e.description = "La descripción es obligatoria."
    if (!price || Number(price) <= 0) e.price = "El precio debe ser mayor a cero."
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleConfirm = () => {
    if (!validate()) return
    onConfirm(description.trim(), Number(price))
    handleClose()
  }

  const handleClose = () => {
    setDescription("")
    setPrice("")
    setErrors({})
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleConfirm()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Venta Manual</DialogTitle>
          <DialogDescription>
            Ingresá un artículo o servicio que no está en el catálogo de inventario.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Descripción</Label>
            <Input
              placeholder="Nombre del artículo o servicio..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Precio Unitario ($)</Label>
            <Input
              type="number"
              min={0.01}
              step="0.01"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || "")}
              onKeyDown={handleKeyDown}
            />
            {errors.price && (
              <p className="text-xs text-destructive">{errors.price}</p>
            )}
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>Agregar al Ticket</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
