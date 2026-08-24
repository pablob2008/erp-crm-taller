import { Package, ShoppingCart, AlertTriangle, Search, Plus, Layers, Sparkles } from "lucide-react"

export default function InventoryPage() {
  return (
    <div className="relative space-y-6">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-10 -left-10 w-80 h-80 rounded-full bg-kpi-blue/6 blur-3xl -z-10" />
      <div className="pointer-events-none absolute top-40 right-0 w-64 h-64 rounded-full bg-kpi-amber/5 blur-3xl -z-10" />

      {/* Header + Search */}
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventario y Repuestos</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestión de stock, insumos y compras directas del taller.
          </p>
        </div>
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            disabled
            placeholder="Buscar repuesto, código, modelo..."
            className="flex h-9 w-full rounded-full bg-background px-3 py-1 text-sm shadow-neu-inset transition-shadow placeholder:text-muted-foreground focus-visible:outline-none disabled:opacity-50 pl-10"
          />
        </div>
      </div>

      {/* KPI Cards Grid with left accent bar, glow, shimmer and hover-scale */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Items in Stock */}
        <div className="group relative rounded-2xl p-5 overflow-hidden border border-kpi-blue/30 bg-kpi-blue/10 shadow-[0_0_24px_0_hsl(var(--kpi-blue)/0.12)] transition-all duration-200 hover:scale-[1.02] hover:brightness-105">
          {/* Left accent bar */}
          <div className="absolute left-0 inset-y-0 w-1 bg-kpi-blue rounded-l-2xl" />
          {/* Shimmer on hover */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative flex items-center justify-between mb-4 pl-2">
            <h3 className="text-xs font-semibold text-kpi-blue uppercase tracking-wider">Art\u00edculos Totales</h3>
            <div className="p-2 rounded-full bg-kpi-blue/15 text-kpi-blue border border-kpi-blue/30">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="relative pl-2">
            <span className="text-3xl font-bold text-foreground">
              0 <span className="text-base font-semibold text-kpi-blue">unidades</span>
            </span>
          </div>
        </div>

        {/* Pending Purchases */}
        <div className="group relative rounded-2xl p-5 overflow-hidden border border-kpi-amber/30 bg-kpi-amber/10 shadow-[0_0_24px_0_hsl(var(--kpi-amber)/0.12)] transition-all duration-200 hover:scale-[1.02] hover:brightness-105">
          {/* Left accent bar */}
          <div className="absolute left-0 inset-y-0 w-1 bg-kpi-amber rounded-l-2xl" />
          {/* Shimmer on hover */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative flex items-center justify-between mb-4 pl-2">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-kpi-amber animate-pulse" />
              <h3 className="text-xs font-semibold text-kpi-amber uppercase tracking-wider">Compras Activas</h3>
            </div>
            <div className="p-2 rounded-full bg-kpi-amber/15 text-kpi-amber border border-kpi-amber/30">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="relative pl-2">
            <span className="text-3xl font-bold text-foreground">
              0 <span className="text-base font-semibold text-kpi-amber">\u00f3rdenes</span>
            </span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="group relative rounded-2xl p-5 overflow-hidden border border-kpi-red/30 bg-kpi-red/10 shadow-[0_0_24px_0_hsl(var(--kpi-red)/0.12)] transition-all duration-200 hover:scale-[1.02] hover:brightness-105">
          {/* Left accent bar */}
          <div className="absolute left-0 inset-y-0 w-1 bg-kpi-red rounded-l-2xl" />
          {/* Shimmer on hover */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative flex items-center justify-between mb-4 pl-2">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-kpi-red animate-pulse" />
              <h3 className="text-xs font-semibold text-kpi-red uppercase tracking-wider">Bajo Stock</h3>
            </div>
            <div className="p-2 rounded-full bg-kpi-red/15 text-kpi-red border border-kpi-red/30">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="relative pl-2">
            <span className="text-3xl font-bold text-kpi-red">
              0 <span className="text-base font-semibold opacity-80">alertas</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Panels with full card design */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Parts Catalog Panel Card */}
        <div className="group relative flex flex-col rounded-2xl border border-kpi-blue/30 bg-kpi-blue/5 shadow-[0_0_24px_0_hsl(var(--kpi-blue)/0.08)] transition-all duration-200 hover:scale-[1.01] hover:brightness-105 overflow-hidden">
          {/* Left accent bar */}
          <div className="absolute left-0 inset-y-0 w-1 bg-kpi-blue rounded-l-2xl" />
          {/* Shimmer on hover */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 pl-7">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-kpi-blue/15 text-kpi-blue border border-kpi-blue/20">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-foreground">Cat\u00e1logo de Repuestos</h3>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-kpi-blue/15 text-kpi-blue border border-kpi-blue/30">
              <Sparkles className="w-3 h-3" /> M\u00f3dulo Activo
            </span>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center pl-7">
            <div className="w-14 h-14 rounded-full bg-kpi-blue/15 border border-kpi-blue/30 text-kpi-blue flex items-center justify-center shadow-lg shadow-kpi-blue/10 group-hover:scale-110 transition-transform">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <p className="font-bold text-lg text-foreground">El inventario est\u00e1 listo para sincronizar</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Control\u00e1 pantallas, pines de carga, bater\u00edas y piezas de recambio con trazabilidad autom\u00e1tica por orden.
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 mt-2 rounded-full text-xs font-bold bg-kpi-blue/15 text-kpi-blue border border-kpi-blue/30 hover:bg-kpi-blue/25 transition-all shadow-sm">
              <Plus className="w-3.5 h-3.5" /> Agregar primer repuesto
            </button>
          </div>
        </div>

        {/* Pending Purchases Panel Card */}
        <div className="group relative flex flex-col rounded-2xl border border-kpi-amber/30 bg-kpi-amber/5 shadow-[0_0_24px_0_hsl(var(--kpi-amber)/0.08)] transition-all duration-200 hover:scale-[1.01] hover:brightness-105 overflow-hidden">
          {/* Left accent bar */}
          <div className="absolute left-0 inset-y-0 w-1 bg-kpi-amber rounded-l-2xl" />
          {/* Shimmer on hover */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 pl-7">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-kpi-amber/15 text-kpi-amber border border-kpi-amber/20">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-foreground">Compras a Proveedores</h3>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-kpi-amber/15 text-kpi-amber border border-kpi-amber/30">
              <Sparkles className="w-3 h-3" /> Pedidos
            </span>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center pl-7">
            <div className="w-14 h-14 rounded-full bg-kpi-amber/15 border border-kpi-amber/30 text-kpi-amber flex items-center justify-center shadow-lg shadow-kpi-amber/10 group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-7 h-7" />
            </div>
            <div>
              <p className="font-bold text-lg text-foreground">Sin compras pendientes</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Gener\u00e1 listas de compras automatizadas cuando te falte stock para \u00f3rdenes en taller.
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 mt-2 rounded-full text-xs font-bold bg-kpi-amber/15 text-kpi-amber border border-kpi-amber/30 hover:bg-kpi-amber/25 transition-all shadow-sm">
              <Plus className="w-3.5 h-3.5" /> Nueva orden de compra
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
