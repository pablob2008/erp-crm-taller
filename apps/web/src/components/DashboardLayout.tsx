import { Outlet, Link, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { useState, useMemo, useRef, useEffect, Suspense } from "react"
import { ModeToggle } from "@/components/mode-toggle"
import { useSupabase } from "@/context/SupabaseProvider"
import { SearchInput } from "@/components/ui/input"
import { GlassIconButton } from "@/components/ui/glass-icon-button"
import { PageLoader } from "@/components/ui/page-loader"
import { cn } from "@/lib/utils"
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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync header input whenever the URL or path changes externally
  useEffect(() => {
    setSearchInput(searchParams.get("q") ?? "")
  }, [location.pathname, searchParams])

  // Context-aware search configuration based on current route
  const searchConfig = useMemo(() => {
    const p = location.pathname
    if (p.startsWith("/orders") && p !== "/orders/new") {
      return {
        enabled: true,
        placeholder: "Buscar órdenes por número, cliente o equipo...",
        route: "/orders",
      }
    }
    if (p.startsWith("/customers")) {
      return {
        enabled: true,
        placeholder: "Buscar clientes por nombre, teléfono o DNI...",
        route: "/customers",
      }
    }
    if (p.startsWith("/finance")) {
      return {
        enabled: true,
        placeholder: "Buscar comprobantes por ticket, cliente o CAE...",
        route: "/finance",
      }
    }
    if (p.startsWith("/inventory")) {
      return {
        enabled: true,
        placeholder: "Buscar repuesto en compras o stock...",
        route: "/inventory",
      }
    }
    if (p.startsWith("/pos")) {
      return {
        enabled: false,
        placeholder: "Lector de código y búsqueda activa en mostrador...",
        route: "/pos",
      }
    }
    return {
      enabled: true,
      placeholder: "Buscar órdenes o clientes globales...",
      route: "/orders",
    }
  }, [location.pathname])

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      const trimmed = value.trim()
      const targetBase = searchConfig.route

      if (location.pathname === targetBase) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev)
            if (trimmed) {
              next.set("q", trimmed)
            } else {
              next.delete("q")
            }
            return next
          },
          { replace: true }
        )
      } else if (trimmed) {
        navigate(`${targetBase}?q=${encodeURIComponent(trimmed)}`)
      }
    }, 200)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = searchInput.trim()
    const targetBase = searchConfig.route
    if (location.pathname === targetBase) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (trimmed) {
            next.set("q", trimmed)
          } else {
            next.delete("q")
          }
          return next
        },
        { replace: true }
      )
    } else {
      navigate(trimmed ? `${targetBase}?q=${encodeURIComponent(trimmed)}` : targetBase)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
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
    <div className="flex min-h-screen w-full flex-col bg-background lg:flex-row">
      {/* Mobile & Tablet Backdrop con disolución suave */}
      <div
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ease-out",
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Glass Sidebar con acento temático y física de resorte Apple */}
      <aside
        className={cn(
          "fixed inset-y-4 left-4 z-50 w-64 flex-col rounded-2xl border border-theme-accent/40",
          "shadow-[0_0_24px_0_hsl(var(--theme-accent)/0.16),0_8px_32px_0_hsl(var(--foreground)/0.06)]",
          "bg-background/90 backdrop-blur-xl py-3 overflow-hidden",
          "transition-all duration-300 ease-spring",
          "lg:translate-x-0 lg:flex",
          isMobileMenuOpen
            ? "translate-x-0 flex shadow-[0_0_40px_0_hsl(var(--theme-accent)/0.25)]"
            : "-translate-x-[150%] pointer-events-none lg:pointer-events-auto flex"
        )}
      >
        {/* Shimmer superior en el sidebar */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

        <div className="lg:hidden absolute right-3 top-3 z-10">
          <GlassIconButton
            icon={<X className="h-4 w-4" />}
            size="sm"
            onClick={() => setIsMobileMenuOpen(false)}
            title="Cerrar Menú"
          />
        </div>

        <div className="flex h-12 items-center px-4 lg:px-6 mb-2">
          <Link to="/" className="flex items-center gap-2.5 font-bold tracking-tight text-foreground">
            <div className="p-2 rounded-xl bg-theme-accent/15 text-theme-accent border border-theme-accent/40 shadow-[0_0_16px_0_hsl(var(--theme-accent)/0.25)]">
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

      {/* Main Content Area — Full width on mobile & iPad portrait, left margin only on desktop (lg:ml-[288px]) */}
      <main className="flex flex-1 flex-col lg:ml-[288px] min-w-0 overflow-x-hidden">
        {/* Sticky Glass Header con acento de borde y halo de luz */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 bg-background/90 backdrop-blur-md px-4 lg:h-[60px] lg:px-8 border-b border-theme-accent/35 shadow-[0_4px_24px_0_hsl(var(--theme-accent)/0.12)] mb-2">
          <GlassIconButton
            icon={<Menu className="h-5 w-5" />}
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden shrink-0"
            title="Abrir Menú"
          />

          <div className="w-full flex-1 max-w-md">
            <form onSubmit={handleSearchSubmit}>
              <SearchInput
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={searchConfig.placeholder}
                disabled={!searchConfig.enabled}
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

        {/* Dashboard Body / Outlet con disolución suave al cambiar de ruta */}
        <div key={location.pathname} className="flex-1 space-y-4 p-4 md:p-8 pt-4 animate-in fade-in-50 duration-200">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </main>

      {/* Floating Action Button (FAB) con color temático */}
      <Link
        to="/orders/new"
        className="fixed bottom-5 right-5 sm:bottom-8 sm:right-8 z-40 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-theme-accent text-white shadow-[0_0_24px_0_hsl(var(--theme-accent)/0.45)] transition-transform hover:scale-105 active:scale-95 no-print"
        title="Nueva Orden de Trabajo"
      >
        <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
      </Link>

      <div className="no-print">
        <Toaster />
      </div>
    </div>
  )
}
