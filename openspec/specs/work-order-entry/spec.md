<work-order-entry Specification>
## Purpose
Ability to submit a new work order containing device details (Marca y Modelo) and reported issue (Falla), linked to the selected customer.

## Requirements

### Requirement: Dependent Fields Access
The system MUST keep device detail fields disabled until a customer has been explicitly selected.

#### Scenario: No customer selected
- GIVEN the user has not yet selected a customer
- WHEN the user views the work order form
- THEN the fields for Marca, Modelo, and Falla are disabled

#### Scenario: Customer is selected
- GIVEN the device detail fields are disabled
- WHEN the user successfully selects or creates a customer
- THEN the system enables the device and issue entry fields

### Requirement: Work Order Submission
The system MUST allow submitting a work order with complete device intake specifications and diagnostic suggestions, linking all fields to the work order record upon creation.

#### Scenario: Complete work order submission
- **GIVEN** a customer is selected
- **AND** valid input is provided for Marca, Modelo, and Falla
- **WHEN** the user submits the work order
- **THEN** the system creates a new work order record linked to the customer ID

#### Scenario: Complete work order submission with extended intake metadata
- **GIVEN** a customer is selected in the work order entry form
- **WHEN** the user provides device details (brand, model, color, aesthetic condition, accessories) and diagnostic info (reported problem, suggested solution, estimated delivery date) and submits
- **THEN** the system MUST persist all extended intake and diagnostic attributes alongside core order details linked to the selected customer

#### Scenario: Work order submission with minimal required fields
- **GIVEN** a customer is selected
- **WHEN** the user submits the form with required fields (brand, model, reported problem) while optional intake fields remain empty
- **THEN** the system MUST create the work order successfully with default or null values for optional metadata

### Requirement: Required Fields Validation
The system MUST prevent submission if required device or issue details are missing.

#### Scenario: Incomplete form
- GIVEN a customer is selected
- WHEN the user submits the form with empty required fields
- THEN the system displays validation errors and prevents submission
