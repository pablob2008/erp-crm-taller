## Purpose

This capability defines the mechanics for locating work orders quickly via global and contextual search, filtering by statuses, and generating printable workshop intake tickets with legal clauses.

## ADDED Requirements

### Requirement: Global Header Search
The system MUST provide a global search input in the application header that redirects the user to the orders list page with the search term applied.

#### Scenario: Submitting a search from the global header
- **GIVEN** a user is on any page with the global dashboard header
- **WHEN** the user enters a search term into the global search input and presses enter or submits
- **THEN** the system SHALL redirect the user to the `/orders` route with the query parameter `q` set to the entered search term (e.g., `/orders?q=...`)

### Requirement: Orders List Contextual Search
The orders list MUST provide a contextual search input to filter orders based on multiple fields such as order number, customer name, customer phone, and device details.

#### Scenario: Filtering the orders list by text
- **GIVEN** a user is viewing the `/orders` page
- **WHEN** the user types text into the contextual search input
- **THEN** the system SHALL filter the displayed list of orders in real-time or upon submission, matching the text against the order number, customer name, phone number, and device description.

### Requirement: Orders List Status Tabs
The system MUST allow users to filter the orders list by the current workflow status of the work orders using predefined tabs.

#### Scenario: Filtering orders by status tabs
- **GIVEN** a user is viewing the `/orders` page
- **WHEN** the user clicks on a status tab ('All', 'In Workshop', 'Ready', 'Delivered')
- **THEN** the system SHALL display only the work orders that match the selected status (or all orders if 'All' is selected).

### Requirement: Printable Workshop Ticket
The system MUST provide a printable intake ticket (Comprobante de Ingreso) layout or modal accessible from the order details page, which includes comprehensive receipt information and a legal clause.

#### Scenario: Generating a printable ticket for an order
- **GIVEN** a user is viewing the details of a specific work order
- **WHEN** the user clicks the action to print the intake ticket
- **THEN** the system SHALL present a printable layout or modal
- **AND** the layout MUST include the device condition, accessories included, financial balance, and standard legal warranty clauses.
