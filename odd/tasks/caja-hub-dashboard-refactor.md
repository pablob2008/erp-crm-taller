# ODD: Reestructuración de Hub Financiero en Caja y Restauración de Dashboard Operativo

> **Feature**: `caja-hub-dashboard-refactor`
> **Estado**: En progreso
> **Fecha**: 2026-10-02

---

## Contexto y Objetivos

- **Objetivo 1**: Desacoplar la gestión fiscal y de comprobantes del Dashboard. Devolver a `DashboardPage.tsx` su rol de **Panel Operativo del Taller** (máquinas en reparación, estados, stock crítico, órdenes recientes).
- **Objetivo 2**: Convertir `FinancePage.tsx` en el **Hub Financiero, de Comprobantes y Facturación ARCA**:
  - Pestaña 1: **Movimientos de Caja** (Flujo de ingresos/egresos, arqueo, paginación, KPIs).
  - Pestaña 2: **Comprobantes y Ventas** (Historial de ventas de mostrador y cobros de órdenes entregadas, con buscador y botón de reimpresión de comprobante no fiscal).
  - Pestaña 3: **Facturación Electrónica ARCA** (Ventas y órdenes entregadas sin facturar con botón de emisión en vivo vía Edge Function + listado de facturas oficiales emitidas con CAE/QR).
  - Pestaña 4: **Cuentas por Cobrar** (Órdenes entregadas o listas con saldo adeudado y enlace directo para cobrar).
- **Objetivo 3**: Mantener la Base de Datos como única fuente de verdad, respetando las llamadas puras a Supabase y sin romper la emisión en POS o la vista de órdenes.

---

## Tareas

- [ ] **Tarea 1**: Restaurar `DashboardPage.tsx` como Panel Operativo del Taller
  - Reintegrar `fetchDashboardData` (activeWorkshop, readyForPickup, todaysCash, stockAlerts, pipeline, recentOrders, recentActivity).
  - Montar KpiCards, PipelineWidget, RecentOrdersWidget, ActivityFeedWidget y QuickActionsWidget.
  - Eliminar del Dashboard los widgets financieros repetidos.

- [ ] **Tarea 2**: Optimizar componentes de facturación y comprobantes para Caja
  - Añadir soporte para emitir factura fiscal directa en el widget de pendientes (`emitInvoice`).
  - Añadir soporte de consulta para facturas emitidas históricas (`fetchInvoicesByBranch`).

- [ ] **Tarea 3**: Reestructurar `FinancePage.tsx` como Hub Financiero con Pestañas
  - Integrar selector de fechas global (`GlobalDateFilter`) y KPIs de resumen financiero.
  - Estructurar 4 Pestañas estilizadas con badges de conteo:
    1. Movimientos de Caja
    2. Comprobantes de Venta
    3. Facturación Electrónica ARCA
    4. Cuentas por Cobrar
  - Conectar el motor de impresión `PrintableInvoice` para tickets y A4.

- [ ] **Tarea 4**: Verificación Integral y Limpieza
  - Ejecutar `npm run build` (`tsc -b && vite build`) garantizando 0 errores.
  - Validar que no haya regresiones en POS ni en la pestaña de finanzas de órdenes de trabajo.
  - Crear commit atómico con los cambios.
