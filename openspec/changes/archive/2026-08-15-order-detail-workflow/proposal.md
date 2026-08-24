# Proposal: Order Detail Workflow and Lifecycle Management

## Intent

Enhance the work order details view (`WorkOrderDetailsPage`) into a centralized 360-degree operational dashboard by introducing global order lifecycle management actions, comprehensive customer/device/intake diagnostic information, and an integrated financial settlement and delivery workflow.

## Scope

### In Scope

- **Global Header Actions (`OrderHeader`)**:
  - **Edit Order Modal**: Edit core order metadata including device details (brand, model, color, aesthetic condition, accessories), diagnostic fields (reported problem, suggested solution), financial estimates, and estimated delivery dates.
  - **Delete Order**: Modal confirmation to remove or cancel the order safely and navigate back to the orders list.
  - **Share WhatsApp Summary**: Generate a pre-formatted message summary (order number, device, issue status, balance) and open a direct link via `https://wa.me/{phone}?text={encodedText}`.
  - **Direct WhatsApp Chat**: One-click button to start a WhatsApp conversation with the customer.
  - **Print Placeholder**: Trigger browser print dialog or a formatted print view placeholder for work order receipts.

- **360-Degree Overview (`OverviewTab`)**:
  - **Customer Profile Card**: Display first name, last name, phone number (with direct WhatsApp trigger), email, and tax ID.
  - **Full Device Specifications Card**: Brand, model, color, aesthetic condition, and intake accessories.
  - **Diagnostic & Service Details Card**: Reported problem, intake diagnostic / suggested solution, intake creation timestamp, and estimated delivery date.
  - Retain existing tasks checklist and internal notes with real-time editing and deletion.

- **Financial Management & Settlement Workflow (`FinancesTab`)**:
  - **Add Random Expense Modal**: Register unbudgeted or ad-hoc expenses related to the order (amount, payment method, description) inserting an `expense` entry into `cash_movements`.
  - **Deliver Order Modal (Dual Flow)**:
    - *Deliver on Credit / Without Charge*: Updates order status to `delivered` and automatically records an internal note in `work_order_notes` detailing the pending balance and credit delivery.
    - *Collect & Deliver*: Captures collection amount, payment method (Cash, Card, Transfer, QR), and optional note; records an `income` entry in `cash_movements`, recalculates order `total_paid` and `balance`, inserts a settlement note, and updates status to `delivered`.

### Out of Scope

- Thermal printer hardware driver integration (browser print standard used).
- Automated SMS/email dispatching gateways.
- Advanced multi-warehouse inventory deductions.

## Capabilities

### New Capabilities

- `work-order-lifecycle`: Comprehensive work order lifecycle management covering global header actions (edit, delete, WhatsApp sharing, printing), 360-degree diagnostic and device visibility, ad-hoc expense logging, and dual-mode order settlement & delivery flows.

### Modified Capabilities

- `work-order-entry`: Updated data requirements and schema alignment ensuring intake fields (color, aesthetic condition, accessories, suggested solution, estimated delivery) persist and integrate smoothly into lifecycle viewing and editing.

## Approach

1. **Service Layer Updates (`work-order-details.ts`)**:
   - Extend `WorkOrderComposite` interface and `getWorkOrderDetails` query to fetch all customer fields (`phone`, `email`, `tax_id`), device fields (`device_color`, `aesthetic_condition`, `accessories`), and diagnostic/timing fields (`suggested_solution`, `estimated_delivery_at`, `created_at`).
   - Implement `updateWorkOrder(supabase, orderId, data)` to mutate core order attributes.
   - Implement `deleteWorkOrder(supabase, orderId)` to remove the order record.
   - Implement `addRandomExpense(supabase, branchId, orderId, data)` to register an expense in `cash_movements`.
   - Implement `deliverOrder(supabase, branchId, orderId, deliveryData)` handling both credit deliveries and collect-and-deliver workflows with transactional note and financial movement logging.

2. **Global Header Component (`OrderHeader.tsx`)**:
   - Add action buttons with clean icons: Edit, Delete, Share WhatsApp, WhatsApp Chat, Print.
   - Implement `EditOrderDialog` with pre-filled inputs for all order attributes.
   - Implement `DeleteOrderDialog` with destructive confirmation alert.
   - Implement WhatsApp URL builder utility formatting phone numbers (stripping non-digits) and constructing summary templates.

3. **360-Degree Overview Component (`OverviewTab.tsx`)**:
   - Restructure into clean responsive cards:
     - Customer Information (name, phone with WA shortcut, email).
     - Device Details (brand, model, color, aesthetic condition, accessories).
     - Intake & Diagnosis (reported problem, initial intake diagnosis / suggested solution, intake date, estimated delivery).
   - Retain Task Checklist and Internal Notes with full CRUD actions.

4. **Finances & Delivery Component (`FinancesTab.tsx`)**:
   - Add "Registrar Gasto" button opening `AddExpenseDialog` (amount, payment method, description).
   - Add "Entregar Orden" button opening `DeliverOrderDialog`:
     - Toggle between "Entregar a Crédito" (zero upfront payment, logs pending debt note) and "Cobrar y Entregar" (select payment method, enter amount, logs income movement).
     - Automatically update status to `delivered` upon completion and refresh composite state.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/web/src/lib/services/work-order-details.ts` | Modified | Add update/delete work order, expense logging, and delivery workflow functions; extend `WorkOrderComposite` interface. |
| `apps/web/src/components/orders/details/OrderHeader.tsx` | Modified | Add Edit, Delete, WhatsApp share, WhatsApp direct chat, and Print action triggers. |
| `apps/web/src/components/orders/details/tabs/OverviewTab.tsx` | Modified | Display complete customer contact info, device specs, diagnostic solution, and dates. |
| `apps/web/src/components/orders/details/tabs/FinancesTab.tsx` | Modified | Add ad-hoc expense modal and dual-flow Deliver Order modal. |
| `apps/web/src/pages/WorkOrderDetailsPage.tsx` | Modified | Wire new service handlers and modal state triggers. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Inconsistent financial totals during collect-and-deliver | Medium | Ensure `recalculateOrderFinancials` runs synchronously after inserting cash movements. |
| Malformed phone numbers breaking WhatsApp links | Medium | Sanitize phone strings to digits only before passing to `https://wa.me/` endpoint. |
| Accidental order deletion | Low | Require explicit user confirmation modal before triggering deletion. |

## Rollback Plan

- Revert component changes in `apps/web/src/components/orders/details/` and page changes in `apps/web/src/pages/WorkOrderDetailsPage.tsx`.
- Revert service additions in `apps/web/src/lib/services/work-order-details.ts`.

## Success Criteria

- [ ] Users can edit order details (device, diagnosis, estimates) via the Edit Order modal in `OrderHeader`.
- [ ] Users can delete a work order after confirming via the confirmation dialog.
- [ ] Users can trigger a direct WhatsApp chat and share a formatted order summary to WhatsApp via `wa.me` links.
- [ ] OverviewTab renders complete customer details (with WA button), full device specifications, and intake diagnostic/solution info.
- [ ] Users can register ad-hoc/random expenses from FinancesTab.
- [ ] Users can deliver an order on credit (logging an automatic note) or collect & deliver (registering payment, updating balance, and logging note).
