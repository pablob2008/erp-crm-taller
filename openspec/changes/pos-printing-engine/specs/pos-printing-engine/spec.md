# Specification: pos-printing-engine

## Purpose
A scalable, ARCA-ready printing engine for the POS capable of supporting both A4 and 80mm thermal ticket layouts dynamically, reacting to fiscal status.

## ADDED Requirements

### Requirement: Configuration Toggle Behavior (A4 vs Ticket)

#### Scenario: Printing an invoice with A4 configuration
- **GIVEN** the POS printing format configuration is set to 'A4'
- **WHEN** a user triggers the print action for an invoice
- **THEN** the system SHALL delegate the rendering to the `<InvoiceA4 />` component
- **AND** the layout SHALL mimic the strict ARCA/AFIP A4 layout using `@media print` rules.

#### Scenario: Printing an invoice with Ticket configuration
- **GIVEN** the POS printing format configuration is set to 'Ticket' (80mm)
- **WHEN** a user triggers the print action for an invoice
- **THEN** the system SHALL delegate the rendering to the `<InvoiceTicket />` component
- **AND** the layout SHALL be optimized for 80mm thermal printers using `@media print` rules.

### Requirement: Dynamic Fiscal State Mapping

#### Scenario: Printing a non-fiscal invoice
- **GIVEN** an invoice where fiscal fields (`cae` and `afip_qr_data`) are null or empty
- **WHEN** the invoice is rendered for printing
- **THEN** the system MUST display the document letter as "X"
- **AND** the system MUST prominently display a "NOT VALID AS INVOICE" (or equivalent local language) watermark across the document.

#### Scenario: Printing a valid fiscal invoice
- **GIVEN** an invoice where fiscal fields (`cae` and `afip_qr_data`) are populated
- **WHEN** the invoice is rendered for printing
- **THEN** the system MUST display the true document letter (e.g., A, B, or C) corresponding to the fiscal operation
- **AND** the system MUST NOT display the "NOT VALID AS INVOICE" watermark
- **AND** the system MUST render the fiscal QR code utilizing the `afip_qr_data`
- **AND** the system MUST render the CAE and its expiration date.

### Requirement: Expected ARCA Headers and Footer Data

#### Scenario: ARCA headers for fiscal invoices
- **GIVEN** a valid fiscal invoice is being rendered
- **WHEN** the header section is printed
- **THEN** the system SHALL include all expected ARCA headers, specifically: Point of Sale number, Invoice number, Date, and Issuer Details (CUIT, Gross Income/IIBB, and Start of Activities date).

#### Scenario: ARCA footer for fiscal invoices
- **GIVEN** a valid fiscal invoice is being rendered
- **WHEN** the footer section is printed
- **THEN** the system SHALL include the fiscal QR Code in the format specified by ARCA/AFIP
- **AND** the system SHALL display the CAE number
- **AND** the system SHALL display the CAE Expiration Date.
