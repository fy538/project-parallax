# Chained Still + Video Generation — Lessons Learned

> Empirical findings from running multi-still scene morphs on the Parallax constructivist aesthetic. Living document — append as bakeoffs accumulate.
>
> Source: prisoners-dilemma Scene C bakeoff (May 9, 2026) + Thread A camera-move bakeoff (May 21, 2026). See `episodes/prisoners-dilemma/bakeoff/` and `episodes/prisoners-dilemma/development/morph-tests/` for raw materials.
>
> Last updated: May 21, 2026.

## TL;DR

Chained-still-morph video generation works on the Parallax constructivist aesthetic **for genuine scene transforms** — empirically validated on a 4-frame scene. It **fails for camera moves** (dolly/zoom/pan over a static scene), where the right tool is a Ken Burns move or a single-still animation, not a morph. The prompting discipline matters more than the tool choice. Specifically:

- **The single most important rule (added May 21, 2026):** classify the shot before you pick a tool. Reframe (camera moves, scene unchanged) → **Ken Burns** or **live still**, never a morph. Transform (scene becomes something else) → **morph**, but only from a shared base and only between a small number of large flat shapes. See "The three-tool model" below.
- **Tool stack that works (May 2026):** ChatGPT image generation for stills (4-anchor reference upload, sequential generation, morph-aware prompts) + Pika 2.5 for image-to-video morphs (start+end frame mode, 8s clips). For reframes: ffmpeg/NLE Ken Burns on a single high-res still, or Pika/Hailuo single-image animation.
- **The technique survives figure introduction.** A morph that introduces faceless constructivist figures resolved cleanly — contradicting the prior assumption that figure-introduction needs a hard cut.
- **The field report's tool recommendations are partially wrong for this use case.** The May 2026 research called Pika 2.2 the lowest-quality option; Pika 2.5 (which postdates the report or was missed) produced the bakeoff's best results. Vidu Q1 + Kling 3.0 may still be worth testing but should not be assumed superior.

## The three-tool model (May 21, 2026) — read this before specifying any AI motion

The Thread A bakeoff (a dolly-in from a wide RAND office to a close-up of the tally grid on the table) **failed badly**: the ~60 hand-drawn tally marks slid, smeared, multiplied, and dissolved. Root-causing it produced a predictive framework that resolves most of our morph risk up front.

### Why morphs fail — the correspondence theory

Start+end-frame interpolation (the mechanism behind Pika/Kling/Runway keyframes, and classical frame-interpolation models like Google FILM and RIFE) works by **finding correspondence between elements in frame A and frame B**, then interpolating the path between them. This is well-documented (FILM is an optical-flow architecture; its named failure mode is "in large motion the correspondence of objects is hard to locate → blur/ghosting," and it "struggles with small fast objects … with far fewer pixels to derive supervision"). It implies three things:

1. **A few large shapes morph cleanly** (clear correspondence). **Many small high-frequency details morph badly** (no stable correspondence → the model averages them → smearing). Our 60 tally marks are the textbook bad case.
2. **Independently generated frames are the worst case.** Two stills drawn separately from text have *no real shared pixels* — even simple shapes drawn twice won't co-register. (Confirmed by DiffMorpher: morphing "fails where correspondence between the two inputs is not clear enough.") **Fix: generate frame B by editing frame A** (img2img / inpaint / "edit this image"), so the morph has real correspondence to track.
3. **Zoom-in / dolly-in is a distinct hard case (disocclusion).** The destination's fine detail occupied a few pixels in the source, so there's *nothing to interpolate from* — the model must hallucinate emerging detail, and text/marks garble because they're pixel patterns, not glyphs. A zoom is therefore almost never a morph job.

### Reframe vs. Transform — the classification that picks the tool

- **Reframe** = the camera moved, the scene didn't change. Dolly in, push down a corridor, zoom to a detail. → **Never a morph.** Use Ken Burns (camera motion) or a live still (subject motion).
- **Transform** = the scene content genuinely became something else. Grid becomes a table; pasture becomes ocean; empty horizon gains figures. → **Morph is correct** — if it's a small number of large flat shapes and frame B is edited from frame A.

### The three tools, in increasing risk order

| Tool | What moves | Risk | How it's produced |
|---|---|---|---|
| **Ken Burns** | The camera (push / pan / tilt on a static still) | **None** — deterministic, no AI hallucination | ffmpeg `zoompan` or NLE, on a single still. Needs resolution headroom: source ≥ output × zoom factor (a 2× push into 1080p wants a ~4K source). |
| **Live still** | The subject (subtle gestures, turning reels, drifting light) | **Low** — one input image, so no correspondence problem to fail | Pika / Hailuo / Kling **single-image** mode (no end frame). Keep motion small; faceless constructivist figures tolerate it well. |
| **Morph** | The scene transforms A→B | **High** unless disciplined | Pika 2.5 start+end frame. Only for transforms of large flat shapes, with B edited from A. |

### Hailuo / MiniMax model selection (May 23, 2026, web-researched)

The tool matters as much as the family. For Hailuo specifically:
- **Live-still (Family D) → `I2V-01-Live`.** MiniMax's model purpose-built to animate flat 2D
  illustration ("stability and subtle expression") — the restraint profile we need, and far
  less likely to 3D-ify flat color blocks. Fallback: **Hailuo 2.3** (also illustration-faithful).
  **Never Hailuo 02 for live-stills** — it's photoreal-trained and will add realistic texture to flat art.
- **Morph (start+end frame) → `Hailuo 02`** is the *only* Hailuo model with first+last-frame.
  But Pika 2.5 / Kling beat it on clean keyframe morphs of flat art, so keep **Pika primary,
  Hailuo 02 fallback** (as already planned).
- **No motion-intensity slider exists** — restraint is 100% prompt language. Discipline:
  lead with the camera lock ("static camera, locked-off, tripod mounted" — omitting motion
  words *defaults to handheld drift*); name only the one moving element; name everything else
  static ("the tiled floor stays perfectly still" — counters checkerboard crawl); keep prompts
  terse (≤~15 words, ≤2–3 motion keywords). The `T2V-01-Director` model's `[Static shot]`
  bracket locks hardest but is text-to-video-first.

### Episode 1 decision: defer morphs — single-still → AI video only (May 23, 2026)

After repeatedly finding morphs the lowest-ROI, highest-failure technique (smearing,
flash-on-appearance, mandatory cherry-picking), **prisoners-dilemma (ep1) drops morphs
entirely.** The motion vocabulary collapses to three reliable things:

1. **Single-still live motion** — Hailuo i2v (subject or subtle camera move).
2. **Ken Burns** — deterministic camera move on a still, rendered locally.
3. **Cut / cross-dissolve seams** — handled in the NLE, never an AI morph.

The key reframe: **most "morph" beats are dissolves in disguise.** Intent language gives
it away — "*resolves to*", "*dissolves to*", "*appears*" are dissolve/fade verbs, and a
cross-dissolve between two stills is a deterministic opacity blend with none of the morph
smearing (no optical-flow interpolation). Scene changes are plain cuts. A dissolve *implies*
the "becoming" instead of rendering the in-between — at scrubbing speed it reads about the
same and never breaks. Ep1's 5 morph seams → 4 cross-dissolve + 1 cut; the 9 morph-endpoint
stills → Ken Burns (landscapes) or live-still (figure scenes). Revisit morphs in a later
episode once the reliable pipeline has shipped one. The `morph` vocabulary stays defined in
`shot-list.json::motion_model.techniques` for future use; no ep1 shot references it.

### Hailuo-native prompt structure (the prompt rebuild, May 23, 2026)

`gen_motion_prompts.py` now emits **Hailuo-shaped** live-still prompts (was Pika-shaped):

- **No negative prompt** — Hailuo ignores it; the old `-neg …` block was dead text. Deleted.
- **Lead with the camera state** — a lock (`Static locked camera, tripod.`) or a Director
  bracket (`[Truck left, very slow]`, `[Push in, slow]`). That clause is the *only* intensity
  control (no slider). `Truck` (lateral camera slide) gives real parallax — prefer it over a pan.
- **Per-shot model tag** in the shot-list (`hailuo_model`): `I2V-01-Live` when the subject
  moves and the camera holds; `I2V-01-Director` when the camera moves.
- **Terse**: ≤~20 words, ≤3 motion ideas, `subtle`/`slightly` on every figure motion, faces
  hold, and name the crawl-prone surface to freeze (floors/tiles/signage/board text).

### Ground every motion prompt in the ACTUAL still, not the script intent (May 24, 2026)

**The bug this prevents:** live-still / cinemagraph prompts were authored from the *script's
intended scene* and never reconciled against the *generated* still. So they named things that
weren't in the frame (`aigen-07` said "papers" on an empty table → the model would hallucinate
papers in) and prescribed motion that didn't fit the composition (`aigen-11` said figures move
"slowly" over a dynamic foreground **sprint** → "slow-motion" warp on the worst-case i2v subject).
Stills are also frequently **regenerated**, which silently invalidates an intent-written prompt.

**The rule:** a motion prompt MUST be written (or re-verified) **against the final still on disk**.
Before a shot's `live_still_motion` / `cinemagraph_motion` is considered ready:
1. **Open the still.** Name *only* elements actually visible in the frame — never anything from
   the script that didn't render. Anything you name gets re-animated; anything absent that you
   name gets hallucinated *in*.
2. **Match the verb to the pose.** Figures mid-stride → "walk/continue"; figures standing →
   "shift subtly"; figures in a frozen action pose (sprint, reach) → hold the pose and animate
   only ambient (light/dust), or reclassify.
3. **Match the technique to the still.** Dynamic foreground action (sprinting, big gestures,
   close articulated hands) is a *bad* live-still candidate → prefer **ken-burns** (camera push)
   or **cinemagraph** (animate one ambient element, figures held). Don't force i2v onto a pose
   it will mangle.
4. **Re-verify after any still regen.** A new still ⇒ its motion prompt is stale until re-checked.

**Why the tool can't do this:** `gen_motion_prompts.py` is deterministic text templating — it has
no vision and only echoes the `live_still_motion` field. The grounding is therefore a **vision
step** (a human or a vision-capable agent looking at the image), upstream of the templating.

**This is now automated by the `ground-motion` skill** (`skills/ground-motion/SKILL.md`): it
perceives each still (extended `tools/ai-video/perceive.md` schema — `named_elements`,
`dynamic_action`, `style_register`, `era`), decides the technique gate via `motion_director.py`,
rewrites each prompt to name ONLY on-frame elements with a pose-matched verb, and continuity-
checks cut/dissolve neighbours. Policy: **auto-apply the mechanical fixes** (drop named-but-absent
elements, verb-to-pose, Hailuo-native reformat) and **flag the judgment calls** (technique
reclassification, continuity breaks, crowding/style drift) for human approval. Run it after every
still generation or regen, before spending i2v generations. (Batch/CI promotion path: a
`tools/ai-video/ground_motion.py` using the vision API — see the skill's "Promotion" note.)

### Morph-friendly vs morph-hostile checklist

| Morph-FRIENDLY | Morph-HOSTILE |
|---|---|
| A few large shapes | Many small high-frequency elements |
| Shared composition / aligned layout | Independently generated, no shared layout |
| Flat / color-blocked, low texture | Fine texture, dense detail |
| No text/symbols/countable marks | Text, numbers, tally marks, labels |
| **Both frames from a shared base image** | Two unrelated text-to-image outputs |
| Small / no scale change, low disocclusion | Zoom / dolly-in revealing new fine detail |
| Genuine transform of a large form (A→B) | A "reframe" of a static scene → use Ken Burns |
| Organic / liquid flow, similar lighting | Mismatched lighting or scale, static↔dynamic mix |

**Operational rule:** *Reframe → Ken Burns (camera) or live still (subject). Transform → morph, from a shared base, large flat shapes only.* The tally-mark clip violated three predictors at once (reframe done as morph + many small marks + independently generated), which is why it failed so completely.

Research backing for this section: Google FILM ([research.google](https://research.google/blog/large-motion-frame-interpolation/), [arxiv 2202.04901](https://arxiv.org/abs/2202.04901)); RIFE ([arxiv 2011.06294](https://arxiv.org/abs/2011.06294)); DiffMorpher correspondence failure ([arxiv 2312.07409](https://arxiv.org/html/2312.07409v1)); Runway keyframe guidance ([help.runwayml.com](https://help.runwayml.com/hc/en-us/articles/34170748696595-Creating-with-Keyframes-on-Gen-3)); Ken Burns resolution-headroom practice ([Cloudinary](https://cloudinary.com/guides/image-effects/ken-burns-effect-complete-guide-and-how-to-apply-it)).

### Organic vs geometric transforms — the morph/animate split (May 23, 2026)

Not all transforms should be AI morphs. AI start/end interpolation **has no 3D world model** — it
renders all spatial change as *fluid deformation* ("solid objects → liquid distortion" is its native
behavior, not a tunable bug — [Kling drift guide](https://kling.ai/blog/fix-ai-video-drift-consistency-guide)).
So gooeyness is architectural. The split:

- **ORGANIC / atmospheric transform** (terrain→terrain, walls→ocean, smoke, water, figures regrouping):
  fluidity *is* the aesthetic → **AI morph (Pika)** is correct.
- **GEOMETRIC / precise transform** (grid→table, shape→shape, charts, typography, hard edges that must
  stay hard): warping is the *failure* → **animate in Remotion (vector/code), NEVER AI morph.**

"Slick / geometric / not tacky" is a **motion-design craft**, not a generation problem. Codified rules:

1. **Never linear.** Every transform uses an eased curve. Default reveal = decelerate.
2. **Transform, don't deform.** Geometric shapes move via position / scale / rotation / opacity / masked
   wipe — they never warp, melt, or goo.
3. **Snap to the grid.** Motion respects the underlying grid/axis; reveals wipe along grid lines.
4. **200–500ms** per move. Under 200 jars; over 500 drags. One consistent base duration.
5. **Stagger, don't simultaneity-dump.** Elements arrive in sequence with small offsets. Animating
   everything at once is the #1 amateur tell.
6. **No bounce / overshoot / elastic** as default — reads playful/tacky in this register. Restraint.
7. **Tool-match:** geometric/precise → Remotion vector; organic/atmospheric → AI morph. Never reverse.

**Slick easing tokens** (Material-derived; candidates for `theme.ts`):
- reveal / snap-into-place: `cubic-bezier(0, 0, 0.2, 1)` (decelerate — the workhorse)
- general transition: `cubic-bezier(0.4, 0, 0.2, 1)`
- exit: `cubic-bezier(0.4, 0, 1, 1)`

**Consequence for prisoners-dilemma:** of the 6 planned morphs, only `06→06b` (grid→table) is geometric —
it moves to a Remotion vector animation (this is also why it kept flashing in Pika: wrong tool). The other
five (`11→11b`, `12→12a`, `12a→13` hero, `15→forecast-01`, and the figure-arrival in `06b→07`) are organic →
Pika is correct.

Research backing: motion-design craft — [IxDF 12 principles in UI](https://ixdf.org/literature/article/ui-animation-how-to-apply-disney-s-12-principles-of-animation-to-ui-design), [Material duration & easing](https://m1.material.io/motion/duration-easing.html), [Hanson — easing/excessiveness/pace](https://hansoninc.com/easing-excessiveness-and-pace-in-motion-design/); geometric motion language — [Motionographer Neo-Bauhaus](https://motionographer.com/quickie/sam-miles-neo-bauhaus/), [Kurzgesagt shapes & strokes](https://www.youtube.com/watch?v=rs_BiKgpSPM); AI-morph fluidity is architectural — [Kling drift guide](https://kling.ai/blog/fix-ai-video-drift-consistency-guide).

## Single-still animation — the six-family taxonomy (May 23, 2026)

"Single-still animation" (bringing ONE image to life, no second frame, so no morph/correspondence problem) is not one thing — it's six families. The crux for Parallax: **the families that depend on recovering 3D depth are exactly the ones that fail on flat constructivist art**, because monocular depth estimators are trained to *ignore* flat media (texture/haze/perspective cues our art omits; illustration even puts shadows above their objects). Super-resolution is the mirror image — flat color + clean edges is its *easy* case. So: depth-based families are blacklisted, SR is embraced.

Ordered low → high risk on flat illustration:

| # | Family (industry term) | What moves | Det./AI | Who renders | Flat-art risk | Internal `motion_technique` |
|---|---|---|---|---|---|---|
| A | **Camera-on-plane** (Ken Burns 2D) — push/pull/pan/tilt/drift | virtual camera | deterministic | ffmpeg, local | none | `ken-burns` |
| B | **Masked ambient** (cinemagraph / plotagraph) — one masked element (smoke, flare, glow, water, flag) | a masked region | det. or AI | Pika masked / NLE | low (mask-defined, not depth) | `cinemagraph` |
| C | **Manual 2.5D parallax** — hand-layered fore/mid/back | layers at different rates | deterministic | NLE (AE/Photoshop) | low (you author depth) | `parallax-2.5d` |
| D | **AI subject micro-motion** (i2v, no end frame) — figures shift/gesture/breathe | the subject | AI | Pika/Hailuo single-image | low–med (faceless figures forgive) | `live-still` |
| E | **Auto-depth 2.5D** (LeiaPix/Immersity/CapCut "3D photo") | auto camera + parallax | AI | — | **HIGH — depth estimator fails** | ❌ BLACKLIST |
| F | **AI hallucinated 3D camera** — *aggressive* orbit / fly-through | invented geometry | AI | — | **HIGH — color blocks melt** | ❌ BLACKLIST |
| F′ | **AI subtle camera move** — slow push / lateral drift on one still (I2V) | mild invented parallax | AI | Pika/Hailuo single-image | **low–med** — proven OK on flat art (PD `aigen-01`, `04`) | `live-still` (camera variant) |

**Why D works for us:** the same property that makes our morphs survive figure-introduction — stylized, non-photoreal, color-blocked figures dodge the uncanny face/hand collapse that wrecks photoreal i2v. Keep the motion micro (no walking, no big gestures) and expect to cherry-pick takes.

**Faces caveat (May 23, 2026).** Parallax figures use *planar stylized faces* (skin-toned, simplified eyes/brow/jaw planes — Saul Bass / Fortune), NOT pure black silhouettes. Planar faces keep MOST of the forgiveness (they're still non-photoreal), but the moment a model animates the face directly — eyes, mouth, head turn — it can warp. So on any live-still or morph with a visible close face: **hold the head still; animate only hands, body lean, props, or ambient.** Distant/small figures can stay silhouettes and animate freely (no face to break). This is why `aigen-01`'s live-still prompt must say "heads hold, only the writing hand and the tape reels move."

**"No walking" is not the real rule (May 23, 2026).** The blanket "keep live-still motion micro, no walking" caution was proxying for the actual risk drivers: **visible faces, articulated close hands, and large figure scale.** When those are absent, larger motion is safe. The canonical safe case: a **distant figure walking away from camera** (back turned, one-point perspective) — no face, simple receding gait, and "person walking down a hallway" is one of the most heavily-trained i2v motions. So `aigen-04` (RAND corridor) is a live-still where the figure walks away down the hall, even though it's "walking." Discipline for these: lock the camera and freeze the background; the failure tells are **repeating-pattern crawl** (checkerboard floors, tiled ceilings) and **text warp** (signage, chalkboards) — both signal the frame drifted; re-roll. Real rule: *don't animate a visible face or close hands; everything else scales with distance.*

**Cinemagraph (B) is the underused safe tool.** When a shot wants *one element* alive (flares, screen glow, equation rays, ocean shimmer) — not a camera move and not full subject motion — mask that element and animate only it. Pika animates reflective water / flicker badly when unmasked, so never leave it unconstrained.

**Manual 2.5D (C) is the one "premium" move available**, but it's hand-labor (AE layer slicing) — reserve for 1–2 hero depth shots per episode (a corridor, a layered landscape). Do NOT reach for an auto-depth tool to shortcut it; on flat art the estimator gives near-flat or arbitrary depth.

### Resolution headroom — upscale BEFORE local camera moves

Ken Burns and manual 2.5D crop *into* the still and scale the crop up to fill the frame, so source resolution drives sharpness **even at 1080p output**. A push to zoom Z needs `source_width ≥ output_width × Z`:
- 1.3× push → source ≥ 2,496px; 2× push → source ≥ 3,840px (4K).
- Our ChatGPT stills are ~1,672px — *narrower than a 1920 frame* — so every push starts soft.

**Fix:** AI super-resolution (Real-ESRGAN, `x4plus` general model — preserves editorial grain; the `anime` model over-flattens it) enlarges the still 4× with real detail before the local render. Tool: `tools/ai-video/upscale.py` (spandrel + MPS) → writes `assets/stills-4k/`; `tools/ai-video/render_kenburns.py` auto-prefers that dir. This is targeted at **A and C only** — the AI-video families (B-via-Pika, D, morph) are capped at 1080p by the generator, so upscaling their source buys nothing.

Research backing: "3D Ken Burns Effect from a Single Image" (Niklaus et al. 2019, [arxiv 1909.05483](https://arxiv.org/abs/1909.05483)); "Animating Pictures with Eulerian Motion Fields" (Holynski et al. 2021, [eulerian.cs.washington.edu](https://eulerian.cs.washington.edu/)); depth estimation fails on flat art — "Illustrator's Depth" ([arxiv 2511.17454](https://arxiv.org/html/2511.17454v1)); stylized i2v forgiveness ([StarPop](https://starpop.ai/blog/articles/best-ai-image-to-video-generator)); hallucinated-camera limits ([Stability Virtual Camera / TechRadar](https://www.techradar.com/computing/artificial-intelligence/stability-ais-new-virtual-camera-turns-any-image-into-a-cool-3d-video-and-im-blown-away-by-how-good-it-is)).

## Validated pipeline

### Stage 1 — Stills (ChatGPT image generation)

**Same conversation, sequential generation.** Open one ChatGPT conversation per scene. Upload the 4 episode style reference images at the top of the conversation; they remain the canonical style anchor for every frame in the chain. Generate Frame A first, then upload it as additional reference for Frame B, and so on.

**Multi-anchor reference uploads.** When generating Frame N, upload Frame 1 (the chain anchor) plus the immediately prior frame (Frame N-1) as references. This bounds drift more reliably than single-anchor uploads. Empirically validated on Scene C's 4-frame chain — palette and composition held tight across all 4 frames.

**Morph-aware prompting discipline.** Each prompt must explicitly state:
- Camera position (fixed throughout the chain)
- What does NOT change (lighting direction, palette, composition anchors)
- The single thing that DOES change (described as world-change with a stable focal anchor, never as camera motion)
- Specific palette hex codes — repeated in every prompt, not just the opening

See `episodes/prisoners-dilemma/bakeoff/scene-c-prompts.md` for the canonical prompt template.

### Stage 2 — Morph clips (Pika 2.5)

**Start+end frame mode, 8 seconds per clip.** Pair-by-pair morphing from Frame N to Frame N+1. For a 4-frame chain, that's 3 morph clips covering ~24s of continuous-feeling video.

**Why 8 seconds.** Long enough that the morph feels deliberate and unhurried; short enough to stay within Pika's optimal coherence window. Going to 10s extends the morph but starts to introduce drift in the final 1-2 seconds.

**Why Pika 2.5 over Pika 2.2.** Empirically tested in this bakeoff and produces strong results on constructivist illustration. The May 2026 field report's negative judgment of Pika applies to 2.2; 2.5 is a meaningful upgrade. Pricing similar (~$0.20-0.35/clip), free tier generous enough to cover a bakeoff at zero cost.

### Stage 3 — NLE assembly

**Hard cuts between morph clips in a chain.** The morph IS the transition; a fade between morphs creates a double-transition that reads as visual stutter.

**Color-grade snap pass.** Drop each clip into DaVinci/Resolve, sample the dominant amber and ink hex from the corresponding still, apply a snap-to-canonical color grade. This corrects palette drift across the chain.

## Prompting discipline — DO and DON'T

### Stills (ChatGPT image generation)

**DO:**
- Lock camera position upfront in the continuation message and reaffirm in every frame prompt
- State explicitly what doesn't change ("CAMERA POSITION UNCHANGED. Same horizon line.")
- Pin specific palette hex codes in every prompt (`#1C1814`, `#E5A544`, `#F0E6D0`)
- Describe single changes in isolation ("ONLY the grid has tightened")
- Multi-anchor: upload Frame 1 + Frame N-1 for Frame N+1
- Use neutral phrasing for new elements ("X has appeared," not "X enters")

**DON'T:**
- Use camera-motion language for static-camera scenes ("the camera pulls back" → bad if camera should hold)
- Introduce more than one significant element per frame
- Let middle frames carry text on surfaces (signs, posters, chalkboards) — text scrambles through morphs even when it survives in the still
- Trust that prior conversation context locks in style — restate constraints per prompt
- Generate frames out of order — sequential dependency means each frame inherits the last

### Morph clips (Pika 2.5 motion prompts)

**DO:**
- Open every prompt with "Camera holds static" if camera is fixed (matches the still discipline)
- Describe the world-change concretely with directional verbs of stability — "form," "clarify," "sharpen," "resolve in place," "coalesce"
- Name what holds position explicitly ("Mountains and distant terrain hold position")
- Use the same negative-prompt block across all clips in a chain — variance there causes per-clip palette drift

**DON'T:**
- Use vertical-motion verbs ("lift," "rise," "emerge," "ascend") — Pika 2.5 reads them literally and renders particle effects (smoke, dust, mist). This was the Pair 2 failure mode in the Scene C bakeoff. Replace with "clarify" or "form" or "resolve."
- Forget to negate atmospheric effects by default. Add `smoke, dust, particles, atmospheric haze, fog, mist, rising elements, fire, steam` to the standard negative prompt for Parallax.
- Specify camera moves you don't want — even "no camera move" prompts can leak into "slow drift." Be explicit: "Camera holds completely static. No camera movement. No drift. No zoom."
- Run a single attempt on figure-heavy morphs and accept it. Run 2-3 attempts and pick the best — figure introduction has high seed-to-seed variance.

## Failure modes observed and their fixes

| Failure mode | Where it happened | Cause | Fix |
|---|---|---|---|
| Smoke/dust artifacts on a transformation morph | Scene C Pair 2 (B → C) | Motion prompt verb "lift" interpreted literally; warm palette read as fire/smoke environment | Replace vertical-motion verbs with stability verbs ("clarify," "form"); add particles/smoke/dust to negative prompt by default |
| Detail smearing on a dolly-in morph (tally marks slide/multiply/dissolve) | Thread A 01 → 01b (May 21, 2026) | Three violations at once: a **reframe** (camera move) attempted as a morph; **many small high-frequency marks** with no stable correspondence; **two independently generated** frames | Don't morph reframes. Use Ken Burns (camera) or live still (subject). If a transform genuinely needs a morph, edit frame B from frame A and keep shapes large/flat. See "The three-tool model." |
| Brand treatment crushed a colorful payoff shot (gold doorway → muddy olive) | Thread A grade (May 23, 2026) | The standard treatment is a **full duotone** — it discards original hue and remaps luminance onto the amber ramp. Right for dark/dramatic beats, wrong for colorful ones (sunrise, gold-lit doorway). | Apply the duotone at **partial strength**: `treat_video.py --strength 0.25–0.4` blends the graded copy back over the original, keeping real color + a brand tint + grain/vignette. Full duotone (`--strength 1.0`) only for dark beats. |
| Bright light-flash / glow when a new object appears in a morph (table "materializes") | Thread C `06→06b` Pika (May 23, 2026) | **Over-prompting.** In start+end-frame mode the two stills ARE the instruction; describing the change in the prompt too (\"a table forms\", \"grid sharpens\") hands the model a second, competing instruction, and transformation verbs (`forms/emerges/appears/sharpens`) get dramatized as a flash. (Brightness mismatch between frames can also cause it, but `06`/`06b` were exposure-matched — here it was purely the prompt.) | **Prompt = camera + mood ONLY**, never name the changing element or any arrival verb (`Static locked camera. Calm, even light. Still scene.`). Let the keyframes drive. Short negative (`glow, light flash, sparkle, particles, bloom, smoke` — long lists backfire in Pika), LOW motion strength, exposure-match the frames, optionally ghost the new element in frame A so it fades in. |

(More failure modes will be appended as they emerge in subsequent bakeoffs.)

## Surprising findings

**Figure introduction within a morph is viable for constructivist faceless figures.** This contradicts the prior assumption that figures must appear on hard cuts. The Scene C Pair 3 morph (C → D) introduced two faceless suited figures into an interior that itself was coalescing from a gridded landscape — two compounding changes — and the result was clean. Likely reason: the constructivist style is forgiving of figure-resolution morphs because the figures aren't photoreal. Photoreal figure-introduction is hard because the model has to interpolate through a recognizable face/body; abstract silhouettes don't require that. **The very thing that makes the channel's aesthetic distinctive is also what makes it cooperate with morph technology.**

**Implication for script-format extension:** Figure introduction can land within a morph chain, not only on a cut. This loosens a constraint I had baked into the v6 design. Scenes can have figures appearing mid-arc rather than only at chain boundaries.

**Implication for tool-stack research:** The May 2026 field report ranked Pika last on quality. Pika 2.5 produced the cleanest results of the bakeoff. The report's recommendation (Vidu Q1 + Kling 3.0) is not necessarily wrong, but Pika 2.5 belongs in the recommended set and possibly as the primary. Worth re-evaluating against Vidu and Kling on the same scene to confirm.

## Cost and time profile (Scene C bakeoff)

- ChatGPT stills (4 frames): $0 (existing subscription), ~30 minutes including iteration
- Pika 2.5 morphs (3 clips × 8s): free tier coverage, ~30 minutes including queue waits
- Total: ~60 minutes, $0 incremental cost
- Output: ~24 seconds of continuous-feeling AI-illustrated video

This is the cost/time profile to expect for production. A typical Philosopher's Lens episode budgeting 2-3 long scenes at ~24-40s each = 6-12 morph clips, ~2-4 hours of generation work, $0-5 in API costs.

## Open questions for future bakeoffs

1. **Vidu Q1 vs Pika 2.5 on the same chain.** The field report claimed Vidu's 7-image reference-to-video would handle the all-in-one chain better than pairwise approaches. Untested on Parallax aesthetic. Run as parallel test on Scene C or next scene.
2. ~~**Camera-move morphs** (push-in, pan, dolly) vs static-camera world-resolves. Scene C tested only static camera. Thread A (RAND interior journey) tests camera-move morphs and is the next high-value bakeoff.~~ **RESOLVED May 21, 2026: camera-move morphs FAIL.** A camera move is a *reframe*, not a transform — morphing two independently-generated frames of the same scene smears all fine detail. Use Ken Burns (camera motion on a single still) or a live still (subject motion on a single still) instead. See "The three-tool model."
3. **5-frame chains.** Scene C was 4 frames. Does drift accumulate noticeably at 5+ frames? Practical ceiling untested.
4. **Text-on-surface morphs.** Scene C deliberately avoided text in middle frames. Thread A's chalkboard scene puts text dead-center. Will text scramble through Pika 2.5 morphs the way it does in older models?
5. **Audio-bed integration.** Is there a music/SFX architecture that helps a chained morph read as one shot vs. three? See research prompt #1 (audio architecture) when results return.

## Pipeline docs that need updating

The following docs should be revised to reflect these findings. Listed in priority order:

1. ~~**`AI_VIDEO_PIPELINE.md`** — currently references Recraft → Pika 2.2 as the canonical path. Update to: ChatGPT (with 4-anchor uploads + morph-aware discipline) → Pika 2.5 (with stability-verb motion prompts + smoke/particle negatives). Note the empirical bakeoff result.~~ **DONE May 9, 2026.** New Step 3.5 (Chained Still Morph Workflow) added; Tool Selection reframed around two-axis model with Pika 2.5 as primary for chains; Reference Frame Generation updated to add ChatGPT as primary for chains. Pipeline doc and lessons doc are now in sync; this lessons doc remains the canonical source for the per-failure-mode discipline rules.
2. ~~**`SCRIPT_FORMAT.md`** — extend the two-column format to support multi-frame scene blocks. The Pixar emotional-beat outline + 7-column shot list conventions from the field report (`research/2026-05-chained-video-generation.md` §4) are the recommended adoptions.~~ **DONE May 9, 2026.** New `[SCENE:]` mode tag added with full block syntax, scene spec file template, downstream flow documentation, and pacing rules (max 3 per episode, max 1 per beat). Asset Summary Table updated with SCENE row. Script-audit checks for SCENE blocks documented inline in the new section.
3. ~~**`VISUAL_LANGUAGE.md`** — add the 60s atmospheric-stretch pacing rule with three guardrails (continuous narration, visual change every 15-20s, ends on analytical re-engagement).~~ **DONE May 9, 2026.** New "Sustained Atmospheric Stretches" subsection added under Pacing. Three guardrails encoded. Per-episode budget set at 1-3 sustained stretches. Consecutive-AI-GEN fatigue rule updated to exempt frames within a [SCENE:] block.
4. **`RESEARCH_LOG.md` §12** — update the bakeoff status from "design proposal" to "empirically validated on Scene C." **DONE May 9, 2026.**

## Bakeoff log

| Date | Scene | Tool stack | Result | Notes |
|---|---|---|---|---|
| 2026-05-09 | prisoners-dilemma Scene C (Beat 3 opening) | ChatGPT + Pika 2.5 | **PASS** with one fix | Pair 1 (A→B) clean, Pair 3 (C→D) wonderful, Pair 2 (B→C) had smoke artifact from "lift" verb — fix documented above; regen pending. All three are *transforms* (grid→table→room) — consistent with the three-tool model. |
| 2026-05-21 | prisoners-dilemma Thread A 01 → 01b (dolly-in to tally grid) | Start+end-frame morph | **FAIL** | Detail-smear: tally marks slid/multiplied/dissolved. Diagnosed as reframe-done-as-morph. Reworked as Ken Burns push + insert cut (`development/morph-tests/threadA-01-REWORK-hardcut.mp4`) — clean. Established the three-tool model. |

(Append future bakeoffs here.)
