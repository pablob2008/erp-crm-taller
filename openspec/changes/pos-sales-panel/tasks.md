# Tasks: POS Sales Panel

## 1. Database Migration
- [x] 1.1 Create `sale_status` ENUM ('completed', 'voided').
- [x] 1.2 Create `sales` table with foreign keys (branch, cash_register, cash_movement, work_order, customer) and ARCA fiscal readiness fields (`customer_doc_type`, `customer_doc_number`, `invoice_type`, `invoice_number`, `cae`, `cae_expires_at`, `afip_qr_data`).
- [x] 1.3 Create `sale_items` table with `GENERATED ALWAYS AS (quantity * unit_price)` for `total_price` and `tax_rate` column.
- [x] 1.4 Create `fn_deduct_stock_on_sale_item` function and `trg_deduct_stock_on_sale_item` trigger to deduct/restore stock based on `sale_items` mutations.
- [x] 1.5 Add RLS policies and performance indexes for `sales` and `sale_items` tables.

## 2. Service Layer (`pos.ts`)
- [x] 2.1 Create `apps/web/src/lib/services/pos.ts` and define TypeScript types (`Sale`, `SaleItem`, `TicketItem`, `CheckoutPayload`, `CheckoutResult`, `TicketState`).
- [x] 2.2 Implement `fetchInventoryCatalog(supabase, branchId, search?)` with pagination.
- [x] 2.3 Implement `searchOrderByNumber(supabase, branchId, orderNumber)` for the order lookup fast action.
- [x] 2.4 Implement `checkoutSale(supabase, payload)` as a multi-step operation (insert sales, sale_items, cash_movements, and update sales with cash_movement_id; also handle mapping customer doc info if work_order_id is present).
- [x] 2.5 Implement `addQuickExpense(supabase, branchId, amount, method, description)` to create direct expense cash movements.

## 3. POS UI Orchestrator & Panels
- [x] 3.1 Create `apps/web/src/pages/POSPage.tsx` using `useReducer` to manage `TicketState` (items, paymentMethod, workOrderId) and side-by-side layouts.
- [x] 3.2 Create `apps/web/src/components/pos/CatalogPanel.tsx` with search bar (scanner-ready), inventory item grid, "Manual Sale" button, and fast action buttons.
- [x] 3.3 Create `apps/web/src/components/pos/TicketPanel.tsx` to display the active ticket, subtotal, payment selector, and checkout button.
- [x] 3.4 Create `apps/web/src/components/pos/TicketItemRow.tsx` for rendering individual ticket items with quantity (+/-) controls and a remove button.
- [x] 3.5 Create `apps/web/src/components/pos/PaymentMethodSelector.tsx` for switching between Cash, QR, and Card.
- [x] 3.6 Create `apps/web/src/components/pos/DeliverOrderModal.tsx` to search for orders by number and add pending balances to the ticket.
- [x] 3.7 Create `apps/web/src/components/pos/ExpenseModal.tsx` for the "Registrar Gasto" fast action, calling `addQuickExpense`.
- [x] 3.8 Create `apps/web/src/components/pos/ManualSaleModal.tsx` for adding ad-hoc line items not present in the inventory.
- [x] 3.9 Update `apps/web/src/App.tsx` to register the new `<Route path="/pos" element={<POSPage />} />`.
- [x] 3.10 Update `apps/web/src/components/DashboardLayout.tsx` to add a "Ventas" navigation link (using `ShoppingCart` icon) between "Inventario" and "Caja y Finanzas".
