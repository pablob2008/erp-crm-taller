<Sidebar Navigation Specification>
<Delta for Sidebar Navigation>
## MODIFIED Requirements

### Requirement: Route Integration
The sidebar navigation MUST use routing links (e.g., `react-router-dom` `<Link>`) to navigate between actual application routes without triggering full page reloads.
(Previously: Sidebar links may have used standard anchor tags or placeholder actions)

#### Scenario: Navigating to Orders
- GIVEN the user clicks the "Orders" link in the sidebar
- WHEN the interaction occurs
- THEN the application transitions to the `/orders` route using client-side routing.
</Delta for Sidebar Navigation>
