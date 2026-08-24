## Review Workload Forecast
| Field | Value |
|-------|-------|
| Estimated changed lines | 120 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Not needed |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units
| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Schema & Service | 1 | `npm run build` | None | Git |
| 2 | UI Component | 1 | `npm run build` | UI | Git |

## Phase 1: Schema & Service Layer
- [x] 1.1 Update `apps/web/src/lib/validations/work-orders.ts` to add `estimated_cost`, `estimated_delivery_at`, `status`, and `advance_payment` to `workOrderSchema`.
- [x] 1.2 In `apps/web/src/lib/services/work-orders.ts`, define `CreateWorkOrderResult` interface containing `workOrder` and `paymentError?`.
- [x] 1.3 Modify `createWorkOrder` signature in `apps/web/src/lib/services/work-orders.ts` to accept `userId` and return a `Promise<CreateWorkOrderResult>`.
- [x] 1.4 Update the `work_orders` insert in `createWorkOrder` to map the new fields, including setting `total_paid` to `advance_payment` (or 0).
- [x] 1.5 Add a conditional insert in `createWorkOrder` for a `cash_movements` record when `advance_payment > 0`, and return any error as `paymentError`.

## Phase 2: UI Updates
- [x] 2.1 Update `apps/web/src/components/work-orders/WorkOrderForm.tsx` to add default values for the new fields in `useForm`.
- [x] 2.2 In `WorkOrderForm.tsx`, add a new section "4. Presupuesto y Tiempos" containing inputs for `estimated_cost`, `estimated_delivery_at`, `advance_payment`, and a native `<select>` for `status` with `shadow-neu-inset` styles.
- [x] 2.3 Modify the `onSubmit` handler in `WorkOrderForm.tsx` to pass `user.id` as the third parameter to `createWorkOrder`.
- [x] 2.4 Update the `onSubmit` handler to check the result for `paymentError` and show a warning toast if the work order was created but payment failed.

