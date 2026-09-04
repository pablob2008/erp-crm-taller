# Tasks: inventory-pos-stock-management

## 1. Services Layer (`inventory.ts`)
- [x] 1.1 Create `apps/web/src/lib/services/inventory.ts` file.
- [x] 1.2 Implement `fetchInventoryItems` to query `inventory_items` table.
- [x] 1.3 Implement `addInventoryItem` for creating new items.
- [x] 1.4 Implement `updateInventoryItem` for modifying existing items (including quantity updates).
- [x] 1.5 Implement `deleteInventoryItem` for deleting items.

## 2. Extract PurchasesBoard (`PurchasesBoard.tsx`)
- [x] 2.1 Create `apps/web/src/components/inventory/PurchasesBoard.tsx`.
- [x] 2.2 Move existing KPI cards (e.g., items with low stock) from `InventoryPage.tsx`.
- [x] 2.3 Move existing unified purchases board component logic (tables/forms related to purchasing) from `InventoryPage.tsx` into this file.
- [x] 2.4 Ensure `PurchasesBoard.tsx` handles its own state for purchases as it did in the original page.

## 3. Create Inventory POS Components
- [x] 3.1 Create `apps/web/src/components/inventory/InventoryItemModal.tsx`.
- [x] 3.2 Implement a comprehensive form in `InventoryItemModal.tsx` for creating/editing full details (name, min stock, prices, category, etc.).
- [x] 3.3 Create `apps/web/src/components/inventory/StockPOSPanel.tsx`.
- [x] 3.4 Implement barcode-optimized search input with auto-focus in `StockPOSPanel.tsx`.
- [x] 3.5 Implement the POS-style list with large `+` and `-` buttons for quick stock adjustments in `StockPOSPanel.tsx`.
- [x] 3.6 Integrate `InventoryItemModal.tsx` within `StockPOSPanel.tsx` (for Add/Edit actions).

## 4. Refactor InventoryPage (`InventoryPage.tsx`)
- [x] 4.1 Update `apps/web/src/pages/InventoryPage.tsx` to hold tab state (e.g., active tab "purchases" or "stock").
- [x] 4.2 Implement tab navigation UI ("🛒 Lista de Compras" and "📦 Stock").
- [x] 4.3 Render `PurchasesBoard` when "purchases" tab is active.
- [x] 4.4 Render `StockPOSPanel` when "stock" tab is active.
