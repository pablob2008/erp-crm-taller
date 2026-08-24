# Design: Order Detail Workflow and Lifecycle Management

## Context

See [proposal.md](./proposal.md) for full intent and scope.

This change transforms the work order details view into a 360-degree operational dashboard by adding lifecycle header actions (edit, delete, WhatsApp, print), enriching the overview with full customer/device/diagnostic data, and introducing financial settlement workflows (ad-hoc expenses and dual-path delivery). The two capability specs driving this are [work-order-lifecycle](./specs/work-order-lifecycle/spec.md) and [work-order-entry](./specs/work-order-entry/spec.md).

## Goals / Non-Goals

### Goals

- Enable full CRUD lifecycle management of work orders from the details view (edit metadata, delete order).
- Surface all customer contact fields (phone, email, tax_id) and device intake fields (color, aesthetic_condition, accessories, suggested_solution, estimated_delivery_at) in the composite query and UI.
- Provide one-click WhatsApp communication (direct chat and formatted summary share) via `wa.me` URL scheme.
- Allow ad-hoc expense registration linked to a work order in `cash_movements`.
- Implement a dual-path delivery settlement modal: deliver on credit (automatic note) or collect payment and deliver (income movement + note + status transition).
- Trigger browser print dialog as a placeholder for receipt printing.

### Non-Goals

- No thermal printer driver integration (browser `window.print()` only).
- No SMS/email gateway automation.
- No database schema migrations — all required columns already exist.
- No multi-step approval workflow for deletion (simple confirmation dialog suffices).
- No real-time WebSocket push for financial updates (optimistic refresh via re-fetch).

## Decisions

### Decision 1: Extend `WorkOrderComposite` type to include customer contact and full device fields

**Choice**: Widen the `customers` nested type from `{ first_name, last_name }` to `{ first_name, last_name, phone, email, tax_id }` and add top-level fields `device_color`, `aesthetic_condition`, `accessories`, `suggested_solution`, `estimated_delivery_at`, `created_at` to the `WorkOrderComposite` interface. Extend the Supabase `.select()` query accordingly.

**Rationale**: All columns already exist in the `customers` table (lines 95–106 of schema) and `work_orders` table (lines 125–160). No schema migration is needed. Widening the select is the minimal change to surface this data.

**Alternatives considered**:
- *Separate API call for customer details*: Rejected — adds an extra round-trip and complicates state management for data that is naturally joined via the FK.
- *Create a new composite view/RPC*: Over-engineered for adding ~8 fields to an existing query.

### Decision 2: WhatsApp integration via `wa.me` URL scheme

**Choice**: Implement a pure-client utility function `buildWhatsAppUrl(phone, text?)` that strips non-digit characters from the phone string and constructs `https://wa.me/{digits}?text={encodeURIComponent(text)}`. Open in a new tab via `window.open()`.

**Rationale**: The `wa.me` scheme is the official WhatsApp Click-to-Chat API. It works on both mobile (opens WhatsApp app) and desktop (opens WhatsApp Web). No backend or API key required. Phone sanitization (strip spaces, dashes, parentheses) prevents malformed URLs.

**Alternatives considered**:
- *WhatsApp Business API*: Requires business account, API keys, backend proxy — vastly over-scoped for a link-based share.
- *`whatsapp://` custom protocol*: Not universally supported across browsers and platforms.

### Decision 3: Dual-flow delivery modal architecture (single modal, two action paths)

**Choice**: Implement `DeliverOrderDialog` as a single dialog component with an internal toggle/radio between "Deliver on Credit" and "Collect & Deliver" modes. The credit path shows only a confirmation message and pending-balance summary. The collect path reveals payment method selector, amount input, and optional note field. Both paths call `deliverOrder()` in the service layer.

**Rationale**: A single modal reduces component proliferation and provides a cleaner UX — the user sees both options side-by-side and picks one. The service function handles branching logic (insert income movement vs. skip) based on the delivery mode parameter.

**Alternatives considered**:
- *Two separate modals*: More boilerplate, confusing UX with two buttons ("Deliver Credit" / "Collect & Deliver") in the header.
- *Wizard/stepper flow*: Over-complex for what is essentially a binary choice with 2–3 fields.

### Decision 4: Service layer functions for new mutations

**Choice**: Add four new exported functions to `work-order-details.ts`:

| Function | Signature | Behavior |
|----------|-----------|----------|
| `updateWorkOrder` | `(supabase, orderId, data: Partial<WorkOrderEditable>)` | Updates mutable work order columns (device_*, reported_problem, suggested_solution, estimated_cost, estimated_delivery_at). |
| `deleteWorkOrder` | `(supabase, orderId)` | Hard-deletes the work order row. Cascading FKs in schema handle child records (notes, tasks, items, movements). |
| `addRandomExpense` | `(supabase, branchId, orderId, { amount, method, description })` | Inserts an `expense` / `manual_expense` row into `cash_movements`. Does NOT call `recalculateOrderFinancials` since expenses don't affect `total_paid`/`balance` (balance = estimated_cost − total_paid). |
| `deliverOrder` | `(supabase, branchId, orderId, { mode, amount?, method?, note?, authorId })` | If mode=`credit`: updates status to `delivered`, inserts auto-note. If mode=`collect`: inserts `income`/`work_order_payment` into `cash_movements`, calls `recalculateOrderFinancials`, inserts auto-note, updates status to `delivered`. |

**Rationale**: Keeps all work-order-related data access in a single service file, consistent with existing patterns (`addOrderPayment`, `markItemAsPurchased`). The existing `recalculateOrderFinancials` private helper is reused for financial consistency.

**Alternatives considered**:
- *Supabase RPC / database function*: Would guarantee atomicity but adds migration complexity and diverges from the current client-side service pattern used everywhere else.
- *Separate service file per domain*: Premature — the file is ~224 lines, well within manageable size.

### Decision 5: No database schema changes required

**Choice**: All columns referenced by the new features (`device_color`, `aesthetic_condition`, `accessories`, `suggested_solution`, `estimated_delivery_at`, `customers.phone`, `customers.email`, `customers.tax_id`, `cash_movements.*`) already exist in the canonical schema.

**Rationale**: Verified against `supabase_schema.sql`. The `work_orders` table includes `device_color` (L135), `aesthetic_condition` (L136), `accessories` (L137), `suggested_solution` (L139), `estimated_delivery_at` (L146). The `customers` table includes `phone` (L101), `email` (L102), `tax_id` (L100). The `cash_movements` table (L244–261) supports all required fields for expense and income insertion.

### Decision 6: Edit Order Dialog field grouping

**Choice**: The `EditOrderDialog` will organize editable fields into three collapsible sections: **Device Details** (brand, model, color, aesthetic_condition, accessories), **Diagnosis & Service** (reported_problem, suggested_solution, estimated_delivery_at), and **Financial Estimate** (estimated_cost). Customer assignment is not editable post-creation.

**Rationale**: Groups related fields for scannability. Excludes customer_id and order_number from editing to prevent referential integrity issues and audit trail breaks.

### Decision 7: Print action uses `window.print()` placeholder

**Choice**: The print button calls `window.print()` directly. No custom print template in this iteration.

**Rationale**: The proposal explicitly marks thermal printer integration as out-of-scope and specifies "browser print dialog" as the target. A future iteration can add a styled `@media print` layout or a dedicated print route.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/lib/services/work-order-details.ts` | **Modify** | Extend `WorkOrderComposite` interface with customer contact fields (`phone`, `email`, `tax_id`), device fields (`device_color`, `aesthetic_condition`, `accessories`), and timing fields (`suggested_solution`, `estimated_delivery_at`, `created_at`). Widen `getWorkOrderDetails` select query. Add `updateWorkOrder()`, `deleteWorkOrder()`, `addRandomExpense()`, `deliverOrder()`. Export `WorkOrderEditable` partial type. |
| `apps/web/src/components/orders/details/OrderHeader.tsx` | **Modify** | Add action buttons: Edit (Pencil icon), Delete (Trash2 icon), WhatsApp Share (Share icon), WhatsApp Chat (MessageCircle icon), Print (Printer icon). Import and render `EditOrderDialog` and `DeleteOrderDialog`. Add `buildWhatsAppUrl` and `buildOrderSummaryText` utility functions. Accept new props: `onEditOrder`, `onDeleteOrder`, `customerPhone`. |
| `apps/web/src/components/orders/details/tabs/OverviewTab.tsx` | **Modify** | Replace the single "Información General" card with three structured cards: **Customer Profile** (first_name, last_name, phone with WhatsApp quick-action, email, tax_id), **Device Specifications** (brand, model, color, aesthetic_condition, accessories), **Diagnosis & Schedule** (reported_problem, suggested_solution, created_at, estimated_delivery_at). Retain existing Tasks and Notes sections unchanged. |
| `apps/web/src/components/orders/details/tabs/FinancesTab.tsx` | **Modify** | Add "Registrar Gasto" button with `AddExpenseDialog` (amount, payment_method, description fields with validation). Add "Entregar Orden" button with `DeliverOrderDialog` (dual-path: credit toggle / collect form). Accept new props: `onAddExpense`, `onDeliverOrder`, `branchId`. |
| `apps/web/src/pages/WorkOrderDetailsPage.tsx` | **Modify** | Import new service functions (`updateWorkOrder`, `deleteWorkOrder`, `addRandomExpense`, `deliverOrder`). Wire handler functions `handleEditOrder`, `handleDeleteOrder`, `handleAddExpense`, `handleDeliverOrder`. Pass new props to `OrderHeader` and `FinancesTab`. Add `useNavigate` for post-delete redirect to `/orders`. |

## Risks / Trade-offs

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Non-atomic delivery flow**: `deliverOrder` performs sequential inserts (movement → recalculate → note → status update) without a DB transaction wrapper | Medium | Financial totals could be inconsistent if a mid-sequence call fails | Each step throws on error, and the page re-fetches composite state. `recalculateOrderFinancials` is idempotent and can be re-run. Future improvement: wrap in a Supabase RPC for true atomicity. |
| **Malformed phone numbers breaking WhatsApp links** | Medium | WhatsApp opens with wrong/invalid number | Sanitize phone to digits-only (`replace(/\D/g, '')`). Show disabled WhatsApp buttons when phone is null/empty. |
| **Accidental order deletion** | Low | Permanent data loss (hard delete cascades to notes, tasks, items) | Destructive confirmation dialog with order number echo. Consider soft-delete (status=`cancelled`) as a future improvement. |
| **Balance column is `GENERATED ALWAYS AS (estimated_cost - total_paid) STORED`** | N/A | The `balance` column cannot be directly updated via `UPDATE` — it auto-computes from `estimated_cost` and `total_paid` | `recalculateOrderFinancials` correctly updates only `total_paid`; `balance` recalculates automatically. No direct balance writes needed. |
| **`addRandomExpense` does not affect order balance** | Low | Users may expect expenses to reduce balance, but balance = estimated_cost − total_paid (income only) | This is by-design: expenses represent shop costs (parts, consumables), not customer payments. The "Net Profit" metric in FinancesTab already accounts for expenses separately. |
| **No optimistic UI updates** | Low | Brief loading flicker on each mutation due to full `fetchOrder()` re-fetch | Acceptable for a back-office tool. Optimistic updates can be added later if UX feedback warrants it. |
