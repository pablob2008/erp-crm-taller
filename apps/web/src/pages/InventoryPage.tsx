import { useState } from "react"
import { PurchasesBoard } from "@/components/inventory/PurchasesBoard"
import { StockPOSPanel } from "@/components/inventory/StockPOSPanel"

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<"purchases" | "stock">("purchases")

  return (
    <div className="relative space-y-6">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-10 -left-10 w-80 h-80 rounded-full bg-kpi-blue/6 blur-3xl -z-10" />
      <div className="pointer-events-none absolute top-40 right-0 w-64 h-64 rounded-full bg-kpi-amber/5 blur-3xl -z-10" />

      {/* Header */}
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventario y Repuestos</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestión de stock, insumos y compras directas del taller.
          </p>
        </div>
      </div>

      {/* Top-level Tabs */}
      <div className="flex gap-2 border-b border-border/40 pb-2">
        <button
          onClick={() => setActiveTab("stock")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
            activeTab === "stock"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:bg-background hover:text-foreground"
          }`}
        >
          <span>📦</span> Stock
        </button>
        <button
          onClick={() => setActiveTab("purchases")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
            activeTab === "purchases"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:bg-background hover:text-foreground"
          }`}
        >
          <span>🛒</span> Lista de Compras
        </button>
      </div>

      {/* Content */}
      <div className="pt-2">
        {activeTab === "stock" ? <StockPOSPanel /> : <PurchasesBoard />}
      </div>
    </div>
  )
}
