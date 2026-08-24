# Proposal: Order Details Revamp

## Intent

Improve the work order details view to provide a comprehensive overview of the customer and device, streamline parts purchasing as a checklist with integrated financial tracking, and enable full CRUD (edit/delete) capabilities for tasks, notes, purchases, and payments to correct mistakes easily.

## Scope

### In Scope
- Add customer and device information to `OverviewTab`.
- Rename "Repuestos" tab to "Lista de Compras".
- Implement a checklist UI for adding needed parts (Lista de Compras).
- Add a modal when marking a part as purchased/received to capture amount, payment method, and an optional note.
- Integrate the purchase modal with `cash_movements` (for expenses) and `work_order_notes` (for the note).
- Implement edit and delete functionality for tasks, notes, purchases (items), and payments in the work order details view.

### Out of Scope
- Inventory management integration (keeping parts as simple text/checklist items for this iteration).
- Modifying the payment logic for customer income (focus is on purchasing expenses).

## Capabilities

> This section is the CONTRACT between proposal and specs phases.
> The sdd-spec agent reads this to know exactly which spec files to create or update.
> Research `openspec/specs/` before filling this in.

### New Capabilities
- `order-purchases`: Manage the shopping list of parts, mark them as purchased, log expense to cash movements, and add associated notes.
- `order-crud-operations`: Edit and delete operations for tasks, notes, purchases, and payments within a work order.

### Modified Capabilities
- `work-order-details`: Enhancing the overview tab to include customer and device info, renaming tabs.

## Approach

1. **OverviewTab**: Update `OverviewTab.tsx` to display `customers` (first/last name) and `device_brand`/`device_model` from the `WorkOrderComposite`.
2. **Lista de Compras (Purchases Tab)**: 
   - Rename `PartsTab` to `PurchasesTab`.
   - Add a UI to add items to a "shopping list". We might need a new database table like `work_order_purchases` or adapt `work_order_items` to have a status (e.g., pending vs purchased). For simplicity, we will adapt `work_order_items` to include a status.
   - When marking as purchased, open a modal to record `cash_movements` (type: expense) and `work_order_notes`.
3. **CRUD Operations**: Update the UI in all tabs to include edit (pencil) and delete (trash) icons for tasks, notes, purchases, and payments. Create corresponding Supabase service functions in `work-order-details.ts` to handle `UPDATE` and `DELETE` on those tables.
4. **Backend**: Update `work-order-details.ts` to fetch and mutate the necessary fields. Ensure `total_paid` and `balance` recalculations if payments are edited or deleted.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/web/src/pages/WorkOrderDetailsPage.tsx` | Modified | Rename tab, pass new CRUD handlers. |
| `apps/web/src/components/orders/details/tabs/OverviewTab.tsx` | Modified | Add customer/device info, add edit/delete for tasks & notes. |
| `apps/web/src/components/orders/details/tabs/PartsTab.tsx` | Modified | Rename to PurchasesTab, implement shopping list and purchase modal, edit/delete for purchases. |
| `apps/web/src/components/orders/details/tabs/FinancesTab.tsx` | Modified | Add edit/delete for payments. |
| `apps/web/src/lib/services/work-order-details.ts` | Modified | Add update/delete functions for all related entities, update types. |
| `Database schema` | Modified | Add `status` to `work_order_items`. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Deleting a payment breaks totals | High | Ensure that deleting or editing a payment also recalculates and updates the `work_orders` `total_paid` and `balance`. |
| `cash_movements` for purchases are expenses | Medium | Ensure `movement_type` is explicitly set to 'expense' for purchases and 'income' for payments. |

## Rollback Plan

- Revert the UI changes in the React components to their previous state.
- Keep any new database columns (e.g., `status` on `work_order_items`) as they won't break existing code if nullable/defaulted.
- Revert `work-order-details.ts` to the previous commit.

## Success Criteria

- [ ] OverviewTab displays customer name and device details.
- [ ] Users can add parts to a shopping list in the order.
- [ ] Marking a part as purchased opens a modal that records an expense and a note.
- [ ] Users can edit and delete tasks, notes, purchases, and payments directly from the order details.
