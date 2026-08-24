</SDD Spec Phase Executor>
<manage-order-tasks Specification>
## Purpose
Enable users to manage an order-specific checklist of tasks.

## Requirements

### Requirement: Add Task
The system MUST allow users to add new checklist tasks to the work order.

#### Scenario: Successfully Add Task
- GIVEN the user is viewing the overview tab
- WHEN the user inputs a task description and adds it
- THEN the task is saved to the database and appears in the task list as incomplete

#### Scenario: Empty Task Submission
- GIVEN the user is viewing the overview tab
- WHEN the user submits an empty task description
- THEN the system prevents the submission and shows a validation error

### Requirement: Toggle Task Completion
The system MUST allow users to mark tasks as complete or incomplete.

#### Scenario: Check Task
- GIVEN an incomplete task exists on the work order
- WHEN the user clicks the task's checkbox
- THEN the system updates the task status to complete in the database

#### Scenario: Uncheck Task
- GIVEN a complete task exists on the work order
- WHEN the user clicks the task's checkbox
- THEN the system updates the task status to incomplete in the database
