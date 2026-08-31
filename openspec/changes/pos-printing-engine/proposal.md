# Proposal: pos-printing-engine

## 1. Problem Statement
The POS lacks a robust, scalable printing engine capable of supporting both ARCA-ready strict A4 formats and 80mm thermal ticket layouts dynamically.

## 2. Proposed Solution
Implement a scalable, ARCA-ready printing engine for the POS using native `window.print()` and `@media print`. 

### Key Components
- **`PrintableInvoice.tsx`**: A wrapper/router component that reads a format setting (A4 vs Ticket 80mm) and delegates to specific layouts.
- **`<InvoiceA4 />`**: A component mimicking strict ARCA/AFIP A4 layout.
- **`<InvoiceTicket />`**: A component optimized for 80mm thermal printers.

### Dynamic Fiscal State
If fiscal fields (`cae`, `afip_qr_data`) are null, it renders an "X" letter and a "NOT VALID AS INVOICE" watermark. 
If populated, it renders the true fiscal QR, CAE, and corresponding letter (A/B/C).

## 3. Capabilities
- **New Capabilities**:
  - `pos-printing-engine`
- **Modified Capabilities**:
  - None
