# Delta for work-order-entry

## ADDED Requirements

### Requirement: Advance Payment Method Selection

The system MUST allow selecting a payment method (Cash, QR, Transfer, Card) when an advance payment is provided during work order creation.

#### Scenario: Advance payment with explicit method
- GIVEN a customer and required device details are provided
- AND the user enters an advance payment amount
- WHEN the user selects a specific payment method and submits
- THEN the system creates the work order
- AND the system records the advance payment with the selected method

#### Scenario: Advance payment with default method
- GIVEN the user enters an advance payment amount
- WHEN the user does not explicitly select a payment method
- THEN the system defaults the payment method to "Cash"
- AND records the advance payment with the default method
