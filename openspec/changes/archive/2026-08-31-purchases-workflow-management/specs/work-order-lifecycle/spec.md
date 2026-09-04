# Capability: work-order-lifecycle

## Purpose
Manages the lifecycle, statuses, and history of work orders throughout their lifecycle.

## MODIFIED Requirements

### Requirement: Internal Part Procurement Note Sync
The work order history MUST reflect internal updates regarding the procurement of spare parts without altering the global order state.

#### Scenario: Internal procurement updates
- **GIVEN** a work order containing requested spare parts
- **WHEN** a spare part is marked as purchased from the centralized Purchases Board
- **THEN** the system SHALL append an internal note to the work order's history detailing the purchase
- **AND** the system SHALL NOT alter the main global status of the work order.
