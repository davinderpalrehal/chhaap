---
title: 'Story 1.1: Set up the project skeleton'
type: 'feature'
created: '2026-11-11'
status: 'in-review'
baseline_commit: 'ba4d1bba59a15931ee36198f41c8d4d0b5fd6ba9'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-Chhaap-2026-11-10/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The repo has planning docs only: no code, no emulators, no rules, no tests, no CI and no `AGENTS.md`, so no later story has a safe base to build on.

**Approach:** Scaffold the npm-workspaces monorepo the spine describes (create-vue web app, `shared`, placeholder `render`, `functions`), wire the Emulator Suite under a `demo-` project so nothing can reach production, ship deny-all rules with rules tests, enforce the layer import rules with a test, add Vitest, Playwright (desktop Chromium/Firefox/WebKit) and a PR CI workflow, pick one styling approach for a minimal app shell, and write `AGENTS.md` (commands plus the six workflow rules and board link from issue #1).

**Decisions (taken by the build session, delegated by the planning session):**
- Styling: plain CSS — one global tokens/base stylesheet (CSS custom properties) plus scoped SFC styles and a few shared components. No component library, no new dependency.
- Lint: create-vue's own ESLint + oxlint setup, extended to the whole repo. Its devDependencies are the create-vue toolchain and are listed in the spine's Stack table with that justification.
- Layer rules are enforced by a Vitest test that scans import specifiers.
- Emulators use project id `demo-chhaap`; the production project id is left to Story 1.4.

## Boundaries & Constraints

**Always:** Node 24; pinned versions from the spine's Stack table (exact pins for the stack rows); functions region `africa-south1`, runtime `nodejs24`; every test runs on emulators; `firestore.rules` and `storage.rules` deny everything.

**Never:** production project ids or credentials anywhere; deploys; auth, allowlist logic, commands, render code or the default preset look (later stories); new runtime dependencies beyond the Stack table; touching `main`.

</frozen-after-approval>

## Code Map

- Repo today: only `_bmad*`, `.claude`/`.agents`/`.codex`/`.gemini`, `README.md`, `.gitignore` (keep its entries). No `package.json`.
- Spine Stack table and Deferred section -- add create-vue toolchain row and the styling decision; nothing else changes there.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` -- status is owned by the orchestrating session; do not edit.
- Local machine: default `java` is 17; Java 21 lives at `/opt/homebrew/opt/openjdk@21` (firebase-tools 15 emulators need 21+). Use `JAVA_HOME=/opt/homebrew/opt/openjdk@21` for local emulator runs; CI uses `actions/setup-java` 21. Playwright browsers install with `npx playwright install`.
- create-vue 3.24.0 scaffolds loose ranges (e.g. vitest ^4, pinia ^4.0.3); re-pin every Stack-table package exactly. It also adds oxlint + `eslint-plugin-oxlint`, `.vscode/`, `.editorconfig`; keep what lint needs, drop the rest at app level if duplicated at root.
- Do not commit; the orchestrating session commits.

## Tasks & Acceptance

**Execution:**
- [x] `package.json` (root) -- npm workspaces `apps/*`, `packages/*`, `functions`; scripts `dev`, `build`, `typecheck`, `lint`, `test`, `test:unit`, `test:rules`, `test:e2e`; devDeps firebase-tools 15.35.0, vitest 5.1.0, @firebase/rules-unit-testing 6.0.0, eslint toolchain; `engines.node >=24.12`; `.nvmrc` = 24.
- [x] `apps/web/` -- create-vue 3.24.0 (`--ts --router --pinia --vitest --playwright --eslint --bare`), versions pinned to Stack; app shell: `SignInView` (Google button, disabled until 1.2), `HomeView` inside `AppLayout` (header + main); `src/styles/tokens.css` + `base.css`; shared `AppButton`.
- [x] `packages/shared/` -- `@chhaap/shared`, zod 4.6.7, `src/index.ts` exporting `EmailSchema` (trimmed, lowercased email — the allowlist key format in AD-8); unit test.
- [x] `packages/render/` -- `@chhaap/render` placeholder, `src/index.ts` empty export.
- [x] `functions/` -- `@chhaap/functions`, firebase-functions 7.4.0 / firebase-admin 14.5.0, `src/index.ts` (`setGlobalOptions({region:'africa-south1'})`), `src/redirect/index.ts` (placeholder `redirect` returning 404 until the redirect epic), `src/commands/index.ts` (empty), `src/auth.ts` (empty, filled by 1.2); tsc build to `lib/`; unit test.
- [x] `firebase.json`, `.firebaserc` -- emulators (auth, firestore, storage, functions, hosting, UI), hosting targets `app` (SPA, `apps/web/dist`) and `link` (`/**` → `redirect` in `africa-south1`), functions runtime `nodejs24`, rules files; `.firebaserc` default `demo-chhaap`.
- [x] `firestore.rules`, `storage.rules`, `storage.cors.json` -- deny all; CORS kept in repo per AD-8.
- [x] `tests/rules/*.test.ts`, `vitest.rules.config.ts` -- prove unauthenticated and authenticated reads/writes are denied in Firestore and Storage.
- [x] `tests/layers.test.ts` -- fails if `functions` or `render` import anything but `@chhaap/shared`, if `shared` imports another workspace, or if anything except `apps/web` imports `@chhaap/render`.
- [x] `apps/web/playwright.config.ts`, `apps/web/e2e/shell.spec.ts` -- desktop Chromium/Firefox/WebKit; sign-in screen and home layout render.
- [x] `.github/workflows/ci.yml` -- on pull_request: Node 24 + Java 21, `npm ci`, typecheck, lint, unit, rules (emulators), e2e; no secrets.
- [x] `AGENTS.md` -- install/dev/test/lint commands, prerequisites, layout, styling decision, the six workflow rules, board link.
- [x] spine + sprint-status -- record decisions; story `review` at the end.

**Acceptance Criteria:**
- Given a fresh clone on Node 24 with Java 21, when I run `npm ci` then `npm run dev`, then Vite, the functions build watcher and the emulators (Auth, Firestore, Storage, Functions, Hosting) all start.
- Given `npm run test:rules`, when it runs, then every client read and write to Firestore and Storage is denied.
- Given a forbidden cross-layer import, when `npm run test:unit` runs, then the layers test fails.
- Given `npm run test:e2e`, when it runs, then the shell tests pass in Chromium, Firefox and WebKit at a desktop viewport.
- Given `npm run typecheck && npm run lint`, then both exit 0.

## Implementation Notes

**Plan (build session):**
- Scaffold `apps/web` with create-vue 3.24.0, re-pin Stack packages exactly, move ESLint/oxlint config, `.editorconfig`, `.gitattributes` and ignore entries to the root; drop `.vscode/`, README and the counter store.
- Root `package.json`: workspaces, `run-p` (npm-run-all2, already in the create-vue toolchain) for `dev`; root `vitest.config.ts` with `projects` for web, shared, functions and the root layers test; separate `vitest.rules.config.ts` run under `firebase emulators:exec`.
- `functions` is ESM, `tsc` to `lib/`; handlers exported separately so unit tests call them without the emulator.
- Layers test = a small import-specifier scanner (`tests/layers.ts`) tested on the real tree and on synthetic violations.
- Risks: `nodejs24` deploy support (spine open question); Hosting emulator with two sites on one port range; Java 21 needed for emulators.

**Deviations and findings (build session):**
- `setGlobalOptions` lives in `functions/src/options.ts`, imported first by `src/index.ts`. Calling it in the body of `index.ts` is too late: ES modules evaluate `export … from` imports first, and firebase-functions reads global options when a function is defined, so `redirect` got no region. A unit test guards this.
- Hosting emulator: `app` on 127.0.0.1:5050 (5000 is taken by macOS AirPlay), `link` on the next free port (5055 locally). `app` serves `apps/web/dist`, which is empty (404) until `npm run build`; day-to-day dev uses Vite on 5173.
- `storage.cors.json` lists only `http://localhost:5173`; Story 1.4 adds the production app origin.
- `functions` does not depend on `@chhaap/shared` yet; how it ships `shared` at deploy stays a Story 1.4 risk.
- Per the orchestrating session: AGENTS.md was not touched, and sprint-status was not edited (Code Map says the orchestrator owns it).

## Spec Change Log

## Review Triage Log

| # | Source | Finding | Verdict | Evidence | Route |
|---|---|---|---|---|---|
| 1 | blind, edge, verif | `tests/layers.ts` skips any folder named `lib`/`dist`/`coverage` at any depth; walker only tested for `[]` | medium | `SKIP_DIRS.has(entry.name)` by bare name; verification layer reproduced a missed `apps/web/src/lib/x.ts` violation | patch |
| 2 | edge | Dynamic `import()` with backtick specifier not detected | low | `DYNAMIC_IMPORT` only accepts `'`/`"`; direct regex correction | patch |
| 3 | blind | `apps/web/e2e/*.spec.ts` never type-checked | low | `apps/web/tsconfig.json` references node/app/vitest only; root tsconfig covers `tests/**` | patch |
| 4 | blind, edge | `.editorconfig` lacks `root = true` | low | file starts with a glob section; direct one-line fix | patch |
| 5 | edge | `afterAll` calls `env.cleanup()` on undefined env when setup fails | low | `let env` assigned only in `beforeAll`; direct `?.` fix | patch |
| 6 | edge | `EmailSchema` has no length cap | low | `z.string().trim().toLowerCase().pipe(z.email())`; direct `.max(254)` | patch |
| 7 | blind | `functions` cannot ship `@chhaap/shared` at deploy | medium | shared exports `./src/index.ts`, deploy uploads only `functions/`; already noted in Design Notes | defer (Story 1.4) |
| 8 | blind, edge | `storage.cors.json` allows only localhost:5173 | medium | production app origin unknown until first deploy | defer (Story 1.4) |
| 9 | edge | `.firebaserc` has no production targets for `app`/`link` | medium | intent forbids production ids in this story | defer (Story 1.4) |
| 10 | blind | Workspace deps undeclared (functions devDeps, web→shared) | low | npm run adds ancestor `node_modules/.bin`, so scripts work; nothing imports shared yet | reject |
| 11 | blind, edge, verif | Layer test ignores `@/` alias escapes | low | unusual pattern; fix adds a resolution branch | reject |
| 12 | blind, edge | Router has no catch-all route | low | auth guards and real routes land in Story 1.2; fix adds a view | reject |
| 13 | blind | App Hosting site has no cache/security headers | low | deploy concern, nothing is served from production in this story | reject (note for 1.4) |
| 14 | blind | CI runs on `pull_request` only | false | the AC asks for every PR; merges into develop only happen through PRs | reject |
| 15 | blind | Functions test reads private `__endpoint` and pins export keys | low | only way to assert region without a new dependency; key pin is deliberate | reject |
| 16 | blind | No e2e of the link rewrite | low | implementer checked it manually with `npm run dev`; adding emulator e2e is new surface | reject |
| 17 | blind | Node constraints inconsistent (`.nvmrc` 24 vs engines >=24.12) | low | `engines` enforces the floor; `.nvmrc` 24 resolves to the latest 24.x | reject |
| 18 | blind | `AppButton` tests cover defaults only | low | extra tests, not a defect | reject |
| 19 | edge | Commented-out imports flagged as violations | low | only a spurious failure, never a missed one; fix adds parsing | reject |
| 20 | edge | `CI=false` treated as CI in Playwright config | false | create-vue default; no one sets `CI=false` | reject |
| 21 | edge | `reuseExistingServer` may reuse an unrelated 5173 server | low | create-vue default, local only | reject |

## Design Notes

`@chhaap/shared` and `@chhaap/render` export their TypeScript sources directly (`exports: ./src/index.ts`). Vite and Vitest compile them; the functions emulator runs on Node 24, which strips types from files outside `node_modules` (workspace links resolve to real paths), so relative imports inside `shared` carry `.ts` extensions and only erasable syntax is allowed. How `functions` ships `shared` to Cloud Functions at deploy is Story 1.4's problem; record it as a risk.

## Verification

**Commands:**
- `npm run typecheck` -- exit 0
- `npm run lint` -- exit 0
- `npm run test:unit` -- all pass, layers test included
- `npm run test:rules` -- all pass against emulators
- `npm run test:e2e` -- passes in 3 browsers
