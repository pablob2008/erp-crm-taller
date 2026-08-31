import type { Sale, SaleItem } from '@/lib/services/pos';
import type { BranchInfo } from '@/lib/services/branches';
import { FiscalQRBlock } from './FiscalQRBlock';
import {
  deriveInvoiceLetter,
  formatCurrency,
  formatDate,
  formatInvoiceNumber,
  formatTaxRate,
} from './invoice-utils';

interface InvoiceA4Props {
  sale: Sale;
  saleItems: SaleItem[];
  branch: BranchInfo;
}

/**
 * InvoiceA4
 *
 * Full A4 ARCA/AFIP-style invoice layout.
 *
 * Layout (per ARCA resolution):
 *  ┌──────────────────────────────────────────────────────────┐
 *  │ [Logo / Issuer — Left]  [Letter Box — Center]  [Date/# Right] │
 *  ├──────────────────────────────────────────────────────────┤
 *  │ [Customer details]                                       │
 *  ├──────────────────────────────────────────────────────────┤
 *  │ Line items table: Descripción | Cant | P.Unit | IVA | Subtotal │
 *  ├──────────────────────────────────────────────────────────┤
 *  │ Totals (right-aligned)                                   │
 *  ├──────────────────────────────────────────────────────────┤
 *  │ [FiscalQRBlock footer] — or nothing when non-fiscal      │
 *  └──────────────────────────────────────────────────────────┘
 *
 * Non-fiscal: watermark overlay + letter "X"
 * Fiscal: true letter (A/B/C/T) from invoice_type, QR+CAE footer
 *
 * Uses inline styles only — no Tailwind dynamic interpolation — for
 * guaranteed print-media fidelity.
 */
export function InvoiceA4({ sale, saleItems, branch }: InvoiceA4Props) {
  const isFiscal = Boolean(sale.cae && sale.afip_qr_data);
  const letter = deriveInvoiceLetter(sale.invoice_type);

  // ── Inline style constants (consistent with ARCA layout requirements) ────────
  const fontBase: React.CSSProperties = {
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: '10pt',
    color: '#000',
    lineHeight: 1.4,
  };

  const borderBox: React.CSSProperties = {
    border: '1px solid #000',
  };

  const cellPad: React.CSSProperties = { padding: '4px 6px' };
  const thStyle: React.CSSProperties = {
    ...cellPad,
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
    borderBottom: '1px solid #000',
    textAlign: 'left',
  };
  const tdStyle: React.CSSProperties = { ...cellPad, borderBottom: '1px solid #eee' };
  const tdRight: React.CSSProperties = { ...tdStyle, textAlign: 'right' };

  return (
    <div style={{ ...fontBase, width: '100%', padding: '0', position: 'relative' }}>

      {/* ── Non-fiscal watermark overlay ─────────────────────────────────── */}
      {!isFiscal && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-30deg)',
            fontSize: '48pt',
            fontWeight: 'bold',
            color: 'rgba(0,0,0,0.08)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 1000,
            userSelect: 'none',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          DOCUMENTO NO VÁLIDO COMO FACTURA
        </div>
      )}

      {/* ── ARCA Dual-column header ──────────────────────────────────────── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
        <tbody>
          <tr>
            {/* Left column — Issuer info */}
            <td style={{ ...borderBox, width: '40%', verticalAlign: 'top', padding: '8px' }}>
              {branch.logo_url && (
                <img
                  src={branch.logo_url}
                  alt="Logo"
                  style={{ maxHeight: '48px', marginBottom: '6px', display: 'block' }}
                />
              )}
              <div style={{ fontWeight: 'bold', fontSize: '13pt' }}>{branch.name}</div>
              {branch.address && <div>{branch.address}</div>}
              {branch.phone && <div>Tel.: {branch.phone}</div>}
              {branch.email && <div>{branch.email}</div>}
            </td>

            {/* Center column — Fiscal letter box */}
            <td
              style={{
                ...borderBox,
                width: '20%',
                textAlign: 'center',
                verticalAlign: 'middle',
                padding: '8px',
              }}
            >
              <div
                style={{
                  fontSize: '48pt',
                  fontWeight: 'bold',
                  border: '2px solid #000',
                  display: 'inline-block',
                  width: '60px',
                  height: '60px',
                  textAlign: 'center',
                  lineHeight: '60px',
                }}
              >
                {letter}
              </div>
              <div style={{ fontSize: '8pt', marginTop: '4px' }}>
                {isFiscal ? 'ORIGINAL' : 'NO FISCAL'}
              </div>
            </td>

            {/* Right column — Invoice metadata */}
            <td style={{ ...borderBox, width: '40%', verticalAlign: 'top', padding: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 'bold', paddingRight: '8px' }}>Fecha:</td>
                    <td>{formatDate(sale.created_at)}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold', paddingRight: '8px' }}>N° Comp.:</td>
                    <td>{formatInvoiceNumber(sale.invoice_number)}</td>
                  </tr>
                  {branch.tax_id && (
                    <tr>
                      <td style={{ fontWeight: 'bold', paddingRight: '8px' }}>CUIT:</td>
                      <td>{branch.tax_id}</td>
                    </tr>
                  )}
                  {sale.cae && (
                    <tr>
                      <td style={{ fontWeight: 'bold', paddingRight: '8px' }}>Cond. IVA:</td>
                      <td>
                        {letter === 'A'
                          ? 'Responsable Inscripto'
                          : letter === 'B' || letter === 'C'
                          ? 'Consumidor Final'
                          : '—'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Customer details ─────────────────────────────────────────────── */}
      {(sale.customer_doc_type || sale.customer_doc_number) && (
        <table style={{ width: '100%', ...borderBox, borderCollapse: 'collapse', marginBottom: '8px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '6px 8px', fontWeight: 'bold', width: '20%' }}>
                Tipo Doc.:
              </td>
              <td style={{ padding: '6px 8px', width: '30%' }}>
                {sale.customer_doc_type === '80'
                  ? 'CUIT'
                  : sale.customer_doc_type === '96'
                  ? 'DNI'
                  : sale.customer_doc_type === '99'
                  ? 'Consumidor Final'
                  : sale.customer_doc_type ?? '—'}
              </td>
              <td style={{ padding: '6px 8px', fontWeight: 'bold', width: '20%' }}>
                N° Doc.:
              </td>
              <td style={{ padding: '6px 8px' }}>{sale.customer_doc_number ?? '—'}</td>
            </tr>
          </tbody>
        </table>
      )}

      {/* ── Line items table ─────────────────────────────────────────────── */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: '8px',
          ...borderBox,
        }}
      >
        <thead>
          <tr>
            <th style={{ ...thStyle, width: '40%' }}>Descripción</th>
            <th style={{ ...thStyle, textAlign: 'right', width: '8%' }}>Cant.</th>
            <th style={{ ...thStyle, textAlign: 'right', width: '16%' }}>P. Unitario</th>
            <th style={{ ...thStyle, textAlign: 'right', width: '12%' }}>IVA</th>
            <th style={{ ...thStyle, textAlign: 'right', width: '16%' }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {saleItems.map((item) => (
            <tr key={item.id}>
              <td style={tdStyle}>{item.description}</td>
              <td style={tdRight}>{item.quantity}</td>
              <td style={tdRight}>{formatCurrency(item.unit_price)}</td>
              <td style={tdRight}>{formatTaxRate(item.tax_rate)}</td>
              <td style={tdRight}>{formatCurrency(item.total_price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Totals ───────────────────────────────────────────────────────── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
        <tbody>
          <tr>
            <td style={{ width: '60%' }} />
            <td style={{ ...borderBox, padding: '4px 8px', fontWeight: 'bold', width: '25%', textAlign: 'right' }}>
              Subtotal:
            </td>
            <td style={{ ...borderBox, padding: '4px 8px', textAlign: 'right', width: '15%' }}>
              {formatCurrency(sale.subtotal)}
            </td>
          </tr>
          {sale.discount_value > 0 && (
            <tr>
              <td />
              <td style={{ ...borderBox, padding: '4px 8px', fontWeight: 'bold', textAlign: 'right' }}>
                Descuento:
              </td>
              <td style={{ ...borderBox, padding: '4px 8px', textAlign: 'right' }}>
                {sale.discount_type === 'percentage'
                  ? `${sale.discount_value}%`
                  : formatCurrency(sale.discount_value)}
              </td>
            </tr>
          )}
          <tr>
            <td />
            <td
              style={{
                ...borderBox,
                padding: '6px 8px',
                fontWeight: 'bold',
                fontSize: '12pt',
                textAlign: 'right',
              }}
            >
              TOTAL:
            </td>
            <td
              style={{
                ...borderBox,
                padding: '6px 8px',
                fontWeight: 'bold',
                fontSize: '12pt',
                textAlign: 'right',
              }}
            >
              {formatCurrency(sale.total)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Payment method ───────────────────────────────────────────────── */}
      <div style={{ fontSize: '9pt', marginBottom: '12px' }}>
        <strong>Forma de pago:</strong>{' '}
        {sale.payment_method === 'cash'
          ? 'Efectivo'
          : sale.payment_method === 'card'
          ? 'Tarjeta'
          : sale.payment_method === 'qr'
          ? 'QR / Transferencia'
          : sale.payment_method === 'transfer'
          ? 'Transferencia'
          : sale.payment_method}
      </div>

      {/* ── Fiscal footer (QR + CAE) or non-fiscal notice ───────────────── */}
      {isFiscal ? (
        <FiscalQRBlock
          afipQrData={sale.afip_qr_data}
          cae={sale.cae}
          caeExpiresAt={sale.cae_expires_at}
        />
      ) : (
        <div
          style={{
            marginTop: '12px',
            paddingTop: '8px',
            borderTop: '1px solid #000',
            textAlign: 'center',
            fontSize: '8pt',
            color: '#555',
          }}
        >
          DOCUMENTO NO VÁLIDO COMO FACTURA — Sin CAE asignado
        </div>
      )}
    </div>
  );
}
