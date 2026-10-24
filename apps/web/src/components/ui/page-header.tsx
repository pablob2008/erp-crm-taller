import * as React from "react"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PageHeaderProps {
  title: string
  subtitle?: string
  badge?: React.ReactNode
  backButton?: {
    label?: string
    onClick: () => void
  }
  /** Acciones a la derecha: botones, filtros, buscador */
  actions?: React.ReactNode
  /** Si es true, renderiza las luces ambientales de fondo (blur-3xl) */
  showAmbientGlow?: boolean
  className?: string
  children?: React.ReactNode
}

export function PageHeader({
  title,
  subtitle,
  badge,
  backButton,
  actions,
  showAmbientGlow = true,
  className,
  children,
}: PageHeaderProps) {
  return (
    <div className={cn("relative space-y-3", className)}>
      {/* Luces ambientales universales de fondo */}
      {showAmbientGlow && (
        <>
          <div className="pointer-events-none absolute -top-10 -left-10 w-80 h-80 rounded-full bg-kpi-blue/6 blur-3xl -z-10" />
          <div className="pointer-events-none absolute top-40 right-0 w-64 h-64 rounded-full bg-kpi-green/5 blur-3xl -z-10" />
        </>
      )}

      {/* Botón de retroceso opcional */}
      {backButton && (
        <div>
          <button
            type="button"
            onClick={backButton.onClick}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>{backButton.label || "Volver"}</span>
          </button>
        </div>
      )}

      {/* Título + Subtítulo + Acciones */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Contenido adicional opcional en el header (ej. filtros secundarios o pestañas) */}
      {children}
    </div>
  )
}
