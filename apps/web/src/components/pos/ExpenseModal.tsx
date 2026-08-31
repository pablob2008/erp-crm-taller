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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSupabase } from "@/context/SupabaseProvider"
import { useToast } from "@/hooks/use-toast"
import { addQuickExpense } from "@/lib/services/pos"

interface ExpenseModalProps {
  open: boolean
  branchId: string
  userId: string
  onClose: () => void
}

export function ExpenseModal({ open, branchId, userId, onClose }: ExpenseModalProps) {
  const { supabase } = useSupabase()
  const { toast } = useToast()

  const [amount, setAmount] = useState<number | "">("")
  const [method, setMethod] = useState<"cash" | "qr" | "card" | "transfer">("cash")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!amount || Number(amount) <= 0) e.amount = "El monto debe ser mayor a cero."
    if (!description.trim()) e.description = "La descripción es obligatoria."
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      await addQuickExpense(
        supabase,
        branchId,
        Number(amount),
        method,
        description.trim(),
        undefined,
        userId
      )
      toast({
        title: "Gasto registrado",
        description: `$${Number(amount).toLocaleString("es-AR")} deducido de caja.`,
      })
      handleClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al registrar el gasto."
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setAmount("")
    setMethod("cash")
    setDescription("")
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Gasto</DialogTitle>
          <DialogDescription>
            Registrá un egreso de caja (gastos del negocio, compras menores, etc.).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Monto ($)</Label>
            <Input
              type="number"
              min={0.01}
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || "")}
              autoFocus
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
          </div>

          <div className="space-y-1">
            <Label>Método de Pago</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
                <SelectItem value="card">Tarjeta</SelectItem>
                <SelectItem value="qr">QR / Billetera</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Descripción</Label>
            <Textarea
              placeholder="¿En qué se gastó?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none min-h-[60px]"
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button variant="ghost" onClick={handleClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} variant="destructive">
            {submitting ? "Registrando..." : "Registrar Gasto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
