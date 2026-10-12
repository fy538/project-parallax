# TelegramCable — Research Dossier

> Created May 19, 2026. Diplomatic cable register — full bureaucratic
> chrome (header, classification stamps, file number, redactions). The
> format itself signals "primary source, unfiltered."

## 1. The form's editorial purpose

TelegramCable renders a diplomatic cable in its full bureaucratic chrome: routing header (FROM/TO/SUBJECT/DTG/file-number), classification rubber stamps (TOP SECRET / SECRET / CONFIDENTIAL) top and bottom, optional DECLASSIFIED diagonal overstamp, ALL-CAPS typewriter body with numbered paragraphs, BEGIN/END markers, onionskin/carbon-copy paper substrate, 3-hole binder punches, optional black-bar redactions with FOIA exemption codes, optional analytical annotations (underline / circle / highlight / margin-note / numbered footnote).

The form's editorial power comes from format-as-evidence. Readers unconsciously parse a cable's bureaucratic format as "this is a real document a government produced," and the more chrome (file number, classification, routing) the stronger the claim. Reach for it when you're working with primary-source diplomatic / military correspondence (Zimmermann Telegram 1917, Kennan's Long Telegram 1946, Cuban Missile Crisis ExComm cables 1962, Nixon-Kissinger back-channels, recent Wikileaks releases). Distinct from PrimarySourceReveal — that template is for formal document text (treaties, speeches, court opinions); TelegramCable is for bureaucratic document register.

## 2. Canonical idioms

**State Department incoming/outgoing telegram (US, 1900s-1990s).**
The dominant US diplomatic format. Header block: "DEPARTMENT OF STATE / INCOMING TELEGRAM" or "OUTGOING TELEGRAM" + routing (`ACTION: EUR`, `INFO: S/S, NEA`) + decimal file number (`861.00/2-2246` — country 861=USSR, topic 00, date 2-22-46) + date/time-group (`220900Z FEB 46`). Classification stamps top + bottom, slightly skewed, semi-bled red ink. Body in ALL CAPS typewriter, double-spaced, numbered paragraphs, BEGIN SUMMARY / END SUMMARY markers. References: Foreign Relations of the United States series; National Archives RG 59 (State Department records).
Failure mode: missing file number reads as draft or fictional. Always include if known.

**Foreign-service signals format (UK / Commonwealth).**
Similar to State Dept but headed "FOREIGN OFFICE / RESTRICTED" or "CONFIDENTIAL TELEGRAM"; signed off with originator's name in block caps; uses Greenwich Mean Time (Z suffix on DTG). UK file numbers use the FO 371/N series. References: UK National Archives DocumentsOnline.
Failure mode: US-style routing applied to UK cable — bureaucracy-specific anachronism.

**Wartime intercept / decoded cable.**
Zimmermann Telegram (1917) is the canonical reference. Originally encrypted; decoded version published with the cipher groups alongside translation. The visual register includes the cipher-group columns + translation, with header from the intercepting service ("BRITISH ADMIRALTY ROOM 40"). References: National Archives Milestone Documents — Zimmermann Telegram.
Failure mode: showing the decoded text without acknowledging the encryption register; loses the espionage authenticity.

**Modern declassified facsimile.**
Post-2000 declassified cables released via FOIA / 25-year-automatic. Comes as a stamped photocopy with DECLASSIFIED rubber stamp (black, diagonal, with release date), redactions as solid black bars with exemption code in margin (`(b)(1)`=national security, `(b)(3)`=statute, `(b)(5)`=deliberative process). The redaction bars are at x-height (not full line height) and slightly wider than the redacted text. References: WikiLeaks Cablegate, FOIA reading rooms (state.gov FOIA library).
Failure mode: redactions full line-height — reads as a marker scribble, not the precise bureaucratic black bar.

## 3. General principles

The form's authority comes from accumulated chrome elements:
- **Header block** (routing + DTG + file number) — without it, reads as draft
- **Classification stamps** — the red-ink skewed rubber-stamp look ("MARKINGS THAT MAKE IT FEEL DECLASSIFIED")
- **Paper substrate** (onionskin = working copy; carbon = file copy with bleed-through) — paper carries era weight
- **Typewriter typography** — Special Elite / Courier Prime for pre-1961 mechanical; cleaner mono for post-1961 IBM Selectric era
- **Numbered paragraphs** — the bureaucratic discipline that distinguishes a cable from a letter
- **BEGIN/END markers** — the diplomatic signal that what follows is a discrete unit (summary, recommendation, etc.)

Tufte: bureaucratic format is "non-data ink that earns its keep" — every element is evidence the document is real.

The form's failure mode is **overdoing the chrome**. A cable that screams TOP SECRET / DECLASSIFIED / REDACTED / FILE NUMBER all at once reads as parody (the "look how serious this is" energy that Steve Bannon used in his cable-formatted memos). Real cables have *one or two* of these elements prominent — usually the classification stamp and the file number — and the rest recede.

## 4. Recommendation for Parallax

Default to the **State Department incoming-telegram idiom** with these chrome defaults:
- Header: DEPARTMENT OF STATE / INCOMING TELEGRAM / file number
- Classification: SECRET (more common than TOP SECRET for Cold-War cables Parallax uses)
- Body: Special Elite typewriter (pre-1961 register matches Kennan / Marshall / Acheson era)
- Onionskin paper, aged 0.25–0.35
- Punch holes on left margin (3-hole binder)
- Numbered paragraphs (default true)
- Optional BEGIN/END markers for summary blocks
- Optional DECLASSIFIED black overstamp when historically accurate

Use annotations sparingly — at most 3-4 per cable (1 highlight, 1 circle, 1 margin-note, 1 numbered footnote). More than that overwhelms the form's authenticity.

Use redactions only when historically real (the actual document was redacted in its FOIA release). Faking redactions for dramatic effect is dishonest.

## 5. Current template alignment

`TelegramCable` ships with the recommended idiom. Full bureaucratic chrome: header block with from/to/subject/dtg/fileNumber/transmissionType, classification rubber stamps top+bottom, DECLASSIFIED diagonal overstamp, onionskin/carbon/plain paper substrate, punch holes, BEGIN/END markers, ALL-CAPS body in Special Elite typewriter, numbered paragraphs (auto-prepend "1.", "2."), annotations (underline / circle / highlight / margin-note / numbered) reusing PrimarySourceReveal's measurement architecture, redactions (solid black bars at x-height with exemption code in right margin).

Default props: Kennan's Long Telegram excerpt (22 Feb 1946, Moscow → SECSTATE, file 861.00/2-2246, classification SECRET, declassified 1972, with one highlight + one circle + one margin-note + one numbered footnote + one demonstration redaction).

## 6. Specific upgrades proposed

1. **Era-based typewriter auto-selection** (low effort, medium impact) — currently always uses Special Elite. Add date inspection on `dateTimeGroup` to auto-switch to IBM Plex Mono for post-1961 cables (IBM Selectric era — cleaner type impression).
2. **Multi-page support** (medium effort, medium impact) — long cables need page breaks ("PAGE TWO / DEPTEL 511" continuation marker). Currently the template assumes single-page cables.
3. **Cipher-group rendering for decoded intercepts** (high effort, low frequency) — Zimmermann-style two-column display (cipher groups left, decoded text right). Niche but distinctive when needed.
4. **Routing block expansion** (low effort, medium impact) — currently `from` and `to` are simple strings. Real cables have `ACTION: EUR` + `INFO: S/S, NEA, EUR/SOV` distribution lists. Schema additions: `header.action: string[]` + `header.info: string[]`.
5. **Onionskin bleed-through** (medium effort, low impact) — real onionskin shows ghost text from the page behind via translucency. Could simulate with a duplicated low-opacity text layer offset 1-2px. Subtle.

## 7. Failure mode flags

- **Faked redactions for dramatic effect** — dishonest. Redact only what was actually redacted in the historical document's release.
- **Wrong classification level** ("TOP SECRET" on a cable that was actually CONFIDENTIAL) — credibility failure. Match the real classification of the source.
- **Anachronistic typewriter font** — using Special Elite for a 1985 cable produces wrong-era register. Post-1961 cables should use IBM Plex Mono.
- **Overdone chrome** — three stamps + DECLASSIFIED + heavy redactions + file number + BEGIN/END + 8 annotations = parody. Real cables have most of these as understated background elements.
- **Modern social-media text rendered as cable** — TelegramCable's authority comes from the bureaucratic document register. Tweets, Slack messages, modern emails are wrong register; use `KineticTypography` quote-attribution instead.
- **Confused with PrimarySourceReveal** — the two templates do different things. PrimarySourceReveal is for formal document text (treaty articles, speeches); TelegramCable is for bureaucratic correspondence. If your source is a treaty clause, use the other one.
- **Missing source citation** — diplomatic cables ALWAYS need FRUS / National Archives / NSA Archive provenance. Without it, the form's authority is asserted but not earned.
