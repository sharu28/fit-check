# Fit Check Agent Rules

## UI and Design Harness

Apply these rules to every UI/design task unless the user explicitly opts out.

### Required workflow
1. Propose 2-3 distinct visual directions before implementation.
2. Ask for direction selection when multiple options exist.
3. Implement only the selected direction.
4. Ship responsive behavior for mobile and desktop in the same change.

### Visual system rules
- Do not use default-looking UI (generic gray cards, flat layouts, weak hierarchy).
- Define and use explicit design tokens for color, spacing, radius, typography, and shadows.
- Keep one coherent visual language per page. Do not mix unrelated styles.
- Prefer clear hierarchy: one dominant heading, one primary action, and controlled secondary actions.
- Respect existing app patterns when editing existing screens.

### Accessibility gates (must pass)
- Keyboard navigation works for all interactive elements.
- Visible focus styles are present and consistent.
- Text and controls meet WCAG contrast expectations.
- Inputs and controls have accessible labels/names.

### Quality gates for UI changes
- Capture fresh local screenshots before confirming a UI change.
- Include before/after screenshots or equivalent visual proof in the PR/task output.
- Do not mark UI work complete until screenshot review confirms no overlap, clipping, or spacing regressions.
- Run type-check for UI-impacting changes: `npx tsc --noEmit`.
- If visual test tooling exists, run it. If not, provide a manual visual checklist.

### Prompting discipline
- Use concrete constraints in prompts (target audience, visual tone, spacing density, color intent).
- Prefer short iterative passes over single large rewrites.
- When changing the steering rules, note why and what behavior should change.
