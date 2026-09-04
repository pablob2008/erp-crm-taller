# Capability: purchases-workflow-management

## Purpose
Manages unified procurement board and standardized expense generation for parts and inventory.

## ADDED Requirements

### Requirement: Unified Purchases Board
The system MUST display a centralized procurement board combining general purchases and requested work order items.

#### Scenario: Viewing unified purchases
- **GIVEN** there are general purchases and pending work-order items (`work_order_items` with status 'pending')
- **WHEN** the user navigates to the Purchases Board
- **THEN** the system SHALL display both sets of items in a single, unified list
- **AND** the system SHALL distinguish between general purchases and items requested for specific work orders.

### Requirement: Expense Modal
The system MUST provide a modal for capturing payment details when fulfilling any purchase requirement.

#### Scenario: Opening the expense modal
- **GIVEN** the user has selected an item to mark as purchased or received
- **WHEN** the action is initiated
- **THEN** the system SHALL present a modal requesting the exact amount paid, the payment method, and an optional note.

### Requirement: General Purchase Fulfillment
The system MUST update a general purchase and log the corresponding cash movement when marked as received.

#### Scenario: Fulfilling a general purchase
- **GIVEN** a general purchase item in the Purchases Board
- **WHEN** the user submits the Expense Modal for this item with the required payment details
- **THEN** the system SHALL update the purchase status to `received`
- **AND** the system SHALL register a `cash_movement` using the exact amount and selected payment method.

### Requirement: Work Order Part Fulfillment
The system MUST fulfill work-order specific parts by logging an expense, updating the part status, and leaving a note without altering the order's state.

#### Scenario: Fulfilling a work-order part
- **GIVEN** a pending work-order part in the Purchases Board
- **WHEN** the user submits the Expense Modal for this item with the required payment details
- **THEN** the system SHALL update the `work_order_item` status to `purchased`
- **AND** the system SHALL register a `cash_movement` using the exact amount and selected payment method
- **AND** the system SHALL inject a note into the corresponding work order
- **AND** the system SHALL NOT modify the overall work order status.
