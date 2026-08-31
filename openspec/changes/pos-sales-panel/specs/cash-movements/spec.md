## Purpose
Track and manage all cash flow activities including income and expenses, ensuring accurate register balance.

## MODIFIED Requirements

### Requirement: Sales Integration
The system SHALL support automatic linking of cash movements to completed sales.

#### Scenario: Linking Cash Movement to Sale
- **GIVEN** a checkout is completed in the POS panel
- **WHEN** a new cash movement is created for the income
- **THEN** the cash movement MUST be automatically linked to the corresponding `sales` record.

### Requirement: Quick Expense Registration
The system SHALL support quick expense registration through fast actions.

#### Scenario: Quick Expense Creation from POS
- **GIVEN** an expense is registered via the POS "Registrar Gasto" fast action
- **WHEN** the modal is submitted
- **THEN** a new `cash_movements` record MUST be created with the specified amount and description, reducing the register balance.
