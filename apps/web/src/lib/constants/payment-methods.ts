/**
 * lib/constants/payment-methods.ts
 * Diccionario canónico de medios de pago y categorías de caja.
 * Fuente única de verdad para métodos de cobro, badges e íconos.
 */

export type PaymentMethod = "cash" | "qr" | "transfer" | "card"

export interface PaymentMethodConfig {
  label: string
  shortLabel: string
  description: string
  color: string
}

export const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, PaymentMethodConfig> = {
  cash: {
    label: "Efectivo",
    shortLabel: "Efec.",
    description: "Cobro o pago con dinero en efectivo en el local.",
    color: "text-kpi-green",
  },
  transfer: {
    label: "Transferencia",
    shortLabel: "Transf.",
    description: "Transferencia bancaria directa / CBU / CVU / Alias.",
    color: "text-kpi-blue",
  },
  card: {
    label: "Tarjeta Débito / Crédito",
    shortLabel: "Tarjeta",
    description: "Cobro por terminal POSNet / Clover / Posnet.",
    color: "text-purple-500",
  },
  qr: {
    label: "QR / Billetera Virtual",
    shortLabel: "QR",
    description: "Mercado Pago, MODO, Cuenta DNI u otra billetera interoperable.",
    color: "text-sky-500",
  },
}

/**
 * Traduce el código de método de pago a su etiqueta legible.
 */
export function getPaymentMethodLabel(method: string | null | undefined): string {
  if (!method) return "Desconocido"
  return PAYMENT_METHOD_CONFIG[method as PaymentMethod]?.label ?? method
}

/**
 * Obtiene la configuración completa del medio de pago.
 */
export function getPaymentMethodConfig(method: string | null | undefined): PaymentMethodConfig {
  if (!method) {
    return {
      label: "Desconocido",
      shortLabel: "—",
      description: "Medio de pago no especificado",
      color: "text-muted-foreground",
    }
  }
  return (
    PAYMENT_METHOD_CONFIG[method as PaymentMethod] ?? {
      label: method,
      shortLabel: method,
      description: method,
      color: "text-muted-foreground",
    }
  )
}

// ─── Categorías de Movimientos de Caja ─────────────────────────────────────────

export type CashCategory =
  | "work_order_payment"
  | "stock_sale"
  | "manual_income"
  | "manual_expense"
  | "purchase_payment"
  | "utility_expense"

export const CASH_CATEGORY_LABELS: Record<string, string> = {
  work_order_payment: "Pago de orden",
  stock_sale: "Venta de mostrador",
  manual_income: "Ingreso manual",
  manual_expense: "Gasto manual",
  purchase_payment: "Compra de repuestos",
  utility_expense: "Gasto operativo / Servicios",
  // Aliases históricos
  work_order_advance: "Adelanto / Seña",
  general_expense: "Gasto general",
  sale: "Venta directa",
  refund: "Reintegro / Devolución",
}

export function translateCashCategory(cat: string | null | undefined): string {
  if (!cat) return "Movimiento"
  return CASH_CATEGORY_LABELS[cat] ?? cat.replace(/_/g, " ")
}
