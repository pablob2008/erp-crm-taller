</SDD Design Phase Executor>
<Design: Branch Onboarding>
## Technical Approach
We will enforce the presence of a `branch_id` for authenticated users by integrating a profile fetch into the global `SupabaseProvider`. The `ProtectedRoute` component will use this profile state to intercept users missing a `branch_id` and redirect them to a new `/onboarding` route. The onboarding page will capture basic branch details (Name, Address, Phone) via a form, and call the existing `create_initial_branch_and_setup_owner` Supabase RPC to provision the user's branch. Following a successful RPC call, the context will refresh the profile state and redirect the user to the main dashboard.

## Architecture Decisions

### Decision: Profile State in Global Context
**Choice**: Fetch and store the user's `profiles` record (including `branch_id`) within `SupabaseProvider` alongside `session`.
**Alternatives considered**: Fetching `branch_id` directly in `ProtectedRoute` or relying on local component state.
**Rationale**: Storing the profile globally prevents redundant network requests across different protected routes and allows any component (like forms needing `branch_id`) to easily access it synchronously via context.

### Decision: Protected Route Bypass for Onboarding
**Choice**: Introduce an optional `requireBranch` prop (defaulting to `true`) to `ProtectedRoute`. The `/onboarding` route will be protected (`requireBranch={false}`) to ensure only authenticated users can access it, without causing an infinite redirect loop.
**Alternatives considered**: Creating a separate `OnboardingGuard` or handling logic inside the component.
**Rationale**: Reusing `ProtectedRoute` with a configurable flag keeps routing logic centralized and maintains existing authentication checks.

## Data Flow
```text
+-----------+        +-------------------+         +------------------+
| User      | -----> | SupabaseProvider  | ------> | ProtectedRoute   |
| Logs In   |        | Fetches 'profile' |         | Checks branch_id |
+-----------+        +-------------------+         +------------------+
                                                            |
                     +-------------------+                  | (branch_id IS NULL)
                     | OnboardingPage    | <----------------+
                     | Displays Form     |
                     +-------------------+
                               |
                               v (Submit)
                     +---------------------------------------+
                     | RPC: create_initial_branch_and_setup_ |
                     +---------------------------------------+
                               |
                               v (Success)
                     +-------------------+
                     | refreshProfile()  | -----> (Redirect to '/')
                     | Update Context    |
                     +-------------------+
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/context/SupabaseProvider.tsx` | Modify | Add `profile` state and `refreshProfile` function. Update initialization to fetch profile before setting `loading` to `false`. |
| `apps/web/src/components/ProtectedRoute.tsx` | Modify | Add `requireBranch` prop. Redirect to `/onboarding` if `requireBranch` is true and `profile.branch_id` is null. |
| `apps/web/src/App.tsx` | Modify | Register `/onboarding` route wrapped in `<ProtectedRoute requireBranch={false} />`. |
| `apps/web/src/pages/OnboardingPage.tsx` | Create | New page containing the onboarding form (Name, Address, Phone) and logic to call the RPC and refresh context. |

## Interfaces / Contracts

### Context Types Updates
```typescript
export interface Profile {
  id: string;
  branch_id: string | null;
  role: string;
}

export interface SupabaseContextType {
  supabase: typeof supabase;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
}
```

### RPC Parameters
The RPC `create_initial_branch_and_setup_owner` is called with:
```typescript
const { data, error } = await supabase.rpc('create_initial_branch_and_setup_owner', {
  p_name: values.name,
  p_address: values.address,
  p_phone: values.phone,
});
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `ProtectedRoute` redirects | Verify rendering with mocked context: redirects to `/login` if unauthenticated, to `/onboarding` if missing branch, and renders `Outlet` if valid. |
| Unit | `OnboardingPage` form | Use React Testing Library to verify that Name, Address, and Phone inputs validate correctly (Zod schema) and block submission when empty. |
| Integration | Context Initialization | Ensure `SupabaseProvider` awaits the profile fetch before clearing the `loading` state. |

## Threat Matrix
N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout
No migration required. Existing users with a `branch_id` will bypass the new onboarding check.

## Open Questions
- None.
</Design: Branch Onboarding>
