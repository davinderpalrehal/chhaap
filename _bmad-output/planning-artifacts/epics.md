---
status: final
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-Chhaap-2026-11-10/prd.md
  - _bmad-output/planning-artifacts/prds/prd-Chhaap-2026-11-10/addendum.md
  - _bmad-output/planning-artifacts/architecture/architecture-Chhaap-2026-11-10/ARCHITECTURE-SPINE.md
  - _bmad-output/specs/spec-Chhaap/SPEC.md
  - _bmad-output/specs/spec-Chhaap/glossary.md
  - _bmad-output/specs/spec-Chhaap/user-journeys.md
  - _bmad-output/specs/spec-Chhaap/capability-details.md
  - _bmad-output/specs/spec-Chhaap/success-metrics.md
  - _bmad-output/specs/spec-Chhaap/operations-and-risks.md
---

# Chhaap - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Chhaap, decomposing the requirements from the PRD and the architecture spine into implementable stories. There is no UX design contract. Requirement IDs keep the PRD's numbering (FR-n, NFR-n, OPS-n) so they trace back to the PRD, the SPEC (CAP-n) and the spine (AD-n). Where the PRD and SPEC differ in wording, the SPEC wins because it is the canonical contract.

## Requirements Inventory

### Functional Requirements

- **FR-1 (CAP-1) Google sign-in.** A Google account whose email is on the team allowlist signs in and reaches the app. Any other account sees "not authorised" and can read or write no data. No other sign-in provider is offered. Every screen and every data read or write needs a signed-in team member.
- **FR-2 (CAP-2) Owner manages the allowlist.** The owner adds and removes emails. An added email can sign in straight away. A removed email is refused on its next request, even with a session open. Non-owners can't see or change the list. The owner can't remove their own email.
- **FR-3 (CAP-3) Create and rename clients.** Client names are unique ignoring case. Every client has a preset before any code is made for it. Clients can't be deleted.
- **FR-4 (CAP-4) Edit a client's preset.** Covers dot style, corner style, colours (incl. background), logo and any other styling setting the QR library supports. The editor shows a live preview of a sample code. On save, the preset applies to every view and export of all that client's codes, old and new. Saving re-checks every non-archived code of the client; if any fails, the save is refused and the failing codes are listed by name with the reason, with a suggestion to archive unused codes. Every save adds a preset-history entry (who, when, settings replaced). A team member can restore the previous preset; restoring is a save and goes through the same re-check. The check is never overridden.
- **FR-5 (CAP-5) Upload a client logo.** PNG or SVG only; other formats are refused with a message naming PNG and SVG. A logo is optional. A logo whose bounding box covers more than 30% of the code's area shows a warning that doesn't block saving. The logo is embedded in every export, never fetched from a URL.
- **FR-6 (CAP-6) Create a code.** From a client, a destination and a name. The destination must be a valid `http`/`https` URL; the name is required and needn't be unique. The code gets a random unique slug the team member can't choose. It is drawn in the client's current preset and saved only after it passes the scan check. It records who made it and when.
- **FR-7 (CAP-7) Change a code's destination.** Same URL rule as FR-6. Scans reach the new destination within an hour (CDN cache, never purged early). Every change adds a change-log entry (who, when, old, new) that can be viewed on the code and can't be edited or deleted. The scan check doesn't re-run.
- **FR-8 (CAP-8) Rename a code.** The name changes; renames aren't logged.
- **FR-9 (CAP-9) Pause, archive and reactivate a code.** Paused or archived codes show the inactive-code page within an hour. The team member is warned before pausing or archiving that every printed copy will stop redirecting. Archived codes are hidden from the default library view unless asked for. A paused code can be set active again. An archived code is scan-checked against the current preset before it becomes active or paused, and stays archived with the reason shown if it fails. Codes can't be deleted, so a slug is never reused. Every status change is logged (who, when, old, new).
- **FR-10 (CAP-10) Redirect short links.** `https://chhaap.link/<slug>` for an active code redirects to its destination. A paused or archived code shows the inactive-code page, which doesn't name the client. An unknown slug shows a plain not-found page. No sign-in needed.
- **FR-11 (CAP-11) Scan count.** Each request reaching the redirect service adds one to the code's count (incl. paused and archived codes). CDN-cached scans aren't counted, so the library shows "at least N". Uptime-monitor requests aren't counted. Counting never blocks the redirect; a counting failure still redirects. One total per code, no breakdown, no bot filtering.
- **FR-12 (CAP-12) Scan check on change.** Runs only when a code is created, when a preset is saved (all non-archived codes), and when a code leaves the archive. A code passes only if decoding returns exactly its short link at both 2000 px and 160 px. Failure reasons are only "didn't read" and "read a different link", each suggesting the preset's contrast and logo size. A failing new code is retried silently with a fresh slug, up to 3 times; if all fail, nothing is saved, no slug is used up, and the reason and a link to the preset are shown. A stored result counts only for the preset version and drawing-library version it was checked against. Viewing and downloading never re-run the check. No override.
- **FR-13 (CAP-13) Browse and search a client's library.** Each code shows name, preview, destination, status, scan count, creator and creation date. Search matches part of a name, ignoring case. Archived codes are hidden unless asked for.
- **FR-14 (CAP-14) Export a code.** Only a code with a stored pass that matches the current preset and library versions can be downloaded. PDF: one A4 page, vector code centred, no print-size note. PNG: at least 2000 px wide. Both: quiet zone of at least 4 modules, current preset, logo embedded. File name includes client and code name.
- **OPS-2 (CAP-15) Uptime monitoring.** An external check requests a dedicated monitoring path on `chhaap.link`, served by the same redirect, and emails the owner when it fails. That path is never a client's code and is never counted.
- **OPS-4 (CAP-16) Data backup.** Clients, presets, codes, logs and logos are exported weekly to separate storage, and a restore from that export has been demonstrated.

### NonFunctional Requirements

- **NFR-1 Access control.** Only signed-in team members read or write data, enforced on the server (security rules), not only in the app. The redirect is the only public surface.
- **NFR-2 Redirect reliability.** The redirect depends only on Davi Codes' Firebase project and the `chhaap.link` domain, never a third-party QR or link service.
- **NFR-3 Redirect speed.** A cached redirect responds in under 500 ms. Runs in the Firebase region nearest Kenya. Uncached speed from Kenya is measured during the build.
- **NFR-4 Generation speed.** Creating and checking a code takes under 10 s. A preset re-check takes under 30 s at about a dozen codes per client.
- **NFR-5 Cost.** Within Firebase's free usage on the Blaze plan, with a budget alert of about $5 a month.
- **NFR-6 Build approach.** Existing npm packages and Firebase services do the heavy lifting. Every new dependency is named and justified in the architecture.
- **NFR-7 Ready for later features.** The v1 data model allows v2 client users limited to their own client's codes, and more than one preset per client, without a migration.
- **NFR-8 Platform.** Desktop browsers: current Chrome, Safari, Firefox and Edge. No mobile layouts or native apps.

### Additional Requirements

From the architecture spine (AD-1 to AD-12). No starter template is named beyond scaffolding the web app with **create-vue** (Vue 3.5, Vite 8, TS ~6.0, Router 5, Pinia 4); the monorepo layout below is the structural seed, so Epic 1 Story 1 sets it up.

- **Monorepo layout:** `apps/web` (create-vue SPA), `packages/shared`, `packages/render`, `functions/src/{commands,redirect,auth.ts}`, `firestore.rules`, `storage.rules`, `storage.cors.json`, `firebase.json` with two Hosting sites (app, link). Import rules per layer as in the spine's layer table.
- **Pinned stack:** Node 24 (Functions `nodejs24`, fall back to `nodejs22` if deploy rejects it), zod 4.6.7, firebase 13.2.0, firebase-functions 7.4.0 / firebase-admin 14.5.0, firebase-tools 15.35.0, qr-code-styling 1.9.2, zxing-wasm 3.1.6, jspdf 4.2.1 / svg2pdf.js 2.9.0, Vitest 5.1.0, @firebase/rules-unit-testing 6.0.0, Playwright 1.65.0.
- **AD-1 CQRS-lite:** the web app reads Firestore directly under rules; every write goes through a callable command. `firestore.rules` denies all client writes. The only client write is a create-only logo upload to Storage. Commands accept browser-attested scan results and never draw or decode.
- **AD-2 One render module:** only `packages/render` imports qr-code-styling, zxing-wasm, jspdf and svg2pdf.js. It exposes `draw`, `scanCheck`, `exportPng`, `exportPdf`, each taking a resolved preset (logo as data URI). Error correction H when a logo is present. 4-module quiet zone everywhere. zxing wasm self-hosted, `formats: ['QRCode']`. `RENDERER_VERSION` in `packages/shared`, bumped on any upgrade of those four libraries. A test exports a PDF, rasterises it and scan-checks the result.
- **AD-3 Pass criterion:** exact decode of `https://chhaap.link/<slug>` from both a 2000 px and a 160 px raster drawn by `draw()`. Reasons only `no-read` and `wrong-link`.
- **AD-4 Codes keyed by slug:** `codes/{slug}` with `clientId` field. Slugs from `shared/slug.ts` (5 chars, alphabet without `0 O 1 l I`, exports `SLUG_REGEX`). Browser proposes and checks; `createCode` creates in a transaction and returns `already-exists` on collision. Never deleted, never reassigned.
- **AD-5 Serialised on the preset:** `createCode`, `savePreset`, `restorePreset` and `setStatus` (leaving archive) read the active preset in their transaction and reject with `failed-precondition` unless `baseVersion == currentVersion`, every result is `passed: true` and carries the current `RENDERER_VERSION`. `savePreset`/`restorePreset` set `currentVersion = baseVersion + 1`, require results covering exactly the client's non-archived codes, and write each code's `scanResult` in the same transaction. Stored `scanResult = {passed, reason?, presetId, presetVersion, rendererVersion, checkedAt}`; server stamps version and time.
- **AD-6 Versioned presets, immutable logos:** `createClient` creates client, first preset (v1, defaults, no logo) and `activePresetId` in one transaction. History is immutable `.../versions/{n}`; save and restore append n+1 (restore copies an old version's settings). Logos at `logos/{clientId}/{uuid}.{png|svg}`, never overwritten or deleted. `savePreset` rejects a logo path outside its client's folder.
- **AD-7 Audit in the same transaction:** destination and status changes write `codes/{slug}/changes/{autoId}` `{by, at, field, old, new}` in the same transaction. No command updates or deletes a change or version.
- **AD-8 Allowlist everywhere:** `allowlist/{lowercased email}` with `role: owner|member`, exactly one owner. `isTeam()` = auth set, `email_verified`, allowlist doc exists. Firestore: reads need `isTeam()`; users read their own allowlist doc; only owner reads others. Storage: `logos/{clientId}/{file}` create-only, `isTeam()` via `firestore.exists`, PNG/SVG, ≤ 2 MB; reads need `isTeam()`; no update/delete. CORS config in repo. Commands run `assertTeamMember()` (and `assertOwner()` for allowlist commands) from `functions/src/auth.ts`. No custom claims.
- **AD-9 Redirect edge:** `chhaap.link` is its own Hosting site rewriting `/**` to a 2nd-gen `redirect` function (unauthenticated). Non-`/_up` paths not matching `SLUG_REGEX` return not-found without reading Firestore. Active → 302; paused/archived → inactive page; missing → not-found; all with `Cache-Control: public, max-age=0, s-maxage=3600`; no purge. Existing codes get `update({scanCount: increment(1)})`, awaited up to ~200 ms before responding, never `set()`, failures logged. `/_up` reads `system/monitor`, uncounted, `no-store`. `minInstances: 0`. Bundle imports only `firebase-admin/firestore` and `packages/shared`, lazy start.
- **AD-10 One region, one project:** single Blaze project with ~$5/month budget alert. Functions, Firestore and Storage in `africa-south1`. Local dev, CI and all tests run on the Emulator Suite, never production.
- **AD-11 One download gate:** `isExportable(code, preset)` in `packages/shared` is true only if not archived, `scanResult.passed`, `presetId == activePresetId`, `presetVersion == currentVersion`, `rendererVersion == RENDERER_VERSION`. If the renderer version is stale, the UI offers to re-check by re-saving the current preset.
- **AD-12 One writer per code field:** `clientId/createdAt/createdBy` createCode once; `name` createCode, renameCode; `destination` createCode, setDestination; `status` createCode (active), setStatus; `scanResult` createCode, savePreset, restorePreset, setStatus (leaving archive); `scanCount` createCode (0), redirect (increment only).
- **Conventions:** collections `allowlist`, `clientNames`, `clients`, `clients/{id}/presets`, `.../versions`, `codes`, `codes/{slug}/changes`, `system`; camelCase fields. `clientNames/{lowercased name}` owned by `createClient`/`renameClient` in the same transaction. Timestamps via `serverTimestamp()` by commands only; actor = verified email. Commands: `createClient`, `renameClient`, `savePreset`, `restorePreset`, `createCode`, `renameCode`, `setDestination`, `setStatus`, `addTeamMember`, `removeTeamMember`, each validated by a zod schema in `packages/shared` shared with the web app. Errors as `HttpsError` (`invalid-argument`, `permission-denied`, `failed-precondition`, `already-exists`, `not-found`), mapped to UI messages. Export file names `<client>-<code name>.<pdf|png>`, slugified.
- **Testing:** rules tests with `@firebase/rules-unit-testing`; command tests against the emulators; render tests in a real browser via Playwright.
- **Open questions to resolve in the redirect epic:** whether the Hosting CDN caches 302s with `s-maxage`; measure a cache-miss redirect from Kenya against NFR-3; confirm `nodejs24` deploys.
- **Deferred to epic level:** the "re-check all" UI/trigger after a `RENDERER_VERSION` bump; backup mechanism for OPS-4 (scheduled Firestore backups vs managed export, plus a logos-bucket copy, weekly); CI/CD choice (rules, command and render tests run on every PR either way); app domain; UI component library and styling (no UX docs).
- **Owner setup tasks (not software, but block first deploy):** Blaze upgrade and budget alert, one-time IAM grant letting Storage rules read Firestore, applying bucket CORS, pointing `chhaap.link` DNS at Hosting. OPS-1 (domain auto-renew and lock) and OPS-3 (accept forking qr-code-styling) are owner tasks with no stories.

### UX Design Requirements

None. No UX design contract exists for Chhaap. UI decisions (component library, styling, layout) are deferred to the stories themselves, within NFR-8 (desktop browsers only).

### FR Coverage Map

- FR-1: Epic 1 - Google sign-in limited to the allowlist
- FR-2: Epic 1 - Owner manages the allowlist
- FR-3: Epic 2 - Create and rename clients
- FR-4: Epic 2 - Edit, re-check, version and restore a client's preset
- FR-5: Epic 2 - Upload a PNG/SVG logo
- FR-6: Epic 2 - Create a code
- FR-7: Epic 4 - Change a code's destination, logged
- FR-8: Epic 4 - Rename a code
- FR-9: Epic 4 - Pause, archive and reactivate a code
- FR-10: Epic 3 - Redirect short links, inactive and not-found pages
- FR-11: Epic 3 - Scan count ("at least N")
- FR-12: Epic 2 - Scan check on create and preset save (Epic 4 reuses it when a code leaves the archive)
- FR-13: Epic 2 - Browse and search a client's library (Epic 4 adds the archived filter and change-log view)
- FR-14: Epic 2 - Export PDF and PNG behind the download gate
- OPS-2: Epic 3 - Uptime monitor on `/_up`
- OPS-4: Epic 5 - Weekly backup with a demonstrated restore
- NFRs: NFR-1, NFR-5, NFR-8 set up in Epic 1 and held by every epic; NFR-4, NFR-6, NFR-7 in Epic 2; NFR-2, NFR-3 in Epic 3.

## Epic List

### Epic 1: Team sign-in and a working app shell
Team members sign in with Google and reach the (still empty) app. Anyone not on the allowlist is refused. The owner adds and removes team members. Also sets up the monorepo, emulators, rules, tests and CI that every later epic builds on.
**FRs covered:** FR-1, FR-2 (NFR-1, NFR-5, NFR-8)

### Epic 2: Make on-brand, print-ready codes
A team member creates a client, sets its preset and logo with a live preview, makes a code that passes the scan check, finds it in the client's library and downloads a print-ready PDF or PNG. Realises UJ-1, UJ-2 and UJ-4.
**FRs covered:** FR-3, FR-4, FR-5, FR-6, FR-12, FR-13, FR-14 (NFR-4, NFR-6, NFR-7)

### Epic 3: Short links that work when scanned
Scanning a code on `chhaap.link` lands on its destination. Paused or archived codes show the inactive-code page and unknown slugs show not-found. Scans are counted, and the owner is emailed if the redirect goes down. Answers the architecture's open questions on CDN caching, uncached latency and the `nodejs24` runtime. No code should be printed before this epic ships.
**FRs covered:** FR-10, FR-11, OPS-2 (NFR-2, NFR-3)

### Epic 4: Manage printed codes over time
A team member points a printed code at a new destination, renames it, and pauses, archives or reactivates it, with every destination and status change logged and viewable. Realises UJ-3.
**FRs covered:** FR-7, FR-8, FR-9 (completes FR-13's archived filter)

### Epic 5: Keep the data safe
Clients, presets, codes, logs and logos are backed up weekly to separate storage, and a restore has been demonstrated.
**FRs covered:** OPS-4

**Dependencies:** 1 → 2 → 3 and 4; 5 needs 1 and 2 (its restore test uses real codes). No epic depends on a later one.

## Epic 1: Team sign-in and a working app shell

Team members sign in with Google and reach the (still empty) app. Anyone not on the allowlist is refused. The owner adds and removes team members. This epic also lays down the monorepo, emulators, rules, tests and CI that every later epic builds on.

### Story 1.1: Set up the project skeleton

As a developer on Chhaap,
I want the monorepo, Firebase emulators, locked-down rules, test harness and CI in place,
So that every later story starts from a working, tested base that never touches production.

**Acceptance Criteria:**

**Given** a fresh clone with Node 24
**When** I install dependencies and start the dev setup
**Then** the repo has the spine's layout: `apps/web` (scaffolded with create-vue: Vue 3.5, Vite 8, TypeScript ~6.0, Vue Router 5, Pinia 4), `packages/shared`, `packages/render` (empty placeholder), `functions/src/{commands,redirect}` and `functions/src/auth.ts`, at the versions pinned in the spine's Stack table
**And** the web app, functions and Emulator Suite (Auth, Firestore, Storage, Functions, Hosting) start with one documented command

**Given** `firebase.json`
**When** I read it
**Then** it declares two Hosting sites (`app` and `link`), the Functions runtime `nodejs24`, and the `africa-south1` region for functions (AD-10)

**Given** `firestore.rules` and `storage.rules`
**When** the rules tests run against the emulators
**Then** every client read and write to Firestore and Storage is denied, and the tests prove it with `@firebase/rules-unit-testing` (NFR-1)

**Given** `packages/shared`
**When** another package imports it
**Then** it exports zod (4.6.7) schemas as the home for command inputs, and the layer import rules from the spine are enforced by a lint rule or test (`functions` and `packages/render` may import only `shared`; only `apps/web` imports `render`)

**Given** a pull request
**When** CI runs
**Then** type-check, lint, unit tests and rules tests run against the emulators and must pass, and no job has production credentials

**Given** the dependencies installed
**When** they are reviewed
**Then** they are the packages named in the spine's Stack table and no others; any new dependency is named and justified in the architecture before it is added (NFR-6)

**Given** the Playwright setup
**When** browser tests run
**Then** they run in Chromium, Firefox and WebKit at a desktop viewport; no mobile layout is required (NFR-8)

**And** the repo's `AGENTS.md` (or README) documents the install, dev, test and lint commands

### Story 1.2: Sign in with Google, limited to the team allowlist

As a team member,
I want to sign in with my Google account and be let in only if my email is on the allowlist,
So that only Davi Codes staff can see or change anything in Chhaap.

**Acceptance Criteria:**

**Given** the Firestore emulator
**When** the owner bootstrap script runs with an email
**Then** it writes `allowlist/{lowercased email}` with `role: owner` using the Admin SDK, and refuses to run if an owner already exists (AD-8: exactly one owner)

**Given** a signed-out visitor to the app site
**When** they open any route
**Then** they see only the sign-in screen, which offers Google sign-in and no other provider (FR-1)

**Given** a Google account whose verified email is on the allowlist (in any letter case)
**When** they sign in
**Then** they reach the app home screen, which shows their email and a sign-out button

**Given** a Google account whose email is not on the allowlist
**When** they sign in
**Then** they see a "not authorised" screen with a sign-out button, and the rules tests prove they can read no data

**Given** `firestore.rules`
**When** the rules tests run
**Then** access is enforced by the server-side rules, not only the app (NFR-1): `isTeam()` is true only when `request.auth` is set, `email_verified` is true and `allowlist/<token email lowercased>` exists; any read outside the allowlist requires `isTeam()`; a user can read their own allowlist document; only the owner can read other allowlist documents; all client writes stay denied

**Given** `functions/src/auth.ts`
**When** its unit tests run against the emulators
**Then** `assertTeamMember()` throws `permission-denied` for a missing, unverified or non-allowlisted caller, and `assertOwner()` also throws `permission-denied` for a member who isn't the owner. Neither uses custom claims, so each check reads the allowlist on every call

### Story 1.3: Owner manages the team allowlist

As the owner,
I want to add and remove team members' emails,
So that I control who can use Chhaap without touching the database.

**Acceptance Criteria:**

**Given** the owner is signed in
**When** they open the Team screen
**Then** they see every allowlisted email with its role, and a form to add an email

**Given** a signed-in member who isn't the owner
**When** they try to open the Team screen
**Then** it isn't offered in navigation, the route shows "not authorised", and the rules deny them reading other allowlist documents (FR-2)

**Given** the owner enters a valid email
**When** they add it
**Then** the `addTeamMember` command (after `assertTeamMember()` and `assertOwner()`) writes `allowlist/{lowercased email}` with `role: member`, and that person can sign in straight away

**Given** the owner enters an invalid email or one already on the list
**When** they add it
**Then** the command throws `invalid-argument` or `already-exists`, and the screen shows a matching message

**Given** a member who is signed in with an open session
**When** the owner removes their email with `removeTeamMember`
**Then** that member's next Firestore read and next command call are refused, and the app shows "not authorised"

**Given** the owner
**When** they try to remove their own email
**Then** the command throws `failed-precondition`, the UI offers no remove button on the owner's own row, and the allowlist is unchanged

**And** both commands validate input with zod schemas from `packages/shared` that the web app also uses, and command tests cover every case above against the emulators

### Story 1.4: First production deploy

As the owner,
I want the app, rules and functions deployed to the production Firebase project,
So that the team can sign in to the real Chhaap and later epics ship by the same route.

**Acceptance Criteria:**

**Given** the owner has finished the setup tasks (Blaze plan, a budget alert of about $5 a month, Firestore and Storage created in `africa-south1`)
**When** the deploy runs
**Then** the `app` Hosting site, Firestore and Storage rules, and the functions deploy to that one project, with functions in `africa-south1` (AD-10, NFR-5)

**Given** the deploy
**When** the Functions runtime is set
**Then** `nodejs24` is confirmed to deploy; if Firebase rejects it, the runtime falls back to `nodejs22` and the reason is recorded in the architecture's open questions (spine open question 3)

**Given** the production app URL
**When** the owner (bootstrapped by Story 1.2's script) and a member they added sign in
**Then** both reach the app, and a non-allowlisted Google account sees "not authorised"

**And** the chosen deploy route (GitHub Actions on merge to `main`, or a documented manual `firebase deploy`) is recorded in `AGENTS.md`, and no test or CI job runs against production

## Epic 2: Make on-brand, print-ready codes

A team member creates a client, sets its preset and logo with a live preview, makes a code that passes the scan check, finds it in the client's library and downloads a print-ready PDF or PNG. Realises UJ-1, UJ-2 and UJ-4.

### Story 2.1: Create and rename clients

As a team member,
I want to create a client and rename it later,
So that each customer has one place for its brand and codes.

**Acceptance Criteria:**

**Given** a signed-in team member on the Clients screen
**When** they create a client with a name
**Then** `createClient` (after `assertTeamMember()`) writes, in one transaction: `clients/{autoId}` with `activePresetId`, `createdAt` and `createdBy`; its first preset at `clients/{id}/presets/{autoId}` with `currentVersion: 1` and default settings with no logo; that preset's `versions/1`; and `clientNames/{lowercased name}` (AD-6, conventions)
**And** the new client appears in the list and opens a simple client page (name, rename, link to its preset) that Story 2.6 later turns into the library

**Given** a client named "Acme"
**When** anyone creates or renames another client to "acme" (any letter case)
**Then** the command throws `already-exists` and the UI says the name is taken (FR-3)

**Given** an existing client
**When** a team member renames it
**Then** `renameClient` swaps the `clientNames` document and updates the client name in one transaction, and the old name becomes free

**Given** any team member
**When** they look for a way to delete a client
**Then** there is none, in the UI or as a command (FR-3)

**And** the preset lives in a `presets` subcollection referenced by `activePresetId`, so more than one preset per client can be added later without a migration (NFR-7)
**And** rules tests prove team members can read `clients`, presets and versions, and no one can write them from the client; command tests cover create, rename, case-insensitive clashes and an empty or whitespace-only name (`invalid-argument`)

### Story 2.2: Draw a code and prove it scans

As a team member,
I want every code drawn by one renderer and checked by decoding it,
So that what I preview, what gets checked and what gets printed are always the same and always scan.

**Acceptance Criteria:**

**Given** `packages/render`
**When** I inspect its imports
**Then** it is the only package importing `qr-code-styling`, `zxing-wasm`, `jspdf` or `svg2pdf.js`, and a lint rule or test fails the build otherwise (AD-2)

**Given** a short link and a *resolved* preset (logo, if any, as a data URI)
**When** `draw()` is called
**Then** it returns the styled code with a quiet zone of 4 modules on every side, using error correction level H whenever the preset has a logo

**Given** a drawn code
**When** `scanCheck(shortLink, preset)` runs
**Then** it rasterises the code at 2000 px and at 160 px, decodes both with `zxing-wasm` using `formats: ['QRCode']`, and passes only if both decode exactly to `https://chhaap.link/<slug>`; otherwise it fails with reason `no-read` or `wrong-link` (AD-3, FR-12)
**And** the result carries the current `RENDERER_VERSION`, exported from `packages/shared`

**Given** the built web app
**When** the scan check runs
**Then** the `zxing-wasm` reader file is served from the app's own origin, never from a CDN

**And** Playwright tests in a real browser cover: a default preset passes; a near-zero-contrast preset fails with `no-read`; a mocked decode of another string fails with `wrong-link`. A short note records that `RENDERER_VERSION` must be bumped on any upgrade of the four libraries

### Story 2.3: Edit a client's preset with live preview, history and restore

As a team member,
I want to change a client's brand style, see it live, and roll back if needed,
So that every code for that client stays on brand without anyone styling codes by hand.

**Acceptance Criteria:**

**Given** a client's preset editor
**When** the team member changes dot style, corner style, colours (including the background) or any other setting `qr-code-styling` supports
**Then** a sample code redraws live with `draw()` (FR-4)

**Given** the team member saves
**When** the browser runs `scanCheck` on every non-archived code of the client against the new settings
**Then** it calls `savePreset` with the settings, `baseVersion` and one result per code
**And** `savePreset` (in one transaction) reads the active preset, rejects with `failed-precondition` unless `baseVersion == currentVersion`, every result is `passed: true` with the current `RENDERER_VERSION`, and the results cover exactly the client's non-archived codes as read in the transaction (AD-5)
**And** on success it writes `versions/{baseVersion+1}` with `by`, `at` and the settings, sets `currentVersion = baseVersion + 1`, and writes each code's `scanResult` stamped by the server with `presetId`, `presetVersion` and `checkedAt`

**Given** any code fails the check in the browser
**When** the team member tries to save
**Then** nothing is saved, and the editor lists each failing code by name with "didn't read" or "read a different link", suggests checking contrast and logo size, and suggests archiving codes no longer in use (FR-4, FR-12). There is no override

**Given** another save landed first
**When** this save reaches the server
**Then** it is rejected with `failed-precondition`, and the editor asks the team member to reload and re-check

**Given** the preset history view
**When** the team member opens it
**Then** it lists each version with who saved it and when, and offers "restore" on the previous version; restoring runs the same re-check and calls `restorePreset`, which appends a new version copying the old settings (AD-6)

**And** with no codes yet, a save succeeds with an empty result set; command tests seed codes (including archived ones, which are left out) to cover the pass, fail, stale-version and wrong-set cases; the full re-check of about a dozen codes completes in under 30 s (NFR-4)

### Story 2.4: Add a logo to a client's preset

As a team member,
I want to upload a client's logo into its preset,
So that every code carries the client's mark.

**Acceptance Criteria:**

**Given** the preset editor
**When** the team member uploads a PNG or SVG of 2 MB or less
**Then** it is stored at `logos/{clientId}/{uuid}.{png|svg}` and appears in the live preview (FR-5)

**Given** any other format, or a file over 2 MB
**When** the team member uploads it
**Then** it is refused with a message naming PNG and SVG (and the size limit), and Storage rules refuse it too

**Given** `storage.rules`
**When** the rules tests run
**Then** `logos/{clientId}/{file}` allows `create` only, only for `isTeam()` checked through `firestore.exists`, only for `image/png` or `image/svg+xml` of 2 MB or less; reads require `isTeam()`; there is no update or delete (AD-8)
**And** the bucket's CORS config lives in `storage.cors.json` in the repo

**Given** a preset with a logo
**When** the logo's bounding box covers more than 30% of the code's area
**Then** the editor shows a warning that doesn't block saving; the scan check is the gate

**Given** `savePreset`
**When** the logo path is outside `logos/{thatClientId}/`
**Then** it throws `invalid-argument` (AD-6)

**And** before drawing, the browser resolves the logo to a data URI, so `draw()` never takes a Storage URL; removing a logo is a valid save; old logo files are never overwritten or deleted

### Story 2.5: Make a code for a client

As a team member,
I want to make a code by entering a destination and a name,
So that I get an on-brand, scannable code without choosing any styles.

**Acceptance Criteria:**

**Given** a client's library
**When** the team member enters a destination and a name and creates the code
**Then** the browser proposes a slug from `shared/slug.ts` (5 characters, alphabet without `0 O 1 l I`), draws and scan-checks it in the client's current preset, and calls `createCode` with the slug, destination, name, `baseVersion` and the result (AD-4, FR-6)
**And** `createCode` checks AD-5, creates `codes/{slug}` in a transaction with `clientId`, `name`, `destination`, `status: active`, `scanCount: 0`, `scanResult`, `createdAt` and `createdBy`, and the new code shows with its preview

**Given** a destination that isn't an absolute `http`/`https` URL, or an empty name
**When** the team member submits
**Then** the shared URL validator and zod schema refuse it in the browser and in the command (`invalid-argument`) with a message. Names needn't be unique, and there is no slug field

**Given** a slug whose check fails
**When** the browser retries
**Then** it tries a fresh slug up to 3 more times without telling the team member; if every attempt fails, nothing is saved, and the team member sees the reason, the contrast and logo-size hint, and a link to the client's preset (FR-12)

**Given** a slug that already exists
**When** `createCode` runs
**Then** it throws `already-exists` and the browser retries with a fresh slug

**And** the code is a top-level `codes/{slug}` document carrying `clientId`, so v2 client users can later be limited to their own client's codes without a migration (NFR-7)
**And** creating and checking a code takes under 10 s (NFR-4); command tests cover a stale `baseVersion`, a failing result, a stale `RENDERER_VERSION`, a slug collision and invalid inputs

### Story 2.6: Browse and search a client's library

As a team member,
I want to see all of a client's codes and find one by name,
So that I can answer a printer in under a minute.

**Acceptance Criteria:**

**Given** a client's library
**When** it loads
**Then** each code shows its name, preview (drawn in the current preset), destination, status, scan count as "at least N", creator and creation date (FR-13)

**Given** a search box
**When** the team member types part of a name in any letter case
**Then** only codes whose names contain it are shown

**Given** archived codes exist
**When** the library loads
**Then** they are hidden, and an "include archived" toggle shows them

**And** the library reads Firestore directly under rules (AD-1); it stays usable at about a dozen codes per client

### Story 2.7: Download a print-ready PDF or PNG

As a team member,
I want to download any code that passed its check as a PDF or a PNG,
So that I can send the printer a file that's on brand and scans.

**Acceptance Criteria:**

**Given** `isExportable(code, preset)` in `packages/shared`
**When** it is evaluated
**Then** it is true only if the code isn't archived, `scanResult.passed` is true, `presetId == activePresetId`, `presetVersion == currentVersion` and `rendererVersion == RENDERER_VERSION`; it is the only gate on downloads, and unit tests cover each condition (AD-11)

**Given** an exportable code
**When** the team member downloads a PDF
**Then** `exportPdf` produces a single A4 page with the code centred as vector paths (not a raster image), a quiet zone of at least 4 modules, the current preset, the logo embedded, and no print-size note (FR-14)

**Given** an exportable code
**When** the team member downloads a PNG
**Then** `exportPng` produces an image at least 2000 px wide with the same quiet zone, preset and embedded logo

**Given** either download
**When** the file is saved
**Then** it is named `<client>-<code name>.<pdf|png>`, slugified

**Given** a code that isn't exportable
**When** the library shows it
**Then** no download is offered, and the reason is shown

**And** a Playwright test exports a PDF, rasterises it and runs `scanCheck` on the result (AD-2); viewing and downloading never re-run the check

### Story 2.8: Re-check codes after a renderer upgrade

As a team member,
I want to re-check a client's codes after the drawing libraries are upgraded,
So that downloads come back without anyone guessing whether old codes still scan.

**Acceptance Criteria:**

**Given** `RENDERER_VERSION` has been bumped
**When** a client's library loads
**Then** its codes aren't downloadable, and the library shows a "re-check codes" action explaining why (AD-11)

**Given** the team member chooses "re-check codes"
**When** it runs
**Then** it re-saves the current preset settings through the same flow as Story 2.3 (re-check, `savePreset`, new version), and on success downloads are offered again

**Given** a code fails the re-check
**When** it finishes
**Then** nothing is saved and the failing codes are listed, as in Story 2.3

**And** a note in `AGENTS.md` says a library upgrade must bump `RENDERER_VERSION`, after which each client needs a re-check

## Epic 3: Short links that work when scanned

Scanning a code on `chhaap.link` lands on its destination. Paused or archived codes show the inactive-code page and unknown slugs show not-found. Scans are counted, and the owner is emailed if the redirect goes down. No code should be printed before this epic ships.

### Story 3.1: Redirect short links

As someone scanning a printed code,
I want the short link to take me to the right place, or tell me plainly that it can't,
So that every printed Chhaap code works without me signing in to anything.

**Acceptance Criteria:**

**Given** `firebase.json`
**When** the `link` Hosting site is configured
**Then** it rewrites `/**` to one 2nd-gen function `redirect` in `africa-south1` that allows unauthenticated invocation, with `minInstances: 0` (AD-9, AD-10)

**Given** a path that isn't `/_up` and doesn't match `SLUG_REGEX` from `packages/shared`
**When** it is requested
**Then** the function returns the plain not-found page without reading Firestore

**Given** a slug matching `SLUG_REGEX`
**When** it is requested
**Then** an active code returns a 302 to its current destination; a paused or archived code returns the inactive-code page, which never names the client; a slug with no code returns the not-found page (FR-10)
**And** all three responses carry `Cache-Control: public, max-age=0, s-maxage=3600`, and nothing purges the cache

**Given** the redirect bundle
**When** its imports are checked
**Then** it imports only `firebase-admin/firestore` and `packages/shared`, initialises lazily, and depends on no third-party QR or link service (NFR-2)

**And** tests against the emulators cover every case above, including an uppercase or too-long slug, a destination with a query string, and a request from a signed-out client

### Story 3.2: Count scans

As a team member,
I want each code to show roughly how often it's been scanned,
So that I can tell which printed codes are still in use.

**Acceptance Criteria:**

**Given** a request for a slug that has a code (active, paused or archived)
**When** the function handles it
**Then** it runs `update({scanCount: FieldValue.increment(1)})` and waits at most about 200 ms for it before responding; it never uses `set()` (AD-9, AD-12, FR-11)

**Given** the increment fails or takes longer than the limit
**When** the function responds
**Then** the redirect or page is still served, and the failure is logged

**Given** a slug with no code, or a path that fails `SLUG_REGEX`
**When** it is requested
**Then** no document is created or changed

**And** emulator tests prove the count goes up by one per handled request, including for paused and archived codes, and that a forced Firestore failure still returns the 302; the library (Story 2.6) shows the total as "at least N"

### Story 3.3: Uptime monitor path

As the owner,
I want an external check to hit a dedicated path on `chhaap.link` and email me if it fails,
So that I hear about a broken redirect before a client does.

**Acceptance Criteria:**

**Given** `system/monitor` exists in Firestore
**When** `/_up` is requested
**Then** the function reads `system/monitor`, returns a success response with `Cache-Control: no-store`, and counts nothing (AD-9, OPS-2)

**Given** Firestore can't be read
**When** `/_up` is requested
**Then** it returns an error status, so the monitor sees the failure

**Given** the production setup
**When** the owner sets up a free external uptime check
**Then** it requests `https://chhaap.link/_up` every 5 minutes and emails the owner on failure, and `AGENTS.md` records the service used and how `system/monitor` is seeded

**And** `/_up` is never a client's code, so pausing or archiving any code can't break the monitor

### Story 3.4: Go live on chhaap.link and measure it

As the owner,
I want the redirect live on `chhaap.link` with its caching and speed confirmed,
So that we know printed codes are fast and that a change reaches scanners within an hour.

**Acceptance Criteria:**

**Given** the owner has pointed `chhaap.link` DNS at the `link` Hosting site
**When** the `link` site and `redirect` function are deployed
**Then** an active code's short link redirects, an unknown slug shows not-found, and `/_up` succeeds over HTTPS

**Given** two requests to the same active short link a few seconds apart
**When** the response headers are inspected
**Then** it is recorded whether the Hosting CDN served the second 302 from cache (spine open question 1); if it doesn't cache 302s, the redirect is still correct and the finding is recorded with any follow-up

**Given** requests from Kenya
**When** a cached redirect and an uncached redirect are timed
**Then** the cached one responds in under 500 ms (NFR-3), and the uncached time is recorded against spine open question 2, with a follow-up raised if it is unacceptable

**And** the findings are written into the architecture spine's Open Questions (resolved or carried forward). Proving a destination change reaches scanners within an hour belongs to Epic 4, which adds destination changes

## Epic 4: Manage printed codes over time

A team member points a printed code at a new destination, renames it, and pauses, archives or reactivates it, with every destination and status change logged and viewable. Realises UJ-3.

### Story 4.1: Open a code and rename it

As a team member,
I want a page for each code where I can see its details and history and rename it,
So that I have one place to manage a printed code.

**Acceptance Criteria:**

**Given** a code in a client's library
**When** the team member opens it
**Then** a code page shows its preview, name, short link, destination, status, scan count ("at least N"), creator, creation date, download buttons gated by `isExportable` (Story 2.7), and its change log, newest first, with who, when, field, old and new values (FR-7)

**Given** the code page
**When** the team member renames the code to a non-empty name
**Then** `renameCode` (after `assertTeamMember()`) updates only `name`, writes no change-log entry, and the new name shows in the library (FR-8, AD-7, AD-12)

**Given** an empty or whitespace-only name, or a slug with no code
**When** `renameCode` runs
**Then** it throws `invalid-argument` or `not-found`

**And** rules tests prove team members can read `codes/{slug}/changes` and no one can write, update or delete it from the client

### Story 4.2: Point a code at a new destination

As a team member,
I want to change where a printed code goes,
So that a client's campaign can move without reprinting anything.

**Acceptance Criteria:**

**Given** the code page
**When** the team member saves a new valid `http`/`https` destination
**Then** `setDestination` updates `destination` and writes `codes/{slug}/changes/{autoId}` `{by, at, field: "destination", old, new}` in the same transaction (AD-7, FR-7)
**And** the page says scans will reach the new destination within an hour, and the scan check doesn't re-run

**Given** an invalid URL
**When** the team member saves
**Then** the shared validator refuses it in the browser and `setDestination` throws `invalid-argument`

**Given** the destination is unchanged
**When** the team member saves
**Then** nothing is written and no log entry is added

**And** command tests prove the change and its log entry are written together or not at all; in production, a changed destination is shown to reach a scanner within an hour (the check carried over from Story 3.4)

### Story 4.3: Pause and reactivate a code

As a team member,
I want to pause a code and set it active again,
So that I can stop a printed code redirecting for a while without losing it.

**Acceptance Criteria:**

**Given** an active code
**When** the team member chooses "pause"
**Then** they are first warned that every printed copy will stop redirecting, and on confirming, `setStatus` sets `status: paused` and logs `{by, at, field: "status", old: "active", new: "paused"}` in the same transaction (FR-9, AD-7)
**And** the page says the short link will show the inactive-code page within an hour

**Given** a paused code
**When** the team member sets it active
**Then** `setStatus` sets `status: active` with a log entry, without a scan check, and the page says redirects resume within an hour

**Given** a status of anything other than `active`, `paused` or `archived`, or the same status the code already has
**When** `setStatus` runs
**Then** it throws `invalid-argument` or writes nothing

**And** command tests cover each transition and its log entry

### Story 4.4: Archive and unarchive a code

As a team member,
I want to archive codes no longer in use and bring them back if needed,
So that old codes stay out of my way and out of preset re-checks, without ever being deleted.

**Acceptance Criteria:**

**Given** an active or paused code
**When** the team member archives it
**Then** they are warned that every printed copy will stop redirecting; on confirming, `setStatus` sets `status: archived` with a log entry; the code drops out of the default library view and out of future preset re-checks (FR-9)

**Given** an archived code
**When** the team member sets it active or paused
**Then** the browser scan-checks it against the client's current preset, and `setStatus` applies AD-5 (active preset read in the transaction, `baseVersion == currentVersion`, a passing result with the current `RENDERER_VERSION`), writes the new status, `scanResult` and log entry in one transaction

**Given** the scan check fails when leaving the archive
**When** the team member tries
**Then** the code stays archived, and they see "didn't read" or "read a different link" with the contrast and logo-size hint

**Given** a preset save that landed after the browser checked
**When** `setStatus` runs
**Then** it rejects with `failed-precondition`, and the UI asks the team member to try again

**And** there is no delete for codes anywhere, so a slug is never reused; command tests cover archive, unarchive pass, unarchive fail and stale version

## Epic 5: Keep the data safe

Clients, presets, codes, logs and logos are backed up weekly to separate storage, and a restore has been demonstrated.

### Story 5.1: Weekly backup of data and logos

As the owner,
I want everything in Chhaap copied to separate storage every week,
So that data deleted by mistake can be brought back.

**Acceptance Criteria:**

**Given** the backup mechanism the spine deferred (Firestore scheduled backups vs a scheduled managed export, plus a copy of the logos bucket)
**When** this story starts
**Then** the choice and the reason are recorded in the architecture spine's Deferred section; the default is a weekly scheduled function in `africa-south1` that runs a Firestore managed export and copies new logo files into a separate backup bucket, because Firestore's own backups don't live in separate storage (OPS-4)

**Given** the weekly schedule fires
**When** the backup runs
**Then** `allowlist`, `clientNames`, `clients` with their presets and versions, `codes` with their `changes`, and `system` are exported, and every file under `logos/` is present in the backup bucket

**Given** the backup bucket
**When** its settings are checked
**Then** it is in the same region, is not readable or writable by the app's users or rules, keeps backups for a set retention period, and its cost stays within NFR-5

**Given** a backup run fails
**When** it finishes
**Then** the failure is logged in a way the owner is told about (an alert or the existing budget and uptime emails), and `AGENTS.md` says where to look

**And** the function is tested against the emulators where possible, and the IAM roles it needs are listed as an owner setup task

### Story 5.2: Prove a restore works

As the owner,
I want a written, tested restore procedure,
So that I know the backups are usable before I ever need them.

**Acceptance Criteria:**

**Given** a real weekly backup
**When** the owner follows the restore runbook into a scratch target (a separate Firebase project or the emulators), never production
**Then** clients, presets with all versions, codes with their change logs, and logos come back, and the app can sign in, show a library and download a code from the restored data

**Given** the runbook in the repo
**When** someone reads it
**Then** it covers restoring everything, restoring a single client and its codes, and restoring a single logo, with the exact commands

**And** the date and result of the demonstrated restore are recorded in `AGENTS.md` or the runbook
