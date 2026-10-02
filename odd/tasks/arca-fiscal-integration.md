# Feature: ARCA Fiscal Integration (Facturación Electrónica)

> **Inicio:** Septiembre 2026
> **Modalidad:** ODD — Ejecución directa en sesión principal (Modalidad A, máximo razonamiento)
> **Decisiones del usuario:**
> - Comprobante fiscal centralizado en `arca_invoices` (no en `sales`).
> - Monotributo como condición tributaria inicial, escalable a Responsable Inscripto.
> - Idempotencia fuerte contra CAE huérfanos.
> - Mock/sandbox para pruebas sin certificados reales.
> - Escalable para release SaaS multi-tenant.

---

## Tasks

### 1. Migración de Base de Datos: Extender `arca_configs` y vincular `arca_invoices` ↔ `sales`
- [ ] Crear migración SQL:
  - Agregar a `arca_configs`: `tax_condition`, `business_name`, `fantasy_name`, `iibb`, `activity_start_date`, `is_active`.
  - Agregar a `arca_invoices`: `sale_id UUID REFERENCES sales(id)` + UNIQUE index parcial.
  - Agregar a `sales`: `arca_invoice_id UUID REFERENCES arca_invoices(id)`.
- [ ] Actualizar `supabase_schema.sql` como referencia canónica.
- [ ] Verificar que la migración aplica sin errores.
- **Commit:** `feat(db): extend arca_configs with tax regime and link arca_invoices to sales`

### 2. Reescribir Edge Function `arca-invoice` con nombres reales y blindaje
- [ ] Alinear todos los nombres de columnas con el esquema real (`profiles`, `net_amount`, `estimated_cost`, `total_paid`, `cbte_nro`, `cae_fch_vto`, etc.).
- [ ] Leer configuración fiscal desde `arca_configs` (no hardcodeada).
- [ ] Implementar idempotencia: verificar `arca_invoices` antes de llamar a ARCA.
- [ ] Soporte para `target_type`: `work_order`, `sale`, `cash_movement`.
- [ ] Lógica de IVA condicional según `tax_condition` (Monotributo → C, RI → A/B con array Iva).
- [ ] Modo mock/sandbox: si `environment === 'homologacion'` y no hay certificados, simular respuesta ARCA.
- [ ] Generar QR payload oficial (JSON base64url per RG 4291/2018).
- [ ] Manejo de CAE huérfano: log de emergencia si falla el INSERT post-aprobación ARCA.
- [ ] Actualizar `sales.arca_invoice_id` cuando `target_type === 'sale'`.
- **Commit:** `feat(edge): rewrite arca-invoice with real schema, idempotency, and tax regime support`

### 3. Servicio frontend `arca.ts` (UI-agnostic)
- [ ] Crear `apps/web/src/lib/services/arca.ts` con funciones para invocar la Edge Function y consultar `arca_configs` / `arca_invoices`.
- [ ] Mantener 100% UI-agnostic (sin React, sin DOM).
- **Commit:** `feat(services): add arca fiscal service layer`

### 4. Build verification
- [ ] `npm run build` pasa sin errores de TypeScript.
- **Commit:** N/A (verificación, no código nuevo)

---

## Evidence
| Task | Commit | Verified |
|------|--------|----------|
| 1 - Migración DB | pendiente de commit del usuario | ✅ Schema canónico actualizado, migración creada |
| 2 - Edge Function | pendiente de commit del usuario | ✅ Reescrita con schema real, idempotencia, mock, IVA condicional |
| 3 - Servicio arca.ts | pendiente de commit del usuario | ✅ UI-agnostic, tipado completo |
| 4 - Build | N/A | ✅ `npm run build` — 0 errores TS |
| 5 - SettingsPage ARCA Panel | pendiente de commit del usuario | ✅ CUIT, Pto Vta, condición impositiva, certs, kill switch |
| 6 - Botón Factura en Órdenes | pendiente de commit del usuario | ✅ FinancesTab con emisión + card comprobante |
| 7 - Botón Factura post-checkout POS | pendiente de commit del usuario | ✅ Diálogo post-checkout condicional |
| 8 - Build final | N/A | ✅ `npm run build` — 0 errores TS, 2015 modules |
