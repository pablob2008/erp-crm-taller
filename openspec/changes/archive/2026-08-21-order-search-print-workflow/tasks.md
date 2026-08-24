# Tasks

## 1. Services
- [x] 1.1 Create `branch.ts` in `apps/web/src/lib/services/` with a `getBranchInfo(supabase, branchId)` function to fetch branch metadata.
- [x] 1.2 Update `WorkOrder` type and Supabase select query in `apps/web/src/pages/OrdersPage.tsx` to include `customers.phone` and `status`.
- [x] 1.3 Update `apps/web/src/pages/WorkOrderDetailsPage.tsx` to fetch branch info on mount via `getBranchInfo` to support ticket printing.

## 2. Contextual Search & Tabs
- [x] 2.1 Create a reusable `OrderStatusTabs.tsx` component in `apps/web/src/components/orders/` for filtering by 'All', 'In Workshop', 'Ready', and 'Delivered'.
- [x] 2.2 Refactor `apps/web/src/pages/OrdersPage.tsx` to use React Router's `useSearchParams` hook for URL-driven state (`q`, `status`).
- [x] 2.3 Implement client-side filtering logic with a 300ms debounce in `OrdersPage.tsx` matching queries against order number, customer name, phone, and device fields.
- [x] 2.4 Integrate `OrderStatusTabs` and contextual search input into `OrdersPage.tsx` UI, connecting them to URL state.

## 3. Global Header Search
- [x] 3.1 Refactor `apps/web/src/components/DashboardLayout.tsx` to wire the global header search input to trigger `navigate('/orders?q=...')` on submit.

## 4. Printable Ticket
- [x] 4.1 Create `PrintableTicket.tsx` in `apps/web/src/components/orders/print/` rendering ticket sections (header, customer, device, notes, financials, legal clause, signatures).
- [x] 4.2 Update `apps/web/src/index.css` to add `@media print` rules: hide `.no-print` UI (sidebar, header) and show `.print-only` block (A4 ticket).
- [x] 4.3 Update `apps/web/src/pages/WorkOrderDetailsPage.tsx` to mount `PrintableTicket` with `print-only` styling, passing `order` and `branch` props.
