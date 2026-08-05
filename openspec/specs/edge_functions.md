# Especificación de Edge Functions

Este documento define la arquitectura y requerimientos para las Edge Functions de Supabase necesarias en el sistema. Las Edge Functions actúan como una capa intermedia para manejar lógica de negocio compleja, integración con APIs de terceros y efectos secundarios que no deben ser responsabilidad directa del motor de base de datos PostgreSQL.

## Funciones Planeadas

### 1. `notify-whatsapp` (DESCARTADA -> Movida al Frontend)
- **Decisión Arquitectónica**: Se resolvió evitar el uso de una Edge Function y servidores Docker para esto por motivos de costo $0 y simplicidad de mantenimiento.
- **Nueva Solución**: El sistema utilizará **Deep Linking (Enlaces `wa.me`)**. El frontend compilará el mensaje con los datos de la orden y abrirá WhatsApp Web/Desktop en el equipo del usuario para que este lo envíe de forma manual, pero con el texto automatizado.

### 2. `notify-email` (DESCARTADA)
- **Decisión Arquitectónica**: Eliminado a petición del negocio. Se prioriza la comunicación por WhatsApp y la entrega física. Si se requiere email, se manejará de forma 100% manual.

### 3. `generate-pdf` (DESCARTADA -> Movida al Frontend)
- **Decisión Arquitectónica**: Como el objetivo es entregar un comprobante en el momento (impreso o exportado a PDF manualmente para enviar), la generación nativa en backend resulta un sobre-esfuerzo innecesario y costoso a nivel servidor.
- **Nueva Solución**: El Frontend contará con vistas de impresión en HTML/CSS y utilizará la función nativa del navegador (`window.print()`). Si el usuario necesita el archivo digital, puede seleccionar "Guardar como PDF" en el diálogo del sistema operativo.

### 4. `arca-integration`
- **Propósito**: Facturación electrónica. (Ver `arca_integration.md` para más detalles).
- **Disparador**: Llamada HTTP directa desde el Frontend o Webhook.

## Configuración y Entorno
- Requiere inicializar el proyecto con Supabase CLI (`npx supabase init`).
- Configurar variables de entorno (`.env.local` y secretos de Supabase) para las API Keys de WhatsApp, Email y ARCA.
