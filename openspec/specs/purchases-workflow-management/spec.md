# Capability: purchases-workflow-management

## Purpose
Create a centralized Purchases Board unifying general purchases and work-order parts, with complete expense control and dynamic payment methods.

## Requirements

### Requirement: Unified Purchases Board
Displaying both general purchases (from `purchases`) and work-order requested parts (from `work_order_items` where status is pending).

#### Scenario: Viewing the unified board
- **GIVEN** a user accesses the Inventory & Purchases module
- **WHEN** the unified board loads
- **THEN** it SHALL display both general pending purchases and pending work-order spare part requests

### Requirement: Expense Modal
Capturing the exact amount paid, the payment method, and an optional note.

#### Scenario: Using the expense modal
- **GIVEN** a user clicks to mark a purchase as received/purchased
- **WHEN** the modal opens
- **THEN** the system SHALL allow the user to input the exact amount, payment method (cash, transfer, qr), and a note

### Requirement: General Purchase Fulfillment
Marking a general purchase as received updates its status to received and registers the `cash_movement`.

#### Scenario: Fulfilling a general purchase
- **GIVEN** a user fulfills a general purchase via the Expense Modal
- **WHEN** the form is submitted
- **THEN** the system SHALL update the purchase status to `received` and manually insert a `cash_movement` with the chosen payment method

### Requirement: Work Order Part Fulfillment
Marking a work-order part as purchased updates its status to purchased, registers the `cash_movement`, and injects a note into the work order (without modifying the work order's global status).

#### Scenario: Fulfilling a work-order part
- **GIVEN** a user fulfills a work-order requested part via the Expense Modal
- **WHEN** the form is submitted
- **THEN** the system SHALL update the `work_order_items` status to `purchased`, register the `cash_movement`, and inject a note into the work order
- **AND** the global work order status SHALL remain unchanged
