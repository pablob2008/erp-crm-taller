import { useState, useMemo } from "react"
import { CheckCircle2, FileText, Printer, Search, ShieldCheck } from "lucide-react"
import type { ArcaInvoice } from "@/lib/services/arca"
import { formatInvoiceFullNumber, getVoucherTypeLabel } from "@/lib/services/arca"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

interface FiscalInvoicesWidgetProps {
  invoices: ArcaInvoice[]
  loading?: boolean
  onReprint?: (saleId: string) => void
  reprintingId?: string | null
}

export function FiscalInvoicesWidget({
  invoices,
  loading = false,
  onReprint,
  reprintingId,
}: FiscalInvoicesWidgetProps) {
  const [search, setSearch] = useState("")

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const filteredInvoices = useMemo(() => {
    if (!search.trim()) return invoices
    const term = search.toLowerCase()
    return invoices.filter((inv) =>
      (inv.cae || "").toLowerCase().includes(term) ||
      (inv.doc_nro || "").includes(term) ||
      String(inv.cbte_nro || "").includes(term)
    )
  }, [invoices, search])

  return (
    <div className="flex flex-col rounded-xl border border-border/40 bg-background/40 p-5 shadow-sm backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-kpi-green/10 p-2 text-kpi-green">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">Comprobantes Fiscales Emitidos (ARCA)</h3>
              <Badge variant="outline" className="border-kpi-green/30 bg-kpi-green/10 text-kpi-green text-[10px] px-2">
                Oficiales
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Facturas electrónicas aprobadas con CAE otorgado por AFIP / ARCA
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por CAE o N°..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-48 pl-8 text-xs bg-background/60"
            />
          </div>
          <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">
            {invoices.length} emitidas
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/40 text-xs font-semibold text-muted-foreground">
              <th className="py-2.5 pr-4">Fecha / Hora</th>
              <th className="py-2.5 px-4">Comprobante</th>
              <th className="py-2.5 px-4">CAE y Vencimiento</th>
              <th className="py-2.5 px-4">Receptor</th>
              <th className="py-2.5 px-4 text-right">Total</th>
              <th className="py-2.5 pl-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3 pr-4"><div className="h-4 w-24 rounded bg-muted/60" /></td>
                  <td className="py-3 px-4"><div className="h-4 w-28 rounded bg-muted/60" /></td>
                  <td className="py-3 px-4"><div className="h-4 w-32 rounded bg-muted/60" /></td>
                  <td className="py-3 px-4"><div className="h-4 w-24 rounded bg-muted/60" /></td>
                  <td className="py-3 px-4 text-right"><div className="ml-auto h-4 w-16 rounded bg-muted/60" /></td>
                  <td className="py-3 pl-4 text-right"><div className="ml-auto h-7 w-20 rounded bg-muted/60" /></td>
                </tr>
              ))
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                  {search ? "No se encontraron facturas con ese criterio." : "No hay comprobantes fiscales emitidos en el historial."}
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => {
                const voucherLabel = getVoucherTypeLabel(inv.cbte_tipo)
                const fullNumber = inv.cbte_nro
                  ? formatInvoiceFullNumber(inv.pto_vta, Number(inv.cbte_nro))
                  : "S/N"
                const isReprinting = Boolean(inv.sale_id && reprintingId === inv.sale_id)

                return (
                  <tr key={inv.id} className="transition-colors hover:bg-muted/30">
                    <td className="py-3 pr-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(inv.created_at)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-primary" />
                        <span className="font-semibold text-xs text-foreground">
                          {voucherLabel} {fullNumber}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        Pto. Venta {inv.pto_vta}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-kpi-green" />
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {inv.cae}
                        </span>
                      </div>
                      {inv.cae_fch_vto && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Vence: {inv.cae_fch_vto}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      <div>
                        {inv.doc_tipo === 99 || inv.doc_nro === "0"
                          ? "Consumidor Final"
                          : `Doc: ${inv.doc_nro}`}
                      </div>
                      <div className="text-[10px]">
                        {inv.doc_tipo === 80 ? "CUIT" : inv.doc_tipo === 96 ? "DNI" : ""}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-foreground whitespace-nowrap">
                      ${Number(inv.imp_total).toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3 pl-4 text-right whitespace-nowrap">
                      {inv.sale_id && onReprint ? (
                        <button
                          type="button"
                          onClick={() => onReprint(inv.sale_id!)}
                          disabled={isReprinting}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition-colors"
                          title="Reimprimir Factura Fiscal"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          <span>{isReprinting ? "Cargando..." : "Reimprimir"}</span>
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
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
