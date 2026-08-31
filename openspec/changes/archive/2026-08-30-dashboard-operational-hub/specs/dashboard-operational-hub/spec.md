# Specification: Dashboard Operational Hub

## Purpose
Transform the Dashboard into an actionable Operational and Financial Hub with unified time context, actionable day-to-day data, and quick actions for sales and debts.

## ADDED Requirements

### Requirement: Global Date Filter behavior
The dashboard MUST provide a unified global date filter that dynamically updates all related KPIs, tables, and metrics within the view based on the selected timeframe.

#### Scenario: Date filter defaults and application
- **GIVEN** a user navigates to the dashboard view
- **WHEN** the dashboard initially loads
- **THEN** the Global Date Filter SHALL default to "Today"
- **AND** all KPIs and tables SHALL display data filtered exclusively for the "Today" timeframe

#### Scenario: Date filter change updates context
- **GIVEN** a user is viewing the dashboard
- **WHEN** the user selects a new date range in the Global Date Filter
- **THEN** all data widgets (KPIs, Sales History) SHALL automatically refresh to reflect the newly selected timeframe

### Requirement: Sales History table functionality
The dashboard MUST feature a Sales History table displaying direct point-of-sale transactions with quick actions for reprinting.

#### Scenario: Reprinting a past sale
- **GIVEN** a user is viewing the Sales History table on the dashboard
- **WHEN** the user clicks the "Reprint" action on a specific sale record
- **THEN** the system SHALL invoke the `PrintableInvoice` engine for that sale
- **AND** present the printable invoice output to the user

### Requirement: Unbilled Entities logic
The dashboard MUST identify and display entities that have not been billed (`cae` is null), explicitly differentiating between sales and work orders for future ARCA integration.

#### Scenario: Differentiating unbilled sales and orders
- **GIVEN** a user is viewing the Unbilled Entities widget on the dashboard
- **WHEN** navigating between the separated lists or tabs
- **THEN** the system SHALL display Unbilled Sales containing only `sales` records where `cae` is null
- **AND** SHALL display Unbilled Orders containing only `work_orders` records where `cae` is null

#### Scenario: Unbilled entities transcend the global date filter
- **GIVEN** a user has changed the Global Date Filter to a specific range (e.g. "Today")
- **WHEN** the Unbilled Entities widget loads data
- **THEN** the system SHALL ignore the global date filter and fetch all unbilled entities historically to prevent missing unbilled tickets

### Requirement: Pending Debt logic
The dashboard MUST track and display work orders that carry an outstanding balance and are ready or delivered, enabling quick access to their details.

#### Scenario: Displaying and navigating pending debt
- **GIVEN** work orders exist with statuses in `ready` or `delivered` and a `balance > 0`
- **WHEN** the user views the Pending Debt table on the dashboard
- **THEN** the system SHALL list these specific work orders
- **AND** clicking on any record in this table SHALL navigate the user directly to the Order Details view for that specific work order

#### Scenario: Pending debt transcends the global date filter
- **GIVEN** a user has changed the Global Date Filter to a specific range
- **WHEN** the Pending Debt table loads data
- **THEN** the system SHALL ignore the global date filter and fetch all historical pending debts so no unpaid order is hidden from the dashboard
