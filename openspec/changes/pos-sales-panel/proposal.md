# Proposal: POS Sales Panel

## Intent
Create a Point of Sale (POS) / Sales Panel style interface to streamline the checkout process, featuring a split-screen design for catalog and ticket management, along with fast actions for delivering orders and registering expenses.

## Scope

### In Scope
- Split-Screen UI:
  - Left side: Catalog with large search bar (barcode scanner ready), grid of inventory items, and "Manual Sale" button.
  - Right side: Ticket (shopping cart) with scanned items, quantities (+/-), subtotal, payment method selector (Cash, QR, Card), and large checkout button.
- Fast Actions:
  - "Entregar Orden" (Deliver Order): Search by order number, pull pending balance, and add to ticket.
  - "Registrar Gasto" (Add Expense): Quick modal to take money out of the register.
- Database Schema: Create `sales` and `sale_items` tables to store line-items, automatically linking to `cash_movements` on checkout.

### Out of Scope
- Advanced inventory management features outside of the POS panel.
- Multi-register or complex till management beyond simple cash movements.

## Capabilities

### New Capabilities
- `pos-sales`: Manage sales through a dedicated Point of Sale interface, including catalog browsing, cart management, and fast actions (deliver order, add expense).

### Modified Capabilities
- `cash-movements`: Extend to automatically link to `sales` upon checkout and support quick expense registration.

## Approach
1. **Database Schema**: 
   - Define `sales` table (id, total, status, created_at, linked_cash_movement_id).
   - Define `sale_items` table (id, sale_id, item_name, quantity, price, subtotal).
2. **UI Implementation**: 
   - Build a new route/page for the POS Panel.
   - Implement split-screen layout with left catalog and right ticket components.
3. **Integration**: 
   - Connect barcode search to inventory items.
   - Implement checkout flow to create records in `sales`, `sale_items`, and `cash_movements`.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| Database Schema | New | `sales` and `sale_items` tables. |
| `POSPage.tsx` | New | Main Point of Sale interface component. |
| Routes | Modified | Add `/pos` route to the application. |
| `cash_movements.ts` | Modified | Link with sales on checkout. |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Database sync failure | Medium | Use database transactions or edge functions to ensure atomic creation of sales and cash movements. |

## Rollback Plan
- Revert route additions and remove POS UI components.
- Keep `sales` and `sale_items` tables in database but unused.

## Success Criteria
- [ ] Split-screen POS interface is accessible.
- [ ] Users can search catalog, add items to ticket, and adjust quantities.
- [ ] Checkout successfully creates records in `sales` and `cash_movements`.
- [ ] Fast actions for order delivery and expenses work correctly.
