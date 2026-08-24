</SDD Spec Phase Executor>
<Supabase Auth Login Specification>
## Purpose
Provides a sign-in interface allowing users to authenticate via email and password using Supabase Auth.

## Requirements

### Requirement: Email/Password Authentication
The system MUST provide a login form accepting an email address and password.

#### Scenario: Successful login
- GIVEN a user is on the login page
- WHEN they enter valid credentials and submit
- THEN they are authenticated and redirected to the dashboard.

#### Scenario: Failed login
- GIVEN a user is on the login page
- WHEN they enter invalid credentials and submit
- THEN an error message is displayed indicating the failure, and they remain on the login page.

### Requirement: Redirect on Authenticated
The system SHOULD redirect users to the dashboard if they navigate to the login page while already authenticated.

#### Scenario: Already authenticated
- GIVEN a user is already signed in
- WHEN they navigate to the `/login` route
- THEN they are automatically redirected to the dashboard.
