import { useEffect, useState } from "react"
import { useSupabase } from "@/context/SupabaseProvider"
import { Landmark, ArrowUpRight, ArrowDownRight, Wallet, Receipt, CreditCard } from "lucide-react"

type Movement = {
  id: string
  type: "income" | "expense"
  category: string
  payment_method: string
  net_amount: number
  description: string
  created_at: string
}

const translateCategory = (cat: string) => {
  const map: Record<string, string> = {
    work_order_payment: "Pago de orden",
    work_order_advance: "Adelanto / Se\u00f1a",
    purchase_payment: "Compra de repuestos",
    general_expense: "Gasto general",
    refund: "Reintegro / Devoluci\u00f3n"
  }
  return map[cat] || cat.replace("_", " ")
}

const translateMethod = (method: string) => {
  const map: Record<string, string> = {
    cash: "Efectivo",
    transfer: "Transferencia",
    card: "Tarjeta",
    qr: "QR / Billetera"
  }
  return map[method] || method
}

export default function FinancePage() {
  const { supabase } = useSupabase()
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMovements() {
      setLoading(true)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from("cash_movements")
        .select("*")
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false })

      if (!error && data) {
        setMovements(data as any)
      }
      setLoading(false)
    }
    fetchMovements()
  }, [supabase])

  const income = movements.filter(m => m.type === "income").reduce((acc, curr) => acc + Number(curr.net_amount), 0)
  const expenses = movements.filter(m => m.type === "expense").reduce((acc, curr) => acc + Number(curr.net_amount), 0)
  const balance = income - expenses

  return (
    <div className="relative space-y-6">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-10 -left-10 w-80 h-80 rounded-full bg-kpi-blue/6 blur-3xl -z-10" />
      <div className="pointer-events-none absolute top-40 right-0 w-64 h-64 rounded-full bg-kpi-green/5 blur-3xl -z-10" />

      {/* Header */}
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Caja y Finanzas del Día</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Cargando movimientos..." : `${movements.length} ${movements.length === 1 ? "movimiento registrado" : "movimientos registrados"} hoy`}
          </p>
        </div>
      </div>

      {/* KPI Cards Grid with left accent bar, glow, shimmer, and hover-scale */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Balance Card */}
        <div className="group relative rounded-2xl p-5 overflow-hidden border border-kpi-blue/30 bg-kpi-blue/10 shadow-[0_0_24px_0_hsl(var(--kpi-blue)/0.12)] transition-all duration-200 hover:scale-[1.02] hover:brightness-105">
          {/* Left accent bar */}
          <div className="absolute left-0 inset-y-0 w-1 bg-kpi-blue rounded-l-2xl" />
          {/* Shimmer on hover */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative flex items-center justify-between mb-4 pl-2">
            <h3 className="text-xs font-semibold text-kpi-blue uppercase tracking-wider">Balance Actual</h3>
            <div className="p-2 rounded-full bg-kpi-blue/15 text-kpi-blue border border-kpi-blue/30">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="relative pl-2">
            <span className="text-3xl font-bold text-foreground">
              ${balance.toLocaleString("es-AR")}
            </span>
          </div>
        </div>

        {/* Income Card */}
        <div className="group relative rounded-2xl p-5 overflow-hidden border border-kpi-green/30 bg-kpi-green/10 shadow-[0_0_24px_0_hsl(var(--kpi-green)/0.12)] transition-all duration-200 hover:scale-[1.02] hover:brightness-105">
          {/* Left accent bar */}
          <div className="absolute left-0 inset-y-0 w-1 bg-kpi-green rounded-l-2xl" />
          {/* Shimmer on hover */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative flex items-center justify-between mb-4 pl-2">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-kpi-green animate-pulse" />
              <h3 className="text-xs font-semibold text-kpi-green uppercase tracking-wider">Ingresos</h3>
            </div>
            <div className="p-2 rounded-full bg-kpi-green/15 text-kpi-green border border-kpi-green/30">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="relative pl-2">
            <span className="text-3xl font-bold text-kpi-green">
              ${income.toLocaleString("es-AR")}
            </span>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="group relative rounded-2xl p-5 overflow-hidden border border-kpi-red/30 bg-kpi-red/10 shadow-[0_0_24px_0_hsl(var(--kpi-red)/0.12)] transition-all duration-200 hover:scale-[1.02] hover:brightness-105">
          {/* Left accent bar */}
          <div className="absolute left-0 inset-y-0 w-1 bg-kpi-red rounded-l-2xl" />
          {/* Shimmer on hover */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative flex items-center justify-between mb-4 pl-2">
            <h3 className="text-xs font-semibold text-kpi-red uppercase tracking-wider">Egresos</h3>
            <div className="p-2 rounded-full bg-kpi-red/15 text-kpi-red border border-kpi-red/30">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="relative pl-2">
            <span className="text-3xl font-bold text-kpi-red">
              ${expenses.toLocaleString("es-AR")}
            </span>
          </div>
        </div>
      </div>

      {/* Movements Title */}
      <div className="flex items-center justify-between pt-2">
        <h3 className="text-lg font-bold tracking-tight text-foreground">Movimientos de Hoy</h3>
      </div>

      {/* Individual Cards Grid for Movements */}
      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-4 bg-background/40 border border-border/40 animate-pulse backdrop-blur-md shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-1 self-stretch rounded-full bg-muted" />
                <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-36 rounded-full bg-muted" />
                  <div className="h-3 w-48 rounded-full bg-muted" />
                </div>
                <div className="h-6 w-24 rounded-full bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : movements.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground rounded-2xl border border-border/40 bg-background/40 backdrop-blur-md shadow-sm">
          <Landmark className="w-12 h-12 opacity-15" />
          <p className="font-medium text-base">No hay movimientos registrados hoy en la caja.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {movements.map((m) => {
            const isIncome = m.type === "income"
            const accentClass = isIncome ? "text-kpi-green" : "text-kpi-red"
            const bgClass = isIncome ? "bg-kpi-green/10" : "bg-kpi-red/10"
            const borderClass = isIncome ? "border-kpi-green/30" : "border-kpi-red/30"
            const glowClass = isIncome ? "shadow-[0_0_20px_0_hsl(var(--kpi-green)/0.08)]" : "shadow-[0_0_20px_0_hsl(var(--kpi-red)/0.08)]"
            const dotClass = isIncome ? "bg-kpi-green" : "bg-kpi-red"
            const Icon = isIncome ? ArrowUpRight : ArrowDownRight

            return (
              <div
                key={m.id}
                className={`group relative flex items-center justify-between gap-4 p-4 pl-5 rounded-2xl border ${borderClass} ${bgClass} ${glowClass} transition-all duration-200 hover:scale-[1.01] hover:brightness-105 overflow-hidden`}
              >
                {/* Left accent bar */}
                <div className={`absolute left-0 inset-y-0 w-1 ${dotClass} rounded-l-2xl`} />

                {/* Shimmer on hover */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Left Side: Icon & Details */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border ${borderClass} ${bgClass} ${accentClass} shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <p className="font-bold text-sm text-foreground capitalize">
                        {translateCategory(m.category)}
                      </p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${borderClass} ${bgClass} ${accentClass}`}>
                        {isIncome && <span className="w-1.5 h-1.5 rounded-full bg-kpi-green animate-pulse" />}
                        {isIncome ? "Ingreso" : "Egreso"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1 font-medium text-foreground/70">
                        <Receipt className="w-3 h-3 opacity-70" />
                        {new Date(m.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="opacity-30">·</span>
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3 opacity-70" />
                        {translateMethod(m.payment_method)}
                      </span>
                      {m.description && (
                        <>
                          <span className="opacity-30">·</span>
                          <span className="truncate max-w-[200px] sm:max-w-xs text-foreground/80 font-medium">{m.description}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Amount badge */}
                <div className="shrink-0 text-right">
                  <span className={`inline-block font-mono font-bold text-lg sm:text-xl ${accentClass}`}>
                    {isIncome ? "+" : "-"}${Number(m.net_amount).toLocaleString("es-AR")}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
