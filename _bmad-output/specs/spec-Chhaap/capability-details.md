# Capability details — Chhaap

These are rules for each capability that its one-line success in `SPEC.md` doesn't hold. Every rule here is testable.

## CAP-1 Sign-in

- Every screen, and every read or write of data, needs a signed-in team member.

## CAP-4 Presets

- The preset editor shows a live preview of a sample code as settings change.
- A preset covers dot style, corner style, colours (including the background), logo, and any other styling setting the QR library supports.
- A preset-history entry records who saved the preset, when, and the settings it replaced.
- If a rebrand still fails after unused codes are archived, the preset's settings must change, usually the contrast or the logo size. The check is never overridden.

## CAP-5 Logos

- A file in any other format is refused, with a message naming PNG and SVG.
- A preset without a logo is valid.
- The 30% warning measures the logo's bounding box against the code's area.
- Exports never fetch the logo from a URL. It is embedded in the file.

## CAP-6 Creating a code

- Names don't have to be unique, and team members can't choose the slug.
- The code records who made it and when.
- A failing attempt is retried with a fresh slug without telling the team member, because each slug draws a different pattern.
- If every attempt fails, no slug is used up. The team member sees the reason and a link to the client's preset.

## CAP-7 Changing a destination

- The new destination must be a valid `http` or `https` URL, the same rule as CAP-6.
- The change log can be viewed on the code. Its entries can't be edited or deleted.
- The destination can change but the short link can't, so the drawn code stays the same and isn't re-checked.

## CAP-9 Status

- The warning before pausing or archiving says that every printed copy of the code will stop redirecting.
- Archived codes are hidden from the default library view and shown when the team member asks to include them.
- A paused code can be set active again. Within an hour its short link redirects again.
- An archived code is scan-checked against the client's current preset before it becomes active or paused. If it fails, it stays archived and the team member sees the reason.
- A status-change entry in the change log records who changed it, when, and the old and new status.

## CAP-11 Scan count

- A scan of a paused or archived code is counted too.
- The count is one total for each code, and may include link-preview fetchers and bots.

## CAP-12 Scan check

- The only failure reasons are "didn't read" and "read a different link". Each failure message also suggests checking the preset's colour contrast and logo size.
- A preset save that fails leaves the preset unsaved and lists the failing codes (CAP-4). A code that fails on leaving the archive stays archived (CAP-9).
- Every saved code that isn't archived holds a passed result. An archived code's result may be out of date, which is why it's checked again before it leaves the archive.
- Viewing and downloading never re-run the check. They use the stored result.
- A stored result counts only for the preset version and the drawing-library versions it was checked against. If either changes, the code can't be downloaded until it's checked again.

## CAP-14 Export

- The PDF carries no print-size note. The print shop scales it as needed.
- The code in the PDF is vector, not a raster image wrapped in a PDF.
