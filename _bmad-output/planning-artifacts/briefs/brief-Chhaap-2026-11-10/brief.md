---
title: "Product Brief: Chhaap"
status: final
created: 2026-11-10
updated: 2026-11-10
---

# Product Brief: Chhaap

_Chhaap means "stamp" in Hindi and Punjabi._

## Executive Summary

Chhaap is an internal web app where the Davi Codes team makes branded QR codes for clients, keeps track of them and prints them again. Each client has one saved brand preset: dot style, corner style, colours and logo. A team member picks the client, enters a URL, and gets a code that matches the client's brand without anyone setting the style by hand. Every code is saved, so sending one to the printer again later takes seconds.

Every code is dynamic. It points to a short link on `chhaap.link`, a domain Davi Codes owns, so the team can change where a printed code goes without reprinting it. Today the team uses Bitly's QR generator. It works well, but it goes down at odd times, and when it's down the team can't make codes. Chhaap gives Davi Codes its own generator and its own redirects, on its own Firebase project, and builds the client's brand into how codes are made.

This is a small tool for a small team: 4 people, 2 clients and about one new code a month. It should cost little to build and less to run. Wherever possible it uses existing npm packages and Firebase services, so the custom code is mostly glue.

## The Problem

- **Brand drift.** When each person sets the dot style, colours and logo by hand for each code, codes for the same client end up looking slightly different. Getting the brand right is the main reason to build Chhaap.
- **A tool you don't control.** Bitly's generator goes down at unpredictable times, and while it's down the team can't make or edit codes. As far as we know, live redirects have kept working. Still, every existing client code relies on Bitly's redirect, and on Davi Codes keeping a Bitly account.
- **Reprints are slow.** Printers ask for high-res files. Finding the original file, or rebuilding the code, takes longer than it should.

## The Solution

- **Client brand presets.** Each client has one preset: dot type, corner style, colours, logo and other branding settings. Every code made for that client uses it.
- **Generate.** Choose the client, enter the destination URL and generate. Chhaap checks that the code scans before anyone can download it.
- **Dynamic links on `chhaap.link`.** Each code holds a short link on `chhaap.link`. The domain is registered at Namecheap, with its DNS pointing at Davi Codes' Firebase Hosting. Team members can change the destination after the code is printed, and every change is logged with who made it and when. A simple scan count is nice to have. It goes in v1 only if the redirect design makes it cheap.
- **Library and reprint.** Every code is stored by client. You can download it again at any time as a print-ready PDF or a high-res PNG.
- **Sign-in.** Team members sign in with social login through Firebase Authentication.

## What Makes This Different

The point isn't to beat commercial QR tools on features. They have more of them. Chhaap is worth building for three reasons:

1. **Brand is built in.** Each client's style is saved once and reused, so nobody has to remember it.
2. **Davi Codes owns the tool and the redirect.** Making and editing codes doesn't depend on a third-party service being up. Printed codes don't depend on a third-party account being kept. Firebase Hosting and the `chhaap.link` registration become the single points of failure instead, but Davi Codes controls both.
3. **It fits the team's size.** Going by aggregator sites, paid agency plans with multi-client support cost about $99–250 a month, for a tool the team uses about once a month.

The trade-off is that building means owning the maintenance (see Risks and Open Questions).

## Who This Serves

- **The Davi Codes team (v1).** Four people, including the owner, who make codes for clients and handle print requests. For them, success means producing a correctly branded, print-ready code in a couple of minutes, and finding an old code in seconds.
- **Clients (v2).** In v2 a client could sign in to see and download every code made for them. A team member would invite them by adding their email address to an allowlist. This is deferred, but the data model should allow for it from the start.

## Success Criteria

- Every code generated through Chhaap uses its client's preset, so two codes for the same client always look alike.
- The team is never blocked from making or editing a code by an outage at a third-party service.
- No Chhaap code stops working because the redirect or the `chhaap.link` domain fails.
- Re-sending an existing code to a printer takes under a minute.
- All new client QR codes are made in Chhaap instead of Bitly.
- Every downloaded code has passed the scan check.

## Scope

**In v1**
- Team sign-in with social login through Firebase Auth.
- Client records, each with one brand preset.
- URL codes only, all of them dynamic on `chhaap.link`. Staff can edit the destination, and each edit is logged.
- A scan check before download.
- PDF export (required) and high-res PNG export.
- A per-client library of codes that you can download again.
- Hosted on Firebase.

**Out of v1**
- The client portal and allowlist invites (v2).
- Content other than URLs, such as vCard, Wi-Fi or plain text.
- More than one preset per client, and style overrides on a single code.
- Detailed scan analytics. A basic count is optional; see The Solution.
- CMYK or spot-colour output.
- Moving existing Bitly codes across. This is the first thing to do after v1 (see Risks and Open Questions).

## Risks and Open Questions

- **The domain must outlive the codes.** `chhaap.link` has to stay registered and pointed at Firebase for as long as any printed code exists. Turn on auto-renew and the registrar lock at Namecheap, and keep the payment card up to date.
- **Moving off Bitly means reprinting.** A printed Bitly code holds a `bit.ly` link, which can't be changed. You can point the Bitly link at the new Chhaap link as a stopgap, but the code still depends on Bitly until it's reprinted with a `chhaap.link` code. The real migration is therefore a reprint plan for each client.
- **Library maintenance.** The main styling package, `qr-code-styling`, gets few updates. The owner has said they're willing to maintain a fork if needed. Some style combinations reduce scannability, which the scan check handles. Generating vector PDFs needs a second package or a server step.
- **Redirect uptime.** Chhaap now carries the uptime promise that Bitly used to. Firebase Hosting is reliable, but the redirect should still be monitored.

## Vision

Chhaap becomes Davi Codes' single source of truth for client QR codes: branded, dynamic and always reprintable. Clients sign in to collect their own codes. More content types become possible: vCard, Wi-Fi and others. It stays small, cheap and owned by Davi Codes.
