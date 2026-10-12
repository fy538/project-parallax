# Parallax: current state of AI-generated stills and AI video (local repository audit, 2026-10-11)

Scope: files on disk in `/Users/feihuyan/project-parallax` only; no web sources. Every path below is relative to that root. "Source:" names the file the fact was read from; line numbers are given where they help. Numbers marked *computed* were calculated by me from the named file, not printed in it.

---

## 1. How is the current episode composed?

### Takeaway
The numbers in the brief match the report file exactly: AI illustration is 5:09 (45.6%) of an 11:19, 53-segment episode, and 4:08 (36.6%) of the episode is a generated still with nothing but one baked zoom on it. Twelve stills carry all of it, and two of them (aigen-06 and aigen-10) are on screen for 2:02 between them across nine uses.

### Cited Findings

**Report identity**
- The report is titled "Visual QA — The Unwatched Test", "Generated 2026-10-11 18:06 by `scripts/qa-episode.mjs`", and says "53 segments, 11:19 runtime. Text cards 8% of runtime; all Remotion templates 55%." — Source: `remotion-templates/out/qa/ai-care-motives-components/report.md` lines 1–8
- The manifest gives `totalDurationSec: 678.6` (11:18.6), `fps: 30`, `mode: "estimate"`, `handWired: true`, 53 segments. Timings are script estimates; narration is not recorded. — Source: `remotion-templates/data/episodes/ai-care-motives/assembly-manifest.json`

**Components table (verbatim values)** — Source: `remotion-templates/out/qa/ai-care-motives-components/report.md` lines 20–51

| Group | Kind | Segments | Time | Share |
|---|---|---:|---:|---:|
| **AI illustration** | | **26** | **5:09** | **45.6%** |
| | Camera move only (Ken Burns) | 22 | 4:08 | 36.6% |
| | Animated by a video model | 1 | 0:10 | 1.5% |
| | Inside a Remotion layout | 1 | 0:25 | 3.7% |
| | Held under Remotion type | 2 | 0:26 | 3.8% |
| **Real-world imagery** | | **9** | **1:43** | **15.2%** |
| | Stock footage | 2 | 0:20 | 2.9% |
| | Photograph or document in a Remotion card | 5 | 0:31 | 4.6% |
| | Portrait with typed quotation | 2 | 0:52 | 7.7% |
| **Motion graphics (Remotion only)** | | **16** | **4:02** | **35.7%** |
| | Type card | 3 | 0:30 | 4.4% |
| | List | 3 | 0:40 | 6.0% |
| | Argument or diagram | 5 | 1:47 | 15.8% |
| | Chart or statistic | 2 | 0:21 | 3.1% |
| | Timeline | 2 | 0:32 | 4.7% |
| | Equation | 1 | 0:12 | 1.8% |
| **Not made yet** | Placeholder | **2** | **0:24** | **3.5%** |

- "What moves the picture": a camera move over a still, nothing else 4:08 (36.6%); a video model animating a still 0:10 (1.5%); filmed motion (stock footage) 0:20 (2.9%); Remotion animation (type, diagrams, charts, and cards that carry a photo or still) 6:16 (55.4%); not made yet 0:24 (3.5%). — Source: same file, lines 45–51
- "Stills behind the full-frame illustration time: 12 stills carry 4:18, 22s each on average." — Source: same file, line 53

**Per-still reuse table (verbatim)** — Source: same file, lines 55–68

| Still | Uses | Time on screen |
|---|---:|---:|
| aigen-06 | 4 | 1:10 |
| aigen-10 | 5 | 0:52 |
| aigen-03 | 2 | 0:22 |
| aigen-09 | 2 | 0:22 |
| aigen-02 | 2 | 0:16 |
| aigen-05 | 1 | 0:14 |
| aigen-11 | 1 | 0:14 |
| aigen-08 | 2 | 0:12 |
| aigen-04 | 1 | 0:12 |
| aigen-01 | 1 | 0:09 |
| aigen-12 | 1 | 0:09 |
| aigen-07 | 1 | 0:07 |

- The report's Sequence section flags both heavy reuses: "Still aigen-10 used 5× (beat1-seg00, beat1-seg03, beat3-seg16, beat7-seg36, beat7-seg44)" and "Still aigen-06 used 4× (beat1-seg05, beat4-seg21, beat4-seg23, beat8-seg47b)". The house rule that triggers the flag is "Still reused > 2 uses". — Sources: report.md lines 12–13; `project/VISUAL_QA.md` line 17
- The visual spec calls the five-times reuse deliberate: "The desk-at-night still now appears five times; it is the episode's recurring 'you and the machine' image, bookended by the dawn version at the end." — Source: `episodes/ai-care-motives/visual-spec.md` § 8

**Ken Burns hold lengths** (*computed* from the `rows` array in `remotion-templates/out/qa/ai-care-motives-components/report.json`; the figures are not printed in report.md, but they reproduce the brief's numbers)
- 22 segments of kind `aiKenBurns`, total 248.2s (= 4:08). Durations sorted: 3, 3, 5.4, 6.6, 6.8, 7, 9, 9, 9.1, 9.4, 12, 12, 12.5, 13, 13, 14, 14, 14.4, 18, 18, 19, 20 seconds.
- Median 12.0s; mean 11.3s; seven segments of 14s or more; twelve of 12s or more.
- Longest unbroken run of back-to-back Ken Burns segments: 36s (beat1-seg03 7s + beat1-seg04 9s + beat1-seg05 20s, 0:21 to 0:57).
- Longest single holds: beat1-seg05 20s (aigen-06), beat4-seg21 19s (aigen-06), then a tie at 18s: beat4-seg23 (aigen-06, second crop) and beat3-seg16 (aigen-10). Next: beat7-seg44 14.4s (aigen-10 close), beat8-seg45 14s (aigen-11), beat3-seg14 14s (aigen-05).

**How the kinds are decided** — Source: `project/VISUAL_QA.md` § "Components section (added Oct 11, 2026)"
- Two questions define the split: "where the picture comes from, and what moves it."
- A local clip is "animated by a video model" when `episodes/<slug>/assets/clips-i2v/<name>.json` exists (the sidecar `fal_i2v.py` writes), and "camera move only" when `episodes/<slug>/assets/clips-kenburns/<name>.mp4` exists. A template is "inside a Remotion layout" when its data points at a generated still, "held under Remotion type" when the segment has `layered.backgroundSegmentId`. "Keep new clips in those two folders, or the report cannot tell them apart."
- The taxonomy also has an AI-illustration kind "static still"; this episode has none. It runs without rendering: `npm run qa:episode -- --episode=<slug> --no-render --tag=components`.

**Which segments are which** — Sources: report.md Segments table; assembly-manifest.json
- The one video-model segment is beat5-seg27 (5:58, 10.2s), playing `clips/aigen-03-unwatched.mp4`.
- The one "inside a Remotion layout" segment is beat2-seg08 (1:17, 25s), SplitFrame `shop-motif-reasons`, with the shop-counter still (aigen-02) in both panes.
- The two "held under Remotion type" segments are beat5-seg26 (Glaucon quotation typed over the held ring-wearers still, 17s) and beat5-seg28 (the Unwatched Test definition over the held last frame of the i2v clip, 8.8s); both set `layered.backgroundDim: 0.6`.
- The two placeholders are beat7-seg41 and beat7-seg43 (12s each): the unsourced "36 + 59" screen captures.
- 16 Ken Burns clip files serve the 22 segments; six files are each played in two segments: `aigen-10.mp4` (beat1-seg00, beat3-seg16), `aigen-06.mp4` (beat1-seg05, beat4-seg21), `aigen-06-b4b.mp4` (beat4-seg23, beat8-seg47b), `aigen-08.mp4` (beat5-seg25b, beat5-seg28c), `aigen-09.mp4` (beat7-seg38a, beat7-seg39), `aigen-10-b7close.mp4` (beat1-seg03, beat7-seg44).

**What "one Ken Burns move" is, concretely** — Sources: `episodes/ai-care-motives/shot-list.json`; `tools/ai-video/render_kenburns.py` lines 51–72
- Each clip is a single linear zoom toward one fixed focus point (`start_scale`, `end_scale`, `focus_x`, `focus_y`, `duration_sec`); the script comment reads "Linear zoom across output frames". There is no pan path and no easing.
- The 12 main clips push from 1.0 to between 1.08 and 1.15 (aigen-12 pulls out from 1.15 to 1.0). The four reuse variants are 1.0→1.03 (aigen-02-b4), 1.35→1.0 on a different crop (aigen-06-b4b), 1.0→1.0, a static hold (aigen-10-b7open), and 1.0→1.25 (aigen-10-b7close).

**Decisions recorded for the episode**
- "Decision (Tiger, Oct 7): all generated imagery is AI-GEN stills; no illustration-register (Recraft) entries in this episode... mostly Ken Burns or live-still, clips only where motion earns it." The reason given: "Recraft output has never appeared in an episode in this repo, and mixing two generators risks a style seam." — Source: `episodes/ai-care-motives/script.md` line 13
- The shot list's motion model: "Ep1-style: no morphs. All stills use Ken Burns... One optional live-still (aigen-04)"; `seams: []`, `morph_pairs: []`. — Source: `episodes/ai-care-motives/shot-list.json` lines 6–9, 38–39
- "One image look: natural colour. The AI stills and stock clips already rendered in natural colour (the duotone ramp is a no-op for video)." The two Volkswagen photos and the stills inside SplitFrame were pulled to natural colour to match. — Source: `episodes/ai-care-motives/visual-spec.md` § 11
- The script's own pacing note: "Motion: Ken Burns by default; consider a single-still clip only for the river rescue (reaching arm). Pacing check: no more than two consecutive AI-GEN rows in any beat." — Source: `episodes/ai-care-motives/script.md` line 203

### Inferences
- The per-still table counts only full-frame uses (Ken Burns plus the i2v clip). It leaves out the SplitFrame use of aigen-02 (25s), the 17s that aigen-08 sits dimmed under the Glaucon quotation, and the 8.8s that the last frame of the aigen-03 clip sits under the definition card. Counting those, aigen-02 is on screen about 41s, aigen-08 about 29s and aigen-03 about 31s.
- Because six clip files are played in two segments each and the FOOTAGE path plays every clip from frame 0 (see § 5), the viewer sees the identical push from the identical start twice for those six.
- Counting hold-under and the i2v clip as illustration time, the longest continuous stretch on generated pictures is about 48s (beat5-seg25 to beat5-seg28, 5:29 to 6:17), but that stretch contains typed text and the animated clip, so it is not a plain Ken Burns stretch.
- "The three longest holds" is ambiguous: third place is a tie at 18s, and three of the four longest holds are the same still (aigen-06).

### Gaps
- The Oct 10 analysis says "`ai-care-motives` has 230s of AI imagery (34% of runtime), all Ken Burns" (`analysis/ai-video-landscape-2026-10-10.md` § 1). The Oct 11 report says 5:09 (45.6%). I found no reconciliation; the later figure follows a day of manifest changes (cold open rebuilt on stills, text cards cut, hold-under added) and a different counting basis. Treat the QA report as current.
- No narration exists, so every duration is an estimate from word counts (`mode: "estimate"`); the hold lengths will move when narration is recorded.
- The main QA report at `out/qa/ai-care-motives/` was not read; only the `-components` run named in the brief.

---

## 2. What does the project's own doctrine say about animating stills?

### Takeaway
The doctrine is built on May 2026 tests with Pika and Hailuo and reduces to: classify the shot (camera reframe or scene transform), prefer the deterministic tool, edit a frame before asking a model to animate it, and never let a depth estimator or an aggressive AI camera loose on flat art. It already names cinemagraph and hand-layered 2.5D as allowed but unused families. Several of its tool picks and its "no programmatic API" premise are marked stale by the project's own October review.

### Cited Findings

**A. `project/CHAINED_STILL_LESSONS.md`** (header says "Last updated: May 21, 2026"; its latest dated section is May 24, 2026; sources: prisoners-dilemma Scene C bakeoff May 9, Thread A bakeoff May 21). Each rule with its stated reason:

1. **Classify before choosing a tool: reframe vs transform.** "Reframe = the camera moved, the scene didn't change... Never a morph. Use Ken Burns (camera motion) or a live still (subject motion)." "Transform = the scene content genuinely became something else... Morph is correct, if it's a small number of large flat shapes and frame B is edited from frame A." Reason: the Thread A dolly-in morph "failed badly: the ~60 hand-drawn tally marks slid, smeared, multiplied, and dissolved."
2. **Morph correspondence theory.** Start+end-frame interpolation "works by finding correspondence between elements in frame A and frame B." Three consequences: (a) "A few large shapes morph cleanly... Many small high-frequency details morph badly"; (b) "Independently generated frames are the worst case. Two stills drawn separately from text have no real shared pixels... Fix: generate frame B by editing frame A"; (c) zoom-in or dolly-in is a disocclusion case: "there's nothing to interpolate from... text/marks garble because they're pixel patterns, not glyphs. A zoom is therefore almost never a morph job."
3. **Three tools in increasing risk.** Ken Burns: the camera moves; risk "None, deterministic, no AI hallucination"; ffmpeg `zoompan` or NLE. Live still: the subject moves; risk "Low, one input image, so no correspondence problem to fail"; single-image mode, "Keep motion small." Morph: the scene transforms; risk "High unless disciplined."
4. **Hailuo model selection (May 23).** `I2V-01-Live` for live stills; "Never Hailuo 02 for live-stills, it's photoreal-trained and will add realistic texture to flat art." "No motion-intensity slider exists; restraint is 100% prompt language": lead with the camera lock ("omitting motion words defaults to handheld drift"), name only the one moving element, "name everything else static... counters checkerboard crawl", keep prompts terse.
5. **Episode 1 decision: defer morphs (May 23).** Reason: morphs were "the lowest-ROI, highest-failure technique (smearing, flash-on-appearance, mandatory cherry-picking)." The vocabulary collapses to single-still live motion, Ken Burns, and cut or cross-dissolve seams. "Most 'morph' beats are dissolves in disguise... A dissolve implies the 'becoming' instead of rendering the in-between."
6. **Hailuo-native prompt structure (May 23).** No negative prompt ("Hailuo ignores it"); lead with the camera state; "`Truck` (lateral camera slide) gives real parallax, prefer it over a pan"; at most about 20 words and 3 motion ideas; "name the crawl-prone surface to freeze."
7. **Ground every motion prompt in the actual still, not the script intent (May 24).** Reason: prompts written from the intended scene "named things that weren't in the frame (`aigen-07` said 'papers' on an empty table → the model would hallucinate papers in) and prescribed motion that didn't fit the composition." Four steps: open the still and name only visible elements ("anything absent that you name gets hallucinated in"); match the verb to the pose; match the technique to the still ("Dynamic foreground action... is a bad live-still candidate → prefer ken-burns or cinemagraph"); re-verify after any regeneration. Automated by the `ground-motion` skill.
8. **Morph-friendly vs morph-hostile checklist.** Friendly: a few large shapes, shared composition, flat low-texture colour, no text or countable marks, both frames from a shared base image, small scale change, a real transform, organic flow. Hostile: the opposites, plus "A 'reframe' of a static scene → use Ken Burns."
9. **Organic vs geometric transforms (May 23).** "AI start/end interpolation has no 3D world model; it renders all spatial change as fluid deformation... So gooeyness is architectural." Organic or atmospheric transform → AI morph; geometric or precise transform (grid→table, charts, typography, hard edges) → "animate in Remotion (vector/code), NEVER AI morph." Seven craft rules: never linear; transform, don't deform; snap to the grid; 200–500ms per move; stagger; no bounce or overshoot; match tool to transform.
10. **The six-family taxonomy of single-still animation (May 23).** Stated crux: "the families that depend on recovering 3D depth are exactly the ones that fail on flat constructivist art, because monocular depth estimators are trained to ignore flat media."

| # | Family | What moves | Renderer | Flat-art risk | Internal tag |
|---|---|---|---|---|---|
| A | Camera-on-plane (Ken Burns 2D) | virtual camera | ffmpeg, local, deterministic | none | `ken-burns` |
| B | Masked ambient (cinemagraph / plotagraph): one masked element (smoke, flare, glow, water, flag) | a masked region | Pika masked / NLE | low (mask-defined, not depth) | `cinemagraph` |
| C | Manual 2.5D parallax: hand-layered fore/mid/back | layers at different rates | NLE (AE/Photoshop), deterministic | low (you author depth) | `parallax-2.5d` |
| D | AI subject micro-motion (i2v, no end frame) | the subject | Pika/Hailuo single-image | low–med (faceless figures forgive) | `live-still` |
| E | Auto-depth 2.5D (LeiaPix/Immersity/CapCut "3D photo") | auto camera + parallax | none | HIGH, depth estimator fails | BLACKLIST |
| F | AI hallucinated 3D camera: aggressive orbit / fly-through | invented geometry | none | HIGH, colour blocks melt | BLACKLIST |
| F′ | AI subtle camera move: slow push / lateral drift on one still | mild invented parallax | Pika/Hailuo single-image | low–med, "proven OK on flat art (PD `aigen-01`, `04`)" | `live-still` (camera variant) |

11. **Notes attached to the taxonomy.** Why D works: "stylized, non-photoreal, color-blocked figures dodge the uncanny face/hand collapse." Faces caveat: on any shot with a visible close face, "hold the head still; animate only hands, body lean, props, or ambient." "'No walking' is not the real rule": the real risk drivers are "visible faces, articulated close hands, and large figure scale"; a distant back-turned figure walking away is the canonical safe case; failure tells are "repeating-pattern crawl" and "text warp." "Cinemagraph (B) is the underused safe tool... mask that element and animate only it. Pika animates reflective water / flicker badly when unmasked." "Manual 2.5D (C) is the one 'premium' move available, but it's hand-labor (AE layer slicing); reserve for 1–2 hero depth shots per episode... Do NOT reach for an auto-depth tool to shortcut it."
12. **Resolution headroom: upscale before local camera moves.** "A push to zoom Z needs `source_width ≥ output_width × Z`" (1.3× → 2,496px; 2× → 3,840px). "Our ChatGPT stills are ~1,672px, narrower than a 1920 frame, so every push starts soft." Fix: Real-ESRGAN `x4plus` ("preserves editorial grain; the `anime` model over-flattens it") via `tools/ai-video/upscale.py` into `assets/stills-4k/`. "Targeted at A and C only; the AI-video families... are capped at 1080p by the generator, so upscaling their source buys nothing."
13. **Validated chain pipeline (May 9).** Stills: one ChatGPT conversation per scene, sequential generation, upload Frame 1 plus Frame N-1 as anchors ("bounds drift more reliably than single-anchor uploads"), restate camera position, what does not change, the single change, and palette hex codes in every prompt. Morph clips: Pika 2.5 start+end frame, 8 seconds ("Going to 10s... starts to introduce drift in the final 1-2 seconds"). Assembly: hard cuts between morph clips ("a fade between morphs creates a double-transition that reads as visual stutter") and a colour-grade snap pass against palette drift.
14. **Prompting do and don't.** Stills: lock the camera, describe single changes in isolation, do not introduce more than one significant element per frame, no text on surfaces in middle frames, generate in order. Morph prompts: avoid vertical-motion verbs ("lift," "rise," "emerge"), which Pika renders as smoke or dust; negate atmospheric effects by default; run 2–3 attempts on figure-heavy morphs.
15. **Failure-mode table (four rows).** Smoke on a transform (verb "lift"); detail smearing on a dolly-in morph; brand duotone "crushed a colorful payoff shot (gold doorway → muddy olive)", fixed by partial strength `treat_video.py --strength 0.25–0.4`; light flash when an object appears, caused by over-prompting ("In start+end-frame mode the two stills ARE the instruction"), fixed by "Prompt = camera + mood ONLY."
16. **Surprising finding.** "Figure introduction within a morph is viable for constructivist faceless figures... The very thing that makes the channel's aesthetic distinctive is also what makes it cooperate with morph technology."
17. **Cost profile (Scene C).** 4 ChatGPT stills $0 (existing subscription) and about 30 minutes; 3 Pika morphs on the free tier and about 30 minutes; about 24 seconds of footage.
18. **Open questions listed.** Vidu vs Pika on the same chain; 5-frame chains; text-on-surface morphs; audio-bed integration. Camera-move morphs are marked resolved: they fail.

**B. `project/ASSET_GENERATION_REGISTER.md`** (last updated 2026-05-21)

- **Pipeline premise.** "The generation itself (ChatGPT, Kling, Hailuo) is manual; these tools have no usable programmatic API."
- **Tool selection.** New standalone still → ChatGPT. Bridge still (anchor frame available) → ChatGPT. Existing still → clip: "Pika (preferred) / NLE Ken Burns fallback". Morph, figure or architecture driven → Kling. Morph, geometry or texture driven → Hailuo. Archival photo → Wikimedia Commons, "never AI-generate archival content." Rule: "if you can describe the transition as a camera move, use Kling. If you can only describe it as 'X material becomes Y material,' use Hailuo."
- **Two-tier reference images.** Tier 1: 4–6 of the 15 broad style references in `tools/ai-video/style-references/` (default set r7, r8, r9, r14, r15) "lock the Parallax house style." Tier 2: 4 episode-specific references in `episodes/{slug}/assets/ep-refs/` "lock the spatial grammar." Upload order: Tier 1 then Tier 2, because "ChatGPT weights more-recent context more heavily."
- **Episode style block** (pasted once per conversation): constructivist editorial illustration, flat planes, no gradients, "NOT a realist tradition", palette ink #1C1814 / amber #E5A544 / bone #F0E6D0, figures as angular colour-blocked silhouettes with no facial features, 16:9, English-only or no text, treatment standard or conflict.
- **Per-shot prompt structure.** Standalone still: 3–5 sentences. Bridge still: upload the anchor, open with "The camera has [dolly-in / pulled back / ...]", then what is new.
- **Six "Pika-friendly" design principles for stills that will be animated.** No detailed crowds ("Pika animates humanoid shapes regardless of instructions"); figures as dark silhouettes in static poses, "Never mid-stride, mid-gesture, or running"; at most 1–2 short labels placed centre-frame ("Text at edges will degrade to gibberish as the camera moves"); avoid deep one-point perspective ("It forces Pika to push-in"); "Create clear depth layers. Distinct foreground / mid-ground / background with tonal separation; this drives Pika's parallax effect"; "No flickering light sources. No candles, reflective water, sparkles, or anything that 'should' move."
- **Seven sophistication (anti-tacky) rules.** No decorative math or text; "Show the scene, not the symbol"; one idea per frame; no emanation clichés (god-rays, halos); concrete and specific over generic icons; "Restraint = sophistication"; no realist-tradition style anchors (naming a realist painter "pull[s] ChatGPT straight to photoreal").
- **Quality gate after stills.** Palette check; no fake math; no symbol-icons; concrete scene; flat register; "Bridge/morph stills: frame B edited from frame A (shared base)"; "Regenerate if any principle is violated; don't patch in NLE."
- **Kling morphs.** Low motion intensity; 6s subtle push, 8s figure emergence, 10s HERO ("Mark one morph per episode as HERO maximum"). "The prompt describes only the change... Never describe what stays static (mentioning it causes Kling to animate it)." Standard negative: flicker, morphing, warping, text drift, watermark, jitter. Gate: frame-1 vs frame-N colour within 15%; "Re-run up to 3× for figure-introduction shots."
- **Hailuo morphs.** Describe "the material transformation, not the camera"; watch for "photoreal texture intrusion."
- **Vidu Q1.** Multi-frame reference, "the fallback of last resort."
- **Failure and recovery table.** Figure-smear → re-run or add an intermediate frame; palette drift → snap grade; geometry warp → lower motion; text gibberish → regenerate without text or use NLE Ken Burns; cross-dissolve feel → "Camera holds static"; photoreal intrusion → negative prompt.
- **Archival stills.** Brand LUT via `tools/brand-treatment/treat_video.py --ramp standard`.

**C. The project's own later corrections to this doctrine**
- "The 'stills plus Ken Burns' doctrine rests on May 2026 tests of Pika 2.2/2.5 and Hailuo 01/02. No AI motion clip has been generated since May 23, and none of the models that now lead the field has ever been run on the constructivist style." — Source: `analysis/ai-video-landscape-2026-10-10.md`, "Bottom line"
- Docs listed as stale: `project/AI_VIDEO_PIPELINE.md`, `project/ASSET_GENERATION_REGISTER.md`, `tools/ai-video/GENERATION_WORKFLOW.md`, for "Sora 2 (discontinued), Hailuo I2V-01-Live (superseded by H3), Pika and Runway Gen-4 versions, 'no programmatic API', per-clip prices." — Source: same file, § 7
- "Keyframe-conditioned generative video should not be described as simply optical-flow interpolation. Our older notes conflate these categories and overgeneralize a useful observation (fine geometric details warped in our trials) into an architectural claim about all models." Also: "Keep the empirical findings in CHAINED_STILL_LESSONS.md... Treat old rankings, prices, rigid tool-family bans, and mechanistic explanations as dated." — Source: `analysis/illustration-to-video-workflows-2026-09-24.md`
- The October tests confirmed two May rules on a current model: "The drawn pose decides the motion. Mid-stride figures walk; a standing figure glides. Matches the 'verb to pose' rule" and "edit the frame, then animate." — Source: `analysis/ai-video-landscape-2026-10-10.md` §§ 10–11

### Inferences
- The prompt rules conflict across models, and each is tied to the model it was tested on: the Kling section says never describe what stays static; the Hailuo notes say name everything else static; the Oct 10 H3 Max tests found "The model obeys 'what stays still'." A report should attach each prompt rule to its model and date.
- The still-design rules were written to make stills *safe* under animation (static poses, no flickering light, nothing that "should" move). The episode's style block follows them ("Poses are still... nothing mid-stride or mid-gesture"; "Nothing flickering, no reflective water, no sparkle"). Stills meant for pose-to-pose sequences, walking figures, or cinemagraph light would have to be generated against those rules on purpose.
- Every still in this episode was specified with "clear foreground, mid-ground and background layers with tonal separation" (see § 4), which is the property the doctrine says drives parallax.
- CHAINED_STILL_LESSONS has not been updated since May 24 and does not yet contain the Oct 10 findings (pinned end frame works on H3 Max; amplitude words are ignored; moving regions lose the texture). They live only in the analysis file.

### Gaps
- `project/AI_VIDEO_PIPELINE.md` was sampled, not read in full (one table, "Effects to Avoid", cited in § 6).
- `project/MOTION_DIRECTOR_SPEC.md` was scanned by heading and keyword only.
- I did not open the prisoners-dilemma bakeoff folders (`episodes/prisoners-dilemma/bakeoff/`, `development/morph-tests/`) that hold the raw May test material.

---

## 3. What AI-video tests were run and with what results?

### Takeaway
Six image-to-video clips were generated on Oct 10, 2026, all on one model (MiniMax H3 Max through fal.ai, 1080p), for about $3 in video spend. One technique was judged good enough to use: a pinned first and last frame, with the end frame made by editing the start frame. That clip is the only AI video in the episode. The four-model comparison the project proposed was not run.

### Cited Findings

**The landscape as the project recorded it** — Source: `analysis/ai-video-landscape-2026-10-10.md` §§ 1–5
- Evidence note: "Leaderboards, Google pricing, MiniMax, ByteDance, Runway changelog and fal model pages were fetched directly. Most other model details come from search summaries of third-party pages. Nothing here was tested on Parallax art." (This applies to §§ 1–7; §§ 9–11 are the tests.)
- Repo inventory at the time: "20 AI motion clips exist, all single-still image-to-video from May, all built from stills that were later regenerated."
- Failure history that drove the conservative choices: faces drifting to realistic, any humanoid shape animated, edge text to gibberish (Pika 2.2, May 4–8); palette drift across a chain and drift in the last 1–2s of 10s clips (Pika 2.5, May 9); morph smearing and unaligned endpoints (May 21); Hailuo 02 adding photoreal texture and morph flashes (May 23); "Sept 23: Tiger rejected the motion in the SVG and raster-cutout tests. This one is taste, not a model limit."
- Model table as of Oct 10 (cost for one 6s clip): MiniMax H3 / H3 Max, max 15s, first+last frame, 9 reference images, about $0.60–1.00 on fal; Gemini Omni 1.1 Flash, 10s, about $0.60 at 720p; Vidu Q4 Preview, 16s, pricing unsettled; Kling 3.0 Pro, 15s, first+last plus Motion Brush, about $0.67; Seedance 2.5, 30s, about $1.40 at 720p and about $7 at 1080p; Wan 3.0, 30s, about $1.20; Runway Gen-4.5 + Aleph 2.0, about $0.72; Luma Ray3.2, 20s, 16+ keyframes, about $1.20 per 5s; Veo 3.1, 8s, $2.40 (Fast $0.72). Sora's API ended Sep 24, 2026.
- Arena ranking the file quotes: H3 Max 1195, H3 1181, Vidu Q4 1179, Gemini Omni Flash 1178, Seedance 2.0 1176, Wan 3.0 1164, Veo 3.1 1082. "None of these boards measures style retention."
- "Still weak: on-screen text..., hands, multi-character contact, fast crowds. Drift toward photorealism remains the default failure for illustrated inputs and grows with clip length."
- Workflow findings: documented pipelines are script → shot list → locked still references → first-frame i2v one shot at a time; "What reliably works for illustrated stills: low-motion 'living illustration' (fixed camera, one slow secondary movement, 3–5 seconds used per clip)"; morphs "cost attempts; one documented case kept 2 clips from 40"; keeper rates from 2.4 generations per kept shot to dozens; "Diagrams, maps and text: keep them in code. The hybrid consensus is text-free AI clips as plates with code-rendered graphics on top"; "No essay or philosophy channel was found documented as using AI animation well."
- Five places it said Parallax could use more: living illustrations instead of Ken Burns; pinned first/last-frame hero moments; AI plates in the house style instead of stock footage (the two Beat 6 car slots); plates under Remotion graphics; scripted generation. "Not yet: character acting, walking, hand contact, on-screen text, long single takes."
- Risk notes: YouTube disclosure is required only for photorealistic synthetic content; "MiniMax (Hailuo/H3) lost its motion to dismiss in Disney's suit on May 22, 2026, so do not depend on it alone"; practice: "documents, charts, quotes and photographs stay real; AI imagery stays plainly non-photoreal under one art direction."

**Prompting rules for this style (researched Oct 10)** — Source: same file, § 8
1. Let the still carry the look; spend the prompt on what changes.
2. Lead with the camera state; one camera move and one subject action per clip.
3. Say "one continuous shot, no cuts" (H3 plans multi-shot sequences).
4. Name only what is in the frame, with a verb that fits the pose.
5. State what must not change in one sentence, including the style; avoid realism vocabulary and avoid naming the face.
6. Keep motion small and clips short (about 5 seconds).
7. For first/last-frame shots, make the end frame by editing the start frame.
8. Read the expanded prompt the model returns.
9. Label sound by type; expect a very quiet mix.
10. Draft cheap: "768p costs half of 1080p or less."

**Every generated clip.** Common settings from the six JSON sidecars: model `minimax/h3-max/image-to-video`, resolution 1080P, `prompt_expansion_mode: balanced`, `seed: None`, `price_per_second_usd: 0.096`, wall-clock 13–24s, generated 2026-10-10 between 17:31 and 18:12 UTC. — Sources: `episodes/ai-care-motives/assets/clips-i2v/*.json`; prompts in `episodes/ai-care-motives/prompts/i2v/*.txt`; verdicts in `analysis/ai-video-landscape-2026-10-10.md` §§ 9–11

| Clip (`assets/clips-i2v/`) | Input | What it tested | Verdict in the analysis file | Sidecar cost | In episode? |
|---|---|---|---|---:|---|
| `aigen-05-h3max-take1` | `stills/aigen-05-rescued-figure.png`, 5s | Living illustration: wind in grass, blanket edge, locked camera | Held: "flat faceted style, palette, featureless planar face (no features invented), single shot with no cuts, locked camera." Did not follow: "the blanket billows widely around 1.7s (asked: 'flutters very slightly')... the hair blows although the figure was told to stay still." "The clip is one event, not ambient life, and does not loop." Editorial read: "the clip animates the wrong thing." | $0.48 | No |
| `aigen-05-walkaway` | same still, 5s | Small back-turned figure walks away | "Fail on walking. He shrinks and sinks in the same standing pose (a glide, no stride). The prompt fix worked: blanket and hair now stay still." | $0.48 | No |
| `aigen-03-headturn` | `stills/aigen-03-second-shopkeeper.png`, 5s | A face in motion (head turn) plus background walkers | "Partial. No eyes or mouth invented, but the head gains a nose ridge and brow shading (sculpted mannequin, not flat plane) and the hair loses its facets. The turn finishes in about 1.3s despite 'slow'. Street figures walk correctly behind the window bars." | $0.48 | No |
| `aigen-04-pull` | `stills/aigen-04-river-rescue.png`, 5s | Two bodies in contact, water | "Mostly works (expected to fail). Clasped hands hold with fingers intact... faces stay planar; ripples are thin graphic rings. But the motion is far larger than 'small amplitude': the rescuer stands and his head leaves the top of frame, and the clip resolves the rescue the still only suspends." | $0.48 | No |
| `aigen-03-unwatched` | start `stills/aigen-03-second-shopkeeper.png`, end `keyframes/aigen-03-end-unwatched.png`, 6s | Pinned first + last frame: walkers leave, the street ends empty | "Works. The three figures walk out with real strides, pass behind the bars, the street ends empty and the clip lands on the pinned end frame. Nothing else in the room moves... 6.6s for a 6s slot." | $0.576 | **Yes** (after trimming and conforming) |
| `aigen-04-pull-wide` | `keyframes/aigen-04-wide.png` (still scaled to 82% and outpainted), 5s | Retake of the pull with a widened start frame and "does not stand up" | "The rescuer stays kneeling and both figures stay in frame; clasped hands hold... both faces stay faceted blank planes; brightness steady (50.0 → 50.4). The 'what does not change' phrasing controlled the motion where 'small amplitude, slow' had not." | $0.48 | No (beat3-seg13 still plays the Ken Burns `clips/aigen-04.mp4`) |

- "Common to all four" harder tests: "no cuts; static regions stable (0.2–0.5 mean luma change per frame); a pop between frame 0 and frame 1 (4.5–8.3); a slow brightening of about 1–1.4 luma over the clip; 24fps." The first take showed the same pop ("trim the first frames in the edit"), a larger brightening ("mean luma 73.5 → 76.1 over 5s despite 'the light does not change'"), softer faceted texture "wherever something moves", and audio that "averages -44 dB." — Source: analysis file §§ 9–10
- Raw output format: 1916×1080, 24fps, with an AAC audio track (ffprobe on `aigen-03-unwatched.mp4`, 6.58s, and `aigen-05-h3max-take1.mp4`, 5.17s). The episode timeline is 1920×1080 at 30fps.
- **Lessons the file draws:** "The model obeys 'what stays still' and the direction of motion; it ignores amplitude and speed words." "Whatever moves is redrawn in the model's smoother style; whatever is still keeps our texture. Style drift scales with how much of the frame moves." "The drawn pose decides the motion. Mid-stride figures walk; a standing figure glides." "A pinned end frame gives the most control and is the first technique good enough to use." "Technique that carried over: edit the frame, then animate. Both successes (pinned end frame, widened start frame) came from fixing the image first and asking the video model for less."
- **How the end frame was made:** "with `fal-ai/nano-banana-2/edit` and composited back onto the original through a feathered mask so everything outside the window is pixel-identical. `fal-ai/object-removal/mask` was tried first and produced a blurred smear." — Source: analysis file § 10
- **How the used clip was wired:** "`beat5-seg27` (10.2s slot: 3s lead-in, narration, 3s hold) now plays `clips/aigen-03-unwatched.mp4`: the i2v take with its first three frames trimmed (the pop), conformed to 30fps, the last frame held to fill the slot, a 3% slow push over the whole slot, and no audio track." ffprobe on `remotion-templates/public/episodes/ai-care-motives/clips/aigen-03-unwatched.mp4` confirms 1920×1080, 30fps, 10.3s, 309 frames, no audio stream. The manifest note on the segment reads "AI image-to-video (MiniMax H3 Max, pinned first+last frame): the street empties, then holds." — Sources: analysis file § 11; assembly-manifest.json
- The script row for that segment: "the second-shopkeeper still (aigen-03) animated image-to-video with pinned start and end frames: the people outside the window walk out of view and the street is left empty; hold on the empty street · motif form 2", with `DIR: hold(pre:3s, 3s)`. — Source: `episodes/ai-care-motives/script.md` lines 92–93

**Costs**
- "Cost about $0.48; 15 seconds wall-clock" for the first take; "Video spend $2.02 for these four ($2.50 including the first take), plus about $0.14 of image edits"; the pull retake "Cost about $0.60 (edit + clip)." — Source: analysis file §§ 9–11
- *Computed* from the sidecars: 5 × $0.48 + $0.576 = $2.976 of video across six clips, an average of $0.496 per clip.
- The price in force was a promotion: "H3 Max is 40% off until Oct 15 2026 (then 0.05 / 0.08 / 0.16)" per second at 480P / 768P / 1080P. The promotional rates in the table are $0.03, $0.048 and $0.096. — Source: `tools/ai-video/fal_i2v.py` lines 41–51

**Earlier tests the October file builds on**
- Sept 23, 2026: a 44.7s Remotion test using a generated background plate plus a transparent generated sapling cut-out, positioned and lifted by code. "The user subsequently rejected this test's motion/transition as well... This remains an experiment record, not an approved production approach." — Source: `analysis/illustrated-cutout-motion-2026-09-23.md`
- Sept 23, 2026: a hybrid (generated still, then code scene) versus code-only comparison, rendered. Finding: "generated art can establish a situation, but it cannot silently become a precise data visualization." — Source: `analysis/image-remotion-synergy-2026-09-23.md`
- Sept 24, 2026: a documentation review with no generation ("No video generation, service purchase, package installation, or runtime change was performed"). It proposed a four-panel storyboard with separate panel clips assembled in a code-controlled grid. — Source: `analysis/illustration-to-video-workflows-2026-09-24.md`

### Inferences
- The creator's "about $0.50 per clip" matches the sidecars at the promotional rate. If the comment in `fal_i2v.py` is right, the same 5-second 1080P clip costs about $0.80 from Oct 15, 2026, and a 6-second pinned clip about $0.96; 768P would be about $0.40 for 5 seconds.
- Every clip is one take with no seed. Nothing is known about take-to-take variance on this style; the "Works" verdict for the pinned clip rests on a single generation.
- The used clip needed four fixes before it could go in the timeline (trim three frames, conform 24→30fps, hold the last frame, strip audio). Those steps are described in prose only; I found no script that performs them.
- The test that most resembles a cinemagraph (take 1: grass and blanket edge) produced a single gust that does not loop, a frame-0 pop and a slow brightening. Seamless ambient loops are therefore untested, not shown to work.
- The finding "whatever moves is redrawn in the model's smoother style; whatever is still keeps our texture" and the feathered-mask composite used for the end keyframe together suggest that compositing only the moving region of a clip back over the original still would preserve texture. That has not been tried on a clip.

### Gaps
- The proposed bounded test (§ 6 of the analysis file: three shots on four models, MiniMax H3, Kling 3.0 Pro, Gemini Omni 1.1 Flash, Vidu Q4 Preview, two attempts each, about 24 clips for $15–30) was not run as specified. Only H3 Max was used. No Kling, Gemini or Vidu output exists in `clips-i2v/`.
- The third proposed shot, the desk at night as a plate ("screen glow, slow light", `aigen-10`), has no clip. The most reused still in the episode has never been animated.
- "Not yet judged: whether the motion is wanted on screen (Tiger's call)" is recorded for take 1. I found no written verdict from the creator on any clip other than the wiring of `aigen-03-unwatched` into the episode.
- No reference-image, multi-keyframe, video-to-video or motion-brush feature has been tested. No 768P draft has been generated.
- `episodes/ai-care-motives/prompts/video-prompts.md` is an unfilled stub ("Fill in during Stage 7 after stills are generated"). `prompts/morph-prompts.md` records "This episode has no morph pairs" and one optional Hailuo `I2V-01-Live` live-still prompt for aigen-04 that was superseded by the H3 tests.
- I did not view any clip; all verdicts above are the analysis file's, not mine.

---

## 4. What tooling exists?

### Takeaway
Stills are made by hand in ChatGPT from a prompt document; upscaling, Ken Burns rendering and single-clip image-to-video are scripted. There is no script for image edits (the two keyframes), for conforming an i2v clip to the timeline, or for the four Ken Burns reuse variants.

### Cited Findings

**`tools/ai-video/`** — Source: file headers in that folder
- `fal_i2v.py` (Oct 10): "Generate ONE image-to-video clip through fal.ai's queue API." One still, optional `--end-image`, one prompt file in; one mp4 plus a JSON sidecar out, recording the prompt, the model's expanded prompt, timings and estimated cost. Standard library only; the still is sent as a data URI. Arguments: `--model` (default `minimax/h3-max/image-to-video`), `--duration` (default 5), `--resolution` (default 1080P), `--expansion` (disabled | balanced | quality), `--seed`, `--tag`. Output: `episodes/<slug>/assets/clips-i2v/<still-id>-<tag>.mp4`. It refuses to overwrite an existing tag. Price table covers H3 Max and H3 only. Key read from `FAL_KEY` in the environment or repo-root `.env`.
- `render_kenburns.py` (May 23): reads every asset in `shot-list.json` whose `motion_technique` is `ken-burns`, finds its still (preferring `stills-4k/`), and renders an ffmpeg `zoompan` clip, 1920×1080 at 30fps, after prescaling to 5016px wide "so the motion is sub-pixel smooth." Usage: `python3 tools/ai-video/render_kenburns.py <episode-slug> [--only id1,id2] [--fps 30]`. Output: `assets/clips-kenburns/<id>.mp4`.
- `upscale.py` (May 23): Real-ESRGAN 4× via spandrel on Apple MPS; models `x4plus` (default, "preserves paper grain") and `anime`. "ONLY useful for locally-rendered families (ken-burns, parallax-2.5d)."
- `gen_depth.py` (May 23): monocular depth map via Depth Anything V2, "suitable as the `depthSrc` for the DepthParallax Remotion template." Its own note: depth estimation "is unreliable on flat/illustrated art... see project/CHAINED_STILL_LESSONS.md family-E blacklist."
- `gen_motion_prompts.py` (May 24): deterministic templating from `shot-list.json` into `motion-plan.md`, `live-still-prompts.md`, `cinemagraph-prompts.md`, `morph-prompts.md`, `parallax-2.5d-brief.md`. Owner map: ken-burns → local; live-still → "you — Pika single-image"; cinemagraph → "you — Pika masked."
- `motion_director.py` (May 23): proposes a `motion_technique` per shot from a perception file; never emits auto-depth or AI 3D camera; budget `PARALLAX_CAP = 2`; monotony rule (no technique three times in a row). `perceive.md` is the perception schema.
- `critic_loop.py` (May 18): a generate → critique → re-prompt loop with non-LLM critics (palette, register, prompt-spec match); `test_critic_loop.py` covers it. AGENTS.md calls its CLI "for smoke testing."
- `generate_style_refs.py`: generates the 15 style references with Flux 2 Pro on fal.ai.
- `GENERATION_WORKFLOW.md` and `PROMPT_SYSTEM.md` (May): the older operational guides. The first now opens with a Sept 24 notice that "the provider selections, prices, and consistency claims below are historical."
- `style-references/`: 15 PNGs (`r1_constructivist_face` to `r15_neutral_default`) plus `INDEX.md`, `PROMPTS.md`, `AESTHETIC_EXPERIMENTS.md`, `VERSATILITY_TESTS.md`.

**`tools/recraft/`** — Sources: `tools/recraft/README.md`, `ANCHOR_LIBRARY.md`
- `recraft.py` generates vector or raster illustrations through the Recraft V3 API (needs `RECRAFT_API_KEY`). `anchor-library.json` plus `generate-anchor-library.sh` define seven anchor images (A1 Imperial transition to A7 Civic crowd) organised by content function. Not used in this episode by the Oct 7 decision.

**How this episode's Ken Burns clips were produced**
- "Stills upscaled 4x (Real-ESRGAN, stills-4k) and 16 Ken Burns clips rendered (1920x1080, 30fps; 12 main + 4 reuse variants; local, git-ignored)." — Source: `episodes/ai-care-motives/_status.md`
- "Ken Burns clip durations (Oct 8) are the script row budgets plus about 2s handle; extra uses of reused stills are listed under ken_burns_variants and rendered with the same ffmpeg zoompan recipe. Focus_y lowered on clips where a head sits near the top of frame... so pushes don't crop hair." — Source: `episodes/ai-care-motives/shot-list.json`, `summary.note`
- `render_kenburns.py` iterates `data["assets"]` only; it does not read `ken_burns_variants`. — Source: `tools/ai-video/render_kenburns.py` lines 91–114
- ffprobe: `clips-kenburns/aigen-06.mp4` is 1920×1080, 30fps, 21.0s; `aigen-10-b7open.mp4` is 5.0s.
- `.gitignore` excludes `episodes/*/assets/stills-4k/`, `clips-kenburns/` and `clips-i2v/`; "Base stills in assets/stills/ ARE tracked." — Source: `.gitignore` lines 69–76

**Stills folders in `episodes/ai-care-motives/assets/`** (directory listing, file sizes and `sips`)
- `stills/`: 12 PNGs, `aigen-01-dinner-table` to `aigen-12-desk-dawn`, 1672×941 (checked on aigen-03; the shot list states 1672×941 for all).
- `stills-4k/`: the same 12 upscaled 4× to 6688×3764 (checked on aigen-03), 23–39 MB each.
- `stills-archive/`: 5 superseded versions (`aigen-01-dinner-table-v1/-v2/-v3`, `aigen-06-rating-cards-v1`, `aigen-08-two-outlines-v1`).
- `keyframes/`: 2 edited frames made for i2v, both 1672×941: `aigen-03-end-unwatched.png` (the empty-street end frame) and `aigen-04-wide.png` (the widened river start frame).
- `ep-refs/`: 4 Tier 2 references (`ep-ref-1-dinner`, `-2-shop-counter`, `-3-riverbank`, `-4-desk-night`); three are byte-size-identical to the approved stills for shots 2, 4 and 10.
- `clips-kenburns/`: 16 mp4s. `clips-i2v/`: 6 mp4s and 6 JSON sidecars. `sourced/`: 9 real-world files (6 Wikimedia images, the EPA PDF, 2 Pexels clips).
- Render-ready copies live in `remotion-templates/public/episodes/ai-care-motives/clips/` (19 mp4s: 16 Ken Burns, the conformed i2v clip, 2 stock) and `.../stills/` (the 12 base stills, 6 archival images, the EPA page crop).

**How stills are specified**
- `shot-list.json` (v1.1, generated 2026-10-08): seven threads (A_trust: 01; B_shop: 02, 03; C_rescue: 04, 05; D_street: 06; E_ring: 07, 08; F_machine: 09, 10; G_close: 11, 12). Each asset carries `description`, `chatgpt_prompt_id`, `anchor_frame` (03←02, 05←04, 08←07, 12←10), an optional `camera_move`, `register` (grounding or atmospheric), `realism: "flat"`, `text_treatment: "none"`, `treatment` (ramp standard or conflict), `duration_sec`, `motion_technique: "ken-burns"` and a `ken_burns` block. aigen-04 also has `motion_optional` (live-still, Hailuo I2V-01-Live). Summary: 12 shots, all existing; "Shots 1, 6 and 8 were regenerated and promoted Oct 8." — Source: `episodes/ai-care-motives/shot-list.json`
- `prompts/chatgpt-prompts.md`: a two-step session plan (a pre-session generating shots 1, 2, 4, 10, which become the four ep-refs; then a main session for the other eight with Tier 1 then Tier 2 uploaded). Tier 1 set: r7, r8, r9, r14, r15. — Source: `episodes/ai-care-motives/prompts/chatgpt-prompts.md` lines 10–38
- The episode's style block (pasted once) adds to the register's template: "Most are shown one at a time with a slow camera push, so each must read clearly as a single still"; "Faces are smooth featureless planes (no eyes, no mouth, no skin rendering): the figures are anonymous on purpose"; "Poses are still: standing, seated, arms at sides or resting on a surface; nothing mid-stride or mid-gesture"; "Text: none"; "Light sources are static ambient planes... Nothing flickering, no reflective water, no sparkle"; "Depth: clear foreground, mid-ground and background layers with tonal separation." — Source: same file, lines 43–65
- Per-shot blocks give a narration cue, an anchor and camera move for bridge stills, and a 2-paragraph prompt ending in the register lock. Bridge shots open "[Upload: aigen-XX... as the anchor frame.] The camera has ..." Revised prompts for shots 1, 6 and 8 are appended. — Source: same file
- The `asset-brief` skill writes these prompt documents from the shot list; the `ground-motion` skill checks motion prompts against the finished stills. — Sources: `project/ASSET_GENERATION_REGISTER.md`; `project/CHAINED_STILL_LESSONS.md`

**Preview and QA tooling relevant to trying new picture techniques** — Source: `AGENTS.md` lines 87–94; `project/VISUAL_QA.md`
- `node remotion-templates/scripts/preview-range.mjs --episode=<slug> (--from --to | --segment=<id>) [--scale=0.5]` renders a picture-only mp4 of a stretch of the episode.
- `npm run qa:episode -- --episode=<slug> [--no-render] [--tag=<name>]` produces the report used in § 1.
- A manifest marked `"handWired": true` is the source of truth; `tools/assembly/retime_manifest.py` re-times it to narration without changing the wiring. — Source: `CLAUDE.md`, "Shipped Oct 10, 2026"

### Inferences
- The four Ken Burns reuse variants were rendered by hand with the same recipe, since the script cannot see them. Any new still-based technique that needs more crops or moves per still will meet the same gap.
- A pan across a still cannot be produced by `render_kenburns.py` as written: it holds one focus point and changes only zoom.
- The 4K upscales (6688px wide) give about 3.5× headroom over a 1920 frame, so deterministic crops and pushes much tighter than the current 1.08–1.15 are available without softness, by the doctrine's own formula.
- The image-edit step that produced both successful i2v results (fal `nano-banana-2/edit`) has no tool, no saved prompt and no sidecar in the repo; the edits cannot be reproduced from files on disk.

### Gaps
- I did not find the prompts or parameters used for the two keyframe edits, nor the ffmpeg command that conformed the i2v clip.
- I did not check whether `tools/cost_forecast.py` or `tools/cost_tracker.py` know about fal i2v pricing.
- `.env` contains a `FAL_KEY=` line (presence checked only). The analysis file's statement that no key was configured predates the tests.
- I did not open `tools/ai-video/PROMPT_SYSTEM.md` or `style-references/PROMPTS.md`.

---

## 5. What can the Remotion side already do with pictures?

### Takeaway
Remotion already has a two-pane picture layout with timed reveals, a timed image sequence, callout and zoom templates for a still, type held over a picture, and plain clip playback. This episode uses four of those. Nothing exists for more than two panes, for video inside a pane, for layered parallax, for masked or looping motion, or for cut-out figures, and three of the picture templates force a duotone that the episode has turned off elsewhere.

### Cited Findings

Component by component. "Registered" means present in `remotion-templates/src/templates/Episodes/templateRegistry.ts`, so a manifest can dispatch it.

| Capability | What it does | Used in this episode? | Source |
|---|---|---|---|
| **SplitFrame** | Two panes, left and right, each holding any template from a `PANE_COMPONENTS` list of about 62 (includes ImageComposite, PhotoMontage, AnnotatedImage, ArchivalReel; no recursion). `ratio` 0.2–0.8, gold divider with optional label, `syncStrategy` simultaneous or sequential. New Oct 10: `paneFit: "cover"` fills each half at full height with a `focusX` crop and a caption strip underneath; per-pane `revealAtSec` (the picture "sits under a veil until that moment", badge at reveal, caption 0.8s later); per-pane `captionSwap {text, atSec}` so "the picture should hold and only the words change." Registered. | **Yes**, once: beat2-seg08 `shop-motif-reasons`, 25s. Both panes are ImageComposite (background variant, `duotone: "none"`) of the same still aigen-02; labels DUTY / PRUDENCE; reveals at 4.6s and 10.4s; captions swap at 21.2s and 22.0s. | `src/templates/SplitFrame/schema.ts`; `SplitFrame.tsx` lines 161–224; `data/episodes/ai-care-motives/shop-motif-reasons.json`; `episodes/ai-care-motives/visual-spec.md` §§ 11, 13, 15 |
| **ComparisonPair** | Two panes at 50/50 from a curated list of 10 templates (DataChart, TimeSeriesChart, StatReveal, KPICard, BumpChart, BulletChart, ProbabilityGauge, AnnotatedImage, FrameworkDiagram, KineticTypography quote). Label above and caption below each pane; divider rule / gap / stitch / none; `revealOrder` sync, left-first or right-first with a stagger. Registered. | No | `src/templates/ComparisonPair/schema.ts` |
| **PhotoMontage** | "Rapid-fire image sequence with text overlays." `images[]` each with `durationSec`, a required `treatment` (standard / conflict / editorial; no "none"), `compositeMode` background or inset, optional per-image Ken Burns (direction cycles zoom-in, zoom-out, pan-left, pan-right by index) and text overlays. Between-image `transition`: cut, dissolve or wipe-left. Registered. | No | `src/templates/PhotoMontage/schema.ts`; `PhotoMontage.tsx` lines 1–13, 286–350 |
| **ImageComposite** | A photograph or still with optional duotone. Variants: `background` (full-bleed with Ken Burns drift), `inset` (bordered frame on a card), `portrait` (person with name strip). `duotone` accepts "none"; `imageFit` cover or contain. Portrait takes `quotes[] {text, atSec, cps}` typed beside the portrait at speech pace. Registered. | **Yes**: six cards (`portrait-kant` 29s with two typed fragments, `portrait-mill` 23s, `portrait-plato` 5s, `photo-vw-wolfsburg`, `photo-vw-golf`, `photo-pems`), and as the pane template inside SplitFrame. | `src/templates/ImageComposite/schema.ts`; `data/episodes/ai-care-motives/portrait-kant.json`, `photo-vw-golf.json` |
| **AnnotatedImage** | A brand-treated image with callouts at x/y percentages: dot, then leader line, then label and optional detail; per-element anticipatory reveal. `duotoneRamp` defaults to "standard" (no "none"). Registered. | No | `src/templates/AnnotatedImage/schema.ts`; `AnnotatedImage.tsx` line 193 |
| **ScrollyReveal** | Step-based annotation over an image: each step has `revealAtSec`, annotations (callout, highlight or trace ring) and an optional pan/zoom `focus` (scale 1–2.5); `annotationMode` accumulate or replace. Uses the shared `AnnotationSVGLayer`. Base image duotone defaults to "standard". Registered. | No | `src/templates/ScrollyReveal/schema.ts`; `ScrollyReveal.tsx` line 311 |
| **AnnotatedZoom** | Pure directional zoom on a still: up to 8 `regions` with centre, scale 1–5, `revealAtSec`, optional label, sublabel and crosshair; optional return to full frame. Duotone defaults to "standard". Registered. | No | `src/templates/AnnotatedZoom/schema.ts`; `AnnotatedZoom.tsx` line 580 |
| **MorphTransition** | Interpolates between two *data states* of DataChart, TimeSeriesChart or StatReveal. It does not morph images. Registered. | No | `src/templates/MorphTransition/schema.ts` lines 1–25 |
| **ArchivalReel** | Film-stock emulation (8mm, 16mm, VHS: grain, cast, gate weave, scratches, scanlines) applied to a still image, with a caption strip. Takes an image, not a video. Registered. | No | `src/templates/ArchivalReel/schema.ts` |
| **PrimarySourceReveal** | A document card with timed annotations (underline, circle, highlight, strike, margin note, translation). New image mode: a photograph of the passage "multiplied onto the card" with highlight boxes in percent of the image, each with `appearAtSec`. Registered. | **Yes**: beat6-seg30 `epa-nov-reveal`, a 300dpi crop of page 3 of the EPA notice with two highlight boxes from 3.2s. | `src/templates/PrimarySourceReveal/schema.ts` lines 100–115; `data/episodes/ai-care-motives/epa-nov-reveal.json`; visual-spec.md § 14 |
| **LayeredComposition** (component) | Composites a background and a foreground with blend mode, foreground position preset (full, lower-third, upper-third, center-inset, bottom-bar), `backgroundDim`, optional vignette. Used by FullEpisode for layered segments. No mask input. | Yes, through hold-under | `src/components/LayeredComposition.tsx` lines 1–75 |
| **Hold-under** (type over picture) | "A foreground card whose `layered.backgroundSegmentId` names the picture segment that ends where the card starts is drawn over that picture: the picture is held on its last frame for the whole card, dimmed (`layered.backgroundDim`, default 0.55), and the card renders with a transparent ground, light type and no brand chrome... Supported by `KineticTypography`; other templates still draw their own ground." Script directive `DIR: over(previous)` with optional `dim:`. Implemented as rule 6 in `resolveSeams`, which gives the picture a tail as long as the card. | **Yes**, twice: beat5-seg26 (Glaucon quotation over the ring-wearers still) and beat5-seg28 (definition over the held last frame of the i2v clip), both dim 0.6. | `project/TRANSITION_GRAMMAR.md` § "On the episode timeline"; `src/utils/resolveSeams.ts` lines 27–29, 153–161, 180–185; `project/DIRECTING_LANGUAGE.md` lines 380–390, 686 |
| **Seam engine** (`resolveSeams`) | Decides what each seam draws: cut; `fade` as a dip through ink; `color-wash` as a dip through its colour; dips made symmetric; `dissolve` as a real cross-dissolve by holding the outgoing segment frozen for a tail (default 0.5s); `iris`, `match-cut` and `match-cut-still` all resolve to a cut. | Yes (all seams) | `src/utils/resolveSeams.ts` lines 15–35, 80–88 |
| **BrandImage / duotone** | The 4-step image treatment: desaturate, duotone remap by SVG filter, grain and vignette, composite at an opacity. Ramps standard, conflict, editorial. In "video-child mode" (`src=""`) the filtered image is skipped and the video renders as a child with grain and vignette overlays only. | Yes, as the wrapper of every FOOTAGE segment; the duotone does not apply to video | `src/components/BrandImage.tsx` lines 1–24, 199–203 |
| **FOOTAGE segments in FullEpisode** | `BackgroundSegment` renders `<OffthreadVideo src=... style={{width, height, objectFit: "cover"}}>` inside BrandImage. No `startFrom`, trim, `playbackRate` or loop is passed (grep found none in the file), so a clip plays from its first frame at native speed. An unresolved asset renders a labelled placeholder. A `HoldTail` freezes the last frame for dissolve tails so "a video clip is never asked for frames past its end." | **Yes**: 25 FOOTAGE segments with clips (22 Ken Burns, 1 i2v, 2 stock) and 2 placeholders. | `src/templates/Episodes/FullEpisode.tsx` lines 524–619, 955–973 |
| **AiGenClip** (component) | Plays an AI clip through OffthreadVideo with a `playbackRate` to stretch fixed-length clips (0.75× "imperceptible on low-motion shots"; below 0.5× artifacts show). Imported only by `PrisonersDilemmaShowcase.tsx`. | No | `src/components/AiGenClip.tsx`; `remotion-templates/LESSONS.md` L92 |
| **KenBurns** (component) | In-Remotion pan and zoom wrapper: zoom-in, zoom-out, pan-left, pan-right, pan-up, drift; intensity 1–10; linear. Imported by PhotoMontage and AnnotatedImage. | No (the episode bakes its moves into mp4s with ffmpeg) | `src/components/KenBurns.tsx` lines 1–35 |
| **AIStillComposite** (prototype) | "An AI-generated still provides the painterly TEXTURE; Remotion adds a precise, eased, code-driven VECTOR ANNOTATION on top": a ring and a leader line drawing out to a stat label over a prisoners-dilemma still, coordinates hard-coded. Status "rendered" in the capability map. Not registered. | No | `src/templates/_proto/AIStillComposite.tsx` lines 1–35; `remotion-templates/REMOTION_CAPABILITY_MAP.md` |
| **Cut-out experiment** | `ForestArgumentStudy` with artwork modes illustrated / code / cutout, and `IllustratedGrove`, which places a transparent generated sapling PNG over a generated ground plate and moves it by code. Studio composition `forest-argument-cutout`. Rejected by the creator on Sept 23. Not registered. | No | `src/experiments/ForestArgumentStudy.tsx`; `src/experiments/IllustratedGrove.tsx`; `analysis/illustrated-cutout-motion-2026-09-23.md` |

Other relevant facts:
- Only three source files use video playback at all: `components/AiGenClip.tsx`, `templates/Episodes/FullEpisode.tsx`, `templates/Episodes/PrisonersDilemmaShowcase.tsx` (grep for `OffthreadVideo`). No template takes a video as pane or card content.
- `match-cut-still` was designed for "layer-swap match-cuts where the two segments share an exact composition" (a 0.35s opacity-only crossfade), and `match-cut` for scale shifts; on the episode timeline both currently render as a cut because "their paired zoom has not been rebuilt on the overlap yet." — Source: `project/TRANSITION_GRAMMAR.md` §§ 04 and "On the episode timeline"
- The capability map ranks "AI stills as compositing layers: `OffthreadVideo`/canvas duotone + vector overlay; palette-match AI-GEN footage at render time" fifth in its build queue. — Source: `remotion-templates/REMOTION_CAPABILITY_MAP.md`
- The motion-layer roadmap (May 23, "Status: planning") lists P2 "AI-still + Remotion compositing layer: a component that takes an AI still + a stack of vector-motion layers (annotation, grid, draw-on, parallax)" and P4 "2.5D parallax in Remotion: slice an AI still into depth planes, animate the camera in code... Retires the AE dependency." — Source: `project/REMOTION_MOTION_LAYER_ROADMAP.md`
- LESSONS L115 and L116 describe debugging a `DepthParallax` template built on `@remotion/three` (May 23), and `gen_depth.py` names it as the consumer of its depth maps. No `DepthParallax` folder exists under `src/templates/`, it is not in the registry, and `git log` shows no history for that path. — Sources: `remotion-templates/LESSONS.md` lines 1014–1034; directory listing; `git log`
- `FrameworkDiagram`'s schema has an optional `icon` string on its items; `NetworkDiagram`'s schema has no image field that I could find by keyword. — Source: `src/templates/FrameworkDiagram/schema.ts` line 13; grep of `src/templates/NetworkDiagram/schema.ts`
- The street diagram in this episode is `network-street.json`: NetworkDiagram, hub-spoke, title "A fact about his street", four nodes (the shopkeeper, other customers, neighbors, a competitor), three solid edges, 20s at beat4-seg19; it follows a 3s return to the shop-counter still. — Source: `data/episodes/ai-care-motives/network-street.json`; assembly-manifest.json

**Capabilities that do not exist yet** (checked by listing `src/templates/` and `src/components/` and by keyword search for multiplane, parallax-2.5d, filmstrip, contact sheet, cinemagraph, cut-out, triptych, quad split, panorama, boil, DepthParallax, depthSrc):
- **A grid of several video clips in one frame.** No pane template plays video; SplitFrame and ComparisonPair are fixed at two panes.
- **A layout of more than two picture panes** (2×2, triptych, filmstrip, contact sheet). `SmallMultiples` is a grid, but of line charts only. `scripts/build-contact-sheet.mjs` is a QA script, not a template.
- **A multiplane or parallax layer component.** None in `src/`; planned as roadmap P4; the `DepthParallax` template referenced in LESSONS is absent.
- **A still-sequence component that fits this episode's look and timing.** PhotoMontage is the closest and is unused: it forces a duotone ramp on every image (the episode runs its stills in natural colour) and times images by duration only, with no cue-word or `atSec` field.
- **Cut-out figure animation as a template.** Only the rejected Sept 23 experiment.
- **Masked motion or a cinemagraph component.** Nothing composites a moving region of a clip over a still; LayeredComposition has blend modes but no mask; the FOOTAGE path has no loop.
- **A "boil" or frame-cycling component.** None.
- **A wide-image scroll component.** The pan options that exist are small drifts (KenBurns intensity 1–10 as percent or pixels) and focus transforms inside a 16:9 base image (ScrollyReveal, AnnotatedZoom).
- **A natural-colour annotated still.** AnnotatedImage, ScrollyReveal and AnnotatedZoom all default the base image to the "standard" duotone and their schemas offer no "none"; only ImageComposite does.
- **A working match-cut transition on the episode timeline.** The tokens parse but draw a cut.
- **Hold-under for anything except KineticTypography.**

### Inferences
- The fastest existing route to "more than one Ken Burns move per still" uses pieces already in the episode: consecutive FOOTAGE segments cut together (as beat5-seg25 → seg25b already does), SplitFrame with `revealAtSec` and `captionSwap`, and hold-under. Each new crop or move, however, means another hand-rendered mp4, because moves are baked by ffmpeg, not driven in Remotion.
- A 2×2 "panel build" is two SplitFrames' worth of logic that SplitFrame cannot express: it has no rows, and it excludes itself from its own pane list ("no recursive splits"). It would be a new template or an extension.
- Moving Ken Burns from baked mp4s to an in-Remotion image component (KenBurns exists, the 4K stills exist) would let one still take several eased moves, crops and overlays inside one segment and would remove the "same clip replays from frame 0" effect. This is my inference from the parts on disk; no document proposes it in these words.
- Annotated-illustration work can start from AnnotatedImage or ScrollyReveal, but both would tint the still unless a "none" ramp is added, which would break the episode's "one image look: natural colour" decision.

### Gaps
- I read schemas and file headers, not full implementations, for most templates; behaviour beyond what the schema comments state is unverified.
- I did not render or view any composition.
- What `FrameworkDiagram`'s `icon` field accepts (glyph name or image path) is unchecked.
- Whether SplitFrame's `PANE_COMPONENTS` list is complete relative to the registry was not checked beyond noting that ScrollyReveal and AnnotatedZoom are absent from it.
- `project/visual-identity/`, `remotion-templates/IMAGES.md` and `BRAND.md` were not read.

---

## 6. What constraints from doctrine bear on new techniques?

### Takeaway
The doctrine favours cuts, type over held pictures and code-drawn overlays, and it gives explicit rules on dissolves, reuse, text size and layer motion that any new picture technique has to pass. Wipes, iris, whip and zoom presets are out. Two documents warn against independent layer motion and "heavy parallax", while a third allows hand-layered 2.5D for one or two hero shots; that conflict is unresolved on paper.

### Cited Findings

**Transitions** — Source: `project/TRANSITION_GRAMMAR.md`
- Canonical: cut, dissolve, fade (dip through ink), match-cut and match-cut-still, color-wash, plus two adjacent treatments (J/L-cut audio bridge; chapter card). "Deprecated (off-register; do not reach for): `iris`, `wipe-left`, `wipe-right`, `wipe-up`, `whip-pan`, `blur-through`, `spatial-zoom`."
- Iris: "retired Oct 10, 2026 — reads as a silent-film or cartoon device; renders as a cut." "From a quote card into an illustration it read as a cartoon gag."
- Wipes: "universally off-register... zero hits across NYT, FT, Bloomberg, The Economist, Reuters. Wipes are PowerPoint / sports / YouTube-explainer register."
- Seam-by-seam defaults (table "By seam type", Oct 10, "start here"):
  - Any seam, by default: "Hard cut on a phrase boundary, narration leading, incoming picture already moving. No whoosh."
  - Text card → illustration: related, "let the card dissolve away over the picture as it starts (about 1s...)"; unrelated, cut.
  - Illustration → text card: "Stay on the illustration: hold it, dim it, bring the words on. Cut to a clean card only when the exact wording is the argument."
  - Illustration → illustration, same scene: "Straight cut, on action or a matched composition. A dissolve would claim time has passed."
  - Illustration → illustration, new scene or time: "Cut with a sound bridge, or a short dissolve (0.3–0.5s)."
  - Card → card, diagram → diagram: "Do not transition the frame; change what is on it."
  - Diagram ↔ illustration or card: cut.
  - Chapter break: dip through ink, with a music change or a beat of silence.
  - Never: "Iris, wipes, zoom or whip presets; more than three transition types in one episode."
- Stated reason: "the cut is the measured default of film editing (about 99% of transitions since the 1970s), a seam is hidden by sound and by motion in the incoming shot rather than by an effect, and each non-cut transition makes a claim (dissolve = time or place changed; fade = new chapter)."
- Dissolve limits: "A dissolve between two pictures holds the outgoing one still for its length, so keep it short (0.3–0.5s) unless the stillness is wanted; 1s reads as a deliberate, reflective move." "Dissolve creep": more than 2 dissolves in a row is forbidden; lint `M-TRANSITION-DISSOLVE-CREEP` warns at the third consecutive dissolve.
- Fade: no more than about 2–3 per episode. Color-wash: no more than 2–3 per episode, always with a deliberate `washColor`.
- Match cut: "Currently zero production uses... This is the highest-leverage under-served transition in the channel." Authoring requirement: "the two segments must share a visual subject. If they don't, the match-cut reads as forced cleverness"; `match-cut-still` "is especially intolerant of composition drift; even a small reframe between the two segments will read as a jump cut."
- Seam ownership: "Inside an episode templates do not fade themselves in or out... A hard cut is a hard cut." Every hard cut gets a default `narrationLeadIn: 0.7`.
- PhotoMontage's internal `wipe-left` "is retained here for back-compat with shipped data; new montages should pick `cut` or `dissolve`." — Source: `remotion-templates/src/templates/PhotoMontage/schema.ts`

**Hold-beat motion** — Source: `project/HOLD_MOTION_REGISTER.md`; rule form in `remotion-templates/POLISH.md` D20 and A6
- Eight techniques, each with an implicit claim: Stillness (`none`), Editorial drift (`editorial`, scale ≤1.02, the default), Breathing (sinusoidal scale ±0.8%), Settle, Sway (zero-net pan ±9px X, ±4px Y), Documentary Ken Burns (`documentary`: scale 1.06, pan 18/8px, rotation 0.3°), Atmospheric particles (substrate layer), Mood pulse (component chrome).
- Register C, documentary hold: ImageComposite, PhotoMontage and AnnotatedImage default to Documentary Ken Burns, whose claim is "this image is a master shot; meaning accrues through duration."
- Anti-patterns: "Uniform continuous-zoom on every template... produces the YouTube-explainer signature — every shot zooming, every cut a slow push-in." "Particle layers on light/paper substrate" (reads as "dust on the lens or sparkle stickers"; zero instances found at FT, Economist, Reuters, NYT Upshot). "Independent layer drifts (parallax mismatch): if foreground text drifts left while background photo drifts right, viewers register parallax mismatch... **Rule:** drift at the composition level, never independent layers... Per-element drift is forbidden." "Stillness as default" is equally wrong.
- Forbidden combinations: Documentary Ken Burns + Sway; Breathing + Mood pulse on one element; "Multiple atmospheric layers — atmospheric particles + light leaks + dust + grain = visual mud."
- D20's motive: an audit found `ImageComposite-archive` rendering "0 pixels different between frame 90 and frame 150... Total stillness for two seconds on a historical photograph or atlas plate reads as a PowerPoint slide, not as documentary video."
- Visual-spec for this episode: "Light cards: no colour clouds, no dust particles." — Source: `episodes/ai-care-motives/visual-spec.md` § 10

**Visual language and pacing** — Source: `project/VISUAL_LANGUAGE.md`
- Three registers: Analytical (Remotion; "No grain, no vignette. Clean surfaces"), Atmospheric (constructivist backdrop; "Feeling"), Grounding (constructivist figurative; "Presence. 'There are humans in this system.'"). "*grainy = the world*..., *clean = the analysis*."
- Realism dosage: "`flat`... **Required for animated AI-GEN clips** because animation stability needs maximum flatness." All 12 stills here are `realism: "flat"`.
- Mode 4 (AI-generated video): "AI-GEN clips typically run 5-10 seconds... Longer than 12 seconds risks consistency drift... Never more than 2 consecutive AI-GEN clips without a mode switch. Target 10-20% of episode runtime." "As evidence for claims. AI footage illustrates; it doesn't prove."
- Fatigue rules: no more than 3 consecutive full-screen MGs without a footage break; "No more than 30 seconds of footage-only without a visual change. Footage is restful, but too much becomes TV B-roll wallpaper"; no more than 2 consecutive AI-GEN single-shot clips without a mode switch, with the exception that a multi-frame `[SCENE:]` block "reads to the viewer as a single atmospheric unit."
- Sustained atmospheric stretches (May 9): up to about 60 seconds is defensible only if narration carries analytical content, "Something visually changes every 15–20 seconds inside the stretch... Total stillness for 60 seconds is hypnotic in archive footage but feels stalled in illustrated content", and the stretch ends on analytical re-engagement, not a fade. Budget: 1–3 such stretches of 30–60s per episode. The guideline is marked "synthesized, not yet validated on Parallax retention data."
- `[SCENE:]` caps: up to 5 per episode; max 2 long blocks (20–50s, 4–5 frames), max 1 per beat; max 3 short blocks (10–22s, 2–3 frames). — Source: `project/SCRIPT_FORMAT.md` lines 227–232
- Timing modes: synchronized (about 70% of an episode), visual-first (visual arrives 3–5s before the narration explains it), visual counterpoint (2–3 per episode at most).
- Visual motifs: "One primary motif per episode"; introduced in the first 2 minutes and returning at least twice; "Evolution should track the emotional arc." This episode's motif is the shop frame (the script marks motif forms 1, 2 and 3).
- On-screen text: "Parallax is a narration-first channel... On-screen text earns its place only when narration can't do the job — never as a duplicate of what the voice will already say."
- Layered mode: "When NOT to use it: when the MG is complex (multi-bar charts, dense frameworks)... More than 2-3 times per beat."

**Pacing register** — Source: `project/PACING_REGISTER.md`
- Three profiles and target change rates: urgent 0.7×, 2–4s per visual change; analytical 1.0×, 4–6s; breathing 1.4×, 6–10s.
- "No more than 90 seconds at a single pace without a change. This is the hard rule." At least 2 profile changes per beat in episodes over 10 minutes. Never urgent → breathing → urgent within a beat.
- Urgent + atmospheric: "A constructivist backdrop at 2-3 seconds reads as mood texture, not argument. Acceptable in rapid montage sequences; not acceptable when the atmospheric image is supposed to deliver the beat's emotional meaning." Breathing + atmospheric is "the highest-leverage combination for emotional peaks."
- Breathing pairs with Breathing, Stillness or Documentary Ken Burns holds; urgent pairs with Editorial drift or Settle and should avoid Documentary Ken Burns.

**Polish and measured QA**
- A1 "No linear interpolation"; A3 stagger 50–150ms; A6 drift presets; "Hard rule: charts use `editorial` (default) or `none`." — Source: `remotion-templates/POLISH.md` § 1
- Motion "is never linear and never bounces/overshoots in this register. Default reveal = `decelerate`." — Source: `remotion-templates/CLAUDE.md`, Design system
- D16: "The composition should look intentional, not like an asset accidentally cropped... Don't leave dead paper." D17: reveals complete about 150ms before the narrator names the element. — Source: `remotion-templates/POLISH.md`
- Text floor: "Minimum text size: fail < 18px, warn < 28px (content); warn < 12px (sources)... Raised from 22px on Oct 10, 2026. Use `fontSizes.readable` (28) wherever a graphic has room." Final QA for this episode: "no content text under 28px." — Sources: `project/VISUAL_QA.md`; `episodes/ai-care-motives/visual-spec.md` § 15
- Other measured rules: safe area x 96–1824, y 54–1026; contrast 4.5:1 (3:1 for large text) "measured against the rendered pixels behind the text"; static text card held > 15s and any template held > 25s are flagged; on-screen words need hold ≥ 3s + 0.25s per word; a text card repeating ≥ 80% of the narration's key words is flagged; still reused > 2 times is flagged; the same template ≥ 3 in a row is flagged. — Source: `project/VISUAL_QA.md`
- Known QA limit: "Contrast samples the box behind each text run; over busy images the median background can flatter or penalise." — Source: same file
- AI-video "Effects to Avoid": particle effects and dust ("Signals 'this is digital video' not 'printed page in motion'"); "Heavy parallax / 2.5D depth: Fights flat illustration discipline"; speed ramps, whip pans, hard zooms; heavy motion blur; lens flares and light leaks. Philosophy: "make the AI-gen feel like a printed editorial page that happens to be in motion." — Source: `project/AI_VIDEO_PIPELINE.md` lines 406–421
- Hand-layered 2.5D budget: "≤ 2 per episode (hand-labor + impact diminishment)." — Source: `project/MOTION_DIRECTOR_SPEC.md` line 99
- Illustration versus exact data: "generated art can establish a situation, but it cannot silently become a precise data visualization"; "If a label only works after several coordinate nudges over unpredictable artwork, change the layout or the image"; all "exact numbers, labels, and source cues belong to code." — Source: `analysis/image-remotion-synergy-2026-09-23.md`
- The stated audience bar for motion: "no unexplained visual changes, shape drift, or other obvious AI-video artifacts. A held image, clean cut, exact overlay, or slow deterministic camera move passes that bar." — Source: same file

### Inferences
- The current episode already sits against two of its own rules. The uniform slow push on 22 segments is what HOLD_MOTION_REGISTER calls the "YouTube-explainer signature", and 36.6% of runtime on single-move stills exceeds the "10-20% of episode runtime" target written for AI-GEN (a target written when AI-GEN meant video clips).
- Seven Ken Burns holds of 14s or more approach the "something visually changes every 15–20 seconds" guardrail, and the four 18–20s holds reach it, while the pacing register's analytical rate is a change every 4–6 seconds. The doctrine therefore supports the premise that the long holds need internal change; it does not say what kind.
- A dissolve between two stills of the same scene would be a doctrinal error ("would claim time has passed"). Same-scene sequences should cut. A state swap on a locked frame is the case `match-cut-still` was designed for, but that token currently draws a cut, so a soft swap would have to be authored as a short dissolve or built.
- Multiplane parallax is where the documents disagree: CHAINED_STILL_LESSONS allows hand-authored 2.5D for 1–2 hero shots and the roadmap plans it in Remotion, while HOLD_MOTION_REGISTER forbids independent layer drifts and AI_VIDEO_PIPELINE lists heavy parallax under effects to avoid. The HOLD_MOTION rule was written about text drifting against a photo, not about depth layers within one picture, so the two can be reconciled, but no document does so.
- A cinemagraph lamp glow or steam is the kind of element the still-design rules told the generator to leave out, and steam or dust is close to the "particles on light substrate" anti-pattern. The stills are dark-toned illustrations, not paper cards, so the anti-pattern may not apply; no document rules on it.
- Any panel build has to hold its badges and captions at 28px inside the safe area, and each pane crop must still read; the Oct 10 SplitFrame fix (captions at 36px, badges 28px, `paneFit: "cover"`) is the precedent.
- Only KineticTypography supports hold-under, so callouts, lists or diagrams over a held illustration are not available without template work.
- The transition budget is already heavily drawn. *Computed* from the manifest: seven seams carry an ink `color-wash` (beat1-seg03→04, beat2-seg07→08, beat2-seg11a→beat3-seg13, beat3-seg16→17, beat4-seg18→19, beat7-seg36→37, beat7-seg44→beat8-seg45), against the grammar's "more than 2-3 per episode" limit; fades frame the title and end cards; four seams ask for a dissolve. Since `fade` and ink `color-wash` both render as a dip through ink, the episode shows three rendered seam types (cut, dip through ink, dissolve), which is the stated maximum. New techniques that need their own seam treatment have no room left under "more than three transition types in one episode."

### Gaps
- No document addresses a "boil" (cycling re-renders). The nearest statement is the test pass criteria in the Oct 10 analysis, which list "no texture crawl or flash" as a failure, so a deliberate boil would need its own ruling.
- No document sets a maximum number of panes, a minimum pane size, or phone-size legibility thresholds for multi-panel layouts. The Sept 24 analysis only advises "at phone size, show the active panel larger and finish with the grid if four small illustrations are hard to read."
- POLISH D19 ("Relationship diagrams use precision markers, not filled discs") may bear on illustrated diagram nodes; I did not read it in full.
- `project/DIRECTING_LANGUAGE.md`, `project/TEXT_ANIMATION_REGISTER.md`, `remotion-templates/IMAGES.md` and `BRAND.md` were not read in full; they may hold further image rules.
- `project/DECISIONS.md` D3 ("Clean motion graphics as primary visual (not AI illustration)") is still in the log with its "~50%" trust figure; `analysis/ai-imagery-trust-research-2026-10-10.md` finds that number unsupported by its cited source but says D3's "direction mostly does" survive. The log itself has not been updated, and D48 (the focus shift) does not restate the position on AI illustration.

---

## 7. Candidate techniques raised in conversation (not yet built or tested)

### Takeaway
This is the working vocabulary supplied in the research brief. It is recorded here as given. None of these items appears under these names in the repository, and none has been built or tested for this episode except the pinned first and last frame.

### Cited Findings

Source for every item in this list: the research brief for this audit, relaying the creator's conversation. Not a repository file.

The list, exactly as given:

1. sequence montage (pose-to-pose: 3 to 5 stills of one scene cut on sentences)
2. state swap (same frame, one thing changed)
3. match cut pairs (shopkeeper at counter / car on test rig / model at desk)
4. split screen, quad split and panel build (Duty/Prudence x watched/unwatched as a 2x2)
5. triptych (shopkeeper, car, model)
6. contact sheet or filmstrip recap
7. cinemagraph (lamp glow, steam off bread)
8. pinned first and last frame (already used once)
9. boil (3 to 4 re-renders of one still cycled slowly)
10. multiplane or 2.5D parallax from separately generated layers
11. panorama scroll across a very wide still
12. annotated illustration (Remotion callouts drawn on the still, for example the street diagram drawn on the street still)
13. spot illustrations as diagram nodes
14. cut-out animation

Proposed first tries, exactly as given: the 2x2 panel build, sequence montage on the three longest holds, match-cut pairs at the analogy seams, one multiplane shot at the open, the street diagram drawn on the street still.

Creator's statement on cost, as given: AI stills are free to them and AI video is cheap (about $0.50 per clip observed).

Repository facts that touch the cost statement:
- ChatGPT stills are recorded as "$0 (existing subscription)". — Source: `project/CHAINED_STILL_LESSONS.md`, "Cost and time profile"
- The six sidecars record $0.48 per 5s clip and $0.576 for the 6s pinned clip, at a promotional $0.096 per second. — Source: `episodes/ai-care-motives/assets/clips-i2v/*.json`
- "H3 Max is 40% off until Oct 15 2026 (then 0.05 / 0.08 / 0.16)". — Source: `tools/ai-video/fal_i2v.py` lines 41–42
- Image edits for the two keyframes cost "about $0.14" and the pull retake "about $0.60 (edit + clip)". — Source: `analysis/ai-video-landscape-2026-10-10.md` §§ 10–11

### Inferences

Where each candidate stands against what is on disk. Everything in this table is my cross-reference to findings cited in §§ 1–6; none of it is a recorded project decision.

| # | Candidate | Nearest thing that exists | Doctrine or test that bears on it |
|---|---|---|---|
| 1 | Sequence montage | PhotoMontage (unused; forces duotone; duration-timed), or consecutive FOOTAGE segments with cuts, as beat5-seg25 → seg25b already does | "Illustration → illustration, same scene: straight cut, on action or a matched composition." Stills held consistent by the chain discipline (same conversation, Frame 1 + Frame N-1 anchors). The Sept 23–24 analyses proposed "cut between poses" and it was never tested. The style block's "nothing mid-stride or mid-gesture" would need relaxing for pose-to-pose. The 2-consecutive-AI-GEN rule has a `[SCENE:]` exemption written for morph chains, not cut sequences. |
| 2 | State swap | The pair `stills/aigen-03-second-shopkeeper.png` and `keyframes/aigen-03-end-unwatched.png` is already a state-swap pair (pixel-identical outside the window). SplitFrame `captionSwap` is the text version. | "Generate frame B by editing frame A." `match-cut-still` is the designed transition but draws a cut today. The image-edit step has no tool in the repo. |
| 3 | Match cut pairs | Tokens exist; render as cuts | "Highest-leverage under-served transition", zero uses; needs a real shared composition. The car on the test rig is currently a stock clip (`stock-dyno`), not an illustration; the Oct 10 analysis suggested "AI plates in the house style instead of stock footage" for the Beat 6 car slots. |
| 4 | Split screen, quad split, panel build | SplitFrame: two panes, per-pane `revealAtSec`, `paneFit: "cover"`; already used for Duty / Prudence with one still in both panes | No 2×2 exists. 28px floor and safe area apply. The Sept 24 analysis proposed separate panel assets assembled in a code grid, one panel moving at a time. |
| 5 | Triptych | None (no three-pane layout) | Same constraints as 4. |
| 6 | Contact sheet or filmstrip recap | None as a template | No doctrine found. The motif rule (one motif, returns at least twice) is the nearest editorial hook. |
| 7 | Cinemagraph | Family B in the taxonomy, "the underused safe tool"; `gen_motion_prompts.py` can emit `cinemagraph-prompts.md` | No mask or loop support in Remotion. H3 take 1 did not loop and had a frame-0 pop and brightening. The stills were generated with no flickering light by rule. |
| 8 | Pinned first and last frame | Done once (`aigen-03-unwatched`, beat5-seg27) | "The first technique good enough to use." Needs an edited end frame, trim, conform and last-frame hold, all manual. |
| 9 | Boil | None | No doctrine; "texture crawl" is listed as a failure in the Oct 10 pass criteria. |
| 10 | Multiplane / 2.5D from separately generated layers | Family C allowed for 1–2 hero shots; roadmap P4 planned; `gen_depth.py` exists but is flagged unreliable on flat art; the Sept 23 test generated a ground plate and a transparent cut-out separately | Auto-depth is blacklisted. Conflict between "premium move" (CHAINED_STILL_LESSONS) and "heavy parallax fights flat illustration" / "per-element drift is forbidden". No component exists; `DepthParallax` is absent. |
| 11 | Panorama scroll | KenBurns pan directions (small); ScrollyReveal and AnnotatedZoom focus moves inside a 16:9 image | All stills are 16:9 at 1672×941 (4K upscales 6688×3764). `render_kenburns.py` cannot pan. Resolution-headroom rule applies. |
| 12 | Annotated illustration | AnnotatedImage, ScrollyReveal, `AnnotationSVGLayer` (all force duotone); `AIStillComposite` prototype (hard-coded) | "Generated art... cannot silently become a precise data visualization"; exact labels belong to code; the QA contrast check is weaker over busy images. The street diagram is `network-street.json` (four nodes, three edges). |
| 13 | Spot illustrations as diagram nodes | FrameworkDiagram has an `icon` string field (meaning unchecked); NetworkDiagram has no image field found | Sophistication rule 5 warns against "literal symbol-icons"; the Sept 23 SVG test was rejected because the style dropped from "a rich constructivist image to generic triangle trees." |
| 14 | Cut-out animation | `IllustratedGrove` / `forest-argument-cutout` experiment | Tested Sept 23 and rejected by the creator for its motion and transition: "an experiment record, not an approved production approach." The rejection is recorded as "taste, not a model limit." |

Notes on the proposed first tries:
- "The three longest holds" resolves to beat1-seg05 (20s) and beat4-seg21 (19s), then a tie at 18s between beat4-seg23 and beat3-seg16. The first three are all the rating-cards still (aigen-06); the fourth is the desk at night (aigen-10).
- "The open" is beat1-seg00: the desk-at-night still (aigen-10), 9.1s, currently a 1.0→1.08 push.
- "The street still" is ambiguous in the repository. The shot list's `D_street` thread is aigen-06 (a row of nine figures holding cards, described in the script as "tiled as street facades" on its second use), while the street seen through the shop window is in aigen-03. The NetworkDiagram titled "A fact about his street" currently follows a 3-second return to the shop counter (aigen-02).
- The 2×2 (Duty / Prudence × watched / unwatched) has three of its four pictures on disk only loosely: aigen-02 (counter with child), aigen-03 (shopkeeper alone, street busy) and the edited empty-street keyframe. The current SplitFrame distinguishes Duty from Prudence by caption alone, on one identical still.

### Gaps
- I found no written record of this candidate list, of the first-try selection, or of the cost statement in the repository; the brief is the only source.
- No candidate has acceptance criteria written down. The only stated bar is the general one from Sept 23 ("no unexplained visual changes, shape drift, or other obvious AI-video artifacts") and the Oct 10 pass criteria for i2v ("faces stay featureless, flat shapes stay flat, no texture crawl or flash, and the motion is something Tiger wants on screen").
- Whether the creator's Sept 23 rejection of cut-out motion was about the technique or about that scene's staging is recorded only as "did not resolve the staging problem"; the reasons are not spelled out.
- "The analogy seams" are not marked in the manifest or script under that name; I did not attempt to identify which seams are meant.
