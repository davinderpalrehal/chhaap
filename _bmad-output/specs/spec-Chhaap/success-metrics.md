# Success metrics — Chhaap

## Primary

- **SM-1 No bad codes reach print.** No printer or client reports a Chhaap code that is off-brand or doesn't scan. Validates CAP-4, CAP-12 and CAP-14.
- **SM-2 Bitly replaced.** From launch, every new code is made in Chhaap. Validates CAP-6.
- **SM-3 Fast reprints.** Finding and downloading an existing code takes under a minute, measured in a timed walkthrough with each team member at launch. Validates CAP-13 and CAP-14.
- **SM-4 Fast new codes.** Making a new code and downloading it, print-ready, takes under 2 minutes, measured the same way as SM-3. Validates CAP-6, CAP-12 and CAP-14.

## Secondary

- **SM-5 No blocked days.** The team is never unable to make or edit a code because a third-party service is down. Validates NFR-2.
- **SM-6 Redirect uptime.** No Chhaap code stops working because of the redirect or the domain, and every outage the monitor catches is fixed. Validates CAP-10 and CAP-15.

## Design guarantees

These aren't measured. They are why SM-1 is expected to hold.

- Every export uses the client's current preset, and no code is styled by hand (CAP-4, CAP-14).
- Every export comes from a code whose stored pass is current (CAP-12, CAP-14).

## Counter-metrics (do not optimise)

- **SM-C1 Number of codes made.** At about one code a month, making more codes isn't the goal. Counterbalances SM-2.
- **SM-C2 Brand fidelity at the cost of scannability.** Never loosen or skip the scan check to let a preset through. Counterbalances SM-1.
