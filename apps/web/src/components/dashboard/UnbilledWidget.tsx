import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { FileWarning, ArrowUpRight, ShoppingCart, Wrench, FileText, Loader2, Search } from "lucide-react"
import type { UnbilledSaleItem, UnbilledOrderItem } from "@/lib/services/dashboard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface UnbilledWidgetProps {
  unbilledSales: UnbilledSaleItem[]
  unbilledOrders: UnbilledOrderItem[]
  loading?: boolean
  onEmitInvoice?: (targetType: "sale" | "work_order", targetId: string) => Promise<void>
  emittingId?: string | null
}

type TabType = "sales" | "orders"

const orderStatusLabels: Record<string, { label: string; className: string }> = {
  budget_pending: { label: "Presupuesto Pendiente", className: "bg-muted text-muted-foreground" },
  budget_approved: { label: "Aprobado", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  in_progress: { label: "En Reparación", className: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" },
  waiting_parts: { label: "Esperando Repuesto", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  ready_for_pickup: { label: "Listo", className: "bg-kpi-green/10 text-kpi-green border-kpi-green/20" },
  delivered: { label: "Entregado", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
}

export function UnbilledWidget({
  unbilledSales,
  unbilledOrders,
  loading = false,
  onEmitInvoice,
  emittingId,
}: UnbilledWidgetProps) {
  const [activeTab, setActiveTab] = useState<TabType>("sales")
  const [search, setSearch] = useState("")

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    })
  }

  // Filter lists based on search
  const filteredSales = useMemo(() => {
    if (!search.trim()) return unbilledSales
    const term = search.toLowerCase()
    return unbilledSales.filter((s) =>
      (s.customer_name?.toLowerCase() || "").includes(term) ||
      (s.customer_doc_number || "").includes(term)
    )
  }, [unbilledSales, search])

  const filteredOrders = useMemo(() => {
    if (!search.trim()) return unbilledOrders
    const term = search.toLowerCase()
    return unbilledOrders.filter((o) =>
      (o.order_number?.toLowerCase() || "").includes(term) ||
      (o.customer_name?.toLowerCase() || "").includes(term)
    )
  }, [unbilledOrders, search])

  return (
    <div className="flex flex-col rounded-xl border border-border/40 bg-background/40 p-5 shadow-sm backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-amber-500/10 p-2 text-amber-500">
            <FileWarning className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">Comprobantes Sin Facturar (ARCA)</h3>
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-500 text-[10px] px-2">
                Pendientes
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Ventas y órdenes entregadas sin CAE emitido. Podés facturarlas acá con un clic.
            </p>
          </div>
        </div>

        {/* Tab Buttons & Search */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente u orden..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-44 pl-8 text-xs bg-background/60"
            />
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-background/60 p-1 border border-border/40">
            <button
              type="button"
              onClick={() => setActiveTab("sales")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                activeTab === "sales"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Ventas ({unbilledSales.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                activeTab === "orders"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Wrench className="h-3.5 w-3.5" />
              <span>Órdenes ({unbilledOrders.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="mt-3 overflow-x-auto">
        {activeTab === "sales" ? (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/40 text-xs font-semibold text-muted-foreground">
                <th className="py-2.5 pr-4">Fecha</th>
                <th className="py-2.5 px-4">Cliente</th>
                <th className="py-2.5 px-4">Tipo de Operación</th>
                <th className="py-2.5 px-4 text-right">Total</th>
                <th className="py-2.5 pl-4 text-right">Acción Fiscal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 pr-4"><div className="h-4 w-20 rounded bg-muted/60" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-32 rounded bg-muted/60" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-24 rounded bg-muted/60" /></td>
                    <td className="py-3 px-4 text-right"><div className="ml-auto h-4 w-16 rounded bg-muted/60" /></td>
                    <td className="py-3 pl-4 text-right"><div className="ml-auto h-7 w-24 rounded bg-muted/60" /></td>
                  </tr>
                ))
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                    {search ? "No se encontraron ventas con ese criterio." : "¡Excelente! No hay ventas directas pendientes de facturar."}
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const isEmitting = emittingId === sale.id
                  return (
                    <tr key={sale.id} className="transition-colors hover:bg-muted/30">
                      <td className="py-3 pr-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(sale.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-foreground text-xs sm:text-sm">
                          {sale.customer_name || "Consumidor Final"}
                        </div>
                        {sale.customer_doc_number && (
                          <div className="text-[11px] text-muted-foreground">
                            Doc: {sale.customer_doc_number}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        {sale.work_order_id ? (
                          <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-500">
                            Cobro Orden de Trabajo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            Venta Mostrador
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-foreground whitespace-nowrap">
                        ${sale.total.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 pl-4 text-right whitespace-nowrap">
                        {onEmitInvoice && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!!emittingId}
                            onClick={() => onEmitInvoice("sale", sale.id)}
                            className="text-xs h-7 gap-1 border-primary/30 text-primary hover:bg-primary/10 shadow-sm"
                          >
                            {isEmitting ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <FileText className="h-3 w-3" />
                            )}
                            <span>{isEmitting ? "Emitiendo..." : "Facturar AFIP"}</span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/40 text-xs font-semibold text-muted-foreground">
                <th className="py-2.5 pr-4">N° Orden</th>
                <th className="py-2.5 px-4">Fecha</th>
                <th className="py-2.5 px-4">Cliente</th>
                <th className="py-2.5 px-4 text-center">Estado</th>
                <th className="py-2.5 px-4 text-right">Total</th>
                <th className="py-2.5 pl-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 pr-4"><div className="h-4 w-16 rounded bg-muted/60" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-20 rounded bg-muted/60" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-28 rounded bg-muted/60" /></td>
                    <td className="py-3 px-4 text-center"><div className="mx-auto h-5 w-20 rounded bg-muted/60" /></td>
                    <td className="py-3 px-4 text-right"><div className="ml-auto h-4 w-16 rounded bg-muted/60" /></td>
                    <td className="py-3 pl-4 text-right"><div className="ml-auto h-7 w-28 rounded bg-muted/60" /></td>
                  </tr>
                ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                    {search ? "No se encontraron órdenes con ese criterio." : "¡Excelente! No hay órdenes de trabajo pendientes de facturar."}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const statusInfo = orderStatusLabels[order.status] || {
                    label: order.status,
                    className: "bg-muted text-muted-foreground",
                  }
                  const isEmitting = emittingId === order.id
                  return (
                    <tr key={order.id} className="transition-colors hover:bg-muted/30">
                      <td className="py-3 pr-4 font-mono font-medium text-xs text-foreground whitespace-nowrap">
                        {order.order_number}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-foreground text-xs sm:text-sm">
                          {order.customer_name || "Cliente sin registrar"}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 ${statusInfo.className}`}>
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-foreground whitespace-nowrap">
                        ${order.total.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 pl-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {onEmitInvoice && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!!emittingId}
                              onClick={() => onEmitInvoice("work_order", order.id)}
                              className="text-xs h-7 gap-1 border-primary/30 text-primary hover:bg-primary/10 shadow-sm"
                            >
                              {isEmitting ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <FileText className="h-3 w-3" />
                              )}
                              <span>{isEmitting ? "Emitiendo..." : "Facturar AFIP"}</span>
                            </Button>
                          )}
                          <Link
                            to={`/orders/${order.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors p-1"
                            title="Ver detalle de orden"
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
