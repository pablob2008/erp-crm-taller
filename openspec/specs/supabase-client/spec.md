</SDD Spec Phase Executor>
<Supabase Client Specification>
## Purpose
Provides a single, typed instance of the Supabase client initialized from environment variables to interact with the database and authentication services.

## Requirements

### Requirement: Initialization
The system MUST initialize the Supabase client using environment variables for the URL and anonymous key.

#### Scenario: Client creation
- GIVEN the application starts
- WHEN `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are provided in the environment
- THEN a singleton instance of the Supabase client is created and exported.

### Requirement: Type Safety
The system SHOULD generate and provide TypeScript definitions for the Supabase database schema to ensure type-safe interactions.

#### Scenario: Using the client
- GIVEN a developer imports the Supabase client
- WHEN querying the database
- THEN autocomplete and type checking are available based on the schema.
