---
title: 'Adversarial review: Chhaap architecture spine'
target: ../ARCHITECTURE-SPINE.md
context: ../../../prds/prd-Chhaap-2026-11-10/prd.md
reviewer: adversary
date: 2026-11-10
verdict: 'Not ready to bind stories. The paradigm holds, but 17 pairs of units can each obey every AD and still build incompatibly. 5 are High.'
---

# Adversarial review: Chhaap architecture spine

## Method

For each pair, both units follow every AD and convention exactly as written, and the build still breaks: a data shape clashes, an entity has two owners, two writers race, or rules and functions disagree. Each pair is a hole. Each hole gets a proposed new AD or a tightened one. Severity:

- **High** breaks a PRD guarantee (SM-1, FR-1, FR-11, FR-12).
- **Medium** makes stories diverge, or needs rework when they are integrated.
- **Low** is wording or hygiene.

The spine was not edited.

## Summary

| # | Sev | Pair | Hole | Fix |
|---|-----|------|------|-----|
| H1 | High | `redirect` vs `createCode` | Increment on an unknown slug can create phantom `codes/{x}` docs. Unvalidated path segments reach a document path. | AD-9: validate the slug, then `update()` only when the doc exists |
| H2 | High | `redirect` (AD-9 cache) vs library scan count (FR-11) | CDN `s-maxage=60` hits never invoke the function, so scans go uncounted. Work done after the response is unreliable on 2nd gen. | AD-9: `no-store` on code responses, and count before responding |
| H3 | High | `createCode` / `setStatus` unarchive vs `savePreset` / `restorePreset` | No defined serialisation point. The version a savePreset result claims is undefined. restorePreset is outside AD-5. | AD-5: the preset doc is the lock. Define `baseVersion`. Cover restore. |
| H4 | High | library / export gate vs `setStatus` archive and renderer upgrade | "Passed" is judged differently in different places. Archived and stale codes can be exported in a preset that was never checked. | New AD: one `isExportable()` in shared |
| H5 | High | preview / scanCheck vs export (logo) vs `storage.rules` | `draw()` doesn't fix the logo input format. Canvas taint from CORS. Storage rules aren't bound to the allowlist. | AD-2/AD-6: `draw` takes a resolved preset with a data-URI logo. New Storage rule. |
| M1 | Med | `createCode` / `savePreset` (functions) vs `packages/render` | Functions can't import `RENDERER_VERSION`, so a stale tab's results are accepted | Move `RENDERER_VERSION` to shared and reject a mismatch |
| M2 | Med | `createClient` vs `savePreset` | Two owners of `activePresetId` and the first preset version | `createClient` creates client, preset and v1 atomically |
| M3 | Med | library / preview reader vs `savePreset` writer | Where do the current settings live: the preset doc or `versions/{currentVersion}`? | Fix the read path |
| M4 | Med | `createClient` vs `renameClient` | Case-insensitive name uniqueness has no owner. The Conventions list forbids an index collection. | Add `clientNames/{lower}` |
| M5 | Med | sign-in gate UI vs AD-8 rules | A member can't read their own allowlist doc, so the UI can't tell "not authorised" from other errors, or detect the owner | Allow a self-read |
| M6 | Med | `createCode` (server) vs `shared/slug.ts` (browser) | The server doesn't validate the slug format, so a custom slug gets through | A zod regex in the shared schema |
| M7 | Med | commands' deploy config vs AD-9 | "Only publicly invokable function" read literally blocks callables | Reword AD-9 |
| M8 | Med | every `codes/{slug}` writer | No field-ownership matrix, so a blind `set()` or merge can clobber `scanCount` or `scanResult` | New AD: field ownership table |
| L1 | Low | `setStatus` unarchive (fail) vs library | Is a failed result stored or not? | Never store a failed result |
| L2 | Low | change-log view vs `createCode` | Is the initial status or destination logged? | Decide (recommend no) |
| L3 | Low | `firestore.rules` vs change-log and history views | Subcollection matches aren't specified | Explicit match per Conventions collection, plus emulator tests |
| L4 | Low | web `getFunctions()` vs function region | The region is in prose only | `REGION` constant in shared |

---

## High

### H1 — `redirect` vs `createCode`: phantom code documents and path injection

**Pair.** The redirect story implements AD-9: "one read of `codes/{slug}`", then "adds 1 to `scanCount` with `FieldValue.increment(1)`. Any error … is swallowed." A natural way to write that is `ref.set({scanCount: increment(1)}, {merge: true})`. It never throws, so nothing needs swallowing, and it follows the letter of AD-9.

**Break.**
- Every not-found request now creates `codes/{whatever}`. That includes `/favicon.ico`, `/robots.txt`, `/wp-login.php` and random scans. These documents have no `clientId`, `status` or `destination`.
- `createCode`'s transactional `create` then returns `already-exists` for that slug. The slug is burned forever (AD-4 says never reassigned), and the junk docs grow without bound (cost, NFR-5).
- A path such as `/a/b` turns into `codes/a/b`, which is a collection path. `doc()` throws before the response, which gives a 500 instead of the not-found page.
- Next request, the redirect reads the junk doc. It "exists", so the function has to guess its status.

AD-4 says slugs come only from `shared/slug.ts`, but nothing makes the redirect validate the shape of incoming paths.

**Proposed rule (tighten AD-9).**
> The redirect first matches the path against `SLUG_REGEX` from `packages/shared`, plus the literal `_up`. Anything else gets the not-found page with **no** Firestore read. The count runs only when the read returned an existing code, and uses `ref.update({scanCount: FieldValue.increment(1)})`. `set`/merge is forbidden in the redirect.

### H2 — AD-9 cache header vs FR-11 scan count, plus work after the response

**Pair.** The redirect story sends `s-maxage=60` (AD-9 letter). The library story shows `scanCount` as "each request adds one" (FR-11).

**Break.**
- Firebase Hosting's CDN serves the cached 302 for up to 60 s without invoking the function. A flyer scanned 40 times in a minute at one event counts about once per edge node.
- FR-11 says "Each request to a code's short link adds one". This doesn't hold. "Approximate" in the PRD covers bots, not under-counting by design.
- Separately, AD-9 says "After the response is sent, the function adds 1". On 2nd-gen functions (Cloud Run) the default is CPU-only-during-request, so work after `res.end()` can be throttled or killed. Counts drop silently, and the swallow-errors rule hides it.
- `/_up` cached for 60 s means the uptime check can pass while the function or Firestore is down (OPS-2).

**Proposed rule (replace the caching and counting bullets of AD-9).**
> Responses for code slugs and `/_up` send `Cache-Control: private, no-store`, so every scan invokes the function. FR-7 is then met immediately rather than within 60 s. Only the not-found page may use `s-maxage`. The increment starts in parallel with building the response. Its promise is awaited with a ≤200 ms cap **before** the response is sent, and any error or timeout is swallowed. Never do work after the response.

The cost at about one scan per second is still within the free tier. If the owner prefers the CDN, the PRD must reword FR-11 to "counts uncached requests".

### H3 — `createCode` / `setStatus` unarchive vs `savePreset` / `restorePreset`: no serialisation point, undefined version semantics

Three separate gaps sit in AD-5. Each one lets two stories build incompatibly.

**(a) No shared lock.** AD-5 says a command "rejects … if the client's active version differs" but not *where* in the transaction the version is read.

- The `createCode` story reads `presets/{id}.currentVersion` with a plain `get()`, compares it, then runs `tx.create(codes/{slug})`. Only the slug create is transactional, which is all AD-4 asks for.
- The `savePreset` story queries non-archived codes in its transaction and bumps `currentVersion`.
- Interleaving: createCode reads v5 and the check passes. savePreset's query doesn't see the new code yet, so the set matches, and it commits v6. createCode then commits a code with a v5 result.
- The FR-12 guarantee ("every saved non-archived code holds a passed result" for the current preset) is broken.
- Even with both reads inside transactions, Firestore query reads don't guard against phantom inserts the way a read of a single document does.

**(b) What `presetVersion` does savePreset's result carry?** The browser checks a *draft* that has no version number yet.

- Story A sends `presetVersion = n` (the base it edited) and stores `scanResult.presetVersion = n`. After the commit, `currentVersion = n+1`, so every code looks checked against an old version.
- Story B sends `n+1`, and the AD-5 equality check ("client's active version differs") then rejects every save.
- Both readings follow the letter of AD-5.

**(c) `restorePreset` isn't bound.**
- AD-5's second bullet names only `savePreset`. FR-4 says a restore must re-check.
- A restorePreset story that carries no results doesn't "carry a scan result", so AD-5's first bullet doesn't apply either.
- The Deferred "re-check all" also has to call savePreset with unchanged settings. Whether that appends a no-op version is undefined.

**Proposed rule (rewrite AD-5).**
> - The serialisation point is the preset doc `clients/{c}/presets/{p}`.
> - Every command that carries a scan result **or** moves a code into or out of `archived`, plus `createCode`, `savePreset` and `restorePreset`, `tx.get`s that preset doc and the client doc inside its transaction before any write.
> - `savePreset` and `restorePreset` always `tx.update` it, even if only `currentVersion` changes, so any concurrent command conflicts and retries.
> - Inputs carry `baseVersion` (the version the browser edited or checked against). The function rejects with `failed-precondition` unless `baseVersion == currentVersion`.
> - For `createCode` and `setStatus`, the stored `scanResult.presetVersion = currentVersion`. For `savePreset` and `restorePreset`, the server stamps `currentVersion + 1`. The client never supplies the stored version.
> - `restorePreset` takes `{presetId, baseVersion, fromVersion, results[]}` and follows the same set-equality rule as savePreset. Equivalently, there is one command `savePreset` with an optional `restoredFrom`.
> - Re-check-all appends a version with `reason: 'recheck'`.

### H4 — The library or export gate vs archive and renderer upgrade: two judges of "passed"

**Pair.**
- The library or export story enables Download when `scanResult.passed === true`. That is all FR-14 says ("any code that has passed the scan check").
- A second story, say the code detail view, also compares `scanResult.presetVersion` to `currentVersion` and `rendererVersion` to `RENDERER_VERSION`.

**Break.**
- An archived code keeps `passed: true` from preset v3. The preset is now v9, and archived codes are excluded from re-checks (FR-12).
- Story 1 lets the user download it, drawn in v9 (FR-14 "current preset"), a combination that was never checked. That violates SM-1 and the "no export without pass" design guarantee.
- After a renderer upgrade, before re-check-all runs, every code has a stale `rendererVersion`. Story 1 allows export, Story 2 blocks it.
- AD-3 defines *how* to check. Nothing defines *when a stored result still counts*.

**Proposed rule (new AD).**
> `packages/shared` exports `isExportable(code, client, preset)`. It returns true iff:
> - `status !== 'archived'`,
> - `scanResult.passed`,
> - `scanResult.presetId === client.activePresetId`,
> - `scanResult.presetVersion === preset.currentVersion`,
> - `scanResult.rendererVersion === RENDERER_VERSION`.
>
> The UI's export, preview badge and library row use only this function. If the function returns false for a non-archived code, the UI shows "needs re-check". It never offers a download.

### H5 — Preview / scanCheck vs export (logo input) vs `storage.rules`

**Pair.**
- AD-2: `draw(preset, shortLink)`. AD-6: "Versions refer to logos by path", and "Exports embed the logo as a data URI".
- The preset editor story passes a Storage download URL to `draw` for the live preview and the check.
- The export story converts the logo to a data URI first, as AD-6 says.

**Break.**
1. Two input forms reach `qr-code-styling`: a URL (async image load, cross-origin) and a data URI. That is exactly the "one drawing path for check and another for export" AD-2 was meant to prevent. SVG logos rasterise differently depending on how they are loaded.
2. If the Storage bucket has no CORS config, a URL logo taints the canvas. zxing's `getImageData` then throws `SecurityError`, and every check with a logo fails as `no-read`.
3. `storage.rules` aren't covered by AD-8, which talks about "rules allow a read" for Firestore only. A story that writes `allow write: if request.auth != null` follows the letter of AD-1 and AD-8. Firebase Auth signs in *any* Google account before the allowlist check, so non-members can upload files. That violates FR-1 ("can read or write no data") and NFR-1.
4. "Never overwritten" isn't enforced: no `resource == null` check. Neither are the PNG/SVG type or size. savePreset doesn't check that the logo path is under `logos/{thisClientId}/`, so client A's preset could reference client B's logo, which leaks once the v2 portal (NFR-7) exists.

**Proposed rule (tighten AD-2 and AD-6, add AD-8b).**
> - `draw`, `scanCheck`, `exportPng` and `exportPdf` take a `ResolvedPreset` whose `logo` is a data URI or null. A URL is not accepted, and the TypeScript type enforces this.
> - One function in `apps/web`, `resolvePreset(versionDoc)`, fetches the logo bytes once and converts them.
> - The bucket gets a CORS config for the app origin, kept in the repo.
> - `storage.rules`:
>   - read requires `firestore.exists(/databases/(default)/documents/allowlist/$(request.auth.token.email.lower()))` and `email_verified`.
>   - write additionally requires `resource == null`, `request.resource.contentType in ['image/png','image/svg+xml']`, `request.resource.size < 2MB`, and a path matching `logos/{clientId}/{uuid}.(png|svg)`.
> - savePreset rejects with `invalid-argument` a logo path that is not under `logos/{clientId}/`, or that doesn't exist.

---

## Medium

### M1 — Command functions vs `packages/render`: a renderer version nobody can verify

- The layer table says commands may import `shared` only, and `RENDERER_VERSION` lives in `packages/render`.
- `createCode` therefore stores whatever `rendererVersion` the browser sends.
- A tab opened before a deploy, still running the old bundle, creates codes or saves presets with old-renderer results. The server accepts them.
- The zod schemas have the same skew: an old bundle can send an old payload shape.

**Rule:** Move `RENDERER_VERSION`, and a `SCHEMA_VERSION`, into `packages/shared`. `render` re-exports them. Every command that carries a result rejects with `failed-precondition` when `rendererVersion !== RENDERER_VERSION`. The UI maps that error to "Chhaap was updated, reload".

### M2 — `createClient` vs `savePreset`: two owners of `activePresetId` and v1

- FR-3 says a client must have a preset before codes can be made.
- One story makes `createClient` create only the client doc, and the first `savePreset` creates the preset doc, version 1 and `activePresetId`. Another story makes `createClient` seed a default preset.
- For a first save, AD-5's "active version" doesn't exist, so the two stories' version checks differ.
- `createCode` against a client with no preset fails in different ways in each version.

**Rule:** `createClient` atomically creates the client, `presets/{autoId}` with `currentVersion: 1`, `versions/1` (default settings, no logo) and `activePresetId`. Only `createClient` writes `activePresetId` in v1. `savePreset` never creates a preset doc.

### M3 — Library or preview reader vs `savePreset` writer: where the current settings live

AD-6 puts the history in `versions/{n}` and `currentVersion` on the preset doc. It doesn't say whether the preset doc also holds `settings`.

- A writer that only appends a version and bumps the counter clashes with a reader that expects `preset.settings`.
- If both exist, someone will update one and not the other.

**Rule:** The preset doc holds only `{currentVersion, updatedAt, updatedBy}`. The current settings are read from `versions/{currentVersion}` (three reads: client, then preset, then version). Alternatively, the preset doc mirrors `settings` and is written in the same transaction. Pick one and say so in AD-6.

### M4 — `createClient` vs `renameClient`: case-insensitive name uniqueness has no owner

- FR-3 says client names are unique, ignoring case. No AD covers this.
- The Conventions table lists the only allowed collections, so a story can't add an index collection without breaking the letter.
- A query-then-write uniqueness check races, and the two commands will implement it differently.

**Rule:** Add `clientNames/{lowercased trimmed name}` → `{clientId}`, owned by createClient and renameClient. Both commands create or delete the index doc in the same transaction and return `already-exists` on a collision.

### M5 — Sign-in gate vs AD-8 read rule

- "Allowlist documents are readable only by the owner."
- The web app must show "not authorised" (FR-1) and show team management only to the owner (FR-2). It can't read its own allowlist doc, so it has to infer membership from a `permission-denied` on some other read, which is ambiguous.
- The owner check in the UI then differs from story to story.
- Email case also needs a rule: the rules and `auth.ts` must both lower-case `token.email`.

**Rule:** `allowlist/{email}` is readable when `email == request.auth.token.email.lower()` (self) or when the caller is the owner. Normalise with `.lower()` in rules and `toLowerCase()` in `auth.ts`, using a shared `normaliseEmail`. addTeamMember can't create a second owner, and removeTeamMember can't remove the owner.

### M6 — `createCode` server vs `shared/slug.ts` browser

- AD-4 says the browser proposes the slug.
- If the zod schema types `slug` as `z.string()`, the function accepts `spring`, `_up` or `a/b`. That allows custom slugs (FR-6 forbids them) and collides with `/_up` or causes the path errors in H1.

**Rule:** `createCodeSchema.slug = z.string().regex(SLUG_REGEX)`, from shared, used by createCode and by the redirect (H1).

### M7 — Commands' deploy config vs AD-9 "only publicly invokable"

- Callable 2nd-gen functions must be IAM-invokable by `allUsers`. The browser carries a Firebase ID token, not a Google IAM identity.
- A story enforcing AD-9 literally sets `invoker: 'private'` on commands, and every `httpsCallable` call fails.

**Rule:** Reword AD-9: "The redirect is the only function that serves unauthenticated requests. Callables are IAM-public but reject any request without a verified, allowlisted ID token via `assertTeamMember()`." Optionally add App Check later.

### M8 — Every writer of `codes/{slug}`: no field ownership

`codes/{slug}` has six writers: createCode, renameCode, setDestination, setStatus, savePreset (bulk `scanResult`), and redirect (`scanCount`).

- A story that writes `tx.set(ref, {...readDoc, status})` from a doc it read seems safe under pessimistic locks. But a savePreset that writes back `scanResult` from a *pre-transaction* read can clobber a concurrent unarchive's result.
- A createCode that sets `scanCount: 0` is harmless. A "repair" script that `set`s the doc is not.

**Rule (new AD, ownership table):**

| Field | Sole writer(s) | Write form |
|---|---|---|
| `clientId`, `createdAt`, `createdBy`, slug (ID) | createCode | `tx.create` |
| `name` | createCode, renameCode | `tx.update` |
| `destination` | createCode, setDestination | `tx.update` + change |
| `status` | createCode, setStatus | `tx.update` + change |
| `scanResult` | createCode, setStatus (unarchive), savePreset/restorePreset | `tx.update`, server-stamped versions |
| `scanCount` | redirect only (absent until first scan) | `update(increment)` |

Commands use `tx.update` with explicit fields only. `set` on an existing code is forbidden.

---

## Low

- **L1. setStatus unarchive failure.** The `reason?` field in AD-5 implies failed results are stored, but FR-12 says a failed new code saves nothing. **Rule:** the browser doesn't call the command when its check fails. Commands reject `passed:false` with `invalid-argument`, and a stored `scanResult` is always a pass.
- **L2. Initial values in the change log.** AD-7 covers "changes". Whether createCode writes `{field:'status', old:null, new:'active'}` decides whether the change-log view shows a creation row. **Rule:** createCode writes no change entries. The view shows `createdBy/createdAt` as its first line.
- **L3. Rules coverage.** Firestore rules don't cascade to subcollections. If the rules author matches `codes/{slug}` only, the change-log and history views break. **Rule:** one explicit `match` per Conventions collection, with a rules-unit-test per path and per role (member, owner, non-member, unverified).
- **L4. Region.** AD-10 states the region in prose. If the web app's `getFunctions(app)` defaults to `us-central1`, every call gets `not-found`. **Rule:** `REGION` is a constant in shared, used by the function options, `getFunctions(app, REGION)` and the `firebase.json` rewrite.

## What holds up

- AD-1's split of browser checks and function commits.
- Slug-keyed codes, which give transactional uniqueness for free.
- Immutable logos and versions.
- The rule to log in the same transaction.
- AD-3's two-size pass criterion.

None of these needs changing. The holes are all about **what** is locked, **who** owns each field, and **how** the version and the logo are represented, not about the paradigm.
