</App Routing Specification>
<Delta for App Routing>
## ADDED Requirements

### Requirement: App Shell Routes
The system MUST provide routing entries for the new application shell pages.

#### Scenario: Access customer route
- GIVEN the application is running
- WHEN a logged-in user accesses `/customers`
- THEN the application MUST load the Customers page shell within the Dashboard layout

#### Scenario: Access inventory route
- GIVEN the application is running
- WHEN a logged-in user accesses `/inventory`
- THEN the application MUST load the Inventory page shell within the Dashboard layout

#### Scenario: Access finance route
- GIVEN the application is running
- WHEN a logged-in user accesses `/finance`
- THEN the application MUST load the Finance page shell within the Dashboard layout

#### Scenario: Access settings route
- GIVEN the application is running
- WHEN a logged-in user accesses `/settings`
- THEN the application MUST load the Settings page shell within the Dashboard layout

</Delta for App Routing>
