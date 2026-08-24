# manage-order-tasks Specification

## Purpose

Ability to add and manage tasks associated with a specific work order, ensuring correct relational context.

## Requirements

### Requirement: Task Creation Context

The system MUST associate any new task added to a work order with the active branch ID.

#### Scenario: Adding a task to a work order
- GIVEN the user is viewing a work order details page
- AND the work order belongs to a specific branch
- WHEN the user adds a new task
- THEN the system persists the task with the correct `branch_id`
- AND the task is successfully associated with the work order
