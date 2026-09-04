# Spec: inventory-pos-stock-management

## Purpose
A high-speed, POS-style stock management interface for rapid search, barcode scanning, quick quantity adjustments, and comprehensive inventory CRUD operations, separated into a dedicated tab.

## ADDED Requirements

### Requirement: Tab Organization
The system MUST provide a tabbed navigation interface within the Inventory module to separate the unified purchasing board from the stock management panel.

#### Scenario: Switching between Purchases and Stock
- **GIVEN** the user navigates to the Inventory module
- **WHEN** the page loads
- **THEN** the system SHALL default to displaying the "🛒 Lista de Compras" tab (the existing unified board).
- **WHEN** the user clicks on the "📦 Stock" tab
- **THEN** the system SHALL display the new POS-style stock management panel.

### Requirement: High-Speed POS Search
The Stock tab MUST include a high-speed search bar optimized for barcode/QR scanners and SKU/name filtering.

#### Scenario: Searching for an item by Barcode/SKU
- **GIVEN** the user is viewing the "📦 Stock" tab
- **WHEN** the user scans a barcode or types an SKU/name into the search bar
- **THEN** the system SHALL immediately filter the displayed stock list to show matching items.
- **THEN** the search bar MUST remain focused after a scan to allow continuous rapid searching.

### Requirement: Quick Quantity Adjustment
The Stock panel MUST display items in a list format with immediate "+" and "-" buttons for rapid quantity modification.

#### Scenario: Adjusting stock quantity quickly
- **GIVEN** the user has located a specific item in the Stock panel
- **WHEN** the user clicks the "+" or "-" buttons next to the item's quantity
- **THEN** the system SHALL immediately update the `inventory_items` table with the new quantity.
- **THEN** the system SHALL visually reflect the updated quantity without requiring a full page reload or modal interaction.

### Requirement: Inventory CRUD Modal
The system MUST provide a modal interface to create new inventory items or edit comprehensive details of existing items (including min stock, prices, etc.).

#### Scenario: Adding a new inventory item
- **GIVEN** the user is viewing the "📦 Stock" tab
- **WHEN** the user clicks the "Add Item" button
- **THEN** the system SHALL display the Inventory CRUD Modal.
- **WHEN** the user fills in required details (name, SKU, min stock, prices) and submits the form
- **THEN** the system SHALL create a new record in the `inventory_items` table and update the stock list.

#### Scenario: Editing an existing inventory item
- **GIVEN** the user has located a specific item in the Stock panel
- **WHEN** the user clicks the "Edit" button for that item
- **THEN** the system SHALL display the Inventory CRUD Modal populated with the item's current details.
- **WHEN** the user updates the details and submits the form
- **THEN** the system SHALL update the corresponding record in the `inventory_items` table and reflect the changes in the stock list.
