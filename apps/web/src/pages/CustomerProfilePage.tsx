import { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useSupabase } from "@/context/SupabaseProvider"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  Users,
  Wrench,
  DollarSign,
  CreditCard,
  Calendar,
  MessageCircle,
  Mail,
  ExternalLink,
  FileText,
  AlertCircle,
  Loader2,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  fetchCustomerById,
  fetchCustomerWorkOrders,
  fetchCustomerFinancials,
  updateCustomer,
  type Customer,
  type CustomerWorkOrder,
  type CustomerFinancials,
} from "@/lib/services/customers"
import { CustomerForm, type CustomerFormData } from "@/components/customers/CustomerForm"

const STATUS_STYLE: Record<
  string,
  { bg: string; border: string; text: string; dot: string; label: string }
> = {
  received: {
    bg: "bg-kpi-blue/10",
    border: "border-kpi-blue/30",
    text: "text-kpi-blue",
    dot: "bg-kpi-blue",
    label: "Recibido",
  },
  waiting_client: {
    bg: "bg-kpi-amber/10",
    border: "border-kpi-amber/30",
    text: "text-kpi-amber",
    dot: "bg-kpi-amber",
    label: "Esp. Cliente",
  },
  waiting_parts: {
    bg: "bg-kpi-red/10",
    border: "border-kpi-red/30",
    text: "text-kpi-red",
    dot: "bg-kpi-red",
    label: "Esp. Repuesto",
  },
  ready_for_pickup: {
    bg: "bg-kpi-green/10",
    border: "border-kpi-green/30",
    text: "text-kpi-green",
    dot: "bg-kpi-green",
    label: "Listo ✓",
  },
  quotation: {
    bg: "bg-kpi-amber/10",
    border: "border-kpi-amber/30",
    text: "text-kpi-amber",
    dot: "bg-kpi-amber",
    label: "Cotización",
  },
  delivered: {
    bg: "bg-muted/40",
    border: "border-border/30",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
    label: "Entregado",
  },
  cancelled: {
    bg: "bg-kpi-red/10",
    border: "border-kpi-red/30",
    text: "text-kpi-red",
    dot: "bg-kpi-red",
    label: "Cancelado",
  },
}

const DEFAULT_STATUS_STYLE = {
  bg: "bg-muted/30",
  border: "border-border/30",
  text: "text-muted-foreground",
  dot: "bg-muted-foreground",
  label: "Desconocido",
}

function buildWhatsAppUrl(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  return `https://wa.me/${digits}`
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—"
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export default function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { supabase } = useSupabase()
  const { toast } = useToast()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [workOrders, setWorkOrders] = useState<CustomerWorkOrder[]>([])
  const [financials, setFinancials] = useState<CustomerFinancials | null>(null)

  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProfileData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [customerData, ordersData, finData] = await Promise.all([
        fetchCustomerById(supabase, id),
        fetchCustomerWorkOrders(supabase, id),
        fetchCustomerFinancials(supabase, id),
      ])
      setCustomer(customerData)
      setWorkOrders(ordersData)
      setFinancials(finData)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cargar el perfil del cliente."
      console.error(err)
      setError(msg)
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [id, supabase, toast])

  useEffect(() => {
    loadProfileData()
  }, [loadProfileData])

  const handleUpdateIdentity = async (formData: CustomerFormData) => {
    if (!customer) return
    setUpdating(true)
    try {
      const updated = await updateCustomer(supabase, customer.id, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        tax_id: formData.tax_id,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
      })
      setCustomer(updated)
      toast({
        title: "Identidad actualizada",
        description: "Los datos del cliente se guardaron correctamente.",
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al actualizar los datos."
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary opacity-80" />
        <p className="text-sm text-muted-foreground">Cargando perfil 360° del cliente...</p>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="p-3 rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-lg font-bold">No se encontró el cliente</h3>
          <p className="text-sm text-muted-foreground">
            {error || "El cliente especificado no existe o fue eliminado."}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/customers")} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Volver al Directorio
        </Button>
      </div>
    )
  }

  const orderCount = workOrders.length
  const lifetimeValue = financials?.lifetimeValue ?? 0
  const isVip = orderCount >= 5 || lifetimeValue >= 100000
  const isActive = orderCount > 0 || lifetimeValue > 0

  return (
    <div className="relative space-y-6 pb-12">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-10 -left-10 w-80 h-80 rounded-full bg-kpi-blue/6 blur-3xl -z-10" />
      <div className="pointer-events-none absolute top-60 right-0 w-64 h-64 rounded-full bg-kpi-amber/5 blur-3xl -z-10" />

      {/* Top Navigation & Profile Header */}
      <div className="flex flex-col gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate("/customers")}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group mb-2"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Volver al Directorio
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-background/40 border border-border/40 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary shrink-0 shadow-inner">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {customer.first_name} {customer.last_name}
                </h1>
                {isVip ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-kpi-amber bg-kpi-amber/10 border border-kpi-amber/30">
                    ★ VIP
                  </span>
                ) : isActive ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-kpi-blue bg-kpi-blue/10 border border-kpi-blue/30">
                    Cliente Activo
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-muted-foreground bg-muted/40 border border-border/40">
                    Cliente Casual
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                {customer.tax_id && (
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> DNI/CUIT: {customer.tax_id}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Cliente desde {formatDate(customer.created_at)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {customer.phone && (
              <a
                href={buildWhatsAppUrl(customer.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-kpi-green/15 text-kpi-green border border-kpi-green/30 hover:bg-kpi-green/25 transition-all shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
            )}
            {customer.email && (
              <a
                href={`mailto:${customer.email}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-kpi-blue/15 text-kpi-blue border border-kpi-blue/30 hover:bg-kpi-blue/25 transition-all shadow-sm"
              >
                <Mail className="w-4 h-4" />
                Email
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Identity (Left) & Workshop (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Identity Panel (lg: 5 cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="rounded-2xl p-5 bg-background/40 border border-border/40 backdrop-blur-md shadow-sm h-full flex flex-col">
            <div className="flex items-center gap-2.5 pb-4 border-b border-border/30 mb-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base">Identidad del Cliente</h3>
                <p className="text-xs text-muted-foreground">Datos personales y de contacto editables</p>
              </div>
            </div>

            <div className="flex-1 pt-2">
              <CustomerForm
                initialData={{
                  first_name: customer.first_name,
                  last_name: customer.last_name,
                  tax_id: customer.tax_id,
                  phone: customer.phone,
                  email: customer.email,
                  address: customer.address,
                }}
                onSubmit={handleUpdateIdentity}
                loading={updating}
                submitLabel="Guardar Cambios"
                showCancel={false}
              />
            </div>
          </div>
        </div>

        {/* Workshop Panel (lg: 7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="rounded-2xl p-5 bg-background/40 border border-border/40 backdrop-blur-md shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-border/30 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-kpi-blue/10 text-kpi-blue border border-kpi-blue/20">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Órdenes de Trabajo</h3>
                  <p className="text-xs text-muted-foreground">Historial técnico en taller</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-background/60 border border-border/40 text-muted-foreground">
                {workOrders.length} {workOrders.length === 1 ? "orden" : "órdenes"}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[460px] pr-1 space-y-3">
              {workOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                  <Wrench className="w-10 h-10 opacity-20" />
                  <p className="text-sm font-medium">No hay órdenes de trabajo para este cliente.</p>
                </div>
              ) : (
                workOrders.map((wo) => {
                  const style = STATUS_STYLE[wo.status] || DEFAULT_STATUS_STYLE
                  const hasDebt = (wo.balance || 0) > 0

                  return (
                    <div
                      key={wo.id}
                      onClick={() => navigate(`/orders/${wo.id}`)}
                      className="group p-4 rounded-xl border border-border/30 bg-background/30 hover:bg-background/60 hover:border-primary/30 transition-all cursor-pointer shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted/60 text-foreground">
                            #{wo.order_number}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${style.bg} ${style.border} ${style.text}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                            {style.label}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(wo.created_at)}
                          </span>
                        </div>

                        <div className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                          {wo.device_brand} {wo.device_model}
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {wo.reported_problem || "Sin detalle de problema"}
                        </p>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/20">
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Presupuesto</div>
                          <div className="text-sm font-bold text-foreground">
                            ${formatCurrency(wo.estimated_cost || 0)}
                          </div>
                        </div>

                        {hasDebt && (
                          <div className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-kpi-red/10 text-kpi-red border border-kpi-red/20">
                            Resta: ${formatCurrency(wo.balance)}
                          </div>
                        )}

                        <div className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all hidden sm:block">
                          <ExternalLink className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Panel (Full Width) */}
      <div className="rounded-2xl p-5 bg-background/40 border border-border/40 backdrop-blur-md shadow-sm space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-border/30">
          <div className="p-2 rounded-xl bg-kpi-green/10 text-kpi-green border border-kpi-green/20">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base">Panel Financiero</h3>
            <p className="text-xs text-muted-foreground">
              Total gastado, saldos pendientes y movimientos de caja registrados
            </p>
          </div>
        </div>

        {/* KPI Mini-Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-kpi-green/5 border border-kpi-green/20 backdrop-blur-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-kpi-green/15 text-kpi-green border border-kpi-green/30 shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Gastado (LTV)</p>
              <h4 className="text-2xl font-bold text-kpi-green tracking-tight">
                ${formatCurrency(financials?.lifetimeValue ?? 0)}
              </h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Ventas y operaciones cerradas
              </p>
            </div>
          </div>

          <div
            className={`p-4 rounded-xl border backdrop-blur-sm flex items-center gap-4 ${
              (financials?.pendingBalance ?? 0) > 0
                ? "bg-kpi-amber/10 border-kpi-amber/30 text-kpi-amber"
                : "bg-background/40 border-border/30 text-muted-foreground"
            }`}
          >
            <div
              className={`p-3 rounded-xl shrink-0 border ${
                (financials?.pendingBalance ?? 0) > 0
                  ? "bg-kpi-amber/20 text-kpi-amber border-kpi-amber/40"
                  : "bg-muted/30 text-muted-foreground border-border/30"
              }`}
            >
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium opacity-80">Saldo Pendiente</p>
              <h4 className="text-2xl font-bold tracking-tight">
                ${formatCurrency(financials?.pendingBalance ?? 0)}
              </h4>
              <p className="text-[11px] opacity-70 mt-0.5">
                {(financials?.pendingBalance ?? 0) > 0
                  ? "Cobro adeudado en órdenes abiertas"
                  : "Sin saldo deudor pendiente"}
              </p>
            </div>
          </div>
        </div>

        {/* Cash Movements Table */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">
              Movimientos de Caja Vinculados
            </h4>
            <span className="text-xs text-muted-foreground">
              {financials?.movements.length || 0} movimientos registrados
            </span>
          </div>

          {!financials || financials.movements.length === 0 ? (
            <div className="py-12 border border-border/20 rounded-xl flex flex-col items-center justify-center text-muted-foreground gap-1.5">
              <DollarSign className="w-8 h-8 opacity-20" />
              <p className="text-sm">No se encontraron movimientos de caja vinculados a este cliente.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/30">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/40 uppercase tracking-wider border-b border-border/30">
                  <tr>
                    <th scope="col" className="px-4 py-3">Fecha</th>
                    <th scope="col" className="px-4 py-3">Tipo</th>
                    <th scope="col" className="px-4 py-3">Concepto</th>
                    <th scope="col" className="px-4 py-3">Método</th>
                    <th scope="col" className="px-4 py-3 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20 bg-background/20">
                  {financials.movements.map((mov) => {
                    const isIncome = mov.type === "income"

                    return (
                      <tr key={mov.id} className="hover:bg-background/40 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                          {formatDate(mov.created_at)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${
                              isIncome
                                ? "bg-kpi-green/10 text-kpi-green border-kpi-green/20"
                                : "bg-kpi-red/10 text-kpi-red border-kpi-red/20"
                            }`}
                          >
                            {isIncome ? (
                              <ArrowDownRight className="w-3 h-3" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3" />
                            )}
                            {isIncome ? "Ingreso" : "Egreso"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-foreground max-w-xs truncate">
                          {mov.description || mov.category || "Movimiento general"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground uppercase">
                          {mov.payment_method || "Efectivo"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right font-mono font-bold text-xs">
                          <span className={isIncome ? "text-kpi-green" : "text-kpi-red"}>
                            {isIncome ? "+" : "-"}${formatCurrency(mov.net_amount || 0)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
