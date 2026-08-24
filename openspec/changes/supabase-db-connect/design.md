</SDD Design Phase Executor>
<Design: Supabase DB Connect>
## Technical Approach
Install `@supabase/supabase-js` and `react-router-dom`. Set up a singleton Supabase client using environment variables for the URL and Anon Key. Create a React Context `SupabaseProvider` to globally manage and provide the authentication session state using `onAuthStateChange`. Refactor `App.tsx` into an app shell layout utilizing `react-router-dom`'s `Routes`, and add a `ProtectedRoute` component to secure authenticated paths. The dashboard KPIs and the new `/orders` page will query the live Supabase database directly via the client.

## Architecture Decisions

### Decision: Routing with React Router v6
**Choice**: Use `react-router-dom` with standard `BrowserRouter` and nested `<Routes>`.
**Alternatives considered**: File-based routing (e.g., TanStack Router) or keeping state-based conditional rendering.
**Rationale**: `react-router-dom` is the industry standard for React SPAs, integrates easily into the existing Vite app, and handles auth guards elegantly via wrapper components without complex boilerplate.

### Decision: State Management for Supabase Auth
**Choice**: React Context (`SupabaseProvider`) wrapping the application.
**Alternatives considered**: Zustand, Redux, or raw hooks in each component.
**Rationale**: Authentication state is inherently global. Context is native, lightweight, and perfectly handles the `supabase.auth.onAuthStateChange` subscription pattern while making the `session` accessible everywhere.

### Decision: Data Fetching Pattern
**Choice**: Standard `useEffect` and `useState` hooks for simple queries (KPIs and Orders).
**Alternatives considered**: React Query or SWR.
**Rationale**: Keeping dependencies minimal for this first real-data iteration. The Supabase JS client handles direct fetching efficiently. We can upgrade to React Query later if caching, mutations, or complex optimistic UI updates become necessary.

## Data Flow
```
[User] -> [React Router] -> [ProtectedRoute]
                               |-- Unauthenticated --> [LoginPage] -> (Supabase Auth SignIn)
                               |-- Authenticated --> [App Shell / SupabaseProvider]
                                                           |
                                                           |-- [Dashboard KPIs] -> (Supabase SQL Query)
                                                           |-- [OrdersPage] -> (Supabase SQL Query)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `apps/web/package.json` | Modify | Add `@supabase/supabase-js` and `react-router-dom` dependencies. |
| `apps/web/.env.local` | Create | Store `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. |
| `apps/web/src/lib/supabase.ts` | Create | Instantiate and export the typed Supabase singleton client. |
| `apps/web/src/context/SupabaseProvider.tsx` | Create | React Context providing `session`, `user`, and `supabase`. |
| `apps/web/src/components/ProtectedRoute.tsx` | Create | Route wrapper that redirects unauthenticated users to `/login`. |
| `apps/web/src/pages/LoginPage.tsx` | Create | Email/password sign-in page using Supabase Auth. |
| `apps/web/src/pages/OrdersPage.tsx` | Create | Table displaying work orders joined with customers from the live DB. |
| `apps/web/src/App.tsx` | Modify | Extract layout into an app shell, implement React Router `Routes` and `<Link>` for the sidebar, and query live data for KPIs. |
| `apps/web/src/main.tsx` | Modify | Wrap the application tree with `BrowserRouter` and `SupabaseProvider`. |

## Interfaces / Contracts

```typescript
// apps/web/src/context/SupabaseProvider.tsx
import { Session, User, SupabaseClient } from '@supabase/supabase-js'

export interface SupabaseContextType {
  supabase: SupabaseClient;
  session: Session | null;
  user: User | null;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Supabase Client Initialization | Ensure client is created successfully when env vars are present. |
| Integration | Auth Guard Redirect | Verify `ProtectedRoute` redirects to `/login` when no session exists. |
| Integration | KPI Data Fetching | Ensure KPI components gracefully handle loading states and display numeric totals or `0` when the DB is empty. |
| E2E | Login Flow | Test complete email/password login and redirection to the dashboard. |

## Threat Matrix
N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout
No code migration required. The `supabase_schema.sql` file must be executed manually in the remote Supabase project dashboard to provision tables and functions before deploying the application.

## Open Questions
- None.
</Design: Supabase DB Connect>
