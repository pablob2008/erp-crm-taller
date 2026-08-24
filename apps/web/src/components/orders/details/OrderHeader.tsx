import { useState } from "react"
import type { WorkOrderComposite, WorkOrderEditable } from "@/lib/services/work-order-details"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ChevronDown, ArrowLeft, Pencil, Trash2, Share2, MessageCircle, Printer } from "lucide-react"
import { useNavigate } from "react-router-dom"

// ─── Task 3.1: WhatsApp utility functions ─────────────────────────────────────
export function buildWhatsAppUrl(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, '');
  const base = `https://wa.me/${digits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function buildOrderSummaryText(order: WorkOrderComposite): string {
  const customerName = `${order.customers?.first_name ?? ''} ${order.customers?.last_name ?? ''}`.trim();
  const balance = (order.balance ?? 0).toFixed(2);
  const status = translateStatus(order.status);
  return (
    `📋 *Orden #${order.order_number}*\n` +
    `👤 Cliente: ${customerName}\n` +
    `📱 Dispositivo: ${order.device_brand} ${order.device_model}\n` +
    `🔧 Problema: ${order.reported_problem}\n` +
    `📌 Estado: ${status}\n` +
    `💰 Saldo pendiente: $${balance}`
  );
}

// ─── Status translation helper ────────────────────────────────────────────────
const translateStatus = (status: string) => {
  const map: Record<string, string> = {
    quotation: 'Cotización',
    received: 'Recibido',
    waiting_client: 'Esperando Cliente',
    waiting_parts: 'Esperando Repuesto',
    ready_for_pickup: 'Listo',
    cancelled: 'Cancelado',
    delivered: 'Entregado'
  }
  return map[status] || status
}

// ─── Task 3.2: EditOrderDialog ────────────────────────────────────────────────
interface EditOrderDialogProps {
  open: boolean;
  order: WorkOrderComposite;
  onClose: () => void;
  onSubmit: (data: Partial<WorkOrderEditable>) => Promise<void>;
}

function EditOrderDialog({ open, order, onClose, onSubmit }: EditOrderDialogProps) {
  const [form, setForm] = useState<Partial<WorkOrderEditable>>({
    device_brand: order.device_brand ?? '',
    device_model: order.device_model ?? '',
    device_color: order.device_color ?? '',
    aesthetic_condition: order.aesthetic_condition ?? '',
    accessories: order.accessories ?? '',
    reported_problem: order.reported_problem ?? '',
    suggested_solution: order.suggested_solution ?? '',
    estimated_cost: order.estimated_cost ?? 0,
    estimated_delivery_at: order.estimated_delivery_at
      ? order.estimated_delivery_at.slice(0, 10)
      : '',
  })
  const [submitting, setSubmitting] = useState(false)

  const set = (key: keyof WorkOrderEditable, value: string | number | null) =>
    setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const payload: Partial<WorkOrderEditable> = {
        ...form,
        estimated_delivery_at: form.estimated_delivery_at
          ? (form.estimated_delivery_at as string)
          : null,
      }
      await onSubmit(payload)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Orden #{order.order_number}</DialogTitle>
          <DialogDescription>
            Modificá los datos del dispositivo, diagnóstico y estimaciones.
          </DialogDescription>
        </DialogHeader>

        {/* Section: Device Details */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Detalles del Dispositivo
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Marca</Label>
              <Input value={form.device_brand ?? ''} onChange={e => set('device_brand', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Modelo</Label>
              <Input value={form.device_model ?? ''} onChange={e => set('device_model', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Color</Label>
              <Input value={form.device_color ?? ''} onChange={e => set('device_color', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Condición Estética</Label>
              <Input value={form.aesthetic_condition ?? ''} onChange={e => set('aesthetic_condition', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Accesorios</Label>
            <Input value={form.accessories ?? ''} onChange={e => set('accessories', e.target.value)} />
          </div>
        </div>

        {/* Section: Diagnosis & Service */}
        <div className="space-y-4 pt-2">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Diagnóstico y Servicio
          </h3>
          <div className="space-y-1">
            <Label>Problema Reportado</Label>
            <Textarea
              value={form.reported_problem ?? ''}
              onChange={e => set('reported_problem', e.target.value)}
              className="min-h-[60px] resize-none"
            />
          </div>
          <div className="space-y-1">
            <Label>Solución / Diagnóstico Inicial</Label>
            <Textarea
              value={form.suggested_solution ?? ''}
              onChange={e => set('suggested_solution', e.target.value)}
              className="min-h-[60px] resize-none"
            />
          </div>
          <div className="space-y-1">
            <Label>Fecha de Entrega Estimada</Label>
            <Input
              type="date"
              value={form.estimated_delivery_at ?? ''}
              onChange={e => set('estimated_delivery_at', e.target.value)}
            />
          </div>
        </div>

        {/* Section: Financial Estimate */}
        <div className="space-y-4 pt-2">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Estimación Financiera
          </h3>
          <div className="space-y-1">
            <Label>Costo Estimado ($)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.estimated_cost ?? 0}
              onChange={e => set('estimated_cost', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Task 3.3: DeleteOrderDialog ──────────────────────────────────────────────
interface DeleteOrderDialogProps {
  open: boolean;
  orderNumber: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

function DeleteOrderDialog({ open, orderNumber, onClose, onConfirm }: DeleteOrderDialogProps) {
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">Eliminar Orden #{orderNumber}</DialogTitle>
          <DialogDescription>
            Esta acción es <strong>permanente e irreversible</strong>. Se eliminará la orden y todos sus registros asociados (notas, tareas, movimientos, etc.).
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm">
          ¿Estás seguro que querés eliminar la orden <span className="font-bold">#{orderNumber}</span>?
        </p>
        <DialogFooter className="pt-4">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancelar</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={submitting}>
            {submitting ? 'Eliminando...' : 'Sí, eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Task 3.4: OrderHeader ────────────────────────────────────────────────────
interface OrderHeaderProps {
  order: WorkOrderComposite;
  onUpdateStatus: (newStatus: string) => Promise<void>;
  onEditOrder: (data: Partial<WorkOrderEditable>) => Promise<void>;
  onDeleteOrder: () => Promise<void>;
}

export function OrderHeader({ order, onUpdateStatus, onEditOrder, onDeleteOrder }: OrderHeaderProps) {
  const navigate = useNavigate();

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const statuses = [
    'quotation', 'received', 'waiting_client', 
    'waiting_parts', 'ready_for_pickup', 'cancelled', 'delivered'
  ]

  const customerPhone = order.customers?.phone ?? null;

  const handleWhatsAppShare = () => {
    if (!customerPhone) return;
    const text = buildOrderSummaryText(order);
    window.open(buildWhatsAppUrl(customerPhone, text), '_blank');
  }

  const handleWhatsAppChat = () => {
    if (!customerPhone) return;
    window.open(buildWhatsAppUrl(customerPhone), '_blank');
  }

  // ─── Task 3.5: Print ──────────────────────────────────────────────────────
  const handlePrint = () => {
    window.print();
  }

  const statusStyle = {
    received:         { bg: 'bg-kpi-blue/15',   border: 'border-kpi-blue/30',  text: 'text-kpi-blue',   dot: 'bg-kpi-blue',   glow: 'shadow-[0_0_20px_0_hsl(var(--kpi-blue)/0.15)]',   pulse: true  },
    waiting_client:   { bg: 'bg-kpi-amber/15',  border: 'border-kpi-amber/30', text: 'text-kpi-amber',  dot: 'bg-kpi-amber',  glow: 'shadow-[0_0_20px_0_hsl(var(--kpi-amber)/0.15)]',  pulse: true  },
    waiting_parts:    { bg: 'bg-kpi-red/15',    border: 'border-kpi-red/30',   text: 'text-kpi-red',    dot: 'bg-kpi-red',    glow: 'shadow-[0_0_20px_0_hsl(var(--kpi-red)/0.15)]',    pulse: false },
    ready_for_pickup: { bg: 'bg-kpi-green/15',  border: 'border-kpi-green/30', text: 'text-kpi-green',  dot: 'bg-kpi-green',  glow: 'shadow-[0_0_20px_0_hsl(var(--kpi-green)/0.15)]',  pulse: true  },
    quotation:        { bg: 'bg-kpi-amber/15',  border: 'border-kpi-amber/30', text: 'text-kpi-amber',  dot: 'bg-kpi-amber',  glow: 'shadow-[0_0_20px_0_hsl(var(--kpi-amber)/0.15)]',  pulse: false },
    delivered:        { bg: 'bg-muted/50',       border: 'border-border/40',    text: 'text-muted-foreground', dot: 'bg-muted-foreground', glow: '',                             pulse: false },
    cancelled:        { bg: 'bg-kpi-red/15',    border: 'border-kpi-red/30',   text: 'text-kpi-red',    dot: 'bg-kpi-red',    glow: 'shadow-[0_0_20px_0_hsl(var(--kpi-red)/0.15)]',    pulse: false },
  }[order.status] ?? { bg: 'bg-muted/40', border: 'border-border/40', text: 'text-muted-foreground', dot: 'bg-muted-foreground', glow: '', pulse: false }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/orders')} 
            className="flex items-center justify-center w-10 h-10 rounded-full bg-background/50 border border-border/40 text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95 transition-all shadow-sm"
            title="Volver a la lista"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-foreground">
                Orden #{order.order_number}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              <span className="font-medium text-foreground/80">{order.customers?.first_name} {order.customers?.last_name}</span> · {order.device_brand} {order.device_model}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Action Buttons with circular glow styling */}
          <button
            title="Editar orden"
            onClick={() => setEditOpen(true)}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-background/50 border border-border/40 text-muted-foreground hover:text-foreground hover:scale-110 active:scale-95 transition-all shadow-sm"
          >
            <Pencil className="h-4 w-4" />
          </button>

          <button
            title="Compartir resumen por WhatsApp"
            onClick={handleWhatsAppShare}
            disabled={!customerPhone}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-kpi-green/15 text-kpi-green border border-kpi-green/30 hover:bg-kpi-green/25 hover:scale-110 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-sm"
          >
            <Share2 className="h-4 w-4" />
          </button>

          <button
            title="Chat directo por WhatsApp"
            onClick={handleWhatsAppChat}
            disabled={!customerPhone}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-kpi-green/15 text-kpi-green border border-kpi-green/30 hover:bg-kpi-green/25 hover:scale-110 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-sm"
          >
            <MessageCircle className="h-4 w-4" />
          </button>

          <button
            title="Imprimir comprobante"
            onClick={handlePrint}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-kpi-blue/15 text-kpi-blue border border-kpi-blue/30 hover:bg-kpi-blue/25 hover:scale-110 active:scale-95 transition-all shadow-sm"
          >
            <Printer className="h-4 w-4" />
          </button>

          <button
            title="Eliminar orden"
            onClick={() => setDeleteOpen(true)}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-kpi-red/15 text-kpi-red border border-kpi-red/30 hover:bg-kpi-red/25 hover:scale-110 active:scale-95 transition-all shadow-sm"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          {/* Status Dropdown with glow pill and indicator dot */}
          <div className="ml-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 hover:brightness-110 focus-visible:outline-none ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text} ${statusStyle.glow}`}
                >
                  {statusStyle.pulse && <span className={`w-2 h-2 rounded-full ${statusStyle.dot} animate-pulse`} />}
                  <span>{translateStatus(order.status)}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-80" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl border border-border/40 shadow-lg backdrop-blur-md bg-background/80">
                {statuses.map(s => (
                  <DropdownMenuItem 
                    key={s} 
                    onClick={() => onUpdateStatus(s)}
                    className={`cursor-pointer rounded-lg text-xs font-medium ${order.status === s ? 'bg-kpi-blue/15 text-kpi-blue font-bold' : ''}`}
                  >
                    {translateStatus(s)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <EditOrderDialog
        open={editOpen}
        order={order}
        onClose={() => setEditOpen(false)}
        onSubmit={onEditOrder}
      />
      <DeleteOrderDialog
        open={deleteOpen}
        orderNumber={order.order_number}
        onClose={() => setDeleteOpen(false)}
        onConfirm={onDeleteOrder}
      />
    </>
  )
}
