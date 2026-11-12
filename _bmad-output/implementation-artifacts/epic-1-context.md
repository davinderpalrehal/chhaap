# Epic 1 Context: Team sign-in and a working app shell

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Team members sign in with Google and reach a still-empty app; anyone not on the team allowlist is refused and can read or write nothing. The owner adds and removes team members. The epic also lays the monorepo, emulators, security rules, tests, CI and first production deploy that every later epic builds on.

## Stories

- Story 1.1: Set up the project skeleton
- Story 1.2: Sign in with Google, limited to the team allowlist
- Story 1.3: Owner manages the team allowlist
- Story 1.4: First production deploy

## Requirements & Constraints

- Google is the only sign-in provider. Only an allowlisted, verified email reaches the app; any other account sees "not authorised". Every screen and every data read or write needs a signed-in team member.
- Access control is enforced server-side (rules and command checks), not only in the app. The redirect is the only public surface.
- The owner manages the allowlist: an added email can sign in immediately; a removed email is refused on its next read or command even with an open session; non-owners cannot see or change the list; the owner cannot remove their own email. Emails are matched case-insensitively.
- Exactly one owner exists, bootstrapped by a script (Admin SDK) that refuses to run if an owner already exists.
- Desktop browsers only (current Chrome, Safari, Firefox, Edge); no mobile layouts.
- Cost stays within Firebase free usage on Blaze, with a budget alert of about $5 a month.
- Every new dependency must be named and justified in the architecture before it is added; only the pinned stack is allowed.
- No test or CI job may use production credentials or run against production.
- Owner setup tasks that block first deploy (not software): Blaze upgrade and budget alert, Firestore and Storage created in africa-south1, one-time IAM grant letting Storage rules read Firestore, bucket CORS applied.

## Technical Decisions

- Monorepo: `apps/web` (create-vue SPA: Vue 3.5, Vite 8, TS ~6.0, Router 5, Pinia 4), `packages/shared`, `packages/render` (empty placeholder), `functions/src/{commands,redirect,auth.ts}`, `firestore.rules`, `storage.rules`, `storage.cors.json`, `firebase.json` with two Hosting sites (`app`, `link`).
- Layer import rules, enforced by lint or test: `functions` and `packages/render` import only `shared`; only `apps/web` imports `render`.
- Pinned stack: Node 24 (Functions `nodejs24`, fall back to `nodejs22` if deploy rejects it and record why), zod 4.6.7, firebase 13.2.0, firebase-functions 7.4.0, firebase-admin 14.5.0, firebase-tools 15.35.0, Vitest 5.1.0, @firebase/rules-unit-testing 6.0.0, Playwright 1.65.0 (Chromium, Firefox, WebKit at desktop viewport).
- CQRS-lite: web reads Firestore directly under rules; all writes go through callable commands; `firestore.rules` denies all client writes.
- Allowlist: `allowlist/{lowercased email}` with `role: owner|member`. `isTeam()` = auth set, `email_verified`, allowlist doc exists. Firestore reads need `isTeam()`; a user reads their own allowlist doc; only the owner reads others. Storage: create-only logos under `logos/{clientId}/{file}`, `isTeam()` via `firestore.exists`, PNG/SVG, max 2 MB, no update/delete.
- Commands call `assertTeamMember()` (and `assertOwner()` for allowlist commands) from `functions/src/auth.ts`; both throw `permission-denied`, use no custom claims, and read the allowlist on every call.
- Commands `addTeamMember` and `removeTeamMember` validate input with zod schemas in `packages/shared`, shared with the web app. Errors are `HttpsError` (`invalid-argument`, `already-exists`, `failed-precondition`, `permission-denied`) mapped to UI messages.
- One region and project: functions, Firestore and Storage in `africa-south1`. Local dev, CI and tests run on the Emulator Suite (Auth, Firestore, Storage, Functions, Hosting); one documented command starts web, functions and emulators.
- Testing: rules tests via `@firebase/rules-unit-testing`; command and auth tests against emulators. CI on every PR runs type-check, lint, unit and rules tests.
- UI component library: Vuetify 4 (#23), replacing Story 1.1's plain CSS. Story 1.5 installs it and moves the app shell onto it before Story 1.2. Theme from `tokens.css`, `@mdi/js` SVG icons, no CDN assets, only `apps/web` imports it.
- `AGENTS.md` documents install, dev, test and lint commands, and the chosen deploy route (GitHub Actions on merge to `main`, or documented manual `firebase deploy`).

## UX & Interaction Patterns

- No UX design contract exists. Signed-out visitors see only the sign-in screen (Google only).
- Signed-in home shows the user's email and a sign-out button. Non-allowlisted users see a "not authorised" screen with sign-out.
- Owner-only Team screen lists allowlisted emails with roles and an add form; it is hidden from navigation for members, whose route shows "not authorised". No remove button on the owner's own row. Add errors show matching messages. A removed member with an open session is shown "not authorised".

## Cross-Story Dependencies

- Story 1.1 underpins all others (layout, emulators, rules, CI, styling choice).
- Story 1.5 follows 1.1 and comes before 1.2; 1.2 and 1.3 build their screens with Vuetify.
- Story 1.2 builds the allowlist rules, `auth.ts` and owner bootstrap script that Stories 1.3 and 1.4 rely on.
- Story 1.3 uses `assertTeamMember()`/`assertOwner()` from 1.2.
- Story 1.4 deploys the result and needs the owner setup tasks done; it signs in with the owner bootstrapped by 1.2's script.
- Later epics depend on this one: Epic 2 builds on it, then Epics 3 and 4; Epic 5 needs Epics 1 and 2.
