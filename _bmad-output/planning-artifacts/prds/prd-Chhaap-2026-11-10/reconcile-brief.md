# Reconciliation: product brief → PRD

Input: `briefs/brief-Chhaap-2026-11-10/` (brief.md, addendum.md, .memlog.md). Checked against `prd.md` and `addendum.md` on 2026-11-10.

## Covered

Brand presets, dynamic links on chhaap.link, logged destination edits, scan check before download, PDF + PNG export, per-client library, Firebase + Google sign-in, v2 client portal (deferred, NFR-7), URL-only content, one preset per client, no CMYK, Bitly migration deferred, domain auto-renew and lock, redirect monitoring, library fork stance, scan count (now in v1), cost and npm-first philosophy, "small, cheap, owned" tone (§1 Vision, §7 Non-Goals).

## Gaps

1. **Time to make a new code.** The brief's success definition says a correctly branded, print-ready code "in a couple of minutes". The PRD only had NFR-4 (system speed), with no success metric for the whole task. → Add SM for end-to-end creation time.
2. **Room for more presets later.** The brief addendum says the data model could leave room for more than one preset per client. The PRD's out-of-scope list didn't say so. → Add to NFR-7.

## Not carried (intentionally)

- Research digest (pricing, library forks, print rules) stays in the brief addendum; the PRD addendum points to it.
- Brief's original "scan count only if cheap" is superseded by the decision to include it in v1.
