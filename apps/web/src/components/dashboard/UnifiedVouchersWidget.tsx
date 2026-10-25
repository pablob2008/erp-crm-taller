import { useState, useMemo } from "react"
import { Printer, FileText, CheckCircle2, Loader2, Receipt, Wrench, ShoppingBag } from "lucide-react"
import type { SalesHistoryItem, UnbilledOrderItem } from "@/lib/services/dashboard"
import { Badge } from "@/components/ui/badge"
import { PriceDisplay } from "@/components/ui/price-display"
import { PaymentMethodBadge } from "@/components/ui/payment-method-badge"
import { SearchInput } from "@/components/ui/input"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { formatDateTime } from "@/lib/formatters"

export type OriginFilter = "all" | "sales" | "orders"
export type FiscalFilter = "all" | "unbilled" | "invoiced"

interface UnifiedVouchersWidgetProps {
  sales: SalesHistoryItem[]
  unbilledOrders: UnbilledOrderItem[]
  loading?: boolean
  onReprintSale: (saleId: string) => void
  onReprintOrder?: (orderId: string) => void
  reprintingId?: string | null
  onEmitInvoice: (targetType: "sale" | "work_order", targetId: string) => Promise<void>
  emittingId?: string | null
}

interface UnifiedVoucherRow {
  id: string
  targetType: "sale" | "work_order"
  date: string
  identifier: string
  orderNumber?: string | null
  origin: "sale" | "order" | "combined"
  customerName: string
  customerDoc?: string | null
  description?: string
  paymentMethod?: string
  total: number
  balance?: number
  isFiscal: boolean
  isVoided: boolean
  cae?: string | null
  invoiceNumber?: string | null
  isReadyOrDelivered: boolean
}

export function UnifiedVouchersWidget({
  sales,
  unbilledOrders,
  loading = false,
  onReprintSale,
  onReprintOrder,
  reprintingId,
  onEmitInvoice,
  emittingId,
}: UnifiedVouchersWidgetProps) {
  const [search, setSearch] = useState("")
  const [originFilter, setOriginFilter] = useState<OriginFilter>("all")
  const [fiscalFilter, setFiscalFilter] = useState<FiscalFilter>("all")

  // Merge sales and work orders into a single coherent deduplicated list
  const allVouchers = useMemo(() => {
    const list: UnifiedVoucherRow[] = []
    const salesWorkOrderIds = new Set<string>()

    // 1. Process sales
    for (const s of sales) {
      if (s.work_order_id) {
        salesWorkOrderIds.add(s.work_order_id)
      }

      const ticketId = s.ticket_number || `TKT-${s.id.slice(0, 8).toUpperCase()}`
      list.push({
        id: s.id,
        targetType: "sale",
        date: s.created_at,
        identifier: ticketId,
        orderNumber: s.work_order_id ? "Taller" : null,
        origin: s.work_order_id ? "combined" : "sale",
        customerName: s.customer_name || "Consumidor Final",
        customerDoc: s.customer_doc_number,
        paymentMethod: s.payment_method,
        total: s.total,
        isFiscal: Boolean(s.cae),
        isVoided: s.status === "voided",
        cae: s.cae,
        invoiceNumber: s.invoice_number,
        isReadyOrDelivered: true,
      })
    }

    // 2. Process work orders (skipping any order that was already delivered via a POS sale)
    for (const o of unbilledOrders) {
      if (salesWorkOrderIds.has(o.id)) {
        continue // Deduplicated: already represented in the combined sale row!
      }

      const device = [o.device_brand, o.device_model].filter(Boolean).join(" ")
      list.push({
        id: o.id,
        targetType: "work_order",
        date: o.created_at,
        identifier: o.order_number,
        orderNumber: o.order_number,
        origin: "order",
        customerName: o.customer_name || "Cliente Taller",
        description: device || "Servicio Técnico",
        total: o.total,
        balance: o.balance,
        isFiscal: false,
        isVoided: false,
        isReadyOrDelivered: o.status === "ready_for_pickup" || o.status === "delivered",
      })
    }

    // Sort descending by date
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [sales, unbilledOrders])

  // Apply filters and search
  const filteredVouchers = useMemo(() => {
    return allVouchers.filter((v) => {
      // Origin filter
      if (originFilter === "sales" && v.origin === "order") return false
      if (originFilter === "orders" && v.origin === "sale") return false

      // Fiscal filter
      if (fiscalFilter === "invoiced" && !v.isFiscal) return false
      if (fiscalFilter === "unbilled" && v.isFiscal) return false

      // Search
      if (search.trim()) {
        const term = search.toLowerCase()
        const idMatch = v.identifier.toLowerCase().includes(term)
        const orderMatch = (v.orderNumber || "").toLowerCase().includes(term)
        const custMatch = v.customerName.toLowerCase().includes(term)
        const docMatch = (v.customerDoc || "").toLowerCase().includes(term)
        const caeMatch = (v.cae || "").toLowerCase().includes(term)
        const invMatch = (v.invoiceNumber || "").toLowerCase().includes(term)
        if (!idMatch && !orderMatch && !custMatch && !docMatch && !caeMatch && !invMatch) {
          return false
        }
      }

      return true
    })
  }, [allVouchers, originFilter, fiscalFilter, search])

  const totalUnbilledCount = allVouchers.filter((v) => !v.isFiscal && !v.isVoided).length
  const totalInvoicedCount = allVouchers.filter((v) => v.isFiscal).length

  return (
    <div className="flex flex-col rounded-2xl border border-border/40 bg-background/40 p-5 shadow-sm backdrop-blur-md space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/30">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-primary/10 p-2 text-primary border border-primary/20">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              Comprobantes y Facturación ARCA
            </h3>
            <p className="text-xs text-muted-foreground">
              Ventas de mostrador y órdenes de taller del período (Tickets X y Facturas C oficiales)
            </p>
          </div>
        </div>

        <div className="w-full sm:w-64">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por Ticket, orden o cliente..."
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* Filter Pills Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Origin Selector */}
        <SegmentedControl<OriginFilter>
          size="sm"
          value={originFilter}
          onChange={setOriginFilter}
          options={[
            { value: "all", label: "Todas las Operaciones" },
            {
              value: "sales",
              label: "Ventas Mostrador",
              icon: <ShoppingBag className="w-3.5 h-3.5" />,
              accent: "purple",
            },
            {
              value: "orders",
              label: "Órdenes Taller",
              icon: <Wrench className="w-3.5 h-3.5" />,
              accent: "blue",
            },
          ]}
        />

        {/* Fiscal Status Selector */}
        <SegmentedControl<FiscalFilter>
          size="sm"
          value={fiscalFilter}
          onChange={setFiscalFilter}
          options={[
            { value: "all", label: "Todos los Estados" },
            {
              value: "unbilled",
              label: "Solo Sin Facturar (X)",
              accent: "amber",
              badge:
                totalUnbilledCount > 0 ? (
                  <Badge variant="warning" size="sm" className="font-bold">
                    {totalUnbilledCount}
                  </Badge>
                ) : undefined,
            },
            {
              value: "invoiced",
              label: "Facturados Oficiales (C)",
              accent: "green",
              badge:
                totalInvoicedCount > 0 ? (
                  <Badge variant="success" size="sm" className="font-bold">
                    {totalInvoicedCount}
                  </Badge>
                ) : undefined,
            },
          ]}
        />
      </div>

      {/* ── Mobile View: Stacked GlassCards (< sm) ───────────────────────── */}
      <div className="grid gap-3 sm:hidden">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-muted/40 animate-pulse border border-border/40"
            />
          ))
        ) : filteredVouchers.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            {search
              ? "No se encontraron operaciones con ese criterio."
              : "No hay comprobantes ni órdenes en el período seleccionado."}
          </div>
        ) : (
          filteredVouchers.map((v) => (
            <GlassCard
              key={`m-${v.targetType}-${v.id}`}
              accent={
                v.origin === "combined"
                  ? "blue"
                  : v.origin === "order"
                  ? "purple"
                  : undefined
              }
              accentStripe={v.origin !== "sale"}
              padding="sm"
              className="space-y-3"
            >
              {/* Header row: ID + Origin + Date */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono font-bold text-xs text-foreground">
                    #{v.identifier}
                  </span>
                  {v.origin === "combined" ? (
                    <Badge variant="info" size="sm">
                      Taller + Mostrador
                    </Badge>
                  ) : v.origin === "order" ? (
                    <Badge variant="purple" size="sm">
                      Taller
                    </Badge>
                  ) : (
                    <Badge variant="outline" size="sm">
                      Mostrador
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {formatDateTime(v.date)}
                </span>
              </div>

              {/* Customer + Total */}
              <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/20">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {v.customerName}
                  </p>
                  {v.customerDoc && (
                    <p className="text-[11px] text-muted-foreground font-mono">
                      Doc: {v.customerDoc}
                    </p>
                  )}
                  {v.description && (
                    <p className="text-[10px] text-muted-foreground italic truncate">
                      {v.description}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <PriceDisplay amount={v.total} size="lg" />
                </div>
              </div>

              {/* Fiscal status + Action buttons row */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/20">
                <div>
                  {v.isVoided ? (
                    <Badge variant="destructive" size="sm">
                      Anulado
                    </Badge>
                  ) : v.isFiscal ? (
                    <Badge variant="success" size="sm" className="gap-1 font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Factura C</span>
                    </Badge>
                  ) : (
                    <Badge variant="muted" size="sm">
                      Ticket X (No fiscal)
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {!v.isFiscal && !v.isVoided && (
                    <Button
                      size="sm"
                      onClick={() => onEmitInvoice(v.targetType, v.id)}
                      disabled={emittingId === v.id || !!emittingId}
                      className="h-8 px-2.5 text-xs gap-1.5 rounded-xl"
                    >
                      {emittingId === v.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <FileText className="w-3 h-3" />
                      )}
                      <span>Facturar</span>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (v.targetType === "sale") onReprintSale(v.id)
                      else if (onReprintOrder) onReprintOrder(v.id)
                    }}
                    disabled={reprintingId === v.id}
                    className="h-8 px-2.5 text-xs gap-1.5 rounded-xl border-border/50"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Imprimir</span>
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {/* ── Desktop & Tablet View: 7-column Table (>= sm) ────────────────── */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/40 text-xs font-semibold text-muted-foreground">
              <th className="py-2.5 pr-4">Comprobante / Fecha</th>
              <th className="py-2.5 px-4">Origen</th>
              <th className="py-2.5 px-4">Cliente / Receptor</th>
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
                  <td className="py-3 px-4"><div className="h-4 w-20 rounded bg-muted/60" /></td>
                  <td className="py-3 px-4"><div className="h-4 w-32 rounded bg-muted/60" /></td>
                  <td className="py-3 px-4"><div className="h-4 w-16 rounded bg-muted/60" /></td>
                  <td className="py-3 px-4 text-right"><div className="ml-auto h-4 w-16 rounded bg-muted/60" /></td>
                  <td className="py-3 px-4 text-center"><div className="mx-auto h-5 w-24 rounded bg-muted/60" /></td>
                  <td className="py-3 pl-4 text-right"><div className="ml-auto h-8 w-28 rounded bg-muted/60" /></td>
                </tr>
              ))
            ) : filteredVouchers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-xs text-muted-foreground">
                  {search
                    ? "No se encontraron operaciones con ese criterio de búsqueda."
                    : "No hay comprobantes ni órdenes en el período y filtros seleccionados."}
                </td>
              </tr>
            ) : (
              filteredVouchers.map((v) => {
                const isReprinting = reprintingId === v.id
                const isEmitting = emittingId === v.id

                return (
                  <tr key={`${v.targetType}-${v.id}`} className="transition-colors hover:bg-muted/30">
                    {/* Comprobante / Fecha */}
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-xs text-foreground">
                        #{v.identifier}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {formatDateTime(v.date)}
                      </div>
                    </td>

                    {/* Origen */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {v.origin === "combined" ? (
                        <Badge variant="info" size="sm">
                          Taller + Mostrador
                        </Badge>
                      ) : v.origin === "order" ? (
                        <Badge variant="purple" size="sm">
                          Taller (Servicio)
                        </Badge>
                      ) : (
                        <Badge variant="outline" size="sm">
                          Mostrador
                        </Badge>
                      )}
                    </td>

                    {/* Cliente */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground text-xs sm:text-sm">
                        {v.customerName}
                      </div>
                      {v.customerDoc && (
                        <div className="text-[11px] text-muted-foreground font-mono">
                          Doc: {v.customerDoc}
                        </div>
                      )}
                      {v.description && (
                        <div className="text-[10px] text-muted-foreground italic truncate max-w-xs">
                          {v.description}
                        </div>
                      )}
                    </td>

                    {/* Medio de Pago */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {v.paymentMethod ? (
                        <PaymentMethodBadge method={v.paymentMethod} variant="inline" />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Total */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <PriceDisplay amount={v.total} size="sm" />
                    </td>

                    {/* Estado Fiscal */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {v.isVoided ? (
                        <Badge variant="destructive" size="sm">
                          Anulado
                        </Badge>
                      ) : v.isFiscal ? (
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

                    {/* Acciones */}
                    <td className="py-3 pl-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botón Facturar AFIP si aún no está facturado */}
                        {!v.isFiscal && !v.isVoided && (
                          <button
                            type="button"
                            onClick={() => onEmitInvoice(v.targetType, v.id)}
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

                        {/* Botón Reimprimir */}
                        <button
                          type="button"
                          onClick={() => {
                            if (v.targetType === "sale") {
                              onReprintSale(v.id)
                            } else if (onReprintOrder) {
                              onReprintOrder(v.id)
                            }
                          }}
                          disabled={isReprinting}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-border/50 bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition-colors"
                          title={
                            v.isFiscal
                              ? "Reimprimir Factura C Oficial con QR"
                              : "Reimprimir Comprobante X No Fiscal"
                          }
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
