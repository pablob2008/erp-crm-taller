import { MessageCircle, ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"
import type { RecentOrder } from "@/lib/services/dashboard"

const STATUS_STYLE: Record<string, { bg: string; border: string; text: string; dot: string; glow: string; label: string; pulse?: boolean }> = {
  received:         { bg: 'bg-kpi-blue/5',   border: 'border-kpi-blue/30',  text: 'text-kpi-blue',   dot: 'bg-kpi-blue',   glow: 'shadow-[0_0_15px_0_hsl(var(--kpi-blue)/0.1)]',   label: 'Recibido', pulse: true },
  waiting_client:   { bg: 'bg-kpi-amber/5',  border: 'border-kpi-amber/30', text: 'text-kpi-amber',  dot: 'bg-kpi-amber',  glow: 'shadow-[0_0_15px_0_hsl(var(--kpi-amber)/0.1)]',  label: 'Esperando Cliente', pulse: true },
  waiting_parts:    { bg: 'bg-kpi-red/5',    border: 'border-kpi-red/30',   text: 'text-kpi-red',    dot: 'bg-kpi-red',    glow: 'shadow-[0_0_15px_0_hsl(var(--kpi-red)/0.1)]',    label: 'Esperando Repuesto' },
  ready_for_pickup: { bg: 'bg-kpi-green/5',  border: 'border-kpi-green/30', text: 'text-kpi-green',  dot: 'bg-kpi-green',  glow: 'shadow-[0_0_15px_0_hsl(var(--kpi-green)/0.1)]',  label: 'Listo', pulse: true },
  quotation:        { bg: 'bg-kpi-amber/5',  border: 'border-kpi-amber/30', text: 'text-kpi-amber',  dot: 'bg-kpi-amber',  glow: 'shadow-[0_0_15px_0_hsl(var(--kpi-amber)/0.1)]',  label: 'Cotización' },
  delivered:        { bg: 'bg-muted/10',     border: 'border-border/40',    text: 'text-muted-foreground', dot: 'bg-muted-foreground', glow: 'shadow-sm', label: 'Entregado' },
  cancelled:        { bg: 'bg-kpi-red/5',    border: 'border-kpi-red/30',   text: 'text-kpi-red',    dot: 'bg-kpi-red',    glow: 'shadow-[0_0_15px_0_hsl(var(--kpi-red)/0.1)]',    label: 'Cancelado' },
}

const DEFAULT_STYLE = { bg: 'bg-muted/10', border: 'border-border/40', text: 'text-muted-foreground', dot: 'bg-muted-foreground', glow: 'shadow-sm', label: 'Desconocido' }

function buildWhatsAppUrl(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, "")
  const base = `https://wa.me/${digits}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}

interface RecentOrdersWidgetProps {
  orders: RecentOrder[]
  loading?: boolean
}

export function RecentOrdersWidget({ orders, loading = false }: RecentOrdersWidgetProps) {
  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-kpi-blue/10 via-kpi-blue/5 to-background border border-kpi-blue/20 shadow-[0_0_30px_0_hsl(var(--kpi-blue)/0.05)] p-6 flex flex-col gap-4 overflow-hidden">
      {/* Ambient background light */}
      <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-kpi-blue/20 blur-3xl pointer-events-none -z-10" />

      <h3 className="text-lg font-bold text-foreground">Órdenes Recientes</h3>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-background/50 border border-border/40" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay órdenes recientes.</p>
      ) : (
        <div className="grid gap-3">
          {orders.map((order) => {
            const s = STATUS_STYLE[order.status] ?? DEFAULT_STYLE
            const customerName = order.customers ? `${order.customers.first_name} ${order.customers.last_name}` : "—"
            const phone = order.customers?.phone ?? null

            return (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className={`group relative flex items-center justify-between rounded-xl border ${s.border} ${s.bg} ${s.glow} p-3 transition-all duration-200 hover:scale-[1.02] hover:brightness-105 overflow-hidden`}
              >
                {/* Left accent bar */}
                <div className={`absolute left-0 inset-y-0 w-1 ${s.dot} rounded-l-xl`} />
                {/* Shimmer on hover */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex flex-col ml-3 min-w-0 flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-mono font-bold text-sm ${s.text}`}>{order.order_number}</span>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${s.bg} ${s.border} ${s.text}`}>
                      {s.pulse && <span className={`w-1 h-1 rounded-full ${s.dot} animate-pulse`} />}
                      {s.label}
                    </span>
                  </div>
                  <p className="font-semibold text-sm text-foreground truncate">{customerName}</p>
                  <p className="text-xs text-muted-foreground truncate">{order.device_brand} {order.device_model}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {phone && (
                    <a
                      href={buildWhatsAppUrl(phone, `Hola ${order.customers?.first_name}, te contacto por la orden #${order.order_number}...`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(e.currentTarget.href, '_blank') }}
                      title="Chat por WhatsApp"
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-kpi-green/15 text-kpi-green border border-kpi-green/30 hover:bg-kpi-green/30 transition-all hover:scale-110 active:scale-95 z-10"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border ${s.border} ${s.text} bg-background/50 group-hover:bg-background transition-colors`}>
                    <ArrowRight className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
