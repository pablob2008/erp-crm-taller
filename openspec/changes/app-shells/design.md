<Design: App Shells>
## Technical Approach
Create 4 stateless placeholder page components following the exact visual pattern established by `DashboardPage` (title + Card grid) and `OrdersPage` (title + bordered table). Register them as lazy-imported routes inside the existing `ProtectedRoute > DashboardLayout` nesting in `App.tsx`. No database calls, no state — pure presentational shells.

## Architecture Decisions

### Decision: Static placeholder content over skeleton loaders
**Choice**: Render static empty-state Cards with descriptive text and lucide icons.
**Alternatives considered**: Animated skeleton/pulse placeholders; lorem-ipsum mock data.
**Rationale**: The existing `DashboardPage` uses Cards with icon + title + description. Matching that pattern keeps visual consistency while clearly communicating "not yet implemented" to testers. Skeletons imply loading, which is misleading for a page with no data source.

### Decision: Same-file page components (no sub-components)
**Choice**: Each shell is a single self-contained file exporting one default function component.
**Alternatives considered**: Shared `ShellCard` wrapper component.
**Rationale**: Shells are temporary scaffolding. Extracting shared components adds indirection for code that will be replaced entirely when real features land. Follows the existing pattern where `DashboardPage` and `OrdersPage` are self-contained.

### Decision: Spanish UI labels matching sidebar
**Choice**: Use the same Spanish labels from `DashboardLayout` sidebar (`Clientes`, `Inventario & Compras`, `Caja / Finanzas`, `Configuración`).
**Alternatives considered**: English labels.
**Rationale**: The entire UI is already in Spanish. Consistency.

## Data Flow

```
No data flow — all pages are stateless presentational components.

  Browser URL ──► React Router ──► ProtectedRoute ──► DashboardLayout
                                                          │
                   ┌──────────────┬──────────────┬────────┴────────┐
                   ▼              ▼              ▼                 ▼
            /customers      /inventory      /finance          /settings
           CustomersPage   InventoryPage   FinancePage      SettingsPage
           (static JSX)    (static JSX)    (static JSX)     (static JSX)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/pages/CustomersPage.tsx` | Create | Shell with title "Clientes" + empty Table structure (columns: Nombre, Teléfono, Email, Órdenes) matching `OrdersPage` pattern |
| `apps/web/src/pages/InventoryPage.tsx` | Create | Shell with title "Inventario & Compras" + two Card sections: Stock items and Compras pendientes |
| `apps/web/src/pages/FinancePage.tsx` | Create | Shell with title "Caja / Finanzas" + two Card sections: Caja Registradora and Movimientos |
| `apps/web/src/pages/SettingsPage.tsx` | Create | Shell with title "Configuración" + three Card sections: Datos de Sucursal, Perfil de Usuario, Preferencias |
| `apps/web/src/App.tsx` | Modify | Add 4 imports + 4 `<Route>` entries after the `/orders/new` route inside `DashboardLayout` |

## Interfaces / Contracts

No new interfaces or types. Each page is a zero-prop default-export function component:

```tsx
// Pattern for every shell page
export default function XxxPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      </div>
      {/* Card-based placeholder content */}
    </div>
  )
}
```

**Imports used across shells** (all already available in the project):
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` from `@/components/ui/card`
- `Table`, `TableHeader`, `TableRow`, `TableHead`, `TableBody`, `TableCell` from `@/components/ui/table` (only `CustomersPage`)
- Icons from `lucide-react`: `Users`, `Package`, `DollarSign`, `Settings`, `ShoppingCart`, `Landmark`, `UserCog`, `Building2`

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Manual | Navigation from sidebar to each shell | Click each sidebar link, verify page renders with correct title and no console errors |
| Manual | Protected route guard | Access `/customers` while logged out, verify redirect to `/login` |
| Visual | Layout consistency | Compare each shell's card layout against `DashboardPage` for spacing and typography alignment |

## Threat Matrix
N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout
No migration required. Pure additive change — 4 new files and 4 new route entries.

## Open Questions
- None. All decisions are unblocked.
</Design: App Shells>
