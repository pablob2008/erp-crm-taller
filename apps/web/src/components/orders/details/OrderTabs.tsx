interface OrderTabsProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
}

export function OrderTabs({ tabs, activeTab, onChange }: OrderTabsProps) {
  return (
    <div className="flex gap-2 flex-wrap mb-6" role="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab)}
            className={`
              flex items-center gap-1.5 px-5 py-2 rounded-full transition-all duration-200 font-medium text-sm focus-visible:outline-none
              ${isActive 
                ? 'bg-kpi-blue/15 text-kpi-blue border border-kpi-blue/30 shadow-[0_0_16px_0_hsl(var(--kpi-blue)/0.12)]' 
                : 'text-muted-foreground bg-background/50 hover:bg-background/80 hover:text-foreground border border-transparent hover:border-border/40'
              }
            `}
          >
            {isActive && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-kpi-blue animate-pulse" />
            )}
            {tab}
          </button>
        );
      })}
    </div>
  );
}

