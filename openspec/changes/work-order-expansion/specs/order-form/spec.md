</Order Form Specification>
<Delta for Order Form>
## MODIFIED Requirements
### Requirement: Expanded Form UI Sections
The system MUST provide UI elements in `WorkOrderForm.tsx` to capture financial and scheduling data within a new section named "4. Presupuesto y Tiempos".
(Previously: The form only captured vehicle, client, and issue details.)

#### Scenario: Navigating to the budget section
- GIVEN the user is filling out a new work order
- WHEN they view the form
- THEN they MUST see a section titled "4. Presupuesto y Tiempos"
- AND this section MUST include inputs for `estimated_cost`, `estimated_delivery_at`, `status`, and `advance_payment`

#### Scenario: Submitting complete form
- GIVEN the user has provided valid inputs for all required fields including the new budget and time fields
- WHEN they submit the form
- THEN the form MUST include the new fields in the submission payload sent to the creation service
- AND it MUST display success if the operation completes

#### Scenario: Submitting with advance payment fails
- GIVEN the user submits a form with `advance_payment > 0`
- WHEN the creation service indicates that the work order was created but the payment step failed
- THEN the form MUST notify the user that the payment step failed so they can record it manually
