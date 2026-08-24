</SDD Spec Phase Executor>
<Work Orders List Specification>
## Purpose
Provides a primary business screen displaying a table of work orders fetched from the live database.

## Requirements

### Requirement: Display Orders Table
The system MUST render a full-page table at the `/orders` route displaying data from the `work_orders` table joined with the `customers` table.

#### Scenario: Rendering columns
- GIVEN a user navigates to `/orders`
- WHEN the page loads
- THEN the table displays columns for Order #, Customer Name, Device (Brand & Model), Status, and Estimated Delivery Date.

#### Scenario: Empty state
- GIVEN there are no work orders in the database
- WHEN the `/orders` page is loaded
- THEN the table renders an empty state with no mock rows.

#### Scenario: Populated state
- GIVEN there are work orders assigned to the current branch
- WHEN the `/orders` page is loaded
- THEN the table displays a row for each work order with its actual data.
