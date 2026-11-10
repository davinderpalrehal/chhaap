---
id: SPEC-Chhaap
companions:
  - glossary.md
  - user-journeys.md
  - capability-details.md
  - success-metrics.md
  - operations-and-risks.md
  - ../../planning-artifacts/architecture/architecture-Chhaap-2026-11-10/ARCHITECTURE-SPINE.md
sources:
  - ../../planning-artifacts/prds/prd-Chhaap-2026-11-10/prd.md
  - ../../planning-artifacts/prds/prd-Chhaap-2026-11-10/addendum.md
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# Chhaap

## Why

The Davi Codes team makes QR codes with Bitly's generator, which goes down at odd times and leaves them unable to make codes. The team is four people in Kenya serving two clients. Chhaap replaces Bitly with their own tool, built on infrastructure Davi Codes controls at close to no cost. Each client's brand is saved once, so every code comes out on brand without anyone setting styles by hand. Every code is dynamic, so a printed code can be pointed somewhere new without a reprint. The team makes about one code a month, so most of their time in Chhaap goes on finding and reprinting codes for printers. Terms are defined in `glossary.md`.

## Capabilities

- **CAP-1** (FR-1)
  - **intent:** A team member on the allowlist signs in with Google.
  - **success:** An allowlisted account reaches the app. Any other account sees "not authorised" and can read or write no data. No other sign-in provider is offered.
- **CAP-2** (FR-2)
  - **intent:** The owner adds and removes team emails on the allowlist.
  - **success:** An added email can sign in straight away, and a removed one is refused on its next request. Team members who aren't the owner can't see the list. The owner can't remove their own email.
- **CAP-3** (FR-3)
  - **intent:** A team member creates and renames clients.
  - **success:** A name that matches an existing client, ignoring case, is refused. Every client has a preset before any code is made for it. Clients can't be deleted.
- **CAP-4** (FR-4)
  - **intent:** A team member edits a client's preset, and the change applies to all of that client's codes, old and new.
  - **success:** Saving re-checks every code of the client that isn't archived. If any code fails, the save is refused and the failing codes are listed. Every save is added to the preset history, and restoring an older version goes through the same re-check.
- **CAP-5** (FR-5)
  - **intent:** A team member adds an optional logo to a preset.
  - **success:** Only PNG and SVG files are accepted. A logo covering more than 30% of the code shows a warning but doesn't block saving. The logo is embedded in every export.
- **CAP-6** (FR-6)
  - **intent:** A team member creates a code from a client, a destination URL and a name.
  - **success:** A destination that isn't an `http`/`https` URL is refused, and so is a missing name. The code gets a random slug and is saved only after it passes the scan check. A failing code is retried with fresh slugs. If every attempt fails, nothing is saved.
- **CAP-7** (FR-7)
  - **intent:** A team member points a printed code at a new destination without reprinting it.
  - **success:** Within an hour, scans reach the new destination. The change log records who made the change, when, and the old and new destinations, and the entry can't be edited. The scan check doesn't run again.
- **CAP-8** (FR-8)
  - **intent:** A team member renames a code.
  - **success:** The name changes, and the rename doesn't appear in the change log.
- **CAP-9** (FR-9)
  - **intent:** A team member pauses, archives or reactivates a code.
  - **success:** Within an hour, a paused or archived code's link shows the inactive-code page. The team member is warned before pausing or archiving. Taking a code out of the archive re-checks it, and it stays archived if it fails. Every status change is logged.
- **CAP-10** (FR-10)
  - **intent:** Anyone who scans a code reaches its destination while the code is active.
  - **success:** An active code redirects to its destination. A paused or archived code shows the inactive-code page, which doesn't name the client. An unknown slug shows a not-found page. Nobody needs to sign in.
- **CAP-11** (FR-11)
  - **intent:** The team sees roughly how often each code is scanned.
  - **success:** The library shows each code's count as "at least N". Requests from the uptime monitor aren't counted. A counting failure never blocks the redirect.
- **CAP-12** (FR-12)
  - **intent:** The system proves that a drawn code reads back as its own short link whenever something about it changes.
  - **success:** A code passes only if it decodes exactly at both 2000 px and 160 px. The check runs only when a code is created, when a preset is saved, and when a code leaves the archive. There is no override.
- **CAP-13** (FR-13)
  - **intent:** A team member finds a client's code by name.
  - **success:** The list shows each code's name, preview, destination, status, scan count, creator and creation date. Search matches part of a name, ignoring case. Archived codes are hidden unless the team member asks to see them.
- **CAP-14** (FR-14)
  - **intent:** A team member downloads a print-ready PDF or PNG of a code.
  - **success:** The PDF is an A4 page with the vector code centred on it. The PNG is at least 2000 px wide. Both have a quiet zone of 4 modules and use the current preset with its logo embedded. A download is offered only when the code's stored pass matches the current preset and library versions.
- **CAP-15** (OPS-2)
  - **intent:** The owner learns when the redirect stops working.
  - **success:** An external check requests a dedicated monitoring path on `chhaap.link` and emails the owner when it fails. That path is never a client's code and is never counted.
- **CAP-16** (OPS-4)
  - **intent:** Data deleted by mistake can be restored.
  - **success:** Clients, presets, codes, logs and logos are exported on a schedule to separate storage, and a restore from that export has been demonstrated.

Detailed rules for each capability are in `capability-details.md`. The user journeys they realise are in `user-journeys.md`.

## Constraints

- Only signed-in team members can read or write data, and this is enforced on the server. The redirect is the only public surface. (NFR-1)
- The redirect depends only on Davi Codes' Firebase project and the `chhaap.link` domain, never on a third-party QR or link service. (NFR-2)
- A code stores no style of its own. It is always drawn from its client's current preset.
- A short link never changes, and a slug is never reused, because codes and clients are never deleted.
- A code that fails the scan check can never be downloaded. There is no override, and scannability wins over brand fidelity.
- A redirect served from the cache responds in under 500 ms. A change to a destination or status reaches scanners within an hour. (NFR-3)
- Creating and checking a code takes under 10 s. Re-checking a preset takes under 30 s at about a dozen codes per client. (NFR-4)
- Running costs stay within Firebase's free usage on the Blaze plan, with a budget alert at about $5 a month. (NFR-5)
- Existing npm packages and Firebase services do the heavy lifting. Every new dependency is named in the architecture. (NFR-6)
- The v1 data model already allows v2 client users limited to their own client's codes, and more than one preset per client, without a migration. (NFR-7)
- Chhaap runs in desktop browsers: current Chrome, Safari, Firefox and Edge. (NFR-8)
- How it is built is governed by the adopted architecture spine (AD-1 to AD-12).

## Non-goals

- A client portal. It is planned for v2 and kept possible by NFR-7.
- Migrating Bitly codes. That means reprinting, and the owner will plan reprints per client when one is needed.
- Content other than URLs, such as vCards, Wi-Fi details or plain text.
- More than one preset per client, or style overrides on a single code.
- Freezing a code's style at the time it was made.
- Detailed scan analytics. There is no breakdown by time, place or device, and no bot filtering.
- Export formats other than PDF and PNG, such as CMYK, spot colour, EPS or JPG.
- Custom slugs, deleting codes, deleting clients, and roles beyond owner and team member.
- A general QR SaaS, or offering Chhaap to anyone outside Davi Codes and its clients.

## Success signal

- From launch, every new code is made in Chhaap. In a timed walkthrough with each team member, finding and downloading an existing code takes under a minute, and making a new print-ready code takes under 2 minutes. No printer or client reports a Chhaap code that is off-brand or doesn't scan. All metrics are in `success-metrics.md`.

## Assumptions

- Removing a team member takes effect on that person's next request (FR-2).
- Clients can't be deleted (FR-3).
- Scans of paused and archived codes are counted, and bots aren't filtered (FR-11).
- A failing new code is retried with a fresh slug up to 3 times (FR-12).
- Export file names include the client name and the code name (FR-14).
- The speed targets in NFR-3 and NFR-4 haven't been measured yet.
- Desktop browsers are enough for the team (NFR-8).
- Backups run weekly (OPS-4).
- The team and most scanners are in Kenya.
