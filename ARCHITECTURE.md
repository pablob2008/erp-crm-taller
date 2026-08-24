# Arquitectura del Proyecto (Monorepo Readiness)

Este documento define la estructura y filosofía arquitectónica del ERP/CRM. El proyecto nace con la intención de soportar tanto una aplicación Web (React) como una aplicación Mobile (React Native / Android) en el futuro. 

Para lograr esto sin duplicar código, seguimos los principios de **Clean Architecture** orientada a un entorno **Monorepo**.

## Estructura Actual y Futura

Actualmente el proyecto reside en:
`/apps/web` (Frontend Web en React/Vite)

En el futuro, la arquitectura adoptará la forma de un Monorepo completo (mediante herramientas como Turborepo o Yarn Workspaces):
```text
ERPCRMTALLER/
├── apps/
│   ├── web/        (Frontend Web)
│   └── mobile/     (Frontend Android/iOS en React Native)
├── packages/
│   ├── core/       (Lógica de negocio, servicios, tipos, Supabase)
│   └── ui/         (Opcional: Sistema de diseño agnóstico)
```

## Reglas de Juego (MANDATORIAS)

Para facilitar la transición futura de la carpeta `lib/services` a un paquete independiente (`packages/core`), todo el equipo de desarrollo debe adherirse estrictamente a las siguientes normativas:

### 1. Los Servicios (`/services`) deben ser agnósticos de la UI
Toda la lógica alojada en `apps/web/src/lib/services`:
- **NO debe importar nada de React (vistas, componentes).**
- **NO debe depender del DOM del navegador** (ej. `window`, `document` o APIs exclusivas del navegador a menos que estén abstraídas).
- **NO debe saber de Tailwind ni de estilos visuales.**
- **Debe exportar funciones puras o clases de servicio** que reciban parámetros simples y devuelvan promesas con datos u objetos de error estructurados.

### 2. La UI es un detalle de implementación
Los componentes (dentro de `/components` o `/pages`) son los únicos responsables de:
- Llamar a los servicios.
- Manejar los estados de carga (`isLoading`).
- Formatear los datos crudos para mostrarlos visualmente.
- Disparar alertas visuales (toasts, modales) basadas en las respuestas del servicio.

### 3. Tipado Centralizado
Los tipos base (`Customer`, `Order`, `Movement`) deben definirse en los archivos de servicio correspondientes o en archivos globales `.ts`, para que en el futuro la app Mobile pueda importar exactamente las mismas interfaces y mantengamos la integridad de datos a través de todas las plataformas.

---
*Nota: Si se rompen estas reglas acoplando lógica de negocio con la UI (ej. formatear un div dentro de un servicio de Supabase), la migración a la app Mobile requerirá reescribir toda esa lógica.*
