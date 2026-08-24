</SDD Propose Phase Executor>
<Proposal: Auth Approval Flow>
## Intent
Implement a strict onboarding and approval flow to enforce that only the admin creates the initial branch, and subsequent users must wait for approval before accessing the application.

## Scope

### In Scope
- Modify the Auth Guard to handle users without a `branch_id`.
- Create an API utility to check for the global existence of any branch.
- Update/implement the `/onboarding` page to create the initial branch.
- Implement a `/pending-approval` static page for subsequent users.

### Out of Scope
- Building the admin UI to assign branches and roles to pending users.
- Role management system beyond initial branch creation.

## Capabilities

### New Capabilities
- `branch-existence-check`: An API utility to verify if any branch exists in the database.
- `pending-approval-screen`: A static screen (`/pending-approval`) shown to users who registered after the initial branch but haven't been assigned a branch yet.

### Modified Capabilities
- `auth-guard`: The routing logic must now check `branch_id` and global branch existence. If no `branch_id` and no branches exist, redirect to `/onboarding`. If no `branch_id` but branches exist, redirect to `/pending-approval`.
- `onboarding-flow`: The onboarding form should only be accessible if no branches exist globally.

## Approach
We will introduce an API utility function to check for any existing branch in the database. The existing Auth Guard will be extended: upon successful authentication, if the user lacks a `branch_id`, it will call the new utility. Based on the result, it will route the user to `/onboarding` (first user) or `/pending-approval` (subsequent users). We'll add the `/pending-approval` route as a static page and update the `/onboarding` flow constraints.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `components/auth/AuthGuard.tsx` | Modified | Update routing logic to handle `branch_id` absence based on global branch existence. |
| `lib/api/branches.ts` | Modified | API utility to check if any branches exist. |
| `app/pending-approval/page.tsx` | New | Static page for users waiting for approval. |
| `app/onboarding/page.tsx` | Modified | Add constraint so it's only accessible if no branches exist. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Race condition during first user registration | Low | The database RPC `create_initial_branch_and_setup_owner` should handle concurrent attempts gracefully. |
| Users stuck on pending approval | Medium | Clear messaging on the `/pending-approval` screen to instruct them to contact their admin. |

## Rollback Plan
Revert the Auth Guard changes to bypass the branch existence check, restoring the previous behavior. Remove the `/pending-approval` route.

## Dependencies
- Supabase Auth setup.
- Existing RPC `create_initial_branch_and_setup_owner`.

## Success Criteria
- [ ] Admin registers and is routed to `/onboarding` if no branches exist.
- [ ] Employee registers and is routed to `/pending-approval` if a branch already exists.
- [ ] Users without a `branch_id` cannot bypass these screens to access the main dashboard.
</Proposal: Auth Approval Flow>
