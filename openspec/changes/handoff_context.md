# Handoff Context: CRM Customer Management Module

## Estado Actual (Current Status)
Acabamos de finalizar un bloque de mejoras de Quality of Life (QoL) en el sistema actual:
1. **Finanzas**: Se agregó el botón manual para "Registrar Pago" (ingresos ad-hoc) y se mejoró la lógica del botón "Entregar" para que cuando el saldo es $0, diga "Entregar (Saldo Cubierto)" y no exija agregar un monto ni hable de "crédito".
2. **Tablero de Compras**: Ahora las compras vinculadas a órdenes muestran la marca y modelo del dispositivo. Haciendo click en la fila, te lleva directamente al detalle de la orden.
3. **Órdenes**: El filtro por defecto al entrar a `/orders` ahora es `in_workshop` (En Taller) en lugar de "Todos".
4. **Formularios (Global)**: Se eliminaron con CSS las flechas de `spin-buttons` de todos los inputs numéricos. Los campos de presupuesto y seña inician vacíos para facilitar el tipeo rápido.

Todo esto ya fue implementado, verificado por el compilador y commiteado a la rama `main`.

## Próximo Objetivo: Módulo de Clientes (Customer Profile 360°)
Se acordó avanzar con el módulo de clientes, construyendo sobre la base relacional existente. No se requieren migraciones de base de datos mayores, ya que las tablas `customers`, `work_orders`, `sales` y `cash_movements` ya están preparadas.

### Diseño Acordado a Implementar:
1. **Directorio (`/customers`)**: Tabla general de clientes con buscador (nombre, teléfono, DNI/CUIT) y botón para crear "Nuevo Cliente" de forma independiente.
2. **Perfil 360° (`/customers/:id`)**:
   - **Panel de Identidad**: Datos editables (Nombre, DNI, Teléfono, Email).
   - **Panel de Taller**: Grilla con historial de `work_orders` pertenecientes al cliente.
   - **Panel Financiero**: Cálculo de *Total Gastado* y *Saldo Pendiente* (cruzando `balance` de órdenes), junto con el historial cruzado de pagos/movimientos.
3. **Reglas de Integridad Críticas**:
   - Respetar el `ON DELETE RESTRICT` de la base de datos: La UI debe bloquear de manera segura o capturar el error si se intenta borrar un cliente que ya tiene órdenes de trabajo vinculadas.

## Reglas de Arquitectura y Convenciones del Proyecto
- **Estilos UI**: Glassmorphism (`bg-background/40 backdrop-blur-md border-border/40`). Neumorphism solo para botones de acción.
- **Tailwind**: No usar strings dinámicos de Tailwind, usar clases estáticas siempre.
- **Selects**: Usar `<select>` nativos estilizados con Tailwind.
- **Git**: El agente NUNCA debe hacer commit o push automáticamente. Eso lo hace el usuario manualmente.

## Instrucciones para el Próximo Agente
1. Lee este documento exhaustivamente.
2. Reconocé que la etapa de SDD está por empezar para el feature `crm-customer-management`.
3. Informá al usuario que estás listo para usar los workflows de OpenSpec (como `/openspec-propose`) para armar las especificaciones y arrancar a programar el módulo de clientes.
