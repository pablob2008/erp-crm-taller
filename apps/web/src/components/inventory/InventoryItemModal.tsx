import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { InventoryItem, CreateInventoryItemDTO, UpdateInventoryItemDTO } from "@/lib/services/inventory"

interface InventoryItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (payload: CreateInventoryItemDTO | UpdateInventoryItemDTO) => Promise<void>
  item: InventoryItem | null
}

export function InventoryItemModal({ isOpen, onClose, onSave, item }: InventoryItemModalProps) {
  const [formData, setFormData] = useState<CreateInventoryItemDTO>({
    code: "",
    name: "",
    description: "",
    category: "",
    quantity: 0,
    min_stock: 0,
    cost_price: 0,
    sale_price: 0,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (item) {
      setFormData({
        code: item.code || "",
        name: item.name || "",
        description: item.description || "",
        category: item.category || "",
        quantity: item.quantity || 0,
        min_stock: item.min_stock || 0,
        cost_price: item.cost_price || 0,
        sale_price: item.sale_price || 0,
      })
    } else {
      setFormData({
        code: "",
        name: "",
        description: "",
        category: "",
        quantity: 0,
        min_stock: 0,
        cost_price: 0,
        sale_price: 0,
      })
    }
  }, [item, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSave(formData)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{item ? "Editar Artículo" : "Nuevo Artículo"}</DialogTitle>
            <DialogDescription>
              Completa los detalles del artículo de inventario.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código (SKU / Barcode)</Label>
                <Input id="code" name="code" value={formData.code} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input id="description" name="description" value={formData.description || ''} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Input id="category" name="category" value={formData.category || ''} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Stock Actual</Label>
                <Input id="quantity" name="quantity" type="number" min="0" step="1" value={formData.quantity} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_stock">Stock Mínimo</Label>
                <Input id="min_stock" name="min_stock" type="number" min="0" step="1" value={formData.min_stock || 0} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost_price">Costo ($)</Label>
                <Input id="cost_price" name="cost_price" type="number" min="0" step="0.01" value={formData.cost_price || 0} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sale_price">Precio Venta ($)</Label>
                <Input id="sale_price" name="sale_price" type="number" min="0" step="0.01" value={formData.sale_price || 0} onChange={handleChange} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
