# Tasks: Order Enhancements

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~50-100 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Not needed |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Full implementation | PR 1 | N/A | Manual UI test | Revert single PR |

## Phase 1: Foundation / Infrastructure

- [x] 1.1 Update `apps/web/src/lib/validations/work-orders.ts`: Add `payment_method` enum (`cash`, `qr`, `transfer`, `card`) to `workOrderSchema`, default `"cash"`.

## Phase 2: Core Implementation

- [x] 2.1 Update `apps/web/src/lib/services/work-orders.ts`: In `createWorkOrder`, map `data.payment_method` to the `cash_movements` insert payload.
- [x] 2.2 Update `apps/web/src/lib/services/work-order-details.ts`: In `getWorkOrderDetails`, select `branch_id` from the database and update `WorkOrderComposite` type to include it.
- [x] 2.3 Update `apps/web/src/lib/services/work-order-details.ts`: Update `addTask` signature to `addTask(supabase, id, title, branchId)` and pass `branchId` to the insert payload.
- [x] 2.4 Update `apps/web/src/lib/services/work-order-details.ts`: Update `addOrderNote` signature to `addOrderNote(supabase, id, content, authorId)` and pass `authorId` to the insert payload.

## Phase 3: Integration / Wiring

- [x] 3.1 Update `apps/web/src/components/work-orders/WorkOrderForm.tsx`: Add a UI select field for `payment_method` alongside the `advance_payment` field.
- [x] 3.2 Update `apps/web/src/pages/WorkOrderDetailsPage.tsx`: Extract `user.id` from `useSupabase()` and `branch_id` from the loaded `order`, passing them down to the tabs.
- [x] 3.3 Update `apps/web/src/components/orders/details/tabs/OverviewTab.tsx`: Adjust `onAddTask` and `onAddNote` handlers to pass the newly required `branch_id` and `author_id`.

## Phase 4: Testing

- [x] 4.1 Verify advance payment with explicit method saves correctly to `cash_movements`.
- [x] 4.2 Verify advance payment with default method saves as "cash" to `cash_movements`.
- [x] 4.3 Verify adding a note persists the current user's ID as `author_id`.
- [x] 4.4 Verify adding a task persists the correct `branch_id`.
