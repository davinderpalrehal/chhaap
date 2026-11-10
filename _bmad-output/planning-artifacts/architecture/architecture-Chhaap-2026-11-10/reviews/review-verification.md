---
reviews: ARCHITECTURE-SPINE.md (Chhaap, draft 2026-11-10)
lens: verification — are committed decisions reality-checked, not asserted from training data?
date: 2026-11-10
verdict: PASS WITH FIXES — every version number is current, but 2 toolchain pins conflict with the stack, and 1 runtime behaviour (AD-9) is wrong
---

# Verification review — Chhaap architecture spine

## Method

- `npm view <pkg> version` (plus `peerDependencies`/`engines`) run on 2026-11-10 for every package in the Stack table.
- Scaffolded `create-vue@3.24.0 --ts --router --pinia --vitest --playwright --eslint --bare` in a scratch directory and read the generated `package.json`/`tsconfig*.json`.
- Unpacked `firebase-tools@15.35.0`, `svg2pdf.js@2.9.0`, and `qr-code-styling@1.9.2`, and grepped their source for runtime tables and SVG feature support.
- Read the live docs: Cloud Run functions runtime support, Firebase Hosting multisite and Functions rewrites, Storage rules conditions, Functions tips, and the zxing-wasm, svg2pdf.js and qr-code-styling READMEs.

## 1. Version currency (Stack table)

All 19 pinned versions match `npm view … version` today. The `.memlog.md` `(version)` entry shows the versions were pulled from the registry, not from memory.

| Package | Spine | npm latest 2026-11-10 | Status |
| --- | --- | --- | --- |
| zod | 4.6.7 | 4.6.7 | OK |
| typescript | 7.0.2 | 7.0.2 | Current, but **incompatible with tooling** (F-1) |
| vue / create-vue | 3.5.45 / 3.24.0 | 3.5.45 / 3.24.0 | OK |
| vite | 8.3.7 | 8.3.7 | OK (engines `^20.19 \|\| >=22.12`) |
| vue-router / pinia | 5.5.0 / 4.1.0 | 5.5.0 / 4.1.0 | OK (vue-router peers vite ^7\|\|^8, pinia ^3\|\|^4) |
| firebase | 13.2.0 | 13.2.0 | OK |
| firebase-functions / firebase-admin | 7.4.0 / 14.5.0 | 7.4.0 / 14.5.0 | OK (functions peers admin ^11–^14; admin engines node >=22) |
| firebase-tools | 15.35.0 | 15.35.0 | OK |
| qr-code-styling | 1.9.2 | 1.9.2 (last publish 2025-04-11) | OK; stale-package risk correctly flagged |
| zxing-wasm | 3.1.6 | 3.1.6 (2026-10-19) | OK |
| jspdf / svg2pdf.js | 4.2.1 / 2.9.0 | 4.2.1 / 2.9.0 | OK (svg2pdf peers `jspdf ^2\|\|^3\|\|^4`) |
| vitest / @firebase/rules-unit-testing | 5.1.0 / 6.0.0 | 5.1.0 / 6.0.0 | Current, but **Node engine conflict** (F-2) |
| Playwright | 1.65.0 | 1.65.0 | OK |

## 2. Live create-vue 3.24.0 defaults vs the spine

The scaffold does **not** produce the spine's stack:

| Item | create-vue 3.24.0 generates | Spine says | Gap |
| --- | --- | --- | --- |
| typescript | `~6.0.0` | 7.0.2 | TS 7 is only offered via the opt-in `--tsgo` flag (typescript-native-bridge) |
| vitest | `^4.1.11` | 5.1.0 | Must be bumped by hand |
| vue / router / pinia | `^3.5.42` / `^5.3.1` / `^4.0.3` | 3.5.45 / 5.5.0 / 4.1.0 | Caret ranges resolve to the spine's versions. OK |
| @playwright/test | `^1.63.0` | 1.65.0 | Resolves. OK |
| Node baseline | `@tsconfig/node24`, `@types/node ^24`, engines `^22.18.0 \|\| >=24.12.0` | Functions on Node 22 | Starter already assumes Node 24 (F-3) |
| Lint | ESLint 10 + oxlint 1.82, `@vue/eslint-config-typescript` | not stated | typescript-eslint is pulled in (F-1) |
| Type check | `vue-tsc --build` (vue-tsc 3.3.x) | not stated | Needs the classic TS JS API (F-1) |

The spine says "Vue (via create-vue)" but pins versions that the starter does not emit. Agents who scaffold and then follow the Stack table will hit F-1 at once.

## 3. Fit claims

### 3.1 qr-code-styling in the browser → SVG → svg2pdf.js + jsPDF (vector PDF) — PLAUSIBLE, NOT PROVEN

- qr-code-styling 1.9.2 runs in the browser natively. `type: 'svg'` and `getRawData('svg')` return a Blob. `qrOptions.errorCorrectionLevel: 'H'` exists (the default is Q, so AD-2 must set it explicitly).
- `imageOptions.saveAsBlob` defaults to `true`, which embeds the logo as a base64 data URI inside the SVG. That matches AD-6's "exports embed the logo as a data URI".
- The SVG output uses `clipPath`, `linearGradient`/`radialGradient`, `rect`/`path`/`circle`, and one `<image>` (grepped from source).
- svg2pdf.js 2.9.0 source handles `clipPath`, linear and radial gradients, `pattern` and `<image>`. For `<image>` with an `image/svg+xml` payload, it parses the nested SVG and renders it as vector (ImageNode.renderCore). No `mask` or `filter` support was found.
- **Unconfirmed risks:**
  - svg2pdf.js states it supports "only a limited part of the SVG specification" and cannot convert arbitrary SVGs. **Client-uploaded SVG logos** (AD-6 allows `.svg`) often use masks, filters, embedded fonts or `<text>`, which will drop or mis-render in the PDF. The PNG export and the scan check are unaffected, so the PDF could differ from the checked drawing. That undercuts the intent of AD-2.
  - No spike has been run end to end (QR SVG with logo → `doc.svg()` → PDF → re-decode).
- **Fix:** add a build-time spike or acceptance test that exports PDFs for each dot style with PNG and SVG logos, rasterises the PDF and runs `scanCheck` on it. Either restrict SVG logos to a sanitised subset, or rasterise SVG logos to high-res PNG before they go into the PDF. Record the choice in AD-6.

### 3.2 zxing-wasm decoding in the browser — CONFIRMED, one gap

- `readBarcodes` accepts `ImageData`/`Blob`/`ArrayBuffer`/`Uint8Array` and reads `QRCode`. The `./reader` subpath avoids shipping the writer.
- **Gap:** by default the `.wasm` binary is fetched from **jsDelivr CDN** at first use. That adds a third-party runtime dependency to the scan check, and the check gates every save (AD-3). It breaks under a strict CSP or when the CDN is down, and the version can drift if pinned wrongly.
- **Fix:** add to AD-2 that `packages/render` calls `prepareZXingModule({ overrides: { locateFile } })` with a self-hosted, version-matched `zxing_reader.wasm` (for example a Vite `?url` import of `zxing-wasm/reader/zxing_reader.wasm`). Also pin the reader options (`formats: ['QRCode']`, `tryHarder`) so that "pass" is deterministic.

### 3.3 Firebase Hosting: two sites in one project; `/**` rewritten to a 2nd-gen function — CONFIRMED, with a region caveat

- Multisite is supported (up to 36 sites per project). Configure it with `firebase target:apply hosting <target> <siteId>` and a `hosting` array in `firebase.json`. Each site can have its own custom domain, so `chhaap.link` works.
- A rewrite to a 2nd-gen function uses `{"function": {"functionId": "redirect", "region": "europe-west2", "pinTag": true?}}`. Hosting enforces a 60 s timeout.
- **Caveat:** the Hosting docs recommend colocating rewrite targets in us-west1, us-central1, us-east1, europe-west1 or asia-east1. **europe-west2 is not on that list.** It is a valid 2nd-gen region and the rewrite works with `region` set explicitly, but each cache-miss redirect pays an extra origin hop. NFR-3 latency should be checked against this, or europe-west1 considered (AD-10 is already marked `[ASSUMPTION]`).
- **Still an assumption (correctly logged in the memlog, missing from the spine):** whether the Hosting CDN caches **302** responses that carry `s-maxage`. Move this into AD-9 as `[ASSUMPTION — verify in build]`.

### 3.4 Storage rules calling `firestore.exists()` — CONFIRMED, conditions apply

- Supported in Cloud Storage Security Rules, with these conditions:
  - full document paths with `$(var)` escaping
  - **default Firestore database only**
  - **max 2 Firestore documents per rule evaluation**
  - reads are billed
  - a one-time IAM permission grant that the console or CLI prompts for on first deploy
- The spine never states how `storage.rules` authorises the client logo upload in AD-1/AD-6. It should say: `request.auth.token.email_verified && firestore.exists(/databases/(default)/documents/allowlist/$(request.auth.token.email.lower()))`, plus content-type/size checks and `allow update, delete: if false`. That uses 1 of the 2 lookups. A check that `clients/{clientId}` exists would use the 2nd and hit the limit.
- **Fix:** add the rule shape to AD-6/AD-8 and record the IAM-grant step as an owner task.

### 3.5 Node 22 on Cloud Functions — VALID BUT SHORT-LIVED

- From the Cloud Run functions runtime table (docs.cloud.google.com) and `firebase-tools@15.35.0`'s own runtime table:
  - nodejs22: GA, **deprecated 2027-04-30** (about 5.5 months from today)
  - nodejs24: GA, deprecated 2028-04-30, decommissioned 2028-10-31
- The firebase.google.com "manage functions" page still lists only 18/20/22 and is stale. The CLI already accepts `nodejs24`.
- **Fix:** pin the Functions runtime to **Node 24**. That also lines up with create-vue's Node 24 baseline and with F-2.

### 3.6 Vitest 5 + @firebase/rules-unit-testing 6 — COMPATIBLE ONLY ON NODE ≥ 24.12

- `@firebase/rules-unit-testing@6.0.0`: `engines.node >=24.12.0`, peer `firebase ^13.0.0` (13.2.0 is fine). It is framework-agnostic, so it works with Vitest.
- `vitest@5.1.0`: `engines.node ^22.12.0 || ^24.0.0 || >=26.0.0`, peer `vite ^6.4 || ^7 || ^8` (8.3.7 is fine).
- **Conflict:** the spine's only stated Node version is 22. Rules tests would not install cleanly (engine mismatch) or would be unsupported on a Node 22 dev or CI machine. `@firebase/rules-unit-testing@5.x` (engines >=20) is the Node 22 fallback.
- **Fix:** state one dev/CI Node version (24.12+) in the Stack table, separate from or equal to the Functions runtime.

## 4. Findings

| ID | Severity | Finding | Suggested fix |
| --- | --- | --- | --- |
| F-1 | **High** | TypeScript 7.0.2 has no classic JS API (`exports["."]` is only `version.cjs`). `vue-tsc` and `@typescript-eslint/parser` (peer `typescript >=4.8.4 <6.1.0`), which create-vue wires in, cannot run on it. create-vue 3.24.0 itself pins `typescript ~6.0.0`. | Pin TypeScript **~6.0** for apps/web and shared packages, or adopt create-vue's `--tsgo` bridge on purpose and record it. Note it in Stack. |
| F-2 | **High** | AD-9 increments `scanCount` "after the response is sent". In Cloud Functions/Cloud Run, code after the response gets no CPU and may never run. Counts would be silently lost (worse than the CDN under-count already accepted). | Await the increment before `res.redirect()` (adds about 10–30 ms), or fire it to a Pub/Sub/Task and await the publish. Remove "after the response is sent" from AD-9. |
| F-3 | Medium | Node 22 runtime is deprecated 2027-04-30. `@firebase/rules-unit-testing@6` needs Node ≥24.12. The create-vue scaffold targets Node 24. The spine's single "Node 22" can't satisfy all three. | Pin Functions runtime **nodejs24** and dev/CI Node **24.12+** in Stack. |
| F-4 | Medium | The SVG→PDF path is unproven for client SVG logos. svg2pdf.js supports only a subset of SVG (no mask/filter found), so the PDF can differ from the drawing that passed the scan check. | Add an export round-trip spike/test (PDF → raster → `scanCheck`). Rasterise or sanitise SVG logos before PDF embedding, and record it in AD-6. |
| F-5 | Medium | zxing-wasm loads its `.wasm` from jsDelivr by default. The save-gating scan check would depend on a third-party CDN at runtime. | Self-host a version-matched `zxing_reader.wasm` via `prepareZXingModule({overrides:{locateFile}})`, and pin `formats:['QRCode']` and `tryHarder` in AD-2/AD-3. |
| F-6 | Low | Vitest 5.1.0 is pinned, but create-vue scaffolds `^4.1.11`. Builders following "via create-vue" get v4. | Say in Stack that the scaffold must be bumped to vitest 5 (or accept 4.x). |
| F-7 | Low | europe-west2 is not in Hosting's recommended colocated regions for function rewrites. Unconfirmed: whether Hosting's CDN caches 302 responses. Both are memlog-only, not in the spine. | Mark both `[ASSUMPTION — verify in build]` in AD-9/AD-10, or consider europe-west1. |
| F-8 | Low | The Storage rules gate for logo upload (`firestore.exists` on allowlist) is implied but not stated. It is limited to the default DB, 2 doc lookups per evaluation, and needs a one-time IAM grant. | State the rule shape and limits in AD-6/AD-8. Add the IAM grant as an owner task. |

## 5. What was well verified

- Version numbers were pulled from npm on the day (memlog `(version)` entry). All of them still match.
- The Blaze requirement, the 2nd-gen rewrite syntax and the Hosting 60 s timeout were checked against firebase.google.com (memlog `(constraint)`).
- The qr-code-styling staleness (last publish 2025-04-11) is flagged with OPS-3 fork risk.
- The 302 CDN-caching uncertainty was recognised as an assumption in the memlog.

## Sources

- npm registry (`npm view`), 2026-11-10
- create-vue 3.24.0 scaffold output (local)
- https://docs.cloud.google.com/functions/docs/runtime-support
- https://firebase.google.com/docs/functions/manage-functions
- https://firebase.google.com/docs/functions/tips
- https://firebase.google.com/docs/hosting/multisites
- https://firebase.google.com/docs/hosting/functions
- https://firebase.google.com/docs/functions/locations
- https://firebase.google.com/docs/storage/security/rules-conditions
- https://github.com/yWorks/svg2pdf.js
- https://github.com/kozakdenys/qr-code-styling
- https://github.com/Sec-ant/zxing-wasm
