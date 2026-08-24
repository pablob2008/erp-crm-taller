# work-order-details Specification

## Purpose
Display the comprehensive overview of a work order including customer and device information, and provide access to all related work order operations.

## Requirements

### Requirement: Display Customer and Device Information
The system MUST display the customer's first and last name, along with the device brand and model in the Overview tab.

#### Scenario: View Overview Tab
- GIVEN a work order with an associated customer and device
- WHEN the user views the Overview tab
- THEN the customer's name and device brand/model are displayed

### Requirement: Tab Navigation Structure
The system MUST provide a tabbed structure including "Overview", "Lista de Compras", and "Finances".

#### Scenario: Navigate to Purchases
- GIVEN the work order details page
- WHEN the user clicks the "Lista de Compras" tab
- THEN the purchases management view is displayed
