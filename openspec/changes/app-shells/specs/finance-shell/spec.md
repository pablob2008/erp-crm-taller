<Finance Shell Specification>
## Purpose
Provide a functional placeholder page for the finance route to ensure a complete navigational experience.

## Requirements

### Requirement: Finance Page Basic Rendering
The system MUST render a basic visual shell for the finance page when accessed.

#### Scenario: Navigate to finance page
- GIVEN the user is authenticated and in the dashboard
- WHEN the user navigates to `/finance`
- THEN the system MUST display the Finance page
- AND the page MUST show a title for Finance
- AND the page MUST display a basic skeleton layout or empty state
- AND the page MUST NOT execute complex database logic
