# Auditoría Arquitectónica: Facturación Electrónica ARCA (ex AFIP) y Flujos de Ingreso

> **Fecha:** Septiembre 2026  
> **Proyecto:** ERPCRMTALLER  
> **Archivo generado:** `AUDITORIA_ARCA_AFIP.md` (Guardado localmente para consulta post-reinicio)

---

## 1. Resumen Ejecutivo
Este documento recopila el análisis arquitectónico exhaustivo realizado sobre el sistema, abordando dos puntos críticos:
1. **El cálculo de Total Gastado (LTV) y categorización Casual vs VIP** en clientes (ya corregido en código).
2. **El estado real de preparación para Facturación Electrónica ARCA (WSFE v1)**, detallando qué está listo y cuáles son las 4 inconsistencias críticas que deben resolverse antes de pasar a producción.

---

## 2. Bug Resuelto: Total Gastado (LTV) y Clientes Casuales/VIP

### ¿Qué ocurría?
- El módulo de clientes (`customers.ts`) calculaba el *Lifetime Value* consultando únicamente la tabla `sales` (`from('sales').select('total')`).
- La tabla `sales` fue introducida a fines de agosto exclusivamente para el módulo de **Punto de Venta (POS)**.
- En un taller de reparaciones, la mayor parte de los cobros suceden en el circuito de **Órdenes de Trabajo (`work_orders`)**:
  - Adelantos/señas al crear la orden (`advance_payment`).
  - Pagos parciales ad-hoc con el botón "Registrar Pago" (`manual_income`).
  - Cobros en taller al momento de la entrega (`work_order_payment`).
  - Entregas con saldo cubierto.
- Todos estos cobros ingresan en `cash_movements` y actualizan `work_orders.total_paid`, **sin generar jamás una fila en `sales`**.

### ¿Por qué parecía funcionar con algunas órdenes viejas?
- Si una orden se entregaba utilizando la pantalla del POS (`/pos` $\rightarrow$ *Entregar Orden*), el POS creaba un registro en `sales` con el `customer_id`. En esos casos específicos, el cálculo sumaba esa venta.
- Clientes viejos y recurrentes con 5 o más órdenes mostraban el distintivo **★ VIP** únicamente porque tenían `orderCount >= 5`, enmascarando que su LTV en dinero marcaba `$0,00`.
- Clientes con 2 o 3 reparaciones de alto valor ($150.000+) quedaban catalogados como clientes casuales con $0 gastados.

### Solución Implementada en Código
En `apps/web/src/lib/services/customers.ts` (`fetchCustomers`, `fetchCustomerFinancials`, `fetchCustomerHistorySnapshot`) y en `CustomerProfilePage.tsx`:
1. **Unificación de Ingresos**: 
   $$\text{LTV Real} = \sum (\text{work\_orders.total\_paid}) + \sum (\text{sales.total donde } \text{work\_order\_id IS NULL})$$
   Se filtran ventas de POS sin `work_order_id` para evitar duplicar órdenes entregadas vía POS.
2. **Historial Financiero Unificado**: La tabla de movimientos en el Perfil 360° ahora recupera tanto los cobros de taller como los tickets directos de POS.
3. **Badges de Cliente**: Se alineó la visualización en el perfil 360°:
   - **★ VIP** (Ámbar): $\ge 5$ órdenes o $\ge \$100.000$ gastados.
   - **Cliente Activo** (Azul): $> 0$ órdenes o $> \$0$ gastado.
   - **Cliente Casual** (Gris): sin consumos registrados.

---

## 3. Estado de la Tabla `sales` y su Relación con ARCA

La tabla `sales` (y `sale_items`) fue concebida como **ARCA-Ready**:
- Contiene los campos exigidos por el fisco: `customer_doc_type` (99=CF, 80=CUIT, 96=DNI), `customer_doc_number`, `invoice_type`, `invoice_number`, `cae`, `cae_expires_at`, `afip_qr_data`, y en `sale_items` la alícuota `tax_rate` (21%).
- El motor de impresión (`InvoiceA4.tsx`, `FiscalQRBlock.tsx`) cuenta con **comportamiento dinámico**:
  - Sin CAE: Letra "X" y marca de agua *"DOCUMENTO NO VÁLIDO COMO FACTURA"*.
  - Con CAE: Letra fiscal real (A/B/C), remoción de marca de agua y renderizado del QR oficial en formato SVG.

---

## 4. Las 4 "Bombas de Tiempo" a Desactivar en ARCA

Antes de conectar la Edge Function `supabase/functions/arca-invoice` a producción con certificados reales, es obligatorio corregir los siguientes puntos:

### Bomba 1: Desfase de nombres en la Edge Function (`index.ts`)
El prototipo de la Edge Function quedó con nombres de campos ficticios:
- Busca `work_orders.total_amount` $\rightarrow$ El campo real en la BD es `estimated_cost` o `total_paid`.
- Busca `cash_movements.amount` $\rightarrow$ El campo real en la BD es `net_amount`.
- Consulta la tabla `users` $\rightarrow$ En Supabase es `profiles`.
- Inserta en la BD columnas como `voucher_number`, `voucher_type`, `expiration_date` $\rightarrow$ En la tabla `arca_invoices` se llaman `cbte_nro`, `cbte_tipo`, `cae_fch_vto`.

### Bomba 2: Conflicto de titularidad del CAE (`arca_invoices` vs `sales`)
- La base de datos original tiene la tabla `public.arca_invoices` con restricciones UNIQUE anti-duplicación (`idx_unica_factura_orden`).
- El módulo de POS agregó campos de CAE directamente en `public.sales`.
- **Riesgo:** Si la Edge Function guarda el CAE en `arca_invoices`, pero el motor de impresión busca el CAE en `sales`, el comprobante de venta seguirá imprimiéndose como "X" (no fiscal). Debe unificarse la fuente de la verdad fiscal.

### Bomba 3: Riesgo de CAE "Huérfano" (Corte de red post-aprobación)
- En AFIP/ARCA, una vez emitido el CAE, la factura tiene validez jurídica y fiscal inmediata.
- Si la Edge Function obtiene el CAE de AFIP pero falla el `INSERT` en Supabase (por microcorte de red, timeout o error de schema), el cliente recibe un error pero la factura quedó aprobada en AFIP.
- Si el usuario reintenta, AFIP rechazará el envío por comprobante duplicado o salto de numeración.
- **Solución requerida:** Consulta preventiva del último comprobante (`getLastVoucher`) y manejo transaccional robusto de contingencias.

### Bomba 4: Régimen Tributario (Monotributo vs Responsable Inscripto)
- Hoy la Edge Function envía `ImpIVA: 0` e `ImpNeto: importeTotal` de forma rígida.
- Si la empresa es **Monotributo (Factura C)**: Es válido.
- Si la empresa es **Responsable Inscripto (Facturas A y B)**: AFIP rechaza el lote si no se envía el desglose del array `Iva` con su base imponible y débito fiscal correspondiente.

---

## 5. Hoja de Ruta para cuando encaremos ARCA
1. **Unificar modelo de datos**: Definir si el comprobante fiscal maestro vive en `arca_invoices` (y se vincula a `sales`/`work_orders`) o directamente en `sales`.
2. **Actualizar la Edge Function**: Corregir los nombres de columnas reales y agregar soporte para `target_type === 'sale'`.
3. **Cargar Certificados en Supabase Storage**: Subir `cert.crt` y `private.key` al bucket privado `arca_certs` bajo la carpeta `{branch_id}/`.
4. **Pruebas en Homologación**: Probar en el entorno de testing de AFIP (con CUIT y certificados de prueba) antes de solicitar certificados de producción.
