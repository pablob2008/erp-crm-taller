# Frontend Design & Architecture Specs

## 1. Tema y Estética
- **Soporte de Temas:** El sistema debe soportar Modo Claro y Modo Oscuro por defecto.
- **Selector de Tema:** Se debe incluir un selector manual con opción "System" (para cambiar automáticamente según el SO o la hora).
- **Paleta de Colores (Color Scheme):** Se utilizará un esquema de colores neutros modernos (Shadcn "Zinc" como base) con una paleta de colores de acento sobria que cumpla con los estándares modernos de UI/UX corporativo (ej. Blue/Indigo).
- **Escalabilidad Visual:** La paleta de colores de acento debe estar definida mediante variables CSS (CSS variables) para permitir que el usuario pueda personalizarla desde el menú de Ajustes en futuras iteraciones.

## 2. Estructura de la Pantalla Principal (Dashboard)
El centro de comando principal debe estar enfocado en métricas operativas diarias.

### 2.1. Métricas Rápidas (KPI Cards)
Al iniciar sesión, la vista principal debe mostrar 3 tarjetas (Cards) principales:
1. **Órdenes pendientes de entrega para el día en curso:** (Filtro de `work_orders` con fecha estimada de entrega = hoy, y estado no finalizado).
2. **Compras pendientes:** Insumos o repuestos que faltan comprar o recibir (`purchases` status pending/ordered).
3. **Métricas de Caja:** Resumen del flujo de caja (Ingresos vs Egresos) con un toggle rápido para ver métricas "Semanales" o "Mensuales".

## 3. Integración de UI (Context7)
Para garantizar la escalabilidad y compatibilidad de los componentes, el desarrollo de la interfaz utilizará `Shadcn-ui` y `TailwindCSS`. Cualquier componente complejo debe ser consultado en vivo a través de la CLI de **Context7** para asegurar que se utilicen las mejores prácticas vigentes en la construcción del DOM y la accesibilidad (a11y).
