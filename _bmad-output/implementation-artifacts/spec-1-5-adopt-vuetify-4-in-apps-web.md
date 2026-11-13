---
title: 'Story 1.5: Adopt Vuetify 4 in apps/web'
type: 'feature'
created: '2026-11-12'
status: 'done'
baseline_commit: 'd5b3d8c5e4a7a9fd1297e2b46d0c79c7044da7ad'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The app shell is hand-written plain CSS (`AppButton`, `AppLayout`), but the owner chose Vuetify 4 (#23) so every later UI story (1.2, 1.3, 2.x, 4.x) builds from ready-made components. Until the shell moves, the next story would start on the old approach.

**Approach:** Install Vuetify 4 in `apps/web` only, register it tree-shaken with a light theme built from `tokens.css` and `@mdi/js` SVG icons, rebuild the sign-in and home screens with Vuetify components, delete the plain-CSS components, and extend the layer, unit, e2e and accessibility tests to hold the new rules.

## Boundaries & Constraints

**Always:** exact pins from the spine's Stack table (`vuetify` 4.3.3, `@mdi/js` 7.4.47; dev `vite-plugin-vuetify` 2.1.3, `@axe-core/playwright` 4.14.0), added to `apps/web/package.json` only. `tokens.css` stays the single source of brand colour, font, radius and spacing. `defaultTheme: 'light'`. CSS layers declared so app styles win without `!important`. Desktop viewport only (NFR-8).

**Never:** any other new dependency (including `sass`, `@mdi/font`, `vite-plugin-webfont-dl` or Roboto); icon fonts, web fonts or any CDN/third-party fetch at runtime; importing the whole Vuetify component set (`vuetify/components`, `vuetify/directives` wholesale); `vuetify` or `@mdi/js` outside `apps/web`; sign-in logic, route guards or auth wiring (Story 1.2); changes to rules, functions, `packages/*` or CI jobs beyond what tests need; editing `sprint-status.yaml` (the orchestrating session owns it).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Signed-out visit | `/sign-in` | Vuetify card with heading "Chhaap", lead text, disabled "Sign in with Google" `VBtn` | N/A |
| Home | `/` | `VApp` > `VAppBar` (banner, "Chhaap") + `VMain` with heading "Home" and "Nothing here yet." | N/A |
| Forbidden import | `vuetify` or `@mdi/js` imported from `functions/`, `packages/shared` or `packages/render` | `tests/layers.ts` reports a violation | Unit test fails |
| Allowed import | same imports inside `apps/web` | no violation | N/A |
| Accessibility | axe run on `/sign-in` and `/` | no serious or critical violations | e2e fails |

</frozen-after-approval>

## Code Map

- `apps/web/package.json` -- add the four pinned packages; nothing else changes.
- `apps/web/vite.config.ts` -- add `vuetify({ autoImport: true })` from `vite-plugin-vuetify` after `vue()`. `vitest.config.ts` merges this config, so tests get it too.
- `apps/web/src/main.ts` -- imports `tokens.css`, `base.css`, then creates the app with Pinia and the router. Add the Vuetify plugin here. Import Vuetify's styles (`vuetify/styles`) so its layers come before the app's.
- `apps/web/src/styles/tokens.css` -- `:root` custom properties (`--color-*`, `--font-*`, `--space-*`, `--radius`, …). Keep it as the source; the theme reads it.
- `apps/web/src/styles/base.css` -- global resets. Wrap it in an `@layer` that sits after Vuetify's layers.
- `apps/web/src/App.vue` -- only `<RouterView />`. Wrap it in `VApp`.
- `apps/web/src/views/SignInView.vue`, `HomeView.vue` -- rewrite with `VCard`/`VBtn` and `VAppBar`/`VMain`. Keep the same text, roles and the comment that Google sign-in lands in Story 1.2.
- `apps/web/src/layouts/AppLayout.vue`, `src/components/AppButton.vue` -- delete. Move the layout into a Vuetify-based layout or into `HomeView`, whichever stays simpler for Story 1.2's signed-in screens.
- `apps/web/src/__tests__/shell.spec.ts` -- mounts `App` with the router. Install Vuetify too (jsdom may need `ResizeObserver`/`matchMedia` stubs in a setup file). Drop the `AppButton` test.
- `apps/web/e2e/shell.spec.ts` -- keep both tests' assertions, which use roles and names. Add `e2e/a11y.spec.ts` using `@axe-core/playwright` with tags at serious/critical impact.
- `tests/layers.ts` / `tests/layers.test.ts` -- today only `@chhaap/*` and relative paths are checked; third-party packages are skipped. Add a small "restricted packages" rule: `vuetify` (and subpaths) and `@mdi/js` are allowed only in `apps/web`. Cover it with planted-violation tests.
- `AGENTS.md` -- the Styling section has a "until Story 1.5 merges" paragraph. Rewrite it to describe what was built.

## Tasks & Acceptance

**Execution:**
- [x] baseline -- run `npm run build` on the current tree and record the gzipped size of `apps/web/dist` JS and CSS in Implementation Notes -- needed for the PR.
- [x] `apps/web/package.json` -- install the four pinned packages -- NFR-6.
- [x] `apps/web/vite.config.ts` -- add `vite-plugin-vuetify` -- tree-shaking.
- [x] `apps/web/src/plugins/vuetify.ts` -- `createVuetify` with the `mdi-svg` icon set (aliases from `vuetify/iconsets/mdi-svg`), a `light` theme with colours read from `tokens.css`, and `defaultTheme: 'light'`; register it in `main.ts`.
- [x] `apps/web/src/styles/*.css`, `main.ts` -- declare the layer order (Vuetify first, then app base) and apply the token font, radius and spacing through Vuetify's CSS variables or defaults.
- [x] `App.vue`, `views/*.vue` -- move onto `VApp`, `VAppBar`, `VMain`, `VCard`, `VBtn`; delete `AppButton.vue` and `AppLayout.vue`.
- [x] `tests/layers.ts`, `tests/layers.test.ts` -- add the restricted-package rule and tests.
- [x] `apps/web/src/__tests__/shell.spec.ts` (+ setup if needed) -- mount with Vuetify; keep the screen assertions.
- [x] `apps/web/e2e/a11y.spec.ts` -- axe check of `/sign-in` and `/`.
- [x] after -- build again and record the gzipped sizes after; confirm only the components in use are in the bundle.
- [x] `AGENTS.md` -- Styling section matches what was built.

**Acceptance Criteria:**
- Given a production build, when the network panel of the built app is inspected, then no request leaves the app's origin (no fonts, icons or CDN assets).
- Given the built CSS, when the app's own rule and a Vuetify rule target the same element, then the app's rule wins without `!important`, because of the declared layer order.
- Given `npm run typecheck && npm run lint && npm run test:unit && npm run test:e2e`, then all pass, with e2e in Chromium, Firefox and WebKit.

## Implementation Notes

Plan: install the 4 pins in `apps/web`; `plugins/vuetify.ts` parses `--color-*` from `tokens.css?raw`; `vuetify/styles` imported first, `base.css` declares the layer order with a final `app` layer; `VApp` in `App.vue`, `VAppBar`/`VMain` in `HomeView`, `VCard`/`VBtn` in `SignInView`; restricted-package rule in `tests/layers.ts`; axe e2e. Risk: Vuetify CSS in jsdom (solved with `server.deps.inline`).

Bundle sizes (`gzip -c apps/web/dist/assets/*`):

| | JS raw / gzip | CSS raw / gzip |
| --- | --- | --- |
| Before (d5b3d8c) | 91,473 / 35,142 B | 2,815 / 1,003 B |
| After | 249,889 / 88,909 B | 245,220 / 36,640 B |

Only the components in use (plus their own dependencies) are bundled: VApp, VAppBar (+VToolbar), VMain, VContainer, VCard (+item/text/actions), VBtn (+VIcon, VProgressCircular). Checked absent: VDataTable, VDialog, VOverlay, VMenu, VTextField, VSelect, VTabs, VSnackbar, the ripple directive. Most of the CSS growth is `vuetify/styles` (core reset plus the colour and utility classes), which is imported whole as the spec says.

Decisions:
- `vitest.config.ts` got `server.deps.inline: ['vuetify']` (components import their CSS) and `css.include: [/tokens\.css/]` (so `?raw` returns the real text in tests). No `ResizeObserver`/`matchMedia` stubs were needed.
- The layout lives in `HomeView` (`VAppBar` + `VMain`); no separate layout component. Story 1.2 can lift it into a layout when it adds a second signed-in screen.
- Radius goes through the `app` layer (`.v-card, .v-btn:not(.v-btn--icon) { border-radius: var(--radius) }`), as Vuetify 4 hard-codes 4px rather than exposing a variable. Font goes through `--v-font-body`/`--v-font-heading`.
- Two e2e tests added beside the existing ones to hold the acceptance criteria: no request leaves the origin, and the app's radius and font win over VBtn's.

Handoff:
- Vuetify 4.3.3 + @mdi/js 7.4.47 (deps), vite-plugin-vuetify 2.1.3 + @axe-core/playwright 4.14.0 (dev) in `apps/web` only. Sign-in and home rebuilt on Vuetify; `AppButton.vue` and `AppLayout.vue` deleted. Theme parsed from `tokens.css`. Layer rule for `vuetify`/`@mdi/js` added to `tests/layers.ts`. AGENTS.md Styling section rewritten.
- Tests: `npm run typecheck` 0, `npm run lint` 0, `npm run test:unit` 54 passed, `npm run build` 0, `CI=1 npm run test:e2e` 18 passed (Chromium, Firefox, WebKit). `npm run test:rules` not run (unchanged area, needs Java emulators).
- Acceptance: no external requests (e2e + bundle grep: only XML namespace URIs) - met; app rule wins via layer order without `!important` (e2e radius/font) - met; all checks pass in 3 browsers - met.
- Open: the JS bundle grew by ~54 kB gzip and CSS by ~36 kB gzip, mostly Vuetify core and `vuetify/styles` utilities; worth noting in the PR.

## Spec Change Log

## Review Triage Log

Pass 1 (blind-hunter, edge-case-hunter, verification-gap).

| # | Finding | Verdict | Route | Evidence |
|---|---------|---------|-------|----------|
| 1 | `aria-labelledby` on `v-card` div loses the named region (blind, edge) | medium | patch | `v-card` renders a role-less `div`; ARIA prohibits naming generic elements. Fix: `tag="section"`. |
| 2 | `on-primary` mapping untested (gap, blind, edge) | medium | patch | `toMatchObject` omits `on-primary`; disabled button means axe skips contrast. |
| 3 | Radius rule in `app` layer overrides `rounded` props (edge) | medium | patch | `.rounded-*` live in `vuetify-utilities.helpers`, below `app`; moving the rule to `vuetify-overrides` lets utilities win. |
| 4 | `h1`-`h3` margin/line-height reset dropped (blind, edge) | low | patch | Vuetify's `vuetify-core.reset` zeroes only `html`/`body` margins; future h2/h3 get UA margins. |
| 5 | `--header-height`, `--color-accent-hover` orphaned (blind, edge) | low | patch | grep: no use outside `tokens.css`; editing them changes nothing. Direct deletion. |
| 6 | Focus ring on `v-btn` relies on layer order, untested (gap, blind) | medium | defer | No enabled focusable control until Story 1.2. |
| 7 | AGENTS.md mapping list omits `--color-accent-text` → `on-primary` (gap, blind) | low | defer | Agent-context file edits route to defer. |
| 8 | `parseColorTokens` breaks on extra blocks/comments in `tokens.css` (blind, edge) | low | reject | `tokens.css` is one flat `:root`; fix adds parsing branches for a hypothetical. |
| 9 | Non-hex token value reaches Vuetify (edge) | low | reject | All mapped tokens are hex today; guard adds complexity for an unreached case. |
| 10 | axe `incomplete` results ignored (edge) | low | reject | Asserting on needs-review items yields false failures; the concrete case is fixed by #1. |
| 11 | Restricted-package rule skips files outside workspaces (edge) | low | reject | Only root `tests/` lies outside; it legitimately has no reason to import Vuetify, and a guard adds a branch. |
| 12 | Restricted-package rule ignores CSS `@import` (edge) | low | reject | No CSS exists outside `apps/web`; adds a new scanner. |
| 13 | Shared signed-in layout removed (blind) | low | reject | Spec left layout placement to "whichever stays simpler"; one signed-in screen exists. Story 1.2 can extract it. |
| 14 | Theme maps only part of the palette; default dark theme registered (blind) | false | reject | `tokens.css` has no error/success/secondary tokens to map; `defaultTheme: 'light'` is the only one used. |
| 15 | `RESTRICTED_PACKAGES` rule undocumented (blind) | false | reject | AGENTS.md line 39 states it. |
| 16 | Hard-coded Vuetify layer names (blind) | false | reject | `vuetify/lib/styles/layers.css` declares exactly these five top-level layers; e2e radius/font test guards it. |
| 17 | External-origin e2e can stop before late requests (blind) | false | reject | Routes import views eagerly; no lazy chunks, fonts or sprites exist to request later. |
| 18 | `vitest` `css.include` may be a no-op (blind) | maybe-false | reject | Implementer reports `?raw` returned empty without it; would only be low (dead config). |
| 19 | a11y route list hard-coded; no mobile/dark run (blind) | low | reject | Desktop-only per NFR-8; light only; AGENTS.md tells authors to add screens. |
| 20 | Spec says radius/spacing via Vuetify vars, code uses plain CSS (edge) | low | reject | Spec allows "CSS variables or defaults"; radius via layered CSS meets the intent and the AC. |

## Design Notes

Theme from tokens without duplicating values: Vuetify needs concrete colour strings when it is created, so read them from `tokens.css` itself, for example `import tokens from './tokens.css?raw'` plus a small parser of `--color-*` declarations, with a unit test that the theme's `primary`, `background`, `surface` and `on-surface` match the token values. Map `--color-accent` to `primary`, `--color-bg` to `background`, `--color-surface` to `surface` and `--color-text` to `on-surface`/`on-background`. Font and radius go through CSS: set Vuetify's CSS variables or `.v-application` font-family to `var(--font-sans)` inside the app layer.

## Verification

**Commands:**
- `npm run typecheck` -- exit 0
- `npm run lint` -- exit 0
- `npm run test:unit` -- all pass, including the new layer and theme tests
- `npm run build && CI=1 npm run test:e2e` -- shell and axe tests pass in 3 browsers
- `gzip -c` over `apps/web/dist/assets/*.{js,css}` -- before and after sizes recorded
