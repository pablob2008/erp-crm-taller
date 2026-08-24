</SDD Spec Phase Executor>
<update-work-order-status Specification>
## Purpose
Allow users to change the status of a work order directly from the details view.

## Requirements

### Requirement: Status Editor
The system MUST provide a UI to select and save a new status for the work order.

#### Scenario: Successfully Update Status
- GIVEN the user is viewing a work order
- WHEN the user selects a new status and confirms the change
- THEN the system updates the work order status in the database and reflects the change in the UI

#### Scenario: Status Update Error
- GIVEN the database or network is unavailable
- WHEN the user attempts to update the status
- THEN the system shows an error message and reverts the UI to the previous status
