# AGENTS.md — Chhaap

Instructions for every agent working in this repo (Claude, Codex, Gemini and the sessions bmad-loop starts).

## Workflow rules

1. **Every task is on the board.** Every task is on the [Chhaap Project board](https://github.com/users/davinderpalrehal/projects/15) (GitHub Project #15). If a task is missing, add it before working on it.
2. **One branch per task.** Every task gets its own branch, unless an exception is called out.
3. **Features and bug fixes** branch from the latest `origin/develop`.
4. **Hotfixes** branch from the latest `origin/main`.
5. **Releases** merge `develop` into `main`, with a changelog of the new features and bug fixes.
6. **Release cadence.** Release candidates are ready by Friday each week, and releases happen on Monday. The only exception is a hotfix that can't wait.

Never commit directly to `develop` or `main`. Work reaches `develop` through a pull request.

## Commands

Prerequisites: Node 24.12 or later (`.nvmrc`), and Java 21 or later for the Firebase emulators. If your default `java` is older, point `JAVA_HOME` at a JDK 21 (on Homebrew: `export JAVA_HOME=/opt/homebrew/opt/openjdk@21` and put its `bin` first on `PATH`). Install the Playwright browsers once with `cd apps/web && npx playwright install`.

| Task | Command |
| --- | --- |
| Install | `npm ci` |
| Dev (Vite + functions watcher + all emulators) | `npm run dev` |
| Build everything | `npm run build` |
| Type-check | `npm run typecheck` |
| Lint (oxlint + ESLint) | `npm run lint` (auto-fix: `npm run lint:fix`) |
| Unit tests (incl. the layer-import test) | `npm run test:unit` |
| Rules tests (start their own Firestore + Storage emulators) | `npm run test:rules` |
| Browser tests (desktop Chromium, Firefox, WebKit) | `npm run test:e2e` |
| All tests | `npm test` |

`npm run dev` serves the app with Vite on http://localhost:5173. The emulators run under the `demo-chhaap` project id, so they can never reach production: UI on 4000, Auth 9099, Firestore 8080, Storage 9199, Functions 5001, and Hosting with the `app` site on 5050 and the `link` site on the next free port. The `app` Hosting site serves `apps/web/dist`, so it shows a 404 until `npm run build`; use Vite day to day. On CI, e2e runs against the built app, so run `npm run build` before `CI=1 npm run test:e2e`.

CI (`.github/workflows/ci.yml`) runs type-check, lint, unit, rules and e2e tests on every pull request, against the emulators, with no secrets.

## Layout and layer rules

- `apps/web`: the Vue 3 SPA. It may import `@chhaap/shared` and `@chhaap/render`.
- Only `apps/web` imports `vuetify` or `@mdi/js`. `tests/layers.ts` fails on any other import of them.
- `packages/shared`: types and zod schemas for command inputs. It imports no other workspace.
- `packages/render`: the render core (placeholder for now). It may import only `@chhaap/shared`.
- `functions`: `src/commands`, `src/redirect`, `src/auth.ts`. It may import only `@chhaap/shared`.
- `firestore.rules`, `storage.rules`, `storage.cors.json`, `firebase.json` at the root. `tests/` holds the rules tests and the layer-import test (`tests/layers.ts`), which fails on any forbidden import.

Only add dependencies named in the spine's Stack table. A new one must be named and justified in the spine first (NFR-6).

## Styling

Vuetify 4 is the component library (decided in #23; installed by Story 1.5, #24). Build every UI element from Vuetify components before writing a custom one. The brand tokens in `apps/web/src/styles/tokens.css` stay the single source of colour, font, radius and spacing, and feed the Vuetify theme. Icons come from `@mdi/js` as SVGs; never add an icon font or load assets from a CDN. Keep custom styles in scoped SFC styles on top of the tokens; the app's styles win through CSS layers, never `!important`. Why: the owner wants every UI element ready-made, and Vuetify covers everything Epics 1–4 need. The decision and its justification are in the spine's Stack table and Deferred section.

How it is wired (Story 1.5):

- `apps/web/src/plugins/vuetify.ts` creates Vuetify with `defaultTheme: 'light'` and the `mdi-svg` icon set (use `@mdi/js` paths, e.g. `<v-icon :icon="mdiPlus" />`). The `light` theme's colours are parsed from `tokens.css` at build time (`--color-accent` → `primary`, `--color-bg` → `background`, `--color-surface` → `surface`, `--color-text` → `on-surface`/`on-background`); `src/__tests__/theme.spec.ts` checks the mapping. Add a token to `tokens.css` first, then map it there.
- `vite-plugin-vuetify` (`autoImport: true`) imports only the components the templates use. Never import `vuetify/components` or `vuetify/directives` wholesale.
- `main.ts` imports `vuetify/styles` before `tokens.css` and `base.css`. `base.css` declares the layer order `vuetify-core, vuetify-components, vuetify-overrides, vuetify-utilities, vuetify-final, app` and puts the global rules (Vuetify's font variables set to `--font-sans`, the `--radius` on cards and buttons, focus ring) in the last `app` layer. Scoped SFC styles are unlayered, so they beat every layer.
- `App.vue` wraps the router in `v-app`. Screens use `v-main`; signed-in screens add a `v-app-bar` (see `HomeView.vue`). The sign-in screen is a `v-card` with a `v-btn`.
- No web font is loaded: the font is the system stack from `tokens.css`. `e2e/shell.spec.ts` fails if the app requests anything from another origin, and `e2e/a11y.spec.ts` runs axe on `/sign-in` and `/` (serious and critical violations fail); add each new screen there.

## Planning artifacts

- Spec (canonical contract): `_bmad-output/specs/spec-Chhaap/SPEC.md`
- Architecture spine (AD-1 to AD-12, pinned stack): `_bmad-output/planning-artifacts/architecture/architecture-Chhaap-2026-11-10/ARCHITECTURE-SPINE.md`
- Epics and stories: `_bmad-output/planning-artifacts/epics.md`
- Sprint status: `_bmad-output/implementation-artifacts/sprint-status.yaml`
