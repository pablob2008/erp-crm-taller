import { Link } from "react-router-dom"
import { ClipboardList, DollarSign, Package, Users } from "lucide-react"

interface QuickAction {
  label: string
  icon: React.ReactNode
  to: string
  color: string
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Nueva Orden",
    icon: <ClipboardList className="h-5 w-5" />,
    to: "/orders/new",
    color: "kpi-blue"
  },
  {
    label: "Ingresos / Gastos",
    icon: <DollarSign className="h-5 w-5" />,
    to: "/finance",
    color: "kpi-green"
  },
  {
    label: "Inventario",
    icon: <Package className="h-5 w-5" />,
    to: "/inventory",
    color: "kpi-amber"
  },
  {
    label: "Clientes",
    icon: <Users className="h-5 w-5" />,
    to: "/customers",
    color: "foreground"
  },
]

export function QuickActionsWidget() {
  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-muted/20 via-background/40 to-background border border-border/40 shadow-lg p-6 backdrop-blur-md overflow-hidden">
      {/* Ambient background light */}
      <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-muted/20 blur-3xl pointer-events-none -z-10" />

      <h3 className="text-lg font-bold text-foreground mb-4">Acciones Rápidas</h3>
      <div className="grid grid-cols-2 gap-3">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className={`group relative flex flex-col items-center justify-center gap-2 rounded-xl bg-background/50 border border-border/40 shadow-sm px-3 py-6 text-xs font-medium text-foreground hover:bg-background/80 hover:scale-[1.02] active:scale-95 transition-all overflow-hidden`}
          >
            {/* Shimmer on hover */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {action.color !== 'foreground' ? (
              <div className={`p-2 rounded-full group-hover:scale-110 transition-transform ${action.color === 'kpi-blue' ? 'bg-kpi-blue/15 text-kpi-blue border border-kpi-blue/30' : action.color === 'kpi-green' ? 'bg-kpi-green/15 text-kpi-green border border-kpi-green/30' : 'bg-kpi-amber/15 text-kpi-amber border border-kpi-amber/30'}`}>
                {action.icon}
              </div>
            ) : (
              <div className={`p-2 rounded-full bg-muted text-foreground border border-border/40 group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
            )}
            
            <span className="font-semibold mt-1">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
