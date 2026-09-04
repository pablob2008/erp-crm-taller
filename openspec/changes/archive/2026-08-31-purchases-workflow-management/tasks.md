# Tasks — purchases-workflow-management

## Phase 1: Database
- [x] 1.1 Create a SQL migration script `supabase/migrations/YYYYMMDD_strip_auto_cash_movement.sql` to update `fn_sync_received_purchase_to_stock`, removing the `cash_movement` insertion block.
- [x] 1.2 Update `supabase_schema.sql` with the exact same function modification for `fn_sync_received_purchase_to_stock`.

## Phase 2: Services
- [x] 2.1 Create `apps/web/src/lib/services/purchases.ts` and implement `fetchUnifiedPurchases()` to merge general purchases and pending work-order items.
- [x] 2.2 Implement `fetchPurchaseKPIs()` in `purchases.ts` to fetch totals for active purchases, low stock alerts, and total inventory items.
- [x] 2.3 Implement fulfillment actions `fulfillGeneralPurchase` (updates status and logs cash movement) and `fulfillWorkOrderPart` (wraps existing `markItemAsPurchased`) in `purchases.ts`.

## Phase 3: Shared UI Components
- [x] 3.1 Create `apps/web/src/components/purchases/PurchaseExpenseModal.tsx` as a shared component to capture amount, payment method, and optional note.
- [x] 3.2 Refactor `apps/web/src/components/orders/details/tabs/PurchasesTab.tsx` to replace its inline expense modal with the new `PurchaseExpenseModal` component.

## Phase 4: Inventory Page
- [x] 4.1 Refactor `apps/web/src/pages/InventoryPage.tsx` to replace static KPI mocks with live data from `fetchPurchaseKPIs`.
- [x] 4.2 Update `InventoryPage.tsx` to display the unified pending purchases board using `fetchUnifiedPurchases`.
- [x] 4.3 Wire up `PurchaseExpenseModal` inside `InventoryPage.tsx` to handle fulfillment actions via `fulfillGeneralPurchase` and `fulfillWorkOrderPart`.
