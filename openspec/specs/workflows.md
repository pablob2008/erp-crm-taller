# Workflows y Lógica de Negocio (Frontend)

## 1. Cotizador Rápido (Modo Fantasma)
**Problema:** Crear cotizaciones/presupuestos que se guardan en la DB contamina los números de orden (saltos correlativos) y llena la base de datos de registros "basura" si el cliente no acepta el arreglo.

**Solución Implementada:**
- El "Presupuesto" es una vista puramente de Frontend (En Memoria).
- Permite ingresar datos del cliente, equipo, falla y precio estimado.
- Permite "Imprimir" (generar PDF o Ticket) SIN número de orden oficial (o usando un ID temporal tipo `PRE-FECHA`).
- **NO interactúa con la base de datos**.
- Solo si el cliente acepta, se habilita el botón "Ingresar al Taller", el cual hace el POST a la base de datos (`work_orders`), asignando finalmente el ID real y cambiando su estado directamente a `received`.
