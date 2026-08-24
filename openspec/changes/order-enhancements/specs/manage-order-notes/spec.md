# manage-order-notes Specification

## Purpose

Ability to add internal notes to a work order to track progress and communication, recording who created the note.

## Requirements

### Requirement: Note Author Context

The system MUST associate any new note added to a work order with the current user's author ID.

#### Scenario: Adding a note to a work order
- GIVEN the user is authenticated and viewing a work order
- WHEN the user adds an internal note
- THEN the system persists the note with the user's ID as the `author_id`
- AND the note is successfully saved and displayed
