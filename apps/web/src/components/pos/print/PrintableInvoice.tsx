import type { Sale, SaleItem } from '@/lib/services/pos';
import type { BranchInfo } from '@/lib/services/branches';
import { InvoiceA4 } from './InvoiceA4';
import { InvoiceTicket } from './InvoiceTicket';

/** Print format options supported by the POS printing engine. */
export type PrintFormat = 'A4' | 'ticket';

interface PrintableInvoiceProps {
  /**
   * The print layout to use:
   * - 'A4'     → Full ARCA/AFIP A4 layout (InvoiceA4)
   * - 'ticket' → 80mm thermal receipt layout (InvoiceTicket)
   */
  format: PrintFormat;
  /** The sale record fetched from the database after checkout. */
  sale: Sale;
  /** Line items for the sale. */
  saleItems: SaleItem[];
  /** Branch metadata (name, address, CUIT, etc.) for the invoice header. */
  branch: BranchInfo;
}

/**
 * PrintableInvoice
 *
 * Router/wrapper component for the POS printing engine.
 * Wrapped in a `.print-only` container so it is invisible on screen but
 * visible when `window.print()` is called.
 *
 * When format is 'ticket', also applies `.print-only--ticket` which activates
 * the `@page ticket { size: 80mm auto }` named page rule defined in index.css.
 *
 * Component tree:
 *   PrintableInvoice (router)
 *   ├── InvoiceA4          (A4 layout)
 *   │   └── FiscalQRBlock  (shared QR+CAE footer)
 *   └── InvoiceTicket      (80mm layout)
 *       └── FiscalQRBlock  (shared QR+CAE footer)
 *
 * Spec reference: Decision 1 (design.md) — component architecture.
 */
export function PrintableInvoice({ format, sale, saleItems, branch }: PrintableInvoiceProps) {
  const containerClass =
    format === 'ticket' ? 'print-only print-only--ticket' : 'print-only';

  return (
    <div className={containerClass}>
      {format === 'A4' ? (
        <InvoiceA4 sale={sale} saleItems={saleItems} branch={branch} />
      ) : (
        <InvoiceTicket sale={sale} saleItems={saleItems} branch={branch} />
      )}
    </div>
  );
}
