# order-crud-operations Specification

## Purpose
Enable full edit and delete operations for tasks, notes, purchases, and payments within a work order to easily correct mistakes.

## Requirements

### Requirement: Edit and Delete Tasks
The system MUST allow users to edit and delete existing tasks from the work order details view.

#### Scenario: Edit a task
- GIVEN an existing task in a work order
- WHEN the user clicks the edit icon, changes the task description, and saves
- THEN the task is updated in the database and UI

#### Scenario: Delete a task
- GIVEN an existing task in a work order
- WHEN the user clicks the delete icon and confirms
- THEN the task is removed from the database and UI

### Requirement: Edit and Delete Notes
The system MUST allow users to edit and delete existing notes.

#### Scenario: Edit a note
- GIVEN an existing note
- WHEN the user modifies the note content and saves
- THEN the note is updated

#### Scenario: Delete a note
- GIVEN an existing note
- WHEN the user deletes the note
- THEN it is removed

### Requirement: Edit and Delete Purchases
The system MUST allow users to edit and delete purchase items.

#### Scenario: Edit a purchase item
- GIVEN an existing purchase item
- WHEN the user edits the item details
- THEN the item is updated

#### Scenario: Delete a purchase item
- GIVEN an existing purchase item
- WHEN the user deletes it
- THEN it is removed

### Requirement: Edit and Delete Payments
The system MUST allow users to edit and delete payments, and recalculate totals accordingly.

#### Scenario: Edit a payment
- GIVEN an existing payment on a work order
- WHEN the user edits the payment amount
- THEN the payment is updated
- AND the `total_paid` and `balance` on the work order are recalculated and updated

#### Scenario: Delete a payment
- GIVEN an existing payment on a work order
- WHEN the user deletes the payment
- THEN the payment is removed
- AND the `total_paid` and `balance` on the work order are recalculated and updated
