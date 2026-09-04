# Design — purchases-workflow-management

## Context

See [proposal.md](./proposal.md) for the full problem statement. In short, the Inventory & Purchases module is currently a static mock with hardcoded zeros and no database connection. Spare parts requested inside work orders are invisible to a central procurement view, and the DB trigger `fn_sync_received_purchase_to_stock` auto-creates `cash_movements` on receive — bypassing the user's choice of payment method. This design addresses all three gaps.

## Goals / Non-Goals

### Goals

1. **Unified Purchases Board** — Replace the mock `InventoryPage` with a live procurement board that merges rows from `purchases` (general stock orders) and `work_order_items` (parts requested inside work orders, status = `pending`).
2. **Expense Modal with Manual Payment** — A shared modal component that collects amount, payment method, and optional note before recording a `cash_movement`, giving the user full control.
3. **DB Trigger Fix** — Remove the automatic `cash_movement` INSERT from `fn_sync_received_purchase_to_stock` so the frontend is the single source of expense creation.
4. **KPI Cards** — Drive the three existing KPI cards ("Artículos Totales", "Compras Activas", "Bajo Stock") from live Supabase queries.

### Non-Goals

- **Changing work order status on part fulfillment** — When a spare part is marked as purchased from the board, only the `work_order_item.status` and a note are updated. The parent `work_order.status` is NOT altered.
- **Full inventory management** — Stock catalog CRUD, reorder points, and supplier management are deferred to a future change.
- **New DB tables or columns** — All required columns already exist in `purchases`, `work_order_items`, and `cash_movements`.

## Decisions

### Decision 1: DB Migration — Strip automatic cash_movement from trigger

**Choice:** Modify `fn_sync_received_purchase_to_stock` to remove lines 572-598 (the `cash_movement` INSERT block). Keep the inventory stock increment (lines 559-570) intact.

**Rationale:** The trigger currently creates an uncontrolled expense with no payment method selection. By removing it, we consolidate all expense creation in the frontend service layer where the user can choose the payment method. The stock increment remains server-side because it must be atomic with the status change.

**Alternatives Considered:**
- *Add a `skip_cash_movement` flag column* — Rejected; adds schema complexity for a one-time behavioral change.
- *Move everything to an RPC* — Over-engineered; the trigger's stock logic is clean and the frontend already handles cash movements for work-order items.

**Migration SQL:**
```sql
CREATE OR REPLACE FUNCTION public.fn_sync_received_purchase_to_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'received' THEN
        IF NEW.inventory_item_id IS NOT NULL THEN
            UPDATE public.inventory_items
            SET
                quantity = quantity + COALESCE(NEW.quantity, 0),
                cost_price = CASE WHEN NEW.actual_cost > 0 AND NEW.quantity > 0
                                  THEN (NEW.actual_cost / NEW.quantity)
                                  ELSE cost_price
                             END,
                updated_at = NOW()
            WHERE id = NEW.inventory_item_id;
        END IF;
        -- cash_movement creation is now handled by the frontend service
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

### Decision 2: Service Layer — New `purchases.ts` module

**Choice:** Create `apps/web/src/lib/services/purchases.ts` with three main functions:

| Function | Description |
|---|---|
| `fetchUnifiedPurchases(supabase, branchId)` | Queries `purchases` (status NOT IN `received`, `cancelled`) UNION with `work_order_items` (status = `pending`), returning a normalized `UnifiedPurchaseItem[]` type. |
| `fulfillGeneralPurchase(supabase, branchId, purchaseId, amount, method, note?)` | Updates `purchases.status` → `received`, sets `actual_cost`, and inserts a `cash_movement` with the user-selected `payment_method`. |
| `fulfillWorkOrderPart(supabase, branchId, itemId, orderId, quantity, amount, method, note?, authorId?)` | Delegates to the existing `markItemAsPurchased` from `work-order-details.ts` for consistency. |

**Rationale:** A dedicated service file keeps procurement logic isolated. Reusing `markItemAsPurchased` for work-order items avoids duplicating the status update + cash_movement + note injection logic that already works correctly.

**Type:**
```typescript
export interface UnifiedPurchaseItem {
  id: string;
  source: 'purchase' | 'work_order_item';
  title: string;
  quantity: number;
  estimatedCost: number;
  status: string;
  supplier?: string;
  // Only for work_order_item source
  workOrderId?: string;
  workOrderCode?: string;
  // Only for purchase source
  purchaseId?: string;
  inventoryItemId?: string;
  branchId: string;
  createdAt: string;
}
```

**Alternatives Considered:**
- *Single polymorphic RPC on Supabase* — Would be faster but harder to debug and test; the two queries are simple selects.
- *Duplicate `markItemAsPurchased` logic inline* — Rejected to honor DRY; a direct import is cleaner.

### Decision 3: Component Architecture — PurchaseExpenseModal + Refactored InventoryPage

**Choice:**

1. **`PurchaseExpenseModal.tsx`** — A new shared modal component extracted from the existing pattern in `PurchasesTab.tsx` (lines 183-228). Accepts a `UnifiedPurchaseItem` and emits `onConfirm(amount, method, note)`. This modal is used by both the Purchases Board and can later be reused in the PurchasesTab.

2. **`InventoryPage.tsx` refactor** — Replace the entire static mock with:
   - KPI cards driven by live counts (total inventory items, active purchases, low-stock alerts).
   - A status-tab bar: **Pending** | **Ordered** | **Received** (filters the unified list).
   - A table of `UnifiedPurchaseItem[]` with a "Source" column badge distinguishing `purchase` vs `work_order_item`.
   - Each pending/ordered row has a "Mark Received/Purchased" action button that opens `PurchaseExpenseModal`.

**Rationale:** Extracting the modal promotes reuse across contexts (Board vs. WorkOrder detail). Keeping the InventoryPage as the single entry point for the Board avoids adding new routes. The existing KPI card markup and design system classes are preserved — only the data binding changes.

**Alternatives Considered:**
- *Separate `/purchases` route* — Rejected; the InventoryPage already owns this domain and has the UI shell.
- *Inline the modal in InventoryPage* — Rejected; the PurchasesTab also needs the same modal pattern.

### Decision 4: KPI Cards — Live Supabase Counts

**Choice:** Add a `fetchPurchaseKPIs(supabase, branchId)` function to `purchases.ts` that returns:

```typescript
export interface PurchaseKPIs {
  totalInventoryItems: number;   // COUNT from inventory_items
  activePurchases: number;       // COUNT from purchases WHERE status IN ('pending','ordered')
                                 // + COUNT from work_order_items WHERE status = 'pending'
  lowStockAlerts: number;        // COUNT from inventory_items WHERE quantity <= min_quantity
}
```

**Rationale:** The three existing KPI cards already have the visual design; they just display `0`. Binding them to real counts is a minimal-effort, high-impact improvement.

### Decision 5: No DB Schema Changes Needed

**Choice:** All required columns already exist:
- `purchases.status` uses enum `purchase_status` (`pending`, `ordered`, `received`, `cancelled`) — sufficient for the workflow.
- `purchases.actual_cost` stores the real amount paid.
- `cash_movements.payment_method` uses enum `payment_method` — already supports `cash`, `card`, `transfer`, `qr`.
- `cash_movements.purchase_id` links expenses back to purchases.
- `work_order_items.status` is a `VARCHAR(50)` that already holds `pending` / `purchased`.

No new tables, columns, or enums are required.

## File Changes

| File | Action | Description |
|---|---|---|
| `supabase_schema.sql` | **Modify** | Update `fn_sync_received_purchase_to_stock` to remove the `cash_movement` INSERT block (lines 572-598). Keep inventory stock increment logic. |
| `supabase/migrations/YYYYMMDD_strip_auto_cash_movement.sql` | **Create** | Migration file with the `CREATE OR REPLACE FUNCTION` statement for the trigger fix. |
| `apps/web/src/lib/services/purchases.ts` | **Create** | New service module with `fetchUnifiedPurchases`, `fulfillGeneralPurchase`, `fulfillWorkOrderPart`, and `fetchPurchaseKPIs`. |
| `apps/web/src/components/purchases/PurchaseExpenseModal.tsx` | **Create** | Shared modal for capturing payment details when fulfilling any purchase (extracted from PurchasesTab pattern). |
| `apps/web/src/pages/InventoryPage.tsx` | **Modify** | Replace static mock with live Purchases Board: KPI cards bound to `fetchPurchaseKPIs`, status-tab filtering, unified purchase table, and modal integration. |
| `apps/web/src/components/orders/details/tabs/PurchasesTab.tsx` | **Modify** | Replace inline purchase modal with the shared `PurchaseExpenseModal` component to eliminate duplication. |

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|---|---|---|
| **Removing trigger cash_movement breaks existing "mark received" flows outside the app** | Medium — Any direct SQL or other client updating `purchases.status` to `received` will no longer auto-log an expense. | Acceptable: the only consumer is this frontend app. Document the change in migration notes. |
| **Two-query union in `fetchUnifiedPurchases` may have slight latency** | Low — Both tables are small (< 1K rows per branch typically). | Use `Promise.all` to parallelize. Add branch_id filter and indexes already exist. |
| **`markItemAsPurchased` does not validate open cash register** | Low — The trigger did check for an open register; the existing `markItemAsPurchased` does not. | Acceptable per current design: work-order expenses are logged without requiring an open register. General purchase fulfillment via `fulfillGeneralPurchase` will also follow this pattern for consistency. |
| **PurchasesTab modal extraction is a refactor** | Low — Functional behavior is identical; only the component boundary moves. | Test both the Board and the WorkOrderDetails PurchasesTab after extraction. |
| **`work_order_items.status` is VARCHAR, not an enum** | Low — No DB constraint prevents invalid values. | Service functions hardcode valid transitions (`pending` → `purchased`). A future migration can add a CHECK constraint. |
