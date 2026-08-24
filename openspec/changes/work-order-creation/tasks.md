</SDD Tasks Phase Executor>
<Tasks: Work Order Creation>
## Review Workload Forecast
| Field | Value |
|-------|-------|
| Estimated changed lines | 350 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Not needed |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units
| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | All | 1 | `npm run build` | UI | Git |

## Phase 1: Setup and Utilities
- [x] 1.1 Update `apps/web/package.json` to ensure `react-hook-form`, `@hookform/resolvers`, `zod`, and `cmdk` are installed.
- [x] 1.2 Create `apps/web/src/lib/hooks/use-debounce.ts` to implement a custom hook for debouncing search input.
- [x] 1.3 Create `apps/web/src/lib/validations/work-orders.ts` to define Zod schemas: `newCustomerSchema` (name, phone, dni) and `workOrderSchema`. Ensure `workOrderSchema` requires `customer_id`, `device_brand`, `device_model`, and `reported_problem`. Add optional fields: `device_color`, `aesthetic_condition`, `accessories`, and `suggested_solution`.

## Phase 2: Database Services
- [x] 2.1 Create `apps/web/src/lib/services/customers.ts` to implement `searchCustomers(query)` and `createCustomer(data)` interacting with Supabase.
- [x] 2.2 Create `apps/web/src/lib/services/work-orders.ts` to implement `createWorkOrder(data)` for inserting records into the `work_orders` table.

## Phase 3: Customer Search Components
- [x] 3.1 Create `apps/web/src/components/work-orders/InlineCustomerForm.tsx` to build a dialog form using `newCustomerSchema` for creating new customers inline.
- [x] 3.2 Create `apps/web/src/components/work-orders/CustomerSearch.tsx` using `shadcn-ui` combobox and `useDebounce` hook to search customers, and integrate `InlineCustomerForm` for the "No results" action.

## Phase 4: Form Assembly and Routing
- [x] 4.1 Create `apps/web/src/components/work-orders/WorkOrderForm.tsx` integrating `CustomerSearch`. Build form fields for required inputs (`device_brand`, `device_model`, `reported_problem`) and optional inputs (`device_color`, `aesthetic_condition`, `accessories`, `suggested_solution`). Disable these fields until `customer_id` is present.
- [x] 4.2 Create `apps/web/src/pages/NewWorkOrderPage.tsx` to host the `WorkOrderForm` component.
- [x] 4.3 Update `apps/web/src/App.tsx` (or router configuration file) to register the `<Route path="/orders/new" element={<NewWorkOrderPage />} />` route.
