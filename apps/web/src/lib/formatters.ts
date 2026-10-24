/**
 * lib/formatters.ts
 * Formateadores universales para toda la aplicación ERP/CRM Taller.
 *
 * REGLA DE ORO DE PRECIOS:
 * - formatPrice(): Para toda la UI de la app (tablas, cards, modales).
 *   Muestra números enteros limpios: "$10.000" (sin centavos).
 * - formatPriceFiscal(): Exclusivo para comprobantes fiscales y vista previa ARCA.
 *   Muestra con 2 decimales obligatorios según normativa AFIP: "$10.000,00".
 * - Los cálculos contables y llamadas a Edge Functions NUNCA deben usar strings
 *   formateados; siempre se envían tipos `number` con precisión decimal.
 */

// ─── 1. Formateo de Moneda ───────────────────────────────────────────────────

/**
 * Formatea un monto en pesos argentinos para la UI general (sin centavos).
 * Ejemplo: 10000 → "$10.000" | -2500 → "-$2.500" | 0 → "$0"
 */
export function formatPrice(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "$0"
  const rounded = Math.round(amount)
  const isNegative = rounded < 0
  const absFormatted = Math.abs(rounded).toLocaleString("es-AR", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })
  return isNegative ? `-$${absFormatted}` : `$${absFormatted}`
}

/**
 * Formatea un monto en pesos con 2 decimales para comprobantes fiscales / ARCA.
 * Ejemplo: 10000 → "$10.000,00" | 1250.5 → "$1.250,50"
 */
export function formatPriceFiscal(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "$0,00"
  const isNegative = amount < 0
  const absFormatted = Math.abs(amount).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return isNegative ? `-$${absFormatted}` : `$${absFormatted}`
}

/**
 * Alias de compatibilidad para código existente que use formatCurrency.
 * Devuelve el formato UI limpio sin centavos por defecto.
 */
export const formatCurrency = formatPrice

// ─── 2. Formateo de Fechas y Horas ───────────────────────────────────────────

/**
 * Convierte un string ISO o Date en fecha corta y hora local argentina.
 * Ejemplo: "2026-03-15T17:30:00Z" → "15/03/26 14:30"
 */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—"
  const d = typeof value === "string" ? new Date(value) : value
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Convierte un string ISO o Date en solo fecha corta (DD/MM/AAAA).
 * Ejemplo: "2026-03-15T17:30:00Z" → "15/03/2026"
 */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—"
  const d = typeof value === "string" ? new Date(value) : value
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

/**
 * Convierte un string ISO o Date en fecha legible completa.
 * Ejemplo: "2026-03-15" → "15 de marzo de 2026"
 */
export function formatDateFull(value: string | Date | null | undefined): string {
  if (!value) return "—"
  const d = typeof value === "string" ? new Date(value) : value
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/**
 * Devuelve el tiempo transcurrido en formato amigable y relativo.
 * Ejemplo: "Hace 5 min", "Hace 2 horas", "Ayer a las 14:00", etc.
 */
export function formatRelativeTime(value: string | Date | null | undefined): string {
  if (!value) return "—"
  const d = typeof value === "string" ? new Date(value) : value
  if (isNaN(d.getTime())) return "—"

  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSec < 60) return "Recién"
  if (diffMin < 60) return `Hace ${diffMin} min`
  if (diffHours < 24) return `Hace ${diffHours} h`
  if (diffDays === 1) {
    const timeStr = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
    return `Ayer ${timeStr}`
  }
  if (diffDays < 7) return `Hace ${diffDays} días`

  return formatDate(d)
}

// ─── 3. Formateo de Identificadores y Documentos ─────────────────────────────

/**
 * Formatea un CUIT/CUIL o DNI argentino.
 * 11 dígitos: 20-37044366-2 | 7 u 8 dígitos: 37.044.366
 */
export function formatTaxId(taxId: string | null | undefined): string {
  if (!taxId) return "—"
  const digits = taxId.replace(/\D/g, "")
  if (digits.length === 11) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`
  }
  if (digits.length === 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  }
  if (digits.length === 7) {
    return `${digits.slice(0, 1)}.${digits.slice(1, 4)}.${digits.slice(4)}`
  }
  return taxId
}

/**
 * Formatea un número de comprobante con punto de venta y número correlativo de 8 dígitos.
 * Ejemplo: (4, 42) → "0004-00000042"
 */
export function formatInvoiceNumber(
  pointOfSale: number | string,
  number: number | string
): string {
  const pto = String(pointOfSale).padStart(4, "0")
  const num = String(number).padStart(8, "0")
  return `${pto}-${num}`
}
