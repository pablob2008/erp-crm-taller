# order-purchases Specification

## Purpose
Manage the shopping list of parts for a work order, allowing users to track items to be purchased and record them as purchased expenses.

## Requirements

### Requirement: Manage Shopping List
The system MUST allow users to add items to a shopping list for a work order, adapting the `work_order_items` schema to track their status (e.g., pending).

#### Scenario: Add item to shopping list
- GIVEN a work order details view
- WHEN the user adds a new item to the "Lista de Compras"
- THEN the item is created with a pending status

### Requirement: Mark Item as Purchased
The system MUST provide a modal when marking a part as purchased to capture the amount, payment method, and an optional note.

#### Scenario: Mark item as purchased
- GIVEN a pending item in the shopping list
- WHEN the user marks the item as purchased and submits the purchase modal with cost and payment method
- THEN the item status is updated to purchased
- AND a new expense is logged in `cash_movements` (with movement_type set to expense)
- AND an optional note is added to `work_order_notes` if provided
