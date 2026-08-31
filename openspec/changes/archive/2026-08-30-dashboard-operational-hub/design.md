# Design: Dashboard Operational Hub

## Context
See [proposal.md](./proposal.md) and [spec.md](./specs/dashboard-operational-hub/spec.md) for full context. The current Dashboard provides high-level vanity metrics without a unified time context. The goal is to transform it into an actionable daily hub with a Global Date Filter, robust operational data (sales history, unbilled entities, pending debt), and quick actions (reprint).

## Goals / Non-Goals
**Goals**:
- Implement a global date filter (default: "Today") controlling all dashboard widgets.
- Introduce actionable KPIs: Total Revenue, Ticket Count, Ready/Delivered Orders.
- Build a Sales History table with a "Reprint" action via the existing `PrintableInvoice` engine.
- Create an Unbilled Entities widget with tabs for Sales and Orders (where `cae` is null).
- Create a Pending Debt widget for orders with `balance > 0` in `ready_for_pickup` or `delivered` status.

**Non-Goals**:
- Full ARCA integration (this change only prepares for it by surfacing unbilled entities).
- Modifying the underlying database schema.

## Decisions

- **Decision: Global Date Picker State in `DashboardPage.tsx`**
  - **Rationale**: The date filter is a page-level concern that dictates the data fetched for all widgets. We will use a standard DatePicker component with a default state of "Today".
  - **Alternative**: Storing the date filter in a global Zustand store. Not necessary since it only affects the dashboard view.

  - **Decision: Unified `fetchDashboardMetrics` Service with Parallel Fetching**
    - **Rationale**: We will update the existing `fetchDashboardData` service (or create `fetchDashboardMetrics`) to accept `dateRange`. We will use `Promise.all` to fetch KPIs, Sales History, Unbilled Sales, Unbilled Orders, and Pending Debt concurrently.
    - **Details**: Supabase queries for KPIs and Sales History will use `.gte('created_at', from)` and `.lte('created_at', to)`.
    - **CRITICAL EXCEPTION**: "Pending Debt" and "Unbilled Entities" are stateful operational metrics. They MUST IGNORE the Global Date Filter. If a debt was created a month ago, it must still appear on the dashboard today so it doesn't get lost. The SQL queries for these widgets will omit date boundaries.

- **Decision: Print Engine Integration**
  - **Rationale**: We will reuse the `PrintableInvoice` component and `fetchSaleForPrint` service for the "Reprint" action in the Sales History widget.
  - **Implementation**: The Dashboard will maintain a modal state for the invoice, similar to how it works in the POS view.

- **Decision: Component Decomposition**
  - **New Components**:
    - `GlobalDateFilter`: Reusable date range picker.
    - `OperationalKPIs`: Renders KPI cards (Revenue, Tickets, etc.).
    - `SalesHistoryWidget`: Data table for `sales`.
    - `UnbilledWidget`: Uses `Tabs` to separate Sales and Orders.
    - `PendingDebtWidget`: Data table for `work_orders` with navigation links to `/orders/:id`.

## File Changes

| Action | File | Description |
|---|---|---|
| Update | `apps/web/src/pages/DashboardPage.tsx` | Introduce Global Date Filter state, replace existing widgets with new operational widgets, manage `PrintableInvoice` modal state. |
| Update | `apps/web/src/lib/services/dashboard.ts` | Refactor `fetchDashboardData` to accept date range and fetch new queries (Sales, Unbilled, Pending Debt, new KPIs). |
| Create | `apps/web/src/components/dashboard/GlobalDateFilter.tsx` | UI component for selecting the date range. |
| Create | `apps/web/src/components/dashboard/OperationalKPIs.tsx` | Renders the new set of KPIs based on filtered data. |
| Create | `apps/web/src/components/dashboard/SalesHistoryWidget.tsx` | Data table showing direct sales with "Reprint" action. |
| Create | `apps/web/src/components/dashboard/UnbilledWidget.tsx` | Tabbed widget displaying unbilled sales and work orders (cae is null). |
| Create | `apps/web/src/components/dashboard/PendingDebtWidget.tsx` | Table displaying work orders with `balance > 0` and status `ready_for_pickup` or `delivered`. |

## Risks / Trade-offs
- **Performance**: Fetching 5-6 queries in parallel for every date change could hit the database hard on slow connections, but Supabase is well-indexed on `branch_id` and date columns, so it should be fast enough.
