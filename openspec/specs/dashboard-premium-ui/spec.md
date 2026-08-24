# dashboard-premium-ui Specification

## Purpose
This capability defines the real-time operational dashboard requirements, focusing on high-impact KPIs, pipeline visualizations, and premium UI elements for the application.

## Requirements

### Requirement: Workshop Activity KPIs
The dashboard MUST provide high-level KPIs including Active Workshop, Ready for Pickup, Today's Cash, and Stock Alerts to quickly inform the user of daily operational status.

#### Scenario: Viewing Daily Operational KPIs
- **GIVEN** the user navigates to the dashboard
- **WHEN** the dashboard loads
- **THEN** the system SHALL display Hero KPIs showing the count of active work orders, orders ready for pickup, today's cash total, and the number of low stock alerts.

### Requirement: Workshop Live Pipeline
The dashboard SHALL visualize the progress of all current orders through a live pipeline, enabling quick tracking of workshop throughput.

#### Scenario: Tracking Order Status Progression
- **GIVEN** the dashboard is actively loaded
- **WHEN** there are work orders in various states (e.g., Pending, In Progress, QA, Ready)
- **THEN** the system SHALL render a visual progress bar or pipeline visualization that aggregates and displays the distribution of order statuses.

### Requirement: Live Orders Table
The dashboard MUST contain a table detailing recent orders, augmented with status badges and quick action links such as direct WhatsApp communication.

#### Scenario: Interacting with Recent Orders
- **GIVEN** a list of recent live orders is displayed on the dashboard
- **WHEN** the user views the live orders table
- **THEN** the system SHALL present each order with a status badge AND a WhatsApp quick link button that opens a direct chat with the customer.

### Requirement: Neumorphic Quick Actions
The user interface SHALL employ Neumorphic design principles for quick action buttons to provide a premium, modern tactile look and fast navigation to common tasks.

#### Scenario: Utilizing Quick Action Buttons
- **GIVEN** the dashboard is fully rendered
- **WHEN** the user interacts with the quick action panel
- **THEN** the system SHALL provide visually distinct, Neumorphic-styled buttons that navigate to key functionalities like "New Order", "Add Expense", or "Inventory".
