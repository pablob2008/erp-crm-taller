import QRCode from 'react-qr-code';
import { formatDate } from './invoice-utils';

interface FiscalQRBlockProps {
  /** AFIP/ARCA QR data URL string. When null the entire block renders nothing. */
  afipQrData: string | null | undefined;
  /** CAE number issued by AFIP/ARCA. */
  cae: string | null | undefined;
  /** ISO date string for CAE expiration. */
  caeExpiresAt: string | null | undefined;
}

/**
 * FiscalQRBlock
 *
 * Shared fiscal footer component used by both InvoiceA4 and InvoiceTicket.
 * Renders the ARCA SVG QR code, CAE number, and CAE expiration date.
 * Returns null (renders nothing) when fiscal data is absent — the parent
 * layout is responsible for showing the non-fiscal watermark in that case.
 *
 * Spec reference: Decision 4 (design.md) — conditional rendering rules.
 */
export function FiscalQRBlock({ afipQrData, cae, caeExpiresAt }: FiscalQRBlockProps) {
  // Per spec: render nothing when fiscal fields are null
  if (!afipQrData || !cae) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        marginTop: '12px',
        paddingTop: '10px',
        borderTop: '1px solid #000',
      }}
    >
      {/* ARCA QR Code — SVG renders crisply at any print DPI */}
      <QRCode
        value={afipQrData}
        size={96}
        bgColor="#ffffff"
        fgColor="#000000"
        style={{ display: 'block' }}
      />

      {/* CAE label and number */}
      <div style={{ textAlign: 'center', fontSize: '9pt', fontFamily: 'Arial, sans-serif' }}>
        <span style={{ fontWeight: 'bold' }}>CAE N°: </span>
        <span>{cae}</span>
      </div>

      {/* CAE expiration date */}
      {caeExpiresAt && (
        <div style={{ textAlign: 'center', fontSize: '9pt', fontFamily: 'Arial, sans-serif' }}>
          <span style={{ fontWeight: 'bold' }}>Vto. CAE: </span>
          <span>{formatDate(caeExpiresAt)}</span>
        </div>
      )}

      {/* ARCA compliance footer text */}
      <p style={{ fontSize: '7pt', color: '#555', textAlign: 'center', margin: 0, fontFamily: 'Arial, sans-serif' }}>
        Comprobante emitido de acuerdo a R.G. AFIP N° 4291/2018
      </p>
    </div>
  );
}
