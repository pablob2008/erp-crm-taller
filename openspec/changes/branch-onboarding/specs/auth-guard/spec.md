</Auth Guard Specification>
<Delta for auth-guard>
## ADDED Requirements
None

## MODIFIED Requirements
### Requirement: Route Protection with Branch Verification
The system MUST verify both authentication status and the presence of a `branch_id` before granting access to protected routes.
(Previously: The system MUST verify authentication status before granting access to protected routes.)

#### Scenario: Authenticated User with Branch
- GIVEN the user is authenticated
- AND the user's profile contains a valid `branch_id`
- WHEN the user attempts to access a protected route
- THEN the system MUST allow access to the requested route

#### Scenario: Authenticated User without Branch
- GIVEN the user is authenticated
- AND the user's profile does not contain a `branch_id`
- WHEN the user attempts to access a protected route
- THEN the system MUST redirect the user to the `/onboarding` route

#### Scenario: Unauthenticated User Access Attempt
- GIVEN the user is not authenticated
- WHEN the user attempts to access a protected route
- THEN the system MUST redirect the user to the login route
</Delta for auth-guard>
