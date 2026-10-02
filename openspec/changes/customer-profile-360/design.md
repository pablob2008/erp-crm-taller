## Context

The CRM module currently has a directory page (`/customers`) with paginated search, edit modal, and safe delete. The service layer (`lib/services/customers.ts`) already provides `fetchCustomers` (with LTV via `sales`), `updateCustomer`, `canDeleteCustomer`, and `fetchCustomerHistorySnapshot`. See proposal.md for motivation.

The database already has the required relational model: `work_orders` stores `customer_id`, `total_paid`, `balance`, `estimated_cost`, and `status`; `cash_movements` links to `work_orders` via `work_order_id` and carries `type` (income/expense), `net_amount`, and `payment_method`. No schema migrations are needed.

## Goals / Non-Goals

**Goals:**
- Provide a dedicated `/customers/:id` profile page with three panels (Identity, Workshop, Financial)
- Extend `customers.ts` service with functions for fetching work orders and financial data by customer
- Reuse and extract the edit form from `CustomerEditModal.tsx` to avoid duplication
- Add a "New Customer" standalone creation flow from the directory

**Non-Goals:**
- Customer-level analytics or reporting (charts, trends)
- Inline editing of work orders from the profile (link to existing detail page instead)
- Changes to the database schema or RLS policies
- POS/sales integration beyond reading existing `sales` records for LTV

## Decisions

### D1: Service-First Data Fetching

**Decision:** Add two new functions to `lib/services/customers.ts`:
- `fetchCustomerWorkOrders(supabase, customerId)` — returns work orders with status, device info, dates, and balance
- `fetchCustomerFinancials(supabase, customerId)` — returns `{ lifetimeValue, pendingBalance, movements[] }` by aggregating `sales.total` and `work_orders.balance`, plus recent `cash_movements` linked to the customer's orders

**Rationale:** The architecture mandates services are UI-agnostic. All Supabase queries stay in the service layer. The profile page only calls these functions and renders the results.

**Alternative considered:** Fetching everything in a single `fetchCustomerProfile` call. Rejected because each panel loads independently, and the workshop/financial panels benefit from separate loading states (progressive disclosure).

### D2: Form Extraction for Identity Panel

**Decision:** Extract the form fields and validation logic from `CustomerEditModal.tsx` into a new `CustomerForm.tsx` presentational component. Both the modal and the profile's Identity Panel will consume `CustomerForm`.

**Rationale:** `CustomerEditModal` currently owns the Dialog wrapper AND the form fields together. The profile page needs the same fields inline (no dialog). Extracting avoids duplicating six form fields and validation logic.

**Structure:**
- `components/customers/CustomerForm.tsx` — pure form fields + validation (presentational)
- `components/customers/CustomerEditModal.tsx` — wraps `CustomerForm` in a `Dialog` (unchanged API)
- `pages/CustomerProfilePage.tsx` — uses `CustomerForm` inline in the Identity Panel card

### D3: Profile Page Layout

**Decision:** Three-panel layout using Shadcn Cards with the project's Glassmorphism styling (`bg-background/40 backdrop-blur-md border-border/40`):

```
┌─────────────────────────────────────────────────┐
│ ← Back to Directory    Customer Name    Actions │  (header)
├──────────────────┬──────────────────────────────┤
│  Identity Panel  │     Workshop Panel           │
│  (CustomerForm)  │     (Work Orders Table)      │
│                  │                              │
├──────────────────┴──────────────────────────────┤
│              Financial Panel                     │
│  ┌──────┐ ┌──────┐    Cash Movements Table      │
│  │ LTV  │ │ Debt │                              │
│  └──────┘ └──────┘                              │
└─────────────────────────────────────────────────┘
```

**Rationale:** Matches the existing dashboard card-based layout. Identity on the left is compact (few fields), workshop history gets more horizontal space. Financial panel spans full width because the movements table needs room.

**Responsive:** On mobile (`< md`), panels stack vertically: Identity → Workshop → Financial.

### D4: Pending Balance Calculation

**Decision:** Calculate pending balance by summing `work_orders.balance` for all non-cancelled orders of the customer. This field is already maintained by `recalculateOrderFinancials` in `work-order-details.ts` whenever payments are added/updated/deleted.

**Rationale:** The `balance` column on `work_orders` is the source of truth (computed as `estimated_cost - total_paid`). Summing it across the customer's orders gives us the real-time pending debt without needing a separate aggregation of `cash_movements`.

**Alternative considered:** Re-computing from `cash_movements` directly. Rejected because `balance` is already kept in sync by existing service logic, and double-computing risks inconsistency.

### D5: New Customer Creation from Directory

**Decision:** Add a "New Customer" button in `CustomersPage.tsx` header that opens `CustomerEditModal` in "create mode" (passing `customer={null}` and adding a `mode: 'create' | 'edit'` prop).

**Rationale:** Reuses existing modal infrastructure. The form fields are identical for create and edit; only the submit handler differs (`createCustomer` vs `updateCustomer`).

### D6: Routing

**Decision:** Add `<Route path="/customers/:id" element={<CustomerProfilePage />} />` inside the existing `ProtectedRoute > DashboardLayout` block in `App.tsx`.

**Rationale:** Follows the exact same pattern as `/orders/:id` → `WorkOrderDetailsPage`.

## Risks / Trade-offs

- **[N+1 query on financials]** → `fetchCustomerFinancials` does 3 parallel queries (sales total, WO balances, movements). Acceptable for a single-customer view. If performance degrades, a Postgres function can consolidate.
- **[Form extraction refactor]** → Touching `CustomerEditModal` could introduce regressions. Mitigated by keeping the modal's external API unchanged; only internal composition changes.
- **[Stale balance data]** → If another user modifies a work order while the profile is open, the displayed pending balance may be stale. Acceptable for now; real-time subscriptions are a future enhancement.
