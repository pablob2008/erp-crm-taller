</SDD Spec Phase Executor>
<pending-approval-screen Specification>
## Purpose
A static screen shown to users who registered after the initial branch but haven't been assigned a branch yet.

## Requirements

### Requirement: Display Pending Approval Message
The system MUST display a clear message indicating the user is pending approval.

#### Scenario: User views pending approval screen
- GIVEN a user is routed to the `/pending-approval` route
- WHEN the screen renders
- THEN it MUST display a message instructing the user to contact their admin for branch assignment
