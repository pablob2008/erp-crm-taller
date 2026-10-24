import { Outlet, Link, useLocation, useNavigate } from "react-router-dom"
import { useState } from "react"
import { ModeToggle } from "@/components/mode-toggle"
import { useSupabase } from "@/context/SupabaseProvider"
import { SearchInput } from "@/components/ui/input"
import { GlassIconButton } from "@/components/ui/glass-icon-button"
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Settings,
  Bell,
  LogOut,
  Plus,
  Menu,
  X,
} from "lucide-react"
import { Toaster } from "@/components/ui/toaster"

export default function DashboardLayout() {
  const { supabase, user } = useSupabase()
  const location = useLocation()
  const navigate = useNavigate()

  const [globalSearch, setGlobalSearch] = useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  /** Redirect to orders list with the global search term as a URL param */
  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = globalSearch.trim()
    if (q) {
      navigate(`/orders?q=${encodeURIComponent(q)}`)
    } else {
      navigate("/orders")
    }
  }

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/"
    return location.pathname.startsWith(path)
  }

  const renderNavLink = (path: string, label: string, icon: React.ReactNode) => {
    const active = isActive(path)
    return (
      <Link
        to={path}
        onClick={() => setIsMobileMenuOpen(false)}
        className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-all text-sm font-semibold select-none overflow-hidden ${
          active
            ? "bg-theme-accent text-white shadow-[0_0_16px_0_hsl(var(--theme-accent)/0.35)] font-bold"
            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
        }`}
      >
        {active && (
          <span className="absolute left-0 inset-y-1.5 w-1 rounded-r-full bg-white/90" />
        )}
        <span className="shrink-0">{icon}</span>
        <span>{label}</span>
      </Link>
    )
  }

  const userInitial = user?.email?.charAt(0)?.toUpperCase() || "U"

  return (
    <div className="flex min-h-screen w-full flex-col bg-background md:flex-row">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Glass Sidebar con acento temático */}
      <aside
        className={`fixed inset-y-4 left-4 z-50 w-64 flex-col rounded-2xl border border-theme-accent/30 shadow-[0_8px_32px_0_hsl(var(--theme-accent)/0.10)] bg-background/85 backdrop-blur-xl py-3 transition-transform duration-300 md:translate-x-0 md:flex overflow-hidden ${
          isMobileMenuOpen ? "translate-x-0 flex" : "-translate-x-[150%] hidden"
        }`}
      >
        {/* Stripe vertical izquierdo temático */}
        <div className="absolute left-0 inset-y-0 w-1 rounded-l-2xl bg-theme-accent" />

        {/* Shimmer superior en el sidebar */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

        <div className="md:hidden absolute right-3 top-3 z-10">
          <GlassIconButton
            icon={<X className="h-4 w-4" />}
            size="sm"
            onClick={() => setIsMobileMenuOpen(false)}
            title="Cerrar Menú"
          />
        </div>

        <div className="flex h-12 items-center px-4 lg:px-6 mb-2 pl-5">
          <Link to="/" className="flex items-center gap-2.5 font-bold tracking-tight text-foreground">
            <div className="p-2 rounded-xl bg-theme-accent/15 text-theme-accent border border-theme-accent/30 shadow-[0_0_15px_0_hsl(var(--theme-accent)/0.2)]">
              <Package className="h-5 w-5" />
            </div>
            <span className="text-base font-bold">ERP Taller</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-auto py-2">
          <ul className="grid items-start px-3 text-sm font-medium gap-1">
            <li>{renderNavLink("/", "Dashboard", <LayoutDashboard className="h-4 w-4" />)}</li>
            <li>{renderNavLink("/orders", "Órdenes & Taller", <ClipboardList className="h-4 w-4" />)}</li>
            <li>{renderNavLink("/customers", "Clientes", <Users className="h-4 w-4" />)}</li>
            <li>{renderNavLink("/inventory", "Inventario & Compras", <Package className="h-4 w-4" />)}</li>
            <li>{renderNavLink("/pos", "Ventas POS", <ShoppingCart className="h-4 w-4" />)}</li>
            <li>{renderNavLink("/finance", "Caja & Finanzas", <DollarSign className="h-4 w-4" />)}</li>
            <li className="pt-2 mt-2 border-t border-border/30">
              {renderNavLink("/settings", "Configuración", <Settings className="h-4 w-4" />)}
            </li>
          </ul>
        </nav>

        {/* Build version indicator */}
        <div className="mt-auto px-4 py-2 text-[10px] font-mono text-muted-foreground/60 text-center border-t border-border/20 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-kpi-green animate-pulse" />
            <span>Online</span>
          </span>
          <span>Build: {import.meta.env.VITE_APP_VERSION || "local"}</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col md:ml-[288px] min-w-0 overflow-x-hidden">
        {/* Sticky Glass Header con acento de borde */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 bg-background/85 backdrop-blur-md px-4 lg:h-[60px] lg:px-8 border-b border-theme-accent/20 mb-2">
          <GlassIconButton
            icon={<Menu className="h-5 w-5" />}
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden shrink-0"
            title="Abrir Menú"
          />

          <div className="w-full flex-1 max-w-md">
            <form onSubmit={handleGlobalSearchSubmit}>
              <SearchInput
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Buscar órdenes, clientes..."
              />
            </form>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ModeToggle />

            <GlassIconButton
              icon={<Bell className="h-4 w-4" />}
              badgeDot="red"
              title="Notificaciones"
            />

            <GlassIconButton
              icon={<LogOut className="h-4 w-4" />}
              variant="destructive"
              title="Cerrar Sesión"
              onClick={handleLogout}
            />

            <div
              className="h-9 w-9 rounded-full bg-theme-accent/15 border border-theme-accent/40 text-theme-accent flex items-center justify-center font-bold text-xs shadow-[0_0_14px_0_hsl(var(--theme-accent)/0.25)] select-none"
              title={user?.email || "Usuario"}
            >
              {userInitial}
            </div>
          </div>
        </header>

        {/* Dashboard Body / Outlet */}
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
          <Outlet />
        </div>
      </main>

      {/* Floating Action Button (FAB) con color temático */}
      <Link
        to="/orders/new"
        className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-theme-accent text-white shadow-[0_0_24px_0_hsl(var(--theme-accent)/0.45)] transition-transform hover:scale-105 active:scale-95 no-print"
        title="Nueva Orden de Trabajo"
      >
        <Plus className="h-6 w-6" />
      </Link>

      <div className="no-print">
        <Toaster />
      </div>
    </div>
  )
}
