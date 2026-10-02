# Auditoría Contable — ERP/CRM Taller

> **Fecha:** 2026-09-01  
> **Módulos auditados:** Dashboard, Caja/Finanzas, POS, Órdenes de Trabajo, Clientes  
> **Estado:** 4 bugs críticos corregidos. 5 issues pendientes de resolución.

---

## Resumen Ejecutivo

Se auditaron todos los módulos con flujo de dinero: dashboard de métricas, widget de
facturación pendiente, caja diaria, POS, detalle de orden y finanzas calculadas para clientes.
Se identificaron **4 bugs corregidos en esta sesión** y **5 issues menores/mejoras**
documentadas para iteración futura.

---

## 🔴 BUGS CRÍTICOS — Corregidos en esta sesión

### BUG-01: `UnbilledWidget` muestra órdenes ya facturadas como "sin facturar"

| Campo | Detalle |
|-------|---------|
| **Archivo** | `apps/web/src/lib/services/dashboard.ts` — `fetchDashboardMetrics()` |
| **Severidad** | 🔴 Crítico — información fiscal incorrecta visible al usuario |
| **Root cause** | La query de "órdenes sin facturar" no excluía las que ya tenían un registro aprobado en `arca_invoices`. Traía *todas* las órdenes no canceladas, independientemente de si ya habían sido facturadas. Esto produjo ~20 entradas duplicadas de la orden de test durante el desarrollo del módulo ARCA. |
| **Fix aplicado** | Se separó la query en dos pasos paralelos: (a) obtener todos los `work_order_id` con `arca_invoices.resultado = 'A'`, (b) traer todas las órdenes no canceladas, y luego filtrar client-side usando un `Set`. |
| **Código clave** | `const invoicedOrderIds = new Set(approvedInvoicesRes.data.map(r => r.work_order_id))` + `.filter(row => !invoicedOrderIds.has(row.id))` |

### BUG-02: `UnbilledWidget` ventas — usaba columna `cae` en lugar de `arca_invoice_id`

| Campo | Detalle |
|-------|---------|
| **Archivo** | `apps/web/src/lib/services/dashboard.ts` — query #3 |
| **Severidad** | 🔴 Crítico — la columna `cae` en `sales` se poblaba directamente como campo legacy; `arca_invoice_id` es la FK canónica al registro fiscal |
| **Root cause** | El filtro `.is("cae", null)` podría mostrar ventas como "sin facturar" aunque exista un `arca_invoice` aprobado vinculado vía `arca_invoice_id`. La columna `cae` en `sales` es una redundancia de display, no la fuente de verdad. |
| **Fix aplicado** | Cambiado a `.is("arca_invoice_id", null)` — la FK es la fuente de verdad. |

### BUG-03: `FinancePage` no filtraba por `branch_id`

| Campo | Detalle |
|-------|---------|
| **Archivo** | `apps/web/src/pages/FinancePage.tsx` |
| **Severidad** | 🔴 Crítico — en un sistema multi-branch, mostraría movimientos de caja de todas las sucursales |
| **Root cause** | La query de `cash_movements` del día no incluía `.eq("branch_id", branchId)`. Si el sistema alguna vez tiene más de una sucursal en la misma instancia de Supabase, esto expone datos cruzados. |
| **Fix aplicado** | Agregado `.eq("branch_id", branchId)` y la dependencia `branchId` al array del `useEffect`. |

### BUG-04: `recalculateOrderFinancials` sumaba *todos* los `type=income` como `total_paid`

| Campo | Detalle |
|-------|---------|
| **Archivo** | `apps/web/src/lib/services/work-order-details.ts` |
| **Severidad** | 🟠 Alto — podría inflar `total_paid` si se registran ingresos de tipo `manual_income` que no sean cobros del cliente |
| **Root cause** | La función sumaba **todos** los movimientos con `type='income'` para la orden, incluyendo categorías como `manual_income` de naturaleza ambigua. |
| **Fix aplicado** | Acotado a `category IN ('work_order_payment', 'work_order_advance', 'manual_income')` — las únicas categorías que representan cobros al cliente. |

### BUG-05: `ticketCount` en KPIs contaba ventas anuladas (`voided`)

| Campo | Detalle |
|-------|---------|
| **Archivo** | `apps/web/src/lib/services/dashboard.ts` — `fetchDashboardMetrics()` |
| **Severidad** | 🟡 Medio — el contador de tickets del período incluía ventas canceladas |
| **Root cause** | `const ticketCount = rawSales.length` sin filtrar `status !== 'voided'`. |
| **Fix aplicado** | `const ticketCount = rawSales.filter(s => s.status !== 'voided').length` |

---

## 🟡 ISSUES MENORES / MEJORAS PENDIENTES

### ISSUE-06: `recalculateOrderFinancials` se llama client-side, no por trigger DB

| Severidad | 🟡 Medio |
|-----------|----------|
| **Descripción** | `total_paid` y `balance` en `work_orders` se recalculan desde el cliente con una segunda query después de cada movimiento. Si la llamada falla o el cliente se desconecta entre el INSERT y el UPDATE, los valores quedan desincronizados. |
| **Solución recomendada** | Mover el recálculo a un trigger PostgreSQL `AFTER INSERT OR UPDATE OR DELETE ON cash_movements`. El schema ya tiene triggers para `work_order_payment` pero no para `manual_income` ni `work_order_advance`. |
| **Riesgo actual** | Bajo en uso single-user, medio si dos sesiones modifican la misma orden simultáneamente. |

### ISSUE-07: `FinancePage` no tiene paginación ni rango de fechas

| Severidad | 🟡 Medio |
|-----------|----------|
| **Descripción** | La página de Caja solo muestra movimientos de *hoy*. No hay selector de rango de fechas ni paginación. Si hay muchos movimientos históricos, el usuario no puede auditarlos. |
| **Solución recomendada** | Agregar un selector de rango de fechas similar al `GlobalDateFilter` del Dashboard, y limitar a 100 resultados con paginación. |

### ISSUE-08: `DashboardPage` — `ticketCount` vs `salesHistory.length` son confusos

| Severidad | 🟡 Medio |
|-----------|----------|
| **Descripción** | El KPI "Tickets" muestra `ticketCount` (ahora sin anuladas), pero `SalesHistoryWidget` muestra la lista completa incluyendo anuladas (con badge "Anulada"). El usuario ve N tickets en el KPI pero N+M filas en la tabla. |
| **Solución recomendada** | El widget de historial ya muestra el badge correctamente. Agregar un contador de "X anuladas" en el header del widget para que sea claro por qué el número difiere. |

### ISSUE-09: `UnbilledWidget` — tab "Órdenes" muestra todas las órdenes activas, no solo las "completadas"

| Severidad | 🟡 Medio |
|-----------|----------|
| **Descripción** | Ahora que el fix excluye órdenes con ARCA aprobada, el tab "Órdenes Sin Facturar" sigue mostrando órdenes en estado `in_progress`, `waiting_parts`, `budget_pending`, etc. Una orden `in_progress` no puede facturarse todavía — mostrarla como "sin facturar" genera ruido. |
| **Solución recomendada** | Filtrar a estados terminales o casi-terminales: `status IN ('ready_for_pickup', 'delivered')`. Las órdenes en reparación no aplican a facturación ARCA. |
| **Cambio propuesto en `dashboard.ts`** | Agregar `.in("status", ["ready_for_pickup", "delivered"])` a la query `allOrdersRes`. |

### ISSUE-10: `work-order-details.ts` — `addOrderPayment` no pasa `registerId` correctamente

| Severidad | 🟢 Bajo |
|-----------|---------|
| **Descripción** | `addOrderPayment` recibe `registerId` como parámetro y lo pasa a `cash_register_id`. Sin embargo, el modal de pago en `FinancesTab.tsx` puede llamarla con un `registerId` vacío o inválido si el cajero no está configurado en la sucursal. No hay validación. |
| **Solución recomendada** | Validar que `registerId` sea un UUID válido antes del INSERT, o permitir `null` con la restricción de que el reporte de caja lo muestre como "sin caja asignada". |

---

## Flujo de datos actual — Mapa de consistencia

```
POS checkout
  └─→ sales (INSERT)
  └─→ sale_items (INSERT, descuenta stock)
  └─→ cash_movements (INSERT type=income, category=sale)
       └─→ trigger: recalcula work_orders.total_paid si work_order_id set
  └─→ arca_invoices (INSERT vía Edge Function, result=A)
       └─→ sales.arca_invoice_id (UPDATE back-link)

Orden de Trabajo — pago parcial
  └─→ cash_movements (INSERT type=income, category=work_order_payment)
       └─→ trigger DB: recalcula work_orders.total_paid, balance
       └─→ recalculateOrderFinancials() [client-side redundante con trigger]

Dashboard
  └─→ sales (query por rango de fechas) → KPIs, SalesHistory
  └─→ arca_invoices (query approved) → Set de IDs facturados
  └─→ work_orders (query all non-cancelled) → filter client-side → UnbilledOrders
  └─→ work_orders (balance > 0, status ready/delivered) → PendingDebt
  └─→ cash_movements (hoy) → ActivityFeed, TodaysCash KPI

FinancePage
  └─→ cash_movements (hoy, branch_id) → balance diario [CORREGIDO]
```

---


### RDD Fix — Arquitectura de Base de Datos (Single Source of Truth)
- **Problema detectado tras despliegue**: Al aplicar manualmente la migración del trigger (`20260902000000_extend_cash_movement_trigger.sql`), los saldos de los equipos a entregar y los históricos de los clientes quedaron erróneos. El motivo es que los triggers en Postgres actúan de forma incremental (`AFTER INSERT/UPDATE`). Si existían ingresos manuales o señas en la tabla `cash_movements` registrados *antes* de que el trigger fuera actualizado, el `total_paid` de esas órdenes nunca sumó ese dinero.
- Al haber eliminado la función `recalculateOrderFinancials()` del lado del cliente (que antes forzaba el recálculo y ocultaba la desincronización de la base de datos), el desfasaje histórico salió a la luz.
- **Solución implementada**:
  1. Se mantuvo la eliminación del parche client-side `recalculateOrderFinancials()` para respetar estrictamente la arquitectura donde la Base de Datos es la única fuente de la verdad.
  2. Se creó una nueva migración: `20260902010000_recalculate_historical_work_order_balances.sql`. Este script recalcula de forma absoluta y orgánica el campo `total_paid` de absolutamente todas las órdenes sumando sus `cash_movements` históricos. Al correr esta migración, el pasado queda 100% saneado, y de aquí en adelante el trigger se encarga de mantenerlo perfecto.
  3. Se solucionó también en `dashboard.ts` el problema de las "entregas desde las órdenes": si una orden se entrega vinculándola a una venta de mostrador (POS), la factura fiscal se asocia al `sale`. Ahora el widget `UnbilledWidget` busca las facturas vinculadas indirectamente por el POS para sacar del panel a las órdenes correctamente facturadas.

## Checklist de producción post-auditoría

- [x] `UnbilledWidget` excluye órdenes con ARCA aprobada
- [x] `UnbilledWidget` ventas filtradas por `arca_invoice_id IS NULL`
- [x] `FinancePage` filtra por `branch_id`
- [x] `recalculateOrderFinancials` client-side **eliminada** — reemplazada por trigger DB
- [x] Trigger `fn_sync_cash_movement_to_work_order` extendido: cubre `work_order_advance` y `manual_income`
- [x] Migración `20260902000000_extend_cash_movement_trigger.sql` creada
- [x] `ticketCount` KPI excluye ventas anuladas
- [x] **ISSUE-06**: Recálculo movido a trigger DB ✅
- [x] **ISSUE-07**: `FinancePage` con `GlobalDateFilter` + paginación de 50 registros ✅
- [x] **ISSUE-09**: Filtrar `UnbilledOrders` a `ready_for_pickup | delivered` ✅
- [x] **ISSUE-10**: `addOrderPayment` valida `registerId`, `amount` y `method` ✅
- [ ] ⚠️ **Pendiente deploy**: `npx supabase db push` para aplicar la migración del trigger en Supabase
