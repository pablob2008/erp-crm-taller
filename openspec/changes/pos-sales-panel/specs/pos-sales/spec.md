## Purpose
Manage sales through a dedicated Point of Sale interface, including catalog browsing, cart management, and fast actions.

## ADDED Requirements

### Requirement: Split-Screen POS Interface
The application SHALL provide a split-screen POS interface with a left-side catalog and right-side ticket.

#### Scenario: Browsing Catalog
- **GIVEN** the user is on the POS panel
- **WHEN** they view the left side
- **THEN** they MUST see a search bar (ready for barcode scanner), a grid of inventory items, and a "Manual Sale" button.

#### Scenario: Managing Ticket
- **GIVEN** the user has added items to the ticket
- **WHEN** they view the right side
- **THEN** they MUST see scanned items, quantities (+/-), subtotal, payment method selector (Cash, QR, Card), and a large checkout button.

#### Scenario: Adjusting Quantities
- **GIVEN** an item is in the ticket
- **WHEN** the user clicks the + or - buttons
- **THEN** the quantity MUST update and the subtotal MUST be recalculated automatically.

### Requirement: Fast Action - Deliver Order
The system MUST support a fast action to deliver an order directly from the POS interface.

#### Scenario: Searching for Order
- **GIVEN** the user clicks "Entregar Orden" (Deliver Order)
- **WHEN** they search by order number
- **THEN** the system MUST display the order and its pending balance.

#### Scenario: Adding Order Balance to Ticket
- **GIVEN** the user has found a pending order
- **WHEN** they confirm the delivery action
- **THEN** the pending balance MUST be added to the ticket.

### Requirement: Fast Action - Register Expense
The system MUST support a fast action to register an expense directly from the POS.

#### Scenario: Registering an Expense
- **GIVEN** the user clicks "Registrar Gasto" (Add Expense)
- **WHEN** they enter an amount and description in the quick modal
- **THEN** a new expense MUST be recorded as a cash movement, effectively registering money taken out of the register.

### Requirement: POS Checkout Integration
The system MUST create corresponding sale records upon checkout, preserving customer tax info and future fiscal readiness fields.

#### Scenario: Checking Out Regular Sale
- **GIVEN** the ticket has items and a payment method is selected
- **WHEN** the user clicks the checkout button
- **THEN** the system MUST create records in `sales` and `sale_items`, and automatically link a new `cash_movements` record upon successful checkout.

#### Scenario: Delivering Work Order via POS with Customer Data
- **GIVEN** a work order delivery was added to the ticket
- **WHEN** the checkout is processed
- **THEN** the system MUST link `sales.work_order_id` and automatically populate `customer_id`, `customer_doc_type`, and `customer_doc_number` using the customer's existing `tax_id`.

#### Scenario: Fiscal Readiness & CAE Preservation
- **GIVEN** a completed sale record in `sales`
- **WHEN** future ARCA fiscal authorization or receipt reprinting is required
- **THEN** the schema MUST support storing `invoice_type`, `invoice_number`, `cae`, `cae_expires_at`, and `afip_qr_data` to allow instant local re-printing without duplicate ARCA API requests.
