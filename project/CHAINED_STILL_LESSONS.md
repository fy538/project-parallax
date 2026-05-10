# Chained Still + Video Generation — Lessons Learned

> Empirical findings from running multi-still scene morphs on the Parallax constructivist aesthetic. Living document — append as bakeoffs accumulate.
>
> Source: prisoners-dilemma Scene C bakeoff (May 9, 2026). See `episodes/prisoners-dilemma/bakeoff/` for raw materials.
>
> Last updated: May 9, 2026.

## TL;DR

Chained-still-morph video generation works on the Parallax constructivist aesthetic — empirically validated on a 4-frame scene. The prompting discipline matters more than the tool choice. Specifically:

- **Tool stack that works (May 2026):** ChatGPT image generation for stills (4-anchor reference upload, sequential generation, morph-aware prompts) + Pika 2.5 for image-to-video morphs (start+end frame mode, 8s clips).
- **The technique survives figure introduction.** A morph that introduces faceless constructivist figures resolved cleanly — contradicting the prior assumption that figure-introduction needs a hard cut.
- **The field report's tool recommendations are partially wrong for this use case.** The May 2026 research called Pika 2.2 the lowest-quality option; Pika 2.5 (which postdates the report or was missed) produced the bakeoff's best results. Vidu Q1 + Kling 3.0 may still be worth testing but should not be assumed superior.

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
2. **Camera-move morphs** (push-in, pan, dolly) vs static-camera world-resolves. Scene C tested only static camera. Thread A (RAND interior journey) tests camera-move morphs and is the next high-value bakeoff.
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
| 2026-05-09 | prisoners-dilemma Scene C (Beat 3 opening) | ChatGPT + Pika 2.5 | **PASS** with one fix | Pair 1 (A→B) clean, Pair 3 (C→D) wonderful, Pair 2 (B→C) had smoke artifact from "lift" verb — fix documented above; regen pending |

(Append future bakeoffs here.)
