import type { Sale, SaleItem } from '@/lib/services/pos';
import type { BranchInfo } from '@/lib/services/branches';
import { FiscalQRBlock } from './FiscalQRBlock';
import {
  deriveInvoiceLetter,
  formatCurrency,
  formatDate,
  formatTaxRate,
} from './invoice-utils';

interface InvoiceTicketProps {
  sale: Sale;
  saleItems: SaleItem[];
  branch: BranchInfo;
}

/**
 * InvoiceTicket
 *
 * 80mm thermal receipt layout.
 * Optimized for 80mm paper width (~72mm usable content area).
 *
 * Layout:
 *  ┌─────────────────────────┐
 *  │    [Branch name]        │  ← centered, bold
 *  │    [Address / phone]    │  ← centered, small
 *  │    [CUIT]               │  ← centered
 *  │  ── ─────────────── ──  │
 *  │  Comprobante: X         │  ← fiscal letter
 *  │  Fecha: dd/mm/yyyy      │
 *  │  ── ─────────────── ──  │
 *  │  DESCRIPCIÓN      CANT  │
 *  │  Ítem 1           1     │
 *  │  Ítem 2           2     │
 *  │  ── ─────────────── ──  │
 *  │  TOTAL:    $12.345,60   │
 *  │  Método:   Efectivo     │
 *  │  ── ─────────────── ──  │
 *  │  [FiscalQRBlock]        │
 *  └─────────────────────────┘
 *
 * Uses inline styles and Tailwind print utilities.
 * page: ticket CSS property is applied by PrintableInvoice wrapper.
 */
export function InvoiceTicket({ sale, saleItems, branch }: InvoiceTicketProps) {
  const isFiscal = Boolean(sale.cae && sale.afip_qr_data);
  const letter = deriveInvoiceLetter(sale.invoice_type);

  const center: React.CSSProperties = { textAlign: 'center' };
  const divider: React.CSSProperties = {
    borderTop: '1px dashed #000',
    margin: '6px 0',
  };
  const fontBase: React.CSSProperties = {
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: '9pt',
    color: '#000',
    lineHeight: 1.4,
  };
  const bold: React.CSSProperties = { fontWeight: 'bold' };

  return (
    <div style={{ ...fontBase, width: '100%', position: 'relative', padding: '0' }}>

      {/* ── Non-fiscal watermark (narrower, fits 80mm) ────────────────── */}
      {!isFiscal && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-30deg)',
            fontSize: '14pt',
            fontWeight: 'bold',
            color: 'rgba(0,0,0,0.10)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 1000,
            userSelect: 'none',
            textAlign: 'center',
          }}
        >
          NO VÁLIDO
          <br />
          COMO FACTURA
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div style={{ ...center, marginBottom: '4px' }}>
        <div style={{ ...bold, fontSize: '13pt' }}>{branch.name}</div>
        {branch.address && (
          <div style={{ fontSize: '8pt' }}>{branch.address}</div>
        )}
        {branch.phone && (
          <div style={{ fontSize: '8pt' }}>Tel.: {branch.phone}</div>
        )}
        {branch.tax_id && (
          <div style={{ fontSize: '8pt' }}>CUIT: {branch.tax_id}</div>
        )}
      </div>

      <div style={divider} />

      {/* ── Document type & date ─────────────────────────────────────── */}
      <div style={{ marginBottom: '4px' }}>
        <div>
          <span style={bold}>Comprobante: </span>
          <span>
            {isFiscal
              ? `Factura ${letter}`
              : `Ticket ${letter} — NO FISCAL`}
          </span>
        </div>
        <div>
          <span style={bold}>Fecha: </span>
          <span>{formatDate(sale.created_at)}</span>
        </div>
        {sale.invoice_number && (
          <div>
            <span style={bold}>N° Comp.: </span>
            <span>{sale.invoice_number}</span>
          </div>
        )}
      </div>

      {/* ── Customer doc info ─────────────────────────────────────────── */}
      {sale.customer_doc_number && (
        <>
          <div style={divider} />
          <div style={{ marginBottom: '4px' }}>
            <div>
              <span style={bold}>Doc.: </span>
              <span>
                {sale.customer_doc_type === '80'
                  ? 'CUIT'
                  : sale.customer_doc_type === '96'
                  ? 'DNI'
                  : sale.customer_doc_type ?? ''}{' '}
                {sale.customer_doc_number}
              </span>
            </div>
          </div>
        </>
      )}

      <div style={divider} />

      {/* ── Line items ───────────────────────────────────────────────── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px' }}>
        <thead>
          <tr>
            <th style={{ ...bold, textAlign: 'left', paddingBottom: '3px', fontSize: '8pt', width: '50%' }}>
              Descripción
            </th>
            <th style={{ ...bold, textAlign: 'right', paddingBottom: '3px', fontSize: '8pt', width: '12%' }}>
              Cant.
            </th>
            <th style={{ ...bold, textAlign: 'right', paddingBottom: '3px', fontSize: '8pt', width: '14%' }}>
              IVA
            </th>
            <th style={{ ...bold, textAlign: 'right', paddingBottom: '3px', fontSize: '8pt', width: '24%' }}>
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {saleItems.map((item) => (
            <tr key={item.id}>
              <td style={{ fontSize: '8pt', paddingBottom: '2px', verticalAlign: 'top' }}>
                {item.description}
                <br />
                <span style={{ color: '#555' }}>
                  {item.quantity} × {formatCurrency(item.unit_price)}
                </span>
              </td>
              <td style={{ fontSize: '8pt', textAlign: 'right', verticalAlign: 'top' }}>
                {item.quantity}
              </td>
              <td style={{ fontSize: '8pt', textAlign: 'right', verticalAlign: 'top' }}>
                {formatTaxRate(item.tax_rate)}
              </td>
              <td style={{ fontSize: '8pt', textAlign: 'right', verticalAlign: 'top' }}>
                {formatCurrency(item.total_price)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={divider} />

      {/* ── Totals ───────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '4px' }}>
        {sale.discount_value > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Descuento:</span>
            <span>
              {sale.discount_type === 'percentage'
                ? `${sale.discount_value}%`
                : formatCurrency(sale.discount_value)}
            </span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', ...bold, fontSize: '11pt' }}>
          <span>TOTAL:</span>
          <span>{formatCurrency(sale.total)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8pt' }}>
          <span style={bold}>Forma de pago:</span>
          <span>
            {sale.payment_method === 'cash'
              ? 'Efectivo'
              : sale.payment_method === 'card'
              ? 'Tarjeta'
              : sale.payment_method === 'qr'
              ? 'QR'
              : sale.payment_method === 'transfer'
              ? 'Transferencia'
              : sale.payment_method}
          </span>
        </div>
      </div>

      {/* ── Fiscal footer or non-fiscal notice ───────────────────────── */}
      {isFiscal ? (
        <FiscalQRBlock
          afipQrData={sale.afip_qr_data}
          cae={sale.cae}
          caeExpiresAt={sale.cae_expires_at}
        />
      ) : (
        <div
          style={{
            ...center,
            marginTop: '6px',
            paddingTop: '6px',
            borderTop: '1px dashed #000',
            fontSize: '7pt',
            color: '#666',
          }}
        >
          DOCUMENTO NO VÁLIDO COMO FACTURA
          <br />
          Sin CAE asignado por ARCA/AFIP
        </div>
      )}

      {/* ── Footer thank-you ─────────────────────────────────────────── */}
      <div
        style={{
          ...center,
          marginTop: '8px',
          paddingTop: '6px',
          borderTop: '1px dashed #000',
          fontSize: '8pt',
          color: '#555',
        }}
      >
        ¡Gracias por su compra!
      </div>
    </div>
  );
}
