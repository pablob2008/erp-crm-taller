import { useState, useEffect, useRef } from "react"
import { PackageOpen, Pencil, Truck, TrendingDown } from "lucide-react"
import { useSupabase } from "@/context/SupabaseProvider"
import { fetchInventoryCatalog } from "@/lib/services/pos"
import type { InventoryCatalogItem } from "@/lib/services/pos"
import { ActionTile } from "@/components/ui/action-tile"
import { GlassCard } from "@/components/ui/glass-card"
import { SearchInput } from "@/components/ui/input"
import { formatPrice } from "@/lib/formatters"
import { useToast } from "@/hooks/use-toast"

interface CatalogPanelProps {
  branchId: string
  onAddItem: (item: { id: string; name: string; sale_price: number }) => void
  onOpenManualSale: () => void
  onOpenDeliverOrder: () => void
  onOpenExpense: () => void
}

export function CatalogPanel({
  branchId,
  onAddItem,
  onOpenManualSale,
  onOpenDeliverOrder,
  onOpenExpense,
}: CatalogPanelProps) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [items, setItems] = useState<InventoryCatalogItem[]>([])
  const [loading, setLoading] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-focus search on mount (scanner-ready)
  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  // Fetch catalog on search change (debounced)
  useEffect(() => {
    if (!branchId) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await fetchInventoryCatalog(supabase, branchId, search)
        setItems(data)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error al cargar el catálogo."
        toast({ title: "Error", description: msg, variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [branchId, search, supabase, toast])

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If Enter is pressed with a search term and exactly one result, add it
    if (e.key === "Enter" && items.length === 1) {
      onAddItem({ id: items[0].id, name: items[0].name, sale_price: items[0].sale_price })
      setSearch("")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search bar — scanner-ready */}
      <div>
        <SearchInput
          ref={searchRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Buscar producto o escanear código..."
          autoComplete="off"
          className="h-11 text-sm bg-background/50 border-border/40 shadow-sm"
        />
      </div>

      {/* Fast action tiles */}
      <div className="grid grid-cols-3 gap-2.5">
        <ActionTile
          title="Venta Manual"
          icon={<Pencil className="h-4 w-4" />}
          accent="blue"
          onClick={onOpenManualSale}
        />
        <ActionTile
          title="Entregar Orden"
          icon={<Truck className="h-4 w-4" />}
          accent="green"
          onClick={onOpenDeliverOrder}
        />
        <ActionTile
          title="Registrar Gasto"
          icon={<TrendingDown className="h-4 w-4" />}
          accent="red"
          onClick={onOpenExpense}
        />
      </div>

      {/* Catalog header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Catálogo
        </h3>
        {!loading && (
          <span className="text-xs text-muted-foreground">{items.length} ítem(s)</span>
        )}
      </div>

      {/* Item grid */}
      <GlassCard accent="purple" accentStripe padding="none">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-muted/30 animate-pulse"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <PackageOpen className="h-10 w-10 opacity-20" />
            <p className="text-sm">
              {search ? "No se encontraron productos." : "No hay productos en stock."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => onAddItem({ id: item.id, name: item.name, sale_price: item.sale_price })}
                className="group flex flex-col items-start gap-1 rounded-xl border border-border/40 bg-background/60 p-3 text-left transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm active:scale-95"
              >
                <span className="text-xs font-mono text-muted-foreground">{item.code}</span>
                <span className="text-sm font-semibold text-foreground leading-tight line-clamp-2">
                  {item.name}
                </span>
                <span className="text-base font-bold text-primary">
                  {formatPrice(Number(item.sale_price))}
                </span>
                <span className="text-xs text-muted-foreground">
                  Stock: {Number(item.quantity).toLocaleString("es-AR")}
                </span>
              </button>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
