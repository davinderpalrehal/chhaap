# PRD Quality Review — Chhaap

_Calibration: internal tool, 4-person team, 2 clients, about 1 new code a month. Judged as a short internal PRD that feeds architecture, UX and epics. It was not marked down for missing enterprise sections._

## Overall verdict

This is a tight, honest PRD. It has a clear thesis (brand consistency plus independence from Bitly), testable FRs, product-specific NFRs, and an explicit trade-off record (style follows the current preset). The main risk is the scan check, which is the only quality gate and has no override, yet its edge behaviour is underspecified. Two things are open: what happens to a code that fails at creation, and whether one old or archived code can block a client's rebrand forever. Fix those two highs and it is ready for architecture.

## Decision-readiness — adequate

The big decisions are stated as decisions, and the costs are stated with them. Codes follow the current preset, and §9 says "a reprint after a rebrand won't match copies already printed... Accepted by the owner". The addendum records the rejected freeze-style option and why it was rejected. Changing the scan check from "every draw" to "only on change" is also recorded with its reasoning. The counter-metric SM-C2 ("Never loosen or skip the scan check to let a preset through") makes a real priority call.

The gap is that the PRD's strictest rule interacts with its other rules in a way nobody has signed off on. FR-4 refuses any preset save that makes "any" of the client's codes fail. FR-12 checks "every existing code of that client". FR-9 and §6.2 say codes can never be deleted. Put together, one marginal code from years ago, even an archived one, can permanently stop a client's rebrand from being saved. There is no `[NOTE FOR PM]` anywhere in the document, and this is the place one is needed. §10 Open Question 1 is not really open: FR-9, FR-10 and the Glossary entry for **Status** already decide that archived codes stop redirecting.

### Findings
- **[high]** A single old or archived code can block a rebrand permanently (§4.2 FR-4, §4.4 FR-12 case 2, §6.2 "deleting codes", UJ-4 edge case). Codes can't be deleted, and the preset re-check covers "every existing code" with no override. So once a client has a code that fails under the new brand, the only way out is to give up the rebrand. That includes archived codes nobody will reprint. The owner may want this, but the PRD doesn't show that the choice was made. *Fix:* Decide whether archived codes are left out of the preset re-check (and are re-checked when reactivated). Either way, add a `[NOTE FOR PM]` that states the intended outcome when a rebrand can't pass, for example "adjust the preset until it passes; no exceptions."
- **[medium]** Open Question 1 is already answered (§10 Q1 against §3 Status, FR-9, FR-10). "Should archived codes keep redirecting? This PRD assumes not." Three requirements already build on "not". The real question is about printed material: archiving a code kills every printed copy of it. *Fix:* Close the question by confirming the decision, and add a line to FR-9 warning that archiving disables printed copies. Or, if it's truly open, tag the FR-9 and FR-10 consequences `[ASSUMPTION]` and index them.
- **[low]** No `[NOTE FOR PM]` callouts at all (whole document). At this scale that's mostly fine, but the high finding above and the preset-history gap under Scope honesty are where one belongs. *Fix:* Add callouts at those two places.

## Substance over theater — strong

Nothing here is furniture. The Vision (§1) is specific to this team. It names `chhaap.link`, Bitly's downtime, the Firebase project, and "under a minute" reprints. It could not be swapped into another QR tool's PRD. The UJ names are labelled as "illustrative stand-ins", and no persona section was added. The NFRs carry numbers (NFR-3 500 ms, NFR-4 10 s / 30 s) or concrete constraints (NFR-1 "enforced on the server (Firebase security rules)"). The operational requirements (OPS-1 to OPS-3) are the right thing to add for a product whose failure mode is printed codes going dead.

### Findings
- **[medium]** SM-1 and SM-7 are true by construction (§8). SM-1 ("zero hand-styled codes") can't fail, because FR-4 and §6.2 remove per-code styling entirely. SM-7 ("100% of exported codes have a passed scan check") can't fail either, because FR-14 and FR-12 block export of failed codes. They restate the design instead of testing whether it works. *Fix:* Replace them with outcome checks that could actually fail, such as "no printer or client reports an off-brand or non-scanning Chhaap code" and "no reprint was needed because a code didn't scan." Or keep them and label them as invariants instead of metrics.

## Strategic coherence — strong

The thesis is explicit and the features follow from it. §2 says most of the team's time "is spent finding and reprinting codes, not making them". Library search (FR-13), the one-minute reprint target (SM-3), and on-demand drawing from the current preset (FR-4, addendum) all serve that. The second thesis, not depending on a third party's uptime, drives NFR-2, OPS-1, OPS-2 and SM-5. The MVP is a problem-solving MVP and the scope matches. Counter-metrics are present and well chosen. SM-C1 explicitly refuses to treat code volume as success.

### Findings
- **[low]** SM-3 and SM-4 have no measurement method (§8). "Takes under a minute" and "a couple of minutes or less" are never said to be timed. *Fix:* One line is enough at this scale, for example "measured by a timed walkthrough with each team member at launch." Make SM-4 a number ("under 2 minutes").

## Done-ness clarity — adequate

Most FRs are clearly testable. FR-1, FR-2, FR-6, FR-7, FR-10 and FR-14 have concrete consequences ("at least 2000 px wide", "quiet zone of at least 4 modules", "single A4 page", "within a minute"). The weak spot is the scan check (§4.4). It is the only gate on downloads and has no override, but what happens around it is undefined.

### Findings
- **[high]** The lifecycle of a code that fails at creation is undefined (§4.3 FR-6, §4.4 FR-12). FR-12 says "If a new code fails, it can't be downloaded". It doesn't say whether the failed code is saved, whether it uses up its slug, whether it appears in the library, or whether it can be retried later after the preset is fixed. FR-12 also says a preset save keeps "the stored results of all that client's codes" at "passed". That is false if failed new codes stay in the store. The `[ASSUMPTION]` about retrying with a fresh slug makes this worse: does each retry create a hidden code record? *Fix:* State one rule. Either (a) a code that fails at creation is never saved, the team member sees the reason and nothing is stored; or (b) it's saved with status "failed", shown in the library with no download, and re-checked on the next preset save. Then reconcile the "stay passed" sentence with that rule.
- **[medium]** "Shows the reason" can't be tested (FR-12, FR-4, UJ-1 "for example 'contrast too low'"). A decoder returns a value or a failure. It doesn't diagnose contrast. Without a defined list of reasons, nobody can write the acceptance test. *Fix:* List the reasons the system reports (for example "didn't decode", "decoded to the wrong value", "logo covers more than X%", "contrast below Y"), or reduce the requirement to "reports that it didn't decode, and suggests checking contrast and logo size."
- **[medium]** The scan check's pass condition doesn't say at what size or resolution the code is decoded (FR-12, glossary **Scan check**). The addendum says "decode the rendered raster at a realistic size". Because there's no override, this setting decides what the team is allowed to print. A check at 2000 px could pass a code that fails at business-card size. *Fix:* Add a consequence in FR-12 naming the decode size or sizes (for example "decoded from a raster at N px, and again at a small print-equivalent size of M px").
- **[medium]** Uptime monitoring inflates the scan count (FR-11 against OPS-2). FR-11 says "Each request to a code's short link adds one", and OPS-2 "requests one active short link regularly". That code's count will be mostly monitor hits. *Fix:* Have OPS-2 hit a dedicated monitor slug (or a health path) that isn't counted, and say so in FR-11. That also stops the monitor breaking when someone pauses the code it watches.
- **[low]** "About 30%" logo coverage is vague (FR-5). It's only a warning, so the impact is small, but whoever builds it still needs a number and a measurement method (area of the bounding box, or of the logo's pixels). *Fix:* "warns when the logo's bounding box exceeds 30% of the code's area."

## Scope honesty — adequate

This is a strength overall. §6.2 Out of Scope and §7 Non-Goals are specific and say why each item is excluded (Bitly migration "means reprinting", CMYK "left to the print shop"). FR-level "Out of Scope" lines block silent assumptions. There are 12 `[ASSUMPTION]` tags and 1 open question. For a low-stakes internal tool that density is fine, and every assumption is a sensible default. What's missing is any mention of two failure modes that matter more than most of what is covered.

### Findings
- **[medium]** Preset changes have no history and no undo (§4.2 FR-4, §9 "One preset edit affects every code"). The PRD logs destination changes and status changes, but not the action with the widest effect. A bad preset save changes every code for that client, and nobody knows who did it or what the previous settings were. The addendum mentions a "preset version" per check result, which hints at versioning the PRD doesn't require. *Fix:* Add a consequence to FR-4: "each save records who, when and the previous preset, and the previous preset can be restored". Or mark it explicitly `[NON-GOAL for MVP]`.
- **[medium]** No data backup or recovery is mentioned (§5.2, §9). Every printed code depends on Firestore documents. OPS-1 protects the domain, but nothing protects the data. Losing the `codes` collection by accident would break every printed code with no way back. *Fix:* Add an OPS-4 (for example a scheduled Firestore export to Cloud Storage), or list it in §9 as an accepted risk.
- **[low]** Open Question 1's assumption isn't tagged inline or indexed (§10, §11). "This PRD assumes not" is an assumption, but it isn't in the §11 index. *Fix:* Resolve it as described under Decision-readiness, or tag and index it.

## Downstream usability — strong

The Glossary (§3) is precise, and its terms are used consistently. **Code**, **Short link**, **Slug**, **Destination** and **Status** don't drift. The IDs are contiguous and unique: UJ-1 to UJ-4, FR-1 to FR-14, NFR-1 to NFR-8, OPS-1 to OPS-3, SM-1 to SM-7, SM-C1 and SM-C2. Every cross-reference I checked resolves. Each feature's description lists the UJs it supports, and each SM lists the FRs or NFRs it validates, so building epics and checking coverage is straightforward. The addendum separates architecture notes cleanly from requirements.

### Findings
- **[low]** "Destination log" doesn't cover status changes (§3 against FR-9). The Glossary defines the destination log as destination changes only, but FR-9 logs status changes "alongside destination changes". The architecture will have to guess whether that's one log or two. *Fix:* Rename the glossary term to "change log" covering both, or define a separate "status log".
- **[low]** UJ-4's protagonist suggests only the owner can edit presets (UJ-4 against FR-4, §3 Team member). "The owner updates a client's brand", but FR-4 and the Glossary give that right to any team member. UX may build an owner-only preset editor by mistake. *Fix:* Make the protagonist a named team member, or add "any team member can do this".

## Shape fit — strong

The shape is right for an internal tool with a single team role. There are four UJs, each with a named protagonist and a useful edge case, and none of them is padding. There's no persona section, no market section, and the research stays in the brief. The operational requirements section is a good adaptation that a generic template wouldn't include. The NFRs are short and specific to this product.

No findings.

## Mechanical notes

- **Template residue:** §0 says "globally numbered requirements (FR-1 to FR-N)". Replace with "FR-1 to FR-14".
- **Assumptions Index roundtrip:** all 12 inline `[ASSUMPTION]` tags appear in §11. FR-11's two inline tags are merged into one index line, which is fine. The only gap is §10 Q1's "This PRD assumes not", which isn't tagged or indexed.
- **Glossary against addendum:** the Glossary says a **Code** has "a scan-check result". The addendum stores "passed/failed, reason, checked-at, preset version". Consider adding those fields to the Glossary entry, because FR-12's behaviour depends on them.
- **Preset completeness:** §6.1 says "each with one preset, including a logo". FR-5 says a team member "can" upload a logo. Say whether a logo is required for a preset to be valid (FR-3 requires a preset before any code is made).
- **IDs and cross-references:** contiguous and resolving. No duplicates found.
- **Required sections:** all present for this stakes level.
