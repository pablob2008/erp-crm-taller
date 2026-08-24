<customer-search Specification>
## Purpose
Ability to search existing customers by name, phone, or DNI using a predictive combobox.

## Requirements

### Requirement: Search Input
The system MUST provide a combobox input to search for customers by name, phone, or DNI.

#### Scenario: User types in search field
- GIVEN the user is on the work order creation form
- WHEN the user types characters in the customer search input
- THEN the system displays matching customers in the dropdown

### Requirement: Debounced Search
The system MUST debounce customer search queries to prevent excessive database load.

#### Scenario: Rapid typing
- GIVEN the user is focusing the customer search input
- WHEN the user types multiple characters rapidly
- THEN the system waits for a brief pause before executing the search query

### Requirement: Result Selection
The system MUST allow selection of a customer and trigger subsequent UI updates.

#### Scenario: Selecting a customer
- GIVEN search results are displayed
- WHEN the user selects a customer from the list
- THEN the customer is set as the selected customer for the work order
- AND the system enables device entry fields
