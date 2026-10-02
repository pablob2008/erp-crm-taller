## ADDED Requirements

### Requirement: Customer 360 Profile View
The system MUST provide a comprehensive, dedicated view for each customer containing their identity, workshop history, and financial summary.

#### Scenario: Navigating to customer profile
- **GIVEN** a user is viewing the customer directory
- **WHEN** the user clicks to view a specific customer's profile
- **THEN** the system MUST display the Customer 360 Profile View for that customer

### Requirement: Profile Identity Panel
The system MUST allow users to view and update the customer's core identity details (Name, Document, Phone, Email) directly within the 360 Profile View.

#### Scenario: Updating identity from profile
- **GIVEN** a user is on the Customer 360 Profile View
- **WHEN** the user edits the identity fields and saves
- **THEN** the system MUST update the customer record and reflect the changes in the profile

### Requirement: Profile Workshop Panel
The system MUST display a grid or list of all work orders associated with the customer within the 360 Profile View.

#### Scenario: Viewing customer work orders
- **GIVEN** a customer has existing work orders
- **WHEN** the user views the Customer 360 Profile View
- **THEN** the system MUST display the work orders, including their current status and a link to their details

### Requirement: Profile Financial Panel
The system MUST display a financial summary for the customer, including the total amount spent (Lifetime Value) and the pending balance across all unpaid or partially paid orders, along with related cash movements.

#### Scenario: Viewing customer financial status
- **GIVEN** a customer has completed sales and pending balances on work orders
- **WHEN** the user views the Customer 360 Profile View
- **THEN** the system MUST display the accurate Total Spent and Pending Balance calculated from their sales and work orders

## MODIFIED Requirements

### Requirement: Customer History Snapshot
The system SHALL display a snapshot of a customer's history, specifically showing their total order count, total amount spent (lifetime value), and current pending balance.

#### Scenario: Displaying order count, total spent, and pending balance
- **GIVEN** a user is viewing a customer in the CRM directory or profile
- **WHEN** the customer record is loaded
- **THEN** the system SHALL display the accurate order count, total amount spent, and pending balance for that specific customer
