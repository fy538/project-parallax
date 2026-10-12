# Visual Spec — The Unwatched Test
*"Trusting an AI You Can't Check"* · `ai-care-motives` · generated Oct 8, 2026 from script v1.7

> **Status:** 26 Remotion data files written and validated (Zod schema + palette). Not yet assembled into a manifest, not yet rendered or viewed.
> Directory: `remotion-templates/data/episodes/ai-care-motives/`

## 1. Layers

| Layer | Count | Notes |
|---|---|---|
| MG (Remotion) | 26 | See table below. |
| AI-GEN stills | 12 | Already generated, upscaled, rendered as Ken Burns (`shot-list.json`). No new briefs needed. |
| ILLUST (Recraft) | 0 | All converted to AI-GEN (Oct 7 decision). |
| Footage / archival | 7 | `footage-manifest.json`: 3 Wikimedia portraits, EPA notice, stock diesel car, 2 screen-capture shots. |

## 2. MG data files

| File | Template | Beat | Pace |
|---|---|---|---|
| chat-cold-open | PrimarySourceReveal (typed-out exchange; replaced kinetic-chat-transcript Oct 11) | 1 | analytical |
| kinetic-would-it-tell-me | KineticTypography | 1 | analytical |
| kinetic-can-it-recognize | KineticTypography | 1 | analytical |
| title-unwatched-test | TitleTransition | 1 | analytical |
| shop-motif-reasons | SplitFrame | 2 | analytical |
| kinetic-kant-quote | KineticTypography | 2 | analytical |
| kinetic-mill-quote | KineticTypography | 3 | analytical |
| checkpoint-three-claims | AxiomList | 3 | breathing |
| network-street | NetworkDiagram | 4 | analytical |
| who-checks-whom | FrameworkDiagram | 4 | analytical |
| rollback-timeline | HorizontalTimeline | 4 | analytical |
| kinetic-glaucon-quote | KineticTypography | 5 | analytical |
| shop-motif-observer-dim | CounterfactualPath | 5 | analytical |
| kinetic-unwatched-test-definition | KineticTypography | 5 | analytical |
| epa-nov-reveal | PrimarySourceReveal | 6 | urgent |
| vw-nox | StatReveal | 6 | urgent |
| kinetic-carder-team | KineticTypography | 6 | analytical |
| rde-timeline | HorizontalTimeline | 6 | urgent |
| kinetic-lab-vs-road | KineticTypography | 6 | analytical |
| eval-awareness-auc | DotPlot | 7 | analytical |
| free-tier-conditional | ConditionalArgument | 7 | analytical |
| car-vs-model | SplitFrame | 7 | analytical |
| carry-the-one | MathDerivation | 7 | analytical |
| shop-motif-hidden-observer | ConditionalArgument | 7 | analytical |
| kinetic-three-checks | KineticTypography | 8 | analytical |
| title-end-card | TitleTransition | 8 | analytical |

Pace values come from each agent's report; verify against `_direction.paceProfile` in the files.

## 3. Deviations and open points

- **No image field** in PrimarySourceReveal: `epa-nov-reveal` is a text-only placeholder until the real NOV is sourced (footage id 4).
- **`shop-motif-reasons`** references `episodes/ai-care-motives/stills/aigen-02-shop-counter.png`; stills must be copied into `remotion-templates/public/` before render.
- **Unsupported directives dropped:** `reveal(draw)` on epa-nov-reveal; `[VISUAL-FIRST]` on observer-dim; shop-counter inset on hidden-observer.
- **Definition card:** the three comparison lines and closing caption are folded into `definitionText` with " · " separators; check the render.
- **Multi-line cards** (carder-team, three-checks) use newline-separated text in one card; check line breaking.
- **Sync points unresolved:** `sync:"four days later"` (rollback-timeline) and `syncWords:["forty times"]` (vw-nox) need Whisper `syncPoints` once narration exists.
- **Added content:** rde-timeline has a 4th event (May 2015 first RDE package, verified in the brief). network-street and who-checks-whom use `revealMode: "progressive"`, not specified in the script.
- **Needham attribution** on kinetic-can-it-recognize is a plain attribution line, not quote-attribution.
- ~~`transitionOrigin` on the Glaucon iris~~ — the iris was replaced by a hard cut on Oct 10 (section 10).
- **M-MATH-LENGTH** hints on carry-the-one steps 2 and 3 (non-blocking).
- No `visual-identity.json` for this episode (same as prisoners-dilemma).

## 4. Concept registry

`lookup.py reuse-check` found no prior-episode concepts. Suggested new entry (not yet added): **"The Unwatched Test"** — does the behavior we rely on survive when the helper believes it isn't being assessed. Introduced Beat 1, defined Beat 5, callback Beats 7–8.

## 5. Next

1. Run `generate_manifest.py` (needs narration timing or script-budget fallback), then render stills of the 26 files in Studio to check layout.
2. Capture 36 + 59 screen reconstruction; approve the EPA NOV download.
3. audio-spec.

## 6. Critique pass (Oct 9, 2026)

Applied after reviewing the first full still render.

- **Cut 7 text cards** that repeated the narration (moved to `remotion-templates/data/episodes/ai-care-motives/_cut/`): would-it-tell-me (chat card now holds), can-it-recognize (→ aigen-06 still; also removes an on-screen misattribution of the question to Needham et al.), sharper-pitch and what-supports (desk still alone), observer-dim CounterfactualPath (→ aigen-03 still, motif form 2), carder-team (→ second stock-footage slot, footage-manifest #8), lab-vs-road (RDE timeline holds).
- **three-checks** → definition card "THREE CHECKS", 12s, then the street-of-cards still (aigen-06 b4b) under the closing caveat.
- **free-tier-conditional**: ≈14% / ≈3% as large hero figures (new optional `stat` field on ConditionalArgument branches). The 3% derives from the paper's full-text refusal rates (97.2% unmonitored) per the brief; the research audit did not re-verify it.
- **eval-awareness-auc**: DotPlot `labelScale: "large"` (new opt-in), values in labels, axis 0.50–0.85.
- **Quote cards**: QuoteAttribution text colour now follows the background (was ink-on-dark, invisible), quote size 32→44, closing mark typed with the last word (no orphan). Affects every quote-attribution card in all episodes, including the prisoners-dilemma Nash quote.
- **carry-the-one**: font 48→64; last step holds 6s.
- Segment count 50 → 47; remaining text-led segments: 4 quote/definition cards + chat + 2 titles + three-checks.

Open: chrome register (briefing header/footer, REC/FILED, duplicate bottom-left episode watermark colliding with the section label), dark/light rule for text cards, one new still for a true "unwatched" shop frame (optional).

## 7. Assets sourced (Oct 10, 2026)

Nine files downloaded to `assets/sourced/` (originals) with working copies in `remotion-templates/public/episodes/ai-care-motives/`; selections, licences and credit lines are in `asset-manifest.json`, the shortlist in `asset-candidates.md`.

- **Portrait cards** (ImageComposite `portrait`, natural tones): Kant (Bause engraving, 1791), Mill (after Watkins, 1865), Plato (Capitoline bust). Each plays ahead of its quote card; the Kant and Mill quote cards drop to 23s and 17s.
- **Beat 6:** Wolfsburg plant → "Clean Diesel" Golf (conflict duotone) → EPA card (now a verbatim excerpt from the notice, p. 3) → vw-nox → dynamometer clip → emissions equipment photo (natural tones, captioned as illustrative) → Los Angeles freeway clip.
- **Stock clips are ungraded.** The conflict duotone LUT made both too dark to read.
- **ImageComposite changes:** `duotone: "none"`, `imageFit`, readable caption and source sizes, centred portrait text with a credit line.
- **Pace and cutting (Oct 12, adopted by Tiger after comparing two cuts):** the manifest is timed to the synthetic scratch read at 160 words a minute (9:36). Eighteen still segments are cut into 2 to 5 framings each on sentence boundaries (sub-shots carry ids ending `-s2`, `-s3`, …, each with its own `narrationRef`, so a re-time keeps every cut on its sentence): 89 segments, one cut every 6.5 seconds, no still held longer than 7. Two clips made during the toolbox exploration are in: `clips/aigen-04-rescue-3kf.mp4` (beat3-seg13) and `clips/aigen-05-walkaway.mp4` (beat3-seg14). The VW statistic card (beat6-seg31) now starts on "nitrogen oxide" and holds through "The testers were real"; the EPA notice card before it takes "On the road, the EPA said". The two short stills at the heads of Beats 4 and 7 come in 0.9 s before their line.
- **36 + 59 cards (Oct 12):** beat7-seg41 and beat7-seg43 are statement cards in our own words (PrimarySourceReveal as a plain passage, `summary-36-59-build.json` and `summary-36-59-return.json`), each subtitled "Our summary of a published example · Anthropic, 2025". They replaced the typeset exchange of Oct 11, whose lines were a paraphrase and so could not carry the "Reconstruction" label (VIS-12). Ids and slots unchanged; reveal times follow the word timings of the scratch read.
- **Credits** for the three CC-licensed photos must appear in the video description or on the end card (lines in `asset-manifest.json`).

## 8. Hold and timing fixes (Oct 10, 2026)

- **Cold open:** was one chat card for 28s. Now desk-at-night still (0–9s) → chat card (9–21s) → desk still, closer (21–28s). The episode opens on an image.
- **Unwatched Test definition:** was one card for 30s. Now definition card (9s) → "Three kinds of test" list with rows timed to the narration (14s) → the two identical ring-wearers (7s).
- **EPA card:** on screen for 9.5s (was 5s), starting on "Its diesel cars carried software…"; the two VW photos shorten to ~5s each. Excerpt type scales with length and the highlight follows wrapped text line by line.
- **Blank stretches filled:** three gaps with nothing scheduled (2.0s after the Beat 3 checkpoint, 4.2s before the Beat 5 shop-window still, 0.4s before Beat 8) now hold the neighbouring visual. `qa-episode.mjs` reports such gaps.
- **Section boundaries:** `beats[]` in the manifest came from the script's estimated windows and ran up to 11s ahead of the segments; they are now derived from the segments. The Beat 1 label drops the production term "COLD OPEN".
- Text cards are 16% of runtime (were 23%). The desk-at-night still now appears five times; it is the episode's recurring "you and the machine" image, bookended by the dawn version at the end.

## 9. The 14% / 3% sync fix (Oct 10, 2026)

The training-experiment card used to show both figures about 15 seconds before the narrator said them. Now:

- private-notes still under "A separate experiment tested…" (7.5s)
- the card (23.1s): headline on "Researchers told Claude 3 Opus…", IF line and branch labels on "Some conversations would count…", ≈14% on "fourteen percent", ≈3% on "almost never"
- private-notes still again for "Its written notes described a strategy…" (9.4s)

ConditionalArgument gained `conditionAtSec`, `branchesAtSec` and a per-branch `statAtSec`. The offsets in `free-tier-conditional.json` are estimates from word counts; re-time them once the narration is recorded. The audio cue sheet now puts a `stat-reveal` on the ≈14%.

## 10. Shared-code fixes: seams, text shadow, fonts, paper (Oct 10, 2026)

Fixes in shared code that change how this episode renders. Details: `remotion-templates/LESSONS.md` L118–L119 and `project/TRANSITION_GRAMMAR.md` § "On the episode timeline".

**Seams**
- Cards no longer fade themselves to blank before a cut; inside an episode the seam belongs to the transition wrapper.
- `dissolve` renders as a cut until segments can overlap (8 seams here). The tokens stay in the manifest and script.
- `fade` and `color-wash` render as a symmetric dip through ink. The two one-sided washes (into the dinner still at 0:28, into the second-shopkeeper still at 2:23) now fade out of the previous picture as well.
- Title card: hard cut in from the rating-cards still (D18), dip through ink out to Beat 2. `beat1-seg05` out and `beat1-seg06` in set to `cut`.
- Iris removed: `beat5-seg26` → `beat5-seg27` is a hard cut after the Glaucon hold. `DIR: cut(iris, origin:center)` deleted from the script; its `stat-reveal` cue dropped from the audio spec (Layer 2 is now 23 cues).
- The amber flash at beat boundaries is off (opt-in via `"beatFlash": true`).

**Finish**
- No dark shadow under type on light cards.
- Italic Plex Serif / Plex Sans faces are loaded (attributions, glosses, subtitles were a slanted upright before). TitleBlock subtitles and the KineticTypography slug label have an explicit face; the composition root has a default one.
- Light cards: no colour clouds, no dust particles. `free-tier-conditional.json` no longer asks for `dense` atmosphere.
- Renders are tagged BT.709 (`remotion.config.ts`).

**Superseded the same day:** chrome was stripped (section 11); real overlapping dissolves were built in a separate session on top of `resolveSeams` (see `project/TRANSITION_GRAMMAR.md`), so the `dissolve` seams here are cross-dissolves again, not cuts.

## 11. Chrome stripped and card fixes (Oct 10, 2026)

**Chrome.** This episode runs at chrome level `wordmark`: the ∴ PARALLAX mark stays; the slug, the REC timer, the FILED date and the slug watermark on text cards are gone. Set in `AiCareMotivesFull.tsx` via `ChromeLevelProvider`; other episodes keep the briefing strips. The beat label over stills (SectionIndicator) is unchanged.

**One image look: natural colour.** The AI stills and stock clips already rendered in natural colour (the duotone ramp is a no-op for video). The outliers were pulled to match: the two Volkswagen photos (`photo-vw-wolfsburg`, `photo-vw-golf`) lose the red conflict duotone, and the shop stills inside the two SplitFrame cards lose the beige editorial duotone. The engravings and the marble bust stay as they are (monochrome originals).

**Cards**
- `shop-motif-reasons`, `shop-motif-same-bread` (SplitFrame): new `paneFit: "cover"` — each still fills its half of the frame at full height (crop centre `focusX: 0.47`), captions sit in a strip underneath at 36px. Badges moved inside the safe area, both top-left of their pane so PRUDENCE no longer covers the shopkeeper's head. Captions are now “Cheating a child is wrong.” / “Parents talk.” (the badge carries the DUTY / PRUDENCE label; straight quotes replaced).
- `kinetic-kant-quote`, `kinetic-mill-quote`, `kinetic-glaucon-quote`: quote size now follows length (68 / 68 / 60px, was 44) on a 1400px measure; attribution 28px.
- `checkpoint-three-claims`, `three-kinds-of-test` (AxiomList): the list is one block, centred, 44px text (52 key row), 32px gloss; rows rise 14px as they fade in. Ordinals stay aligned (every row reserves the key rail's width).
- `free-tier-conditional`, `shop-motif-hidden-observer` (ConditionalArgument): the IF → branches block is centred under the title; branch text 30px (was 24).
- `vw-nox` (StatReveal): hero is `40×` with a small `UP TO` kicker above it (new `stat.kicker`), instead of "up to 40x" at 120px. Bar label is "VW on the road".
- `eval-awareness-auc` (DotPlot): label placement is width-aware — a label within 1.5em of another on the same side moves up a row on a longer leader; the strip sits at the middle of the card.
- `carry-the-one` (MathDerivation): the stack rises 14px on entry.

**Shared easing.** `fadeIn()` in `utils/animation.ts` now eases out on the house decelerate curve (it was linear). This changes the feel of every reveal that uses it, in every episode; visual-regression baselines were not regenerated.

## 12. Pane review (Oct 10, 2026)

Second critique pass, card by card, from three angles the earlier passes did not use: what each card does over its hold (three stills per card: about 1s in, mid-hold, settled), whether its form fits its claim, and how it sits in the sequence (measured brightness per segment). Published as a private page: https://claude.ai/artifact/EKhxtVyZevzsKYN7euiYew. Verdicts: 3 keep, 17 adjust, 9 rework. Nothing from the review has been applied yet except the two defects below.

**Fixed during the review**
- Seven templates drew the episode-slug watermark themselves (HorizontalTimeline, TitleTransition, DuelingFrameworks, DecisionTree, StrategicLandscape, DualTimeline, TimelineComparison), so the two timeline cards still printed `AI-CARE-MOTIVES` after the chrome strip. All are now wrapped in `SlugGate` (`src/hooks/useChromeLevel.tsx`).
- SplitFrame faded its whole card up from paper on frame 0, which put a blank cream frame on the hard cut from `shop-motif-reasons` into `shop-motif-same-bread`. Inside an episode it now starts opaque.

## 13. Pane review, first batch (Oct 10, 2026)

The changes from the pane review that need no recorded narration. Times come from the script at 2.5 words a second and will need a pass once narration exists.

- `checkpoint-three-claims` (Where we are): rows land at 1.2s, 2.8s and 6.4s (new per-row `atSec` on AxiomList), on the sentences that speak them. They were all in by 2s.
- `shop-motif-reasons` (SplitFrame): new per-pane `revealAtSec`. Both pictures start under a veil with no labels; the left half arrives at 4.6s ("In the first…"), the right at 10.4s ("In the second…"). Badge at the reveal, caption 0.8s later.
- `kinetic-kant-quote`, `kinetic-mill-quote`, `kinetic-glaucon-quote`: new `typingCps: 14` (speech pace; the default is 22) and `typingStartSec` (Mill 0.6s, Glaucon 2.2s) so the text no longer finishes ahead of the voice. The opening quote mark stays hidden until typing starts.
- `three-checks.json` replaces `kinetic-three-checks.json` (moved to `_cut/`): an AxiomList in the same form as the other two lists, rows at 1.3s, 2.9s and 4.2s. `beat8-seg47` now points at it; the script cell is updated.
- Audio: texture hits on these cards moved to the new reveal times; the Glaucon quote-bell moved to 2.2s. Layer 3 is now 41 hits.

## 14. Pane review, second batch (Oct 10, 2026)

- **Glaucon quote over the picture.** `beat5-seg26` now has `layered.backgroundSegmentId: beat5-seg25b` (dim 0.6), so the quotation types over the held ring-wearers still instead of on a cream card. Script: `DIR: over(previous, dim:0.6)`. The attribution takes a light tone on dark grounds.
- **The EPA notice is the real page.** `epa-nov-reveal` uses PrimarySourceReveal's new image mode: a 300dpi crop of page 3 of the notice (`public/episodes/ai-care-motives/stills/doc-epa-nov-p3.png`, from `assets/sourced/doc-epa-nov_epa_2015-09-18.pdf`), multiplied onto the card, with the sentence highlighted in place from 3.2s. The scan has no text layer; the passage and page number were checked by eye against the rendered page. The duplicate date line is gone.
- **Who checks the helper** (`who-checks-whom`): FrameworkDiagram's new `comparisonLayout: "paired"`. Three rows at 44px with arrows, each pair landing on its sentence (Doctor → Licensing board at 4.6s, Bank → Regulators at 9.0s, Shopkeeper → The street at 12.2s, keyed in gold).
- **Cars versus model** (`car-vs-model`): moved from SplitComposition's tinted panels to the same paired layout with row labels. What changed: cleaner under the recognized test / answered more harmful requests when it believed the conversation counted. How it knew: software recognized the official test / told which conversations would count toward training. The source line now renders. `beat7-seg40` points at FrameworkDiagram.
- **Portrait and quote are one card.** ImageComposite's portrait variant takes `quotes[]` (text, `atSec`, optional `cps`) and types them beside the portrait. `portrait-kant` carries the two fragments at 5.0s and 11.4s; `portrait-mill` carries its quote at 6.6s. The separate quote segments `beat2-seg11` and `beat3-seg15` are merged into `beat2-seg11a` (114–143s) and `beat3-seg15a` (169–192s); their data files are in `_cut/`. The manifest is now 54 segments. The Kant card has about nine seconds of slack against the estimated narration; trim it when narration is recorded.
- **Typed text holds its layout.** `Typewriter` has `reserveLayout`: the whole text is laid out from the first frame with the untyped part transparent, so a centred quote no longer re-centres each time it reaches a new line. On for all quote-attribution cards and the portrait quotes.
- Audio: cues moved to the merged and rebuilt cards (quote-bell at each quotation's start; hits on each paired row). Layer 2 is 23 cues, Layer 3 is 41 hits.

## 15. Pane review, third batch (Oct 10, 2026)

- **"Same bread" is no longer a second card.** `shop-motif-reasons` runs 25s and its captions swap in place (new per-pane `captionSwap` on SplitFrame): left to “Same bread.” at 21.2s, right to “Same price. Same change.” at 22.0s. The picture holds, so its slow push no longer snaps back at the refrain. `beat2-seg09` is merged into `beat2-seg08` (77–102s); `shop-motif-same-bread.json` is in `_cut/`. The manifest is 53 segments.
- **Dot plot** (`eval-awareness-auc`): the claim's distance is drawn — a gold band on the axis from 0.50 to the furthest model, labelled “better than chance →”, at 5.2s (new `span`). Values are set large with names small (new `valueLabel`). Dots land one at a time (new per-entity `atSec`): Gemini 2.0s, GPT-4.1 3.0s, human raters 8.0s.
- **Rollback timeline** (`rollback-timeline`): a timeline short enough to fit at the close-up zoom no longer pulls back, so both events stay at reading size. A “4 days” bracket draws between them at 4.2s (the existing `eras` bracket, now with `appearAtSec` and a legible 20px label instead of 10px).
- **Free-tier card** cuts in 5s later: `beat7-seg38a` (the private-notes still) is 484.2–496.7s and `beat7-seg38` is 496.7–514.8s. The card's reveal times moved with it (IF at 1.6s, branches 4.4s, 14% at 8.2s, 3% at 14.5s), so everything lands at the same moment as before; the card just no longer sits as a bare title for 6.6s.
- Audio: the other session now owns the audio plan and is thinning it. I carried the affected cue offsets along in the manifest and left the cue sheet for that pass.
- **28px text floor on three templates.** At the request of the session doing the text-size pass (which reports Tiger's go-ahead for a 28px minimum on content text): SplitFrame badges are 28px; HorizontalTimeline dates are 32 and titles 34 in canvas px, which holds 28px on screen at the widest pull-back (the road-testing timeline ends at about 0.89×); DotPlot ticks, names, reference label and span label are 28px. The TitleBlock subtitle (22px, shared by every titled card) was left to that pass.
- QA caught one overlap in the new two-level dot-plot label (value and name boxes); fixed.
- Full QA after this batch and the text-size pass: 51 frames, 0 fails, 20 warnings. One text was listed under 28px (the “4 days” bracket label, 22 canvas px); it is now 28.
- Final QA (Oct 11, quiet machine, `--floor=28`): 51 frames, 0 fails, 13 warnings, no content text under 28px. The warnings are source-line contrast (3.7–3.8:1) on the cards that carry a source line, plus the Wolfsburg credit 6px outside the left safe edge.

