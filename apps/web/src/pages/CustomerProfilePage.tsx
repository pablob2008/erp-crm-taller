import { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useSupabase } from "@/context/SupabaseProvider"
import {
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  DollarSign,
  Wrench,
  Clock,
  ExternalLink,
  MessageCircle,
  Pencil,
  ArrowLeft,
  CreditCard,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import {
  fetchCustomerById,
  fetchCustomerWorkOrders,
  fetchCustomerFinancials,
  updateCustomer,
  type Customer,
  type CustomerFinancials,
  type CustomerWorkOrder,
} from "@/lib/services/customers"
import { CustomerForm, type CustomerFormData } from "@/components/customers/CustomerForm"
import { OrderStatusBadge } from "@/components/ui/order-status-badge"
import { KpiMetricCard } from "@/components/ui/kpi-metric-card"
import { PriceDisplay } from "@/components/ui/price-display"
import { Badge } from "@/components/ui/badge"
import { formatPrice, formatDate } from "@/lib/formatters"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function buildWhatsAppUrl(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  return `https://wa.me/${digits}`
}

export default function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { supabase } = useSupabase()
  const { toast } = useToast()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [financials, setFinancials] = useState<CustomerFinancials | null>(null)
  const [workOrders, setWorkOrders] = useState<CustomerWorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const loadData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [customerData, ordersData, finData] = await Promise.all([
        fetchCustomerById(supabase, id),
        fetchCustomerWorkOrders(supabase, id),
        fetchCustomerFinancials(supabase, id),
      ])
      if (!customerData) {
        toast({
          title: "Cliente no encontrado",
          description: "El cliente solicitado no existe o fue eliminado.",
          variant: "destructive",
        })
        navigate("/customers")
        return
      }
      setCustomer(customerData)
      setFinancials(finData)
      setWorkOrders(ordersData)
    } catch (err: unknown) {
      console.error("[CustomerProfile] Error loading:", err)
      toast({
        title: "Error al cargar perfil",
        description: "No se pudieron obtener los datos completos del cliente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [id, supabase, navigate, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

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
      setIsEditOpen(false)
      toast({
        title: "Cliente actualizado",
        description: "Los datos de contacto se guardaron correctamente.",
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
      <div className="space-y-6 animate-pulse">
        <div className="h-28 rounded-2xl bg-muted/40" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 rounded-2xl bg-muted/30" />
          <div className="h-64 md:col-span-2 rounded-2xl bg-muted/30" />
        </div>
      </div>
    )
  }

  if (!customer) return null

  const orderCount = workOrders.length
  const totalSpent = financials?.lifetimeValue || 0
  const isVip = orderCount >= 5 || totalSpent >= 100000
  const isActive = orderCount > 0 && !isVip

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
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group mb-2"
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
                  <Badge variant="warning" className="animate-pulse">
                    ★ VIP
                  </Badge>
                ) : isActive ? (
                  <Badge variant="info">
                    Cliente Activo
                  </Badge>
                ) : (
                  <Badge variant="muted">
                    Cliente Casual
                  </Badge>
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
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-background/50 text-foreground border border-border/40 hover:bg-accent transition-all shadow-sm"
            >
              <Pencil className="w-4 h-4" />
              Editar
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Details Left, Work Orders Right */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact info card */}
        <div className="rounded-2xl p-5 bg-background/40 border border-border/40 backdrop-blur-md shadow-sm h-full flex flex-col">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" /> Datos del Cliente
          </h3>
          <div className="space-y-4 text-sm flex-1">
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Teléfono / WhatsApp</p>
                <p className="font-medium text-foreground">{customer.phone || "No registrado"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Correo Electrónico</p>
                <p className="font-medium text-foreground">{customer.email || "No registrado"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Dirección</p>
                <p className="font-medium text-foreground">{customer.address || "No registrada"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">DNI / CUIT</p>
                <p className="font-medium text-foreground">{customer.tax_id || "Consumidor Final"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Work Orders List Right */}
        <div className="md:col-span-2 rounded-2xl p-5 bg-background/40 border border-border/40 backdrop-blur-md shadow-sm h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Wrench className="w-4 h-4 text-primary" /> Historial de Órdenes
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-background/60 border border-border/40 text-muted-foreground">
              {workOrders.length} {workOrders.length === 1 ? "orden" : "órdenes"}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px] pr-1">
            {workOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border border-dashed border-border/40 rounded-xl">
                <Wrench className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hay órdenes de trabajo registradas para este cliente.</p>
              </div>
            ) : (
              workOrders.map((wo) => {
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
                        <OrderStatusBadge status={wo.status} size="sm" />
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
                          {formatPrice(wo.estimated_cost || 0)}
                        </div>
                      </div>

                      {hasDebt && (
                        <div className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-kpi-red/10 text-kpi-red border border-kpi-red/20">
                          Resta: {formatPrice(wo.balance)}
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

      {/* Financial 360 Section */}
      <div className="rounded-2xl p-5 bg-background/40 border border-border/40 backdrop-blur-md shadow-sm space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-kpi-green/10 text-kpi-green border border-kpi-green/20">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base">Panel Financiero</h3>
            <p className="text-xs text-muted-foreground">
              Total gastado, saldos pendientes y movimientos de caja registrados
            </p>
          </div>
        </div>

        {/* KPI Cards estandarizadas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KpiMetricCard
            title="Total Gastado (LTV)"
            value={financials?.lifetimeValue ?? 0}
            isCurrency
            variant="green"
            icon={<CreditCard className="w-5 h-5" />}
            hint="Ventas y operaciones cerradas de este cliente"
          />

          <KpiMetricCard
            title="Saldo Pendiente"
            value={financials?.pendingBalance ?? 0}
            isCurrency
            variant={(financials?.pendingBalance ?? 0) > 0 ? "amber" : "blue"}
            icon={<DollarSign className="w-5 h-5" />}
            hint={
              (financials?.pendingBalance ?? 0) > 0
                ? "Cobro adeudado en órdenes abiertas"
                : "Sin saldo deudor pendiente"
            }
          />
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
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground uppercase border-b border-border/20">
                  <tr>
                    <th scope="col" className="px-4 py-3">Fecha</th>
                    <th scope="col" className="px-4 py-3">Tipo</th>
                    <th scope="col" className="px-4 py-3">Concepto</th>
                    <th scope="col" className="px-4 py-3">Medio de Pago</th>
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
                          <Badge variant={isIncome ? "success" : "destructive"} size="sm" className="gap-1">
                            {isIncome ? (
                              <ArrowDownRight className="w-3 h-3" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3" />
                            )}
                            {isIncome ? "Ingreso" : "Egreso"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-foreground max-w-xs truncate">
                          {mov.description || mov.category || "Movimiento general"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground uppercase">
                          {mov.payment_method || "Efectivo"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <PriceDisplay
                            amount={mov.net_amount}
                            variant={isIncome ? "income" : "expense"}
                            showSign
                            size="sm"
                          />
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

      {/* Edit Customer Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md bg-background/95 backdrop-blur-md border-border/40 shadow-lg">
          <DialogHeader>
            <DialogTitle>Editar Datos del Cliente</DialogTitle>
          </DialogHeader>
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
            showCancel={true}
            onCancel={() => setIsEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
