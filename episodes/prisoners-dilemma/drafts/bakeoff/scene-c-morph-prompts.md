# Bakeoff — Scene C Morph Prompts (Kling 3.0 + Vidu Q1)

> 3 Kling 3.0 morph clips + 1 Vidu Q1 reference-to-video. Generated from the 4 stills produced via `scene-c-prompts.md`.
>
> Stills are in: `episodes/prisoners-dilemma/bakeoff/stills/aigen-bakeoff-scene-c-{A,B,C,D}.png`
> Output clips go to: `episodes/prisoners-dilemma/bakeoff/clips/`
>
> Generated: May 9, 2026.

## The 3 morph pairs

| Pair | Frames | Risk | Why |
|---|---|---|---|
| 1 | A → B | LOW | Geometric tightening, mountains hold, no new elements. Warm-up clip. |
| 2 | B → C | MEDIUM — **hero test** | Table emerges from gridline convergence. If this morph works, the technique is validated. |
| 3 | C → D | HIGH | Landscape becomes interior + figures appear simultaneously. The figure-introduction test. |

## Kling 3.0 settings (for all 3)

- **Tier:** Kling 3.0 Standard or Pro (Pro recommended for style consistency)
- **Duration:** 8 seconds for all three (consistent within chain — easier to compare results)
- **Resolution:** 1080p
- **Mode:** Image-to-video with start frame + end frame
- **Motion intensity:** LOW (these are subtle world-change morphs, not action shots)

## Pair 1 — Frame A → Frame B

**Start frame:** `aigen-bakeoff-scene-c-A.png`
**End frame:** `aigen-bakeoff-scene-c-B.png`
**Duration:** 8s

```
Camera holds static. Foreground gridlines tighten and sharpen across the meadow. Meandering river bed straightens into a geometric path. Mountains and distant terrain hold position. No camera movement. No new elements appear.
```

Negative prompt:
```
-neg flicker, morphing, warping, text drift, watermark, jitter, mountain shift, palette change, photoreal texture, camera move, figure appearing, anime style
```

**What to watch for in the output:**
- Mountain silhouettes should hold steady through the clip
- River should straighten visibly but smoothly
- Palette should not drift (run a color picker on frame 1 and final frame — the dominant amber and ink hex codes should match)

## Pair 2 — Frame B → Frame C (HERO TEST)

**Start frame:** `aigen-bakeoff-scene-c-B.png`
**End frame:** `aigen-bakeoff-scene-c-C.png`
**Duration:** 8s

```
Camera holds static. At the vanishing point mid-frame, gridlines lift and resolve into the rectangular edges of a wooden table. Table emerges from the existing gridlines — table edges form where the lines converged. Mountains and gridded background hold position. No camera movement. No figures.
```

Negative prompt:
```
-neg flicker, morphing, warping, text drift, watermark, jitter, figure appearing, table moving, palette change, camera move, photoreal texture, anime style
```

**What to watch for in the output:**
- Does the table genuinely *emerge* from the gridlines (good) or *fade in on top* of the landscape (less good)?
- Do the mountains hold position?
- Does the table stop morphing when it reaches the final shape, or does it continue warping at frame 8?
- This is the clip that validates the whole approach. If it looks like one continuous shot, the pipeline works.

## Pair 3 — Frame C → Frame D (HIGH-RISK TEST)

**Start frame:** `aigen-bakeoff-scene-c-C.png`
**End frame:** `aigen-bakeoff-scene-c-D.png`
**Duration:** 8s

```
Camera holds static. The gridded landscape coalesces into a clean geometric interior — walls form from the edges of frame, ceiling implied above, mountains in distance fade and resolve into wall blocks. Outdoor amber light transitions into interior directional lighting from upper-left. Two angular faceless figures in dark suits resolve into visibility at opposite ends of the table — appearing as if they were always there, holding static pose once visible. Table holds central position throughout.
```

Negative prompt:
```
-neg flicker, morphing, warping, text drift, watermark, jitter, figure walking, figure shifting pose, figure dancing, palette change, camera move, photoreal texture, anime style, multiple figures, figure crowd
```

**What to watch for in the output:**
- Do the figures emerge cleanly or as ghost-smears? (This is the most likely failure mode.)
- Do the walls coalesce believably or pop in?
- Does the lighting shift cause flicker?
- Is the table position stable across the morph, or does it drift?
- **Run this clip 2-3 times and pick the best.** Kling has high variance on figure-introduction shots.

**If C → D fails on Kling:** the recovery options are (a) hard cut between C and D in NLE, (b) generate an intermediate Frame C2 (interior formed but no figures yet, splitting the change into two smaller morphs), or (c) run on Vidu Q1 instead and compare. Document which option lands.

---

## Parallel test — Vidu Q1 reference-to-video (single 5s clip, all 4 frames)

This is the second half of the bakeoff. Vidu's approach is fundamentally different from Kling: instead of pair-by-pair morphing, it accepts up to 7 reference images and renders one continuous clip that interpolates across all of them. We're testing whether this all-in-one approach handles the C→D transition better than Kling's chained-pair approach.

**References (in order):** Frame A, Frame B, Frame C, Frame D

**Settings:** 5s @ 1080p, Reference-to-Video mode, low motion intensity

**Prompt:**
```
A landscape transforms into a negotiation room. A geometric grid projected onto open land tightens, a wooden table emerges at the vanishing point, walls coalesce from the gridded landscape into a clean interior, two angular faceless figures in dark suits resolve at opposite ends of the table. Camera holds static throughout. Constructivist editorial illustration. Bold color-blocked forms. Ink, amber, and bone palette. No gradients, no photoreal texture, no anime aesthetic.
```

**What to watch for:**
- Does the 5s clip distribute the transitions evenly, or does one phase dominate?
- Does the C→D transition feel less abrupt than Kling's pair version?
- Does the all-in-one approach drift more on style consistency than the chained Kling approach?

---

## NLE assembly (after generating clips)

If the Kling chain succeeds (all 3 clips look continuous):
1. Drop A→B, B→C, C→D in sequence, no transitions between them. Hard cuts.
2. Run a color grade pass: pick the dominant amber and ink hex from Frame A, apply as snap-to in DaVinci/Resolve. This corrects palette drift across the chain.
3. Render the full ~24s sequence as a single mp4. This is your bakeoff output.

If Kling C→D fails but Vidu's all-in-one succeeds: the lesson is that figure-introduction morphs need Vidu's approach, not Kling's.

If both fail at C→D: regenerate Frame C2 (interior formed, no figures yet) using the prompt format from `scene-c-prompts.md`, run two morphs (C→C2 then C2→D), and update this doc with the new pair info.

---

## Documentation — what to capture

Create `scene-c-results.md` after running. Capture:

1. **Stills evaluation.** Were any of the 4 stills regenerated? How many attempts each?
2. **Per-pair results.** For each of the 3 Kling pairs and the 1 Vidu clip:
   - Number of generation attempts
   - Subjective rating: continuous-feeling shot? acceptable cut? failed?
   - Specific failures: palette drift, figure ghosting, geometry warp, mountain shift
   - Screenshots of the worst frame in each clip (the moment of maximum artifact)
3. **Time and cost.** Total minutes spent. API/credit cost. Tools that worked, tools that didn't.
4. **The verdict.** Is the chained-still-morph workflow viable for Parallax's aesthetic? What's the next experiment if not?

The results doc + the bakeoff stills + the rendered clips become the input to extending `SCRIPT_FORMAT.md` and creating `tools/CHAINED_STILL_LESSONS.md`.
