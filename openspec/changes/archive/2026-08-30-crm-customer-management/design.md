# Design: CRM Customer Management

## Context

See [proposal.md](proposal.md) for the problem statement and goals. This design implements the `crm-customer-management` capability defined in [spec.md](specs/crm-customer-management/spec.md): a centralized Customer Directory with search, edit, safe-delete, and customer history snapshot.

## Goals / Non-Goals

### Goals
- **G1**: Extend the existing `/customers` page to support inline editing via a modal, safe deletion with a confirmation dialog, and a customer history snapshot.
- **G2**: Expand the `customers.ts` service layer with `fetchCustomers` (paginated + search), `updateCustomer`, `deleteCustomer` (with pre-check), and `fetchCustomerHistory` functions.
- **G3**: Enforce safe-delete at the client-side before calling `.delete()`, counting associated `work_orders` and `sales` records. This provides a user-friendly guard on top of the existing DB `ON DELETE RESTRICT` / `ON DELETE SET NULL` constraints.
- **G4**: Display customer history snapshot (order count + lifetime value from `sales.total`) directly on each customer card and/or in an expanded detail popover.

### Non-Goals
- **NG1**: No DB schema changes — the `customers` table already has all required columns (`first_name`, `last_name`, `tax_id`, `phone`, `email`, `address`).
- **NG2**: No server-side pagination via RPC or database functions; client-side Supabase `.range()` is sufficient for the expected data volume (~hundreds to low-thousands of customers per branch).
- **NG3**: No customer creation from this page — customers are created via the work-order entry flow or POS. The CRM page is strictly for viewing, editing, and deleting.
- **NG4**: No role-based permission gating for this phase (all authenticated users can access the CRM).

## Decisions

### Decision 1: Page Route Already Exists — Enhance In Place

**Choice**: Enhance the existing [`CustomersPage.tsx`](../../apps/web/src/pages/CustomersPage.tsx) and its `/customers` route rather than creating a new page.

**Rationale**: The route `/customers` is already registered in [`App.tsx:L32`](../../apps/web/src/App.tsx) and the sidebar link already exists in [`DashboardLayout.tsx:L96-L100`](../../apps/web/src/components/DashboardLayout.tsx). The current page has a read-only card grid with search filtering and WhatsApp/email quick actions. We extend it with Edit and Delete action buttons per card, and aggregate history data.

**Alternatives Considered**: Creating a separate `/crm/customers` route was rejected to avoid fragmenting navigation and duplicating the existing page logic.

---

### Decision 2: Service Layer `customers.ts` — New Functions

**Choice**: Extend the existing [`customers.ts`](../../apps/web/src/lib/services/customers.ts) service with four new functions:

| Function | Signature | Description |
|---|---|---|
| `fetchCustomers` | `(supabase, branchId, opts: { search?, page?, pageSize? }) → { data: CustomerWithHistory[], count }` | Paginated fetch with `ilike` search across `first_name`, `last_name`, `phone`, `tax_id`. Uses `.range()` for pagination. Joins aggregate counts via sub-selects. |
| `updateCustomer` | `(supabase, customerId, fields: Partial<Customer>) → Customer` | Updates editable fields: `first_name`, `last_name`, `phone`, `email`, `tax_id`, `address`. |
| `canDeleteCustomer` | `(supabase, customerId) → { canDelete: boolean, workOrderCount: number, saleCount: number }` | Pre-check: counts rows in `work_orders` and `sales` referencing this `customer_id`. Returns counts so the UI can show a precise blocking message. |
| `deleteCustomer` | `(supabase, customerId) → void` | Calls `.delete()` on the customer row. Should only be called after `canDeleteCustomer` confirms zero associations. |

**Rationale**: Follows the same pattern as [`work-orders.ts`](../../apps/web/src/lib/services/work-orders.ts) — plain async functions receiving a `SupabaseClient` instance, no global state. The existing `searchCustomers` and `createCustomer` remain unchanged.

**Key Detail — `fetchCustomers` with history**: The Supabase PostgREST client supports embedded aggregates via `work_orders(count)` (already used in the current page at [`CustomersPage.tsx:L60`](../../apps/web/src/pages/CustomersPage.tsx)). For lifetime value, we issue a separate lightweight query on `sales` aggregated by `customer_id` and merge client-side, since PostgREST doesn't support `SUM` in embedded resources.

**Alternatives Considered**: Using an RPC/database view for aggregation was considered but rejected for this phase — the extra infra complexity is not warranted given the expected data volume.

---

### Decision 3: Component Architecture

**Choice**: Three components:

| Component | File | Responsibility |
|---|---|---|
| `CustomersPage` | `apps/web/src/pages/CustomersPage.tsx` (modify) | Page shell: fetch, search, paginate, render card grid. Adds Edit/Delete buttons to each card. Manages modal/dialog state. |
| `CustomerEditModal` | `apps/web/src/components/customers/CustomerEditModal.tsx` (new) | Modal form for editing customer fields. Uses controlled inputs with local state; calls `updateCustomer` on submit. |
| Inline Delete Confirmation | Embedded in `CustomersPage` | Uses a `<dialog>` or shadcn `AlertDialog` component. On trigger: calls `canDeleteCustomer`. If blocked, shows counts. If clear, confirms and calls `deleteCustomer`. |

**Rationale**: The edit modal is extracted into its own component because it has enough form state and validation logic to justify separation. The delete confirmation is simple enough to keep inline using the existing shadcn AlertDialog pattern.

**Alternatives Considered**: A full `CustomerDetailPage` with its own route (`/customers/:id`) was rejected — the spec only requires editing and deletion, not a detailed sub-page. A popover-based edit form was rejected for mobile usability reasons.

---

### Decision 4: Safe Delete Implementation

**Choice**: Two-step client-side guard:
1. When the user clicks "Delete", call `canDeleteCustomer(supabase, customerId)`.
2. If `workOrderCount > 0 || saleCount > 0`, show a blocking error message: _"This customer cannot be deleted because they have X work orders and Y sales associated."_
3. If both are zero, show a final confirmation dialog. On confirm, call `deleteCustomer`.

**Rationale**: The DB already enforces `ON DELETE RESTRICT` on `work_orders.customer_id` (see [`supabase_schema.sql:L130`](../../supabase_schema.sql)), which would throw a Postgres foreign-key error. The `sales.customer_id` uses `ON DELETE SET NULL` ([`supabase_schema.sql:L290`](../../supabase_schema.sql)), so it wouldn't block the delete but would orphan sales data. The client-side guard protects both cases proactively and provides a user-friendly message instead of a raw DB error.

**Alternatives Considered**: Relying solely on the DB constraint and catching the error was rejected because (a) it doesn't cover the `sales` SET NULL case, and (b) raw Postgres errors are not user-friendly.

---

### Decision 5: Customer History Snapshot

**Choice**: Display two metrics per customer card:
- **Order count**: from the existing `work_orders(count)` embedded select (already implemented).
- **Lifetime value (total spent)**: aggregated from `sales.total WHERE customer_id = ?`. Fetched as a batch query on page load and merged into customer records client-side.

The lifetime value is shown as a formatted currency amount on each card, next to the existing order count badge.

**Rationale**: The spec requires "total order count and total amount spent (lifetime value)." The order count is already displayed. The lifetime value requires querying the `sales` table, which uses a separate `customer_id` FK. A batch query (`SELECT customer_id, COUNT(*), SUM(total) FROM sales GROUP BY customer_id`) is more efficient than N+1 queries per card.

**Alternatives Considered**: A Postgres VIEW or materialized view was considered but adds migration overhead for a simple aggregation. Could be revisited if performance becomes an issue at scale.

---

### Decision 6: No DB Schema Changes Needed

**Choice**: No migrations required.

**Rationale**: The `customers` table ([`supabase_schema.sql:L97-L108`](../../supabase_schema.sql)) already has all necessary columns: `id`, `branch_id`, `first_name`, `last_name`, `tax_id`, `phone`, `email`, `address`, `created_at`, `updated_at`. The FK relationships to `work_orders` and `sales` already exist. No new indexes are needed — `work_orders` already has an index on `customer_id` ([`supabase_schema.sql:L803`](../../supabase_schema.sql)).

## File Changes

| File | Action | Description |
|---|---|---|
| `apps/web/src/lib/services/customers.ts` | **Modify** | Add `fetchCustomers`, `updateCustomer`, `canDeleteCustomer`, `deleteCustomer` functions. Add `CustomerWithHistory` type extending `Customer` with `orderCount` and `lifetimeValue`. |
| `apps/web/src/pages/CustomersPage.tsx` | **Modify** | Refactor to use `fetchCustomers` service with server-side search and `.range()` pagination. Add Edit/Delete action buttons to each customer card. Add pagination controls. Integrate `CustomerEditModal` and inline delete confirmation dialog. Merge lifetime-value data into card display. |
| `apps/web/src/components/customers/CustomerEditModal.tsx` | **Create** | Modal component with form fields for `first_name`, `last_name`, `phone`, `email`, `tax_id`, `address`. Calls `updateCustomer` on submit, emits `onSuccess` callback to refresh the list. |

## Risks / Trade-offs

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Client-side safe-delete bypass**: A user could call the Supabase API directly and bypass the client-side guard | Low | Medium — `work_orders` FK RESTRICT would still block, but `sales` would SET NULL orphaning records | Accept for now; consider adding an RLS policy or DB trigger in a future phase |
| **Lifetime value query performance**: Batch `SUM(total) GROUP BY customer_id` on `sales` could slow down with very large datasets | Low | Low — expected volume is manageable; `sales.customer_id` already has implicit FK index | Monitor; add a covering index or materialized view if latency exceeds 500ms |
| **Stale aggregate data**: Order counts and lifetime values are fetched on page load and can become stale during a long session | Medium | Low — cosmetic inaccuracy only | Accept; data refreshes on page navigation or search action |
| **No branch_id scoping on delete pre-check**: `canDeleteCustomer` counts across all branches if RLS is misconfigured | Low | Medium — could incorrectly block deletion | Existing RLS policies on `work_orders` and `sales` already scope by branch; verify during implementation |
