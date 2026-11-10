---
title: "Product Brief Addendum: Chhaap"
created: 2026-11-10
updated: 2026-11-10
---

# Addendum: Chhaap

Detail that belongs downstream (PRD, architecture) rather than in the brief.

## Technical constraints (from the user, 2026-11-10)

- Web app only. No mobile or desktop clients.
- Hosted on Firebase.
- Sign-in uses social logins through Firebase Authentication.
- Build philosophy: use npm packages for the heavy lifting wherever possible. Write only the code needed to glue them together.
- Greenfield: no existing code.

## Research digest (web search, 2026-11-10)

The search was shallow. Items marked _unverified_ come from aggregator sites or from memory. Check them before relying on them in the PRD or architecture.

### Styled QR libraries

- **qr-code-styling** (kozakdenys), npm 1.9.2: roughly 3k stars and 117 open issues. Last push to GitHub was 2026-02-14. Activity is low but it's usable. It offers dot styles, corner styles, gradients and a logo with margin, and exports PNG, JPEG, WEBP or SVG. It has no PDF, EPS or CMYK output, and it needs a browser DOM.
- Forks exist (@liquid-js/qr-code-styling, styled-qr-code, custom-qr-code, a linkbreakers fork). No clear successor has emerged. _Vet before choosing._
- Gotchas (_partly unverified_):
  - An exported SVG may link to the logo by URL. Embed the logo as a data URI instead.
  - Logos from Firebase Storage need CORS set up.
  - Use error correction H with a logo, and keep the logo at about 30% of the code or less.
  - Some style combinations hurt scannability (upstream issue #105), so decode every code to check it.
- Plain-QR packages (qrcode, react-qr-code) can't style codes.

### Print readiness

- Leave a quiet zone of 4 modules on each side (ISO/IEC 18004).
- Print at 10 mm or larger, and about 2 cm is typical for close-range scanning. As a rule of thumb, width = scanning distance / 10.
- Error correction levels recover L 7%, M 15%, Q 25% and H 30% of the code. A higher level makes the code denser, so print it larger.
- Use dark modules on a light background with strong contrast. Watch out for low-contrast or inverted brand colours.
- Give printers vector files (SVG, PDF or EPS). CMYK: _no source found_. SVG and PNG are RGB only, so CMYK may need a conversion step or the print shop.
- Possible tools (_unverified_):
  - Decode checking: zxing-wasm or @zxing/library, or jsQR (which is old).
  - Vector PDF: svg2pdf.js with jsPDF, or pdf-lib.
  - A Cloud Function for anything that has to run on the server.

### Static vs dynamic codes and build vs buy

- **Static codes** hold the data directly. They're free forever but can't be changed or tracked.
- **Dynamic codes** hold a short redirect link. You can edit the destination, see scan analytics and pause the code. With a vendor's link, the codes stop working if the subscription lapses.
- Building dynamic codes on Firebase yourself is possible: a Hosting rewrite plus a Function or a Firestore redirect document and scan counter, on a domain you own. It's a small amount of work and avoids lock-in.
- Indicative pricing (_aggregators, may be out of date_):
  - Uniqode: about $5 to $99 a month. Multi-team features start on the Plus plan.
  - QRTRAC Agency: $250 a month, with multiple clients.
  - Bitly: $10 to $300 a month, with low QR limits.
  - QR TIGER: from about $7 a month.
- Judgement: commercial tools focus on analytics and team management. Styled static export with per-client presets is easy to build. Buying makes most sense only if you want hosted dynamic codes without maintaining them.

Sources: registry.npmjs.org/qr-code-styling, api.github.com/repos/kozakdenys/qr-code-styling, socket.dev, myqr.deloitte.com, qr-code-generator.com/blog/qr-code-design-rules, delivr.com, hackceleration.com, capterra.com, replug.io, g2.com.

## Downstream detail from the user's answers (2026-11-10)

- **Print formats:** PDF is a must, and high-res PNG is also needed. Printers usually ask for "high-res JPG or PDF". We don't know who the printers are, so there's no fixed spec from them yet.
- **PDF approach** (for the architecture): generate the SVG with qr-code-styling, then convert it to a vector PDF. Options are svg2pdf.js with jsPDF in the browser, or pdf-lib/pdfkit in a Cloud Function. Test that the logo embeds correctly.
- **Library stance:** the owner is willing to maintain a fork of qr-code-styling, so it's fine to use while it's stable.
- **Client portal (v2):** clients can only view and download. A team member invites a client by adding their email address to an allowlist. Firebase Auth's social sign-in is then checked against that allowlist.
- **Content types:** URLs only for now. vCard, Wi-Fi and similar types may come later.
- **Presets:** one per client for now. The data model could leave room for more than one later.
