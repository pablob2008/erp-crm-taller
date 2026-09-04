# Design: inventory-pos-stock-management

## Context
The inventory module currently lacks a high-speed, barcode-optimized interface for quick stock management. We are implementing a POS-style fast stock management interface inside the Inventory Module, prioritizing barcode/QR scanning and quick +/- quantity adjustments. The main Inventory page will be split into two tabs: the existing unified purchases board and the new POS-style stock panel.

## Decisions

### Decision: Component Architecture — Tab split in InventoryPage.tsx
- **Rationale**: To accommodate the new requirements without cluttering the existing purchasing workflow, we will modify `InventoryPage.tsx` to serve as a tab container. We'll extract the current purchases board into `PurchasesBoard.tsx` (or keep it conditionally rendered) and introduce `StockPOSPanel.tsx` for the new tab.
- **Alternatives**: Keep everything in one file, but that would make `InventoryPage.tsx` massive and hard to maintain.

### Decision: StockPOSPanel.tsx — POS-style Search and Quick Adjust
- **Rationale**: The new panel will feature a large, auto-focused search input optimized for continuous barcode scanning. The list will prominently display large "+" and "-" buttons for immediate quantity modifications, allowing counter staff to adjust stock on the fly without opening modals.
- **Alternatives**: Using a standard data grid. However, a data grid requires more clicks to edit a cell. The explicit large +/- buttons are more mobile/touch-friendly and faster for POS scenarios.

### Decision: Service Layer — `inventory.ts`
- **Rationale**: We will create `apps/web/src/lib/services/inventory.ts` with dedicated functions: `fetchInventoryItems`, `addInventoryItem`, `updateInventoryItem`, and `deleteInventoryItem`.
- **Alternatives**: Put these directly in the component, but extracting them adheres to the existing service layer pattern (e.g., `purchases.ts`, `customers.ts`).

### Decision: InventoryItemModal.tsx — Reusable CRUD Modal
- **Rationale**: A comprehensive modal is needed to create new items or edit all details (min stock, prices, category, etc.). This will be triggered from the "Add Item" button or an "Edit" action on an individual row in the POS panel.

## File Changes

| File | Action | Description |
| ---- | ------ | ----------- |
| `apps/web/src/pages/InventoryPage.tsx` | Modify | Implement top-level tabs ("🛒 Lista de Compras", "📦 Stock"). Conditionally render the respective components. |
| `apps/web/src/components/inventory/PurchasesBoard.tsx` | Create | Extract the existing KPIs and purchasing board logic from `InventoryPage.tsx` into this file. |
| `apps/web/src/components/inventory/StockPOSPanel.tsx` | Create | Implement the barcode-optimized search bar, stock list, and quick +/- buttons. |
| `apps/web/src/components/inventory/InventoryItemModal.tsx` | Create | Create a form modal to handle adding and editing full details of an `inventory_item`. |
| `apps/web/src/lib/services/inventory.ts` | Create | Implement CRUD functions for `inventory_items` interacting with Supabase. |

## Risks / Trade-offs
- **Concurrency in Quantity Adjustments**: Since we might be doing read-then-write updates for the stock quantity (`quantity = oldQuantity + 1`), simultaneous adjustments by different users could theoretically cause race conditions. If this becomes an issue, a Supabase RPC function (e.g., `increment_stock`) will be required for atomic updates.
- **Search Bar Auto-focus**: Ensuring the search bar always captures barcode scanner input requires aggressive auto-focusing, which might interfere with accessibility or normal keyboard navigation if not carefully managed.
