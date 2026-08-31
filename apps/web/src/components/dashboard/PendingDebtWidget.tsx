import { Link } from "react-router-dom"
import { AlertCircle, ArrowUpRight, CheckCircle2, Truck } from "lucide-react"
import type { PendingDebtItem } from "@/lib/services/dashboard"
import { Badge } from "@/components/ui/badge"

interface PendingDebtWidgetProps {
  orders: PendingDebtItem[]
  loading?: boolean
}

export function PendingDebtWidget({ orders, loading = false }: PendingDebtWidgetProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
    })
  }

  const totalDebt = orders.reduce((acc, order) => acc + (order.balance || 0), 0)

  return (
    <div className="flex flex-col rounded-xl border border-border/40 bg-background/40 p-5 shadow-sm backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-kpi-red/10 p-2 text-kpi-red">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">Saldos Pendientes de Cobro</h3>
              <Badge variant="outline" className="border-kpi-red/30 bg-kpi-red/10 text-kpi-red text-[10px] px-2">
                Histórico
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Órdenes listas o entregadas con saldo a cobrar (Deuda acumulada)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-muted-foreground">Deuda Total:</span>
          <span className="font-mono font-bold text-sm text-kpi-red">
            ${totalDebt.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {orders.length}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/40 text-xs font-semibold text-muted-foreground">
              <th className="py-2.5 pr-4">N° Orden / Equipo</th>
              <th className="py-2.5 px-4">Cliente</th>
              <th className="py-2.5 px-4 text-center">Estado</th>
              <th className="py-2.5 px-4 text-right">Total</th>
              <th className="py-2.5 px-4 text-right">Saldo Deudor</th>
              <th className="py-2.5 pl-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3 pr-4"><div className="h-4 w-28 rounded bg-muted/60" /></td>
                  <td className="py-3 px-4"><div className="h-4 w-32 rounded bg-muted/60" /></td>
                  <td className="py-3 px-4 text-center"><div className="mx-auto h-5 w-16 rounded bg-muted/60" /></td>
                  <td className="py-3 px-4 text-right"><div className="ml-auto h-4 w-16 rounded bg-muted/60" /></td>
                  <td className="py-3 px-4 text-right"><div className="ml-auto h-4 w-16 rounded bg-muted/60" /></td>
                  <td className="py-3 pl-4 text-right"><div className="ml-auto h-6 w-16 rounded bg-muted/60" /></td>
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                  ¡Excelente! No hay órdenes listas o entregadas con saldos adeudados.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const device = [order.device_brand, order.device_model].filter(Boolean).join(" ")
                const isDelivered = order.status === "delivered"

                return (
                  <tr key={order.id} className="transition-colors hover:bg-muted/30">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-foreground">
                          {order.order_number}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {formatDate(order.created_at)}
                        </span>
                      </div>
                      {device && (
                        <div className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                          {device}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground text-xs sm:text-sm">
                        {order.customer_name || "Cliente sin registrar"}
                      </div>
                      {order.customer_phone && (
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {order.customer_phone}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {isDelivered ? (
                        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[10px] px-1.5 py-0.5 inline-flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          Entregado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-kpi-green/30 bg-kpi-green/10 text-kpi-green text-[10px] px-1.5 py-0.5 inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Listo
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-muted-foreground whitespace-nowrap">
                      ${order.total.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-kpi-red whitespace-nowrap">
                      ${order.balance.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 pl-4 text-right whitespace-nowrap">
                      <Link
                        to={`/orders/${order.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-border/50 bg-background/80 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-accent transition-colors shadow-sm"
                      >
                        Cobrar / Ver
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
