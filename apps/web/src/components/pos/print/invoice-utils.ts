/**
 * invoice-utils.ts
 * Shared utility functions for POS invoice rendering.
 * Used by InvoiceA4, InvoiceTicket, and FiscalQRBlock.
 */

// ─── Fiscal letter derivation ─────────────────────────────────────────────────

/**
 * Maps an ARCA/AFIP invoice_type code to the single-letter designation
 * displayed in the fiscal letter box.
 *
 * FA_A → A  (Factura A — IVA discriminado, responsable inscripto)
 * FA_B → B  (Factura B — consumidor final / monotributista)
 * FA_C → C  (Factura C — monotributista a consumidor final)
 * TKT  → T  (Ticket fiscal)
 * null / unknown → X  (Non-fiscal, no CAE)
 */
export function deriveInvoiceLetter(
  invoiceType: string | null | undefined
): string {
  switch (invoiceType) {
    case 'FA_A': return 'A';
    case 'FA_B': return 'B';
    case 'FA_C': return 'C';
    case 'TKT':  return 'T';
    default:     return 'X';
  }
}

// ─── Number / currency formatting ─────────────────────────────────────────────

/**
 * Formats a numeric amount as Argentine peso currency string.
 * Example: 12345.6 → "$\u202f12.345,60"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ─── Date formatting ──────────────────────────────────────────────────────────

/**
 * Formats an ISO date string or Date object as dd/mm/yyyy (Argentine locale).
 * Returns an empty string if the input is null or undefined.
 */
export function formatDate(
  value: string | Date | null | undefined
): string {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('es-AR', {
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric',
  }).format(d);
}

// ─── Invoice number formatting ────────────────────────────────────────────────

/**
 * Zero-pads an invoice number to 8 digits, as required by ARCA display rules.
 * Example: "42" → "00000042"
 */
export function formatInvoiceNumber(
  invoiceNumber: string | null | undefined
): string {
  if (!invoiceNumber) return '—';
  return invoiceNumber.padStart(8, '0');
}

// ─── Tax-rate label ───────────────────────────────────────────────────────────

/**
 * Converts a decimal tax rate to a display label.
 * Example: 21 → "21%"  |  0 → "Exento"
 */
export function formatTaxRate(rate: number): string {
  if (rate === 0) return 'Exento';
  return `${rate}%`;
}
