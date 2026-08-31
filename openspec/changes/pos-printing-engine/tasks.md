# Tasks: pos-printing-engine

## 1. Dependencies and CSS Setup
- [x] 1.1 Add `react-qr-code` to `apps/web/package.json` dependencies.
- [x] 1.2 Update `apps/web/src/index.css` to add the `@page ticket` named page rule and `.print-only--ticket` class.

## 2. Service Layer Updates
- [x] 2.1 Update `apps/web/src/lib/services/branches.ts` to extend the `BranchInfo` interface and `getBranchInfo()` select query to include `email` and `logo_url` fields.
- [x] 2.2 Update `apps/web/src/lib/services/pos.ts` to add the `fetchSaleForPrint(supabase, saleId)` service function and `SaleForPrint` interface.

## 3. Shared Print Components & Utils
- [x] 3.1 Create `apps/web/src/components/pos/print/invoice-utils.ts` with utility functions like `deriveInvoiceLetter()`, and formatting helpers.
- [x] 3.2 Create `apps/web/src/components/pos/print/FiscalQRBlock.tsx` as a shared component that renders the SVG QR code, CAE, and CAE expiration if populated, or nothing if null.

## 4. Layout Components
- [x] 4.1 Create `apps/web/src/components/pos/print/InvoiceA4.tsx` layout component with a dual-column ARCA header, fiscal letter box, line-item table, fiscal footer, and a prominent "DOCUMENTO NO VÁLIDO COMO FACTURA" watermark when non-fiscal.
- [x] 4.2 Create `apps/web/src/components/pos/print/InvoiceTicket.tsx` layout component tailored for 80mm thermal receipts with a centered header, compact item list, fiscal footer, and non-fiscal watermark.

## 5. Router Wrapper
- [x] 5.1 Create `apps/web/src/components/pos/print/PrintableInvoice.tsx` wrapper component that conditionally delegates rendering to `InvoiceA4` or `InvoiceTicket` based on the `format` prop, enclosed in a `.print-only` container.

## 6. POS Page Integration
- [x] 6.1 Create `apps/web/src/components/pos/PrintFormatToggle.tsx` simple segmented control to allow toggling between 'A4' and 'ticket' formats.
- [x] 6.2 Update `apps/web/src/pages/POSPage.tsx` to include `printFormat` and `printData` state, and render `<PrintFormatToggle />` and `<PrintableInvoice />`.
- [x] 6.3 Update `apps/web/src/pages/POSPage.tsx` checkout flow: upon successful checkout, fetch the persisted sale, store it in state, trigger `setTimeout(() => window.print(), 300)`, and clear the print state afterward.
