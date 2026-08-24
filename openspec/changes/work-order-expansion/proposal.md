## Intent
Expand the New Work Order form to capture financial and scheduling data to fully utilize the database schema capabilities.

## Scope

### In Scope
- Add `estimated_cost`, `estimated_delivery_at`, `status`, and `advance_payment` fields to the work order form.
- Update `lib/services/work-orders.ts` to insert these fields when creating a work order.
- Create a corresponding `cash_movements` record if an advance payment is provided.

### Out of Scope
- Backend complex transaction (RPC) for the two-step insertion; will rely on frontend sequential API calls for now.
- Modifying the edit or view flows of existing work orders.

## Capabilities

### New Capabilities
- `work-order-advance-payment`: The ability to record an initial payment at the same time a work order is created.

### Modified Capabilities
- `work-order-creation`: The work order form and underlying service will now capture and persist `estimated_cost`, `estimated_delivery_at`, `status`, and `advance_payment`.

## Approach
Add a new UI section "4. Presupuesto y Tiempos" to `WorkOrderForm.tsx` featuring inputs for the new fields using existing neumorphic styling conventions (`shadow-neu-inset`). Update the `createWorkOrder` service function to include these new parameters when inserting into the `work_orders` table. Implement a two-step insertion process: create the order first, and if `advance_payment > 0`, make a secondary call to insert a related `cash_movements` record (type: `income`, category: `work_order_payment`) and set `total_paid` in the order.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/web/src/components/work-orders/WorkOrderForm.tsx` | Modified | Added "Presupuesto y Tiempos" section with new fields. |
| `apps/web/src/lib/services/work-orders.ts` | Modified | Updated insertion logic and added cash movement creation. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Data inconsistency between order and payment | Med | The frontend two-step process could fail on the second call. Implement robust error handling and notify the user if the payment step fails so they can record it manually. |

## Rollback Plan
Revert changes to `WorkOrderForm.tsx` and `work-orders.ts` to restore the original work order creation flow.

## Dependencies
- Existing `work_orders` and `cash_movements` table schemas in Supabase.

## Success Criteria
- [ ] Users can enter estimated cost, delivery date, status, and an advance payment in the form.
- [ ] Work orders are successfully created with the new data populated in the database.
- [ ] Advance payments correctly trigger the creation of a `cash_movements` record linked to the new work order.
