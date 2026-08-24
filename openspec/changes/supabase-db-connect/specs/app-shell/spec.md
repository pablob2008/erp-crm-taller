<App Shell Specification>
<Delta for App Shell>
## MODIFIED Requirements

### Requirement: Shell Providers
The system MUST wrap the main application layout in necessary context providers, including the `SupabaseProvider` for authentication state.
(Previously: The system wrapped the app in basic layout providers without authentication context)

#### Scenario: Application initialization
- GIVEN the application starts
- WHEN rendering the root component (`App.tsx`)
- THEN it is wrapped within the `SupabaseProvider` to ensure global access to session data.

### Requirement: Dynamic Dashboard KPIs
The dashboard within the app shell MUST display real data fetched from the backend instead of static values.
(Previously: Dashboard displayed hardcoded static values for KPIs)

#### Scenario: Dashboard rendering
- GIVEN the user views the dashboard
- WHEN the KPI components are rendered
- THEN they fetch and display live data queries from Supabase rather than static placeholders.
</Delta for App Shell>
