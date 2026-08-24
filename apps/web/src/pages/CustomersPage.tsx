import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import { useSupabase } from "@/context/SupabaseProvider"
import { Search, Users, MessageCircle, Mail, Phone, MapPin } from "lucide-react"

type Customer = {
  id: string
  first_name: string
  last_name: string
  phone: string | null
  email: string | null
  address: string | null
  work_orders: { count: number }[]
}

function buildWhatsAppUrl(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  return `https://wa.me/${digits}`
}

export default function CustomersPage() {
  const { supabase } = useSupabase()

  // URL-driven search
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQuery = searchParams.get("q") ?? ""

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  const [inputValue, setInputValue] = useState(urlQuery)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setInputValue(urlQuery) }, [urlQuery])

  const handleSearchChange = (value: string) => {
    setInputValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev)
        if (value.trim()) { next.set("q", value.trim()) } else { next.delete("q") }
        return next
      }, { replace: true })
    }, 300)
  }

  useEffect(() => {
    async function fetchCustomers() {
      setLoading(true)
      const { data, error } = await supabase
        .from("customers")
        .select(`
          id,
          first_name,
          last_name,
          phone,
          email,
          address,
          work_orders ( count )
        `)
        .order("created_at", { ascending: false })

      if (!error && data) {
        setCustomers(data as any)
      }
      setLoading(false)
    }
    fetchCustomers()
  }, [supabase])

  const filteredCustomers = customers.filter((c) => {
    const q = urlQuery.trim().toLowerCase()
    if (!q) return true
    const haystack = [c.first_name, c.last_name, c.phone ?? "", c.email ?? "", c.address ?? ""].join(" ").toLowerCase()
    return haystack.includes(q)
  })

  return (
    <div className="relative space-y-6">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-10 -left-10 w-80 h-80 rounded-full bg-kpi-blue/6 blur-3xl -z-10" />
      <div className="pointer-events-none absolute top-60 right-0 w-64 h-64 rounded-full bg-kpi-amber/5 blur-3xl -z-10" />

      {/* Header + Search */}
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Directorio de Clientes</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Cargando..." : `${filteredCustomers.length} ${filteredCustomers.length === 1 ? "cliente encontrado" : "clientes encontrados"}`}
          </p>
        </div>
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            value={inputValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por nombre, teléfono, email..."
            className="flex h-9 w-full rounded-full bg-background px-3 py-1 text-sm shadow-neu-inset transition-shadow placeholder:text-muted-foreground focus-visible:outline-none pl-10"
          />
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-4 bg-background/40 border border-border/40 animate-pulse backdrop-blur-md shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded-full bg-muted" />
                  <div className="h-3 w-48 rounded-full bg-muted" />
                  <div className="h-3 w-24 rounded-full bg-muted" />
                </div>
                <div className="flex gap-2 shrink-0">
                  <div className="h-9 w-9 rounded-full bg-muted" />
                  <div className="h-9 w-9 rounded-full bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-muted-foreground">
          <Users className="w-16 h-16 opacity-15" />
          <p className="font-medium text-base">
            {customers.length === 0 ? "No hay clientes registrados a\u00fan." : "No se encontraron clientes con ese filtro."}
          </p>
          {customers.length === 0 && (
            <p className="text-sm opacity-60">Los clientes se registrar\u00e1n autom\u00e1ticamente al crear \u00f3rdenes de trabajo.</p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filteredCustomers.map((c) => {
            const orderCount = c.work_orders?.[0]?.count || 0
            
            // Dynamic styling based on customer activity
            let s = { bg: "bg-muted/10", border: "border-border/40", text: "text-muted-foreground", dot: "bg-muted-foreground", glow: "", accent: "text-muted-foreground" }
            if (orderCount >= 5) {
              s = { bg: "bg-kpi-amber/5", border: "border-kpi-amber/30", text: "text-kpi-amber", dot: "bg-kpi-amber", glow: "shadow-[0_0_24px_0_hsl(var(--kpi-amber)/0.08)]", accent: "text-kpi-amber" } // VIP
            } else if (orderCount > 0) {
              s = { bg: "bg-kpi-blue/5", border: "border-kpi-blue/30", text: "text-kpi-blue", dot: "bg-kpi-blue", glow: "hover:shadow-[0_0_20px_0_hsl(var(--kpi-blue)/0.08)]", accent: "text-kpi-blue" } // Standard active
            }

            return (
              <div
                key={c.id}
                className={`group relative flex flex-col rounded-2xl border ${s.border} ${s.bg} ${s.glow} transition-all duration-200 hover:scale-[1.02] hover:brightness-105 overflow-hidden`}
              >
                {/* Left accent bar */}
                <div className={`absolute left-0 inset-y-0 w-1 ${s.dot} rounded-l-2xl`} />

                {/* Shimmer on hover */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-5 pl-6">
                  {/* Info area */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border ${s.border} bg-background/50 ${s.accent}`}>
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-foreground truncate">
                          {c.first_name} {c.last_name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${s.border} ${s.text} bg-background/50`}>
                            {orderCount} {orderCount === 1 ? "Orden" : "\u00d3rdenes"}
                          </span>
                          {orderCount >= 5 && (
                            <span className="text-xs font-semibold text-kpi-amber animate-pulse">\u2605 VIP</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                      {c.phone && (
                        <div className="flex items-center gap-2 truncate">
                          <Phone className="w-3.5 h-3.5 shrink-0 opacity-70" />
                          <span className="truncate">{c.phone}</span>
                        </div>
                      )}
                      {c.email && (
                        <div className="flex items-center gap-2 truncate">
                          <Mail className="w-3.5 h-3.5 shrink-0 opacity-70" />
                          <span className="truncate">{c.email}</span>
                        </div>
                      )}
                      {c.address && (
                        <div className="flex items-center gap-2 truncate">
                          <MapPin className="w-3.5 h-3.5 shrink-0 opacity-70" />
                          <span className="truncate">{c.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    {c.phone ? (
                      <a
                        href={buildWhatsAppUrl(c.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Abrir WhatsApp"
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-kpi-green/15 text-kpi-green border border-kpi-green/30 hover:bg-kpi-green/25 hover:scale-110 transition-all shadow-sm"
                      >
                        <MessageCircle className="w-4.5 h-4.5" />
                      </a>
                    ) : (
                      <div className="w-10 h-10 rounded-full border border-border/50 bg-muted/20 flex items-center justify-center opacity-40" title="Sin tel\u00e9fono">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                    )}

                    {c.email ? (
                      <a
                        href={`mailto:${c.email}`}
                        title="Enviar correo"
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-kpi-blue/15 text-kpi-blue border border-kpi-blue/30 hover:bg-kpi-blue/25 hover:scale-110 transition-all shadow-sm"
                      >
                        <Mail className="w-4.5 h-4.5" />
                      </a>
                    ) : (
                      <div className="w-10 h-10 rounded-full border border-border/50 bg-muted/20 flex items-center justify-center opacity-40" title="Sin email">
                        <Mail className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
