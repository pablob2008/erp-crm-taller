/**
 * PrintableTicket — Comprobante de Ingreso al Taller
 *
 * This component renders a full A4-formatted intake receipt for a work order.
 * It is hidden on screen (via the `print-only` CSS class) and only becomes
 * visible when `window.print()` is called. The @media print rules in index.css
 * hide all other UI and reveal only this block.
 *
 * Sections:
 *   1. Header   — Branch name, address, phone, CUIT/tax_id
 *   2. Order    — Order number, received date, estimated delivery
 *   3. Customer — Name, phone, email, tax_id
 *   4. Device   — Brand, model, color, condition, accessories
 *   5. Problem  — Reported problem, suggested solution / initial diagnosis
 *   6. Financial Summary — Estimated cost, total paid, balance
 *   7. Legal Clause — service_conditions from branch (with default fallback)
 *   8. Signature lines — Taller / Cliente
 */

import type { WorkOrderComposite } from "@/lib/services/work-order-details"
import type { BranchInfo } from "@/lib/services/branches"

/** Default legal warranty clause shown when branch.service_conditions is empty. */
const DEFAULT_SERVICE_CONDITIONS = `
El taller no se hace responsable por pérdida de datos. Los equipos no retirados dentro de los 90 días de notificada 
la reparación serán considerados abandonados. La garantía cubre exclusivamente la falla reparada por un período de 
90 días desde la fecha de entrega. No incluye daños ocasionados por mal uso, líquidos o golpes posteriores a la 
reparación. El presupuesto tiene una validez de 15 días.
`.trim()

interface PrintableTicketProps {
  order: WorkOrderComposite;
  branch: BranchInfo | null;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '$0,00'
  return amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
}

/** Thin horizontal rule used between sections */
function Divider() {
  return <hr style={{ borderTop: '1px solid #ccc', margin: '6px 0' }} />
}

/** Two-column label + value pair */
function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{ display: 'flex', gap: '8px', fontSize: '12px', lineHeight: '1.6' }}>
      <span style={{ fontWeight: 600, minWidth: '140px', color: '#444' }}>{label}:</span>
      <span style={{ color: '#111', flex: 1 }}>{value || '—'}</span>
    </div>
  )
}

export function PrintableTicket({ order, branch }: PrintableTicketProps) {
  const customer = order.customers ?? { first_name: '', last_name: '', phone: null, email: null, tax_id: null }
  const serviceConditions = branch?.service_conditions?.trim() || DEFAULT_SERVICE_CONDITIONS

  return (
    <div
      className="print-only"
      style={{
        fontFamily: '"Arial", "Helvetica", sans-serif',
        color: '#111',
        background: '#fff',
        width: '100%',
        maxWidth: '780px',
        margin: '0 auto',
        padding: '24px 32px',
        boxSizing: 'border-box',
      }}
    >
      {/* ── 1. HEADER ──────────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
          {branch?.name ?? 'Taller'}
        </h1>
        {branch?.address && (
          <p style={{ fontSize: '12px', margin: '2px 0', color: '#555' }}>{branch.address}</p>
        )}
        <p style={{ fontSize: '12px', margin: '2px 0', color: '#555' }}>
          {[branch?.phone, branch?.tax_id ? `CUIT: ${branch.tax_id}` : null]
            .filter(Boolean)
            .join(' | ')}
        </p>
      </div>

      <div style={{
        textAlign: 'center',
        fontSize: '15px',
        fontWeight: 700,
        letterSpacing: '1px',
        textTransform: 'uppercase',
        margin: '8px 0 4px',
        borderTop: '2px solid #111',
        borderBottom: '2px solid #111',
        padding: '4px 0',
      }}>
        Comprobante de Ingreso
      </div>

      {/* ── 2. ORDER INFO ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
        <div>
          <Field label="N° Orden"          value={order.order_number} />
          <Field label="Fecha de Ingreso"  value={formatDate(order.created_at)} />
          <Field label="Entrega Estimada"  value={formatDate(order.estimated_delivery_at)} />
        </div>
        {/* Right-side QR placeholder (future) */}
      </div>

      <Divider />

      {/* ── 3. CUSTOMER INFO ───────────────────────────────────────────────── */}
      <div style={{ marginTop: '6px' }}>
        <p style={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>
          Datos del Cliente
        </p>
        <Field label="Nombre"    value={`${customer.first_name} ${customer.last_name}`.trim()} />
        <Field label="Teléfono"  value={customer.phone} />
        <Field label="Email"     value={customer.email} />
        <Field label="CUIT/DNI"  value={customer.tax_id} />
      </div>

      <Divider />

      {/* ── 4. DEVICE DETAILS ─────────────────────────────────────────────── */}
      <div style={{ marginTop: '6px' }}>
        <p style={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>
          Detalles del Dispositivo
        </p>
        <Field label="Marca / Modelo"     value={`${order.device_brand} ${order.device_model}`} />
        <Field label="Color"              value={order.device_color} />
        <Field label="Condición Estética" value={order.aesthetic_condition} />
        <Field label="Accesorios"         value={order.accessories} />
      </div>

      <Divider />

      {/* ── 5. PROBLEM / NOTES ───────────────────────────────────────────── */}
      <div style={{ marginTop: '6px' }}>
        <p style={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>
          Diagnóstico y Servicio
        </p>
        <Field label="Problema Reportado"  value={order.reported_problem} />
        <Field label="Diagnóstico Inicial" value={order.suggested_solution} />
      </div>

      <Divider />

      {/* ── 6. FINANCIAL SUMMARY ─────────────────────────────────────────── */}
      <div style={{ marginTop: '6px' }}>
        <p style={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>
          Resumen Financiero
        </p>
        <Field label="Costo Estimado" value={formatCurrency(order.estimated_cost)} />
        <Field label="Total Abonado"  value={formatCurrency(order.total_paid)} />
        <Field label="Saldo Pendiente"
               value={formatCurrency(order.balance)} />
      </div>

      <Divider />

      {/* ── 7. LEGAL CLAUSE ──────────────────────────────────────────────── */}
      <div style={{ marginTop: '8px' }}>
        <p style={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>
          Condiciones de Servicio y Garantía
        </p>
        <p style={{ fontSize: '10px', color: '#444', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
          {serviceConditions}
        </p>
      </div>

      <Divider />

      {/* ── 8. SIGNATURE LINES ───────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        marginTop: '32px',
        gap: '32px',
      }}>
        {['Firma del Taller', 'Firma del Cliente'].map((label) => (
          <div key={label} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #555', paddingTop: '6px', fontSize: '11px', color: '#555' }}>
              {label}
            </div>
            <div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px' }}>Aclaración / Sello</div>
          </div>
        ))}
      </div>
    </div>
  )
}
