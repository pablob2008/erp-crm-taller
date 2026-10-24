import { Check, Sparkles } from "lucide-react"
import { useTheme, type AccentColor } from "@/components/theme-provider"
import { GlassCard } from "@/components/ui/glass-card"
import { cn } from "@/lib/utils"

interface AccentOption {
  id: AccentColor
  name: string
  description: string
  colorClass: string
  ringClass: string
  glowClass: string
}

const ACCENT_OPTIONS: AccentOption[] = [
  {
    id: "blue",
    name: "Azul Cobalto",
    description: "Técnico, corporativo y sobrio",
    colorClass: "bg-blue-500",
    ringClass: "ring-blue-500",
    glowClass: "shadow-[0_0_16px_0_hsl(217_91%_60%/0.3)]",
  },
  {
    id: "cyan",
    name: "Celeste Tech",
    description: "Limpio, moderno y tecnológico",
    colorClass: "bg-sky-500",
    ringClass: "ring-sky-500",
    glowClass: "shadow-[0_0_16px_0_hsl(199_89%_48%/0.3)]",
  },
  {
    id: "green",
    name: "Verde Esmeralda",
    description: "Dinámico, financiero y enérgico",
    colorClass: "bg-emerald-500",
    ringClass: "ring-emerald-500",
    glowClass: "shadow-[0_0_16px_0_hsl(142_71%_45%/0.3)]",
  },
  {
    id: "purple",
    name: "Púrpura Cyber",
    description: "Futurista, audaz y premium",
    colorClass: "bg-purple-500",
    ringClass: "ring-purple-500",
    glowClass: "shadow-[0_0_16px_0_hsl(270_75%_60%/0.3)]",
  },
  {
    id: "amber",
    name: "Ámbar Dorado",
    description: "Cálido, distinguido y elegante",
    colorClass: "bg-amber-500",
    ringClass: "ring-amber-500",
    glowClass: "shadow-[0_0_16px_0_hsl(38_92%_50%/0.3)]",
  },
]

export function ThemeAccentPicker() {
  const { accent, setAccent } = useTheme()

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-theme-accent" />
          <h4 className="text-sm font-semibold text-foreground">Color de Acento del Sistema</h4>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Personalizá el tono de los bordes iluminados, el menú lateral, los buscadores y los cuadros de la aplicación.
        </p>
      </div>

      {/* Swatches grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {ACCENT_OPTIONS.map((opt) => {
          const isSelected = accent === opt.id

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setAccent(opt.id)}
              className={cn(
                "group relative flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-150 select-none",
                isSelected
                  ? "border-theme-accent bg-theme-accent/10 shadow-[0_0_20px_0_hsl(var(--theme-accent)/0.15)] ring-1 ring-theme-accent/40"
                  : "border-border/40 bg-background/40 hover:bg-background/70 hover:border-border/70"
              )}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110",
                  opt.colorClass,
                  opt.glowClass
                )}
              >
                {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground truncate">{opt.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{opt.description}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Live preview banner */}
      <GlassCard padding="sm" className="space-y-2 border-border/40">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">Vista Previa de Líneas y Bordes</span>
          <span className="font-mono text-[10px] text-theme-accent font-bold uppercase tracking-wider">
            Activo: {ACCENT_OPTIONS.find((o) => o.id === accent)?.name}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Los marcos del menú lateral, las barras de búsqueda y los cuadros ahora iluminan sus contornos con este tono.
        </p>
      </GlassCard>
    </div>
  )
}
