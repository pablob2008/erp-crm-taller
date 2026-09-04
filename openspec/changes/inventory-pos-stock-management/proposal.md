# Proposal: inventory-pos-stock-management

## 1. Problem Statement
The current inventory module lacks a high-speed, barcode-optimized interface for quick stock management. Technicians and counter staff need a POS-style panel to quickly scan or search for items and adjust quantities on the fly, without navigating complex forms.

## 2. Proposed Solution
Implement a POS-style fast stock management interface inside the Inventory Module, prioritizing barcode/QR scanning and quick +/- quantity adjustments.

**What Changes:**
- **UI / Pages**: Modify `apps/web/src/pages/InventoryPage.tsx` to implement top-level tabs. Tab 1: `🛒 Lista de Compras` (the existing unified board). Tab 2: `📦 Stock` (the new POS-style panel).
- **Service Layer**: Create `apps/web/src/lib/services/inventory.ts` with full CRUD for the `inventory_items` table.
- **Components**: 
  - `apps/web/src/components/inventory/StockPOSPanel.tsx`: The barcode-optimized search and quick-adjust list.
  - `apps/web/src/components/inventory/InventoryItemModal.tsx`: A reusable modal for full creation/edition of parts.

## 3. Capabilities
- **New Capabilities**:
  - `inventory-pos-stock-management`
- **Modified Capabilities**:
  - None
