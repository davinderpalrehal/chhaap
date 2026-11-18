---
title: 'Story 1.2: Sign in with Google, limited to the team allowlist'
type: 'feature'
created: '2026-11-18'
status: 'done'
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
- [x] `apps/web/package.json` -- add `firebase` 13.2.0 -- the web app needs the Auth and Firestore SDKs.
- [x] `apps/web/src/firebase.ts` -- `initializeApp` with the demo config; export `auth` and `db`; connect the emulators for `demo-*` projects.
- [x] `apps/web/src/stores/session.ts` -- Pinia store: `status` (`loading`, `signed-out`, `not-authorised`, `member`, `owner`), `email`, `ready` promise, `signIn()` (GoogleAuthProvider popup), `signOut()`. It decides status from `emailVerified` plus a `getDoc` of the user's own `allowlist/{lowercased email}`; a read error means not authorised.
- [x] `apps/web/src/router/index.ts`, `views/NotAuthorisedView.vue`, `SignInView.vue`, `HomeView.vue` -- guards, the new view, the enabled button with an error line, email and Sign out.
- [x] `apps/web/src/__tests__/*` -- guard and view tests for every web row of the matrix, with the store's Firebase calls mocked.
- [x] `firestore.rules` -- `isTeam()`; `allowlist/{email}` readable by self or owner; every other collection readable by `isTeam()`; writes `if false`.
- [x] `tests/rules/firestore.test.ts` -- unauthenticated, unverified, outsider (case variants), member and owner × own allowlist doc, other allowlist doc, `codes/abc23`, and writes.
- [x] `functions/src/auth.ts` + `auth.emulator.test.ts` -- `assertTeamMember(auth, db?)` returns `{email, role}`; `assertOwner` adds a role check. Both throw `HttpsError('permission-denied')`. Tests cover missing auth, unverified, not listed, member-as-owner, mixed-case email, and removal taking effect on the next call.
- [x] `functions/src/bootstrap-owner.ts` + `functions/scripts/bootstrap-owner.ts` + emulator test -- a transaction that queries `role == 'owner'` and refuses if one exists, else writes the doc. The CLI requires `--email` and either `FIRESTORE_EMULATOR_HOST` or an explicit `--project`. Add the root script `owner:bootstrap`.
- [x] `apps/web/e2e/*`, root `test:e2e` script, `.github/workflows/ci.yml` -- wrap Playwright in `firebase emulators:exec --only auth,firestore`; seed allowlist docs through the emulator REST API or the Admin SDK in a global setup; add signed-in specs (member reaches home, outsider sees not-authorised, sign out returns to sign-in); allow the emulator origins in the cross-origin guard; assert the focused sign-in button shows a visible outline (closes the deferred-work entry).
- [x] `AGENTS.md` -- how to sign in locally (emulator UI, seeding the owner with `owner:bootstrap`).

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

| # | Source | Finding | Verdict | Evidence | Route |
|---|---|---|---|---|---|
| 1 | verif | `settle()` latest-wins guard has no overlapping-settle test | medium | mock `getDoc` resolves at once and no test runs two settles; removing the guard passes every test | patch |
| 2 | verif, edge, blind | `session.error` survives a session change, so a stale alert can reappear after sign-out | low | error is only cleared at the start of `signIn()`; another-tab sign-in then sign-out shows it again; one-line clear in `settle()` | patch |
| 3 | blind | Test "member removed in another tab…" and router comment imply live removal | low | `onAuthStateChanged` never fires on an allowlist delete; test fires a synthetic event; rename only | patch |
| 4 | blind | Bootstrap CLI honours a stray `GCLOUD_PROJECT` in emulator mode | low | `values.project ?? GCLOUD_PROJECT ?? 'demo-chhaap'` writes to another namespace the app never reads; direct correction | patch |
| 5 | blind | Rules matrix misses owner with mixed-case token and allowlist subcollection reads | low | no subject covers `isOwner()` via lowered key; no subcollection path tested | patch |
| 6 | blind | `test:e2e` fails while `npm run dev` holds emulator ports 9099/8080 | low | both start emulators on the same ports; fix is an AGENTS.md note | defer |
| 7 | blind | `sprint-status.yaml` edited despite the spec's "Never" | false | the "Never" binds the implementer; the build workflow's sprint sync owns that file, and status moves to review at handoff | reject |
| 8 | blind | `@chhaap/shared` imported but undeclared in `apps/web`/`functions` | low | npm workspaces (the repo's package manager) hoist it and all builds pass; same call as Story 1.1 row 10; functions deploy is the 1.4 deferred entry | reject |
| 9 | blind, edge | Not-authorised text wrong for unverified email, read error or null email | low | Google accounts always carry a verified email; read error is the spec's chosen fallback; fix adds a reason state and branches | reject |
| 10 | blind | Failed allowlist read locks a member out without retry or log | low | Firestore `getDoc` rejects only offline or on outage; reload recovers; fix adds UI and retry | reject |
| 11 | blind | No loading screen and no timeout on `session.ready` | low | `onAuthStateChanged` always fires once; offline `getDoc` rejects rather than hanging; fix adds state and UI | reject |
| 12 | edge, blind | Malformed `role` treated as member in store, `auth.ts`, rules | false | AD-8 defines team as "allowlist doc exists"; only bootstrap and Story 1.3's zod-validated commands write the collection | reject |
| 13 | edge, blind | `signOut()` rejection unhandled; no busy state | low | `firebaseSignOut` clears local state and practically never rejects; fix adds branches | reject |
| 14 | edge | Keyboard Enter on the busy sign-in button opens a second popup | low | `v-btn` loading sets `tabindex=-1` and pointer-events none; needs a focused key press mid-popup; fix adds a guard | reject |
| 15 | edge, verif | `defaultDb()` throws if only named Admin apps exist | low | nothing in the functions runtime creates named apps; tests pass `db` explicitly; no consumer until Story 1.3 | reject |
| 16 | edge | e2e retry can leave earlier popups open | low | 234 repeated runs passed; test-only, fix adds cleanup code | reject |
| 17 | blind | Sign-in error lacks error styling and distinct popup-blocked advice | low | `tokens.css` has no error colour; adding one is a design decision; text is announced via `role="alert"` | reject |
| 18 | blind | e2e gaps: owner seed unused, no unverified e2e, cross-origin guard only signed-out, no a11y on error state | low | each case is covered by unit or rules tests; the owner seed keeps emulator data realistic | reject |
| 19 | blind | Emulator switch in `firebase.ts` tests a constant | false | the spec requires connecting for any `demo-*` id; the production switch is Story 1.4's | reject |

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
