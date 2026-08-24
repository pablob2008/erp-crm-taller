</SDD Spec Phase Executor>
<view-work-order-details Specification>
## Purpose
Provide a command center for a single work order to display all related entities in a centralized view.

## Requirements

### Requirement: Display Main Order Details
The system MUST fetch and display the work order's device, customer, reported problem, and current status.

#### Scenario: Successful Details Fetch
- GIVEN a valid work order ID
- WHEN the user navigates to `/orders/:id`
- THEN the system fetches the details and displays the header section

#### Scenario: Invalid Work Order ID
- GIVEN an invalid or non-existent work order ID
- WHEN the user navigates to `/orders/:id`
- THEN the system displays an appropriate error or "not found" state

### Requirement: Structured Tab Interface
The system MUST provide a tabbed layout organizing Overview, Parts & Purchases, and Finances.

#### Scenario: Tab Navigation
- GIVEN the work order details page is loaded
- WHEN the user clicks on the "Parts & Purchases" tab
- THEN the UI switches to display the items and purchases associated with the order
