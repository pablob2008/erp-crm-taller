/**
 * OrderStatusTabs — reusable horizontal pill tab bar for filtering work orders by status.
 * Each tab value matches a group key defined by the design:
 *   "all"         → show all orders (no status filter)
 *   "in_workshop" → received | waiting_client | waiting_parts
 *   "ready"       → ready_for_pickup
 *   "delivered"   → delivered
 */

interface Tab {
  value: string;
  label: string;
  /** Tailwind classes applied to active state */
  activeClass: string;
  dotClass: string;
}

interface OrderStatusTabsProps {
  /** Currently active tab value */
  activeTab: string;
  /** Called when the user clicks a different tab */
  onChange: (value: string) => void;
}

const TABS: Tab[] = [
  {
    value: 'all',
    label: 'Todos',
    activeClass: 'bg-kpi-blue/15 text-kpi-blue border border-kpi-blue/30',
    dotClass: 'bg-kpi-blue',
  },
  {
    value: 'in_workshop',
    label: 'En Taller',
    activeClass: 'bg-kpi-amber/15 text-kpi-amber border border-kpi-amber/30',
    dotClass: 'bg-kpi-amber',
  },
  {
    value: 'ready',
    label: 'Listo',
    activeClass: 'bg-kpi-green/15 text-kpi-green border border-kpi-green/30',
    dotClass: 'bg-kpi-green',
  },
  {
    value: 'delivered',
    label: 'Entregado',
    activeClass: 'bg-muted/80 text-muted-foreground border border-border/30',
    dotClass: 'bg-muted-foreground',
  },
]

export function OrderStatusTabs({ activeTab, onChange }: OrderStatusTabsProps) {
  return (
    <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Filtrar por estado">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.value
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={[
              'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none',
              isActive
                ? tab.activeClass
                : 'text-muted-foreground bg-background/50 hover:bg-background/80 hover:text-foreground border border-transparent hover:border-border/40 shadow-sm',
            ].join(' ')}
          >
            {isActive && (
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${tab.dotClass} animate-pulse`} />
            )}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
