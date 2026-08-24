</SDD Tasks Phase Executor>
<Tasks: Supabase DB Connect>
## Review Workload Forecast
| Field | Value |
|-------|-------|
| Estimated changed lines | 250 |
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

## Phase 1: Setup and Configuration
- [x] 1.1 Add `@supabase/supabase-js` and `react-router-dom` to `apps/web/package.json` dependencies. Run `npm install` after.
- [x] 1.2 SKIP — .env.local already created by user.
- [x] 1.3 Create `apps/web/src/lib/supabase.ts` — typed Supabase singleton client.

## Phase 2: Authentication Context
- [x] 2.1 Create `apps/web/src/context/SupabaseProvider.tsx` — React context with session, user, supabase.
- [x] 2.2 Create `apps/web/src/pages/LoginPage.tsx` — email/password sign-in with error feedback.
- [x] 2.3 Create `apps/web/src/components/ProtectedRoute.tsx` — redirect unauthenticated to /login.

## Phase 3: App Shell & Routing
- [x] 3.1 Update `apps/web/src/main.tsx` — wrap in BrowserRouter + SupabaseProvider.
- [x] 3.2 Refactor `apps/web/src/App.tsx` — use Routes, include ProtectedRoute.
- [x] 3.3 Update sidebar nav to use react-router-dom Link instead of anchors.

## Phase 4: Live Data Integration
- [x] 4.1 Update dashboard KPIs to fetch from work_orders, purchases, cash_movements via useEffect.
- [x] 4.2 Create `apps/web/src/pages/OrdersPage.tsx` — full-page table of work_orders joined with customers.
- [x] 4.3 Add /orders route to protected routes. in the app shell.
</Tasks: Supabase DB Connect>
