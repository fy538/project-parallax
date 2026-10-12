# THUMBNAIL CONCEPTS

## Episode: prisoners-dilemma — *"What the Prisoner's Dilemma Gets Wrong"*
## Date: 2026-05-18

Three thumbnail concepts produced per `skills/thumbnail-concept/SKILL.md` doctrine (3-concept framework, anti-clickbait, mobile-first, 5–7% CTR target). Each concept uses a genuinely different visual strategy. Concept D (Object + Annotation) is intentionally NOT used here — the episode's editorial gestalt is contradiction, not detail-annotation.

**Title pairing:** *"What the Prisoner's Dilemma Gets Wrong"* (40 chars; mobile-fits; direct-promise; colon-free; no em dash).

---

### Concept A: The Juxtaposition

**Visual:** Two payoff matrices side by side, separated by a thin gold vertical rule + the ∴ brand mark at center. Left matrix labeled "TEXTBOOK" — canonical Prisoner's Dilemma 2×2 with a single glowing amber dot at (Defect, Defect). Right matrix labeled "REALITY" — the same 2×2 grid but the four cells are *fractured / incomplete* (irregular geometry, one cell faded or absent, one cell containing a second dot at (Cooperate, Cooperate) that's also glowing). The left side reads as crisp diagram; the right side reads as a partially-drawn-over version of the same diagram. The contradiction is in the image, not in the words.

**Text overlay:** **"Not 2×2."** — IBM Plex Sans Bold (or Plex Black), all caps, 56pt, bone (`#F0E6D0`) on ink. Positioned in the upper-third safe zone above both matrices. Three characters carry the entire editorial hook.

**Color treatment:** Meridian Dark — ink background (`#1C1814`), gold accent (`#C4A747`) for the divider + ∴ mark + the "Defect/Defect" equilibrium dot, bone for matrix labels and grid lines, walnut (`#5C4A3D`) for the fractured cell edges on the "REALITY" side to make them feel softer / pulled-apart. Avoid the `china` semantic red — too low contrast at thumbnail scale per existing skill doctrine.

**Why it works:** The two-matrix composition creates immediate cognitive dissonance — viewers recognize "Prisoner's Dilemma" from the left matrix, then their eye lands on the fractured right matrix and the brain registers "that's not how it works." The "Not 2×2." text overlay completes the gap. This is the episode's core argument compressed into one image: the textbook game and the real game aren't the same shape. **Best for cold-acquisition discovery** — high CTR via the contradiction.

**Production method:** Composed in Remotion via `Thumbnail` composition with a custom `Juxtaposition` layout. Left matrix renders as static GameBoard component (`gameboard-flood-dresher.json` style); right matrix rendered with deliberately-asymmetric geometry. Vector typography overlay. Single PNG export at 1280×720, then a 320×180 mobile-feed test for legibility. **Production time: ~25 min** (mostly tuning the "fractured" geometry on the right matrix until it reads as deliberate rather than broken).

---

### Concept B: The Data Provocation

**Visual:** Single dominant text element — **"60% / 0%"** stacked vertically in very large amber (`#C4A747`) IBM Plex Sans Bold (90pt+). The "60%" sits above; a thin amber horizontal rule separates the two numbers; the "0%" sits below. Below the stack, in much smaller bone Plex Mono (16pt), two captions right-aligned: "observed cooperation, 1950" / "predicted by Nash equilibrium". The contrast between the giant numbers and the small captions does the editorial work. Background: pure ink (`#1C1814`), no texture, no secondary imagery.

**Text overlay:** None additional — the numbers ARE the overlay. Lower-third carries a tiny `∴ PARALLAX` brand mark in muted bone.

**Color treatment:** Meridian Dark — ink background, amber for both numbers (the hero), bone for captions, muted bone for the brand mark. Ultra-high contrast. **Reads at 200×113px** because the two numbers carry the entire image; no other element needs to survive the shrink.

**Why it works:** The "60%" creates immediate "wait, what?" curiosity — most viewers don't have a strong prior about cooperation rates in game-theory experiments. The "0%" anchor immediately below creates the gap: "the theory said zero, the experiment got sixty." That's the entire episode in two numbers. **Pure numbers-based contradiction hook — no metaphor required.** Pairs especially well with the Beat 1 cold open of the long-form (which the viewer encounters within 15 seconds of clicking). The thumbnail makes a promise; the cold open delivers it; the satisfaction signal is positive.

**Production method:** Pure typography in Remotion `Thumbnail` composition — no image sourcing required. Single SVG export at 1280×720. **Production time: ~10 min.** Lowest-cost concept of the three.

---

### Concept C: The Symbolic

**Visual:** Two stylized figures positioned in adjacent prison cells — but the wall between them is NOT solid. Instead, the wall is rendered as a thin amber line that bends and connects the two figures at multiple points (a hand reaching through, a glance shared, a string-like connection between them). The classical PD visual of "two prisoners isolated, unable to communicate" is shown — but the isolation has visibly collapsed. The bars are still there; the separation isn't. Composition is geometric, minimal, mid-century constructivist — no photorealism, no faces. The two figures are angular silhouettes in bone over ink.

**Text overlay:** One word, lower-third: **"Connected."** — IBM Plex Sans Bold, 42pt, amber. The period is intentional; it lands as statement, not invitation.

**Color treatment:** Meridian Dark — ink background, bone for the two figures (high contrast), amber for the connecting line / wall + the single word. The ∴ brand mark sits small in the upper-right corner in muted walnut.

**Why it works:** This is the brand-building concept. **Lower predicted CTR than A or B** (no urgency, no number, no contradiction stat) but the strongest distinctive Parallax signature. The classical PD image collapses in front of the viewer's eyes — they recognize the prison-cell trope, then their eye lands on the connecting line and the metaphor inverts. Best for viewers who *care about design and concept* over urgency. Elevates channel perceived quality in a crowded space; viewers will recognize "that's a Parallax thumbnail" by craft rather than by stat. **Best for mid-funnel retention and subscriber conversion** rather than cold-acquisition discovery.

**Production method:** Constructivist illustration via Recraft (anchor-library `geometric-figures` anchor) or Claude SVG generation. Prompt template: *"Two geometric prisoner silhouettes in adjacent cells, mid-century constructivist style, amber connecting lines between them through the cell wall, bone figures on ink background, ∴ brand mark upper right, IBM Plex Sans typography below reading 'Connected.'"* Hand-tune the connection lines until they read as deliberate (not accidental). **Production time: ~30 min** including 2–3 Recraft iterations + post-treatment in Remotion.

---

## Recommendation

**Ship Concept B for launch.** Reasoning:
- **Lowest production cost** (~10 min) — frees attention for narration + assembly.
- **Highest predicted CTR for cold-acquisition** (the channel's primary need at video #1).
- **Pairs perfectly with the Beat 1 cold open** — the thumbnail's "60% / 0%" is *literally* the first beat the viewer encounters. The satisfaction-signal contract is bulletproof: every viewer who clicks because of the numbers gets the numbers in the first 30 seconds.
- **Mobile-feed legibility is unambiguous** — two giant numbers survive the 200×113px shrink without strain.
- Anti-clickbait by construction: the numbers are *specific and verifiable* (Flood-Dresher RAND 1950 — citable in long-form). Passes the hedge-strip test.

**Hold Concept A in reserve** for the manual thumbnail swap at 48h or 7d if CTR is below 4%. The Juxtaposition concept is more visually layered; if Concept B underperforms (suggesting the audience needs more visual context than two numbers provide), Concept A is the upgrade.

**Concept C is the long-game choice.** Don't ship at launch — viewer pool is too cold to convert on brand-aesthetic alone. Use as the *featured-video* thumbnail in 6–12 months once the channel has a subscriber base that values the visual signature.

## Text Overlay Variants

For A/B testing once Test & Compare becomes available (post-baseline, ep 5–10+):

- **Concept B variant 1:** "60% / 0%" (current)
- **Concept B variant 2:** "60% vs 0%" — slightly more explicit comparison framing
- **Concept B variant 3:** "60%" alone, with the smaller "0% predicted by model" caption taking visual weight — single hero number, secondary contradiction

## Technical Notes

- All three concepts produced via the shipped `Thumbnail` Remotion composition + `npm run thumbnails -- --episode=prisoners-dilemma` workflow.
- Mobile-feed legibility test: shrink to 200×113px before approving any concept. If the editorial hook isn't readable at that size, reject and re-tune.
- **CTR target zone: 5–7%** (per 2026-05-18 research update). Below 4% at 48h → manual thumbnail swap to Concept A.
- All three concepts pass the formal anti-pattern ban list in `skills/thumbnail-concept/SKILL.md`: no shocked face, no red arrows, no ALL-CAPS Impact, no saturated red/yellow background, no round shock numbers (60% and 0% are specific and verifiable), no em dash, no broken-promise hook, no year stamp, no stunt framing.

## Self-Check

- [x] Three concepts produced; each uses a genuinely different visual strategy (Juxtaposition / Data Provocation / Symbolic)
- [x] Each concept readable at 200×113px mobile size
- [x] Text overlays ≤5 words ("Not 2×2.", numbers-only, "Connected.")
- [x] Meridian palette only (ink / gold / bone / walnut); no off-brand hex
- [x] No clickbait anti-patterns (verified against the SKILL.md ban list)
- [x] Each concept's CTR / retention contract is honest — the thumbnail's promise IS delivered in the long-form
- [x] Recommendation includes both launch choice AND a contingency swap plan
