import { Printer, ShoppingBag } from "lucide-react"
import type { SalesHistoryItem } from "@/lib/services/dashboard"
import { Badge } from "@/components/ui/badge"

interface SalesHistoryWidgetProps {
  sales: SalesHistoryItem[]
  loading?: boolean
  onReprint: (saleId: string) => void
  reprintingId?: string | null
}

const paymentMethodLabels: Record<string, string> = {
  cash: "Efectivo",
  qr: "QR",
  card: "Tarjeta",
  transfer: "Transferencia",
}

export function SalesHistoryWidget({
  sales,
  loading = false,
  onReprint,
  reprintingId,
}: SalesHistoryWidgetProps) {
  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="flex flex-col rounded-xl border border-border/40 bg-background/40 p-5 shadow-sm backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Historial de Ventas Directas</h3>
            <p className="text-xs text-muted-foreground">
              Ventas de mostrador y POS registradas en el período
            </p>
          </div>
        </div>
        <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
          {sales.length} venta{sales.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Table */}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/40 text-xs font-semibold text-muted-foreground">
              <th className="py-2.5 pr-4">Fecha / Hora</th>
              <th className="py-2.5 px-4">Cliente</th>
              <th className="py-2.5 px-4">Método</th>
              <th className="py-2.5 px-4 text-right">Total</th>
              <th className="py-2.5 px-4 text-center">Estado Fiscal</th>
              <th className="py-2.5 pl-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3 pr-4">
                    <div className="h-4 w-24 rounded bg-muted/60" />
                  </td>
                  <td className="py-3 px-4">
                    <div className="h-4 w-32 rounded bg-muted/60" />
                  </td>
                  <td className="py-3 px-4">
                    <div className="h-4 w-16 rounded bg-muted/60" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="ml-auto h-4 w-16 rounded bg-muted/60" />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="mx-auto h-5 w-20 rounded bg-muted/60" />
                  </td>
                  <td className="py-3 pl-4 text-right">
                    <div className="ml-auto h-8 w-20 rounded bg-muted/60" />
                  </td>
                </tr>
              ))
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                  No se registraron ventas en el período seleccionado.
                </td>
              </tr>
            ) : (
              sales.map((sale) => {
                const isReprinting = reprintingId === sale.id
                return (
                  <tr key={sale.id} className="transition-colors hover:bg-muted/30">
                    <td className="py-3 pr-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(sale.created_at)}
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
                      {paymentMethodLabels[sale.payment_method] || sale.payment_method}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-foreground whitespace-nowrap">
                      ${sale.total.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {sale.status === "voided" ? (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
                          Anulado
                        </Badge>
                      ) : sale.cae ? (
                        <Badge variant="outline" className="border-kpi-green/40 text-kpi-green bg-kpi-green/10 text-[10px] px-1.5 py-0.5">
                          Facturado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-500/40 text-amber-500 bg-amber-500/10 text-[10px] px-1.5 py-0.5">
                          Sin Facturar
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 pl-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onReprint(sale.id)}
                        disabled={isReprinting}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition-colors"
                        title="Reimprimir Comprobante"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>{isReprinting ? "Cargando..." : "Reimprimir"}</span>
                      </button>
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
