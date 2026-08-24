<inline-customer-creation Specification>
## Purpose
Ability to quickly create a new customer record from within the work order flow.

## Requirements

### Requirement: Customer Creation Trigger
The system MUST provide an option to create a new customer during the search process.

#### Scenario: Triggering new customer creation
- GIVEN the user is searching for a customer
- WHEN the user chooses to create a new customer
- THEN the system displays a form or dialog to enter new customer details

### Requirement: Customer Data Entry
The system MUST accept essential customer details to create a record.

#### Scenario: Submitting new customer
- GIVEN the user is filling out the new customer form
- WHEN the user provides valid name and contact info and submits
- THEN the system creates the customer record in the database
- AND sets the newly created customer as the active customer for the work order

### Requirement: Duplicate Prevention
The system SHOULD prevent creation of duplicate customers with the same DNI.

#### Scenario: Submitting duplicate DNI
- GIVEN the user is filling out the new customer form
- WHEN the user enters a DNI that is already registered to another customer
- THEN the system displays an error and prevents creation
