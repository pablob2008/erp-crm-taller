</Order Service Specification>
<Delta for Order Service>
## MODIFIED Requirements
### Requirement: Enhanced Work Order Creation
The system MUST capture and persist `estimated_cost`, `estimated_delivery_at`, `status`, and `advance_payment` when creating a work order, and MUST process advance payments if present.
(Previously: The `createWorkOrder` function in `lib/services/work-orders.ts` only inserted basic details and did not handle payments.)

#### Scenario: Creation without advance payment
- GIVEN a new work order payload where `advance_payment` is 0 or undefined
- WHEN `createWorkOrder` is executed
- THEN it MUST insert the order into the `work_orders` table with the provided fields
- AND it MUST NOT create any `cash_movements` record

#### Scenario: Creation with advance payment
- GIVEN a new work order payload where `advance_payment > 0`
- WHEN `createWorkOrder` is executed
- THEN it MUST set `total_paid` equal to `advance_payment` on the order insertion
- AND it MUST create a `cash_movements` record with type 'income' and category 'work_order_payment' linked to the new order
- AND both steps MUST complete to consider the operation fully successful

#### Scenario: Payment insertion fails after order creation
- GIVEN a new work order payload where `advance_payment > 0`
- WHEN `createWorkOrder` successfully creates the work order but fails to create the `cash_movements` record
- THEN it MUST return an error indicating the payment step failed so the UI can notify the user
