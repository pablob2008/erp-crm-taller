# Especificación: Integración de Facturación Electrónica ARCA (ex AFIP)

## 1. Objetivo y Alcance
Esta especificación define la arquitectura y el contrato de comunicación para emitir facturas electrónicas a través de los Web Services de ARCA (WSFE V1).
El objetivo principal es aislar completamente la lógica criptográfica y la comunicación con AFIP del frontend, garantizando la seguridad de las claves privadas y evitando vulnerabilidades de exposición de datos (CORS, robo de tokens).

## 2. Arquitectura (Cimientos)
La implementación se basará en una **Supabase Edge Function** llamada `arca-invoice`. 

**Flujo de Datos:**
1. **Frontend:** El cliente (navegador) hace una llamada segura a la Edge Function pasando únicamente el ID de la entidad a facturar (Orden de Trabajo o Movimiento de Caja). No envía importes ni datos sensibles.
2. **Edge Function (Backend):**
   - Valida el token JWT del usuario que hace la petición.
   - Usa la clave `service_role` (bypass de RLS) para consultar internamente la base de datos: obtiene los montos reales de la tabla `work_orders`, el `cuit` de `arca_configs`, y los certificados correspondientes.
   - Genera el payload XML para el Web Service de AFIP.
   - Firma criptográficamente el payload usando el certificado (`.crt`) y la llave privada (`.key`).
   - Se comunica con el servidor SOAP de AFIP.
   - Recibe el CAE (Código de Autorización Electrónico) y la fecha de vencimiento.
   - Guarda el registro en la tabla `arca_invoices` con estado `'A'` (Aprobado).
3. **Frontend:** Recibe la confirmación y el CAE para mostrar o imprimir el ticket.

## 3. Gestión de Claves y Certificados (Multitenant)
Como el sistema soporta múltiples sucursales (multitenant) y cada sucursal puede tener su propio CUIT:
- **No se guardarán** las llaves `.key` ni los `.crt` en texto plano en la tabla `arca_configs`.
- Se creará un bucket privado en Supabase Storage llamado `arca_certs`.
- Las políticas de seguridad (RLS) de este bucket **bloquearán toda lectura pública y de usuarios autenticados**.
- Solo la Edge Function (usando `service_role`) podrá descargar estos archivos en memoria al momento de facturar.

## 4. Contrato de la API (Edge Function)

### Endpoint
`POST /functions/v1/arca-invoice`

### Request (Frontend -> Edge Function)
El frontend debe enviar un JSON simple indicando qué quiere facturar.

```json
{
  "target_type": "work_order", // o "cash_movement"
  "target_id": "uuid-de-la-orden-o-movimiento",
  "cbte_tipo": 6, // 6: Factura B, 11: Factura C, etc.
  "doc_tipo": 99, // 99: Consumidor Final, 80: CUIT, 96: DNI
  "doc_nro": "0"  // Número de CUIT/DNI o "0" para Consumidor Final
}
```

*Nota Arquitectónica:* El frontend NO envía importes (`imp_total`, `imp_neto`). La Edge Function los calcula leyendo directamente de la base de datos de forma segura para evitar manipulaciones (Client-Side Spoofing).

### Response Exitoso (Edge Function -> Frontend)
```json
{
  "success": true,
  "invoice_id": "uuid-del-registro-en-arca_invoices",
  "cae": "73000000000000",
  "cae_fch_vto": "2026-08-15",
  "message": "Factura generada y aprobada correctamente."
}
```

### Response Error (Edge Function -> Frontend)
```json
{
  "success": false,
  "error_code": "AFIP_REJECTED",
  "message": "ARCA rechazó el comprobante: CUIT destinatario inválido.",
  "details": { ... }
}
```

## 5. Casos de Borde y Protecciones (Base de Datos)
- **Doble Facturación:** Si el frontend envía dos peticiones simultáneas, la primera insertará en `arca_invoices` obteniendo el CAE. La segunda fallará gracias a los `UNIQUE INDEX` agregados en el esquema de la base de datos (Postgres). La Edge Function atrapará este error de base de datos y devolverá un `error_code: "ALREADY_INVOICED"`.
- **Expiración del Token WSAA:** El token de acceso a AFIP (WSAA) dura 12 horas. La Edge Function debe verificar `wsaa_expiration` en `arca_configs`. Si está expirado, debe generar uno nuevo, actualizar la base de datos, y luego emitir la factura (todo en la misma ejecución).
