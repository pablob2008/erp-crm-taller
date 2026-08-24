</SDD Tasks Phase Executor>
<Tasks: App Shells>
## Review Workload Forecast
| Field | Value |
|-------|-------|
| Estimated changed lines | 200 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Not needed |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units
| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | All | 1 | `npm run build` | UI | Git |

## Phase 1: Shell Page Components
- [x] 1.1 Create `apps/web/src/pages/CustomersPage.tsx` with title "Clientes" and an empty Table matching `OrdersPage` pattern.
- [x] 1.2 Create `apps/web/src/pages/InventoryPage.tsx` with title "Inventario & Compras" and two Card sections (Stock items, Compras pendientes).
- [x] 1.3 Create `apps/web/src/pages/FinancePage.tsx` with title "Caja / Finanzas" and two Card sections (Caja Registradora, Movimientos).
- [x] 1.4 Create `apps/web/src/pages/SettingsPage.tsx` with title "Configuración" and three Card sections (Datos de Sucursal, Perfil de Usuario, Preferencias).

## Phase 2: Routing Setup
- [x] 2.1 Update `apps/web/src/App.tsx` to add imports for the 4 new pages and register routes for `/customers`, `/inventory`, `/finance`, `/settings` inside the existing `ProtectedRoute` and `DashboardLayout`.
</Tasks: App Shells>
