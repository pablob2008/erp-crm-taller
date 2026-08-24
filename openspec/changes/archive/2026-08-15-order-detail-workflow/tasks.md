# Tasks: Order Detail Workflow and Lifecycle Management

## 1. Services Layer
- [x] 1.1 Extend `WorkOrderComposite` interface and `.select()` query in `work-order-details.ts` to include customer contact fields (`phone`, `email`, `tax_id`), device fields (`device_color`, `aesthetic_condition`, `accessories`), and timing fields (`suggested_solution`, `estimated_delivery_at`, `created_at`).
- [x] 1.2 Implement and export `updateWorkOrder(supabase, orderId, data)` in `work-order-details.ts` to update mutable work order columns.
- [x] 1.3 Implement and export `deleteWorkOrder(supabase, orderId)` in `work-order-details.ts` to hard-delete a work order.
- [x] 1.4 Implement and export `addRandomExpense(supabase, branchId, orderId, data)` in `work-order-details.ts` to insert an expense movement into `cash_movements`.
- [x] 1.5 Implement and export `deliverOrder(supabase, branchId, orderId, data)` in `work-order-details.ts` to handle dual-path delivery (credit vs collect) including movement insertion, balance recalculation, note insertion, and status update.

## 2. Overview Tab UI
- [x] 2.1 Refactor `OverviewTab.tsx` to replace the single "Información General" card with three structured cards: Customer Profile, Device Specifications, and Diagnosis & Schedule.
- [x] 2.2 Update Customer Profile card in `OverviewTab.tsx` to display `first_name`, `last_name`, `phone` (with WhatsApp quick-action), `email`, and `tax_id`.
- [x] 2.3 Update Device Specifications card in `OverviewTab.tsx` to display `brand`, `model`, `device_color`, `aesthetic_condition`, and `accessories`.
- [x] 2.4 Update Diagnosis & Schedule card in `OverviewTab.tsx` to display `reported_problem`, `suggested_solution`, `created_at`, and `estimated_delivery_at`.


## 3. Header UI
- [x] 3.1 Create utility functions `buildWhatsAppUrl` and `buildOrderSummaryText` for WhatsApp integration.
- [x] 3.2 Create `EditOrderDialog` component with collapsible sections for Device Details, Diagnosis & Service, and Financial Estimate.
- [x] 3.3 Create `DeleteOrderDialog` component with destructive confirmation (echoing order number).
- [x] 3.4 Update `OrderHeader.tsx` to integrate action buttons (Edit, Delete, WhatsApp Share, WhatsApp Chat, Print) and wire `EditOrderDialog` and `DeleteOrderDialog`.
- [x] 3.5 Implement `window.print()` functionality for the Print button.


## 4. Finances Tab UI
- [x] 4.1 Create `AddExpenseDialog` component with validation for amount, payment_method, and description.
- [x] 4.2 Create `DeliverOrderDialog` component with an internal toggle between "Deliver on Credit" and "Collect & Deliver" modes.
- [x] 4.3 Update `FinancesTab.tsx` to add "Registrar Gasto" and "Entregar Orden" buttons, integrating the new dialogs.
- [x] 4.4 Wire new props (`onAddExpense`, `onDeliverOrder`, `branchId`) in `FinancesTab.tsx`.


## 5. Page Integration
- [x] 5.1 Update `WorkOrderDetailsPage.tsx` to import new service functions and implement handler functions (`handleEditOrder`, `handleDeleteOrder`, `handleAddExpense`, `handleDeliverOrder`).
- [x] 5.2 Wire all handlers and new props to `OrderHeader` and `FinancesTab` in `WorkOrderDetailsPage.tsx`.
- [x] 5.3 Implement post-delete redirect to `/orders` using `useNavigate`.

