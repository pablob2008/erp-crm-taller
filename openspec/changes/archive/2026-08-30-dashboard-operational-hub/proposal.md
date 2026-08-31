# Proposal: dashboard-operational-hub

## 1. Problem Statement
The current Dashboard relies on vanity metrics that do not provide actionable day-to-day data for the business. It lacks a unified time context, making it difficult to understand operational performance and financial status at a glance. Additionally, quick actions for daily operations, such as reprinting sales or easily tracking pending debt and unbilled entities, are missing.

## 2. Goal
Transform the Dashboard into a true Operational & Financial Hub, retiring vanity metrics in favor of actionable day-to-day data and quick actions.

## 3. Scope
- **Global Date Filter**: A unified date range selector at the top (defaulting to 'Today') that drives the context for all dashboard widgets.
- **KPIs**: Key metrics like total revenue, ticket count, and ready/delivered orders count for the selected timeframe.
- **Sales History**: A robust table for direct POS sales (`sales`), including a "Reprint" action that leverages the recently built `PrintableInvoice` engine.
- **Unbilled Entities (Sin Facturar)**: Separated into two distinct lists/tabs for future ARCA integration:
  - Unbilled Sales (`sales` where `cae` is null).
  - Unbilled Orders (`work_orders` where `cae` is null).
- **Pending Debt**: A table tracking `work_orders` in `ready` or `delivered` statuses that have a `balance > 0`. Clicking navigates to the Order Details page.

## 4. Capabilities

### New Capabilities
- `dashboard-operational-hub`: Transforming the dashboard into an operational and financial hub with date-filtered KPIs, sales history, unbilled entities tracking, and pending debt management.

### Modified Capabilities
- None.

## 5. Technical Approach
- **UI Architecture**: Introduce a top-level global date filter component in the dashboard layout.
- **Data Fetching**: Update existing and new dashboard components to react to changes in the global date filter, fetching filtered data for KPIs, Sales History, Unbilled Entities, and Pending Debt.
- **Sales History Component**: Implement a data table displaying sales with an action column invoking the `PrintableInvoice` engine.
- **Unbilled Entities Component**: Create a tabbed interface separating unbilled `sales` (where `cae` is null) and unbilled `work_orders` (where `cae` is null).
- **Pending Debt Component**: Create a data table for work orders with `status` in `['ready', 'delivered']` and `balance > 0`. Add navigation links to the specific Order Details view.
- **Database Queries**: Optimize queries to support efficient filtering by date ranges and specific status/balance criteria.
