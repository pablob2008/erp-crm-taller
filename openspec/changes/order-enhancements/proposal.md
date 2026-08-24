# Proposal: Order Enhancements

## Intent

Improve work order tracking and user experience by allowing explicit payment methods for advance payments during order creation, and fix the order details view where adding tasks and internal notes silently fails due to missing relational context (branch ID and author ID).

## Scope

### In Scope
- Add `payment_method` enum select (Cash, QR, Transfer, Card) alongside `advance_payment` in `WorkOrderForm.tsx`.
- Update `workOrderSchema` to accept `payment_method`.
- Update `createWorkOrder` service to persist the selected payment method instead of hardcoding "cash".
- Fix `addTask` in `work-order-details.ts` to require and pass the `branch_id`.
- Modify `OverviewTab.tsx` and `WorkOrderDetailsPage.tsx` to resolve `branch_id` (via fetching it in `getWorkOrderDetails`) and pass it down for task creation.
- Fix `addOrderNote` in `work-order-details.ts` to require and pass the `author_id`.

### Out of Scope
- Changing how other payments are handled beyond the advance payment at creation.
- Adding new payment methods to the enum in the database.
- Modifying UI styles beyond inserting the new select field.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `work-order-entry`: MUST support selecting a payment method when an advance payment is provided.
- `manage-order-tasks`: MUST correctly associate created tasks with the active branch ID.
- `manage-order-notes`: MUST correctly associate created notes with the current user's author ID.

## Approach

1. **Validation & UI**: In `apps/web/src/lib/validations/work-orders.ts`, add `payment_method` defaulting to `"cash"`. In `WorkOrderForm.tsx`, add a native select or Radix UI select next to the advance payment field.
2. **Service update (Creation)**: In `apps/web/src/lib/services/work-orders.ts`, map `data.payment_method` to the `cash_movements` insert payload.
3. **Data Fetching (Details)**: In `getWorkOrderDetails` (`apps/web/src/lib/services/work-order-details.ts`), include `branch_id` in the select query and update `WorkOrderComposite`.
4. **Service update (Details)**: Change `addTask` signature to `addTask(supabase, id, title, branchId)` and `addOrderNote` to `addOrderNote(supabase, id, content, authorId)`.
5. **Component Wiring**: In `WorkOrderDetailsPage.tsx` and `OverviewTab.tsx`, pull `user.id` from `useSupabase()` context and `branch_id` from the loaded order, passing them to the handlers.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/web/src/lib/validations/work-orders.ts` | Modified | Add `payment_method` to schema |
| `apps/web/src/components/work-orders/WorkOrderForm.tsx` | Modified | Add UI select for payment method |
| `apps/web/src/lib/services/work-orders.ts` | Modified | Use `payment_method` in `cash_movements` insert |
| `apps/web/src/lib/services/work-order-details.ts` | Modified | Update signatures and fetching to include `branch_id` and `author_id` |
| `apps/web/src/pages/WorkOrderDetailsPage.tsx` | Modified | Pass `author_id` and `branch_id` |
| `apps/web/src/components/orders/details/tabs/OverviewTab.tsx` | Modified | Adjust handler signatures |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Details view queries fail if `branch_id` is missing on older records | Low | Ensure the DB constraint `NOT NULL` on `work_orders.branch_id` guarantees the field exists. |
| UI breakage in `WorkOrderForm` | Low | Use standard `FormField` components following existing layout. |

## Rollback Plan

Revert the UI component changes, remove `payment_method` from schema, and restore the service signatures to their previous state in `work-orders.ts` and `work-order-details.ts`.

## Dependencies

- None

## Success Criteria

- [ ] Users can select Cash, QR, Transfer, or Card for advance payments during order creation.
- [ ] Advance payments show up in `cash_movements` with the correct method.
- [ ] Users can successfully add notes to an existing work order.
- [ ] Users can successfully add tasks to an existing work order.
