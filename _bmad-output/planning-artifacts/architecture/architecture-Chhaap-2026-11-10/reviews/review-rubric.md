---
review: rubric
target: ARCHITECTURE-SPINE.md (architecture-Chhaap-2026-11-10)
inputs: ARCHITECTURE-SPINE.md, .memlog.md, prd.md, addendum.md
date: 2026-11-10
verdict: REVISE (minor/moderate) - sound spine, a handful of gaps that let epics diverge
---

# Rubric Review: Chhaap Architecture Spine

## Verdict

**REVISE before handing to epics.** The paradigm (CQRS-lite, single render core) is coherent, the ADs are mostly concrete and enforceable, and every named package version checks out against the npm registry today. Five issues let two epics build incompatible things, or make a rule behave differently from what it says: the post-response scan-count increment, the cached `/_up` monitor path, the missing Storage contract, the allowlist read rule clashing with FR-1's "not authorised" screen, and the Node toolchain clash. None needs the paradigm to change.

## 1. Divergence points for the epics layer

Fixed well: write path (AD-1), render path (AD-2), pass criterion (AD-3), code identity and slug ownership (AD-4), concurrency on preset versions (AD-5), preset history model (AD-6), audit atomicity (AD-7), membership checks (AD-8), redirect edge (AD-9), region and environment (AD-10). The conventions table (collections, IDs, timestamps, statuses, command names, error codes, URL validator, file names) covers most of the shared vocabulary.

Missed or underspecified divergence points:

| # | Gap | Why two units diverge | Suggested fix |
|---|---|---|---|
| D1 | **Storage contract** (path rules, read rules, CORS, size and type limits). AD-8 covers only Firestore rules. AD-6 says logos are "never overwritten or deleted", but no rule says `storage.rules` allows `create` only. | The preset-editor epic and the export epic will each guess at who can read `logos/**` and how. Rules need `firestore.exists(allowlist/...)` from Storage rules. The addendum flags CORS as needed for in-browser fetches, but the spine never mentions it. | Add a Storage clause to AD-8 (or a new AD): `logos/{clientId}/{file}` allows read and create only for allowlisted, email-verified users, `update, delete: if false`, content type `image/png` or `image/svg+xml`, size cap. Add the bucket CORS config to the Structural Seed. |
| D2 | **Client name uniqueness (FR-3, case-insensitive)** | `createClient`/`renameClient` could enforce it with a query (racy) or with an index document. The two approaches give different collections and different rules. | Add a convention, for example `clientNames/{lowercased name}` created in the same transaction, or a `nameLower` field with a transactional query. Name the error (`already-exists`). |
| D3 | **Preset bootstrap (FR-3: "client must have a preset before any code")** | Nothing says whether `createClient` writes preset v1, or whether the first `savePreset` creates it. `createCode` behaviour when `activePresetId` is missing is also unstated. | State that `createClient` creates the preset and version 1 (default style) atomically, or that `createCode` rejects with `failed-precondition` when there is no active preset. |
| D4 | **Stale `rendererVersion` semantics** | AD-5 stores `rendererVersion`, but nothing says what a mismatch with `RENDERER_VERSION` means. The library/export epic may block export, or may ignore it. Deferred item 1 covers only the re-check trigger. | Add one rule: a mismatch does or does not block export or count as "not passed". |
| D5 | **Owner bootstrap and FR-2 guards** | "Exactly one owner" is stated, but not how the first owner document gets created (seed script? console?). "The owner can't remove their own email" is not assigned to `removeTeamMember`. | Add the seed step to the ops plan or Deferred, and put the self-removal guard in AD-8. |
| D6 | **Where render tests run** | `packages/render` needs a browser DOM and canvas (qr-code-styling) plus WASM. Vitest in jsdom or node won't give results that match the browser. One epic will use Vitest browser mode, another Playwright. | Add to the testing convention: render, scan-check and export tests run in a real browser (Vitest browser mode with Playwright, or Playwright tests). |

## 2. Are the AD rules enforceable, and do they prevent their stated divergence?

- **AD-1:** Enforceable (`write: if false` plus a rules test). OK. A lint rule enforcing "commands never draw or decode" is AD-2's job (see below).
- **AD-2:** Enforceable only if the import ban becomes a lint rule. Add "enforced by `no-restricted-imports` / dependency-cruiser in CI". Otherwise OK.
- **AD-3:** Precise and testable. OK. Minor: say whether the 160 px raster includes the quiet zone, so the module-per-pixel density is fixed.
- **AD-4:** Good. Minor: the FR-12 "up to 3 retries" limit appears only in the memlog, not in the spine. Two loops (collision retry and scan-fail retry) are implied. State the cap and whether collisions count toward it.
- **AD-5:** Mostly sound. Two gaps: (a) the rule should say that *every* scan-carrying command (`createCode`, `savePreset`, `restorePreset`, `setStatus` out of archived) **reads the preset document inside its own transaction**. Only then does Firestore contention serialise them against a concurrent `savePreset`. Without that, an unarchive can still race a preset save. (b) It should say that `savePreset`/`restorePreset` rewrite `scanResult` on each covered code in the same transaction. `restorePreset` is not named as a scan-carrying command, though FR-4 says restore counts as a save.
- **AD-6:** Good. The Storage-side enforcement is missing (D1).
- **AD-7:** Enforceable. OK. Preset-version "who/when/replaced settings" (FR-4) relies on the timestamps convention (`createdAt`/`createdBy`). Acceptable.
- **AD-8:** Two problems.
  - **Clash with FR-1.** "Allowlist documents are readable only by the owner" means a signed-in non-member, and indeed a member, can't read their own allowlist document. The app can only infer "not authorised" from a failing read of some other collection, so it can't tell a real denial from an error. Fix: let a user read `allowlist/{their own lowercased email}`, so the app can show the FR-1 message and role-gate the owner UI.
  - **Case sensitivity.** Rules must compare `request.auth.token.email.lower()`. State it, because the document ID is lowercased.
- **AD-9:** Two correctness problems.
  - **Post-response increment.** In 2nd-gen functions (Cloud Run), work after the response is sent isn't guaranteed: CPU is throttled once the request ends, so increments can be silently lost or delayed. That makes "Any error ... is swallowed" the smaller problem. Fix: start the increment alongside the read and await it, with a short timeout, before sending (or `Promise.race` with a cap). Or explicitly accept and record the loss.
  - **`/_up` caching.** Nothing excludes the monitor path from `s-maxage=60`. If it is cached at the CDN, the uptime check measures the CDN, not the function and Firestore, which defeats OPS-2. State `Cache-Control: no-store` for `/_up`.
  - Also: the memlog records that CDN caching weakens FR-11's "each request adds one", and offers to update the PRD. The spine doesn't record this deviation from the PRD anywhere. Add it to an Open Questions or PRD-deviations note.
- **AD-10:** Enforceable. Firestore's location is **permanent** once the database is created, so the region `[ASSUMPTION]` must be confirmed before the first deploy. It should be listed as an open question with that deadline.

## 3. Deferred items: could any let two units diverge?

- **Renderer upgrade re-check:** safe, since it reuses `savePreset`. Side effect: each run appends a preset version with identical settings, attributed to whoever ran it. Acceptable, but note it. D4 (stale-version semantics) needs to come out of Deferred.
- **Backup mechanism:** safe to defer, since nothing else depends on it. Note: Firestore *scheduled backups* live with the database, not "in separate cloud storage" as OPS-4 asks. Only the managed export to a separate bucket satisfies OPS-4 literally. Narrow the choice now.
- **Staging, App domain, Bot filtering, UI library:** safe.
- **CI/CD:** safe, because the spine fixes that rules and functions tests run on every PR. Also fix deploy order (rules and functions before the web app), or note that it doesn't matter.

## 4. Named tech is current

Checked every Stack row against the npm registry on 2026-11-10: zod 4.6.7, typescript 7.0.2, vue 3.5.45, create-vue 3.24.0, vite 8.3.7, vue-router 5.5.0, pinia 4.1.0, firebase 13.2.0, firebase-functions 7.4.0, firebase-admin 14.5.0, firebase-tools 15.35.0, qr-code-styling 1.9.2, zxing-wasm 3.1.6, jspdf 4.2.1, svg2pdf.js 2.9.0, vitest 5.1.0, @firebase/rules-unit-testing 6.0.0, @playwright/test 1.65.0. **All match.** Peer checks: firebase-functions 7.4 accepts firebase-admin ^14; rules-unit-testing 6 needs firebase ^13. OK.

**Node clash (not recorded):** `@firebase/rules-unit-testing@6.0.0` declares `engines.node >=24.12.0`, while the Functions runtime is pinned to Node 22. vitest 5.1 accepts 22.12+ or 24, and firebase-admin 14 needs >=22. So local and CI must run Node 24.12+, yet functions deploy on 22. That means tests run on a different major version from production. Fix: pin the dev/CI Node to 24.12+ in the spine (`.nvmrc`/`engines`), and either move Functions to Node 24 if the runtime is now offered (the memlog only verified 20 and 22), or accept the gap and name it.

TypeScript 7 (the native port) works with vue-tsc's peer range (`>=5`). But TS 7 has known gaps in its language-service plugin API, which Vue type-checking depends on. Flag this as a build-time verification item, or pin TS 6.x for `apps/web` if `vue-tsc` fails.

## 5. PRD coverage

All of FR-1 to FR-14 and NFR-1 to NFR-8 are bound. OPS-2 and OPS-4 are bound. OPS-1 (domain renewal) and OPS-3 (library fork) are owner tasks and correctly left unbound, though a one-line note saying so would help. Gaps against the PRD's testable consequences:

- FR-1 "not authorised" message: blocked by AD-8's read rule (above).
- FR-2 owner can't remove themselves: not assigned.
- FR-3 unique names and preset-before-code: not covered (D2, D3).
- FR-5 PNG/SVG only: enforced client-side only. Needs a Storage rule (D1).
- FR-5 30% logo-area warning: UI only, fine.
- FR-11 "each request adds one": weakened by caching and the post-response increment. The deviation isn't recorded.
- FR-12 three retries: only in the memlog.
- FR-14 quiet zone of at least 4 modules, vector PDF, A4: implied by `exportPdf` but not stated as `packages/render` contract parameters. Consider putting the A4 and quiet-zone values in `shared` constants, so preview, check and export use the same margin.
- NFR-3 under 500 ms: a cold start of a `minInstances: 0` function plus a Firestore read can exceed 500 ms on uncached slugs. The memlog rejected `minInstances`. Record that cold-start misses on NFR-3 are accepted.
- NFR-6 "any new dependency is named and justified": the Stack table names the packages but gives no justification column. Reasons are partly in the memlog only.

## 6. Dimensions the altitude owns

| Dimension | Status |
|---|---|
| Deployment & environments | Decided: one prod project plus the Emulator Suite (AD-10). Staging deferred. Deploy mechanism deferred (OK). **Missing:** how the two Hosting sites, the custom domain, and the target names in `firebase.json` are configured. Minor. |
| Infra / provider | Decided (Firebase on Blaze, one region). Region is an assumption that becomes **permanent** at Firestore creation, so it must be an open question. |
| Operations | Uptime decided (`/_up`, though see the cache issue). Backups deferred. **Missing:** function error logging and alerting (Cloud Logging defaults? an error-rate alert?), and the budget alert owner. Either decide these or defer them explicitly. |
| Testing | Partial: tools listed, rules and functions tests on PR, emulators only. **Missing:** where render tests run (D6), the Node version (section 4), and whether Playwright E2E runs against emulators in CI. |
| Security | Firestore covered. Storage missing (D1). |
| Observability, secrets, config | Not mentioned. The app likely needs no secrets beyond the public Firebase config. Say so in one line. |

**There is no Open Questions section.** The checklist expects every unresolved dimension to be decided, deferred, or open. Add one with: region confirmation (blocking first deploy), FR-11 PRD update, TS 7 and vue-tsc verification, and whether Hosting caches the 302 (memlog assumption).

## 7. Internal consistency

- **Tag inconsistency.** AD-1 to AD-4, AD-6 and AD-9 carry `[ADOPTED]`. AD-5, AD-7, AD-8 and AD-10 don't. Readers can't tell whether the untagged ones are proposals. Tag them all or define the tag.
- **Structural Seed vs AD-1/AD-6.** The seed shows `team -> Storage: logos` (consistent), but the paradigm's layer diagram omits Storage. Minor.
- **Structural Seed `sched` vs Deferred.** A "Scheduled backup" node that writes to Firestore and Storage reads as decided, while the mechanism is deferred. The arrows `sched --> fs` and `sched --> st` should point from the stores to the backup bucket, or carry a "TBD (Deferred)" label.
- **Collections convention vs AD-9.** `system` is listed, and `system/monitor` is read by the redirect, but nothing says who seeds it. That belongs with the owner-bootstrap seed (D5).
- **Memlog line 31 vs 32.** The memlog first says the slug is generated server-side, then corrects that to browser-proposed. The spine follows the correction (AD-4). Fine, but the stale line could mislead a reader of the log.
- **AD-9 cache header vs FR-7.** `s-maxage=60` meets "within a minute" only if the browser cache doesn't add to it. `max-age=0` covers that. Consistent.
- **Layer table vs AD-2.** Commands import only `shared` and never `render`, which is consistent with "commands never draw or decode". Good.

## Findings summary (severity order)

1. **High - AD-9 post-response increment is unreliable on 2nd-gen functions.** Await the increment (racing it against a short timeout) before responding, or record the accepted loss alongside the FR-11 deviation.
2. **High - Storage contract missing** (rules, immutability, type and size limits, CORS). Extend AD-8 and AD-6 to `storage.rules` and add the CORS config.
3. **Medium - AD-8 owner-only allowlist reads break FR-1's "not authorised" UX and owner role-gating.** Allow reading your own allowlist document, and compare emails with `.lower()`.
4. **Medium - `/_up` would be CDN-cached under AD-9.** Give it `Cache-Control: no-store`.
5. **Medium - Node toolchain clash.** rules-unit-testing 6 needs Node 24.12+, but the Functions runtime is 22. Pin dev/CI Node and record the gap.
6. **Medium - Missing divergence points:** client-name uniqueness, preset bootstrap, `rendererVersion` mismatch semantics, where render tests run.
7. **Medium - No Open Questions section.** The region assumption becomes irreversible at Firestore creation. Add one.
8. **Low - AD-5:** require the preset read inside each scan-carrying transaction, and name `restorePreset`.
9. **Low:** `[ADOPTED]` tagging is inconsistent, the backup node reads as decided, FR-12's 3-retry cap is missing, and the NFR-6 justification column is missing.
