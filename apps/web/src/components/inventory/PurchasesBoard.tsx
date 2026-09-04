import { useEffect, useState, useCallback } from "react"
import { Package, ShoppingCart, AlertTriangle, Search, Layers, RefreshCw, Wrench, Plus } from "lucide-react"
import { useSupabase } from "@/context/SupabaseProvider"
import {
  fetchPurchaseKPIs,
  fetchUnifiedPurchases,
  fulfillGeneralPurchase,
  fulfillWorkOrderPart,
  addGeneralPurchase,
  type PurchaseKPIs,
  type UnifiedPurchaseItem,
} from "@/lib/services/purchases"
import { PurchaseExpenseModal } from "@/components/purchases/PurchaseExpenseModal"
import { AddPurchaseModal } from "@/components/purchases/AddPurchaseModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const STATUS_TABS = ["active", "pending", "all"] as const
type StatusTab = typeof STATUS_TABS[number]

const TAB_LABELS: Record<StatusTab, string> = {
  active: "Activas",
  pending: "Pendientes",
  all: "Todas",
}

function matchesTab(item: UnifiedPurchaseItem, tab: StatusTab): boolean {
  if (tab === "active") return item.status === "pending" || item.status === "ordered"
  if (tab === "pending") return item.status === "pending"
  return true // all
}

function SourceBadge({ source }: { source: UnifiedPurchaseItem["source"] }) {
  if (source === "work_order_item") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-kpi-blue/15 text-kpi-blue border border-kpi-blue/30">
        <Wrench className="w-3 h-3" />
        Orden
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-kpi-amber/15 text-kpi-amber border border-kpi-amber/30">
      <ShoppingCart className="w-3 h-3" />
      Compra
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === "pending") {
    return <Badge variant="outline" className="text-muted-foreground">Pendiente</Badge>
  }
  if (status === "ordered") {
    return <Badge className="bg-kpi-amber text-white">Pedido</Badge>
  }
  if (status === "received" || status === "purchased") {
    return <Badge className="bg-green-600 text-white">Recibido</Badge>
  }
  return <Badge variant="outline">{status}</Badge>
}

export function PurchasesBoard() {
  const { supabase, profile, user } = useSupabase()

  const [kpis, setKpis] = useState<PurchaseKPIs>({
    totalInventoryItems: 0,
    activePurchases: 0,
    lowStockAlerts: 0,
  })
  const [kpiLoading, setKpiLoading] = useState(true)
  const [purchases, setPurchases] = useState<UnifiedPurchaseItem[]>([])
  const [purchasesLoading, setPurchasesLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<StatusTab>("active")
  const [search, setSearch] = useState("")
  const [modalItem, setModalItem] = useState<UnifiedPurchaseItem | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const branchId = profile?.branch_id

  const loadKPIs = useCallback(async () => {
    if (!branchId) return
    setKpiLoading(true)
    try {
      const data = await fetchPurchaseKPIs(supabase, branchId)
      setKpis(data)
    } catch (err) {
      console.error("Error loading KPIs:", err)
    } finally {
      setKpiLoading(false)
    }
  }, [supabase, branchId])

  const loadPurchases = useCallback(async () => {
    if (!branchId) return
    setPurchasesLoading(true)
    try {
      const data = await fetchUnifiedPurchases(supabase, branchId)
      setPurchases(data)
    } catch (err) {
      console.error("Error loading purchases:", err)
    } finally {
      setPurchasesLoading(false)
    }
  }, [supabase, branchId])

  useEffect(() => {
    loadKPIs()
    loadPurchases()
  }, [loadKPIs, loadPurchases])

  const handleConfirm = async (
    item: UnifiedPurchaseItem,
    amount: number,
    method: string,
    note: string
  ) => {
    if (!branchId) return
    try {
      if (item.source === "purchase") {
        await fulfillGeneralPurchase(supabase, branchId, item.id, item.title, amount, method, note || undefined)
      } else {
        await fulfillWorkOrderPart(
          supabase, branchId, item.id, item.workOrderId!,
          item.quantity, amount, method, note || undefined, user?.id
        )
      }
      setModalItem(null)
      await Promise.all([loadKPIs(), loadPurchases()])
    } catch (err) {
      console.error("Error fulfilling purchase:", err)
      throw err
    }
  }

  const filtered = purchases.filter((item) => {
    if (!matchesTab(item, activeTab)) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        item.title.toLowerCase().includes(q) ||
        (item.workOrderCode?.toLowerCase().includes(q) ?? false) ||
        (item.supplier?.toLowerCase().includes(q) ?? false)
      )
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header Actions for Purchases */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar repuesto, código, proveedor..."
              className="flex h-9 w-full rounded-full bg-background px-3 py-1 text-sm shadow-neu-inset transition-shadow placeholder:text-muted-foreground focus-visible:outline-none pl-10"
            />
          </div>
          <Button
            variant="default"
            className="rounded-full h-9 gap-1.5 whitespace-nowrap"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva Compra</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-9 w-9 text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => { loadKPIs(); loadPurchases() }}
            title="Recargar"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="group relative rounded-2xl p-5 overflow-hidden border border-kpi-blue/30 bg-kpi-blue/10 shadow-[0_0_24px_0_hsl(var(--kpi-blue)/0.12)] transition-all duration-200 hover:scale-[1.02] hover:brightness-105">
          <div className="absolute left-0 inset-y-0 w-1 bg-kpi-blue rounded-l-2xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center justify-between mb-4 pl-2">
            <h3 className="text-xs font-semibold text-kpi-blue uppercase tracking-wider">Artículos Totales</h3>
            <div className="p-2 rounded-full bg-kpi-blue/15 text-kpi-blue border border-kpi-blue/30">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="relative pl-2">
            <span className="text-3xl font-bold text-foreground">
              {kpiLoading
                ? <span className="text-lg text-muted-foreground">...</span>
                : <>{kpis.totalInventoryItems} <span className="text-base font-semibold text-kpi-blue">unidades</span></>}
            </span>
          </div>
        </div>

        <div className="group relative rounded-2xl p-5 overflow-hidden border border-kpi-amber/30 bg-kpi-amber/10 shadow-[0_0_24px_0_hsl(var(--kpi-amber)/0.12)] transition-all duration-200 hover:scale-[1.02] hover:brightness-105">
          <div className="absolute left-0 inset-y-0 w-1 bg-kpi-amber rounded-l-2xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center justify-between mb-4 pl-2">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-kpi-amber animate-pulse" />
              <h3 className="text-xs font-semibold text-kpi-amber uppercase tracking-wider">Compras Activas</h3>
            </div>
            <div className="p-2 rounded-full bg-kpi-amber/15 text-kpi-amber border border-kpi-amber/30">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="relative pl-2">
            <span className="text-3xl font-bold text-foreground">
              {kpiLoading
                ? <span className="text-lg text-muted-foreground">...</span>
                : <>{kpis.activePurchases} <span className="text-base font-semibold text-kpi-amber">órdenes</span></>}
            </span>
          </div>
        </div>

        <div className="group relative rounded-2xl p-5 overflow-hidden border border-kpi-red/30 bg-kpi-red/10 shadow-[0_0_24px_0_hsl(var(--kpi-red)/0.12)] transition-all duration-200 hover:scale-[1.02] hover:brightness-105">
          <div className="absolute left-0 inset-y-0 w-1 bg-kpi-red rounded-l-2xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center justify-between mb-4 pl-2">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-kpi-red animate-pulse" />
              <h3 className="text-xs font-semibold text-kpi-red uppercase tracking-wider">Bajo Stock</h3>
            </div>
            <div className="p-2 rounded-full bg-kpi-red/15 text-kpi-red border border-kpi-red/30">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="relative pl-2">
            <span className="text-3xl font-bold text-kpi-red">
              {kpiLoading
                ? <span className="text-lg text-muted-foreground opacity-60">...</span>
                : <>{kpis.lowStockAlerts} <span className="text-base font-semibold opacity-80">alertas</span></>}
            </span>
          </div>
        </div>
      </div>

      {/* Unified Purchases Board */}
      <div className="group relative flex flex-col rounded-2xl border border-kpi-amber/30 bg-background/40 backdrop-blur-md shadow-[0_0_24px_0_hsl(var(--kpi-amber)/0.08)] overflow-hidden">
        <div className="absolute left-0 inset-y-0 w-1 bg-kpi-amber rounded-l-2xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 pl-7">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-kpi-amber/15 text-kpi-amber border border-kpi-amber/20">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-foreground">Tablero de Compras Unificado</h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "ítem" : "ítems"}
          </span>
        </div>

        <div className="flex gap-1 px-6 pt-4 pb-2 pl-7 border-b border-border/20">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={
                activeTab === tab
                  ? "px-3 py-1 rounded-full text-xs font-semibold bg-kpi-amber/20 text-kpi-amber border border-kpi-amber/40 transition-all"
                  : "px-3 py-1 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground border border-transparent transition-all"
              }
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 bg-background/20">
                <th className="text-left px-4 pl-7 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fuente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ítem</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Orden / Proveedor</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cant.</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Est. $</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody>
              {purchasesLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground pl-7">
                    Cargando compras...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground pl-7">
                    {search.trim()
                      ? "No se encontraron resultados para la búsqueda."
                      : "No hay compras en este estado."}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.source + "-" + item.id}
                    className="border-b border-border/20 hover:bg-background/30 transition-colors group/row"
                  >
                    <td className="px-4 pl-7 py-3"><SourceBadge source={item.source} /></td>
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate">{item.title}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell text-xs">
                      {item.source === "work_order_item" ? item.workOrderCode ?? "—" : item.supplier ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{item.quantity}</td>
                    <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell text-muted-foreground">
                      {item.estimatedCost > 0 ? "$" + item.estimatedCost.toFixed(2) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={item.status} /></td>
                    <td className="px-4 py-3 text-right">
                      {(item.status === "pending" || item.status === "ordered") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-primary text-primary hover:bg-primary hover:text-white opacity-0 group-hover/row:opacity-100 transition-opacity"
                          onClick={() => setModalItem(item)}
                        >
                          {item.source === "purchase" ? "Marcar Recibido" : "Marcar Comprado"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PurchaseExpenseModal
        item={modalItem}
        onConfirm={handleConfirm}
        onClose={() => setModalItem(null)}
      />

      <AddPurchaseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onConfirm={async (data) => {
          if (!branchId) return
          await addGeneralPurchase(supabase, branchId, data)
          await Promise.all([loadKPIs(), loadPurchases()])
        }}
      />
    </div>
  )
}
