</SDD Spec Phase Executor>
<Supabase Auth Guard Specification>
## Purpose
Protects private application routes by ensuring only authenticated users can access them.

## Requirements

### Requirement: Route Protection
The system MUST redirect unauthenticated users attempting to access protected routes to the login page.

#### Scenario: Unauthenticated access
- GIVEN an unauthenticated user
- WHEN they attempt to access a protected route (e.g., `/orders`)
- THEN they are redirected to `/login`.

#### Scenario: Authenticated access
- GIVEN an authenticated user
- WHEN they attempt to access a protected route
- THEN the route renders successfully.
