import { useState } from "react"
import { PurchasesBoard } from "@/components/inventory/PurchasesBoard"
import { StockPOSPanel } from "@/components/inventory/StockPOSPanel"
import { PageHeader } from "@/components/ui/page-header"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { Package, ShoppingCart } from "lucide-react"

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<"stock" | "purchases">("stock")

  return (
    <div className="flex flex-col gap-6">
      {/* Universal Page Header */}
      <PageHeader
        title="Inventario y Repuestos"
        subtitle="Gestión de stock, insumos y compras directas del taller"
      />

      {/* Universal Segmented Control */}
      <SegmentedControl<"stock" | "purchases">
        value={activeTab}
        onChange={setActiveTab}
        options={[
          {
            value: "stock",
            label: "Stock de Artículos",
            icon: <Package className="h-4 w-4" />,
            accent: "purple",
          },
          {
            value: "purchases",
            label: "Lista de Compras",
            icon: <ShoppingCart className="h-4 w-4" />,
            accent: "blue",
          },
        ]}
      />

      {/* Content */}
      <div>{activeTab === "stock" ? <StockPOSPanel /> : <PurchasesBoard />}</div>
    </div>
  )
}
