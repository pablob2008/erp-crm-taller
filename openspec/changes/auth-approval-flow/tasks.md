</SDD Tasks Phase Executor>
<Tasks: Auth Approval Flow>
## Review Workload Forecast
| Field | Value |
|-------|-------|
| Estimated changed lines | 150-200 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Not needed |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units
| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | All | 1 | `npm run build` | UI | Git |

## Phase 1: Context and API Utility
- [x] 1.1 Update `apps/web/src/context/SupabaseProvider.tsx` to define `UserProfile` interface and state. Fetch profile (`branch_id`, `role`) on auth change, and provide `profile` and `profileLoading` to context.
- [x] 1.2 Create `apps/web/src/lib/services/branches.ts` exporting `checkAnyBranchExists(): Promise<boolean>` to query the `branches` table via Supabase client (e.g., using `.select('id', { count: 'exact' })`).

## Phase 2: Page Components
- [x] 2.1 Create `apps/web/src/pages/PendingApprovalPage.tsx` with a static message explaining the user needs admin approval and a logout button.
- [x] 2.2 Create `apps/web/src/pages/OnboardingPage.tsx` with a form to create the initial branch via RPC. Add logic on mount to redirect to dashboard or `/pending-approval` if `checkAnyBranchExists` is true.

## Phase 3: Routing and Guard Integration
- [x] 3.1 Update `apps/web/src/components/ProtectedRoute.tsx` to consume `profile` and `profileLoading` from context. If `branch_id` is null, await `checkAnyBranchExists()` and redirect to `/onboarding` or `/pending-approval`.
- [x] 3.2 Update `apps/web/src/App.tsx` to add `/pending-approval` and `/onboarding` routes inside `SupabaseProvider` but outside `ProtectedRoute`.
</Tasks: Auth Approval Flow>
