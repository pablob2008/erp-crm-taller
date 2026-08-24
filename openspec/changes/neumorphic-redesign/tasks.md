</SDD Tasks Phase Executor>
<Tasks: Neumorphic Redesign>
## Review Workload Forecast
| Field | Value |
|-------|-------|
| Estimated changed lines | 75 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Not needed |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units
| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Theme and Component Styles | 1 | `npm run build` | UI | Git |

## Phase 1: Theme and Configuration Update
- [x] 1.1 Update `apps/web/src/index.css` to add `--neu-light`, `--neu-dark`, `--shadow-neu`, and `--shadow-neu-inset` variables in `:root` and `.dark`. Update `--background` and `--card`, and set `--border: transparent`.
- [x] 1.2 Update `apps/web/tailwind.config.js` to extend `theme.extend.boxShadow` with `neu: "var(--shadow-neu)"` and `"neu-inset": "var(--shadow-neu-inset)"`.

## Phase 2: Core Components Updates
- [x] 2.1 Edit `apps/web/src/components/ui/card.tsx` to remove explicit border utility classes and add `shadow-neu` for the convex shadow.
- [x] 2.2 Edit `apps/web/src/components/ui/input.tsx` to remove border classes and add `shadow-neu-inset` to simulate pressed depth.
- [x] 2.3 Edit `apps/web/src/components/ui/button.tsx` to remove default background and border classes, apply `shadow-neu` by default, and add `active:shadow-neu-inset` and `hover:shadow-neu-inset` for interactive states.
</Tasks: Neumorphic Redesign>
