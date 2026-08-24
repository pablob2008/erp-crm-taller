</SDD Design Phase Executor>
<Design: Work Order Details>
## Technical Approach
Implement a centralized React view (`WorkOrderDetailsPage`) that pulls all relationships (customers, notes, tasks, items, payments) for a specific work order from Supabase in a single composite query. We will build a custom neumorphic tab system to organize the data into Overview, Parts, and Finances. State will be managed locally with a re-fetch upon mutations using a new `work-order-details.ts` service, ensuring all database triggers and aggregates stay correctly synced.

## Architecture Decisions

### Decision: Single Composite Query vs Separate Queries
**Choice**: Single Composite Query.
**Alternatives considered**: Fetching each relationship (notes, tasks, items, payments) in separate hooks or promises.
**Rationale**: Supabase supports deep nesting via PostgREST. Fetching `work_orders` with nested `customers`, `tasks`, `work_order_notes`, `work_order_items`, and `cash_movements` in one request minimizes network roundtrips, simplifies initial loading state management, and ensures we have a consistent snapshot of the order.

### Decision: Custom Neumorphic Tabs
**Choice**: Build a custom `Tabs` component using standard `<button>` elements with `shadow-neu-inset` for the active state.
**Alternatives considered**: Using `lucide-react` state or importing standard Shadcn `Tabs`.
**Rationale**: Standard Shadcn `Tabs` are not installed (`@radix-ui/react-tabs` is missing in `package.json`). Building a lightweight custom component aligns with the project's existing neumorphic styling (`shadow-neu`, `shadow-neu-inset`) and avoids unnecessary dependencies.

### Decision: Mutation State Management
**Choice**: Centralized state refresh after mutations.
**Alternatives considered**: Optimistic UI updates for everything.
**Rationale**: For MVP, after a successful mutation (e.g., adding a note, toggling a task, changing status), we will trigger a re-fetch of the composite query to ensure data consistency with complex database triggers (like `fn_sync_cash_movement_to_work_order`).

## Data Flow
```text
[App Router: /orders/:id] 
       |
[WorkOrderDetailsPage] ---(fetch composite query)---> [Supabase API]
       |
       |-- (Data) --> [OrderHeader] (Status change mutation)
       |
       |-- (State) -> [OrderTabs]
       |
       |=== Active Tab ===>
            |
            |-- OverviewTab (Tasks, Notes) ---> [addNote, toggleTask mutations]
            |
            |-- PartsTab (Items) -------------> [addItem mutation]
            |
            |-- FinancesTab (Payments) -------> [addPayment mutation]
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/App.tsx` | Modify | Add `<Route path="/orders/:id" element={<WorkOrderDetailsPage />} />`. |
| `apps/web/src/pages/WorkOrderDetailsPage.tsx` | Create | Main container, manages loading state and composite fetch. |
| `apps/web/src/components/orders/details/OrderTabs.tsx` | Create | Custom neumorphic tab component. |
| `apps/web/src/components/orders/details/OrderHeader.tsx` | Create | Header displaying device info and status dropdown. |
| `apps/web/src/components/orders/details/tabs/OverviewTab.tsx` | Create | Renders Tasks and Notes UI. |
| `apps/web/src/components/orders/details/tabs/PartsTab.tsx` | Create | Renders linked Items UI. |
| `apps/web/src/components/orders/details/tabs/FinancesTab.tsx` | Create | Renders Payments UI. |
| `apps/web/src/lib/services/work-order-details.ts` | Create | Functions for fetching data and performing all related mutations. |

## Interfaces / Contracts

```typescript
// in lib/services/work-order-details.ts

export interface WorkOrderComposite {
  id: string;
  order_number: string;
  device_brand: string;
  device_model: string;
  reported_problem: string;
  status: string;
  estimated_cost: number;
  total_paid: number;
  balance: number;
  customers: { first_name: string; last_name: string };
  tasks: Array<{ id: string; title: string; is_completed: boolean }>;
  work_order_notes: Array<{ id: string; content: string; created_at: string }>;
  work_order_items: Array<{ 
    id: string; 
    quantity: number; 
    unit_price: number; 
    inventory_items?: { name: string } 
  }>;
  cash_movements: Array<{ 
    id: string; 
    net_amount: number; 
    payment_method: string; 
    created_at: string 
  }>;
}

// Service functions to implement:
// getWorkOrderDetails(supabase, id)
// updateOrderStatus(supabase, id, status)
// addOrderNote(supabase, id, content)
// addTask(supabase, id, title)
// toggleTask(supabase, taskId, isCompleted)
// addOrderItem(supabase, orderId, itemId, quantity, unitPrice)
// addOrderPayment(supabase, orderId, registerId, amount, method)
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Data fetching and mutations | Mock `SupabaseClient` to verify queries and mutations in `work-order-details.ts` are formatted correctly. |
| Unit | Custom Tabs component | Verify active tab state applies `shadow-neu-inset` class. |

## Threat Matrix
N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout
No migration required. The database schema already supports the relations needed for these features.

## Open Questions
- None.
</Design: Work Order Details>
