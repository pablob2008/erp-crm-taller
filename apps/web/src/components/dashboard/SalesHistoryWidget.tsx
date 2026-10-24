import { useState, useMemo } from "react"
import { Printer, ShoppingBag, FileText, CheckCircle2, Loader2 } from "lucide-react"
import type { SalesHistoryItem } from "@/lib/services/dashboard"
import { Badge } from "@/components/ui/badge"
import { PriceDisplay } from "@/components/ui/price-display"
import { PaymentMethodBadge } from "@/components/ui/payment-method-badge"
import { SearchInput } from "@/components/ui/input"
import { formatDateTime } from "@/lib/formatters"

interface SalesHistoryWidgetProps {
  sales: SalesHistoryItem[]
  loading?: boolean
  onReprint: (saleId: string) => void
  reprintingId?: string | null
  onEmitInvoice?: (saleId: string) => Promise<void>
  emittingId?: string | null
}

export function SalesHistoryWidget({
  sales,
  loading = false,
  onReprint,
  reprintingId,
  onEmitInvoice,
  emittingId,
}: SalesHistoryWidgetProps) {
  const [search, setSearch] = useState("")

  const filteredSales = useMemo(() => {
    if (!search.trim()) return sales
    const term = search.toLowerCase()
    return sales.filter((sale) => {
      const ticketId = `TKT-${sale.id.slice(0, 8)}`.toLowerCase()
      const cust = (sale.customer_name || "").toLowerCase()
      const doc = (sale.customer_doc_number || "").toLowerCase()
      const invNum = (sale.invoice_number || "").toLowerCase()
      const cae = (sale.cae || "").toLowerCase()
      return (
        ticketId.includes(term) ||
        cust.includes(term) ||
        doc.includes(term) ||
        invNum.includes(term) ||
        cae.includes(term)
      )
    })
  }, [sales, search])

  return (
    <div className="flex flex-col rounded-2xl border border-border/40 bg-background/40 p-5 shadow-sm backdrop-blur-md">
      {/* Header + Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-primary/10 p-2 text-primary border border-primary/20">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Comprobantes de Venta y Mostrador</h3>
            <p className="text-xs text-muted-foreground">
              Tickets comerciales emitidos en el local (reimprimibles en Ticket X o Factura C)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
          <div className="w-full sm:w-60">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por Ticket, cliente o DNI..."
              className="h-8 text-xs"
            />
          </div>
          <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">
            {sales.length} comprobante{sales.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/40 text-xs font-semibold text-muted-foreground">
              <th className="py-2.5 pr-4">Ticket / Fecha</th>
              <th className="py-2.5 px-4">Cliente / Receptor</th>
              <th className="py-2.5 px-4">Origen</th>
              <th className="py-2.5 px-4">Medio de Pago</th>
              <th className="py-2.5 px-4 text-right">Total</th>
              <th className="py-2.5 px-4 text-center">Estado Fiscal</th>
              <th className="py-2.5 pl-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3 pr-4"><div className="h-4 w-28 rounded bg-muted/60" /></td>
                  <td className="py-3 px-4"><div className="h-4 w-32 rounded bg-muted/60" /></td>
                  <td className="py-3 px-4"><div className="h-4 w-20 rounded bg-muted/60" /></td>
                  <td className="py-3 px-4"><div className="h-4 w-16 rounded bg-muted/60" /></td>
                  <td className="py-3 px-4 text-right"><div className="ml-auto h-4 w-16 rounded bg-muted/60" /></td>
                  <td className="py-3 px-4 text-center"><div className="mx-auto h-5 w-24 rounded bg-muted/60" /></td>
                  <td className="py-3 pl-4 text-right"><div className="ml-auto h-8 w-28 rounded bg-muted/60" /></td>
                </tr>
              ))
            ) : filteredSales.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-muted-foreground">
                  {search
                    ? "No se encontraron comprobantes con ese criterio de búsqueda."
                    : "No se registraron comprobantes de venta en el período seleccionado."}
                </td>
              </tr>
            ) : (
              filteredSales.map((sale) => {
                const isReprinting = reprintingId === sale.id
                const isEmitting = emittingId === sale.id
                const ticketNumber = `TKT-${sale.id.slice(0, 8).toUpperCase()}`

                return (
                  <tr key={sale.id} className="transition-colors hover:bg-muted/30">
                    {/* Ticket / Fecha */}
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-xs text-foreground">
                        #{ticketNumber}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {formatDateTime(sale.created_at)}
                      </div>
                    </td>

                    {/* Cliente */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground text-xs sm:text-sm">
                        {sale.customer_name || "Consumidor Final"}
                      </div>
                      {sale.customer_doc_number && (
                        <div className="text-[11px] text-muted-foreground font-mono">
                          Doc: {sale.customer_doc_number}
                        </div>
                      )}
                    </td>

                    {/* Origen (Mostrador vs Taller) */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {sale.work_order_id ? (
                        <Badge variant="info" size="sm">
                          Taller + Mostrador
                        </Badge>
                      ) : (
                        <Badge variant="outline" size="sm">
                          Mostrador
                        </Badge>
                      )}
                    </td>

                    {/* Medio de Pago */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <PaymentMethodBadge method={sale.payment_method} variant="inline" />
                    </td>

                    {/* Total */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <PriceDisplay amount={sale.total} size="sm" />
                    </td>

                    {/* Estado Fiscal */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {sale.status === "voided" ? (
                        <Badge variant="destructive" size="sm">
                          Anulado
                        </Badge>
                      ) : sale.cae ? (
                        <Badge variant="success" size="sm" className="gap-1 font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Factura C</span>
                        </Badge>
                      ) : (
                        <Badge variant="muted" size="sm">
                          Ticket X (No fiscal)
                        </Badge>
                      )}
                    </td>

                    {/* Acciones: Reimprimir + Facturar */}
                    <td className="py-3 pl-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botón Facturar AFIP (si todavía no se facturó) */}
                        {!sale.cae && sale.status !== "voided" && onEmitInvoice && (
                          <button
                            type="button"
                            onClick={() => onEmitInvoice(sale.id)}
                            disabled={isEmitting || !!emittingId}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary shadow-sm hover:bg-primary/20 disabled:opacity-50 transition-colors"
                            title="Emitir Factura C oficial ante AFIP"
                          >
                            {isEmitting ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <FileText className="h-3.5 w-3.5" />
                            )}
                            <span>{isEmitting ? "Facturando..." : "Facturar"}</span>
                          </button>
                        )}

                        {/* Botón Reimprimir (Siempre disponible) */}
                        <button
                          type="button"
                          onClick={() => onReprint(sale.id)}
                          disabled={isReprinting}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-border/50 bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition-colors"
                          title={sale.cae ? "Reimprimir Factura C Oficial con QR" : "Reimprimir Ticket X No Fiscal"}
                        >
                          <Printer className="h-3.5 w-3.5" />
                          <span>{isReprinting ? "Cargando..." : "Reimprimir"}</span>
                        </button>
                      </div>
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
