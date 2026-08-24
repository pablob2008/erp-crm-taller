</SDD Propose Phase Executor>
<Proposal: Branch Onboarding>
## Intent
New users currently encounter RLS blocking because they lack a `branch_id` in their `profiles` row upon signup. This change introduces an onboarding flow to create the initial branch for new administrators, ensuring their profile is fully provisioned before accessing the dashboard.

## Scope

### In Scope
- Creation of an onboarding page (`/onboarding`) to collect branch details (Name, Address, Phone).
- Modification of the existing auth guard to check for `branch_id` and redirect to the onboarding page if missing.
- Integration with the `create_initial_branch_and_setup_owner` Supabase RPC.
- Context refresh to update user state after successful onboarding.

### Out of Scope
- Modifying the underlying database structure or RPC.
- Multi-branch creation or management for existing users (only the initial branch is handled).

## Capabilities

### New Capabilities
- `onboarding-flow`: A dedicated page (`/onboarding`) to capture initial branch details and provision the new admin user.

### Modified Capabilities
- `auth-guard`: Now requires `branch_id` in addition to authentication to access protected routes, redirecting to `/onboarding` if absent.

## Approach
We will add a check in the router/auth guard that verifies the presence of `branch_id` in the authenticated user's profile. If missing, the user is redirected to a new `/onboarding` route. This route will feature a form capturing Branch Name, Address, and Phone. Upon submission, it will invoke the `public.create_initial_branch_and_setup_owner` RPC function via the Supabase client. After a successful response, we'll trigger a refresh of the auth context to populate the `branch_id` and role, then redirect the user to `/`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/auth/AuthGuard` or equivalent | Modified | Redirects to `/onboarding` if authenticated but missing `branch_id`. |
| `src/pages/onboarding` | New | New page to host the branch creation form. |
| `src/contexts/AuthContext` or equivalent | Modified | Potential changes to handle context refresh post-onboarding. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| User stuck in redirect loop if context refresh fails | Low | Ensure the auth context correctly updates the local state before redirection, and gracefully handle RPC errors. |
| Missing fields block RPC execution | Low | Use form validation to guarantee required fields (Name, Address, Phone) are provided before calling the RPC. |

## Rollback Plan
Revert the auth guard changes to their previous state to disable the onboarding redirect, and remove the `/onboarding` route. Unblock users manually if needed.

## Dependencies
- Existing Supabase RPC function `create_initial_branch_and_setup_owner`.

## Success Criteria
- [ ] Authenticated users without a `branch_id` are redirected to `/onboarding`.
- [ ] Users can submit the form to create their branch.
- [ ] Upon successful creation, the user is redirected to `/` and can create records without RLS errors.
</Proposal: Branch Onboarding>
