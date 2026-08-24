# Proposal: supabase-db-connect

## Intent
The app currently runs entirely on static/mock data. This change replaces that with a live Supabase backend: it executes the existing schema, installs the JS client, secures every route behind Supabase Auth, and delivers the first real business screen (Work Orders List). Without this foundation, no subsequent real-data feature can be built.

## Scope

### In Scope
- Execute `supabase_schema.sql` on the remote Supabase project via the Supabase Dashboard SQL editor
- Install `@supabase/supabase-js` in `apps/web`
- Create `apps/web/.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Create `apps/web/src/lib/supabase.ts` — typed singleton client
- Create `apps/web/src/context/SupabaseProvider.tsx` — React context exposing `session` + `supabase`
- Create `apps/web/src/pages/LoginPage.tsx` — email/password sign-in via Supabase Auth
- Wire routing (`react-router-dom`) with a `ProtectedRoute` guard
- Replace all hardcoded KPI card values in `App.tsx` with real Supabase queries
- Create `apps/web/src/pages/OrdersPage.tsx` — Work Orders List (`/orders`) with real data from `work_orders` table

### Out of Scope
- Seed / demo data (DB starts empty by design)
- Role-based authorization beyond basic auth guard (RLS is in the schema; UI role checks deferred)
- WhatsApp deep-linking, PDF generation, ARCA integration
- Any external automated notifications (per `automations.md` Core Rule)
- Quotation (Ghost Mode) flow — deferred to its own change

## Capabilities

### New Capabilities
- `supabase-client`: Typed singleton client initialized from env vars; exportable throughout the app
- `supabase-auth-login`: Email/password sign-in page with error feedback; redirects to dashboard on success
- `supabase-auth-guard`: `ProtectedRoute` wrapper that redirects unauthenticated users to `/login`
- `supabase-provider`: React context providing `session` + `user` + `supabase` instance app-wide
- `kpi-real-data`: Dashboard KPI cards query live Supabase data (work_orders, purchases, cash_movements)
- `work-orders-list`: Full-page `/orders` table showing `id`, customer name, device, status, and estimated delivery date from `work_orders`

### Modified Capabilities
- `app-shell`: `App.tsx` wrapped in `SupabaseProvider`; static KPI values replaced with real queries
- `sidebar-navigation`: Sidebar links updated to use `react-router-dom` `<Link>` and point to real routes

## Approach
Install `@supabase/supabase-js` and `react-router-dom`. Initialize a typed client singleton in `lib/supabase.ts`. Wrap the app in `SupabaseProvider` which listens to `onAuthStateChange`. Add `react-router-dom` routing at the `main.tsx` level with a `ProtectedRoute` that checks session. Build `LoginPage` using Supabase `signInWithPassword`. Replace KPI card static values with `useEffect`/`useState` hooks that fire Supabase queries. Build `OrdersPage` using a Supabase query on `work_orders` joined to `customers` for display name, rendered in a Shadcn `Table` component.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/web/package.json` | Modified | Add `@supabase/supabase-js`, `react-router-dom` |
| `apps/web/.env.local` | New | Supabase URL + anon key env vars |
| `apps/web/src/lib/supabase.ts` | New | Typed Supabase singleton client |
| `apps/web/src/context/SupabaseProvider.tsx` | New | Auth session React context |
| `apps/web/src/pages/LoginPage.tsx` | New | Sign-in page |
| `apps/web/src/pages/OrdersPage.tsx` | New | Work Orders List (`/orders`) |
| `apps/web/src/components/ProtectedRoute.tsx` | New | Auth guard component |
| `apps/web/src/App.tsx` | Modified | Wrapped in provider; KPI cards use real queries; nav uses `<Link>` |
| `apps/web/src/main.tsx` | Modified | Wrap app in `BrowserRouter` |
| `supabase_schema.sql` | Referenced | Executed manually in Supabase Dashboard — no code change |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Schema execution fails due to existing objects | Low | Schema is idempotent (`CREATE IF NOT EXISTS`); run in clean project |
| Env vars exposed in client bundle | Low | `VITE_SUPABASE_ANON_KEY` is designed to be public; RLS enforces security |
| `work_orders` to `customers` join shape mismatch | Med | Inspect schema before writing query; use explicit column aliases |
| Auth session race condition on page load | Low | `SupabaseProvider` uses `getSession()` + `onAuthStateChange` to cover both paths |
| React Router v6 breaking changes vs existing code | Low | No existing router; fresh install avoids conflicts |

## Rollback Plan
1. Revert `apps/web/src/main.tsx` and `App.tsx` to the current static version (tracked in git).
2. Remove `apps/web/.env.local` (never committed — gitignored).
3. Remove added packages: `npm uninstall @supabase/supabase-js react-router-dom`.
4. The `supabase_schema.sql` execution is additive (new tables/functions); it can be rolled back by dropping the created objects via the Supabase Dashboard SQL editor.

## Dependencies
- User must have Supabase project URL and `anon key` available before `sdd-design` executes
- `supabase_schema.sql` must be present and valid (already confirmed in the repo)
- `react-router-dom` v6+ must be compatible with existing Vite + React 18 setup

## Success Criteria
- [ ] Supabase schema is executed and all tables exist in the remote project
- [ ] `apps/web` builds without errors after adding dependencies
- [ ] Navigating to any route while unauthenticated redirects to `/login`
- [ ] A valid Supabase user can sign in and reach the dashboard
- [ ] Dashboard KPI cards display `0` (not hardcoded values) for an empty database
- [ ] `/orders` page renders an empty table (no mock rows) with correct columns: Order #, Customer, Device, Status, Est. Delivery
- [ ] No external API calls, emails, or automated notifications are triggered at any point
