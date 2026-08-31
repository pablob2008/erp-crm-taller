import { useState } from "react"
import { Calendar, ChevronDown } from "lucide-react"
import { type DateRange, type DatePreset, getPresetRange } from "@/lib/services/dashboard"

function formatDateToInput(isoString: string): string {
  const d = new Date(isoString)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

interface GlobalDateFilterProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

export function GlobalDateFilter({ value, onChange }: GlobalDateFilterProps) {
  const [activePreset, setActivePreset] = useState<DatePreset>("today")
  const [showCustom, setShowCustom] = useState(false)
  const [customFrom, setCustomFrom] = useState(formatDateToInput(value.from))
  const [customTo, setCustomTo] = useState(formatDateToInput(value.to))

  const handleSelectPreset = (preset: DatePreset) => {
    setActivePreset(preset)
    if (preset === "custom") {
      setShowCustom(true)
    } else {
      setShowCustom(false)
      const range = getPresetRange(preset)
      setCustomFrom(formatDateToInput(range.from))
      setCustomTo(formatDateToInput(range.to))
      onChange(range)
    }
  }

  const handleApplyCustom = () => {
    if (!customFrom || !customTo) return
    const [fromYear, fromMonth, fromDay] = customFrom.split("-").map(Number)
    const [toYear, toMonth, toDay] = customTo.split("-").map(Number)
    const start = new Date(fromYear, fromMonth - 1, fromDay, 0, 0, 0, 0)
    const end = new Date(toYear, toMonth - 1, toDay, 23, 59, 59, 999)
    onChange({ from: start.toISOString(), to: end.toISOString() })
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* Preset buttons */}
      <div className="inline-flex flex-wrap items-center gap-1 rounded-xl bg-background/50 backdrop-blur-md p-1 border border-border/40 shadow-sm">
        <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Período:</span>
        </div>

        <button
          type="button"
          onClick={() => handleSelectPreset("today")}
          className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
            activePreset === "today"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          Hoy
        </button>

        <button
          type="button"
          onClick={() => handleSelectPreset("yesterday")}
          className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
            activePreset === "yesterday"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          Ayer
        </button>

        <button
          type="button"
          onClick={() => handleSelectPreset("this_week")}
          className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
            activePreset === "this_week"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          Esta semana
        </button>

        <button
          type="button"
          onClick={() => handleSelectPreset("this_month")}
          className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
            activePreset === "this_month"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          Este mes
        </button>

        <button
          type="button"
          onClick={() => handleSelectPreset("last_30_days")}
          className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
            activePreset === "last_30_days"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          Últimos 30 días
        </button>

        <button
          type="button"
          onClick={() => handleSelectPreset("custom")}
          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
            activePreset === "custom"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          Personalizado
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      {/* Custom range picker inputs */}
      {showCustom && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-background/50 backdrop-blur-md p-2 border border-border/40 shadow-sm animate-in fade-in-50 duration-150">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="rounded-lg border border-border/60 bg-background/80 px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
          />
          <span className="text-xs text-muted-foreground">a</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="rounded-lg border border-border/60 bg-background/80 px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
          />
          <button
            type="button"
            onClick={handleApplyCustom}
            className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity shadow-sm"
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  )
}
