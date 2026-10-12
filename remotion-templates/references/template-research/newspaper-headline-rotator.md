# NewspaperHeadlineRotator — Research Dossier

> Created May 19, 2026. Sequential reveal of 3–5 period newspaper front
> pages making the same editorial point. The world saw it this way.

## 1. The form's editorial purpose

NewspaperHeadlineRotator compresses "every paper had the same headline that morning" into 6–12 seconds of video. The compounding evidence of multiple outlets across multiple countries reaching the same conclusion at the same moment IS the editorial argument — convergence across independent observers is harder to dismiss than any single source. Reach for it when the editorial point is *simultaneity of recognition* (Berlin Wall fall, JFK assassination, Apollo 11 landing, 9/11) or *cross-outlet consensus on a fact in dispute* (climate science, Brexit vote, 2008 financial crisis).

## 2. Canonical idioms

**Pudding stack-and-shift.**
The Pudding's "How the News Changed" treatment — pages enter from the right, previous page shrinks and shifts left as it exits. Each page holds for ~3 seconds. Real scanned mastheads, editorial headline gloss in modern Plex Sans. The horizontal travel emphasises sequence; multiple pages remain partially visible (the previous one as a thumbnail) reinforcing "this is part of a series."
Failure mode: shift too fast and the eye can't read the headline; shift too slow and the form loses momentum.

**FT crossfade-on-hold.**
Financial Times historical packages use a simple crossfade between pages with a fixed hold-on-each. Less kinetic than Pudding, more contemplative. Each page sits centred, fades to the next at scale ~0.96 → 1.0. Used in long-form features where the reader controls pace; in video, this works at ~2.5s hold per page.
Failure mode: too quick and pages feel interchangeable; too slow and you lose the rhythm.

**Newsreel cut-and-flash.**
Used by archival-newsreel compilations and Adam Curtis. Hard cut between pages with an optional white-frame flash between (60 frames at 0.4 opacity simulating projector splice). High energy; no scale or fade. Best when paired with documentary-grade narration; reads as kitsch without strong audio anchor.
Failure mode: cut-flash overuse — every transition can't be a punch.

**Full-page archive view (rare).**
Show the entire scanned front page (not just masthead crop) with Ken Burns pan to the relevant article. Used when the editorial point is the page layout itself (sidebar context, photo placement, "above the fold" vs. "buried inside"). Time-consuming per page; usually only one or two pages get this treatment per shot.
Failure mode: text illegible at video resolution; too much chrome competes with the headline.

## 3. General principles

The form requires **authentication** — real scanned mastheads, never typeset reconstructions. The reader's unconscious "this is a real page from a real archive" reading is the entire editorial value; typesetting a "NYT" masthead always looks wrong because period typography is hard to fake and slightly off masthead typography breaks the spell.

Tufte's "credibility through specificity" applies: dateline ("BERLIN · NOV 11 1918") and publication name + page-of-N indicator anchor the page in a specific time and outlet. Without these, the page reads as decoration.

The compounding-evidence argument is fragile. 2–3 pages can feel cherry-picked; 4–6 pages establishes a pattern. More than 6 reads as a montage (different form — use `PhotoMontage` instead).

## 4. Recommendation for Parallax

Default to **FT crossfade-on-hold** with a hold of 3–3.5 seconds per page. Specifically:
- 4–6 headlines per shot (sweet spot for compounding evidence)
- Real scanned masthead crops sourced from LOC Chronicling America, Wikimedia Commons, or newspapers.com
- Headline rendered in Plex Sans semibold h1 (modern editorial gloss, NOT page typography)
- Optional italic-serif deck below
- Dateline in mono small-caps strip ("BERLIN · NOV 11 1918")
- Newsprint paper substrate (warm yellowed cream)
- Index badge ("3 of 5") in bottom-right corner of card

The schema requires `mastheadImageUrl` per headline; documentation explicitly forbids typeset mastheads. When no masthead crop is available, fall back to typeset `publicationName` in Plex Serif — but flag in the dossier that this is a compromise.

## 5. Current template alignment

`NewspaperHeadlineRotator` ships with the recommended idiom. `transition: "crossfade-scale" | "stack-shift" | "cut"` covers all three canonical patterns. Default props for Studio preview ship with empty `mastheadImageUrl` strings (editors hot-swap with real LOC / Wikimedia crops per episode); the typeset `publicationName` fallback renders in the meantime. Index badge ("3 of 4") renders in bottom-right corner of each card.

## 6. Specific upgrades proposed

1. **Masthead asset library** (medium effort, high impact) — pre-source canonical crops for major historical outlets (NYT 1850-2000, Times of London 1700-2000, Le Monde, Pravda, Bild, Asahi) and ship as `public/assets/mastheads/`. Schema gets `mastheadPreset: "nyt-1960s" | "le-monde-1980s"` shorthand. Reduces per-episode authoring friction.
2. **Audio-driven page advancement** (medium effort, high impact) — auto-set per-headline `appearAtSec` from narration sync points. Currently sequential at fixed `holdSec`.
3. **Full-page Ken Burns variant** (high effort, low frequency) — when one headline deserves full-page treatment (with Ken Burns into the article), support `headlines[].fullPage: true` that switches that page from masthead-crop layout to full-scan + camera pan.
4. **Per-page paper tint** (low effort, low impact) — currently the whole rotator uses one `paper` variant. Some sequences span eras where paper tone shifts (1918 broadsheet warm cream → 2001 broadsheet near-white). Schema additions: `headlines[].paperOverride`.
5. **RTL masthead support** (medium effort, medium impact) — Arabic/Hebrew mastheads need RTL-aware crop alignment + dateline strip mirroring. Currently LTR-only.

## 7. Failure mode flags

- **Typeset mastheads** → the entire form's editorial value depends on authentic scanned mastheads. Typesetting them reads as fake. Document this in episode authoring rules.
- **Identical layout across cards** ("clearly a template") → use varied paper aging seeds + per-page hold variation to break the regularity.
- **Single headline** → use a `KineticTypography` quote card instead; the rotator's editorial value comes from compounding evidence.
- **> 6 pages** → reads as a montage, not a rotator. Either filter to focal subset or use `PhotoMontage` for the broader sweep.
- **Headlines that don't make the same point** → defeats the "compounding evidence" argument. Curate ruthlessly; the editorial work IS the selection.
- **Modern paper register on pre-1990 content** → the warm-cream newsprint tone is era-coded; using bright-white tabloid stock for a 1918 broadsheet is anachronism.
- **Dateline mismatch** → if you say "the world woke to one story on Nov 11" but include a page dated Nov 12, the form's authority collapses. Datelines must all be within 24 hours.
