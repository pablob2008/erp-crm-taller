</Theme Tokens Specification>
<Delta for Theme Tokens>
## ADDED Requirements

### Requirement: Neumorphic Background Variables
The system MUST define CSS variables for background colors that support neumorphic blending in both light and dark modes.

#### Scenario: Light mode background colors
- GIVEN the application is in light mode
- WHEN the global stylesheet is loaded
- THEN the background CSS variable MUST define an off-white or light gray color suitable for neumorphic shadows

#### Scenario: Dark mode background colors
- GIVEN the application is in dark mode
- WHEN the global stylesheet is loaded
- THEN the background CSS variable MUST define a dark gray color suitable for neumorphic shadows

### Requirement: Neumorphic Shadow Variables
The system MUST define dual shadow CSS variables (light and dark shadows) for creating depth in both themes.

#### Scenario: Light mode dual shadows
- GIVEN the application is in light mode
- WHEN a component requires a neumorphic shadow
- THEN the system MUST provide variables for a light (highlight) shadow and a dark (drop) shadow

#### Scenario: Dark mode dual shadows
- GIVEN the application is in dark mode
- WHEN a component requires a neumorphic shadow
- THEN the system MUST provide variables for a subtle highlight shadow and a deep drop shadow
</Delta for Theme Tokens>
