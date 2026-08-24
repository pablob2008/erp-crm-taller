</auth-guard Specification>
<Delta for auth-guard>
## MODIFIED Requirements
### Requirement: Enforce Branch Assignment and Approval Flow
The system MUST enforce that a user is either assigned to a branch or routed to the correct setup/pending screen based on the global state of branches.
(Previously: The system MUST ensure the user is authenticated.)

#### Scenario: User logs in with a branch assigned
- GIVEN a user has successfully authenticated
- AND the user's profile has a `branch_id` assigned
- WHEN the auth guard processes the user
- THEN the user MUST be permitted to proceed to the main dashboard or requested protected route

#### Scenario: User logs in with no branch and `branches` table is empty
- GIVEN a user has successfully authenticated
- AND the user's profile does not have a `branch_id`
- AND the `branches` table is empty
- WHEN the auth guard processes the user
- THEN the user MUST be redirected to the `/onboarding` page to create the initial branch

#### Scenario: User logs in with no branch and `branches` table is NOT empty
- GIVEN a user has successfully authenticated
- AND the user's profile does not have a `branch_id`
- AND the `branches` table contains at least one branch
- WHEN the auth guard processes the user
- THEN the user MUST be redirected to the `/pending-approval` page

#### Scenario: Unauthenticated user access attempt
- GIVEN a user is not authenticated
- WHEN they attempt to access a protected route
- THEN they MUST be redirected to the login page
</Delta for auth-guard>
