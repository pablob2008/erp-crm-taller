</SDD Spec Phase Executor>
<Supabase Provider Specification>
## Purpose
Wraps the application to provide global access to the current authenticated session, user details, and the Supabase client instance via React Context.

## Requirements

### Requirement: Session Management
The system MUST track the current authentication session state and listen for state changes (e.g., sign in, sign out).

#### Scenario: State changes
- GIVEN the application is running
- WHEN the authentication state changes (e.g., user signs out)
- THEN the context updates the session and triggers a re-render of dependent components.

### Requirement: Context Exposure
The system MUST provide a hook or context consumer to access the current session, user, and Supabase client.

#### Scenario: Accessing context
- GIVEN a component within the application
- WHEN it uses the Supabase context
- THEN it receives the current session details and a reference to the Supabase client.
