import { useEffect, useState } from "react"
import type { WorkOrderComposite } from "@/lib/services/work-order-details"
import type { RandomExpenseData, DeliveryData, RandomPaymentData } from "@/lib/services/work-order-details"
import { useSupabase } from "@/context/SupabaseProvider"
import { emitInvoice, fetchInvoiceByTarget, type ArcaInvoice, getVoucherTypeLabel, formatInvoiceFullNumber } from "@/lib/services/arca"
import { formatPrice } from "@/lib/formatters"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

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
import { Pencil, Trash2, X, Check, PlusCircle, Truck, DollarSign, FileText, Loader2, CheckCircle2 } from "lucide-react"

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

interface AddPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: RandomPaymentData) => Promise<void>;
}

function AddPaymentDialog({ open, onClose, onSubmit }: AddPaymentDialogProps) {
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
          <DialogTitle>Registrar Pago</DialogTitle>
          <DialogDescription>
            Registrar un pago ad-hoc asociado a esta orden de trabajo.
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
              placeholder="¿Por qué concepto?"
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
            {submitting ? 'Guardando...' : 'Registrar Pago'}
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
            {(order.balance ?? 0) <= 0 ? "Entregar (Saldo Cubierto)" : "Entregar a Crédito"}
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
            {(order.balance ?? 0) <= 0 
              ? "El saldo ya está cubierto. Se marcará la orden como entregada sin registrar nuevos cobros."
              : "Se entregará la orden sin cobrar el saldo pendiente. Se registrará una nota automática con el monto adeudado."}
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
  onAddPayment: (data: RandomPaymentData) => Promise<void>;
  onDeliverOrder: (data: DeliveryData) => Promise<void>;
}

export function FinancesTab({ order, onUpdatePayment, onDeletePayment, onAddExpense, onAddPayment, onDeliverOrder }: FinancesTabProps) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)
  const [editPaymentAmount, setEditPaymentAmount] = useState<number | "">("")

  const [expenseOpen, setExpenseOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [deliverOpen, setDeliverOpen] = useState(false)

  // Fiscal state
  const [invoice, setInvoice] = useState<ArcaInvoice | null>(null)
  const [invoiceLoading, setInvoiceLoading] = useState(true)
  const [emitting, setEmitting] = useState(false)

  const isOrderTerminal = order.status === "ready_for_pickup" || order.status === "delivered"

  // Check if an invoice already exists for this order (directly or via a linked POS sale)
  useEffect(() => {
    let active = true
    async function checkInvoice() {
      try {
        setInvoiceLoading(true)
        // 1. Direct check in arca_invoices by work_order_id
        const direct = await fetchInvoiceByTarget(supabase, "work_order", order.id)
        if (direct && active) {
          setInvoice(direct)
          return
        }

        // 2. Cross-check if any POS sale linked to this order has an approved invoice
        const { data: salesRows } = await supabase
          .from("sales")
          .select("arca_invoices (*)")
          .eq("work_order_id", order.id)
          .not("arca_invoice_id", "is", null)
          .limit(1)

        if (salesRows && salesRows.length > 0 && (salesRows[0] as any)?.arca_invoices && active) {
          setInvoice((salesRows[0] as any).arca_invoices as ArcaInvoice)
        }
      } catch (err) {
        console.error("Error checking invoice for order:", err)
      } finally {
        if (active) setInvoiceLoading(false)
      }
    }
    checkInvoice()
    return () => {
      active = false
    }
  }, [supabase, order.id])

  const handleEmitInvoice = async () => {
    if (!isOrderTerminal) {
      toast({
        variant: "destructive",
        title: "Orden no finalizada",
        description: "La orden debe estar en 'Listo para Retiro' o 'Entregado' para poder facturarse.",
      })
      return
    }

    setEmitting(true)
    try {
      const res = await emitInvoice(supabase, {
        target_type: "work_order",
        target_id: order.id,
      })
      if (res.success) {
        toast({
          title: res.already_invoiced ? "Comprobante existente" : "Factura emitida exitosamente",
          description: res.mock
            ? `CAE simulado: ${res.cae} (modo pruebas)`
            : `CAE otorgado por AFIP: ${res.cae}`,
        })
        const updated = await fetchInvoiceByTarget(supabase, "work_order", order.id)
        setInvoice(updated)
      } else {
        toast({ variant: "destructive", title: "Error al facturar", description: res.error || res.message })
      }
    } catch (err: unknown) {
      toast({ variant: "destructive", title: "Error", description: err instanceof Error ? err.message : "Error desconocido." })
    } finally {
      setEmitting(false)
    }
  }

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
              onClick={() => setPaymentOpen(true)}
            >
              <DollarSign className="h-4 w-4 mr-1" />
              Registrar Pago
            </Button>
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
            {/* Botón Emitir Factura Electrónica blindado */}
            {invoice ? (
              <Badge variant="success" size="lg" className="gap-1.5 h-9 px-3">
                <CheckCircle2 className="h-4 w-4" />
                <span>Facturado C</span>
              </Badge>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="shadow-sm border border-border/40"
                onClick={handleEmitInvoice}
                disabled={emitting || invoiceLoading || !isOrderTerminal}
                title={
                  !isOrderTerminal
                    ? "Solo se puede emitir factura cuando la orden esté terminada o entregada."
                    : "Emitir Factura C electrónica con CAE ante AFIP/ARCA"
                }
              >
                {emitting ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-1" />
                )}
                <span>Emitir Factura</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-background/40 border border-border/40 shadow-sm backdrop-blur-md flex flex-col items-center justify-center">
              <span className="text-sm text-muted-foreground mb-1 text-center font-medium">Costo Estimado</span>
              <span className="text-xl font-bold font-mono">{formatPrice(order.estimated_cost || 0)}</span>
            </div>
            <div className="p-4 rounded-xl bg-background/40 border border-border/40 shadow-sm backdrop-blur-md flex flex-col items-center justify-center">
              <span className="text-sm text-muted-foreground mb-1 text-center font-medium">Total Pagado</span>
              <span className="text-xl font-bold font-mono text-kpi-green">{formatPrice(order.total_paid || 0)}</span>
            </div>
            <div className="p-4 rounded-xl bg-background/40 border border-border/40 shadow-sm backdrop-blur-md flex flex-col items-center justify-center">
              <span className="text-sm text-muted-foreground mb-1 text-center font-medium">Saldo Pendiente</span>
              <span className={`text-xl font-bold font-mono ${order.balance > 0 ? "text-kpi-amber" : "text-kpi-green"}`}>
                {formatPrice(order.balance || 0)}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-background/40 border border-border/40 shadow-sm backdrop-blur-md flex flex-col items-center justify-center">
              <span className="text-sm text-muted-foreground mb-1 text-center font-medium">Ganancia Neta</span>
              <span className={`text-xl font-bold font-mono ${netProfit >= 0 ? "text-kpi-green" : "text-destructive"}`}>
                {formatPrice(netProfit)}
              </span>
            </div>
          </div>

          {/* Comprobante fiscal */}
          {invoice && (
            <div className="p-4 rounded-xl bg-green-50/50 dark:bg-green-950/20 border border-green-200/60 dark:border-green-800/40 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">Comprobante Fiscal Emitido</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Tipo</span>
                  <p className="font-medium">{getVoucherTypeLabel(invoice.cbte_tipo)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Número</span>
                  <p className="font-medium">{invoice.cbte_nro ? formatInvoiceFullNumber(invoice.pto_vta, invoice.cbte_nro) : "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">CAE</span>
                  <p className="font-mono font-medium text-xs">{invoice.cae || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Vto. CAE</span>
                  <p className="font-medium">{invoice.cae_fch_vto || "-"}</p>
                </div>
              </div>
            </div>
          )}

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
      <AddPaymentDialog
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onSubmit={onAddPayment}
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
