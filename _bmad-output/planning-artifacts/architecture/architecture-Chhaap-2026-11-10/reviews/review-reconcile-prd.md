# Reconciliation review: PRD → Architecture Spine — Chhaap

- **Spine:** `architecture-Chhaap-2026-11-10/ARCHITECTURE-SPINE.md` (draft, 2026-11-10)
- **Sources:** `prds/prd-Chhaap-2026-11-10/prd.md`, `addendum.md`
- **Reviewed:** 2026-11-10
- **Lens:** PRD requirements, consequences and quiet constraints (FR, NFR, OPS, risks, assumptions, tone) that the spine contradicts, drops where it should bind an architectural choice, or leaves open so that two independent builders could diverge. Pure UX/product details are ignored.
- **Known accepted change:** the owner deliberately chose 60 s CDN caching (AD-9). That makes the FR-11 scan count approximate. It appears below only as a PRD-update item.

## Verdict

The spine is sound and covers nearly every FR. It needs one more pass before epics: two high gaps let the PRD's central guarantee (no code is downloaded unless it passed the check against what is actually drawn) and the scan counter fail quietly. Several medium gaps leave server-side enforcement, Storage rules and the redirect's latency/cost trade-off to individual builders.

## Summary table

| # | Severity | PRD source | Spine | Kind |
| --- | --- | --- | --- | --- |
| 1 | High | FR-12 Guarantees, FR-14, FR-9, §9 Risk 3, SM-1 | AD-3, AD-5, Deferred | Silent → guarantee can break |
| 2 | High | FR-11 "count never blocks; if counting fails, redirect still happens" | AD-9 | Mechanism unreliable on the chosen platform |
| 3 | Medium | NFR-1, FR-12 "no override", §9 Risk 3 | AD-1, AD-5, layer table | Silent / internal contradiction |
| 4 | Medium | NFR-1, FR-5, AD-6 immutability | AD-1, AD-6, AD-8 | Silent |
| 5 | Medium | NFR-3 (500 ms), NFR-5 (near-zero cost) | AD-9, AD-10 | Silent trade-off |
| 6 | Medium | FR-14 (vector PDF, 4-module quiet zone), SM-1 | AD-2, AD-3 | Silent → check doesn't cover the PDF path |
| 7 | Medium | OPS-2, SM-6 | AD-9 | Silent (cache headers on `/_up`) |
| 8 | Medium | FR-3 (unique names, preset before codes) | AD-6, Conventions | Silent |
| 9 | Low–Med | FR-2 (one owner, can't remove self) | AD-8 | Silent (bootstrap, self-removal) |
| 10 | Low–Med | OPS-4 ("separate cloud storage") | Deferred | Option on the table may not satisfy PRD |
| 11 | Low | FR-11 paused/archived counted | AD-9 | Ambiguous wording |
| 12 | Low | NFR-1 / callable functions | AD-9 last bullet | Literal reading breaks the app |
| 13 | Low | NFR-6, NFR-4, NFR-8, OPS-4 | frontmatter `binds`, Stack | Over-claimed binds, unjustified deps |
| 14 | Low | Addendum (Storage CORS), FR-2 (lowercase email), errors | AD-6, AD-8, Conventions | Small silences |

---

## High

### 1. Export gate ignores *which* preset and renderer a stored "passed" refers to

- **PRD:** FR-12 Guarantees: "Every saved code that isn't archived holds a 'passed' result. An archived code's result may be out of date." FR-14: download "any code that has passed the scan check", always "drawn in the client's current preset". FR-12: viewing and downloading don't re-run the check. §9 Risk 3: re-check all codes after any upgrade of the styling **or decoding** library. SM-1 / SM-C2.
- **Spine:** AD-5 stores `{passed, presetId, presetVersion, rendererVersion, checkedAt}` but never says what the UI (or anything else) does with those fields. AD-5's `savePreset` re-check excludes archived codes (correct per FR-12), so an archived code keeps a `passed: true` from an older preset version. The renderer-upgrade re-check is Deferred, with no rule for the window between deploying a new renderer and re-checking.
- **Gap:** A builder who gates the Download button on `scanResult.passed` alone will allow an archived code (FR-9 shows archived codes on request, and FR-14 says "any code") to be exported in the *current* preset, which it was never checked against. The same applies to every code after a `qr-code-styling` or `zxing-wasm` upgrade until someone runs "re-check all". It is also unstated whether `savePreset` writes the new `scanResult` onto each `codes/{slug}` in the same transaction. That is implied, but not written.
- **Fix:** Add a rule (extend AD-3 or AD-5). A code is *exportable* only if `scanResult.passed && scanResult.presetId == client.activePresetId && scanResult.presetVersion == preset.currentVersion && scanResult.rendererVersion == RENDERER_VERSION`. Otherwise the UI shows "needs re-check" (archived codes: "unarchive to re-check"). State that `savePreset`/`restorePreset` write each code's new `scanResult` in the same transaction. Define `RENDERER_VERSION` as bumping on any upgrade of `qr-code-styling`, `zxing-wasm`, `jspdf` or `svg2pdf.js`, or on any change to `packages/render` drawing code. Say what happens if "re-check all" fails (codes become non-exportable until the preset is fixed, which FR-12 already implies).

### 2. "Increment after the response is sent" is not reliable on Cloud Functions 2nd gen

- **PRD:** FR-11: each request adds one, counting "never slows down or blocks the redirect", and the redirect still happens if counting fails. The addendum suggests an atomic increment "after the redirect is sent".
- **Spine:** AD-9: "After the response is sent, the function adds 1 to `scanCount` … Any error … is swallowed."
- **Gap:** 2nd-gen functions run on Cloud Run with CPU allocated only during request processing (the default). Firebase documents that work after an HTTP function terminates is not guaranteed: it may be throttled, delayed until the next request, or lost when the instance scales to zero. That is exactly the low-traffic case here (about a dozen codes, sparse scans). Builders will diverge: one fires and forgets after `res.redirect()`, another awaits before responding, another sets `cpu: always-allocated`. Their costs and accuracy differ. "Swallowed" errors also hide a counter that silently stops.
- **Fix:** Pick one mechanism and write it down. Recommended: start the `update({scanCount: increment(1)})` *in parallel* with sending the response, and keep the handler alive until the write settles (send the response first, then `await` the write with a short timeout and catch errors before returning). Or accept the latency of awaiting the increment before responding (a single-digit to tens of ms in-region), and record that this is a conscious reading of "never slows down". Log (don't just swallow) increment failures so a broken counter is visible. Also see the PRD-update item on approximate counts.

## Medium

### 3. Server-side acceptance of browser-attested scan results is under-specified, and `RENDERER_VERSION` lives where commands can't import it

- **PRD:** NFR-1 (enforced on the server); FR-12 "There is no override"; FR-9 (archived → active **or paused** must be checked); §9 Risk 3.
- **Spine:** AD-1 "Commands accept a scan result attested by the browser." AD-5 checks only `presetId`/`presetVersion`. The layer table says commands may import `shared` only, while `RENDERER_VERSION` is exported from `packages/render`.
- **Gap:** The spine never says commands **reject** a result with `passed: false`, so one builder may persist failed results and another refuse them. It doesn't say which `setStatus` transitions require a result (archived → active/paused only?). It doesn't say whether a stale browser tab running the previous deploy's renderer is accepted. Commands can't compare `rendererVersion` because they can't import it.
- **Fix:** Move `RENDERER_VERSION` to `packages/shared` (re-exported by `render`). Add to AD-5: `createCode`, `savePreset`, `restorePreset` and `setStatus` from `archived` require every carried result to be `passed: true` with `rendererVersion == RENDERER_VERSION`. Otherwise `failed-precondition`. Failed results are never persisted (the archived code just stays archived, the preset isn't saved). `setStatus` between active and paused carries no result. Note explicitly that attested results are a trust-the-team-member design (acceptable at this scale) so no one later assumes the server verified the decode.

### 4. Storage rules for logos are not specified

- **PRD:** NFR-1 ("Only signed-in team members can read and write data … enforced on the server"); FR-5 (PNG or SVG only, refused otherwise); AD-6's own "never overwritten or deleted".
- **Spine:** AD-1 lets the browser write logos directly. AD-6 says logos are immutable. AD-8 only describes Firestore rules. `storage.rules` appears in the tree with no rule.
- **Gap:** Without a written rule, a builder can easily ship `allow read, write: if request.auth != null`. That would let any Google account (FR-1's refused users still get a Firebase Auth session) upload, overwrite or delete logos, which breaks AD-6 immutability and therefore preset restore.
- **Fix:** Add to AD-6 or AD-8: `storage.rules` uses cross-service `firestore.exists(/databases/(default)/documents/allowlist/$(email.lower()))` plus `email_verified` for read and create. It allows **create only** (`resource == null`) on `logos/{clientId}/{uuid}.{png|svg}`, with no update or delete. It restricts `contentType` to `image/png` or `image/svg+xml` and sets a size cap (for example 2 MB). Everything else is denied. Note that SVG logos are only ever consumed as data-URI images, never served or inlined as documents.

### 5. Cold starts vs NFR-3 (500 ms), and the min-instances vs NFR-5 cost trade-off

- **PRD:** NFR-3 redirect < 500 ms "for a typical scan"; NFR-5 free tier or close to zero; SM-6.
- **Spine:** AD-9 one 2nd-gen function behind a 60 s CDN cache; AD-10 Blaze with a ~$5/month alert. No instance or bundle settings.
- **Gap:** At this traffic level a *typical* scan is cold: the CDN cache will rarely be warm for the same slug, and a scaled-to-zero Node function with `firebase-admin` often takes 1–3 s to start. `minInstances: 1` fixes it but has an idle cost that can approach or exceed the $5 alert. Builders will choose differently, and either choice silently breaks one NFR.
- **Fix:** Make the call in AD-9/AD-10. Either set `minInstances: 1` with the smallest memory/CPU and confirm the monthly cost fits the alert, or keep `minInstances: 0` and record NFR-3 as "warm requests only" (a PRD-update item). Either way, require the redirect bundle to stay minimal: it imports only `firebase-admin/firestore` and `shared/slug`, initialises lazily, and rejects paths that don't match the slug alphabet before any Firestore read (which also caps the read cost of random bot paths).

### 6. The scan check covers the raster, not the vector PDF that actually goes to print, and the quiet zone isn't defined in modules

- **PRD:** FR-14 (vector PDF; PNG ≥ 2000 px; quiet zone ≥ 4 modules on every side); SM-1 ("no code that doesn't scan reaches print"); addendum ("Test logo embedding").
- **Spine:** AD-2 one module for draw, check and export. AD-3 decodes 2000 px and 160 px rasters "each drawn by `draw()`". The PDF path is SVG → `svg2pdf.js`, which has known gaps (some masks, clip paths, gradients, embedded images).
- **Gap:** A PDF can mis-render a logo, gradient or rounded dot shape while the raster passes, so AD-2's "one drawing path" guarantee holds for PNG but not PDF. `qr-code-styling`'s `margin` is in pixels, not modules, so two builders will compute the 4-module quiet zone differently (or forget it). The quiet zone also changes whether the decoder succeeds.
- **Fix:** In AD-2/AD-3, require the check rasters to be produced from the same SVG that `exportPdf` consumes (rasterise the SVG, not the canvas), and make `draw()` own the quiet zone as `max(4, …) × moduleSize`. Add a CI fixture test that renders the PDF (for example with pdf.js) for each supported style option plus a logo and decodes it. That test is a quality gate, not a runtime check, so it doesn't contradict "check only on change".

### 7. `/_up` caching headers are unspecified, so the CDN can mask an outage

- **PRD:** OPS-2 (monitoring link served by the same redirect, emails the owner on failure); SM-6.
- **Spine:** AD-9 specifies `s-maxage=60` for 302s, inactive and not-found pages, and that `/_up` exercises the same read path. It gives no cache header for `/_up`.
- **Gap:** If `/_up` inherits `s-maxage=60` (an easy copy), the uptime check can be answered from the Hosting CDN while the function or Firestore is down. The monitor goes blind exactly when it matters. Also not defined: what `/_up` returns on success and failure (status code).
- **Fix:** `/_up` responds `Cache-Control: no-store`, returns `200` only after a successful read of `system/monitor`, and returns `503` otherwise.

### 8. Client-name uniqueness and the "preset before code" rule have no mechanism

- **PRD:** FR-3: client names unique ignoring case; a new client must have a preset before any code can be made.
- **Spine:** Clients use auto IDs. `createClient`/`renameClient` exist with no uniqueness rule. There is no `createPreset` command, and nothing says whether `createClient` writes an initial preset (v1) or leaves `activePresetId` unset until the first `savePreset`.
- **Gap:** Builders will diverge on (a) case-folding and racing duplicate names, and (b) whether `savePreset` with no existing preset creates one, what version 1 contains, and what `createCode` does when `activePresetId` is empty.
- **Fix:** Store `nameKey` (lowercased, trimmed) and enforce uniqueness inside the `createClient`/`renameClient` transaction (a transactional query, or a `clientNames/{nameKey}` claim document). Pick one preset rule: either `createClient` creates preset + version 1 with default settings, or the first `savePreset` creates it (AD-5 with an empty code set). `createCode` rejects with `failed-precondition` when there is no active preset.

## Low / Low–Medium

### 9. Owner bootstrap and the "can't remove own email" rule (FR-2)

AD-8 says "exactly one owner", and all allowlist writes need `assertOwner()`, so no command can create the first owner document. Two builders will seed it differently (console, script, emulator seed). FR-2 also says the owner can't remove their own email, which is server-enforceable but unstated. **Fix:** Name a one-off `scripts/seed-owner.ts` (Admin SDK) for production and the emulator seed. `removeTeamMember` rejects the caller's own email and any `role: owner` document. `addTeamMember` can only add `member`.

### 10. OPS-4 says "separate cloud storage", and one of the deferred options doesn't fit

The Deferred item offers "Firestore scheduled backups" as one option. Those are stored by Firestore inside the same project, not in a separate bucket, so they don't survive project-level mistakes and don't cover logos. The PRD and addendum say exported "to separate cloud storage" / "kept in a separate bucket". **Fix:** Narrow the deferred choice to a scheduled managed export to a dedicated backup bucket (ideally with object versioning or retention lock), plus a copy of `logos/`. Keep "weekly" as the cadence.

### 11. Counting paused/archived scans is ambiguous in AD-9

FR-11 `[ASSUMPTION]` says requests to paused or archived codes are counted. AD-9's increment bullet follows the "active code gets a 302" bullet, so it reads as active-only to some builders. **Fix:** State "for every existing code regardless of status; not for not-found slugs or `/_up`".

### 12. "This is the only function that is publicly invokable" vs callable commands

Browser `httpsCallable` functions must be invokable by `allUsers` at the IAM/Cloud Run level; authorisation happens in code (`assertTeamMember`). A builder reading AD-9 literally could lock the commands' invoker and break the app. **Fix:** Reword it as "the only function that serves unauthenticated requests. Commands are network-reachable but reject any caller who fails `assertTeamMember()`." Optionally mention App Check as deferred.

### 13. `binds` over-claims, and NFR-6 dependency justification is missing

Frontmatter binds NFR-4, NFR-6, NFR-8 and OPS-4, but no AD governs them (OPS-4 is explicitly Deferred). NFR-6 says "any new dependency is named **and justified** in the architecture". The Stack table names versions only (zod, Pinia, Vue Router, Playwright, `@firebase/rules-unit-testing`, jspdf/svg2pdf.js, zxing-wasm over `@zxing/library`). **Fix:** Add a one-line "why" column to Stack. Either add a short performance note for NFR-4 (browser-side check of about 12 codes × 2 rasters must fit in 30 s, so run sequentially in a worker if needed) or drop NFR-4/NFR-6/NFR-8/OPS-4 from `binds` and list them as "noted, no decision needed".

### 14. Small silences

- **Storage CORS (addendum):** fetching a logo to build a data URI needs CORS on the bucket for the app origin(s). Add it to AD-6 or the ops checklist, because the app domain is itself deferred.
- **Email case in rules (AD-8):** allowlist IDs are lowercased, but `request.auth.token.email` is not guaranteed lowercase. Rules must use `.lower()`, and `assertTeamMember()` must lowercase too.
- **Error codes:** add `unauthenticated` (no auth context) to the Conventions error list so the UI maps it separately from `permission-denied` (signed in, not on the allowlist).
- **Error-correction level without a logo:** AD-2 fixes H with a logo only. State the no-logo level (or "H always"), and whether EC level can be a preset setting (FR-4's "any other styling settings") or is owned by `render`.
- **Slug collision retries (AD-4) vs scan-failure retries (FR-12 `[ASSUMPTION]` 3):** state both bounds so the browser loop can't spin forever, for example 3 scan-failure retries and 5 collision retries, after which it shows an error.

---

## PRD-update items (spine decisions the PRD should absorb)

1. **FR-11 scan count, 60 s CDN cache (accepted owner decision).** Repeat scans of the same code that the Hosting CDN serves within 60 s never reach the function, so they aren't counted. Amend FR-11's "Each request … adds one" to "approximately one per request; requests served from the CDN cache within 60 s of a previous scan aren't counted", and add it to the §11 assumptions index.
2. **FR-12 decode size, now decided.** AD-3 fixes 2000 px and 160 px rasters. Remove the `[NOTE FOR PM]` in FR-12 and close the §10 "Scan-check decode size" deferred item.
3. **FR-7 one-minute propagation.** AD-9's `s-maxage=60` backs it. The `[ASSUMPTION]` can drop its "depends on caching" caveat. Pause and unarchive also take up to 60 s to show on scans.
4. **NFR-5 cost.** Blaze is required for Cloud Functions. Restate it as "Blaze plan, budget alert at ~$5/month" (AD-10), and record the min-instances outcome from finding 5.
5. **NFR-3.** If finding 5 keeps `minInstances: 0`, qualify the 500 ms target as warm or cached requests.
6. **§9 Risk 3.** Point it to the `RENDERER_VERSION` bump rule and the "re-check all" action (finding 1).

## Checked and consistent (no action)

FR-1/FR-2 next-request removal (AD-8, no custom claims); FR-4 history and restore as append-only versions (AD-6); FR-5 logo embedded as a data URI (AD-6); FR-6/FR-9 never delete, never reuse slugs (AD-4); FR-7/FR-9 change log in the same transaction, renames not logged (AD-7); FR-10 inactive and not-found pages don't name the client, unauthenticated redirect (AD-9); FR-12 case set and the "no slug used up" rule (AD-4/AD-5); concurrency between preset saves and code creation or unarchive (AD-5); NFR-2 redirect only on owned Firebase and domain (AD-9); NFR-7 v2 client scoping via `codes.clientId` and the presets subcollection (AD-4, AD-6); tone ("small, cheap, owned"; "Chhaap never overrides the scan check") is preserved.
