</SDD Design Phase Executor>
<Design: Work Order Creation>
## Technical Approach
We will build a single-page React form using `react-hook-form` and `zod` for state and validation, along with `shadcn-ui` components. Since the current application uses Vite and React Router, we will create a new page component `NewWorkOrderPage` rather than a Next.js App Router page as suggested in the proposal. The form will feature a predictive customer search via a Combobox. If no customer is found, an inline dialog form will allow creating a new customer. The device details section will remain disabled until a valid customer is selected. Submission will insert a record into the `work_orders` table via a new Supabase service.

## Architecture Decisions

### Decision: Vite + React Router vs Next.js App Router
**Choice**: Use Vite and React Router (`src/pages/NewWorkOrderPage.tsx`).
**Alternatives considered**: Next.js App Router as mentioned in the proposal.
**Rationale**: The existing codebase is explicitly a Vite SPA (`main.tsx`, `App.tsx`, `react-router-dom`). Aligning with the existing structure ensures compatibility and consistency.

### Decision: Form State Management
**Choice**: `react-hook-form` with `@hookform/resolvers` (Zod).
**Alternatives considered**: Controlled React state, Formik.
**Rationale**: Provides the best performance for complex forms, easiest validation schema definition with `zod`, and native integration with `shadcn-ui` `<Form>` components.

### Decision: Debouncing Search
**Choice**: Use a custom `useDebounce` hook (e.g. 300ms) on the customer search input before calling the Supabase `customers` service.
**Alternatives considered**: Direct query on every keystroke.
**Rationale**: Prevents excessive database reads, adhering to the debounced search specification.

### Decision: Inline Customer Creation UI
**Choice**: Embed the customer creation inside a Dialog triggered from the Combobox "No results" state.
**Alternatives considered**: Navigating to a `/customers/new` page.
**Rationale**: Keeps the user in the work order context, maintaining flow and satisfying the "single-page fluid form" requirement.

## Data Flow
```text
User -> Types in Combobox -> useDebounce(300ms) -> Supabase `customers` query
User -> Selects Customer -> Form state `customerId` updated -> Device fields enabled
User -> Submits form -> Zod validation -> Supabase `work_orders` insert -> Success toast & redirect
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `apps/web/package.json` | Modify | Add `react-hook-form`, `@hookform/resolvers`, `zod`, `cmdk` |
| `apps/web/src/App.tsx` | Modify | Add route `<Route path="/orders/new" element={<NewWorkOrderPage />} />` |
| `apps/web/src/pages/NewWorkOrderPage.tsx` | Create | Main view containing the `WorkOrderForm` |
| `apps/web/src/components/work-orders/WorkOrderForm.tsx` | Create | Form orchestrator handling state, validation, and submission |
| `apps/web/src/components/work-orders/CustomerSearch.tsx` | Create | Combobox component to search customers |
| `apps/web/src/components/work-orders/InlineCustomerForm.tsx` | Create | Form inside a Dialog to create a new customer inline |
| `apps/web/src/lib/services/customers.ts` | Create | DB methods: `searchCustomers(query)` and `createCustomer(data)` |
| `apps/web/src/lib/services/work-orders.ts` | Create | DB methods: `createWorkOrder(data)` |
| `apps/web/src/lib/hooks/use-debounce.ts` | Create | Utility hook for debouncing text input |

## Interfaces / Contracts

```typescript
// src/lib/services/customers.ts
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  dni?: string;
}

// src/lib/services/work-orders.ts
export interface WorkOrderInsert {
  customer_id: string;
  marca: string;
  modelo: string;
  falla: string;
  status: string; // e.g. 'pending'
}

// Validation Schemas
import { z } from "zod";
export const workOrderSchema = z.object({
  customerId: z.string().uuid("Seleccione un cliente"),
  marca: z.string().min(1, "Requerido"),
  modelo: z.string().min(1, "Requerido"),
  falla: z.string().min(1, "Requerido")
});

export const newCustomerSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  phone: z.string().optional(),
  dni: z.string().optional(),
});
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Validation schemas | Test `workOrderSchema` and `newCustomerSchema` against invalid/empty payloads |
| Unit | `useDebounce` hook | Test timing delays to ensure it successfully defers calls |
| Integration | DB Services | Verify `searchCustomers` query logic against Supabase API |
| UI | Form Interaction | Ensure `Marca`/`Modelo`/`Falla` inputs are disabled when `customerId` is absent |

## Threat Matrix
N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout
No migration required. Ensure that the `customers` and `work_orders` tables exist in the Supabase schema and that RLS policies allow inserts for authenticated users.

## Open Questions
- [ ] Do we need to capture more device data like Serial Number or physical condition immediately?
- [ ] Are there specific mandatory database constraints for `work_orders` we should map in `WorkOrderInsert` beyond `marca`, `modelo`, and `falla`?
</Design: Work Order Creation>
