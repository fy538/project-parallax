# Transitions: research, engine diagnosis, and a proposed grammar

> October 10, 2026. Prompted by the iris at `beat5-seg26 → beat5-seg27` in `ai-care-motives` (Glaucon quote card → bread shop), which looked janky in preview. Web research by a sub-agent (text sources only, no videos watched); engine findings read from `remotion-templates/src/components/Transitions.tsx` and checked in rendered frames. Nothing in `project/TRANSITION_GRAMMAR.md` has been changed yet.

## 1. Why that iris looked bad

1. **Wrong meaning.** The iris is a silent-era device used since "mainly … for ironic or comedic effect"; Reisz and Millar already called wipes and irises out of fashion. From a philosophy quote into an illustration it reads as a cartoon gag.
2. **It plays twice.** The manifest sets `out: iris` on the quote and `in: iris` on the shop. Each segment animates only itself, so the card closes in a circle (0.5s), there is a blank beat, then the shop opens in a second circle (0.5s).
3. **Mismatched surround.** While the card closes, the area outside the circle is black; when the shop opens it is paper. A glowing gold ring rides both.
4. **Against our own doctrine.** `TRANSITION_GRAMMAR.md` §06 reserves iris for episode open and close and says to avoid it within a beat. The script put it there anyway.

## 2. What the transition engine actually does

- **Segments never overlap in time.** A transition is an envelope on one segment's own first or last frames. The outgoing and incoming pictures are never on screen together.
- **So `dissolve` is not a cross-dissolve.** The outgoing segment is cut; the incoming one fades up from blank paper (with a 2% scale). `fade` is the same without the scale.
- **Setting both `out` and `in` doubles the transition** (out, blank, in). In `ai-care-motives`: 1 iris pair, 5 colour-wash pairs (each about a second through dark ink in a light video), 3 fade pairs around titles (intended).
- **Templates fade their own content out** over their last half-second, so even a "hard cut" from a card is "text fades to blank paper, then cut".
- A true dissolve is possible today only by extending a foreground card over an already-playing background clip and fading the card (`out: fade`).

Seam inventory, `ai-care-motives` (56 segments, 55 seams): about 36 plain cuts, 10 fade-ups labelled `dissolve`, 5 colour-wash pairs, 3 fade pairs, 1 iris pair.

## 3. What the research says

- **The cut is the default.** Since the 1970s almost 99% of shot transitions in popular film are cuts; fades and wipes have declined for decades. [Cutting et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC3485803/)
- **A seam is hidden by sound and by motion in the incoming shot, not by an effect.** Viewers miss about a quarter of continuity cuts; edit blindness mostly disappears without audio. [Smith & Henderson](https://doi.org/10.16910/jemr.2.2.6), [Smith](https://eprints.bbk.ac.uk/id/eprint/14904)
- **A cut is judged by whether the thought is complete** (Murch: emotion 51%, story 23%, rhythm 10%). [Summary](https://cloud.wikis.utexas.edu/wiki/spaces/rtf318/pages/80022510/Murch+s+Rule+of+Six)
- **Each transition carries a meaning:** cut = full stop; dissolve = change of time or place, or reflection; fade = new chapter; wipe = a dissolve that calls attention to itself. [Videomaker](https://www.videomaker.com/article/c3/7188-edit-suite-the-language-of-transitions/); iris: [Wikipedia](https://en.wikipedia.org/wiki/Iris_shot), [Reisz & Millar](https://lantern.mediahist.org/catalog/techniquefilmedit00reis_0250)
- **Unrelated visuals: fade through.** Material Design's rule: persistent container → container transform; sequence → shared axis; no strong relationship → fade through, about 300ms. [Docs](https://pub.dev/packages/animations)
- **Match cuts say "these two are equal"**; subject in about the same position, similar shapes. [School of Motion](https://www.schoolofmotion.com/blog/match-cuts)
- **Animate only when it aids understanding; simple transitions; avoid simultaneous changes.** [Bostock](https://bost.ocks.org/mike/constancy/), [Heer & Robertson](https://homes.cs.washington.edu/~jheer/files/2007-AnimatedTrans-InfoVis.pdf)
- **Documentary habit avoids the text card:** words are read over moving stills (Ken Burns); centre-screen text works as punctuation. [Britannica](https://www.britannica.com/biography/Ken-Burns), [11polaroids](https://11polaroids.com/2016/07/21/silent-return-of-voice-of-god-in-documentary/)
- **Extraneous material hurts learning** (coherence principle, 23 of 23 tests). No study tests transitions themselves. [Mayer](https://www.cambridge.org/core/books/abs/cambridge-handbook-of-multimedia-learning/principles-for-reducing-extraneous-processing-in-multimedia-learning-coherence-signaling-redundancy-spatial-contiguity-and-temporal-contiguity-principles/C98AB3A6CE760DD63C048936EA0B3B44)
- **Channel practice is thinly documented.** First-hand accounts only for Vox (seams land on music: [Open Notebook](https://www.theopennotebook.com/2020/01/07/videogram-how-a-vox-video-explains-the-science-behind-the-first-photo-of-a-black-hole/)), Kurzgesagt (transitions designed at the sketch stage), one School of Life animator ([It's Nice That](https://www.itsnicethat.com/articles/olga-makarchuk-how-to-narrate-your-life-story-school-of-life-animation-301117)) and 3Blue1Brown's tooling. Nothing usable for Every Frame a Painting, Nerdwriter, LEMMiNO and the rest.
- **Durations:** soft cut 8–15 frames at 30fps; dissolve 30–60 frames; motion-design default about 300ms. J/L audio lead of 1–2s is vendor guidance only.

Not verified: the references our doctrine cites for iris (NYT Op-Docs, Economist Films, Morris/Herzog); any "muddy dissolve" authority; transitions-per-minute in essays.

## 4. Proposed grammar (synthesis, for decision)

| Seam | Do this | Why |
|---|---|---|
| Default, any seam | Hard cut on a phrase boundary, narration leading, incoming picture already moving. No whoosh. | The cut is the invisible full stop. |
| Text card → illustration | Related: keep the type up while the picture arrives beneath it, then take the type off. Unrelated: clean cut, or fade through paper (about 0.3–0.5s). | Removes the seam instead of decorating it. |
| Illustration → text card | Stay on the illustration: dim it, bring the type on. Cut to a clean card only when the exact wording is the argument. | Documentary habit; fewer cards. |
| Illustration → illustration, same scene | Straight cut, on action or a matched composition. | A dissolve would claim time has passed. |
| Illustration → illustration, new scene | Cut with a sound bridge, or a short dissolve (8–15 frames). | Dissolve = change of time or place. |
| Card → card, diagram → diagram | Don't transition the frame; change the contents. | Same ground. |
| Diagram ↔ illustration or card | Cut. | No shared element to carry. |
| Chapter break | Dip through ink, with a music change or a beat of silence. | Fade = new chapter. |
| Banned | Iris, wipes, zoom/whip presets, more than three transition types per episode. | Dated or attention-seeking. |

## 5. Engine changes this implies

1. Never run `out` and `in` on the same seam: one side owns it.
2. Let a template skip its own exit fade when the seam after it is a cut.
3. Allow the outgoing segment to overlap the incoming one, so a real cross-dissolve and "type stays while the picture arrives" are possible (Remotion's `@remotion/transitions` is already installed; extending a foreground card over a background clip already works).
4. Retire `iris` from the canonical list and add it to the deprecated lint.

## 6. This seam: four options rendered

`remotion-templates/out/preview/ai-care-motives/seam-options-quote-to-shop.mp4`: A hard cut, B fade up from paper, C dip through paper, D true cross-dissolve (card extended 0.8s over the playing clip). The live manifest still has the iris.

## 7. What was implemented (Oct 10, later the same day)

Step 1 was done by the "Episode 1 - Alignment" session: the iris at this seam became a cut, `resolveSeams.ts` was introduced (overlap-only tokens → cut, fade → dip through ink, symmetric dips) and templates stopped fading themselves out inside an episode.

Step 2, built on that resolver:

- **Real cross-dissolve.** `dissolve` on two abutting segments gives the outgoing one a frozen tail the length of the dissolve; the segment drawn on top does the fading. Manifest timings are unchanged. (`resolveSeams.ts` rule 5, `HoldTail` in `FullEpisode.tsx`.)
- **Hold-under.** A `KineticTypography` card with `layered.backgroundSegmentId` naming the picture before it renders as light type over that held, dimmed picture, with no chrome. (`resolveSeams.ts` rule 6; `overPicture` in `segmentBackdrop.ts` and `KineticTypography.tsx`; `DefinitionReveal` gained colour props.)
- **Iris retired.** Always a cut; warning-level lints `M-TRANSITION-IRIS-RETIRED` and `S-DIR-IRIS-RETIRED`; doctrine § 06 rewritten; the writing skills no longer tell the writer to use it.
- **Doctrine.** `TRANSITION_GRAMMAR.md` now opens its decision matrix with the by-seam-type table from § 4.
- Not done: match-cuts still resolve to a cut; `apply_default_transitions()` in `generate_manifest.py` still hands out dissolves at beat boundaries; hold-under is supported by `KineticTypography` only.

Checked on rendered frames (`out/preview/ai-care-motives/transitions-now-vs-option.mp4`): the quote → shop cut is clean, shop → definition is a true 0.4s dissolve, and the variant shows a 1s card-over-picture dissolve and the definition over the held street. Eight seams in `ai-care-motives` carry a `dissolve` token and now render as real dissolves; six of them join a diagram to a picture or card, which the seam table says should be cuts.

## 8. Follow-up decisions applied (Oct 10)

- **`beat5-seg26 → 27 → 28` uses the new behaviours.** The Glaucon quote dissolves away over the shop clip (1s, `out: dissolve`); the Unwatched Test definition sits over the held, dimmed empty street (`layered.backgroundSegmentId: beat5-seg27`, dim 0.6). The script carries `DIR: cut(dissolve, 1s)` and a note on the definition row; hold-under itself has no script directive yet, so it is wired in the manifest like the clip wiring.
- **Five diagram seams are cuts** (it was five, not the six first reported): `beat2-seg09→10`, `beat2-seg11a→11`, `beat3-seg15a→15`, `beat3-seg17→beat4-seg18`, `beat6-seg34→beat7-seg36`. Two short dissolves remain: Mill quote → desk still (`beat3-seg15→16`) and screen capture → desk still (`beat7-seg43→44`).
- **Generator defaults match the seam table.** `apply_default_transitions()` no longer gives beat boundaries a dissolve, and breathing pace no longer turns cuts into dissolves; it only stretches a transition that is already there. A dissolve or a chapter dip now comes only from a `DIR:` directive or a title card. `PACING_REGISTER.md`, `PACING_SYSTEM.md` and `TRANSITION_GRAMMAR.md` Context B updated; 163 generator tests pass.
- **Hold-under has a script directive.** `DIR: over(previous[, dim:<0-1>])` on the card's row; `generate_manifest.py` writes `layered.backgroundSegmentId` and warns (and drops it) when the card does not directly follow a picture or is not a `KineticTypography`. The definition row in `ai-care-motives` was split into its three shots (same words) so the directive and the dissolve after it sit on the right row; a scratch regeneration reproduces the `layered` block.
- **Definition → "Three kinds of test" is a 0.5s dissolve** (`beat5-seg28 → 28b`), replacing the cut from the dark street to a near-blank bright card. The resolver now keeps the picture under a hold-under card for the length of that card's own dissolve.
