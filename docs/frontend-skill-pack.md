# Frontend Skill Pack

This file captures the best external skills found via `npx skills find` for Fit Check frontend work, and maps them to the parts of this repo where they should be applied.

## Selected skills

### 1) `anthropics/skills@frontend-design`
- Install:
```bash
npx skills add anthropics/skills@frontend-design
```
- Why: strong default for modern UI architecture, interaction polish, and component-level design execution.
- Use in this repo:
  - `components/OnboardingQuestionnaire.tsx`
  - `components/OnboardingQuickStartFeed.tsx`
  - `components/SingleSwapGuide.tsx`
  - `components/PromptBar.tsx`

### 2) `wshobson/agents@tailwind-design-system`
- Install:
```bash
npx skills add wshobson/agents@tailwind-design-system
```
- Why: practical token and Tailwind systemization patterns that match this codebase stack.
- Use in this repo:
  - shared token conventions in `app/globals.css` (or equivalent global styles)
  - repeated card/layout patterns across `components/*`
  - consistent spacing, radius, elevation, and state classes in onboarding + gallery flows

### 3) `wshobson/agents@design-system-patterns`
- Install:
```bash
npx skills add wshobson/agents@design-system-patterns
```
- Why: scales UI rules into reusable component patterns and avoids visual drift.
- Use in this repo:
  - standardize card variants for upload states
  - standardize CTA hierarchy in top bars and floating action areas
  - define naming conventions for component variants and visual states

### 4) `addyosmani/web-quality-skills@accessibility`
- Install:
```bash
npx skills add addyosmani/web-quality-skills@accessibility
```
- Why: keeps UI upgrades compliant with keyboard/focus/contrast requirements.
- Use in this repo:
  - all upload/dropzone controls
  - onboarding modal and quick-start actions
  - gallery folder interactions and context actions

## Optional extras

### 5) `kimny1143/claude-code-template@ui-ux-pro-max`
- Install:
```bash
npx skills add kimny1143/claude-code-template@ui-ux-pro-max
```
- Why: broader UX heuristics and conversion-oriented UI review patterns.
- Best used for:
  - onboarding conversion flow audits
  - reducing drop-off from first input to first generation

## Search evidence used

Commands run:
- `npx skills find "frontend design"`
- `npx skills find "design system"`
- `npx skills find "web accessibility"`
- `npx skills find "ui ux review"`

## Adoption order for Fit Check

1. Install `frontend-design` + `tailwind-design-system` first.
2. Apply `design-system-patterns` while refactoring repeated UI blocks.
3. Run `accessibility` checks as a gate on each UI PR.
4. Use `ui-ux-pro-max` for periodic conversion audits.

