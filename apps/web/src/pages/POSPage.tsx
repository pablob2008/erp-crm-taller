import { useReducer, useState, useCallback, useEffect } from "react"
import { useSupabase } from "@/context/SupabaseProvider"
import { useToast } from "@/hooks/use-toast"
import { CatalogPanel } from "@/components/pos/CatalogPanel"
import { TicketPanel } from "@/components/pos/TicketPanel"
import { DeliverOrderModal } from "@/components/pos/DeliverOrderModal"
import { ExpenseModal } from "@/components/pos/ExpenseModal"
import { ManualSaleModal } from "@/components/pos/ManualSaleModal"
import { PrintFormatToggle } from "@/components/pos/PrintFormatToggle"
import { PrintableInvoice, type PrintFormat } from "@/components/pos/print/PrintableInvoice"
import type { TicketItem, TicketState, OrderSearchResult, SaleForPrint } from "@/lib/services/pos"
import { checkoutSale, fetchSaleForPrint } from "@/lib/services/pos"
import { getBranchInfo, type BranchInfo } from "@/lib/services/branches"

// ─── Reducer ──────────────────────────────────────────────────────────────────

type TicketAction =
  | { type: "ADD_ITEM"; payload: Omit<TicketItem, "tempId"> }
  | { type: "INCREMENT_QTY"; tempId: string }
  | { type: "DECREMENT_QTY"; tempId: string }
  | { type: "REMOVE_ITEM"; tempId: string }
  | { type: "SET_PAYMENT_METHOD"; method: TicketState["paymentMethod"] }
  | { type: "SET_WORK_ORDER_ID"; workOrderId: string }
  | { type: "CLEAR_TICKET" }

function ticketReducer(state: TicketState, action: TicketAction): TicketState {
  switch (action.type) {
    case "ADD_ITEM": {
      // If same inventory item already in ticket, increment quantity instead
      if (action.payload.inventoryItemId) {
        const existing = state.items.find(
          (i) => i.inventoryItemId === action.payload.inventoryItemId
        )
        if (existing) {
          return {
            ...state,
            items: state.items.map((i) =>
              i.inventoryItemId === action.payload.inventoryItemId
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          }
        }
      }
      return {
        ...state,
        items: [
          ...state.items,
          { ...action.payload, tempId: `${Date.now()}-${Math.random()}` },
        ],
      }
    }
    case "INCREMENT_QTY":
      return {
        ...state,
        items: state.items.map((i) =>
          i.tempId === action.tempId ? { ...i, quantity: i.quantity + 1 } : i
        ),
      }
    case "DECREMENT_QTY":
      return {
        ...state,
        items: state.items
          .map((i) =>
            i.tempId === action.tempId ? { ...i, quantity: i.quantity - 1 } : i
          )
          .filter((i) => i.quantity > 0),
      }
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((i) => i.tempId !== action.tempId),
      }
    case "SET_PAYMENT_METHOD":
      return { ...state, paymentMethod: action.method }
    case "SET_WORK_ORDER_ID":
      return { ...state, workOrderId: action.workOrderId }
    case "CLEAR_TICKET":
      return { items: [], paymentMethod: "cash", workOrderId: undefined }
    default:
      return state
  }
}

const initialTicketState: TicketState = {
  items: [],
  paymentMethod: "cash",
}

// ─── POSPage ──────────────────────────────────────────────────────────────────

export default function POSPage() {
  const { supabase, user, profile } = useSupabase()
  const { toast } = useToast()

  const [ticketState, dispatch] = useReducer(ticketReducer, initialTicketState)
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  // ── Print engine state ──────────────────────────────────────────────────────
  /** Selected invoice print format for this session (defaults to A4). */
  const [printFormat, setPrintFormat] = useState<PrintFormat>('A4')
  /** Populated after a successful checkout to trigger window.print(). */
  const [printData, setPrintData] = useState<SaleForPrint | null>(null)
  /** Branch metadata fetched once for invoice headers. */
  const [branchInfo, setBranchInfo] = useState<BranchInfo | null>(null)

  // Modal visibility flags
  const [deliverOrderOpen, setDeliverOrderOpen] = useState(false)
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [manualSaleOpen, setManualSaleOpen] = useState(false)

  const branchId: string = profile?.branch_id ?? ""
  const userId: string = user?.id ?? ""

  // ── Fetch branch info once branchId is known ────────────────────────────────
  useEffect(() => {
    if (!branchId) return
    getBranchInfo(supabase, branchId)
      .then((info) => setBranchInfo(info))
      .catch((err) => console.error('[POS] Failed to fetch branch info:', err))
  }, [supabase, branchId])

  // ── Trigger print when printData is populated ───────────────────────────────
  useEffect(() => {
    if (!printData) return
    // 300ms delay matches the existing WorkOrderDetailsPage pattern,
    // giving the DOM time to render the hidden PrintableInvoice before print.
    const timer = setTimeout(() => {
      window.print()
      // Clear print data after print dialog opens/closes
      window.onafterprint = () => {
        setPrintData(null)
        window.onafterprint = null
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [printData])

  // ── Derived totals ──────────────────────────────────────────────────────────
  const subtotal = ticketState.items.reduce(
    (acc, item) => acc + item.quantity * item.unitPrice,
    0
  )

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleAddInventoryItem = useCallback(
    (item: { id: string; name: string; sale_price: number }) => {
      dispatch({
        type: "ADD_ITEM",
        payload: {
          inventoryItemId: item.id,
          description: item.name,
          quantity: 1,
          unitPrice: item.sale_price,
        },
      })
    },
    []
  )

  const handleAddManualItem = useCallback(
    (description: string, unitPrice: number) => {
      dispatch({
        type: "ADD_ITEM",
        payload: { description, quantity: 1, unitPrice },
      })
      setManualSaleOpen(false)
    },
    []
  )

  const handleDeliverOrderConfirm = useCallback(
    (order: OrderSearchResult) => {
      dispatch({
        type: "ADD_ITEM",
        payload: {
          description: `Saldo Orden #${order.order_number} — ${order.customer_name}`,
          quantity: 1,
          unitPrice: order.balance,
        },
      })
      dispatch({ type: "SET_WORK_ORDER_ID", workOrderId: order.id })
      setDeliverOrderOpen(false)
    },
    []
  )

  const handleCheckout = useCallback(async () => {
    if (ticketState.items.length === 0) {
      toast({ title: "Ticket vacío", description: "Agregá al menos un ítem antes de cobrar.", variant: "destructive" })
      return
    }
    if (!branchId) {
      toast({ title: "Error", description: "No se encontró la sucursal del usuario.", variant: "destructive" })
      return
    }

    setIsCheckingOut(true)
    try {
      const result = await checkoutSale(supabase, {
        branchId,
        paymentMethod: ticketState.paymentMethod,
        items: ticketState.items,
        subtotal,
        total: subtotal,
        workOrderId: ticketState.workOrderId,
        createdBy: userId,
      })

      toast({
        title: "¡Venta registrada!",
        description: `Total cobrado: $${result.total.toLocaleString("es-AR")}`,
      })

      // Clear the ticket immediately; print data is independently fetched below.
      dispatch({ type: "CLEAR_TICKET" })

      // Fetch the persisted sale for printing.
      // Runs in background — a failure here should not undo the sale UI reset.
      try {
        const saleData = await fetchSaleForPrint(supabase, result.saleId)
        setPrintData(saleData)
        // The useEffect watching printData will fire window.print() after 300ms.
      } catch (printErr) {
        console.error('[POS] Could not fetch sale for printing:', printErr)
        // Non-fatal: the sale was already registered; only printing is skipped.
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al procesar la venta."
      toast({ title: "Error en checkout", description: msg, variant: "destructive" })
    } finally {
      setIsCheckingOut(false)
    }
  }, [ticketState, subtotal, branchId, userId, supabase, toast])

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="relative space-y-4">
      <div className="no-print contents">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -top-10 -left-10 w-96 h-96 rounded-full bg-primary/4 blur-3xl -z-10" />

        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Punto de Venta</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Escaneá, buscá e ingresá artículos al ticket.
            </p>
          </div>
          {/* Print format toggle */}
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-muted-foreground">Formato de impresión</span>
            <PrintFormatToggle value={printFormat} onChange={setPrintFormat} />
          </div>
        </div>

        {/* Split-screen grid — stacks on mobile, side-by-side on lg+ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {/* Left: Catalog */}
          <CatalogPanel
            branchId={branchId}
            onAddItem={handleAddInventoryItem}
            onOpenManualSale={() => setManualSaleOpen(true)}
            onOpenDeliverOrder={() => setDeliverOrderOpen(true)}
            onOpenExpense={() => setExpenseOpen(true)}
          />

          {/* Right: Ticket */}
          <TicketPanel
            ticketState={ticketState}
            subtotal={subtotal}
            isCheckingOut={isCheckingOut}
            onIncrement={(tempId) => dispatch({ type: "INCREMENT_QTY", tempId })}
            onDecrement={(tempId) => dispatch({ type: "DECREMENT_QTY", tempId })}
            onRemove={(tempId) => dispatch({ type: "REMOVE_ITEM", tempId })}
            onSetPaymentMethod={(method) =>
              dispatch({ type: "SET_PAYMENT_METHOD", method })
            }
            onCheckout={handleCheckout}
          />
        </div>

        {/* Modals */}
        <DeliverOrderModal
          open={deliverOrderOpen}
          branchId={branchId}
          onClose={() => setDeliverOrderOpen(false)}
          onConfirm={handleDeliverOrderConfirm}
        />
        <ExpenseModal
          open={expenseOpen}
          branchId={branchId}
          userId={userId}
          onClose={() => setExpenseOpen(false)}
        />
        <ManualSaleModal
          open={manualSaleOpen}
          onClose={() => setManualSaleOpen(false)}
          onConfirm={handleAddManualItem}
        />
      </div>

      {/* Hidden print-only invoice — rendered after successful checkout.
          PrintableInvoice is screen-hidden (.print-only) until window.print() is called.
          branchInfo must be loaded and printData must be non-null to render. */}
      {printData && branchInfo && (
        <PrintableInvoice
          format={printFormat}
          sale={printData.sale}
          saleItems={printData.items}
          branch={branchInfo}
        />
      )}
    </div>
  )
}
