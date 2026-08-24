# Design — order-search-print-workflow

## Context

See [proposal.md](proposal.md) for motivation and scope.
This change introduces three closely related capabilities: **global header search**, **contextual search + status tabs on the orders list**, and a **printable intake ticket (Comprobante de Ingreso)** accessible from the order detail page. The spec is defined in [specs/order-search-and-print/spec.md](specs/order-search-and-print/spec.md).

---

## Goals / Non-Goals

### Goals

1. **G1** — Enable searching orders from any page via the global header input, landing on `/orders?q=<term>`.
2. **G2** — Provide contextual search and status tab filtering on the `/orders` page with URL-driven state (`q`, `status` params).
3. **G3** — Deliver a printable Workshop Intake Ticket layout on `/orders/:id` that includes device condition, accessories, financial balance, and legal warranty clauses.
4. **G4** — Zero new npm dependencies; leverage native browser APIs and existing component library.

### Non-Goals

- Full-text search or server-side search index (e.g., pg_trgm, Elasticsearch).
- PDF generation or server-side rendering of tickets.
- Pagination of the orders list (future concern when order volume exceeds ~500).
- Customizable ticket templates or per-branch print templates (the `branches.print_settings` JSONB exists in the schema but will only be consumed read-only for `service_conditions`).

---

## Decisions

### Decision 1: URL-driven state via `useSearchParams`

**Choice:** Use React Router's `useSearchParams` hook in `OrdersPage` to read/write `q` (search query) and `status` (status filter tab) from the URL query string. The global header search in `DashboardLayout` uses `useNavigate` to redirect to `/orders?q=<term>` on submit.

**Rationale:** URL-driven state enables deep-linking (a technician can share a filtered view), browser back/forward navigation works naturally, and the global header redirect is trivially implemented with `navigate('/orders?q=...')`. No global state management (Context, Zustand) is needed.

**Alternatives considered:**
- *React Context / global store*: Adds coupling between the layout and the page; overkill for a single search param.
- *Component-local state only*: Loses the header → page handoff and deep-link ability.

---

### Decision 2: Client-side filtering (not server-side)

**Choice:** Fetch all orders via the existing Supabase query (already fetches all rows ordered by `created_at desc`) and apply filtering in the browser using `Array.filter()` + `String.includes()`.

**Rationale:** Expected order volume for a single-branch repair shop is < 500 active orders. Client-side filtering is simpler, avoids extra Supabase queries on every keystroke, and provides instant feedback. The existing query already joins the `customers` relation, giving access to `first_name`, `last_name`, and `phone` for search matching.

**Trade-off:** If the orders table grows past ~1000 rows, performance degrades. This can be addressed later with server-side `ilike` filters or Supabase full-text search.

**Filtering logic:** Match the user's query (case-insensitive, trimmed) against: `order_number`, `customers.first_name`, `customers.last_name`, `customers.phone`, `device_brand`, `device_model`. Status tab applies an exact match on `status` field (or "all" shows everything).

---

### Decision 3: Expand fetched fields in OrdersPage query

**Choice:** Extend the `OrdersPage` Supabase select to include `customers.phone` and `status` (already fetched), so the search can match on phone number.

**Rationale:** The current query already fetches `customers ( first_name, last_name )`. Adding `phone` is a trivial column addition, no extra join needed. The `WorkOrder` type in `OrdersPage.tsx` will be extended accordingly.

---

### Decision 4: Debounced search input (300 ms)

**Choice:** The contextual search input on `/orders` will debounce the filter application by 300 ms using a simple `useEffect` + `setTimeout` pattern (no library).

**Rationale:** Prevents re-filtering on every keystroke while keeping the UI feeling responsive. 300 ms is a standard sweet spot. No dependency on `lodash.debounce` or `use-debounce` — a 5-line custom effect is sufficient.

---

### Decision 5: Status tabs architecture

**Choice:** Render a horizontal tab bar with four tabs: `All`, `In Workshop` (maps to statuses `received`, `waiting_client`, `waiting_parts`), `Ready` (`ready_for_pickup`), `Delivered` (`delivered`). Clicking a tab updates `?status=<tab>` in the URL. The `cancelled` and `quotation` statuses are visible under the "All" tab.

**Rationale:** Maps to the spec's four required tabs. Grouping `received + waiting_*` into "In Workshop" reflects the physical reality of devices being inside the shop. URL-synced tab state allows linking directly to a filtered view.

---

### Decision 6: Print approach — `@media print` CSS + `PrintableTicket` component

**Choice:** Create a dedicated `PrintableTicket` React component that renders the full intake receipt layout. It is mounted inside `WorkOrderDetailsPage` but hidden from screen via CSS (`hidden` class on screen, `block` on print). The existing "Imprimir" button in `OrderHeader` already calls `window.print()`. New `@media print` CSS rules will:
1. Hide sidebar, header, FAB, and all non-ticket content.
2. Show only the `PrintableTicket` component.
3. Use A4-friendly sizing with proper margins.

**Rationale:** No new npm dependencies. `window.print()` is already wired. `@media print` is universally supported. A dedicated component keeps the ticket layout isolated and testable. This approach is simpler and lighter than `react-to-print` (which would add a dependency for the same `window.print()` call underneath).

**Alternatives considered:**
- *`react-to-print`*: Adds ~8KB dependency for a wrapper around `window.print()` with ref targeting. Overkill when a single `@media print` block suffices.
- *Dialog/modal print view*: More complex UX (open modal → print → close). The hidden-on-screen approach is seamless — one click prints.

---

### Decision 7: PrintableTicket content

**Choice:** The ticket component renders the following sections:

| Section | Data source |
|---------|------------|
| Header | Branch name, address, phone, tax_id (from `branches` table via a new lightweight query) |
| Order Info | `order_number`, `received_at`, `estimated_delivery_at` |
| Customer Info | `customers.first_name`, `customers.last_name`, `customers.phone`, `customers.tax_id` |
| Device Details | `device_brand`, `device_model`, `device_color`, `aesthetic_condition`, `accessories` |
| Problem / Notes | `reported_problem`, `suggested_solution` |
| Financial Summary | `estimated_cost`, `total_paid`, `balance` |
| Legal Clause | `branches.service_conditions` (fallback: hardcoded default warranty text) |
| Signature Lines | Two blank signature lines: Shop / Customer |

**Rationale:** Matches the spec requirement for "device condition, accessories, financial balance, and legal warranty clauses." The `branches` table already has `service_conditions` and `print_settings`; querying this once on the details page provides all ticket header data.

---

### Decision 8: No database schema changes

**Choice:** No new tables, columns, or migrations are needed. All required data exists:
- `work_orders` has all device, financial, and status fields.
- `customers` has `phone`, `email`, `tax_id`.
- `branches` has `name`, `address`, `phone`, `tax_id`, `service_conditions`, `print_settings`.

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/DashboardLayout.tsx` | **Modify** | Wire the header search `<input>` to `useState` + `onKeyDown` (Enter) / form submit → `useNavigate('/orders?q=...')`. Import `useNavigate`. |
| `apps/web/src/pages/OrdersPage.tsx` | **Modify** | Add `useSearchParams`; add contextual search input + status tabs UI above the table; extend `WorkOrder` type to include `customers.phone`; implement client-side filtering with debounce; update Supabase select to fetch `phone`. |
| `apps/web/src/components/orders/OrderStatusTabs.tsx` | **Create** | Reusable horizontal tab bar component accepting `tabs`, `activeTab`, and `onChange`. Renders neumorphic pill-style tabs. |
| `apps/web/src/components/orders/print/PrintableTicket.tsx` | **Create** | Full intake ticket layout component. Props: `order: WorkOrderComposite`, `branch: BranchInfo`. Renders all sections (header, customer, device, financials, legal, signatures). Only visible in `@media print`. |
| `apps/web/src/lib/services/branch.ts` | **Create** | Service function `getBranchInfo(supabase, branchId)` returning `{ name, address, phone, tax_id, service_conditions, print_settings }`. Used by the details page to populate the ticket header. |
| `apps/web/src/pages/WorkOrderDetailsPage.tsx` | **Modify** | Import and mount `PrintableTicket` (hidden on screen). Fetch branch info via `getBranchInfo` on mount. Pass data to `PrintableTicket`. |
| `apps/web/src/index.css` | **Modify** | Add `@media print { ... }` rules: hide `.no-print` elements (sidebar, header, FAB), show `.print-only` elements, set page margins and A4 sizing. |

---

## Risks / Trade-offs

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Client-side filtering becomes slow with large datasets (>1000 orders) | Low (single-branch shop) | Medium — sluggish UI | Migrate to server-side `ilike` filters when needed; the URL-driven state pattern is already compatible. |
| `@media print` CSS conflicts with existing global styles or component library styles | Low | Medium — broken ticket layout | Use a high-specificity `.print-only` wrapper; reset font sizes and colors inside the print block. Test in Chrome & Firefox print preview. |
| Branch info query adds an extra network request on the details page | Low | Low — minor latency | The query is simple (single row by PK). Can be parallelized with the existing `getWorkOrderDetails` call via `Promise.all`. |
| Users expect PDF export, not just browser print | Medium | Low — feature gap perception | Browser print-to-PDF covers 95% of cases. A dedicated PDF export can be added later with `@react-pdf/renderer` if demand exists. |
| Search matches are too broad (substring matching on all fields) | Low | Low — false positives in results | Acceptable for expected volume. Can add field-specific search (e.g., `#123` to search only by order number) as a UX improvement later. |
