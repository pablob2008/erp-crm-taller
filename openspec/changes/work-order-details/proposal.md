<Proposal: Work Order Details View>
## Intent
Provide a comprehensive command center for a single work order (`/orders/:id`) to allow users to manage all related entities, tracking the repair lifecycle, tasks, parts, and finances from one centralized view.

## Scope

### In Scope
- Creation of `WorkOrderDetailsPage.tsx` at `/orders/:id`.
- Header section displaying customer info, device details, reported problem, and current order status (with ability to update).
- Notes section for viewing and adding internal notes (`work_order_notes`).
- Tasks checklist for managing order-specific tasks (`tasks`).
- Parts and purchases section for linking inventory items and tracking costs (`work_order_items`, `purchases`).
- Finances section to view related payments and register new ones (`cash_movements`).
- Creation of service functions in `lib/services/work-order-details.ts` for data fetching and mutations.

### Out of Scope
- Full history visualization for status changes (MVP only allows updating current status).
- Complex stock management workflows (only linking existing inventory to the order).
- Printing functionality for work order receipts (to be handled in a separate change).

## Capabilities

### New Capabilities
- `view-work-order-details`: View all related entities (notes, tasks, items, payments) for a single work order.
- `update-work-order-status`: Change the current status of the work order.
- `manage-order-notes`: Add and view internal notes for a specific order.
- `manage-order-tasks`: Add, check, and uncheck tasks linked to an order.
- `manage-order-items`: Link inventory items or purchases to the work order.
- `manage-order-payments`: Record and view payments associated with the work order.

### Modified Capabilities
- None.

## Approach
Implement a Tabs-based UI layout to organize the dense information into logical sections:
1. **Overview Tab**: Header (Device, Customer, Problem, Status editor), Tasks checklist, and recent Notes.
2. **Parts & Purchases Tab**: Manage `work_order_items` and `purchases` related to the order.
3. **Finances Tab**: Display `cash_movements` (payments) and a form to add new payments (selecting `payment_method`).

We will create a new service module `lib/services/work-order-details.ts` containing functions like `getWorkOrderDetails`, `updateOrderStatus`, `addOrderNote`, `addOrderTask`, `addOrderItem`, and `addOrderPayment`. These functions will perform the necessary Supabase queries.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `app/(dashboard)/orders/[id]/page.tsx` | New | Main page component for work order details |
| `components/orders/details/*` | New | UI components for Tabs, Header, Notes, Tasks, Items, Finances |
| `lib/services/work-order-details.ts` | New | Service functions for fetching and updating related entities |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Data inconsistency when updating status | Low | Rely on Supabase triggers already in schema (`trg_audit_work_order_status`). |
| Complex state management across tabs | Med | Fetch complete order state centrally or use data fetching hooks to manage local cache efficiently. |

## Rollback Plan
Remove the newly created `app/(dashboard)/orders/[id]` directory, `components/orders/details` directory, and the service file `lib/services/work-order-details.ts`.

## Dependencies
- `supabase_schema.sql` (Existing schema with `work_orders` and related tables)
- UI component library (Tabs, Cards, Forms)

## Success Criteria
- [ ] Users can navigate to `/orders/:id` and view comprehensive order details.
- [ ] Users can update the order status directly from the page.
- [ ] Users can add notes, tasks, items, and register payments linked to the order.
- [ ] Data correctly reflects the underlying database schema and relationships.
