import { SegmentedControl, type SegmentedOption } from "@/components/ui/segmented-control"

interface OrderStatusTabsProps {
  activeTab: string
  onChange: (value: string) => void
}

const TABS: SegmentedOption<string>[] = [
  { value: "all", label: "Todas las Órdenes", accent: "blue" },
  { value: "in_workshop", label: "En Taller Activo", accent: "amber" },
  { value: "ready", label: "Listos para Retiro", accent: "green" },
  { value: "delivered", label: "Entregadas", accent: "default" },
]

export function OrderStatusTabs({ activeTab, onChange }: OrderStatusTabsProps) {
  return (
    <SegmentedControl
      options={TABS}
      value={activeTab}
      onChange={onChange}
      size="default"
    />
  )
}
