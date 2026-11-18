---
title: 'Story 1.2: Sign in with Google, limited to the team allowlist'
type: 'feature'
created: '2026-11-18'
status: 'in-progress'
baseline_commit: 'f94edaf860947c165d6839358330f4f2c2c7b753'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The app shell has a disabled Google button and deny-all rules, so nobody can sign in. Nothing checks the allowlist yet, and later stories need `assertTeamMember()`/`assertOwner()` and an owner to exist.

**Approach:** Wire Firebase Auth (Google popup) into `apps/web` with a session store and route guards that read the user's own `allowlist/{email}` doc. Open Firestore reads to `isTeam()` per AD-8, implement `functions/src/auth.ts`, and add an owner bootstrap script. Everything runs on the `demo-chhaap` emulators.

**Decision (e2e):** `test:e2e` runs under the Auth+Firestore emulators (`firebase emulators:exec`) and signs in for real by driving the emulator's Google popup in Chromium, Firefox and WebKit. It covers the member, not-authorised and sign-out flows. CI's e2e step changes to match.

## Boundaries & Constraints

**Always:** Google is the only provider. Emails are lowercased before use as allowlist keys (`EmailSchema`; rules use `.lower()`). An unverified email counts as not authorised. Client writes stay `if false` everywhere. `auth.ts` reads the allowlist on every call and uses no custom claims. Only `firebase@13.2.0` is added to `apps/web` (already pinned in the Stack). The web Firebase config is the `demo-chhaap` demo config in source, and it connects to the emulators whenever the project id starts with `demo-`.

**Never:** No production Firebase config, `.env` files or real project ids (Story 1.4). No Team screen and no allowlist commands (Story 1.3). No Storage rule changes, so Storage stays deny-all until logos (Epic 2). No custom claims and no client-side writes. No new dependencies beyond the one above. Do not edit `sprint-status.yaml`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Signed out | any route | redirected to `/sign-in`; only the Google button is shown | N/A |
| Allowlisted member | verified `Member@Example.com`, doc `member@example.com` | `/` shows email and Sign out | N/A |
| Not allowlisted | verified email, no doc | `/not-authorised` with Sign out; every route leads there | N/A |
| Unverified email | `email_verified: false` | `/not-authorised` | rules deny all reads |
| Signed in on `/sign-in` | allowlisted | redirected to `/` | N/A |
| Popup closed or failed | user cancels | stays on sign-in, shows a short error line | no crash |
| Bootstrap, no owner | email `Owner@X.com` | writes `allowlist/owner@x.com {role:'owner'}` | N/A |
| Bootstrap, owner exists | any email | exits non-zero and writes nothing | message names the reason |
| Bootstrap, bad email | `not-an-email` | exits non-zero and writes nothing | zod message |

</frozen-after-approval>

## Code Map

- `apps/web/src/main.ts` -- installs Pinia, router and Vuetify. Initialise Firebase and the session store before `app.mount`.
- `apps/web/src/router/index.ts` -- exports `routes` (`/` HomeView, `/sign-in` SignInView) and has a "guards arrive in 1.2" comment. Add `/not-authorised` and a catch-all to `/`, plus a `beforeEach` guard that awaits the store's first auth state.
- `apps/web/src/views/SignInView.vue` -- has a disabled `v-btn` "Sign in with Google". Enable it and wire it to the store.
- `apps/web/src/views/HomeView.vue` -- has a `v-app-bar` "Chhaap". Add the email and a Sign out button.
- `apps/web/src/plugins/vuetify.ts` -- theme; reuse as is.
- `apps/web/src/__tests__/shell.spec.ts` -- mounts `App` with a memory router and Vuetify, and asserts the button is disabled. Update it.
- `apps/web/e2e/shell.spec.ts` -- fails on any request to another origin; allow `localhost` emulator ports. `e2e/a11y.spec.ts` runs axe on `/sign-in` and `/`.
- `firestore.rules` -- deny-all with a "1.2 adds allowlist reads" comment. `tests/rules/env.ts` has `createTestEnv()` and `verifiedUser`. `tests/rules/firestore.test.ts` seeds `allowlist/member@example.com` and asserts everything fails; rewrite it to the AD-8 matrix.
- `vitest.rules.config.ts` -- run by `test:rules` through `firebase emulators:exec --only firestore,storage`. Extend `include` to `functions/src/**/*.emulator.test.ts`.
- `functions/src/auth.ts` -- placeholder `export {}`. `functions/src/index.test.ts` pins exports to `['redirect']`; leave it unchanged (no new exports).
- `packages/shared/src/index.ts` -- `EmailSchema`; reuse it for the bootstrap input and keys.
- `firebase.json` -- emulator ports: auth 9099, firestore 8080, UI 4000. Root `package.json` scripts; add `owner:bootstrap`.

## Tasks & Acceptance

**Execution:**
- [ ] `apps/web/package.json` -- add `firebase` 13.2.0 -- the web app needs the Auth and Firestore SDKs.
- [ ] `apps/web/src/firebase.ts` -- `initializeApp` with the demo config; export `auth` and `db`; connect the emulators for `demo-*` projects.
- [ ] `apps/web/src/stores/session.ts` -- Pinia store: `status` (`loading`, `signed-out`, `not-authorised`, `member`, `owner`), `email`, `ready` promise, `signIn()` (GoogleAuthProvider popup), `signOut()`. It decides status from `emailVerified` plus a `getDoc` of the user's own `allowlist/{lowercased email}`; a read error means not authorised.
- [ ] `apps/web/src/router/index.ts`, `views/NotAuthorisedView.vue`, `SignInView.vue`, `HomeView.vue` -- guards, the new view, the enabled button with an error line, email and Sign out.
- [ ] `apps/web/src/__tests__/*` -- guard and view tests for every web row of the matrix, with the store's Firebase calls mocked.
- [ ] `firestore.rules` -- `isTeam()`; `allowlist/{email}` readable by self or owner; every other collection readable by `isTeam()`; writes `if false`.
- [ ] `tests/rules/firestore.test.ts` -- unauthenticated, unverified, outsider (case variants), member and owner × own allowlist doc, other allowlist doc, `codes/abc23`, and writes.
- [ ] `functions/src/auth.ts` + `auth.emulator.test.ts` -- `assertTeamMember(auth, db?)` returns `{email, role}`; `assertOwner` adds a role check. Both throw `HttpsError('permission-denied')`. Tests cover missing auth, unverified, not listed, member-as-owner, mixed-case email, and removal taking effect on the next call.
- [ ] `functions/src/bootstrap-owner.ts` + `functions/scripts/bootstrap-owner.ts` + emulator test -- a transaction that queries `role == 'owner'` and refuses if one exists, else writes the doc. The CLI requires `--email` and either `FIRESTORE_EMULATOR_HOST` or an explicit `--project`. Add the root script `owner:bootstrap`.
- [ ] `apps/web/e2e/*`, root `test:e2e` script, `.github/workflows/ci.yml` -- wrap Playwright in `firebase emulators:exec --only auth,firestore`; seed allowlist docs through the emulator REST API or the Admin SDK in a global setup; add signed-in specs (member reaches home, outsider sees not-authorised, sign out returns to sign-in); allow the emulator origins in the cross-origin guard; assert the focused sign-in button shows a visible outline (closes the deferred-work entry).
- [ ] `AGENTS.md` -- how to sign in locally (emulator UI, seeding the owner with `owner:bootstrap`).

**Acceptance Criteria:**
- Given the Firestore emulator, when `owner:bootstrap` runs twice, then the first run writes the owner and the second refuses and changes nothing.
- Given `npm run test:rules`, when it runs, then the AD-8 rules matrix and the `auth.ts` and bootstrap emulator tests pass.
- Given `npm run typecheck && npm run lint && npm run test:unit && npm run test:e2e`, then all exit 0.

## Implementation Notes

Plan: `firebase@13.2.0` in `apps/web`; `src/firebase.ts` (demo config, emulators for `demo-*`); Pinia `stores/session.ts` with a `ready` promise and a last-call-wins settle of `emailVerified` + own allowlist `getDoc`; `createAppRouter()` with a `beforeEach` guard and a status watcher; `NotAuthorisedView`. Rules per Design Notes, matrix tests. `functions/src/auth.ts` + `bootstrap-owner.ts` (transaction), CLI run by Node type stripping; emulator tests via `vitest.rules.config.ts` (excluded from the unit project). E2E: root `test:e2e` wraps Playwright in `emulators:exec --only auth,firestore`; global setup clears and seeds over the emulator REST APIs; specs drive the emulator's Google popup. Risks: emulator popup DOM differs per browser; `@chhaap/shared` import from `functions` at build time (rootDir) and deploy (Story 1.4).

Decisions:
- `apis.google.com` is allowed in the e2e cross-origin guard beside the emulator hosts. Firebase Auth's popup flow loads gapi from it (WebKit on Auth start, other browsers on the first popup); the popup decision makes it unavoidable. Flag for review.
- e2e seeds Google accounts (`Member@Example.com`, `outsider@example.com`) over the Auth emulator REST API and picks them in the popup. Adding a new account per test raced when two workers created the same email. `signInWithGoogle()` retries because the emulator's helper iframe loads gapi from apis.google.com and a failed load silently drops the popup result (seen about 1 in 50 Chromium sign-ins); test timeout raised to 60 s.
- `functions/scripts/bootstrap-owner.ts` runs with Node's type stripping, so `functions/tsconfig.json` adds `rewriteRelativeImportExtensions` + `erasableSyntaxOnly` and includes `scripts/`; the build config includes only `src/` and excludes the test helper `src/emulator.ts`. The CLI uses `process.exitCode` and `deleteApp()` instead of `process.exit()` so a refused transaction is rolled back (an abrupt exit left an emulator lock that broke later tests).
- `auth.ts` validates the token email with `EmailSchema` too; tsc treats `@chhaap/shared` as external, so the build still succeeds. Shipping it at deploy is the existing Story 1.4 deferred entry (evidence updated).
- `.oxlintrc.json` lists the rules test's `expectRead` helper as an assertion; axe skips the dev-only Vue DevTools overlay (`#__vue-devtools-container__`), which failed `aria-prohibited-attr` on the dev server.

Handoff:
- Google popup sign-in (`firebase.ts`, Pinia `session` store, `createAppRouter()` guard + status watcher, `NotAuthorisedView`, enabled sign-in button with error line, email + Sign out on home). AD-8 Firestore rules. `assertTeamMember`/`assertOwner` in `functions/src/auth.ts`. `bootstrapOwner()` + `npm run owner:bootstrap`. e2e under the Auth + Firestore emulators; CI step renamed (same command). AGENTS.md "Signing in locally". Deferred focus-outline entry closed.
- Tests: `npm run typecheck` 0; `npm run lint` 0; `npm run test:unit` 76 passed; `npm run test:rules` 128 passed, 2 skipped (subjects with no own doc); `npm run test:e2e` 39 passed (dev server); `npm run build` 0, `CI=1 npm run test:e2e` 39 passed (preview); 2 × `--repeat-each=3` runs, 234 passed. `owner:bootstrap` run twice by hand on the emulator: first wrote `allowlist/owner@x.com`, second exited 1, bad email exited 1.
- Open: e2e and the emulator popup need internet (apis.google.com, unpkg, Google Fonts), as before for CI's emulator download. `firebase` resolves for `apps/web` and `functions` resolves `@chhaap/shared` through workspace hoisting, without listing it (no new deps). A removed member is moved to "not authorised" only on the next auth event or reload, not live (no allowlist listener); rules deny their reads immediately.
- Acceptance: bootstrap twice (first writes, second refuses, nothing changes) - met (emulator test + manual run); `test:rules` covers the AD-8 matrix, `auth.ts` and bootstrap - met; typecheck, lint, unit, e2e all exit 0 - met.

## Spec Change Log

## Review Triage Log

## Design Notes

Rules ORs every matching `allow`, so a `/{document=**}` read rule would expose other people's allowlist docs. Match per collection instead:

```
match /allowlist/{email} { allow read: if isSignedInVerified() && (email == request.auth.token.email.lower() || isOwner()); }
match /{coll}/{rest=**} { allow read: if coll != 'allowlist' && isTeam(); }
match /{path=**} { allow write: if false; }
```

The popup flow avoids redirect handling and an `authDomain` that matches hosting. The guard awaits `session.ready` (the first `onAuthStateChanged` plus the allowlist read), so a reload never shows the sign-in screen to a member.

## Verification

**Commands:**
- `npm run typecheck && npm run lint` -- expected: exit 0
- `npm run test:unit` -- expected: all pass
- `JAVA_HOME=/opt/homebrew/opt/openjdk@21 npm run test:rules` -- expected: all pass
- `JAVA_HOME=/opt/homebrew/opt/openjdk@21 npm run test:e2e` -- expected: all pass in 3 browsers
