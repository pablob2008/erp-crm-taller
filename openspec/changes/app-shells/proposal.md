<Proposal: app-shells>
## Intent
To complete the skeletal structure of the application based on the existing sidebar navigation, providing functional placeholder pages for all routes. This ensures a complete navigational experience before implementing complex module logic.

## Scope

### In Scope
- Create 4 new shell page components (`CustomersPage.tsx`, `InventoryPage.tsx`, `FinancePage.tsx`, `SettingsPage.tsx`).
- Register the new routes in `App.tsx` under `ProtectedRoute` and `DashboardLayout`.
- Design basic visual skeletons for these pages using shadcn UI components (e.g., Cards, empty states, or simple divs).

### Out of Scope
- Complex relational database bindings or real data integrations for these new pages.
- Detailed, functional inner-page interactions or forms.

## Capabilities

### New Capabilities
- `customers-shell`: Basic visual shell for the customers page.
- `inventory-shell`: Basic visual shell for the inventory page.
- `finance-shell`: Basic visual shell for the finance page.
- `settings-shell`: Basic visual shell for the settings page.

### Modified Capabilities
- `app-routing`: Adding routes for `/customers`, `/inventory`, `/finance`, and `/settings` to `App.tsx`.

## Approach
Create the requested React components as functional placeholder pages using simple UI components (Title, Description, Card/Empty State). Update `App.tsx` to import and route to these new components within the existing `DashboardLayout` inside a `ProtectedRoute`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/pages/CustomersPage.tsx` | New | Shell page for `/customers` |
| `src/pages/InventoryPage.tsx` | New | Shell page for `/inventory` |
| `src/pages/FinancePage.tsx` | New | Shell page for `/finance` |
| `src/pages/SettingsPage.tsx` | New | Shell page for `/settings` |
| `src/App.tsx` | Modified | Add routes for the new shell pages |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Routing conflicts | Low | Verify `App.tsx` imports and route paths match the `DashboardLayout` links. |
| Missing shadcn UI components | Low | Use standard HTML elements or already imported components if a specific shadcn component is missing, avoiding new component generation. |

## Rollback Plan
Revert changes to `src/App.tsx` and delete the newly created page components (`CustomersPage.tsx`, `InventoryPage.tsx`, `FinancePage.tsx`, `SettingsPage.tsx`).

## Dependencies
- Existing `DashboardLayout` and `ProtectedRoute` configuration.
- Base UI components (shadcn UI, lucide-react, etc.) present in the project.

## Success Criteria
- [ ] Users can click on Customers, Inventory, Finance, and Settings in the sidebar and navigate to the respective pages.
- [ ] The pages render a basic title and skeleton/empty layout without crashing.
- [ ] No complex database logic is executed on these new shell pages.
