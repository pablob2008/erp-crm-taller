</onboarding-flow Specification>
<Delta for onboarding-flow>
## MODIFIED Requirements
### Requirement: Restrict Onboarding Access
The system MUST only allow access to the onboarding flow if no branches exist in the global database.
(Previously: The system MUST allow a newly registered user to create a branch.)

#### Scenario: User accesses onboarding when no branches exist
- GIVEN the `branches` table is empty
- WHEN a user attempts to access the `/onboarding` page
- THEN the page MUST render the onboarding form to create the initial branch

#### Scenario: User accesses onboarding when branches exist
- GIVEN the `branches` table contains at least one branch
- WHEN a user attempts to access the `/onboarding` page
- THEN the user MUST be redirected away (to `/pending-approval` if no branch assigned, or dashboard if branch assigned)
</Delta for onboarding-flow>
