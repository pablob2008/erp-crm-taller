import { MessageCircle, ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"
import type { RecentOrder } from "@/lib/services/dashboard"
import { OrderStatusBadge } from "@/components/ui/order-status-badge"
import { GlassCard } from "@/components/ui/glass-card"
import { getOrderStatusConfig } from "@/lib/constants/order-status"

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
            const config = getOrderStatusConfig(order.status)
            const customerName = order.customers ? `${order.customers.first_name} ${order.customers.last_name}` : "—"
            const phone = order.customers?.phone ?? null

            return (
              <Link key={order.id} to={`/orders/${order.id}`}>
                <GlassCard
                  accent={config.color}
                  accentStripe
                  interactive
                  padding="sm"
                  className="flex items-center justify-between"
                >
                  <div className="flex flex-col ml-3 min-w-0 flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-mono font-bold text-sm ${config.text}`}>{order.order_number}</span>
                      <OrderStatusBadge status={order.status} size="sm" />
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
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border ${config.border} ${config.text} bg-background/50 group-hover:bg-background transition-colors`}>
                      <ArrowRight className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                    </div>
                  </div>
                </GlassCard>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
