<Proposal: Neumorphic Redesign>
## Intent
Transition the application's visual aesthetics from a flat, border-based design (standard Shadcn UI) to a "Neumorphism" (Soft UI) style. This change will overhaul the CSS variables, custom Tailwind utilities, and core components to support depth through shadows instead of borders, prioritizing Light mode while fully supporting Dark mode.

## Scope

### In Scope
- Overhaul CSS variables in `apps/web/src/index.css` (or `globals.css`) to define neumorphic color palettes (e.g., specific off-white/gray for light mode, dark gray for dark mode).
- Create custom Tailwind utilities/classes for neumorphic shapes: flat, pressed/inset, and convex.
- Modify core Shadcn components (`Card`, `Button`, `Input`) to use neumorphic shadows and borderless surfaces.
- Ensure `DashboardLayout` and existing pages adapt to the new style without breaking functionality.

### Out of Scope
- Redesigning the underlying logic or behavior of the application components.
- Completely swapping out Shadcn UI for another component library.
- Overhauling mobile-specific navigation beyond current responsive designs.

## Capabilities

### New Capabilities
- `neumorphic-theme-utilities`: Introduction of custom Tailwind utilities for rendering neumorphic effects (flat, pressed, convex) and depth.

### Modified Capabilities
- `frontend_design`: Updating the core theme definition and aesthetics from flat/border-based Zinc to borderless Neumorphic styles.
- `shadcn-core-components`: Overriding the standard Shadcn UI aesthetic for Card, Button, and Input components.

## Approach
We will begin by defining the primary neumorphic color tokens (backgrounds and shadow colors) for both light and dark themes using CSS variables in the global stylesheet. Next, we will extend the Tailwind configuration to introduce utilities for neumorphism (e.g., `.neu-flat`, `.neu-pressed`). Finally, we will apply these utilities to the core Shadcn components and ensure the `DashboardLayout` properly reflects the new design system.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/web/src/index.css` or `globals.css` | Modified | Overhaul of CSS variables for neumorphic color palettes and themes. |
| `apps/web/tailwind.config.ts` | Modified | Addition of custom Tailwind plugins/utilities for neumorphism. |
| `apps/web/src/components/ui/card.tsx` | Modified | Update styling to use neumorphic shadows instead of borders. |
| `apps/web/src/components/ui/button.tsx` | Modified | Update styling to support convex and pressed states. |
| `apps/web/src/components/ui/input.tsx` | Modified | Update styling to use inset shadows for a pressed look. |
| `apps/web/src/components/layouts/DashboardLayout.tsx` | Modified | Adapt layout backgrounds and containers to neumorphic design. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Accessibility (Contrast) | High | Ensure neumorphic shadow colors provide enough contrast against the background; test with a11y tools. |
| Visual inconsistencies | Medium | Apply changes systematically via Tailwind utilities and core components rather than inline styles. |
| Breakage in dark mode | Medium | Test all neumorphic utilities explicitly in dark mode to ensure shadows don't look inverted or muddy. |

## Rollback Plan
Since the changes are mostly CSS and component-level aesthetic updates, a rollback can be achieved by reverting the commits that affect `globals.css`, `tailwind.config.ts`, and the modified `ui/` components.

## Dependencies
- Tailwind CSS
- Existing Shadcn UI components

## Success Criteria
- [ ] Global stylesheet correctly defines neumorphic variables for light and dark modes.
- [ ] Core components (Card, Button, Input) exhibit neumorphic depth (shadows instead of borders).
- [ ] Dashboard layout visually aligns with the neumorphic style.
- [ ] Both Light and Dark modes function without visual breakage or unreadable contrast.
