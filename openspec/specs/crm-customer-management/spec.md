# Capability: crm-customer-management

## Purpose
This capability provides a centralized Customer Directory to manage, search, edit, safely delete, and view historical snapshots of customer data.

## Requirements

### Requirement: Data Table & Search
The system SHALL provide a paginated data table displaying customers. Users MUST be able to search for customers using their name, document number, or phone number.

#### Scenario: Search by name, document, or phone
- **GIVEN** a user is viewing the customer data table
- **WHEN** the user enters a search term matching a customer's name, document, or phone
- **THEN** the data table SHALL filter and display the matching customer records

### Requirement: Edit Action
The system SHALL allow users to successfully update customer data via an edit modal interface.

#### Scenario: Successful update of customer data via modal
- **GIVEN** a user has opened the edit modal for an existing customer
- **WHEN** the user modifies the customer's information (name, phone, email, document) and submits the form
- **THEN** the system SHALL update the customer record in the database and reflect the changes in the data table

### Requirement: Safe Delete Action
The system SHALL enforce safe deletion of customers, preventing deletion if sales or work orders exist, and allowing it if the customer is completely clean.

#### Scenario: Preventing deletion if sales or work orders exist
- **GIVEN** a customer has associated sales or work orders
- **WHEN** a user attempts to delete the customer
- **THEN** the system SHALL prevent the deletion and display an error message indicating that associated records exist

#### Scenario: Allowing deletion if the customer is completely clean
- **GIVEN** a customer has zero associated sales and zero work orders
- **WHEN** a user attempts to delete the customer
- **THEN** the system SHALL successfully delete the customer record and remove them from the data table

### Requirement: Customer History Snapshot
The system SHALL display a snapshot of a customer's history, specifically showing their total order count and total amount spent (lifetime value).

#### Scenario: Displaying order count and total spent
- **GIVEN** a user is viewing a customer in the CRM directory
- **WHEN** the customer record is loaded
- **THEN** the system SHALL display the accurate order count and total amount spent for that specific customer
