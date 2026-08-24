<Proposal: Work Order Creation>
## Intent
Implement the "New Work Order" creation flow to serve as the main data entry point for devices entering the repair shop. This provides a unified, fluid experience for associating customers with new repair jobs.

## Scope

### In Scope
- Single-page fluid form for work order creation.
- Predictive customer search (by name, phone, or DNI) via a combobox/autocomplete component.
- Inline form to create a new customer if no match is found.
- Device and repair data fields (Marca y Modelo, Falla reportada) that enable after customer selection.
- Database integration with existing `customers` and `work_orders` Supabase tables.

### Out of Scope
- External automations (e.g., sending emails/SMS to customers).
- Quick quote (Ghost Mode) integration (handled separately).
- Complex multi-step wizard UI (keeping it a single fluid form).

## Capabilities

### New Capabilities
- `customer-search`: Ability to search existing customers by name, phone, or DNI using a predictive combobox.
- `inline-customer-creation`: Ability to quickly create a new customer record from within the work order flow.
- `work-order-entry`: Ability to submit a new work order containing device details and reported issue, linked to the selected customer.

### Modified Capabilities
- None

## Approach
We will build a single-page React form utilizing `shadcn-ui` components. The flow begins with a Customer Search component that queries the `customers` table via Supabase. If the user opts to create a customer, an inline sub-form will capture the details and insert them into the DB. Once a valid customer is selected or created, the device details section unlocks. Submitting the complete form will insert a new record into the `work_orders` table.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/work-orders/new/page.tsx` | New | Main page for work order creation |
| `src/components/work-orders/` | New | Form and autocomplete components |
| `src/lib/services/work-orders.ts` | New | DB insert logic for work orders |
| `src/lib/services/customers.ts` | New | DB search and insert logic for customers |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Unnecessary DB calls on search | Med | Implement debouncing on the predictive search input. |
| Incomplete data submission | Low | Use form validation (e.g., Zod) for the inline customer form. |
| Supabase RLS preventing inserts | Low | Verify Row Level Security policies for tables during spec phase. |

## Rollback Plan
Remove the route to the new work order creation page from the navigation, and delete the affected UI components and service functions.

## Dependencies
- Existing `SupabaseProvider` and initialized Supabase client.
- `shadcn-ui` components (Combobox, Form, Input, Button).
- `zod` and `react-hook-form` for form state and validation.

## Success Criteria
- [ ] User can search for a customer by name, phone, or DNI and select them.
- [ ] User can create a new customer inline if not found.
- [ ] Device data fields are disabled until a customer is selected.
- [ ] Form successfully saves a new record in `work_orders` linking to the customer.
- [ ] No external automations (emails/SMS) are triggered.
