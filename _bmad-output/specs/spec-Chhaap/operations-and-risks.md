# Operations and risks — Chhaap

## Owner tasks

These keep printed codes working. They aren't software, so they have no CAP. The owner is Davinderpal.

- **OPS-1 Domain.** `chhaap.link` keeps auto-renew and the registrar lock turned on at Namecheap, with a current payment card, for as long as any printed code exists.
- **OPS-3 Library upkeep.** The owner accepts maintaining a fork of the QR styling library if its maintainers stop updating it. Its last release was in April 2025.
- **Firebase setup.** These are done before the first deploy:
  - upgrade the project to the Blaze plan and set the budget alert;
  - make the one-time permission grant that lets Storage rules read Firestore;
  - apply the logo bucket's CORS settings;
  - point the `chhaap.link` DNS at Hosting.
- **Bitly reprint plan.** Deferred. The owner makes a reprint plan for each client when one of their Bitly codes next needs reprinting.

## Accepted risks

- **Reprints follow the current brand.** After a rebrand, a reprint won't match the copies already printed. Both still scan to the same place. The owner has accepted this.
- **One preset edit affects every code.** This is mitigated by re-checking every code of the client that isn't archived before a save (CAP-4), and by preset history with restore.
- **Library upgrades can make stored results stale.** This is mitigated because each result is stamped with the library versions it was checked against. After an upgrade, codes can't be downloaded until they're re-checked (CAP-12).
- **Redirect changes are delayed by the cache.** A change to a destination or a pause can take up to an hour to reach scanners (CAP-7, CAP-9).
