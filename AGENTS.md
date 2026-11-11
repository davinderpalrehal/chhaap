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
- `packages/shared`: types and zod schemas for command inputs. It imports no other workspace.
- `packages/render`: the render core (placeholder for now). It may import only `@chhaap/shared`.
- `functions`: `src/commands`, `src/redirect`, `src/auth.ts`. It may import only `@chhaap/shared`.
- `firestore.rules`, `storage.rules`, `storage.cors.json`, `firebase.json` at the root. `tests/` holds the rules tests and the layer-import test (`tests/layers.ts`), which fails on any forbidden import.

Only add dependencies named in the spine's Stack table. A new one must be named and justified in the spine first (NFR-6).

## Styling

Plain CSS, no component library. Design tokens are CSS custom properties in `apps/web/src/styles/tokens.css`, global resets in `base.css`, and each component uses scoped styles built on those tokens. Reuse the shared components (`AppButton`, `AppLayout`) before writing new ones. Why: Chhaap is a small, desktop-only team tool. Plain CSS adds no dependency (NFR-6), and later UX work can restyle everything through the tokens. The decision is also recorded in the spine's Deferred section.

## Planning artifacts

- Spec (canonical contract): `_bmad-output/specs/spec-Chhaap/SPEC.md`
- Architecture spine (AD-1 to AD-12, pinned stack): `_bmad-output/planning-artifacts/architecture/architecture-Chhaap-2026-11-10/ARCHITECTURE-SPINE.md`
- Epics and stories: `_bmad-output/planning-artifacts/epics.md`
- Sprint status: `_bmad-output/implementation-artifacts/sprint-status.yaml`
