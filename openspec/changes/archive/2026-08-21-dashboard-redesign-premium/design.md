# Design — dashboard-redesign-premium

## Context

See [proposal.md](proposal.md) for motivation.  
The current `DashboardPage.tsx` renders three basic KPI cards (Deliveries, Pending Purchases, Today's Cash) with sequential Supabase queries and a single Quick Actions panel. The spec `dashboard-premium-ui` requires four Hero KPIs, a pipeline visualization, a live recent-orders table with WhatsApp links, a recent activity feed, and neumorphic quick action buttons — all fed from live database metrics.

---

## Goals / Non-Goals

### Goals
- G1: Replace the current 3-card dashboard with a 4-column Hero KPI row (Active Workshop, Ready for Pickup, Today's Cash, Stock Alerts).
- G2: Add a Pipeline Visualization widget showing order count distribution across status groups.
- G3: Add a Live Recent Orders table (last 10 orders) with status badges and WhatsApp quick links.
- G4: Add a Recent Activity Feed sourcing the last 5 cash movements.
- G5: Extend quick action buttons with neumorphic styling and add "Add Expense" and "Inventory" shortcuts.
- G6: Introduce accent-color CSS variables for KPI card theming (e.g., blue, green, amber, red tints).
- G7: Extract each dashboard section into its own widget component for maintainability.

### Non-Goals
- NG1: Real-time subscriptions (Supabase Realtime). Data is fetched on page load only; live push is out of scope.
- NG2: Server-side aggregation (RPC / database functions). All queries use the existing Supabase JS client.
- NG3: Database schema changes — all required data is already available via existing tables.
- NG4: Mobile-specific bottom-nav or responsive redesign beyond the current Tailwind breakpoints.

---

## Decisions

### Decision 1: Data Fetching Strategy — Parallel `Promise.all`

**Choice:** Fetch all KPI and widget data in a single `Promise.all` call within the `useEffect` of `DashboardPage.tsx`.

**Rationale:** The current implementation issues three sequential `await` calls (lines 19-44 of `DashboardPage.tsx`), adding unnecessary waterfall latency. The new dashboard requires 6 independent queries (4 KPIs + recent orders + recent activity). Parallelizing them cuts perceived load time to the duration of the slowest query.

**Alternatives Considered:**
- *Sequential awaits* (current pattern): Simpler to read, but ~3× slower with 6 queries.
- *Custom React Query hooks*: Would add a library dependency (`@tanstack/react-query`); the project does not currently use it, so adding it is out of scope.

---

### Decision 2: Component Architecture — Extracted Widget Components

**Choice:** Extract each dashboard section into its own component under `apps/web/src/components/dashboard/`:

| Component | Responsibility |
|---|---|
| `KpiCard.tsx` | Reusable single KPI card with icon, value, label, accent color, and loading skeleton |
| `PipelineWidget.tsx` | Horizontal stacked-bar pipeline of order statuses |
| `RecentOrdersWidget.tsx` | Table of last 10 orders with status badge and WhatsApp link |
| `ActivityFeedWidget.tsx` | List of last 5 cash movements |
| `QuickActionsWidget.tsx` | Neumorphic action buttons grid |

**Rationale:** The current `DashboardPage.tsx` (154 lines) inlines all KPI cards and quick actions. Adding pipeline, orders table, and activity feed would push it past 400 lines. Extracting widgets keeps each component under 80 lines and enables independent testing.

**Alternatives Considered:**
- *Single-file rewrite*: Faster initial implementation but creates a monolithic component that resists iterative change.

---

### Decision 3: CSS Approach — Extend Existing Neumorphic Tokens with Accent CSS Variables

**Choice:** Add four KPI accent color CSS custom properties to `index.css` (`:root` and `.dark` scopes) and map them through `tailwind.config.js`. KPI cards will combine the existing `shadow-neu` token with a subtle left-border or top-gradient using the accent color.

```css
/* New variables in :root */
--kpi-blue: 217 91% 60%;
--kpi-green: 142 71% 45%;
--kpi-amber: 38 92% 50%;
--kpi-red: 0 84% 60%;
```

**Rationale:** The design system already uses HSL CSS variables for all semantic colors (`--primary`, `--accent`, etc.) and neumorphic shadows (`--shadow-neu`). Adding four KPI-specific tokens follows the same pattern, avoids hard-coded hex values, and automatically supports dark mode via the `.dark` override block.

**Alternatives Considered:**
- *Inline Tailwind arbitrary values* (`bg-[hsl(217,91%,60%)]`): Works but scatters color definitions across components instead of centralizing them.
- *Separate CSS module per widget*: Unnecessary complexity; the global token approach is consistent with the existing architecture.

---

### Decision 4: No Database Schema Changes

**Choice:** No new tables, columns, or ENUMs are required.

**Rationale:**
- **Active Workshop KPI**: `SELECT count(*) FROM work_orders WHERE status NOT IN ('delivered','cancelled')` — uses existing `order_status` enum and `status` column.
- **Ready for Pickup KPI**: Already queried in the current dashboard (`status = 'ready_for_pickup'`).
- **Today's Cash KPI**: Already queried in the current dashboard (`cash_movements` with `type = 'income'` + date filter). Will expand to also show expenses for net total.
- **Stock Alerts KPI**: `SELECT count(*) FROM inventory_items WHERE quantity <= min_stock` — both columns exist.
- **Pipeline**: `SELECT status, count(*) FROM work_orders WHERE status NOT IN ('delivered','cancelled') GROUP BY status` — standard aggregation.
- **Recent Orders**: `SELECT ... FROM work_orders JOIN customers ON ... ORDER BY created_at DESC LIMIT 10` — existing FK relationship.
- **Activity Feed**: `SELECT ... FROM cash_movements ORDER BY created_at DESC LIMIT 5` — existing table.

---

### Decision 5: Activity Feed Source — `cash_movements` ordered by `created_at DESC LIMIT 5`

**Choice:** Source the activity feed exclusively from the `cash_movements` table, showing the 5 most recent entries with type icon (income ↑ / expense ↓), description, net_amount, and relative timestamp.

**Rationale:** `cash_movements` is the most granular financial log in the system, with `type`, `category`, `description`, `net_amount`, and `created_at` columns providing all needed display data. Joining with `work_orders` (via `work_order_id` FK) is optional for context but not required for MVP.

**Alternatives Considered:**
- *Union of cash_movements + work_order_status_history*: Richer feed but introduces query complexity and UI ambiguity about what constitutes an "activity." Deferred to a future iteration.

---

### Decision 6: Pipeline Visualization — Single Aggregation Query with Status Group Mapping

**Choice:** Execute a single `GROUP BY status` query on `work_orders` (filtering out `delivered` and `cancelled`), then map results to a horizontal stacked bar in `PipelineWidget.tsx`. Each status maps to a named color token and a label.

Status group mapping:

| DB Status | Display Label | Color Token |
|---|---|---|
| `quotation` | Quotation | `kpi-amber` |
| `received` | Received | `kpi-blue` |
| `waiting_client` | Waiting Client | `kpi-amber` |
| `waiting_parts` | Waiting Parts | `kpi-red` |
| `ready_for_pickup` | Ready | `kpi-green` |

**Rationale:** A single aggregation query is efficient. The horizontal stacked bar is the simplest visualization that conveys distribution without requiring a charting library.

**Alternatives Considered:**
- *Chart.js or Recharts*: Overkill for a 5-segment bar; adds bundle size.
- *Vertical bar chart*: Less space-efficient for a dashboard header area.

---

## File Changes

| File | Action | Description |
|---|---|---|
| `apps/web/src/pages/DashboardPage.tsx` | **Modify** | Rewrite to orchestrate parallel data fetching via `Promise.all`, compose extracted widget components in a responsive grid layout. |
| `apps/web/src/components/dashboard/KpiCard.tsx` | **Create** | Reusable KPI card: icon, label, value, accent color prop, loading skeleton. Neumorphic `shadow-neu` styling. |
| `apps/web/src/components/dashboard/PipelineWidget.tsx` | **Create** | Horizontal stacked-bar pipeline. Receives status counts record, renders proportional colored segments with tooltips. |
| `apps/web/src/components/dashboard/RecentOrdersWidget.tsx` | **Create** | Table of last 10 orders. Columns: order number, customer name, device, status badge, WhatsApp link (`https://wa.me/{phone}`). |
| `apps/web/src/components/dashboard/ActivityFeedWidget.tsx` | **Create** | Vertical feed list of last 5 cash movements. Shows icon, description, amount, and relative time. |
| `apps/web/src/components/dashboard/QuickActionsWidget.tsx` | **Create** | Grid of neumorphic action buttons: New Order, Add Expense, Inventory, Customers. Uses `Link` from react-router-dom. |
| `apps/web/src/lib/services/dashboard.ts` | **Create** | Service module exporting `fetchDashboardData(supabase, branchId)` that returns all widget data via `Promise.all`. Keeps Supabase query logic out of components. |
| `apps/web/src/index.css` | **Modify** | Add `--kpi-blue`, `--kpi-green`, `--kpi-amber`, `--kpi-red` CSS variables in both `:root` and `.dark` scopes. |
| `apps/web/tailwind.config.js` | **Modify** | Extend `colors` with `kpi-blue`, `kpi-green`, `kpi-amber`, `kpi-red` mapped to `hsl(var(--kpi-*))`. |

---

## Risks / Trade-offs

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Parallel queries spike Supabase concurrent connections** | Low | Medium | 6 lightweight count/select queries are well within Supabase free-tier limits (< 50ms each). Monitor via Supabase dashboard. |
| **WhatsApp link fails when customer phone is null** | Medium | Low | `RecentOrdersWidget` conditionally renders the WhatsApp button only when `customers.phone` is non-null. |
| **Stock Alerts KPI misleading when `min_stock` is not configured** | Medium | Low | Default `min_stock` is 5 (schema line 118). KPI will show items ≤ 5 unless explicitly adjusted. Add tooltip clarifying threshold. |
| **Pipeline bar segments too thin for statuses with very few orders** | Low | Low | Set a CSS `min-width` of 4px per segment so all statuses remain visible even with 1 order. |
| **Bundle size increase from new components** | Low | Low | All new components are plain React + Tailwind; no new library dependencies. Estimated < 5 KB gzipped total. |
