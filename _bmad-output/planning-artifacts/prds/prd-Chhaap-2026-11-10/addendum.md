---
title: "PRD Addendum: Chhaap"
created: 2026-11-10
updated: 2026-11-10
---

# Addendum: Chhaap PRD

Detail for architecture and UX that doesn't belong in the PRD itself. The brief's addendum (`briefs/brief-Chhaap-2026-11-10/addendum.md`) holds the research digest and is not repeated here.

## Rejected alternative: freezing each code's style

The default offered was that each code keeps the style it was made with, so a reprint matches what was printed. The owner chose instead that codes always follow the client's current preset ("always update old codes when read").

- **Why:** the main reason for Chhaap is brand consistency. If old codes kept old styles, a client's codes would drift apart again over time.
- **Cost accepted:** after a rebrand, a reprint won't match copies already printed.
- **Effect on design:** a code stores no style. It is drawn on demand from the preset and its short link.

## Scan check timing

The owner first saw a design where the scan check ran on every draw, then chose to run it only when something changes.

- Each slug produces a different module pattern, so a preset passing on one sample code doesn't prove it passes on every code. A preset save therefore re-checks every code of that client that isn't archived.
- Store the result per code (passed or failed, reason, checked-at, preset version).

## Technical notes for architecture

### Rendering and export

- **Styling:** `qr-code-styling` (needs a browser DOM). Use error correction level H when a logo is present. Embed the logo as a data URI so SVG and PDF exports don't fetch it by URL. Logos in Firebase Storage need CORS set up.
- **Decoding:** candidates are `zxing-wasm` or `@zxing/library`.
- **Scan check decode size:** deferred to architecture (decision owner: Davinderpal). Suggested starting point: decode the rendered raster at export size and again at a small print-equivalent size (about 2 cm).
- **PDF:** SVG from `qr-code-styling`, converted to vector PDF via `svg2pdf.js` with `jsPDF` in the browser, or `pdf-lib`/`pdfkit` in a Cloud Function. Test logo embedding.

### Redirect

- **Redirect:** Firebase Hosting rewrite on `chhaap.link` to a Cloud Function (or similar) that reads the code's Firestore document. A 302 suits editable destinations. Scan count (FR-11): increment it without blocking the response, for example with a Firestore atomic increment after the redirect is sent.
- **Slugs:** random, short and unique; avoid look-alike characters (`0/O`, `1/l/I`). Keep them short so the code stays sparse.
- **Monitoring link:** a reserved slug (or health path) on `chhaap.link` that goes through the same redirect function but isn't added to the scan count and isn't a client code.

### Data and security

- **Preset history:** store each replaced preset version (who, when, settings) so the previous one can be restored. The per-code scan result can reference the preset version it was checked against.
- **Backups (OPS-4):** a scheduled Firestore export (managed export or scheduled backups) plus a copy of the logos bucket, kept in a separate bucket.
- **Allowlist enforcement:** check the team allowlist in Firestore security rules (and optionally a blocking Auth function), not only in the client.
- **v2 readiness:** keep clients and codes keyed so a future client user can be limited by security rules to one client.
