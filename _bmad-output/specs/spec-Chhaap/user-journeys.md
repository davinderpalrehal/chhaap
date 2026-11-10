# User journeys — Chhaap

The names are illustrative stand-ins for team members. Every team member is already signed in with Google.

## UJ-1. Meera makes a code for a client's new flyer (CAP-6, CAP-12, CAP-14)

1. Meera picks the client, enters the flyer's landing-page URL and names the code "Spring flyer 2027".
2. She generates the code. Chhaap shows it drawn in the client's preset, with a passed scan check.
3. She downloads the PDF and emails it to the client's printer.

**Edge case:** if the scan check fails, there is no download button. Chhaap says the code didn't read, suggests checking the preset's contrast and logo size, and links to the client's preset.

## UJ-2. Raj reprints an old code for a printer (CAP-13, CAP-14)

1. A printer asks Raj for a high-res file of a code from last spring.
2. Raj opens the client's library, searches "spring", finds the code and downloads a PNG. It is drawn in the client's current preset.

The whole journey takes under a minute.

## UJ-3. Meera points a printed code at a new page (CAP-7)

1. The client's spring campaign has ended and its URL is dead.
2. Meera opens the code in the library and changes its destination to the client's summer page. The change is logged with her name and the time.
3. Within the hour, anyone scanning the printed flyer lands on the summer page.

Nothing is reprinted.

## UJ-4. Meera updates a client's brand (CAP-4, CAP-5, CAP-12)

1. A client rebrands with a new logo and colours. Meera edits the client's preset. Any team member can do this.
2. Before saving, Chhaap re-checks every code of that client that isn't archived, against the new preset.
3. All of them pass, so the preset is saved. From then on, every view and download of that client's codes uses the new preset.

**Edge case:** if any code fails, the preset isn't saved. Chhaap lists the failing codes and why each failed, and suggests archiving any that are no longer in use.
