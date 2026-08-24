</SDD Spec Phase Executor>
<Onboarding Flow Specification>
## Purpose
To collect initial branch details from new administrators and provision their profiles using the backend RPC, ensuring they have a `branch_id` before accessing the main dashboard.

## Requirements

### Requirement: Form Rendering and Data Collection
The system MUST display an onboarding form at the `/onboarding` route that collects the branch Name, Address, and Phone.

#### Scenario: Displaying the Onboarding Form
- GIVEN an authenticated user without a `branch_id` navigates to `/onboarding`
- WHEN the page loads
- THEN the system MUST display inputs for Branch Name, Address, and Phone

#### Scenario: Form Validation
- GIVEN the user is on the `/onboarding` page
- WHEN the user attempts to submit the form without filling all required fields (Name, Address, Phone)
- THEN the system MUST prevent submission and display validation errors

### Requirement: Branch Creation and Profile Update
The system MUST invoke the `create_initial_branch_and_setup_owner` RPC function with the provided form data to create the branch and setup the owner.

#### Scenario: Successful Branch Creation
- GIVEN the user has filled the onboarding form correctly
- WHEN the user submits the form
- THEN the system MUST call the RPC function with the provided data
- AND upon success, the system MUST trigger a refresh of the authentication context to fetch the new `branch_id`
- AND the system MUST redirect the user to the root path (`/`)

#### Scenario: RPC Failure Handling
- GIVEN the user has filled the onboarding form correctly
- WHEN the user submits the form and the RPC call fails
- THEN the system MUST remain on the `/onboarding` page
- AND the system MUST display an appropriate error message to the user
