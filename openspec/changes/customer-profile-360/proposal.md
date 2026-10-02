## Why

El módulo de clientes actual tiene un directorio básico y un cálculo superficial de LTV, pero carece de una vista unificada (Perfil 360°) donde los usuarios puedan gestionar la identidad del cliente, visualizar todo su historial de órdenes de trabajo (taller) y analizar su estado financiero (saldos pendientes y movimientos de caja). Construir este perfil mejora la operativa diaria y centraliza la información del cliente.

## What Changes

- **Nueva Página de Perfil 360°**: Ruta `/customers/:id` con un layout tipo dashboard de tres paneles (Identidad, Taller, Finanzas).
- **Panel de Identidad**: Reutilización del formulario de edición de clientes (`CustomerEditModal.tsx`) para editar la información *inline*.
- **Panel de Taller**: Grilla/tabla con el historial de `work_orders` pertenecientes al cliente y navegación directa al detalle.
- **Panel Financiero**: Cálculo extendido del Total Gastado y **Saldo Pendiente**, integrando `cash_movements` vinculados a órdenes/ventas del cliente.
- **Botón Nuevo Cliente**: Agregado en el directorio `/customers` principal.

## Capabilities

### New Capabilities

### Modified Capabilities
- `crm-customer-management`: Agregar requerimientos de vista detallada 360° (Identity Panel, Workshop Panel, Financial Panel) y refactorizar/extender el History Snapshot para incluir saldos adeudados.

## Impact

- **Frontend**: `App.tsx` (nueva ruta), `/pages/CustomersPage.tsx`, `/pages/CustomerProfilePage.tsx` (nueva). Extracción de `CustomerEditModal.tsx` a un componente formulario reutilizable.
- **Backend (Supabase/Services)**: `lib/services/customers.ts` (Nuevas consultas `fetchCustomerWorkOrders` y `fetchCustomerFinancials` para no mezclar lógica en los componentes UI).
- **Base de Datos**: Ninguna migración (las tablas requeridas ya existen y las relaciones también). No hay mutations destructivas de base de datos, por ende no requiere rollback plan (aunque se respeta el ON DELETE RESTRICT existente).
