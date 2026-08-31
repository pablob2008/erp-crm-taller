# Tasks: dashboard-operational-hub

## 1. Services & Data Layer
- [x] 1.1 Update `apps/web/src/lib/services/dashboard.ts` to define TypeScript interfaces for `DateRange`, `OperationalKPIsData`, `SalesHistoryItem`, `UnbilledSaleItem`, `UnbilledOrderItem`, `PendingDebtItem`, and the consolidated `DashboardMetrics`.
- [x] 1.2 Implement `fetchDashboardMetrics(supabase, branchId, dateRange)` in `apps/web/src/lib/services/dashboard.ts` executing concurrent queries via `Promise.all`:
  - Filtered by `dateRange`: Total Revenue, Ticket Count, Ready/Delivered Orders, and Sales History table records.
  - Explicitly unfiltered by date (omitting date boundaries): Unbilled Sales (`cae` is null), Unbilled Work Orders (`cae` is null), and Pending Debt Work Orders (`balance > 0` with status in `ready_for_pickup` or `delivered`).

## 2. UI Components & Widgets
- [x] 2.1 Create `apps/web/src/components/dashboard/GlobalDateFilter.tsx` providing a date range picker that defaults to "Today" with standard quick presets and triggers parent updates on range change.
- [x] 2.2 Create `apps/web/src/components/dashboard/OperationalKPIs.tsx` to render KPI cards for Total Revenue, Ticket Count, and Ready/Delivered Orders with loading skeleton support.
- [x] 2.3 Create `apps/web/src/components/dashboard/SalesHistoryWidget.tsx` to render direct point-of-sale transactions within the selected date range and provide a "Reprint" button per row.
- [x] 2.4 Create `apps/web/src/components/dashboard/UnbilledWidget.tsx` with tabs separating Unbilled Sales and Unbilled Work Orders (where `cae` is null) displaying historical records regardless of the global date filter.
- [x] 2.5 Create `apps/web/src/components/dashboard/PendingDebtWidget.tsx` displaying work orders with `balance > 0` and status `ready_for_pickup` or `delivered`, with links navigating to `/orders/:id`.

## 3. Page Assembly & Print Integration
- [x] 3.1 Update `apps/web/src/pages/DashboardPage.tsx` to manage page-level `dateRange` state defaulting to today and orchestrate data fetching via `fetchDashboardMetrics`.
- [x] 3.2 Integrate the Reprint flow in `apps/web/src/pages/DashboardPage.tsx` by fetching sale details via `fetchSaleForPrint`, rendering the hidden `PrintableInvoice` component, and executing `window.print()`.
- [x] 3.3 Assemble the dashboard layout in `apps/web/src/pages/DashboardPage.tsx` with `GlobalDateFilter` in the header, `OperationalKPIs` row, and responsive grid layout for `SalesHistoryWidget`, `UnbilledWidget`, and `PendingDebtWidget`.
