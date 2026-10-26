import { useEffect, useState, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useSupabase } from "@/context/SupabaseProvider"
import { MessageCircle, Printer, ArrowRight, ClipboardList } from "lucide-react"
import { OrderStatusTabs } from "@/components/orders/OrderStatusTabs"
import { PageHeader } from "@/components/ui/page-header"
import { SearchInput } from "@/components/ui/input"
import { OrderStatusBadge } from "@/components/ui/order-status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { GlassCard } from "@/components/ui/glass-card"
import { CardSkeleton } from "@/components/ui/skeleton"
import { getOrderStatusConfig } from "@/lib/constants/order-status"

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
  all: [],
  in_workshop: ["received", "waiting_client", "waiting_parts"],
  ready: ["ready_for_pickup"],
  delivered: ["delivered"],
}

function buildWhatsAppUrl(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  return `https://wa.me/${digits}`
}

export default function OrdersPage() {
  const { supabase } = useSupabase()
  const navigate = useNavigate()

  const [searchParams, setSearchParams] = useSearchParams()
  const urlQuery = searchParams.get("q") ?? ""
  const urlStatus = searchParams.get("status") ?? "in_workshop"

  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)

  const [inputValue, setInputValue] = useState(urlQuery)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setInputValue(urlQuery)
  }, [urlQuery])

  const handleSearchChange = (value: string) => {
    setInputValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (value.trim()) {
            next.set("q", value.trim())
          } else {
            next.delete("q")
          }
          return next
        },
        { replace: true }
      )
    }, 300)
  }

  const handleStatusChange = (value: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value === "in_workshop") {
          next.delete("status")
        } else {
          next.set("status", value)
        }
        return next
      },
      { replace: true }
    )
  }

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true)
      const { data, error } = await supabase
        .from("work_orders")
        .select(
          "id, order_number, device_brand, device_model, status, estimated_delivery_at, customers (first_name, last_name, phone)"
        )
        .order("created_at", { ascending: false })

      if (!error && data) {
        setOrders(data as unknown as WorkOrder[])
      }
      setLoading(false)
    }
    fetchOrders()
  }, [supabase])

  const filteredOrders = orders.filter((order) => {
    const statusGroup = STATUS_GROUPS[urlStatus] ?? []
    if (statusGroup.length > 0 && !statusGroup.includes(order.status)) return false

    if (!urlQuery.trim()) return true
    const q = urlQuery.toLowerCase()
    const num = order.order_number?.toLowerCase() ?? ""
    const brand = order.device_brand?.toLowerCase() ?? ""
    const model = order.device_model?.toLowerCase() ?? ""
    const first = order.customers?.first_name?.toLowerCase() ?? ""
    const last = order.customers?.last_name?.toLowerCase() ?? ""
    const phone = order.customers?.phone?.toLowerCase() ?? ""

    return (
      num.includes(q) ||
      brand.includes(q) ||
      model.includes(q) ||
      first.includes(q) ||
      last.includes(q) ||
      phone.includes(q)
    )
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Universal Page Header with Search */}
      <PageHeader
        title="Órdenes de Trabajo"
        subtitle={
          loading
            ? undefined
            : `${filteredOrders.length} ${
                filteredOrders.length === 1 ? "orden encontrada" : "órdenes encontradas"
              }`
        }
        actions={
          <div className="w-full sm:w-72">
            <SearchInput
              value={inputValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Buscar orden, cliente, dispositivo..."
            />
          </div>
        }
      />

      {/* Status tabs */}
      <OrderStatusTabs activeTab={urlStatus} onChange={handleStatusChange} />

      {/* Cards list con Shimmer Skeletons y animación de entrada suave */}
      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-8 h-8" />}
          title={
            orders.length === 0
              ? "No hay órdenes registradas"
              : "No se encontraron órdenes con ese filtro"
          }
          description="Probá ajustando el término de búsqueda o cambiando la pestaña de estado."
        />
      ) : (
        <div className="grid gap-3 animate-in fade-in-50 slide-in-from-bottom-2 duration-300 ease-out">
          {filteredOrders.map((order) => {
            const config = getOrderStatusConfig(order.status)
            const phone = order.customers?.phone

            return (
              <GlassCard
                key={order.id}
                accent={config.color}
                accentStripe
                interactive
                padding="none"
              >
                <div className="flex items-center gap-4 pl-5 pr-4 py-4">
                  {/* Info area (clickable) */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`font-mono font-bold text-base ${config.text}`}>
                        {order.order_number}
                      </span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="mt-1 font-semibold text-sm text-foreground truncate">
                      {order.customers?.first_name} {order.customers?.last_name}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                      <span>
                        <span className="font-medium text-foreground/70">
                          {order.device_brand}
                        </span>{" "}
                        {order.device_model}
                      </span>
                      {order.estimated_delivery_at && (
                        <>
                          <span className="opacity-30">·</span>
                          <span>
                            Entrega:{" "}
                            <span className="font-medium text-foreground/70">
                              {new Date(order.estimated_delivery_at).toLocaleDateString(
                                "es-AR",
                                { day: "2-digit", month: "short" }
                              )}
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
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/orders/${order.id}?print=1`)
                      }}
                      title="Imprimir comprobante"
                      className="flex items-center justify-center w-9 h-9 rounded-full bg-kpi-blue/15 text-kpi-blue border border-kpi-blue/30 hover:bg-kpi-blue/25 transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/orders/${order.id}`)}
                      title="Ver detalle de orden"
                      className={`flex items-center justify-center w-9 h-9 rounded-full border ${config.border} ${config.text} ${config.bg} hover:brightness-125 transition-all`}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
