# Tasks — dashboard-redesign-premium

## 1. Styling & Config (CSS vars, Tailwind)
- [x] 1.1 Add `--kpi-blue`, `--kpi-green`, `--kpi-amber`, `--kpi-red` CSS custom properties to `index.css` (`:root` and `.dark`).
- [x] 1.2 Update `tailwind.config.js` to extend colors with `kpi-blue`, `kpi-green`, `kpi-amber`, `kpi-red` mapped to the new CSS variables.

## 2. Services (dashboard.ts queries)
- [x] 2.1 Create `apps/web/src/lib/services/dashboard.ts` module.
- [x] 2.2 Implement `fetchDashboardData` function orchestrating parallel data fetching via `Promise.all`.
- [x] 2.3 Implement query for Active Workshop KPI (count of `work_orders` where status NOT IN 'delivered', 'cancelled').
- [x] 2.4 Implement query for Ready for Pickup KPI (count of `work_orders` where status = 'ready_for_pickup').
- [x] 2.5 Implement query for Today's Cash KPI (sum of `net_amount` from `cash_movements` filtered by today's date).
- [x] 2.6 Implement query for Stock Alerts KPI (count of `inventory_items` where quantity <= min_stock).
- [x] 2.7 Implement query for Pipeline Widget (count of `work_orders` grouped by status, excluding 'delivered', 'cancelled').
- [x] 2.8 Implement query for Recent Orders Widget (last 10 `work_orders` joined with `customers`, ordered by `created_at` DESC).
- [x] 2.9 Implement query for Activity Feed Widget (last 5 `cash_movements`, ordered by `created_at` DESC).

## 3. UI Components (the 5 widget files)
- [x] 3.1 Create `KpiCard.tsx` component with icon, label, value, accent color prop, loading skeleton, and neumorphic `shadow-neu` styling.
- [x] 3.2 Create `PipelineWidget.tsx` component to render a horizontal stacked-bar pipeline mapped to status counts and color tokens.
- [x] 3.3 Create `RecentOrdersWidget.tsx` component to display a table of the last 10 orders including order number, customer name, device, status badge, and a conditional WhatsApp link button.
- [x] 3.4 Create `ActivityFeedWidget.tsx` component to show a vertical feed of the last 5 cash movements with type icon (income/expense), description, net amount, and relative time.
- [x] 3.5 Create `QuickActionsWidget.tsx` component with a grid of neumorphic action buttons (New Order, Add Expense, Inventory, Customers) using `Link`.

## 4. Page Integration (DashboardPage.tsx)
- [x] 4.1 Update `apps/web/src/pages/DashboardPage.tsx` to remove old sequential data fetching logic.
- [x] 4.2 Integrate `fetchDashboardData` in a single `useEffect` to populate dashboard state.
- [x] 4.3 Replace existing KPI cards with 4 new `KpiCard` components (Active Workshop, Ready for Pickup, Today's Cash, Stock Alerts).
- [x] 4.4 Add the `PipelineWidget` below the Hero KPIs.
- [x] 4.5 Add the `RecentOrdersWidget` and `ActivityFeedWidget` in a responsive grid layout.
- [x] 4.6 Integrate the `QuickActionsWidget` into the dashboard layout.
- [x] 4.7 Ensure appropriate loading states (skeletons) and error handling are implemented for the parallel data fetch.
