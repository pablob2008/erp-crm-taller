</Order Validation Specification>
<Delta for Order Validation>
## MODIFIED Requirements
### Requirement: Work Order Schema Validation
The system MUST validate the `workOrderSchema` in `lib/validations/work-orders.ts` to include the new fields: `estimated_cost`, `estimated_delivery_at`, `status`, and `advance_payment`.
(Previously: The schema only validated basic work order fields without financial and scheduling data.)

#### Scenario: Valid payload with new fields
- GIVEN a work order payload with `estimated_cost`, `estimated_delivery_at`, `status`, and `advance_payment`
- WHEN the schema is validated
- THEN the validation MUST succeed without errors

#### Scenario: Missing optional financial fields
- GIVEN a work order payload that omits `estimated_cost`, `estimated_delivery_at`, or `advance_payment`
- WHEN the schema is validated
- THEN the validation MUST succeed since they are not strictly required for initial creation

#### Scenario: Invalid advance payment
- GIVEN a work order payload with an `advance_payment` less than 0
- WHEN the schema is validated
- THEN the validation MUST fail with an appropriate error message
