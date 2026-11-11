---
title: 'Story 1.1: Set up the project skeleton'
type: 'feature'
created: '2026-11-11'
status: 'in-progress'
baseline_commit: '8624b893536ff1e23548c43f1097da2d2941c3a5'
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
- [ ] `package.json` (root) -- npm workspaces `apps/*`, `packages/*`, `functions`; scripts `dev`, `build`, `typecheck`, `lint`, `test`, `test:unit`, `test:rules`, `test:e2e`; devDeps firebase-tools 15.35.0, vitest 5.1.0, @firebase/rules-unit-testing 6.0.0, eslint toolchain; `engines.node >=24.12`; `.nvmrc` = 24.
- [ ] `apps/web/` -- create-vue 3.24.0 (`--ts --router --pinia --vitest --playwright --eslint --bare`), versions pinned to Stack; app shell: `SignInView` (Google button, disabled until 1.2), `HomeView` inside `AppLayout` (header + main); `src/styles/tokens.css` + `base.css`; shared `AppButton`.
- [ ] `packages/shared/` -- `@chhaap/shared`, zod 4.6.7, `src/index.ts` exporting `EmailSchema` (trimmed, lowercased email — the allowlist key format in AD-8); unit test.
- [ ] `packages/render/` -- `@chhaap/render` placeholder, `src/index.ts` empty export.
- [ ] `functions/` -- `@chhaap/functions`, firebase-functions 7.4.0 / firebase-admin 14.5.0, `src/index.ts` (`setGlobalOptions({region:'africa-south1'})`), `src/redirect/index.ts` (placeholder `redirect` returning 404 until the redirect epic), `src/commands/index.ts` (empty), `src/auth.ts` (empty, filled by 1.2); tsc build to `lib/`; unit test.
- [ ] `firebase.json`, `.firebaserc` -- emulators (auth, firestore, storage, functions, hosting, UI), hosting targets `app` (SPA, `apps/web/dist`) and `link` (`/**` → `redirect` in `africa-south1`), functions runtime `nodejs24`, rules files; `.firebaserc` default `demo-chhaap`.
- [ ] `firestore.rules`, `storage.rules`, `storage.cors.json` -- deny all; CORS kept in repo per AD-8.
- [ ] `tests/rules/*.test.ts`, `vitest.rules.config.ts` -- prove unauthenticated and authenticated reads/writes are denied in Firestore and Storage.
- [ ] `tests/layers.test.ts` -- fails if `functions` or `render` import anything but `@chhaap/shared`, if `shared` imports another workspace, or if anything except `apps/web` imports `@chhaap/render`.
- [ ] `apps/web/playwright.config.ts`, `apps/web/e2e/shell.spec.ts` -- desktop Chromium/Firefox/WebKit; sign-in screen and home layout render.
- [ ] `.github/workflows/ci.yml` -- on pull_request: Node 24 + Java 21, `npm ci`, typecheck, lint, unit, rules (emulators), e2e; no secrets.
- [ ] `AGENTS.md` -- install/dev/test/lint commands, prerequisites, layout, styling decision, the six workflow rules, board link.
- [ ] spine + sprint-status -- record decisions; story `review` at the end.

**Acceptance Criteria:**
- Given a fresh clone on Node 24 with Java 21, when I run `npm ci` then `npm run dev`, then Vite, the functions build watcher and the emulators (Auth, Firestore, Storage, Functions, Hosting) all start.
- Given `npm run test:rules`, when it runs, then every client read and write to Firestore and Storage is denied.
- Given a forbidden cross-layer import, when `npm run test:unit` runs, then the layers test fails.
- Given `npm run test:e2e`, when it runs, then the shell tests pass in Chromium, Firefox and WebKit at a desktop viewport.
- Given `npm run typecheck && npm run lint`, then both exit 0.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Design Notes

`@chhaap/shared` and `@chhaap/render` export their TypeScript sources directly (`exports: ./src/index.ts`). Vite and Vitest compile them; the functions emulator runs on Node 24, which strips types from files outside `node_modules` (workspace links resolve to real paths), so relative imports inside `shared` carry `.ts` extensions and only erasable syntax is allowed. How `functions` ships `shared` to Cloud Functions at deploy is Story 1.4's problem; record it as a risk.

## Verification

**Commands:**
- `npm run typecheck` -- exit 0
- `npm run lint` -- exit 0
- `npm run test:unit` -- all pass, layers test included
- `npm run test:rules` -- all pass against emulators
- `npm run test:e2e` -- passes in 3 browsers
