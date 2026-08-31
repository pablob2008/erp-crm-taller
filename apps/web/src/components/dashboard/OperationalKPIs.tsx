import { DollarSign, Receipt, CheckCircle } from "lucide-react"
import { KpiCard } from "./KpiCard"
import type { OperationalKPIsData } from "@/lib/services/dashboard"

interface OperationalKPIsProps {
  data?: OperationalKPIsData | null
  loading?: boolean
}

export function OperationalKPIs({ data, loading = false }: OperationalKPIsProps) {
  const formattedRevenue = data
    ? `$${data.totalRevenue.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "$0,00"

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard
        label="Ventas Totales"
        value={formattedRevenue}
        icon={<DollarSign className="h-6 w-6" />}
        accent="kpi-green"
        loading={loading}
        hint="Total recaudado en ventas directas en el período seleccionado"
      />
      <KpiCard
        label="Tickets Emitidos"
        value={data?.ticketCount ?? 0}
        icon={<Receipt className="h-6 w-6" />}
        accent="kpi-blue"
        loading={loading}
        hint="Cantidad de tickets y operaciones de venta en el período seleccionado"
      />
      <KpiCard
        label="Órdenes Listas / Entregadas"
        value={data?.readyOrDeliveredOrders ?? 0}
        icon={<CheckCircle className="h-6 w-6" />}
        accent="kpi-amber"
        loading={loading}
        hint="Órdenes de trabajo finalizadas o entregadas creadas en el período"
      />
    </div>
  )
}
