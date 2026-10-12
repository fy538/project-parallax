# HandwrittenLetter — Research Dossier

> Created May 19, 2026. The handwritten-correspondence visualisation —
> photograph of the actual letter (canonical Burns idiom) or typeset
> fallback. The artifact IS the argument.

## 1. The form's editorial purpose

HandwrittenLetter foregrounds a piece of historical correspondence as the visual carrier of an editorial moment — a Stalin-to-Truman cable, a Lord Salisbury dispatch, a Lincoln-to-Greeley letter, a Sullivan Ballou pre-Bull-Run farewell. The argument the form makes is *"a real person sat down and wrote this; here is what they said and how they said it."* The paper, the handwriting, the foxing, the fold creases — all of it carries evidentiary weight that paraphrase cannot. Reach for this when the editorial point is that the document itself, not just its content, is the primary source.

## 2. Canonical idioms

**Burns photograph-and-Ken-Burns idiom.**
Ken Burns' *The Civil War* (1990, Sullivan Ballou) is the canonical reference. Show a real photographic still of the letter; the camera slowly zooms or pans (Ken Burns); a named actor reads the text in voiceover; on-screen transcription fades in by paragraph to help the viewer follow. The letter doesn't move. The camera moves. The voice moves. This is the high-trust documentary register. Reference: PBS, Ken Burns Sullivan Ballou page (https://www.pbs.org/kenburns/the-civil-war/sullivan-ballou-letter).
Failure mode: zoom too fast or pan jittery — the contemplative register collapses.

**Letters of Note / scholar's-gloss idiom.**
Shaun Usher's *Letters of Note* (book + Substack) treats letters as artifacts with marginalia: photograph at top, modern typeset transcription below, optional editor's commentary in side margin. Slower, more academic register. Used by *The London Review of Books*, *Lapham's Quarterly*. Best when the letter's image is too illegible to read alone (e.g., densely written 19th-century script).
Failure mode: marginalia stacked too densely — clutter overwhelms the artifact.

**Typeset script (when no photograph exists).**
Used by historical reenactment documentaries when no archival photograph of the actual letter survives (most Roman, medieval, and early-modern correspondence). Script font selected by era — Spencerian for US 1850-1925, Copperplate for pre-1850 English, Kurrent for German pre-1941. The script type IS evidentiary metadata; using a wrong-era script is anachronism. Modern typeset script (Caveat, Dancing Script) reads as gloss — usable for fallback but never substitute when a photograph exists.
Failure mode: ink-trail write-on animation in a modern script font over white paper — the kitschy TikTok register that destroys documentary trust.

**Wartime / decoded-cable idiom.**
For wartime correspondence (Zimmermann Telegram, Long Telegram, ExComm cables) — different register entirely; use `TelegramCable` template, not HandwrittenLetter. HandwrittenLetter is for personal / formal correspondence with visible handwriting. Cables are typeset bureaucratic artifacts.
Failure mode: rendering a cable as a "handwritten letter" — wrong register, destroys evidentiary specificity.

## 3. General principles

The form's editorial leverage comes from authentication. Two visual elements do the authenticating: the *paper substrate* (aged cream with foxing, soft warp, vignette) and the *handwriting style* (era-appropriate script OR real archival photograph). Without authentication, the letter reads as a stage prop — useful for a TikTok hook, useless for a documentary argument.

Tufte's "data-ink ratio" applies inverse: in this form, non-data ink is the argument. Foxing, fold creases, marginal annotations — these are not decoration; they're evidence the document is real.

Munzner's "what / why / how": *what* is the letter as artifact; *why* is to bring the viewer into a moment of historical correspondence; *how* is photograph-of-letter (canonical) OR typeset-script (fallback) with paragraph-fade reveals synced to narration.

## 4. Recommendation for Parallax

Default to **photograph mode** when an archival image exists. Sources for public-domain correspondence images:
- **Library of Congress** — presidential papers (Lincoln, Jefferson, FDR), Civil War correspondence
- **National Archives** — diplomatic correspondence, military letters
- **Wikimedia Commons** — most pre-1923 letters
- **Founders Online** (founders.archives.gov) — US founding-era correspondence
- **Folger Shakespeare Library** — Tudor / Stuart-era correspondence

Layout: archival image on left 55% of canvas with slow Ken Burns; transcription column on right 35% with paragraph fade-ins synced to narration. Dateline + signature in small caps as metadata strip.

Default to **typeset mode** only when the photograph doesn't exist or is too poor-quality to render. Use Caveat script font (modern, legible at video resolution). Period-correct scripts (Spencerian, Kurrent) require additional font loading and may be added when needed. Avoid ink-trail write-on by default; reserve for moments where the editorial point IS the act of writing.

Salutation + signature in small caps via fonts.serifBody italic; dateline in mono small caps; transcription paragraphs in Plex Serif body; key paragraph (one per letter max) gets accent left-border in gold.

## 5. Current template alignment

`HandwrittenLetter` ships with both modes. Dual-mode dispatch via `data.mode`. Photograph mode uses 55/35 image+transcription split + Ken Burns drift; typeset mode uses ArchivalPaper substrate + Caveat script + paragraph fade-ins. Both modes support salutation / signature / dateline metadata.

The Sullivan Ballou letter is the default props — typeset mode (since no external photograph URL required for Studio preview). Photograph mode requires an `imageUrl` per episode.

## 6. Specific upgrades proposed

1. **Period-correct script fonts** (medium effort, low frequency) — add Spencerian / Copperplate / Kurrent for era-correct rendering. Currently only Caveat (modern semi-script). Loading is straightforward but each adds ~50KB to the bundle.
2. **Audio-driven paragraph timing** (medium effort, high impact) — auto-derive `paragraphs[].appearAtSec` from a Whisper transcript of the narrator reading the letter. Currently manual.
3. **Photograph + transcription co-zoom** (medium effort, medium impact) — when narrator's reading reaches a specific phrase, the Ken Burns target shifts to zoom into that part of the letter. The Pudding uses this for letter close-reads. Schema would need `paragraphs[].focusBox: [x, y, w, h]` for the corresponding photograph region.
4. **Fold-line + envelope detail** (low effort, low impact) — optional decorative fold-shadow + postmark/envelope corner crop. Useful for the rare letter where the envelope IS the evidence (return address, postmark date).
5. **Multi-page support** (medium effort, medium impact) — letters longer than one page need page-flip transitions. Currently the template assumes one continuous letter.

## 7. Failure mode flags

- **Ink-trail write-on in modern script font** → kitsch register; reserve for stylistic moments only.
- **Wrong-era script font** ("Caveat" used for an 18th-century Adams letter) → anachronism. Pick a period-correct face or use photograph mode.
- **No paper substrate (white background)** → reads as a screenplay, not a letter. Always use ArchivalPaper.
- **Transcription column too wide** → competes with the letter image. Keep transcription at ≤35% of canvas; photograph dominates.
- **Camera too fast** (Ken Burns zoom rate > 0.15 per second) → loses the contemplative register Burns established.
- **Paragraph fade-in too quick** (< 400ms) → eye doesn't have time to settle on the text. Keep paragraph fades at 0.6s minimum.
- **Modern-photo source** (a 2010s scan of someone's handwriting, not an archival document) → defeats the evidentiary claim. Use only archival sources.
