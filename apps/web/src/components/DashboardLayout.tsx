import {
 Outlet, Link, useLocation, useNavigate } from "react-router-dom"
import { useState } from "react"
import { ModeToggle } from "@/components/mode-toggle"
import { useSupabase } from "@/context/SupabaseProvider"
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Settings,
  Bell,
  Search,
  LogOut,
  Plus,
  Menu,
  X
} from "lucide-react"
import {
 Toaster } from "@/components/ui/toaster"

export default function DashboardLayout() {
  const { supabase } = useSupabase()
  const location = useLocation()
  const navigate = useNavigate()

  const [globalSearch, setGlobalSearch] = useState('')
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
      navigate('/orders')
    }
  }

  const isActive = (path: string) => location.pathname === path

  const navLinkClass = (path: string) => 
    `flex items-center gap-3 rounded-lg px-3 py-3 transition-all font-medium ${
      isActive(path) 
        ? "shadow-neu-inset text-primary" 
        : "text-muted-foreground shadow-neu active:shadow-neu-inset"
    }`

  return (
    <div className="flex min-h-screen w-full flex-col bg-background md:flex-row">
      {/* Sidebar */}
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-4 left-4 z-50 w-64 flex-col rounded-3xl shadow-neu bg-background py-2 transition-transform duration-300 md:translate-x-0 md:flex ${isMobileMenuOpen ? 'translate-x-0 flex' : '-translate-x-[150%] hidden'}`}>
        <button 
          className="md:hidden absolute right-4 top-4 p-2 text-muted-foreground rounded-full hover:bg-muted/20"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex h-14 items-center px-4 lg:h-[60px] lg:px-6 mb-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Package className="h-6 w-6 text-primary" />
            <span className="">ERP Taller</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-auto py-4">
          <ul className="grid items-start px-4 text-sm font-medium lg:px-6 gap-4">
            <li>
              <Link to="/" className={navLinkClass("/")} onClick={() => setIsMobileMenuOpen(false)}>
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/orders" className={navLinkClass("/orders")} onClick={() => setIsMobileMenuOpen(false)}>
                <ClipboardList className="h-4 w-4" />
                Órdenes & Presupuestos
              </Link>
            </li>
            <li>
              <Link to="/customers" className={navLinkClass("/customers")} onClick={() => setIsMobileMenuOpen(false)}>
                <Users className="h-4 w-4" />
                Clientes
              </Link>
            </li>
            <li>
              <Link to="/inventory" className={navLinkClass("/inventory")} onClick={() => setIsMobileMenuOpen(false)}>
                <Package className="h-4 w-4" />
                Inventario & Compras
              </Link>
            </li>
            <li>
              <Link to="/pos" className={navLinkClass("/pos")} onClick={() => setIsMobileMenuOpen(false)}>
                <ShoppingCart className="h-4 w-4" />
                Ventas
              </Link>
            </li>
            <li>
              <Link to="/finance" className={navLinkClass("/finance")} onClick={() => setIsMobileMenuOpen(false)}>
                <DollarSign className="h-4 w-4" />
                Caja / Finanzas
              </Link>
            </li>
            <li className="mt-4">
              <Link to="/settings" className={navLinkClass("/settings")} onClick={() => setIsMobileMenuOpen(false)}>
                <Settings className="h-4 w-4" />
                Configuración
              </Link>
            </li>
          </ul>
        </nav>
        {/* Build version indicator */}
        <div className="mt-auto px-6 py-4 text-xs font-mono text-muted-foreground/60 text-center">
          Build: {import.meta.env.VITE_APP_VERSION || 'local'}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col md:ml-[288px] min-w-0 overflow-x-hidden">
        {/* Header */}
        <header className="flex h-14 items-center gap-4 bg-background px-4 lg:h-[60px] lg:px-6 mb-4">
          <button 
            className="md:hidden shrink-0 rounded-full p-2 text-muted-foreground bg-background/50 border border-border/40 hover:bg-background/80 hover:text-foreground transition-all shadow-sm"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="w-full flex-1">
            <form onSubmit={handleGlobalSearchSubmit} className="relative max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="search"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Buscar órdenes, clientes..."
                className="flex h-9 w-full rounded-full bg-background px-3 py-1 text-sm shadow-neu-inset transition-shadow placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 pl-10"
              />
            </form>
          </div>
          <ModeToggle />
          <button className="relative rounded-full p-2 text-muted-foreground bg-background/50 border border-border/40 hover:bg-background/80 hover:text-foreground transition-all shadow-sm">
            <Bell className="h-5 w-5" />
            <span className="absolute right-0 top-0 flex h-2.5 w-2.5 rounded-full bg-red-600 shadow-sm"></span>
          </button>
          <button onClick={handleLogout} className="rounded-full p-2 text-muted-foreground bg-background/50 border border-border/40 hover:bg-background/80 hover:text-foreground transition-all shadow-sm">
            <LogOut className="h-5 w-5" />
          </button>
          <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-sm shadow-sm">
            P
          </div>
        </header>

        {/* Dashboard Body / Outlet */}
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <Outlet />
        </div>
      </main>

      {/* Floating Action Button (FAB) */}
      <Link
        to="/orders/new"
        className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 no-print"
      >
        <Plus className="h-6 w-6" />
      </Link>

      <div className="no-print">
        <Toaster />
      </div>
    </div>
  )
}
