import { useEffect, useState, useRef, useCallback } from "react"
import { Search, Plus, Minus, Edit, Trash2 } from "lucide-react"
import { useSupabase } from "@/context/SupabaseProvider"
import {
  fetchInventoryItems,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  type InventoryItem,
  type CreateInventoryItemDTO,
  type UpdateInventoryItemDTO
} from "@/lib/services/inventory"
import { InventoryItemModal } from "./InventoryItemModal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function StockPOSPanel() {
  const { supabase, profile } = useSupabase()
  const branchId = profile?.branch_id

  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)

  const loadItems = useCallback(async () => {
    if (!branchId) return
    setLoading(true)
    try {
      const data = await fetchInventoryItems(supabase, branchId, search)
      setItems(data)
    } catch (err) {
      console.error("Error loading inventory items:", err)
    } finally {
      setLoading(false)
    }
  }, [supabase, branchId, search])

  // Load items when search changes, with simple debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadItems()
    }, 300)
    return () => clearTimeout(timer)
  }, [loadItems])

  // Auto-focus search bar for barcode scanners
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  const handleStockChange = async (item: InventoryItem, delta: number) => {
    const newQuantity = item.quantity + delta
    if (newQuantity < 0) return // Prevent negative stock if needed, or allow it depending on rules. Let's prevent it.
    
    // Optimistic update
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQuantity } : i))
    
    try {
      await updateInventoryItem(supabase, item.id, { quantity: newQuantity })
    } catch (err) {
      console.error("Error updating stock:", err)
      // Revert on error
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: item.quantity } : i))
    }
  }

  const handleSaveItem = async (payload: CreateInventoryItemDTO | UpdateInventoryItemDTO) => {
    if (!branchId) return
    if (editingItem) {
      await updateInventoryItem(supabase, editingItem.id, payload as UpdateInventoryItemDTO)
    } else {
      await addInventoryItem(supabase, branchId, payload as CreateInventoryItemDTO)
    }
    loadItems()
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("¿Eliminar este artículo?")) return
    try {
      await deleteInventoryItem(supabase, itemId)
      loadItems()
    } catch (err) {
      console.error("Error deleting item:", err)
    }
  }

  const openNewModal = () => {
    setEditingItem(null)
    setIsModalOpen(true)
  }

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Search and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative w-full">
          <Search className="absolute left-4 top-3.5 h-6 w-6 text-muted-foreground pointer-events-none" />
          <input
            ref={searchInputRef}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Escanear código de barras o buscar repuesto..."
            className="flex h-14 w-full rounded-full bg-background px-4 py-2 text-lg shadow-neu-inset transition-shadow placeholder:text-muted-foreground focus-visible:outline-none pl-14"
            autoFocus
          />
        </div>
        <Button
          variant="default"
          className="rounded-full h-14 px-8 gap-2 whitespace-nowrap text-lg"
          onClick={openNewModal}
        >
          <Plus className="h-6 w-6" />
          <span>Nuevo Artículo</span>
        </Button>
      </div>

      {/* POS List Panel */}
      <div className="group relative flex flex-col rounded-2xl border border-border/40 bg-background/40 backdrop-blur-md shadow-[0_0_24px_0_hsl(var(--foreground)/0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 bg-background/20">
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Código</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Artículo</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Categoría</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Costo / Venta</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stock</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    Cargando inventario...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    {search.trim()
                      ? "No se encontraron artículos para la búsqueda."
                      : "No hay artículos en el inventario."}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border/20 hover:bg-background/30 transition-colors group/row"
                  >
                    <td className="px-6 py-4 font-mono text-sm">{item.code}</td>
                    <td className="px-6 py-4 font-medium">
                      <div className="max-w-[200px] sm:max-w-[300px] truncate">{item.name}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-[300px]">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      {item.category ? (
                        <Badge variant="outline">{item.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-muted-foreground text-xs">C: ${item.cost_price?.toFixed(2) ?? "0.00"}</div>
                      <div className="font-semibold text-foreground">V: ${item.sale_price?.toFixed(2) ?? "0.00"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-full border-border/40 shadow-neu-inset shrink-0"
                          onClick={() => handleStockChange(item, -1)}
                          disabled={item.quantity <= 0}
                        >
                          <Minus className="h-5 w-5" />
                        </Button>
                        <span className="w-12 text-center text-xl font-bold tabular-nums">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-full border-border/40 shadow-neu-inset shrink-0"
                          onClick={() => handleStockChange(item, 1)}
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => openEditModal(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <InventoryItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveItem}
        item={editingItem}
      />
    </div>
  )
}
