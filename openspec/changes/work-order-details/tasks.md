</SDD Tasks Phase Executor>
<Tasks: Work Order Details>
## Review Workload Forecast
| Field | Value |
|-------|-------|
| Estimated changed lines | 350 |
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
| 1 | All | 1 | `npm run build` | UI | Git |

## Phase 1: Service and Routing
- [x] 1.1 Create `apps/web/src/lib/services/work-order-details.ts` implementing `getWorkOrderDetails` with the nested PostgREST composite query.
- [x] 1.2 Implement mutation functions in `work-order-details.ts` (e.g., `updateOrderStatus`, `addOrderNote`, `addTask`, `toggleTask`, `addOrderItem`, `addOrderPayment`).
- [x] 1.3 Modify `apps/web/src/App.tsx` to include the route `<Route path="/orders/:id" element={<WorkOrderDetailsPage />} />`.

## Phase 2: Shell and Header
- [x] 2.1 Create `apps/web/src/pages/WorkOrderDetailsPage.tsx` to handle route params, fetching the composite query, and managing loading state.
- [x] 2.2 Create `apps/web/src/components/orders/details/OrderHeader.tsx` to display device info, customer details, and an order status dropdown.
- [x] 2.3 Integrate `OrderHeader` into `WorkOrderDetailsPage` and test the mutation for updating status.

## Phase 3: Tabs Component
- [x] 3.1 Create `apps/web/src/components/orders/details/OrderTabs.tsx` as a custom neumorphic tab switcher (using standard HTML `<button>` and `shadow-neu-inset` classes).

## Phase 4: Tab Content Panels
- [x] 4.1 Create `apps/web/src/components/orders/details/tabs/OverviewTab.tsx` to render tasks and notes.
- [x] 4.2 Create `apps/web/src/components/orders/details/tabs/PartsTab.tsx` to render `work_order_items` UI.
- [x] 4.3 Create `apps/web/src/components/orders/details/tabs/FinancesTab.tsx` to render `cash_movements` (payments) UI.
- [x] 4.4 Integrate all tabs into `WorkOrderDetailsPage` switching logic. Ensure mutations trigger a re-fetch of the root composite query.
</Tasks: Work Order Details>
