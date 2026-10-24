import { useNavigate } from "react-router-dom"
import { ClipboardList, DollarSign, Package, Users } from "lucide-react"
import { ActionTile } from "@/components/ui/action-tile"
import { GlassCard } from "@/components/ui/glass-card"

export function QuickActionsWidget() {
  const navigate = useNavigate()

  return (
    <GlassCard padding="default" className="space-y-4">
      <h3 className="text-base font-bold text-foreground">Acciones Rápidas</h3>
      <div className="grid grid-cols-2 gap-3">
        <ActionTile
          title="Nueva Orden"
          icon={<ClipboardList className="h-5 w-5" />}
          accent="blue"
          layout="vertical"
          onClick={() => navigate("/orders/new")}
        />
        <ActionTile
          title="Caja & Finanzas"
          icon={<DollarSign className="h-5 w-5" />}
          accent="green"
          layout="vertical"
          onClick={() => navigate("/finance")}
        />
        <ActionTile
          title="Inventario"
          icon={<Package className="h-5 w-5" />}
          accent="amber"
          layout="vertical"
          onClick={() => navigate("/inventory")}
        />
        <ActionTile
          title="Clientes"
          icon={<Users className="h-5 w-5" />}
          accent="purple"
          layout="vertical"
          onClick={() => navigate("/customers")}
        />
      </div>
    </GlassCard>
  )
}
