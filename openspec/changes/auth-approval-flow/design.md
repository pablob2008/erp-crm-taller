# Design: Auth Approval Flow

## Technical Approach
Extend `SupabaseProvider` to expose the user's `profile` (including `branch_id`). Replace the thin `ProtectedRoute` with a richer auth guard that fetches `branch_id` and, when null, calls a new `checkAnyBranchExists()` utility to decide between `/onboarding` and `/pending-approval`. Two new page components and one API utility are added following the project's existing flat-file patterns.

## Architecture Decisions

### Decision: Fetch profile inside SupabaseProvider
**Choice**: Extend `SupabaseProvider` to fetch the `profiles` row (specifically `branch_id` and `role`) on auth state change and expose it via context.
**Alternatives considered**: Fetch profile inside `ProtectedRoute` on every render; create a separate `ProfileProvider`.
**Rationale**: The provider already manages auth lifecycle and `loading` state. Co-locating profile fetch avoids a second loading boundary and keeps the existing single-provider pattern. The profile is needed app-wide (e.g., DashboardLayout avatar).

### Decision: Branch-existence check as a lib utility, not a hook
**Choice**: Plain async function `checkAnyBranchExists()` in `lib/services/branches.ts`.
**Alternatives considered**: Custom React hook; Supabase RPC.
**Rationale**: The project already uses `lib/services/*.ts` for data access (see `customers.ts`, `work-orders.ts`). A plain function is simpler, testable, and called once inside the guard. No RPC needed—a `SELECT id FROM branches LIMIT 1` via the Supabase client is sufficient and respects RLS.

### Decision: Guard logic stays in ProtectedRoute component
**Choice**: Keep the existing `ProtectedRoute.tsx` file and enrich its logic.
**Alternatives considered**: Create a new `AuthGuard.tsx` component.
**Rationale**: The project already has `ProtectedRoute` wired as the layout route in `App.tsx`. Renaming/replacing it would be unnecessary churn. The component name is conventional in React Router apps.

## Data Flow

```
Login → SupabaseProvider (auth + profile fetch)
              │
              ▼
       ProtectedRoute
        ├─ no session? ──────────────► /login
        │
        ├─ profile loading? ─────────► <Spinner>
        │
        ├─ profile.branch_id? ──────► <Outlet/> (dashboard)
        │
        └─ no branch_id
             │
             ▼
        checkAnyBranchExists()
          ├─ false ──► /onboarding  (first user creates branch)
          └─ true  ──► /pending-approval (wait for admin)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/context/SupabaseProvider.tsx` | Modify | Add `profile` (with `branch_id`, `role`) to context. Fetch from `profiles` table on auth state change. Expose `profileLoading` flag. |
| `apps/web/src/components/ProtectedRoute.tsx` | Modify | Consume `profile` from context. If no `branch_id`, call `checkAnyBranchExists()` to decide redirect target. |
| `apps/web/src/lib/services/branches.ts` | Create | Export `checkAnyBranchExists(): Promise<boolean>`. Single-row query on `branches` table. |
| `apps/web/src/pages/PendingApprovalPage.tsx` | Create | Static page with message and logout button. |
| `apps/web/src/pages/OnboardingPage.tsx` | Create | Form calling `create_initial_branch_and_setup_owner` RPC. Guards itself: if branches exist, redirects away. |
| `apps/web/src/App.tsx` | Modify | Add `/pending-approval` and `/onboarding` routes (outside `ProtectedRoute`, but within `SupabaseProvider`). |

## Interfaces / Contracts

```typescript
// context/SupabaseProvider.tsx — extended context
export interface UserProfile {
  id: string
  branch_id: string | null
  role: 'admin' | 'receptionist' | 'technician'
}

export interface SupabaseContextType {
  supabase: typeof supabase
  session: Session | null
  user: User | null
  profile: UserProfile | null
  profileLoading: boolean
}

// lib/services/branches.ts
export async function checkAnyBranchExists(): Promise<boolean>
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `checkAnyBranchExists` returns `true`/`false` correctly | Mock `supabase.from('branches').select().limit(1)` |
| Unit | `ProtectedRoute` redirects based on profile state | Render with mocked context values, assert `Navigate` targets |
| Integration | Full login → onboarding flow | Supabase local dev, empty DB, verify first user lands on `/onboarding` |
| Integration | Full login → pending-approval flow | Supabase local dev, branch exists, new user lands on `/pending-approval` |

## Threat Matrix
N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout
No migration required. The `profiles` table and `create_initial_branch_and_setup_owner` RPC already exist. New pages are additive. The `ProtectedRoute` change is backward-compatible: users with a `branch_id` continue to the dashboard as before.

## Open Questions
- [ ] RLS on `branches` table: does the `anon`/`authenticated` role have `SELECT` access for the existence check? If not, a permissive read policy or a thin RPC is needed.
