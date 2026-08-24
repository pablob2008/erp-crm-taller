import { useEffect, useState, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useSupabase } from "@/context/SupabaseProvider"
import { Search, MessageCircle, Printer, ArrowRight } from "lucide-react"
import { OrderStatusTabs } from "@/components/orders/OrderStatusTabs"

type WorkOrder = {
  id: string
  order_number: string
  device_brand: string
  device_model: string
  status: string
  estimated_delivery_at: string | null
  customers: {
    first_name: string
    last_name: string
    phone: string | null
  }
}

const STATUS_GROUPS: Record<string, string[]> = {
  all:         [],
  in_workshop: ["received", "waiting_client", "waiting_parts"],
  ready:       ["ready_for_pickup"],
  delivered:   ["delivered"],
}

const STATUS_STYLE: Record<string, { bg: string; border: string; text: string; dot: string; label: string; glow: string; pulse: boolean }> = {
  received:         { bg: "bg-kpi-blue/10",  border: "border-kpi-blue/30",  text: "text-kpi-blue",          dot: "bg-kpi-blue",          glow: "shadow-[0_0_24px_0_hsl(var(--kpi-blue)/0.12)]",   label: "Recibido",      pulse: true  },
  waiting_client:   { bg: "bg-kpi-amber/10", border: "border-kpi-amber/30", text: "text-kpi-amber",         dot: "bg-kpi-amber",         glow: "shadow-[0_0_24px_0_hsl(var(--kpi-amber)/0.12)]",  label: "Esp. Cliente",  pulse: true  },
  waiting_parts:    { bg: "bg-kpi-red/10",   border: "border-kpi-red/30",   text: "text-kpi-red",           dot: "bg-kpi-red",           glow: "shadow-[0_0_24px_0_hsl(var(--kpi-red)/0.12)]",    label: "Esp. Repuesto", pulse: false },
  ready_for_pickup: { bg: "bg-kpi-green/10", border: "border-kpi-green/30", text: "text-kpi-green",         dot: "bg-kpi-green",         glow: "shadow-[0_0_24px_0_hsl(var(--kpi-green)/0.12)]",  label: "Listo \u2713",  pulse: true  },
  quotation:        { bg: "bg-kpi-amber/10", border: "border-kpi-amber/30", text: "text-kpi-amber",         dot: "bg-kpi-amber",         glow: "shadow-[0_0_24px_0_hsl(var(--kpi-amber)/0.12)]",  label: "Cotizaci\u00f3n",  pulse: false },
  delivered:        { bg: "bg-muted/40",      border: "border-border/30",    text: "text-muted-foreground",  dot: "bg-muted-foreground",  glow: "",                                                label: "Entregado",     pulse: false },
  cancelled:        { bg: "bg-kpi-red/10",   border: "border-kpi-red/30",   text: "text-kpi-red",           dot: "bg-kpi-red",           glow: "shadow-[0_0_24px_0_hsl(var(--kpi-red)/0.12)]",    label: "Cancelado",     pulse: false },
}

const DEFAULT_STYLE = { bg: "bg-muted/30", border: "border-border/30", text: "text-muted-foreground", dot: "bg-muted-foreground", glow: "", label: "Desconocido", pulse: false }

function buildWhatsAppUrl(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  return `https://wa.me/${digits}`
}

export default function OrdersPage() {
  const { supabase } = useSupabase()
  const navigate = useNavigate()

  const [searchParams, setSearchParams] = useSearchParams()
  const urlQuery  = searchParams.get("q")      ?? ""
  const urlStatus = searchParams.get("status") ?? "all"

  const [orders, setOrders]   = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)

  const [inputValue, setInputValue] = useState(urlQuery)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setInputValue(urlQuery) }, [urlQuery])

  const handleSearchChange = (value: string) => {
    setInputValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev)
        if (value.trim()) { next.set("q", value.trim()) } else { next.delete("q") }
        return next
      }, { replace: true })
    }, 300)
  }

  const handleStatusChange = (value: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value === "all") { next.delete("status") } else { next.set("status", value) }
      return next
    }, { replace: true })
  }

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true)
      const { data, error } = await supabase
        .from("work_orders")
        .select("id, order_number, device_brand, device_model, status, estimated_delivery_at, customers (first_name, last_name, phone)")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching orders:", error)
      } else {
        const normalized = (data ?? []).map((row: any) => ({
          ...row,
          customers: Array.isArray(row.customers) ? row.customers[0] : row.customers,
        }))
        setOrders(normalized as WorkOrder[])
      }
      setLoading(false)
    }
    fetchOrders()
  }, [supabase])

  const filteredOrders = orders.filter((order) => {
    const statusGroup = STATUS_GROUPS[urlStatus] ?? []
    if (statusGroup.length > 0 && !statusGroup.includes(order.status)) return false
    const q = urlQuery.trim().toLowerCase()
    if (!q) return true
    const c = order.customers ?? { first_name: "", last_name: "", phone: null }
    const haystack = [order.order_number, c.first_name, c.last_name, c.phone ?? "", order.device_brand, order.device_model].join(" ").toLowerCase()
    return haystack.includes(q)
  })

  return (
    <div className="relative space-y-6">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-10 -left-10 w-80 h-80 rounded-full bg-kpi-blue/6 blur-3xl -z-10" />
      <div className="pointer-events-none absolute top-60 right-0 w-64 h-64 rounded-full bg-kpi-amber/5 blur-3xl -z-10" />

      {/* Header + search */}
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Órdenes de Trabajo</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Cargando..." : `${filteredOrders.length} ${filteredOrders.length === 1 ? "orden encontrada" : "órdenes encontradas"}`}
          </p>
        </div>
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            value={inputValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar orden, cliente, dispositivo..."
            className="flex h-9 w-full rounded-full bg-background px-3 py-1 text-sm shadow-neu-inset transition-shadow placeholder:text-muted-foreground focus-visible:outline-none pl-10"
          />
        </div>
      </div>

      {/* Status tabs */}
      <OrderStatusTabs activeTab={urlStatus} onChange={handleStatusChange} />

      {/* Cards */}
      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-4 bg-background/40 border border-border/40 animate-pulse backdrop-blur-md shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-1 self-stretch rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded-full bg-muted" />
                  <div className="h-3 w-48 rounded-full bg-muted" />
                  <div className="h-3 w-36 rounded-full bg-muted" />
                </div>
                <div className="flex gap-2">
                  <div className="h-9 w-9 rounded-full bg-muted" />
                  <div className="h-9 w-9 rounded-full bg-muted" />
                  <div className="h-9 w-9 rounded-full bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-muted-foreground">
          <Search className="w-12 h-12 opacity-15" />
          <p className="font-medium text-base">
            {orders.length === 0 ? "No hay rdenes registradas." : "No se encontraron rdenes con ese filtro."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredOrders.map((order) => {
            const s = STATUS_STYLE[order.status] ?? DEFAULT_STYLE
            const phone = order.customers?.phone

            return (
              <div
                key={order.id}
                className={`group relative rounded-2xl border ${s.border} ${s.bg} ${s.glow} transition-all duration-200 hover:scale-[1.01] hover:brightness-105 overflow-hidden`}
              >
                {/* Left accent bar */}
                <div className={`absolute left-0 inset-y-0 w-1 ${s.dot} rounded-l-2xl`} />

                {/* Shimmer on hover */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-center gap-4 pl-5 pr-4 py-4">
                  {/* Info area (clickable) */}
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`font-mono font-bold text-base ${s.text}`}>{order.order_number}</span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.bg} ${s.border} ${s.text}`}>
                        {s.pulse && <span className={`w-1.5 h-1.5 rounded-full ${s.dot} animate-pulse`} />}
                        {s.label}
                      </span>
                    </div>
                    <p className="mt-1 font-semibold text-sm text-foreground truncate">
                      {order.customers?.first_name} {order.customers?.last_name}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                      <span>
                        <span className="font-medium text-foreground/70">{order.device_brand}</span>{" "}
                        {order.device_model}
                      </span>
                      {order.estimated_delivery_at && (
                        <>
                          <span className="opacity-30">·</span>
                          <span>
                            Entrega:{" "}
                            <span className="font-medium text-foreground/70">
                              {new Date(order.estimated_delivery_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                            </span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {phone && (
                      <a
                        href={buildWhatsAppUrl(phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Abrir WhatsApp"
                        className="flex items-center justify-center w-9 h-9 rounded-full bg-kpi-green/15 text-kpi-green border border-kpi-green/30 hover:bg-kpi-green/25 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order.id}?print=1`) }}
                      title="Imprimir comprobante"
                      className="flex items-center justify-center w-9 h-9 rounded-full bg-kpi-blue/15 text-kpi-blue border border-kpi-blue/30 hover:bg-kpi-blue/25 transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/orders/${order.id}`)}
                      title="Ver detalle"
                      className={`flex items-center justify-center w-9 h-9 rounded-full border ${s.border} ${s.text} ${s.bg} hover:brightness-125 transition-all`}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
