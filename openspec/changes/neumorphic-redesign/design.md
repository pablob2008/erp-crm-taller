</SDD Design Phase Executor>
<Design: Neumorphic Redesign>
## Technical Approach
Transition the application from a traditional flat, border-driven Shadcn UI design to a Neumorphic (soft UI) design. This involves updating global CSS variables for colors (using off-white for light mode and dark gray for dark mode), introducing custom CSS variables for light and dark drop shadows, and configuring Tailwind with new `shadow-neu` and `shadow-neu-inset` utilities. Finally, the core Shadcn components (Card, Button, Input) will be updated to remove borders and utilize these new shadow classes to simulate depth (convex and inset shapes).

## Architecture Decisions

### Decision: Shadow Implementation Strategy
**Choice**: Define shadow tokens as CSS variables in `index.css` (`--shadow-neu`, `--shadow-neu-inset`) and map them in `tailwind.config.js` (`boxShadow.neu`, `boxShadow['neu-inset']`).
**Alternatives considered**: Hardcoding box-shadow values directly in Tailwind config or using an external Neumorphism Tailwind plugin.
**Rationale**: Using CSS variables allows us to dynamically switch shadow colors between light and dark modes without needing arbitrary Tailwind dark-mode variants on every component instance.

### Decision: Global Border Handling
**Choice**: Set the `--border` CSS variable to `transparent` (or match `--background`) in `index.css` and remove explicit border utility classes from core components.
**Alternatives considered**: Removing `border-border` from the global `*` selector or stripping border classes from all components individually without modifying the variable.
**Rationale**: Shadcn relies heavily on the `--border` variable. Setting it to `transparent` prevents legacy borders from reappearing while maintaining structural integrity. Removing borders from core components explicitly guarantees the neumorphic illusion isn't broken.

## Data Flow
```text
[Theme Provider (Light/Dark)] 
      │
      ▼
[index.css] 
  │  (Injects --background, --neu-light, --neu-dark variables)
  │
  ▼
[tailwind.config.js] 
  │  (Maps CSS variables to shadow-neu, shadow-neu-inset classes)
  │
  ▼
[UI Components (Button, Card, Input)] 
     (Apply shadow utilities and state modifiers e.g., active:shadow-neu-inset)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/index.css` | Modify | Update HSL colors to soft gray/dark gray, set `--border` to transparent, and add `--shadow-neu` and `--shadow-neu-inset` variables for both themes. |
| `apps/web/tailwind.config.js` | Modify | Extend `boxShadow` theme to include `neu` and `neu-inset` utilizing the new CSS variables. |
| `apps/web/src/components/ui/card.tsx` | Modify | Remove `border`, add `shadow-neu` default class. |
| `apps/web/src/components/ui/button.tsx` | Modify | Remove default background/border, apply `shadow-neu`, and `active:shadow-neu-inset`. |
| `apps/web/src/components/ui/input.tsx` | Modify | Remove default border, add `shadow-neu-inset` class to simulate pressed depth. |

## Interfaces / Contracts
```css
/* index.css variables addition */
:root {
  --background: 215 20% 90%; /* #e0e5ec */
  --card: 215 20% 90%;
  --border: transparent;
  --neu-light: #ffffff;
  --neu-dark: #a3b1c6;
  --shadow-neu: 5px 5px 10px var(--neu-dark), -5px -5px 10px var(--neu-light);
  --shadow-neu-inset: inset 5px 5px 10px var(--neu-dark), inset -5px -5px 10px var(--neu-light);
}

.dark {
  --background: 240 9% 13%; /* #1e1e24 */
  --card: 240 9% 13%;
  --border: transparent;
  --neu-light: #2c2c35;
  --neu-dark: #101013;
  --shadow-neu: 5px 5px 10px var(--neu-dark), -5px -5px 10px var(--neu-light);
  --shadow-neu-inset: inset 5px 5px 10px var(--neu-dark), inset -5px -5px 10px var(--neu-light);
}
```

```javascript
// tailwind.config.js modifications
module.exports = {
  theme: {
    extend: {
      boxShadow: {
        neu: "var(--shadow-neu)",
        "neu-inset": "var(--shadow-neu-inset)",
      }
    }
  }
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Visual | Light & Dark Mode Contrast | Manually test Card, Button, and Input on a page, verifying that convex/inset shadows render clearly in both modes. |
| Visual | Interaction States | Click buttons to verify transition from `shadow-neu` to `shadow-neu-inset` on `:active`. |

## Threat Matrix
N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout
No migration required. This is a purely aesthetic drop-in replacement that modifies standard UI components. Existing usage of `Card`, `Button`, and `Input` throughout the app will instantly inherit the neumorphic redesign.

## Open Questions
- None.
</Design: Neumorphic Redesign>
