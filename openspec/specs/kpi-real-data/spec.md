</SDD Spec Phase Executor>
<KPI Real Data Specification>
## Purpose
Displays live key performance indicators (KPIs) on the dashboard using real data queried from the Supabase backend.

## Requirements

### Requirement: Live Data Querying
The system MUST query live data from the `work_orders`, `purchases`, and `cash_movements` tables to calculate KPI values.

#### Scenario: Empty database
- GIVEN the database is completely empty
- WHEN the dashboard is loaded
- THEN all KPI cards display a value of `0`.

#### Scenario: Populated database
- GIVEN the database contains real transaction data
- WHEN the dashboard is loaded
- THEN the KPI cards display accurately calculated totals based on the active branch data.

### Requirement: Real-time or Load-time Data
The system SHOULD fetch these metrics upon component mount.

#### Scenario: Loading state
- GIVEN the dashboard is loading data from Supabase
- WHEN the data is being fetched
- THEN a loading indicator or skeleton is shown on the KPI cards.
