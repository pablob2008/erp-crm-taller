/**
 * lib/constants/order-status.ts
 * Diccionario canónico de estados de órdenes de trabajo para todo el ERP.
 * Fuente única de verdad para etiquetas, colores, badges y filtros de órdenes.
 */

export type OrderStatus =
  | "quotation"
  | "received"
  | "waiting_client"
  | "waiting_parts"
  | "ready_for_pickup"
  | "delivered"
  | "cancelled"

export interface OrderStatusConfig {
  label: string
  color: "blue" | "green" | "amber" | "red" | "muted"
  bg: string
  border: string
  text: string
  dot: string
  glow: string
  pulse: boolean
  description?: string
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, OrderStatusConfig> = {
  received: {
    label: "Recibido",
    color: "blue",
    bg: "bg-kpi-blue/10",
    border: "border-kpi-blue/30",
    text: "text-kpi-blue",
    dot: "bg-kpi-blue",
    glow: "shadow-[0_0_16px_0_hsl(var(--kpi-blue)/0.12)]",
    pulse: true,
    description: "Equipo ingresado al taller, pendiente de revisión.",
  },
  waiting_client: {
    label: "Esperando Cliente",
    color: "amber",
    bg: "bg-kpi-amber/10",
    border: "border-kpi-amber/30",
    text: "text-kpi-amber",
    dot: "bg-kpi-amber",
    glow: "shadow-[0_0_16px_0_hsl(var(--kpi-amber)/0.12)]",
    pulse: true,
    description: "Presupuesto o consulta enviada al cliente.",
  },
  waiting_parts: {
    label: "Esperando Repuesto",
    color: "red",
    bg: "bg-kpi-red/10",
    border: "border-kpi-red/30",
    text: "text-kpi-red",
    dot: "bg-kpi-red",
    glow: "shadow-[0_0_16px_0_hsl(var(--kpi-red)/0.12)]",
    pulse: false,
    description: "Repuesto pedido a proveedor, en espera de recepción.",
  },
  ready_for_pickup: {
    label: "Listo para Retirar",
    color: "green",
    bg: "bg-kpi-green/10",
    border: "border-kpi-green/30",
    text: "text-kpi-green",
    dot: "bg-kpi-green",
    glow: "shadow-[0_0_16px_0_hsl(var(--kpi-green)/0.15)]",
    pulse: true,
    description: "Reparación finalizada con éxito, listo para entregar.",
  },
  quotation: {
    label: "Cotización",
    color: "amber",
    bg: "bg-kpi-amber/10",
    border: "border-kpi-amber/30",
    text: "text-kpi-amber",
    dot: "bg-kpi-amber",
    glow: "shadow-[0_0_16px_0_hsl(var(--kpi-amber)/0.10)]",
    pulse: false,
    description: "Solo presupuesto emitido, equipo no ingresado.",
  },
  delivered: {
    label: "Entregado",
    color: "muted",
    bg: "bg-muted/40",
    border: "border-border/40",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
    glow: "",
    pulse: false,
    description: "Equipo retirado por el cliente.",
  },
  cancelled: {
    label: "Cancelado",
    color: "red",
    bg: "bg-kpi-red/10",
    border: "border-kpi-red/30",
    text: "text-kpi-red",
    dot: "bg-kpi-red",
    glow: "shadow-[0_0_16px_0_hsl(var(--kpi-red)/0.10)]",
    pulse: false,
    description: "Orden cancelada sin reparación.",
  },
}

export const FALLBACK_STATUS_CONFIG: OrderStatusConfig = {
  label: "Desconocido",
  color: "muted",
  bg: "bg-muted/30",
  border: "border-border/30",
  text: "text-muted-foreground",
  dot: "bg-muted-foreground",
  glow: "",
  pulse: false,
}

/**
 * Obtiene la configuración visual y de texto para cualquier estado de orden.
 */
export function getOrderStatusConfig(status: string | null | undefined): OrderStatusConfig {
  if (!status) return FALLBACK_STATUS_CONFIG
  return ORDER_STATUS_CONFIG[status as OrderStatus] ?? {
    ...FALLBACK_STATUS_CONFIG,
    label: status.replace(/_/g, " "),
  }
}

/**
 * Grupos de estados para filtros de pestañas y métricas.
 */
export const ORDER_STATUS_GROUPS = {
  /** Órdenes activas físicamente en el taller */
  in_workshop: ["received", "waiting_client", "waiting_parts", "ready_for_pickup"] as OrderStatus[],
  /** Órdenes cerradas/históricas */
  closed: ["delivered", "cancelled"] as OrderStatus[],
}
