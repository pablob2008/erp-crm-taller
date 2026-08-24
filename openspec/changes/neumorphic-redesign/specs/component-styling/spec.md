</Component Styling Specification>
<Delta for Component Styling>
## ADDED Requirements

### Requirement: Neumorphic Card Styling
The system MUST render Card components using a default convex or flat neumorphic shadow without traditional borders.

#### Scenario: Rendering a standard Card
- GIVEN a standard Card component
- WHEN the Card is rendered on the screen
- THEN it MUST display a convex outer shadow
- AND it MUST NOT display a solid border

### Requirement: Neumorphic Input Styling
The system MUST render Input components using an inset neumorphic shadow to appear pressed into the surface.

#### Scenario: Rendering a text Input
- GIVEN an Input component
- WHEN the Input is rendered on the screen
- THEN it MUST display an inset inner shadow
- AND it MUST NOT display a traditional solid border

### Requirement: Neumorphic Button Interactive Styling
The system MUST render Button components with a convex shadow by default, and change to an inset shadow when pressed or active.

#### Scenario: Default Button state
- GIVEN a standard Button component
- WHEN the Button is rendered in its default state
- THEN it MUST display a convex outer shadow

#### Scenario: Pressed Button state
- GIVEN a standard Button component
- WHEN the user clicks or presses the Button
- THEN the Button MUST transition to displaying an inset inner shadow
</Delta for Component Styling>
