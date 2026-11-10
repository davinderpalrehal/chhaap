---
title: "PRD: Chhaap"
status: final
created: 2026-11-10
updated: 2026-11-10
---

# PRD: Chhaap

_Chhaap means "stamp" in Hindi and Punjabi._

## 0. Document purpose

This PRD defines v1 of Chhaap, Davi Codes' internal tool for branded, dynamic QR codes. It is written for the owner (who approves scope) and for the downstream architecture, UX and epics work. It builds on the final product brief at `_bmad-output/planning-artifacts/briefs/brief-Chhaap-2026-11-10/` and does not repeat its market research. Terms in §3 Glossary are used exactly throughout. Features are grouped in §4, each with globally numbered requirements (FR-1 to FR-14). Anything inferred without confirmation is tagged `[ASSUMPTION]` and listed in §11. Technical choices and rejected alternatives live in `addendum.md`.

## 1. Vision

Chhaap is where the Davi Codes team makes, keeps and reprints QR codes for its clients. Each client's brand is saved once as a preset. A team member picks the client, types a URL, and gets a code that already looks right. Nobody sets colours or dot styles by hand, so codes for the same client always match.

Every code is dynamic. It holds a short link on `chhaap.link`, a domain Davi Codes owns, so the team can change where a printed code points without reprinting it. Every code is kept in the client's library and can be downloaded again as a print-ready PDF or PNG in under a minute.

Chhaap replaces Bitly's generator, which goes down at odd times and leaves the team unable to make codes. It runs on Davi Codes' own Firebase project, costs close to nothing, and is built mostly from existing npm packages and Firebase services.

## 2. Target user

The v1 audience is the Davi Codes team: four people, including the owner. They serve two clients and make about one new code a month, so most of their time in Chhaap is spent finding and reprinting codes, not making them.

### 2.1 Jobs to be done

- **Make a code that's on brand without thinking about it.** The team member shouldn't need to remember a client's colours, logo or dot style.
- **Answer a printer quickly.** When a printer asks for "the high-res file", find it and send it in under a minute.
- **Fix a printed code after the fact.** When a client's campaign URL changes, point the printed code somewhere new, and know who changed it and when.
- **Not depend on someone else's uptime.** Make and edit codes whenever needed, on infrastructure Davi Codes controls.

### 2.2 Non-users (v1)

- **Clients.** They don't sign in to Chhaap in v1. The team sends them files. A view-and-download portal for clients is planned for v2 (§6.2); NFR-7 sets the data-model requirement.
- **People who scan the codes.** They never see Chhaap's app, only the redirect, or the inactive-code page if a code is paused.

### 2.3 Key user journeys

The names below are illustrative stand-ins for team members.

- **UJ-1. Meera makes a code for a client's new flyer.**
  Meera is a team member and already signed in with Google. She opens Chhaap, picks the client, enters the flyer's landing-page URL and names the code "Spring flyer 2027". She generates it. Chhaap shows the code drawn in the client's preset, with a passed scan check. She downloads the PDF and emails it to the client's printer. **Edge case:** if the scan check fails, there is no download button. Chhaap says the code didn't read, suggests checking the preset's contrast and logo size, and links to the client's preset.

- **UJ-2. Raj reprints an old code for a printer.**
  A printer emails Raj asking for a high-res file of a code from last spring. He opens the client's library, searches "spring", finds the code, and downloads a PNG. It is drawn in the client's current preset. The whole thing takes under a minute.

- **UJ-3. Meera points a printed code at a new page.**
  The client's spring campaign has ended and the URL is dead. Meera opens the code in the library and changes its destination to the client's summer page. The change is logged with her name and the time. Anyone scanning the printed flyer now lands on the summer page. Nothing is reprinted.

- **UJ-4. Meera updates a client's brand.**
  A client rebrands with a new logo and colours. Meera (any team member can do this) edits the client's preset and saves it. Before saving, Chhaap re-checks every code for that client that isn't archived, checking each one against the new preset. All of them pass, so the preset is saved. From now on, every view and download of that client's codes uses the new preset. **Edge case:** if any code fails the check, the preset isn't saved. Chhaap lists the codes that failed and why, and suggests archiving any that are no longer in use.

## 3. Glossary

- **Team member** — A Davi Codes staff member whose email is on the team allowlist. All team members have the same rights, except that the owner also manages the team allowlist.
- **Owner** — The team member who manages the team allowlist. There is one owner.
- **Team allowlist** — The list of email addresses allowed to sign in. Sign-in with any other account is refused.
- **Client** — A Davi Codes customer that codes are made for. Has exactly one preset and zero or more codes.
- **Preset** — A client's saved brand style: dot style, corner style, colours, logo and other styling settings. Applied to every code of that client whenever it's drawn.
- **Code** — A QR code made for one client. It has a name, a short link, a destination, a status, and a scan-check result. It doesn't store its own style.
- **Short link** — The URL a code encodes: `https://chhaap.link/<slug>`. It never changes for the life of the code.
- **Slug** — The random, short, unique part of a short link (for example `x7Kq2`).
- **Destination** — The URL a short link redirects to. Team members can change it at any time.
- **Change log** — The record of every destination change and status change on a code: who, when, the old value and the new value.
- **Preset history** — The record of every save of a client's preset: who, when, and the settings it replaced.
- **Status** — A code is **active** (its short link redirects), **paused** (its short link shows the inactive-code page) or **archived** (its short link shows the inactive-code page, as for a paused code; it's also hidden from the default library view and left out of preset re-checks).
- **Inactive-code page** — The simple page shown to anyone who scans a paused or archived code.
- **Scan check** — An automatic decode of a drawn code to confirm it reads back as its short link. Runs only when something changes (see FR-12).
- **Library** — The list of a client's codes, where team members find, edit and download them.
- **Export** — A downloaded file of a code: a vector PDF or a high-res PNG.

## 4. Features

### 4.1 Sign-in and team access

**Description:** Team members sign in with Google through Firebase Authentication. Only emails on the team allowlist get in. The owner adds and removes team members. Every screen and every data read or write requires a signed-in team member. Realises all UJs.

#### FR-1: Google sign-in for team members

A person can sign in with a Google account. They get access only if that account's email is on the team allowlist.

**Consequences (testable):**
- A Google account whose email is on the team allowlist signs in and reaches the app.
- A Google account whose email isn't on the team allowlist is refused, sees a "not authorised" message, and can read or write no data.
- No other sign-in providers are offered in v1.

#### FR-2: Owner manages the team allowlist

The owner can add and remove email addresses on the team allowlist.

**Consequences (testable):**
- An email the owner adds can sign in straight away.
- After the owner removes an email, that person's next request is refused, even if they still have a session open. `[ASSUMPTION: removal takes effect on the next request, not at session expiry.]`
- Team members who aren't the owner can't see or change the team allowlist.
- The owner can't remove their own email.

### 4.2 Clients and presets

**Description:** Each client has one preset. A preset's changes apply to every code of that client, old and new, whenever a code is drawn. Realises UJ-1, UJ-4.

#### FR-3: Create and edit clients

A team member can create a client with a name, and rename it later.

**Consequences (testable):**
- A new client must have a preset before any code can be made for it.
- Client names are unique (ignoring case).
- Clients can't be deleted in v1. `[ASSUMPTION: follows from codes never being deleted.]`

#### FR-4: Edit a client's preset

A team member can set and change a client's preset: dot style, corner style, colours (including the background) and logo, plus any other styling settings the QR library supports. Realises UJ-4.

**Consequences (testable):**
- The preset editor shows a live preview of a sample code as settings change.
- On save, the preset applies to every view and export of all of that client's codes, including codes made before the change.
- Saving runs the scan check on every code of that client that isn't archived; see FR-12 for failure handling. The editor lists each failing code by name with the reason, and suggests archiving any code that's no longer in use.
- Each save adds an entry to the preset history: who, when, and the settings it replaced.
- A team member can restore the previous preset. Restoring counts as a save, so it goes through the same re-check.

**Notes:** `[NOTE FOR PM]` If a rebrand still can't pass after unused codes are archived, the preset's settings themselves have to change, usually contrast or logo size. Chhaap never overrides the scan check.

#### FR-5: Upload a client logo

A team member can upload a logo as part of a preset, in PNG or SVG format.

**Consequences (testable):**
- Files in other formats are refused with a message naming the accepted formats.
- A logo is optional. A preset without one is valid.
- If the logo's bounding box would cover more than 30% of the code's area, the editor shows a warning. The warning doesn't block saving; the scan check is the gate.
- The logo is embedded in every export, so exports never depend on fetching it from a URL.

### 4.3 Codes and short links

**Description:** A team member makes a code by choosing a client and entering a destination and a name. Chhaap gives the code a random short link and checks that it scans. Codes are never deleted; they can be paused or archived. Realises UJ-1, UJ-3.

#### FR-6: Create a code

A team member can create a code for a client by entering a destination URL and a name. Realises UJ-1.

**Consequences (testable):**
- The destination must be a valid `http` or `https` URL. Anything else is refused with a message.
- The name is required. Names don't have to be unique.
- The new code gets a random, unique slug. Team members can't choose the slug.
- The code is drawn in the client's current preset and scan-checked (FR-12) before it's saved.
- The code records who made it and when.

#### FR-7: Change a code's destination

A team member can change the destination of any code. Realises UJ-3.

**Consequences (testable):**
- The new destination follows the same URL rules as FR-6.
- Scans of the short link go to the new destination within a minute of saving. `[ASSUMPTION: 1-minute target; depends on caching in the redirect design.]`
- Every change adds an entry to the code's change log: who, when, old destination and new destination.
- The change log can be viewed on the code and can't be edited or deleted.
- Changing the destination doesn't re-run the scan check, because the short link, and so the drawn code, doesn't change.

#### FR-8: Rename a code

A team member can change a code's name.

**Consequences (testable):**
- Renames aren't recorded in the change log.

#### FR-9: Pause, archive and reactivate a code

A team member can set a code to active, paused or archived.

**Consequences (testable):**
- A paused or archived code's short link shows the inactive-code page instead of redirecting.
- Archived codes are hidden from the default library view, and shown when the team member asks to include them.
- Before pausing or archiving, the team member is warned that every printed copy of the code will stop redirecting.
- A paused code can be set active again, and its short link redirects again.
- Before an archived code is set active or paused, it's scan-checked against the client's current preset (FR-12). If it fails, it stays archived and the team member sees the reason.
- Codes can't be deleted, so a short link is never reused.
- Every status change adds an entry to the code's change log.

#### FR-10: Redirect short links

Anyone who scans a code, or opens its short link, is sent to its destination if the code is active.

**Consequences (testable):**
- `https://chhaap.link/<slug>` for an active code redirects to its current destination.
- A paused or archived code shows the inactive-code page. The page doesn't name the client.
- A slug that doesn't exist shows a plain not-found page.
- The redirect works without anyone being signed in.

#### FR-11: Scan count

The system counts scans of each code's short link, and the library shows the total for each code.

**Consequences (testable):**
- Each request to a code's short link adds one to that code's scan count.
- Requests from the uptime monitor (OPS-2) aren't counted, because it uses its own monitoring link rather than a client's code.
- Requests while a code is paused or archived are counted too. `[ASSUMPTION]`
- Counting never slows down or blocks the redirect. If counting fails, the redirect still happens.
- The count is a single total. It doesn't break scans down by time, place or device.
- The count is approximate. It may include link-preview fetchers and bots. `[ASSUMPTION: no bot filtering in v1.]`

### 4.4 Scan check

**Description:** Chhaap decodes each drawn code to confirm it reads back as its short link. To keep things simple, the check runs only when something changes, and the result is stored. Viewing and downloading use the stored result. Realises UJ-1, UJ-4.

#### FR-12: Run the scan check when something changes

The system runs the scan check in these cases, and only these:
1. When a code is created: that code is checked.
2. When a client's preset (including its logo) is saved: every code of that client that isn't archived is checked.
3. When an archived code is taken out of the archive: that code is checked.

**Consequences (testable):**

_Passing_
- A code passes only if decoding it returns exactly its short link.
- The size or sizes at which codes are decoded, including a small print-equivalent size, are set in the architecture. `[NOTE FOR PM]`

_On failure_
- If a new code fails, Chhaap retries with a fresh random slug without telling the team member, because each slug draws a different pattern. `[ASSUMPTION: up to three retries.]`
- If every attempt fails, nothing is saved and no slug is used up. The team member sees the reason and a link to the client's preset.
- The reason is either "didn't read" or "read a different link". The message also suggests checking the preset's colour contrast and logo size.
- If any code fails during a preset save, the preset isn't saved, and the editor shows the failing codes (FR-4).
- If an archived code fails when it's taken out of the archive, it stays archived (FR-9).
- There is no override. A code that fails the check can't be downloaded.

_Guarantees_
- Every saved code that isn't archived holds a "passed" result. An archived code's result may be out of date, so it's checked again before it leaves the archive.
- Viewing and downloading don't re-run the check.

### 4.5 Library and export

**Description:** Each client has a library of its codes. Team members find a code by name and download it as a vector PDF or a high-res PNG, always drawn in the client's current preset. Realises UJ-2.

#### FR-13: Browse and search a client's library

A team member can see all codes for a client and search them by name.

**Consequences (testable):**
- Each code in the list shows its name, preview, destination, status, scan count, creator and creation date.
- Search matches part of a name, ignoring case.
- Archived codes are hidden unless the team member asks to include them (FR-9).

#### FR-14: Export a code

A team member can download any code that has passed the scan check, as a PDF or a PNG. Realises UJ-1, UJ-2.

**Consequences (testable):**
- The PDF is a single A4 page with the code centred on it. The print shop scales it as needed, so the PDF carries no print-size note.
- The code in the PDF is vector, not a raster image wrapped in a PDF.
- The PNG is at least 2000 px wide.
- Both include a blank margin (quiet zone) at least 4 modules wide on every side.
- Both are drawn in the client's current preset, with the logo embedded.
- The file name includes the client name and the code name. `[ASSUMPTION]`

**Out of Scope:** CMYK or spot-colour output, EPS, JPG.

## 5. Cross-cutting requirements

### 5.1 Non-functional requirements

- **NFR-1 Access control.** Only signed-in team members can read and write data. This is enforced on the server (Firebase security rules), not only in the app. The one public surface is the redirect (FR-10).
- **NFR-2 Redirect reliability.** The redirect depends only on Davi Codes' Firebase project and the `chhaap.link` domain, never on a third-party QR or link service.
- **NFR-3 Redirect speed.** A redirect responds in under 500 ms for a typical scan. `[ASSUMPTION: target, not measured.]`
- **NFR-4 Generation speed.** Creating and scan-checking a code takes under 10 seconds. A preset save that re-checks all of a client's codes takes under 30 seconds at the current scale (about a dozen codes per client). `[ASSUMPTION]`
- **NFR-5 Cost.** Running costs stay within Firebase's free tier, or close to zero, at the current scale. `[ASSUMPTION: no explicit ceiling given.]`
- **NFR-6 Build approach.** Use existing npm packages and Firebase services for the heavy lifting. Custom code is mostly glue. Any new dependency is named and justified in the architecture.
- **NFR-7 Ready for later features.** The data model lets a v2 client user be given view-and-download access to their own client's codes only, without migrating v1 data. It also leaves room for more than one preset per client later.
- **NFR-8 Platform.** Desktop web browsers (current Chrome, Safari, Firefox, Edge). Mobile layouts and native apps aren't required. `[ASSUMPTION: desktop browsers are enough for team use.]`

### 5.2 Operational requirements

These keep printed codes working. Most are owner tasks rather than software.

- **OPS-1 Domain.** `chhaap.link` has auto-renew and the registrar lock turned on at Namecheap, with a current payment card, for as long as any printed code exists.
- **OPS-2 Uptime monitoring.** A free external uptime check regularly requests a dedicated monitoring link on `chhaap.link`, served by the same redirect as client codes, and emails the owner if it fails. It never uses a client's code, so pausing a code can't break it.
- **OPS-3 Library upkeep.** The owner accepts maintaining a fork of the QR styling library if the library's maintainers stop updating it.
- **OPS-4 Data backup.** Clients, presets, codes, logs and logos are exported on a schedule to separate cloud storage, so they can be restored if deleted by mistake. `[ASSUMPTION: weekly.]`

## 6. MVP scope

### 6.1 In scope

- Google sign-in limited to the team allowlist, with the owner managing it.
- Clients, each with one preset (logo optional), with preset history and restore.
- Codes for URLs only, all dynamic on `chhaap.link`, with random slugs.
- Destination and status changes, recorded in each code's change log.
- Pause, archive and reactivate. No deletion.
- Scan check whenever something changes (FR-12).
- A library for each client, with search.
- Vector PDF and high-res PNG export.
- Redirect, inactive-code page and not-found page.
- Uptime monitoring and domain safeguards.

### 6.2 Out of scope for MVP

- **Client portal (v2).** Client users, once added to their own allowlist, sign in to view and download their own codes. Planned, and NFR-7 keeps the door open.
- **Moving Bitly codes across.** Printed Bitly codes hold `bit.ly` links, so moving means reprinting. The owner will make a per-client reprint plan when a reprint is next needed, not before.
- **Content other than URLs** (vCard, Wi-Fi, plain text). Possible later.
- **More than one preset per client, or style overrides on one code.**
- **Detailed scan analytics.** v1 has only a total count per code (FR-11).
- **Export formats beyond PDF and PNG** (CMYK or spot colour, EPS, JPG). Colour conversion is left to the print shop; see FR-14.
- **Custom slugs, deleting codes, deleting clients.**
- **Roles beyond owner and team member.**

## 7. Non-goals

- Chhaap isn't a general QR SaaS and won't compete with commercial tools on features.
- Chhaap won't be offered to anyone outside Davi Codes and its clients.
- Chhaap won't freeze a code's style at creation. Old codes always follow the current preset (see `addendum.md` for why).

## 8. Success metrics

**Primary**
- **SM-1 No bad codes reach print:** no printer or client reports a Chhaap code that's off-brand or doesn't scan. Validates FR-4, FR-12, FR-14.
- **SM-2 Bitly replaced:** From launch, 100% of new codes are made in Chhaap. Validates FR-6.
- **SM-3 Fast reprints:** finding and downloading an existing code takes under a minute. Measured by a timed walkthrough with each team member at launch. Validates FR-13, FR-14.
- **SM-4 Fast new codes:** making a new code and downloading it, print-ready, takes under 2 minutes. Measured the same way as SM-3. Validates FR-6, FR-12, FR-14.

**Secondary**
- **SM-5 No blocked days:** the team is never unable to make or edit a code because a third-party service is down. Validates NFR-2.
- **SM-6 Redirect uptime:** no Chhaap code stops working because of the redirect or the domain; every outage caught by OPS-2 is fixed. Validates FR-10, OPS-1, OPS-2.

**Design guarantees** (not measured; these are why SM-1 is expected to hold)
- Every export uses the client's current preset; no code is styled by hand (FR-4, FR-14).
- Every export comes from a code with a passed scan check (FR-12, FR-14).

**Counter-metrics (do not optimise)**
- **SM-C1 Number of codes made.** At about one a month, making more codes isn't the goal. Counterbalances SM-2.
- **SM-C2 Brand fidelity at the expense of scannability.** Never loosen or skip the scan check to let a preset through. Counterbalances SM-1.

## 9. Risks

- **Reprints follow the current brand.** Because codes always use the current preset, a reprint after a rebrand won't match copies already printed. Both still scan to the same place. Accepted by the owner.
- **One preset edit affects every code.** Mitigated by re-checking all of a client's codes that aren't archived before a preset is saved, and by preset history with restore (FR-4, FR-12).
- **Checking only on change.** If the styling library changes how it draws codes after an upgrade, stored scan results could become stale. Mitigation: re-check all codes after any upgrade of the styling or decoding library. `[ASSUMPTION]`
- **Operational risks** (domain expiry, a stalled styling library, data loss) are handled as owner tasks in OPS-1, OPS-3 and OPS-4.

## 10. Open questions

None.

**Deferred**
- **Scan-check decode size.** Decision owner: Davinderpal (the owner). Decide in the architecture (FR-12).
- **Bitly reprint plan.** Decision owner: Davinderpal (the owner). Revisit when a client's Bitly code next needs reprinting.

## 11. Assumptions index

- §4.1 FR-2 — Removing a team member takes effect on their next request.
- §4.2 FR-3 — Clients can't be deleted.
- §4.3 FR-7 — Destination changes take effect within 1 minute.
- §4.3 FR-11 — Scans of paused or archived codes are counted; no bot filtering.
- §4.4 FR-12 — A failing new code is retried with a fresh slug up to 3 times.
- §4.5 FR-14 — Export file names include client and code names.
- §5.1 NFR-3 — Redirect under 500 ms.
- §5.1 NFR-4 — Code creation under 10 s; preset re-check under 30 s.
- §5.1 NFR-5 — Free tier or near-zero cost (no ceiling given).
- §5.1 NFR-8 — Desktop browsers are enough; mobile isn't required.
- §5.2 OPS-4 — Backups run weekly.
- §9 — Re-check all codes after a styling or decoding library upgrade.
