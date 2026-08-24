import { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { useSupabase } from "@/context/SupabaseProvider"
import { 
  getWorkOrderDetails,
  updateOrderStatus,
  addOrderNote,
  updateNote,
  deleteNote,
  addTask,
  toggleTask,
  updateTask,
  deleteTask,
  updatePayment,
  deletePayment,
  addOrderItem,
  updateItem,
  deleteItem,
  markItemAsPurchased,
  updateWorkOrder,
  deleteWorkOrder,
  addRandomExpense,
  deliverOrder,
} from "@/lib/services/work-order-details"
import type { WorkOrderComposite, WorkOrderEditable, RandomExpenseData, DeliveryData } from "@/lib/services/work-order-details"
import { getBranchInfo } from "@/lib/services/branches"
import type { BranchInfo } from "@/lib/services/branches"

import { OrderHeader } from "@/components/orders/details/OrderHeader"
import { OrderTabs } from "@/components/orders/details/OrderTabs"
import { OverviewTab } from "@/components/orders/details/tabs/OverviewTab"
import { PurchasesTab } from "@/components/orders/details/tabs/PurchasesTab"
import { FinancesTab } from "@/components/orders/details/tabs/FinancesTab"
import { PrintableTicket } from "@/components/orders/print/PrintableTicket"
import { useToast } from "@/hooks/use-toast"

type TabType = 'Resumen' | 'Lista de Compras' | 'Finanzas';

export default function WorkOrderDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { supabase, user } = useSupabase()
  const { toast } = useToast()
  
  const [order, setOrder] = useState<WorkOrderComposite | null>(null)
  const [branch, setBranch] = useState<BranchInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('Resumen')

  // Auto-print: trigger window.print() when ?print=1 is in the URL and data is loaded
  const [searchParams] = useSearchParams()
  useEffect(() => {
    if (searchParams.get('print') === '1' && order && !loading) {
      // Small delay so the PrintableTicket has time to render fully
      const t = setTimeout(() => window.print(), 300)
      return () => clearTimeout(t)
    }
  }, [searchParams, order, loading])

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true)
      const data = await getWorkOrderDetails(supabase, id)
      setOrder(data)
      // Fetch branch info in parallel once we know the branch_id
      if (data?.branch_id) {
        try {
          const branchData = await getBranchInfo(supabase, data.branch_id)
          setBranch(branchData)
        } catch (branchErr) {
          console.error('Failed to fetch branch info for ticket:', branchErr)
          // Non-fatal — ticket will fall back to defaults
        }
      }
    } catch (error: any) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Error al cargar la orden",
        description: error.message
      })
    } finally {
      setLoading(false)
    }
  }, [id, supabase, toast])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  const handleUpdateStatus = async (status: string) => {
    if (!id) return;
    try {
      await updateOrderStatus(supabase, id, status)
      await fetchOrder()
      toast({ title: "Estado actualizado" })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message })
    }
  }

  const handleAddNote = async (content: string, authorId: string) => {
    if (!id) return;
    try {
      await addOrderNote(supabase, id, content, authorId)
      await fetchOrder()
      toast({ title: "Nota agregada" })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message })
    }
  }

  const handleAddTask = async (title: string, branchId: string) => {
    if (!id) return;
    try {
      await addTask(supabase, id, title, branchId)
      await fetchOrder()
      toast({ title: "Tarea agregada" })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message })
    }
  }

  const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
    try {
      await toggleTask(supabase, taskId, isCompleted)
      await fetchOrder()
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message })
    }
  }

  const handleUpdateTask = async (taskId: string, title: string) => {
    try {
      await updateTask(supabase, taskId, title)
      await fetchOrder()
      toast({ title: "Tarea actualizada" })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message })
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(supabase, taskId)
      await fetchOrder()
      toast({ title: "Tarea eliminada" })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message })
    }
  }

  const handleUpdateNote = async (noteId: string, content: string) => {
    try {
      await updateNote(supabase, noteId, content)
      await fetchOrder()
      toast({ title: "Nota actualizada" })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message })
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(supabase, noteId)
      await fetchOrder()
      toast({ title: "Nota eliminada" })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message })
    }
  }

  const handleUpdatePayment = async (paymentId: string, amount: number) => {
    if (!id) return;
    try {
      await updatePayment(supabase, paymentId, id, amount)
      await fetchOrder()
      toast({ title: "Pago actualizado" })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message })
    }
  }

  const handleDeletePayment = async (paymentId: string) => {
    if (!id) return;
    try {
      await deletePayment(supabase, paymentId, id)
      await fetchOrder()
      toast({ title: "Pago eliminado" })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message })
    }
  }

  const handleAddItem = async (itemId: string, quantity: number, unitPrice: number) => {
    if (!id) return;
    try {
      await addOrderItem(supabase, id, itemId, quantity, unitPrice)
      await fetchOrder()
      toast({ title: "Item agregado" })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message })
    }
  }

  const handleUpdateItem = async (itemId: string, quantity: number, unitPrice: number) => {
    try {
      await updateItem(supabase, itemId, quantity, unitPrice)
      await fetchOrder()
      toast({ title: "Item actualizado" })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message })
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteItem(supabase, itemId)
      await fetchOrder()
      toast({ title: "Item eliminado" })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message })
    }
  }

  const handleMarkItemPurchased = async (itemId: string, quantity: number, amount: number, method: string, noteContent?: string) => {
    if (!id || !order?.branch_id) return;
    try {
      await markItemAsPurchased(supabase, order.branch_id, itemId, id, quantity, amount, method, noteContent, user?.id)
      await fetchOrder()
      toast({ title: "Item marcado como comprado" })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message })
    }
  }

  // ─── Task 5.1: New handler functions ──────────────────────────────────────
  const handleEditOrder = async (data: Partial<WorkOrderEditable>) => {
    if (!id) return;
    try {
      await updateWorkOrder(supabase, id, data)
      await fetchOrder()
      toast({ title: "Orden actualizada" })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error al actualizar", description: error.message })
      throw error // Re-throw so dialog stays open on error
    }
  }

  // ─── Task 5.3: Post-delete redirect ───────────────────────────────────────
  const handleDeleteOrder = async () => {
    if (!id) return;
    try {
      await deleteWorkOrder(supabase, id)
      toast({ title: "Orden eliminada" })
      navigate('/orders')
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error al eliminar", description: error.message })
      throw error // Re-throw so dialog stays open on error
    }
  }

  const handleAddExpense = async (data: RandomExpenseData) => {
    if (!id || !order?.branch_id) return;
    try {
      await addRandomExpense(supabase, order.branch_id, id, data)
      await fetchOrder()
      toast({ title: "Gasto registrado" })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error al registrar gasto", description: error.message })
      throw error
    }
  }

  const handleDeliverOrder = async (data: DeliveryData) => {
    if (!id || !order?.branch_id) return;
    try {
      await deliverOrder(supabase, order.branch_id, id, { ...data, authorId: user?.id })
      await fetchOrder()
      toast({ title: "Orden entregada correctamente" })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error al entregar", description: error.message })
      throw error
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando detalles de la orden...</div>
  }

  if (!order) {
    return <div className="p-8 text-center text-destructive">No se encontró la orden.</div>
  }

  return (
    <>
      {/* ── Printable ticket (hidden on screen, shown on print) ── */}
      <PrintableTicket order={order} branch={branch} />

      {/* ── Screen-only interactive content (hidden when printing) ── */}
      <div className="relative no-print max-w-5xl mx-auto pb-12 space-y-6">
        {/* Ambient background glows */}
        <div className="pointer-events-none absolute -top-10 -left-10 w-80 h-80 rounded-full bg-kpi-blue/6 blur-3xl -z-10" />
        <div className="pointer-events-none absolute top-60 right-0 w-64 h-64 rounded-full bg-kpi-amber/5 blur-3xl -z-10" />

        {/* Task 5.2: Wire new props to OrderHeader */}
        <OrderHeader
          order={order}
          onUpdateStatus={handleUpdateStatus}
          onEditOrder={handleEditOrder}
          onDeleteOrder={handleDeleteOrder}
        />
        
        <OrderTabs 
          tabs={['Resumen', 'Lista de Compras', 'Finanzas']} 
          activeTab={activeTab} 
          onChange={(tab) => setActiveTab(tab as TabType)} 
        />

        <div className="mt-6">
          {activeTab === 'Resumen' && (
            <OverviewTab 
              order={order} 
              currentUserId={user?.id}
              onAddNote={handleAddNote}
              onAddTask={handleAddTask}
              onToggleTask={handleToggleTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
            />
          )}
          {activeTab === 'Lista de Compras' && (
            <PurchasesTab 
              order={order} 
              onAddItem={handleAddItem}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
              onMarkPurchased={handleMarkItemPurchased}
            />
          )}
          {/* Task 5.2: Wire new props to FinancesTab */}
          {activeTab === 'Finanzas' && (
            <FinancesTab 
              order={order}
              branchId={order.branch_id}
              onUpdatePayment={handleUpdatePayment}
              onDeletePayment={handleDeletePayment}
              onAddExpense={handleAddExpense}
              onDeliverOrder={handleDeliverOrder}
            />
          )}
        </div>
      </div>
    </>
  )
}
