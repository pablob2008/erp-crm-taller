# Proposal: purchases-workflow-management

## 1. Problem Statement
The "Inventory & Purchases" module currently lacks a connection to the database and a centralized purchase list. Spare parts requested within work orders are not visible in a central procurement board, leading to disjointed workflows. Additionally, when marking general purchase items as received, the automated database trigger `fn_sync_received_purchase_to_stock` automatically creates a `cash_movement`. This conflicts with the user's need to manually select a payment method and accurately manage expenses. Finally, when purchasing spare parts for work orders, the system needs to update the order's internal list and leave a note without altering the overall work order status.

## 2. Goal
Create a centralized Purchases Board that unifies general purchase orders and specific work-order spare part requests, providing full control over expense recording and financial settlements.

## 3. Proposed Changes

- **Database Adjustments**:
  - Alter the `fn_sync_received_purchase_to_stock` trigger to remove the automatic `cash_movement` insertion. The trigger will continue handling inventory stock increments, but the frontend service will take over the expense creation to allow for manual payment method selection.

- **Service Layer Enhancements**:
  - Develop/Enhance `purchases.ts` to fetch and format a unified list of pending purchases. This will combine data from the `purchases` table (general stock/supplies) and `work_order_items` where `status = 'pending'` (parts requested by technicians).

- **UI Modifications**:
  - **Purchases Board**: In `InventoryPage.tsx` (or its specific purchases view), replace the static mock UI with the live, unified Purchases Board using the new service queries.
  - **Expense Modal**: Implement a unified modal that opens when marking ANY item as purchased.
    - For a `work_order_item`: Updates the item status, logs the `cash_movement` with the chosen payment method, and adds an internal order note (reusing existing `markItemAsPurchased` logic) WITHOUT changing the overall work order status.
    - For a standard `purchase`: Updates the purchase status to `received` and logs the `cash_movement` with the chosen payment method.

## 4. Capabilities

- **New Capabilities**:
  - `purchases-workflow-management`: Defines the unified purchases board, the centralized expense management modal for procurement, and handles safe DB trigger adjustments for cash movements.

- **Modified Capabilities**:
  - `work-order-lifecycle`: Modified to support internal updates of spare parts and note syncing during the procurement process.
