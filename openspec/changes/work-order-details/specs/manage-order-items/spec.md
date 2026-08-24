</SDD Spec Phase Executor>
<manage-order-items Specification>
## Purpose
Allow users to link inventory items and purchases to a specific work order for cost and part tracking.

## Requirements

### Requirement: View Linked Items
The system MUST list all parts, items, and purchases linked to the work order.

#### Scenario: View Items Tab
- GIVEN a work order with linked items
- WHEN the user navigates to the "Parts & Purchases" tab
- THEN the system displays a list of the linked items with their costs and quantities

### Requirement: Link Item
The system MUST allow users to link existing inventory to the order.

#### Scenario: Link Inventory Item
- GIVEN the user is on the "Parts & Purchases" tab
- WHEN the user searches for and selects an inventory item to link
- THEN the item is associated with the work order in the database and displayed in the list

#### Scenario: Insufficient Stock
- GIVEN the user is linking an inventory item
- WHEN the requested quantity exceeds available stock
- THEN the system shows a warning and may prevent linking depending on inventory policy
