# Especificación de Edge Functions

Este documento define la arquitectura y requerimientos para las Edge Functions de Supabase necesarias en el sistema. Las Edge Functions actúan como una capa intermedia para manejar lógica de negocio compleja, integración con APIs de terceros y efectos secundarios que no deben ser responsabilidad directa del motor de base de datos PostgreSQL.

## Funciones Planeadas

### 1. `notify-whatsapp` (DESCARTADA -> Movida al Frontend)
- **Decisión Arquitectónica**: Se resolvió evitar el uso de una Edge Function y servidores Docker para esto por motivos de costo $0 y simplicidad de mantenimiento.
- **Nueva Solución**: El sistema utilizará **Deep Linking (Enlaces `wa.me`)**. El frontend compilará el mensaje con los datos de la orden y abrirá WhatsApp Web/Desktop en el equipo del usuario para que este lo envíe de forma manual, pero con el texto automatizado.

### 2. `notify-email`
- **Propósito**: Enviar correos electrónicos (ej. reportes, comprobantes, recordatorios).
- **Disparador**: Webhook desde la base de datos o llamada directa desde el cliente.
- **Flujo**: Similar a WhatsApp, utiliza un servicio externo (Resend, SendGrid) para despachar el correo.

### 3. `generate-pdf`
- **Propósito**: Generar documentos PDF para imprimir (Tickets de venta, Órdenes de ingreso).
- **Disparador**: Llamada HTTP directa desde el Frontend (`supabase.functions.invoke`).
- **Flujo**:
  1. El Frontend envía el ID de la orden (`work_order_id`) o el movimiento (`cash_movement_id`).
  2. La función consulta la base de datos para obtener los datos necesarios (usando el Service Role o el token del usuario).
  3. Renderiza un HTML/Plantilla con los datos.
  4. Utiliza una librería o servicio para convertir el HTML a PDF (ej. Puppeteer, o un servicio cloud).
  5. Devuelve el PDF al frontend para su descarga/impresión.

### 4. `arca-integration`
- **Propósito**: Facturación electrónica. (Ver `arca_integration.md` para más detalles).
- **Disparador**: Llamada HTTP directa desde el Frontend o Webhook.

## Configuración y Entorno
- Requiere inicializar el proyecto con Supabase CLI (`npx supabase init`).
- Configurar variables de entorno (`.env.local` y secretos de Supabase) para las API Keys de WhatsApp, Email y ARCA.
