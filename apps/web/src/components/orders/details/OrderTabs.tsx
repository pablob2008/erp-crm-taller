import { SegmentedControl, type SegmentedOption } from "@/components/ui/segmented-control"
import { FileText, ShoppingCart, DollarSign } from "lucide-react"

interface OrderTabsProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
}

export function OrderTabs({ tabs, activeTab, onChange }: OrderTabsProps) {
  const options: SegmentedOption<string>[] = tabs.map((t) => ({
    value: t,
    label: t,
    icon:
      t === "Resumen" ? (
        <FileText className="w-3.5 h-3.5" />
      ) : t === "Lista de Compras" ? (
        <ShoppingCart className="w-3.5 h-3.5" />
      ) : (
        <DollarSign className="w-3.5 h-3.5" />
      ),
    accent: t === "Finanzas" ? "green" : t === "Lista de Compras" ? "amber" : "blue",
  }))

  return (
    <div className="mb-6">
      <SegmentedControl
        options={options}
        value={activeTab}
        onChange={onChange}
        size="default"
      />
    </div>
  )
}
