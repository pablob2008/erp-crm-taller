</SDD Spec Phase Executor>
<manage-order-payments Specification>
## Purpose
Provide the ability to track financial payments related to a work order.

## Requirements

### Requirement: View Payments
The system MUST display all cash movements (payments) associated with the work order.

#### Scenario: View Financials
- GIVEN a work order with recorded payments
- WHEN the user navigates to the "Finances" tab
- THEN the system displays the payment history and total amount paid

### Requirement: Add Payment
The system MUST provide a form to register new payments, including selecting a payment method.

#### Scenario: Successfully Record Payment
- GIVEN the user is on the "Finances" tab
- WHEN the user enters a payment amount, selects a method, and submits
- THEN the system records the cash movement and updates the financial view

#### Scenario: Incomplete Payment Form
- GIVEN the user is adding a payment
- WHEN the user submits the form without a valid amount or method
- THEN the system displays validation errors and prevents submission
