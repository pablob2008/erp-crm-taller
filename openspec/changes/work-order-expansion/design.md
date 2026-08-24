# Design: Work Order Expansion

## Technical Approach
Extend the existing work-order creation flow across three layers — validation schema, UI form, and service function — to capture financial/scheduling data (`estimated_cost`, `estimated_delivery_at`, `status`, `advance_payment`) and optionally create a linked `cash_movements` record for advance payments. All changes follow existing patterns (Zod + react-hook-form + Supabase client).

## Architecture Decisions

### Decision: Native `<select>` styled with neumorphic classes for status field
**Choice**: Use a plain `<select>` element with `shadow-neu-inset` classes matching the existing `Input` component style.
**Alternatives considered**: Install shadcn/ui Select (Radix-based).
**Rationale**: The project has no Select UI component yet. A native `<select>` avoids a new dependency and keeps the change minimal. The element only needs two options (`received`, `quotation`).

### Decision: Sequential inserts (no RPC) for order + payment
**Choice**: Two sequential Supabase `.insert()` calls in `createWorkOrder`.
**Alternatives considered**: Postgres RPC wrapping both in a transaction.
**Rationale**: Explicitly out-of-scope per proposal. The service returns a structured result indicating partial failure so the UI can warn the user to record the payment manually.

### Decision: Return a result object instead of throwing on partial failure
**Choice**: `createWorkOrder` returns `{ workOrder, paymentError? }`.
**Alternatives considered**: Throw on any failure.
**Rationale**: The work order itself is already persisted; throwing would lose the reference. The UI needs to differentiate "total failure" from "order created but payment failed".

## Data Flow

```
WorkOrderForm.tsx
  │
  ├─ Zod validates (workOrderSchema)
  │
  └─ onSubmit()
       │
       ├─ fetch profile.branch_id (existing)
       │
       └─ createWorkOrder(supabase, branchId, userId, values)
            │
            ├─ INSERT work_orders ──► returns workOrder.id
            │
            └─ IF advance_payment > 0
                 │
                 └─ INSERT cash_movements
                      branch_id, work_order_id, type='income',
                      category='work_order_payment',
                      payment_method='cash',
                      gross_amount=advance_payment,
                      net_amount=advance_payment,
                      discount_type='none', discount_value=0,
                      created_by=userId
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/lib/validations/work-orders.ts` | Modify | Add `estimated_cost`, `estimated_delivery_at`, `status`, `advance_payment` to `workOrderSchema`. All optional with `advance_payment` constrained `>= 0`. `status` defaults to `"received"`. |
| `apps/web/src/lib/services/work-orders.ts` | Modify | Accept `userId` param. Map new fields into the `work_orders` insert (including `total_paid = advance_payment`). Add conditional `cash_movements` insert. Return `{ workOrder, paymentError? }`. |
| `apps/web/src/components/work-orders/WorkOrderForm.tsx` | Modify | Add section "4. Presupuesto y Tiempos" with four fields. Pass `user.id` to `createWorkOrder`. Handle `paymentError` in the result with a warning toast. Add `defaultValues` for new fields. |

## Interfaces / Contracts

```ts
// lib/validations/work-orders.ts — additions to workOrderSchema
estimated_cost:        z.coerce.number().min(0).optional(),
estimated_delivery_at: z.string().optional(),          // HTML date input → ISO string
status:               z.enum(["received", "quotation"]).default("received"),
advance_payment:      z.coerce.number().min(0, "No puede ser negativo").optional(),
```

```ts
// lib/services/work-orders.ts — new return type
export interface CreateWorkOrderResult {
  workOrder: WorkOrder;
  paymentError?: string;   // present only when cash_movements insert failed
}

// Updated signature
export async function createWorkOrder(
  supabase: SupabaseClient,
  branchId: string,
  userId: string,
  data: WorkOrderFormValues
): Promise<CreateWorkOrderResult>;
```

```ts
// cash_movements insert payload (built inside createWorkOrder)
{
  branch_id:      branchId,
  work_order_id:  workOrder.id,
  type:           'income',
  category:       'work_order_payment',
  payment_method: 'cash',
  gross_amount:   data.advance_payment,
  net_amount:     data.advance_payment,
  discount_type:  'none',
  discount_value: 0,
  description:    `Seña orden ${workOrder.order_number}`,
  created_by:     userId,
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `workOrderSchema` validates/rejects new fields correctly | Zod `.parse()` / `.safeParse()` calls with valid and edge-case payloads (negative advance_payment, missing optionals) |
| Integration | `createWorkOrder` inserts order + payment | Manual test against Supabase dev instance; verify `work_orders` row has `total_paid` set and `cash_movements` row exists |
| UI | Section 4 renders, fields submit, warning toast on partial failure | Manual walkthrough in browser |

## Threat Matrix
N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout
No migration required. All new DB columns (`estimated_cost`, `estimated_delivery_at`, `status`, `total_paid`) already exist in the schema with defaults. The change only starts populating them.

## Open Questions
- [ ] None — all decisions are resolved.
