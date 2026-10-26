import { useEffect, useState, useCallback } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useSupabase } from "@/context/SupabaseProvider"
import {
  Users,
  MessageCircle,
  Mail,
  Phone,
  MapPin,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  FileText,
  AlertTriangle,
  Loader2,
  Plus,
  Eye,
} from "lucide-react"
import {
  fetchCustomers,
  canDeleteCustomer,
  deleteCustomer,
  type CustomerWithHistory,
  type Customer,
} from "@/lib/services/customers"
import { CustomerEditModal } from "@/components/customers/CustomerEditModal"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { Badge } from "@/components/ui/badge"
import { GlassCard } from "@/components/ui/glass-card"
import { CardSkeleton } from "@/components/ui/skeleton"
import { formatPrice } from "@/lib/formatters"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

function buildWhatsAppUrl(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  return `https://wa.me/${digits}`
}

const PAGE_SIZE = 12

export default function CustomersPage() {
  const { supabase, profile } = useSupabase()
  const { toast } = useToast()
  const navigate = useNavigate()

  // URL-driven search
  const [searchParams] = useSearchParams()
  const urlQuery = searchParams.get("q") ?? ""

  const [customers, setCustomers] = useState<CustomerWithHistory[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  // Create & Edit Modal State
  const [createOpen, setCreateOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

  // Delete Flow State
  const [deleteTarget, setDeleteTarget] = useState<CustomerWithHistory | null>(null)
  const [deleteCheckLoading, setDeleteCheckLoading] = useState(false)
  const [deleteBlockReason, setDeleteBlockReason] = useState<{
    workOrderCount: number
    saleCount: number
  } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchCustomers(supabase, profile?.branch_id ?? undefined, {
        search: urlQuery,
        page,
        pageSize: PAGE_SIZE,
      })
      setCustomers(result.data)
      setTotalCount(result.count)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cargar los clientes."
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [supabase, profile?.branch_id, urlQuery, page, toast])

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  const handleDeleteClick = async (customer: CustomerWithHistory) => {
    setDeleteTarget(customer)
    setDeleteBlockReason(null)
    setDeleteCheckLoading(true)

    try {
      const result = await canDeleteCustomer(supabase, customer.id)
      if (!result.canDelete) {
        setDeleteBlockReason({
          workOrderCount: result.workOrderCount,
          saleCount: result.saleCount,
        })
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Error al verificar dependencias del cliente."
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      })
      setDeleteTarget(null)
    } finally {
      setDeleteCheckLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteCustomer(supabase, deleteTarget.id)
      toast({
        title: "Cliente eliminado",
        description: `El cliente ${deleteTarget.first_name} ${deleteTarget.last_name} ha sido eliminado.`,
      })
      setDeleteTarget(null)
      loadCustomers()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al eliminar el cliente."
      toast({
        title: "Error al eliminar",
        description: msg,
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  return (
    <div className="flex flex-col gap-6">
      {/* Universal Page Header (búsqueda gobernada por el header superior) */}
      <PageHeader
        title="Directorio de Clientes"
        subtitle={
          loading
            ? undefined
            : `${totalCount} ${totalCount === 1 ? "cliente registrado" : "clientes registrados"}`
        }
        actions={
          <Button
            onClick={() => setCreateOpen(true)}
            className="gap-2 shrink-0 rounded-xl shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Cliente</span>
          </Button>
        }
      />

      {/* Cards Grid con Shimmer Skeletons y animación de entrada */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title={
            urlQuery
              ? "No se encontraron clientes con ese filtro"
              : "No hay clientes registrados aún"
          }
          description={
            urlQuery
              ? "Probá buscando por otro nombre, teléfono o número de documento."
              : "Los clientes se registrarán automáticamente al crear órdenes o ventas."
          }
          action={
            !urlQuery
              ? {
                  label: "Crear Primer Cliente",
                  onClick: () => setCreateOpen(true),
                  icon: <Plus className="w-4 h-4" />,
                }
              : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3 animate-in fade-in-50 slide-in-from-bottom-2 duration-300 ease-out">
          {customers.map((c) => {
            const orderCount = c.orderCount || 0
            const lifetimeValue = c.lifetimeValue || 0
            const isVip = orderCount >= 5 || lifetimeValue >= 100000
            const isActive = orderCount > 0 || lifetimeValue > 0
            const accent = isVip ? "amber" : isActive ? "blue" : undefined

            return (
              <GlassCard
                key={c.id}
                accent={accent}
                accentStripe={!!accent}
                interactive
                padding="none"
                className="flex flex-col justify-between"
              >
                <div className="p-5 pl-6 space-y-4">
                  {/* Top info and badge row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full border ${
                          isVip
                            ? "border-kpi-amber/30 text-kpi-amber bg-kpi-amber/10"
                            : isActive
                            ? "border-kpi-blue/30 text-kpi-blue bg-kpi-blue/10"
                            : "border-border/40 text-muted-foreground bg-background/50"
                        } shrink-0`}
                      >
                        <Users className="w-5 h-5" />
                      </div>
                      <div
                        className="min-w-0 cursor-pointer group"
                        onClick={() => navigate(`/customers/${c.id}`)}
                      >
                        <h3 className="font-bold text-lg text-foreground truncate group-hover:text-primary transition-colors flex items-center gap-1.5">
                          {c.first_name} {c.last_name}
                        </h3>
                        {c.tax_id && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <FileText className="w-3 h-3 shrink-0" />
                            <span>DNI/CUIT: {c.tax_id}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons (View Profile / Edit / Delete) */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => navigate(`/customers/${c.id}`)}
                        title="Ver Perfil 360°"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCustomer(c)}
                        title="Editar cliente"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(c)}
                        title="Eliminar cliente"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* History Snapshot Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge variant="outline" size="sm">
                      {orderCount} {orderCount === 1 ? "Orden" : "Órdenes"}
                    </Badge>

                    <Badge variant="success" size="sm" className="gap-1">
                      <DollarSign className="w-3 h-3" />
                      <span>Total: {formatPrice(lifetimeValue)}</span>
                    </Badge>

                    {(orderCount >= 5 || lifetimeValue >= 100000) && (
                      <Badge variant="warning" size="sm" className="animate-pulse">
                        ★ VIP
                      </Badge>
                    )}
                  </div>

                  {/* Contact details */}
                  <div className="space-y-1.5 text-sm text-muted-foreground pt-1 border-t border-border/20">
                    {c.phone && (
                      <div className="flex items-center gap-2 truncate">
                        <Phone className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        <span className="truncate">{c.phone}</span>
                      </div>
                    )}
                    {c.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        <span className="truncate">{c.email}</span>
                      </div>
                    )}
                    {c.address && (
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        <span className="truncate">{c.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Quick message actions */}
                  <div className="flex items-center gap-2 pt-2">
                    {c.phone ? (
                      <a
                        href={buildWhatsAppUrl(c.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Abrir WhatsApp"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-kpi-green/15 text-kpi-green border border-kpi-green/30 hover:bg-kpi-green/25 transition-all shadow-sm"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
                    ) : null}

                    {c.email ? (
                      <a
                        href={`mailto:${c.email}`}
                        title="Enviar correo"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-kpi-blue/15 text-kpi-blue border border-kpi-blue/30 hover:bg-kpi-blue/25 transition-all shadow-sm"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        Email
                      </a>
                    ) : null}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/customers/${c.id}`)}
                      className="ml-auto h-7 text-xs px-2.5 gap-1.5 border-border/40 hover:bg-muted/50"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Perfil 360°
                    </Button>
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}

      {/* Pagination controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border/40 pt-4 px-2">
          <p className="text-xs text-muted-foreground">
            Mostrando {Math.min((page - 1) * PAGE_SIZE + 1, totalCount)} -{" "}
            {Math.min(page * PAGE_SIZE, totalCount)} de {totalCount} clientes
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-8 px-2.5"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>
            <span className="text-xs font-medium px-2">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-8 px-2.5"
            >
              Siguiente
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Customer Create Modal */}
      <CustomerEditModal
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          loadCustomers()
        }}
      />

      {/* Customer Edit Modal */}
      <CustomerEditModal
        open={!!editingCustomer}
        customer={editingCustomer}
        mode="edit"
        onClose={() => setEditingCustomer(null)}
        onSuccess={() => {
          loadCustomers()
        }}
      />

      {/* Safe Delete Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(isOpen) => {
          if (!isOpen && !deleting) {
            setDeleteTarget(null)
            setDeleteBlockReason(null)
          }
        }}
      >
        <DialogContent className="max-w-md bg-background/95 backdrop-blur-md border-border/40 shadow-lg">
          <DialogHeader>
            <DialogTitle>
              {deleteBlockReason
                ? "No se puede eliminar el cliente"
                : "Confirmar eliminación"}
            </DialogTitle>
            <DialogDescription>
              {deleteBlockReason
                ? "El cliente tiene registros vinculados en el sistema."
                : "Esta acción no se puede deshacer."}
            </DialogDescription>
          </DialogHeader>

          {deleteCheckLoading ? (
            <div className="flex flex-col items-center justify-center py-6 gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm">Verificando órdenes y ventas asociadas...</p>
            </div>
          ) : deleteBlockReason ? (
            <div className="space-y-4 py-2">
              <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">Eliminación bloqueada por integridad de datos</p>
                  <p className="text-muted-foreground">
                    El cliente <span className="font-bold text-foreground">{deleteTarget?.first_name} {deleteTarget?.last_name}</span> no puede ser eliminado porque registra:
                  </p>
                  <ul className="list-disc list-inside mt-2 font-medium text-foreground space-y-0.5">
                    {deleteBlockReason.workOrderCount > 0 && (
                      <li>
                        {deleteBlockReason.workOrderCount}{" "}
                        {deleteBlockReason.workOrderCount === 1
                          ? "orden de trabajo"
                          : "órdenes de trabajo"}
                      </li>
                    )}
                    {deleteBlockReason.saleCount > 0 && (
                      <li>
                        {deleteBlockReason.saleCount}{" "}
                        {deleteBlockReason.saleCount === 1
                          ? "venta registrada"
                          : "ventas registradas"}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  onClick={() => {
                    setDeleteTarget(null)
                    setDeleteBlockReason(null)
                  }}
                >
                  Entendido
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                ¿Estás seguro de que deseás eliminar permanentemente al cliente{" "}
                <span className="font-semibold text-foreground">
                  {deleteTarget?.first_name} {deleteTarget?.last_name}
                </span>
                ? No tiene órdenes ni ventas registradas.
              </p>
              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                >
                  {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Eliminar Cliente
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
