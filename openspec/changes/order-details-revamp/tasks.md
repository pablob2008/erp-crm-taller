# Tasks: Order Details Revamp

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 350-450 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Backend/DB) → PR 2 (Frontend) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | DB Schema & Service updates | PR 1 | `npm run lint` | N/A | Revert DB migration & service file |
| 2 | UI Components & Integration | PR 2 | `npm run lint` | Run app, test UI tabs | Revert React components |

## Phase 1: Database & Foundation

- [x] 1.1 Create migration to add `status` column to `work_order_items` table (default 'pending').
- [x] 1.2 Update Supabase types/interfaces for `work_order_items` to include `status`.
- [x] 1.3 In `apps/web/src/lib/services/work-order-details.ts`, add `updateTask` and `deleteTask`.
- [x] 1.4 In `work-order-details.ts`, add `updateNote` and `deleteNote`.
- [x] 1.5 In `work-order-details.ts`, add `updateItem` and `deleteItem`.
- [x] 1.6 In `work-order-details.ts`, add `updatePayment` and `deletePayment`. Ensure `total_paid` and `balance` in `work_orders` are recalculated and updated.
- [x] 1.7 In `work-order-details.ts`, add a function to mark an item as purchased, which logs a `cash_movements` expense and optionally adds a `work_order_notes`.

## Phase 2: UI Foundation & Overview

- [x] 2.1 In `apps/web/src/pages/WorkOrderDetailsPage.tsx`, rename the "Repuestos" tab to "Lista de Compras" and pass `PurchasesTab`.
- [x] 2.2 In `apps/web/src/components/orders/details/tabs/OverviewTab.tsx`, display customer first and last name from composite.
- [x] 2.3 In `OverviewTab.tsx`, display device brand and model.

## Phase 3: CRUD UI Integration

- [x] 3.1 In `OverviewTab.tsx`, add edit/delete icons for tasks and wire them to service functions.
- [x] 3.2 In `OverviewTab.tsx`, add edit/delete icons for notes and wire them.
- [x] 3.3 In `apps/web/src/components/orders/details/tabs/FinancesTab.tsx`, add edit/delete icons for payments and wire them.

## Phase 4: Purchases Tab

- [x] 4.1 Rename `apps/web/src/components/orders/details/tabs/PartsTab.tsx` to `PurchasesTab.tsx` and update imports in `WorkOrderDetailsPage.tsx`.
- [x] 4.2 In `PurchasesTab.tsx`, build a shopping list UI to add new parts with a 'pending' status.
- [x] 4.3 In `PurchasesTab.tsx`, add a "Mark as Purchased" action for pending items.
- [x] 4.4 In `PurchasesTab.tsx`, build a modal (amount, payment method, optional note) triggered by "Mark as Purchased".
- [x] 4.5 In `PurchasesTab.tsx`, wire the modal submission to the backend function to log expense and update item status.
- [x] 4.6 In `PurchasesTab.tsx`, add edit/delete icons for purchase items.
