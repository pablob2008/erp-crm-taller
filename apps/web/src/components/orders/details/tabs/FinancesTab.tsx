import { useState } from "react"
import type { WorkOrderComposite } from "@/lib/services/work-order-details"
import type { RandomExpenseData, DeliveryData } from "@/lib/services/work-order-details"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Pencil, Trash2, X, Check, PlusCircle, Truck } from "lucide-react"

// ─── Task 4.1: AddExpenseDialog ───────────────────────────────────────────────
interface AddExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: RandomExpenseData) => Promise<void>;
}

function AddExpenseDialog({ open, onClose, onSubmit }: AddExpenseDialogProps) {
  const [amount, setAmount] = useState<number | "">("")
  const [method, setMethod] = useState("")
  const [description, setDescription] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!amount || Number(amount) <= 0) e.amount = "El monto debe ser mayor a cero."
    if (!method) e.method = "Seleccioná un método de pago."
    if (!description.trim()) e.description = "La descripción es obligatoria."
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true)
    try {
      await onSubmit({ amount: Number(amount), method, description: description.trim() })
      // Reset form
      setAmount("")
      setMethod("")
      setDescription("")
      setErrors({})
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setAmount("")
    setMethod("")
    setDescription("")
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Gasto</DialogTitle>
          <DialogDescription>
            Registrá un gasto ad-hoc asociado a esta orden de trabajo.
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
              onChange={e => setAmount(parseFloat(e.target.value) || "")}
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
          </div>
          <div className="space-y-1">
            <Label>Método de Pago</Label>
            <Select value={method} onValueChange={setMethod}>
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
            {errors.method && <p className="text-xs text-destructive">{errors.method}</p>}
          </div>
          <div className="space-y-1">
            <Label>Descripción</Label>
            <Textarea
              placeholder="¿En qué se gastó?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="resize-none min-h-[60px]"
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>
        </div>
        <DialogFooter className="pt-4">
          <Button variant="ghost" onClick={handleClose} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Guardando...' : 'Registrar Gasto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Task 4.2: DeliverOrderDialog ─────────────────────────────────────────────
interface DeliverOrderDialogProps {
  open: boolean;
  order: WorkOrderComposite;
  onClose: () => void;
  onSubmit: (data: DeliveryData) => Promise<void>;
}

function DeliverOrderDialog({ open, order, onClose, onSubmit }: DeliverOrderDialogProps) {
  const [mode, setMode] = useState<'credit' | 'collect'>('credit')
  const [amount, setAmount] = useState<number | "">("")
  const [method, setMethod] = useState("")
  const [note, setNote] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (mode === 'collect') {
      if (!amount || Number(amount) <= 0) e.amount = "El monto debe ser mayor a cero."
      if (!method) e.method = "Seleccioná un método de pago."
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true)
    try {
      await onSubmit({
        mode,
        amount: mode === 'collect' ? Number(amount) : undefined,
        method: mode === 'collect' ? method : undefined,
        note: note.trim() || undefined,
      })
      handleClose()
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setMode('credit')
    setAmount("")
    setMethod("")
    setNote("")
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Entregar Orden #{order.order_number}</DialogTitle>
          <DialogDescription>
            Seleccioná la modalidad de entrega para esta orden.
          </DialogDescription>
        </DialogHeader>

        {/* Balance summary */}
        <div className="p-3 rounded-lg bg-muted text-sm">
          <span className="text-muted-foreground">Saldo pendiente: </span>
          <span className={`font-bold ${(order.balance ?? 0) > 0 ? 'text-destructive' : 'text-primary'}`}>
            ${(order.balance ?? 0).toFixed(2)}
          </span>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2">
          <Button
            variant={mode === 'credit' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setMode('credit')}
          >
            Entregar a Crédito
          </Button>
          <Button
            variant={mode === 'collect' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setMode('collect')}
          >
            Cobrar y Entregar
          </Button>
        </div>

        {/* Credit mode info */}
        {mode === 'credit' && (
          <p className="text-sm text-muted-foreground">
            Se entregará la orden sin cobrar el saldo pendiente. Se registrará una nota automática con el monto adeudado.
          </p>
        )}

        {/* Collect mode fields */}
        {mode === 'collect' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Monto a Cobrar ($)</Label>
              <Input
                type="number"
                min={0.01}
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(parseFloat(e.target.value) || "")}
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
            </div>
            <div className="space-y-1">
              <Label>Método de Pago</Label>
              <Select value={method} onValueChange={setMethod}>
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
              {errors.method && <p className="text-xs text-destructive">{errors.method}</p>}
            </div>
          </div>
        )}

        {/* Optional note (both modes) */}
        <div className="space-y-1">
          <Label>Nota adicional (opcional)</Label>
          <Textarea
            placeholder="Observaciones sobre la entrega..."
            value={note}
            onChange={e => setNote(e.target.value)}
            className="resize-none min-h-[60px]"
          />
        </div>

        <DialogFooter className="pt-4">
          <Button variant="ghost" onClick={handleClose} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Procesando...' : 'Confirmar Entrega'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Task 4.3 & 4.4: FinancesTab ─────────────────────────────────────────────
interface FinancesTabProps {
  order: WorkOrderComposite;
  branchId: string;
  onUpdatePayment: (paymentId: string, amount: number) => Promise<void>;
  onDeletePayment: (paymentId: string) => Promise<void>;
  onAddExpense: (data: RandomExpenseData) => Promise<void>;
  onDeliverOrder: (data: DeliveryData) => Promise<void>;
}

export function FinancesTab({ order, onUpdatePayment, onDeletePayment, onAddExpense, onDeliverOrder }: FinancesTabProps) {
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)
  const [editPaymentAmount, setEditPaymentAmount] = useState<number | "">("")

  const [expenseOpen, setExpenseOpen] = useState(false)
  const [deliverOpen, setDeliverOpen] = useState(false)

  const totalExpenses = order.cash_movements?.filter(m => m.type === 'expense').reduce((acc, m) => acc + Number(m.net_amount), 0) || 0;
  const netProfit = (order.total_paid || 0) - totalExpenses;

  const translateMethod = (m: string) => {
    switch(m) {
      case 'cash': return 'Efectivo';
      case 'card': return 'Tarjeta';
      case 'transfer': return 'Transferencia';
      case 'qr': return 'QR';
      default: return m;
    }
  }

  const translateCategory = (c: string) => {
    switch(c) {
      case 'work_order_payment': return 'Pago de Orden';
      case 'purchase_payment': return 'Compra Repuesto';
      case 'manual_income': return 'Ingreso Manual';
      case 'manual_expense': return 'Gasto Manual';
      default: return c;
    }
  }

  return (
    <>
      <Card className="border border-border/40 backdrop-blur-md bg-background/40 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Finanzas y Movimientos</CardTitle>
          {/* Task 4.3: Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="shadow-sm border border-border/40"
              onClick={() => setExpenseOpen(true)}
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Registrar Gasto
            </Button>
            <Button
              size="sm"
              className="shadow-sm border border-border/40 backdrop-blur-md"
              onClick={() => setDeliverOpen(true)}
              disabled={order.status === 'delivered'}
            >
              <Truck className="h-4 w-4 mr-1" />
              Entregar Orden
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-background/40 border border-border/40 shadow-sm backdrop-blur-md flex flex-col items-center justify-center">
              <span className="text-sm text-muted-foreground mb-1 text-center">Costo Estimado</span>
              <span className="text-xl font-bold">${(order.estimated_cost || 0).toFixed(2)}</span>
            </div>
            <div className="p-4 rounded-xl bg-background/40 border border-border/40 shadow-sm backdrop-blur-md flex flex-col items-center justify-center">
              <span className="text-sm text-muted-foreground mb-1 text-center">Total Pagado</span>
              <span className="text-xl font-bold text-green-600">${(order.total_paid || 0).toFixed(2)}</span>
            </div>
            <div className="p-4 rounded-xl bg-background/40 border border-border/40 shadow-sm backdrop-blur-md flex flex-col items-center justify-center">
              <span className="text-sm text-muted-foreground mb-1 text-center">Saldo Pendiente</span>
              <span className={`text-xl font-bold ${order.balance > 0 ? 'text-destructive' : 'text-primary'}`}>
                ${(order.balance || 0).toFixed(2)}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-background/40 border border-border/40 shadow-sm backdrop-blur-md flex flex-col items-center justify-center">
              <span className="text-sm text-muted-foreground mb-1 text-center">Ganancia Neta</span>
              <span className={`text-xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                ${netProfit.toFixed(2)}
              </span>
            </div>
          </div>

          <h3 className="font-semibold mb-4 text-lg">Historial de Movimientos</h3>
          <div className="rounded-md bg-background/40 border border-border/40 shadow-sm backdrop-blur-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.cash_movements?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      No hay movimientos registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  order.cash_movements?.map((payment) => (
                    <TableRow key={payment.id} className="group">
                      <TableCell className="text-xs">{new Date(payment.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{translateCategory(payment.category)}</span>
                          {payment.description && <span className="text-xs text-muted-foreground">{payment.description}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {translateMethod(payment.payment_method)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {editingPaymentId === payment.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <Input 
                              type="number"
                              value={editPaymentAmount}
                              onChange={e => setEditPaymentAmount(Number(e.target.value))}
                              className="w-24 h-8 text-right bg-background/50 border border-border/40 shadow-sm"
                              autoFocus
                            />
                            <Button size="icon" variant="ghost" onClick={async () => {
                              if(editPaymentAmount !== "" && editPaymentAmount > 0) {
                                await onUpdatePayment(payment.id, Number(editPaymentAmount));
                                setEditingPaymentId(null);
                              }
                            }} className="h-8 w-8 text-green-600">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setEditingPaymentId(null)} className="h-8 w-8 text-destructive">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground" onClick={() => {
                                setEditingPaymentId(payment.id);
                                setEditPaymentAmount(payment.net_amount);
                              }}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => {
                                if(confirm("¿Eliminar pago? Esto actualizará el balance.")) {
                                  onDeletePayment(payment.id);
                                }
                              }}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className={`font-medium w-20 ${payment.type === 'expense' ? 'text-destructive' : 'text-green-600'}`}>
                              {payment.type === 'expense' ? '-' : '+'}${payment.net_amount.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddExpenseDialog
        open={expenseOpen}
        onClose={() => setExpenseOpen(false)}
        onSubmit={onAddExpense}
      />
      <DeliverOrderDialog
        open={deliverOpen}
        order={order}
        onClose={() => setDeliverOpen(false)}
        onSubmit={onDeliverOrder}
      />
    </>
  )
}
