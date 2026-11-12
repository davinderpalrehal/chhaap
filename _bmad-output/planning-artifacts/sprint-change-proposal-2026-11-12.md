---
title: 'Sprint Change Proposal: adopt Vuetify 4 as the UI component library'
date: '2026-11-12'
trigger: 'GitHub issue #23 (owner decision), follow-on story #24'
scope: Minor
mode: Batch
status: approved
approved: '2026-11-12'
---

# Sprint Change Proposal — Adopt Vuetify 4

## 1. Issue Summary

**Trigger.** Story 1.1 (#20, merged in PR #22) picked plain CSS for `apps/web`: design tokens in `tokens.css`, `base.css`, scoped styles and two shared components (`AppButton`, `AppLayout`). The spine's Deferred section and `AGENTS.md` record that choice.

**Change.** The owner wants a full Vue component library, so that every UI element comes ready-made, and has chosen **Vuetify 4** (issue #23). This is a new requirement from the stakeholder, not a defect in Story 1.1.

**Reason (owner).** Vuetify 4 ships every component Epics 1, 2 and 4 need: form inputs with validation messages, selects, a colour picker (Story 2.3), a file input (Story 2.4), a data table with search (Stories 1.3, 2.6), dialogs (Stories 4.3, 4.4), snackbars and alerts, tabs and a timeline (Story 4.1). It is MIT-licensed with no paid tier, actively maintained (4.3.3 published 2026-11-09), supports Vue `^3.5`, and tree-shakes through `vite-plugin-vuetify`.

**Comparison report.** The owner chose not to produce one. #23's acceptance check for a report under `research/` is dropped, and #24's link to the non-existent research file is removed.

**Evidence.**
- Issue #23 (In Progress) and #24 (Todo) on the Chhaap Project board.
- `apps/web` today has 231 lines of plain-CSS UI (`tokens.css`, `base.css`, `AppButton.vue`, `AppLayout.vue`, `SignInView.vue`, `HomeView.vue`), so switching now costs little. Switching after Epic 2 would mean rework.
- `vuetify@4.3.3` lists `vue: ^3.5.0 || ^3.6.0-0` and `vite-plugin-vuetify: >=2.1.0` as peers, which match the pinned stack.

## 2. Impact Analysis

### Epic impact

| Epic | Impact |
| --- | --- |
| Epic 1 | **New Story 1.5: Adopt Vuetify 4 in apps/web** (#24). It is built right after 1.1 and before 1.2, so 1.2 and 1.3 use Vuetify from the start. Story 1.1 stays done; its styling decision is noted as superseded. |
| Epic 2 | No AC changes. Stories 2.1 and 2.3 to 2.8 build with Vuetify components. |
| Epic 3 | No change. The redirect (`functions/src/redirect`, AD-9) must never import Vuetify, which the layer test enforces. |
| Epic 4 | No AC changes. Stories 4.1 to 4.4 build with Vuetify components. |
| Epic 5 | None. |

No epic becomes obsolete and none is added. Epic order is unchanged. Inside Epic 1 the build order becomes **1.1 → 1.5 → 1.2 → 1.3 → 1.4**.

### Artifact conflicts

| Artifact | Status | Change |
| --- | --- | --- |
| PRD | N/A | No conflict. NFR-6 is met by naming and justifying the new dependencies in the spine. NFR-8 (desktop only) is unchanged. |
| SPEC | N/A | No conflict. |
| UX design | N/A | No UX documents exist. |
| Architecture spine | Action | Stack table gains four rows. A UI convention row is added. The Deferred bullet is rewritten. `updated` date changes. |
| `AGENTS.md` | Action | Styling section rewritten. Layer rules mention Vuetify. |
| `epics.md` | Action | Pinned stack and deferred list updated. UX Design Requirements updated. Note on Story 1.1. New Story 1.5. |
| `sprint-status.yaml` | Action | Add `1-5-adopt-vuetify-4-in-apps-web: backlog`. Correct `1-1` from `review` to `done` (PR #22 is merged). |
| `epic-1-context.md` | Action | The "styling undecided" line is stale; point it to Vuetify and Story 1.5. |
| GitHub #23, #24 and `_tasks/chhaap/23.md` | Action | Drop the research-report check; remove #24's link to the missing research file. |

### Technical impact

- New runtime dependencies in `apps/web` only: `vuetify`, `@mdi/js`. New dev dependencies: `vite-plugin-vuetify`, `@axe-core/playwright`.
- The bundle grows. #24 records gzipped JS and CSS before and after.
- No change to data, rules, commands, the render core or the redirect. CI is unchanged apart from the new tests in #24.

## 3. Recommended Approach

**Direct Adjustment.** Record the decision in the planning documents now (#23) and add one story (#24) that moves the existing shell onto Vuetify before any other UI story.

- **Rollback** of Story 1.1 isn't needed. Its monorepo, emulators, rules, tests and CI all stand, and only the 231 lines of shell UI change.
- **MVP review** isn't needed. Scope and goals are unchanged.
- **Effort:** #23 is a docs-only PR. #24 is about one story.
- **Risk:** low. The main risks are bundle size, which tree-shaking and #24's size check cover, and Vuetify's styles overriding the app's, which #24 handles by declaring CSS layers.
- **Timeline:** no change to the epic plan. #24 must merge before Story 1.2 starts.

## 4. Detailed Change Proposals

### 4.1 Architecture spine — `ARCHITECTURE-SPINE.md`

**Frontmatter**

```
OLD: updated: '2026-11-10'
NEW: updated: '2026-11-12'
```

**Stack table — add after the `Playwright` row**

```
NEW:
| Vuetify (`apps/web` only) | 4.3.3 — the UI component library (#23). Ships the inputs, selects, colour picker, file input, data table, dialogs, snackbars, tabs and timeline Epics 1–4 need; MIT, no paid tier, actively maintained, supports Vue ^3.5, tree-shakes. |
| vite-plugin-vuetify (dev, `apps/web` only) | 2.1.3 — imports only the Vuetify components in use. |
| @mdi/js (`apps/web` only) | 7.4.47 — Material Design icons as SVG path strings, bundled with the app, so no icon font or CDN fetch. The package is data only, so its slow release cadence is low risk. |
| @axe-core/playwright (dev) | 4.14.0 — accessibility checks in the Playwright e2e tests. |
```

Rationale: NFR-6 requires every new dependency to be named and justified in the spine before it is added. #24 then installs exactly these versions, or the latest 4.x patch if it bumps the row in its PR.

**Consistency Conventions — add a row after `Tests`**

```
NEW:
| UI | Vuetify components only in `apps/web`; no other package or function imports `vuetify` (enforced by `tests/layers.ts`). The theme is built from `apps/web/src/styles/tokens.css`, with `defaultTheme: 'light'`. Icons are `@mdi/js` SVGs. No font, icon or other asset is fetched from a CDN or third party at runtime. The app's own styles win over Vuetify's through CSS layers, never `!important`. |
```

**Deferred — replace the UI bullet**

```
OLD:
- **UI component library and styling.** Decided in Story 1.1: plain CSS. One global stylesheet of tokens (CSS custom properties, `apps/web/src/styles/tokens.css`) plus `base.css`, scoped SFC styles, and a few shared components (`AppButton`, `AppLayout`). No component library and no new dependency, because the app is a small desktop-only team tool and the UX work can restyle it through the tokens.

NEW:
- **UI component library and styling.** Decided in #23 (2026-11-12): **Vuetify 4**, replacing Story 1.1's plain CSS. The owner wanted every UI element ready-made, and Vuetify covers all the components Epics 1–4 need (see Stack). The tokens in `apps/web/src/styles/tokens.css` stay as the single source of brand colour, font, radius and spacing, and feed the Vuetify theme. Story 1.5 (#24) installs it and moves the app shell onto it before Story 1.2.
```

### 4.2 `AGENTS.md`

**Layout and layer rules — add a bullet after the `apps/web` bullet**

```
NEW:
- Only `apps/web` imports `vuetify` or `@mdi/js`. `tests/layers.ts` fails on any other import of them.
```

**Styling — replace the section body**

```
OLD:
Plain CSS, no component library. Design tokens are CSS custom properties in `apps/web/src/styles/tokens.css`, global resets in `base.css`, and each component uses scoped styles built on those tokens. Reuse the shared components (`AppButton`, `AppLayout`) before writing new ones. Why: Chhaap is a small, desktop-only team tool. Plain CSS adds no dependency (NFR-6), and later UX work can restyle everything through the tokens. The decision is also recorded in the spine's Deferred section.

NEW:
Vuetify 4 is the component library (decided in #23; installed by Story 1.5, #24). Build every UI element from Vuetify components before writing a custom one. The brand tokens in `apps/web/src/styles/tokens.css` stay the single source of colour, font, radius and spacing, and feed the Vuetify theme. Icons come from `@mdi/js` as SVGs; never add an icon font or load assets from a CDN. Keep custom styles in scoped SFC styles on top of the tokens; the app's styles win through CSS layers, never `!important`. Why: the owner wants every UI element ready-made, and Vuetify covers everything Epics 1–4 need. The decision and its justification are in the spine's Stack table and Deferred section.

Until Story 1.5 merges, the shell still uses the plain-CSS components (`AppButton`, `AppLayout`). Story 1.5 removes them and updates this section to match what was built.
```

### 4.3 `epics.md`

**Additional Requirements — Pinned stack (line 59), append**

```
OLD: ... Vitest 5.1.0, @firebase/rules-unit-testing 6.0.0, Playwright 1.65.0.
NEW: ... Vitest 5.1.0, @firebase/rules-unit-testing 6.0.0, Playwright 1.65.0. UI (added by #23): Vuetify 4.3.3, vite-plugin-vuetify 2.1.3, @mdi/js 7.4.47, @axe-core/playwright 4.14.0, all in `apps/web` only.
```

**Additional Requirements — Deferred to epic level (line 75)**

```
OLD: ...; app domain; UI component library and styling (no UX docs).
NEW: ...; app domain. (UI component library: decided in #23, Vuetify 4; see Story 1.5.)
```

**UX Design Requirements (line 80)**

```
OLD: None. No UX design contract exists for Chhaap. UI decisions (component library, styling, layout) are deferred to the stories themselves, within NFR-8 (desktop browsers only).
NEW: No UX design contract exists for Chhaap. The component library is Vuetify 4 (#23), adopted in Story 1.5; every UI story builds with Vuetify components and the brand tokens. Layout decisions stay with the stories themselves, within NFR-8 (desktop browsers only).
```

**Story 1.1 — append after its styling criterion (after line 170)**

```
NEW:
> **Superseded (2026-11-12, #23):** the plain-CSS choice made here is replaced by Vuetify 4. Story 1.5 moves the app shell onto it.
```

**New Story 1.5 — insert after Story 1.1 (before Story 1.2), with an ordering note**

```
NEW:
### Story 1.5: Adopt Vuetify 4 in apps/web

> Build order: right after Story 1.1 and before Story 1.2, so every later UI story builds with Vuetify. Tracked as #24.

As a developer on Chhaap,
I want Vuetify 4 installed in `apps/web` and the app shell moved onto it,
So that every later UI story builds from ready-made, accessible components instead of hand-written ones.

**Acceptance Criteria:**

**Given** the spine's Stack table names `vuetify`, `@mdi/js`, `vite-plugin-vuetify` and `@axe-core/playwright` with their versions
**When** they are installed
**Then** they are added to `apps/web` only, pinned exactly, and no other dependency is added (NFR-6)

**Given** `apps/web`
**When** Vuetify is registered
**Then** it uses `createVuetify` with tree-shaking through `vite-plugin-vuetify`, and nothing imports the whole component set

**Given** `apps/web/src/styles/tokens.css`
**When** the Vuetify theme is built
**Then** brand colours, font, radius and spacing come from the tokens, `defaultTheme` is `light`, and Vuetify's CSS layers are declared so the app's own styles win without `!important`

**Given** any icon in the app
**When** the built app runs
**Then** it is an `@mdi/js` SVG bundled with the app, and no icon font, web font or other asset is fetched from a CDN or third party

**Given** the app shell
**When** this story is done
**Then** `SignInView`, `HomeView` and the layout use Vuetify components (for example `VApp`, `VAppBar`, `VMain`, `VBtn`, `VCard`), and `AppButton` and `AppLayout` are removed

**Given** `tests/layers.ts`
**When** the unit tests run
**Then** they fail if anything outside `apps/web` imports `vuetify` or `@mdi/js`; `functions/src/redirect` (AD-9) and `packages/*` never import them

**Given** the test suites
**When** they run
**Then** Vitest component tests mount with Vuetify installed (jsdom), and the Playwright shell tests pass in Chromium, Firefox and WebKit at a desktop viewport (NFR-8)

**Given** the production build
**When** it is compared with the build before this story
**Then** the gzipped JS and CSS size of `apps/web/dist` before and after is recorded in the PR, and only the components in use are bundled

**Given** the sign-in screen and the app shell
**When** an `@axe-core/playwright` check runs
**Then** it reports no serious or critical violations

**And** `AGENTS.md`'s Styling section matches what was built, and type-check, lint, unit, rules and e2e tests pass on CI
```

### 4.4 `sprint-status.yaml`

```
OLD:
  1-1-set-up-the-project-skeleton: review
  1-2-sign-in-with-google-limited-to-the-team-allowlist: backlog

NEW:
  1-1-set-up-the-project-skeleton: done
  1-5-adopt-vuetify-4-in-apps-web: backlog  # build before 1-2 (#24)
  1-2-sign-in-with-google-limited-to-the-team-allowlist: backlog
```

Plus `last_updated` set to the edit time. Rationale: PR #22 merged, so 1.1 is done. Listing 1.5 above 1.2 makes the build order visible to `bmad-build` and the loop.

### 4.5 `epic-1-context.md`

```
OLD: - Styling and UI component library are undecided: Story 1.1 picks one approach, and records the choice and reason in the architecture's Deferred section and `AGENTS.md`. The app shell uses it.
NEW: - UI component library: Vuetify 4 (#23), replacing Story 1.1's plain CSS. Story 1.5 installs it and moves the app shell onto it before Story 1.2. Theme from `tokens.css`, `@mdi/js` SVG icons, no CDN assets, only `apps/web` imports it.
```

Cross-Story Dependencies gains: `Story 1.5 follows 1.1 and comes before 1.2; 1.2 and 1.3 build their screens with Vuetify.`

### 4.6 Issues and task file (outside the repo, after approval)

- **#23 body:** replace the first acceptance check (comparison report) with "The owner's choice and reason are recorded in the spine (Stack table and Deferred section). No comparison report (owner's call, 2026-11-12)." Set the second check to "Vuetify 4, chosen by the owner for its full component set."
- **#24 body:** remove the "Research and reasons:" line that links to the missing research file, and replace it with "Reasons: spine Stack table and Deferred section (#23)."
- **`~/Projects/_tasks/chhaap/23.md`:** same acceptance-check amendment, plus the handoff.

## 5. Implementation Handoff

**Scope: Minor.** Docs-only edits plus one new story. No PM or architect replan is needed.

| Who | Does what |
| --- | --- |
| This session (#23, branch `docs/23-ui-library`) | Applies 4.1–4.5, commits, and opens the PR into `develop` once you agree to the push. Updates the #23 and #24 issue bodies (4.6) once you approve. |
| Developer agent (`bmad-build`, #24, branch `feat/24-adopt-vuetify` from `origin/develop`) | Builds Story 1.5 once #23 is merged. |

**Success criteria**
- The spine, `AGENTS.md`, `epics.md`, `sprint-status.yaml` and `epic-1-context.md` all name Vuetify 4, and none still describes plain CSS as the decision.
- Story 1.5 is in `epics.md` and `sprint-status.yaml`, ordered before 1.2.
- #23 merges to `develop` by PR. #24 is unblocked.
