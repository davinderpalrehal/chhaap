# Glossary — Chhaap

These terms are used exactly as defined here across the spec, the companions and the architecture spine.

- **Team member**: a Davi Codes staff member whose email is on the team allowlist. All team members have the same rights, except that the owner also manages the allowlist.
- **Owner**: the team member who manages the team allowlist. There is exactly one.
- **Team allowlist**: the list of email addresses allowed to sign in. Sign-in with any other account is refused.
- **Client**: a Davi Codes customer that codes are made for. It has exactly one preset and zero or more codes.
- **Preset**: a client's saved brand style: dot style, corner style, colours (including the background), logo, and any other styling settings. It is applied to every code of that client whenever a code is drawn.
- **Code**: a QR code made for one client. It has a name, a short link, a destination, a status, a scan-check result and a scan count. It stores no style.
- **Short link**: the URL a code encodes, `https://chhaap.link/<slug>`. It never changes for the life of the code.
- **Slug**: the random, short, unique part of a short link, for example `x7Kq2`.
- **Destination**: the URL a short link redirects to. Team members can change it at any time.
- **Change log**: the record of every destination change and status change on a code: who made it, when, the old value and the new value. Entries can't be edited or deleted.
- **Preset history**: the record of every save of a client's preset: who saved it, when, and the settings it replaced.
- **Status**: one of three states.
  - **active**: the short link redirects.
  - **paused**: the short link shows the inactive-code page.
  - **archived**: the short link shows the inactive-code page. The code is also hidden from the default library view and left out of preset re-checks.
- **Inactive-code page**: the plain page shown to anyone who scans a paused or archived code. It doesn't name the client.
- **Scan check**: an automatic decode of a drawn code to confirm it reads back as its own short link. It runs only when something changes (CAP-12).
- **Scan count**: the number of scans that reached the redirect service. Cached scans are left out, so the library shows it as "at least N".
- **Library**: the list of a client's codes, where team members find, edit and download them.
- **Export**: a downloaded file of a code, either a vector PDF or a high-res PNG.
- **Quiet zone**: the blank margin around a code, measured in modules, which are the code's smallest squares.
