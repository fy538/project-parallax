# Scene: cooperation-arc

> Beat 4 close. The Ostrom caveat as a sustained atmospheric stretch — terraced commons → stone-walled alpine pasture → boundless ocean — visualizing the script's claim that Ostrom's principles work at community scale but fail where boundaries are unclear. The hero morph is alpine → ocean: the moment "boundedness vanishes."
>
> Block: 3 frames over ~26s · register=grounding · arc=tonal · emotional arc: rooted → extended → unmoored
>
> **Hero morph:** Frame B (alpine) → Frame C (ocean). Visualizes the channel's signature analytical move (bounded analogy: useful here, breaks there) at the visual layer. Stone walls and sheep dissolve into open ocean horizon, encoding the script's caveat in the morph itself.
>
> Reuses existing assets for Frames A and C. Only Frame B (aigen-12a alpine) needs new generation. Source: extends the v6 visual-thread-design.md "Thread E — Cooperation Arc" with first-class [SCENE:] block encoding.

## Camera & continuity

- **Camera arc:** Tonal — environment changes, camera role consistent. Slow drift across landscape throughout. No camera moves more aggressive than gentle dolly/tilt; environmental morphs do the visual work.
- **Lighting direction:** Warm overhead amber wash throughout. Frame A (terraces) has warm sun across stepped fields; Frame B (alpine) has same warm light filtered through sparser atmosphere; Frame C (ocean) has same warm light on horizon — directional source consistent across all three.
- **Palette pinned:** ink `#1C1814`, amber `#E5A544`, bone `#F0E6D0`, with walnut and grey-green earth tones allowed. Ocean introduces grey-blue tint at edges (per existing aigen-13) but warm tones dominate.
- **Style anchor:** 4 episode reference images (the same set used for the original 17-shot prisoners-dilemma generation, attached at the top of the ChatGPT conversation per `chatgpt-prompts.md`).

## Continuation message (paste once at start of ChatGPT scene conversation)

```
We're going to generate one new still that bridges two existing stills (aigen-12 terraced farmland and aigen-13 ocean vastness) into a 3-frame morph chain. The new frame is "Frame B — alpine commons" and it sits between them.

The 4 episode reference images already attached at the top of this conversation continue to anchor the style — same constructivist editorial aesthetic, same warm palette, same figure stylization.

Frame B needs to be morph-compatible with BOTH Frame A (terraced farmland — same agricultural landscape vocabulary, cooperative figures, warm light) AND Frame C (ocean vastness — same horizon-dominant composition, same warm sky). Frame B is the visual bridge: stone-walled alpine pasture as a "between" commons — still bounded like Frame A, but with the open horizon and atmospheric perspective that prefigures Frame C.

Discipline:
- Same warm overhead amber lighting across all three frames.
- Same palette: ink #1C1814, amber #E5A544, bone #F0E6D0, walnut/green-grey earth tones, no saturated colors.
- Constructivist editorial style — bold color-blocked forms, no gradients, no soft shading, no photoreal texture, no Cyrillic.
- Composition: horizon roughly mid-frame (matches Frame A and C). Stone walls visible (community-scale boundedness). Cooperative figures present but small (consistent with Frame A scale).
- The morph-from-A direction: terraced fields give way to higher-altitude pasture as camera drifts upward.
- The morph-toward-C direction: stone walls become less continuous toward edges; mountain peaks fade toward horizon; we can sense the openness that's coming.
```

---

## Frame A — Terraced farmland (REUSE EXISTING)

**Production filename:** `aigen-cooperation-arc-A.png` (current existing file: `aigen-12-terraced-farmland.png`)
**Status:** ✅ Existing asset. No regeneration needed.
**Description:** Constructivist terraced farmland — geometric stepped hillside with angular irrigation channels, small cooperative figures working at different levels, warm amber light across terraces, color-blocked in bone and green-grey.

If aigen-12 needs regeneration for tighter morph compatibility (test the chain first to find out), fall back to a fresh generation using the prompt from `shot-list.json` line for aigen-12.

---

## Frame B — Alpine commons (NEW)

**Production filename:** `aigen-cooperation-arc-B.png`
**Upload:** `aigen-12-terraced-farmland.png` (Frame A) + `aigen-13-ocean-vastness.png` (Frame C). The 4 episode style references already in this conversation continue to anchor the style.

```
Frame B. A stone-walled alpine pasture — Swiss-style mountain commons. Same warm overhead amber lighting as the two uploaded reference frames (Frame A: terraced farmland; Frame C: ocean vastness). Same palette: ink #1C1814, amber #E5A544, bone #F0E6D0, with walnut and grey-green earth tones for the meadow and stone, allowed grey-blue tint in the distant atmosphere.

Composition: a sloped alpine meadow filling most of the frame. Low stone walls divide the meadow into pasture lots — these walls are the visual signal of "community-scale boundedness." A few small stone shelters dot the slope. Abstract sheep as small geometric color-blocked forms scattered across the meadow. One or two small cooperative figures in the mid-distance tending the sheep or repairing a wall, rendered in the same constructivist style as Frame A's farmers — angular, color-blocked, faceless, small relative to the landscape.

Distant peaks rise behind the meadow but with atmospheric perspective — they fade toward the horizon, hazier than Frame A's terrain. The horizon is roughly mid-frame, matching Frame A and Frame C.

Critical for the morph chain:
- Same warm amber light direction as Frames A and C
- Stone walls are visible but not architectural — they should feel ancient, weathered, naturally part of the landscape
- The composition prefigures Frame C: the eye should rest on the horizon, with the mountains and stone walls reading as "the last bounded thing" before openness

No text. No buildings other than the small stone shelters. No camera or lens artifacts. 16:9 landscape. Don't introduce anything I didn't ask for.
```

---

## Frame C — Ocean vastness (REUSE EXISTING)

**Production filename:** `aigen-cooperation-arc-C.png` (current existing file: `aigen-13-ocean-vastness.png`)
**Status:** ✅ Existing asset. No regeneration needed.
**Description:** Constructivist ocean vastness — endless geometric waves as repeating angular forms stretching to horizon, no boundaries visible, tiny boat as single dot, overwhelming scale, color-blocked in ink and bone with grey-blue tint.

If aigen-13 needs regeneration for tighter morph compatibility, fall back to a fresh generation using the prompt from `shot-list.json` line for aigen-13.

---

## Morph A → B (terraces extend to alpine commons)

- **Tool:** Pika 2.5 (start+end frame, 1080p)
- **Duration:** 8s
- **Risk:** MEDIUM — cross-environment morph (cultivated terraces → mountain pasture). Both have cooperative figures and warm lighting; the terrain transformation is the load-bearing change.

**Motion prompt:**
```
Camera holds steady, gentle drift upward as if rising slightly above the landscape. Terraced fields in foreground extend and resolve into stone-walled alpine meadow as the camera elevates. Stepped irrigation channels yield to natural slope. Distant mountains hold position — same range, same warm amber light. Cooperative figures remain present in the mid-distance but at slightly different scale matching the new terrain. No camera pan, no abrupt move.
```

**Negative prompt:**
```
-neg flicker, morphing, warping, smoke, dust, particles, atmospheric haze, fog, mist, rising elements, fire, steam, text drift, watermark, jitter, mountain shift, palette change, photoreal texture, abrupt camera move, figure walking, figure dancing, animal motion, anime style
```

---

## Morph B → C (alpine commons dissolves into ocean — HERO MORPH)

- **Tool:** Pika 2.5 (start+end frame, 1080p)
- **Duration:** 10s
- **Risk:** HIGH — environmental morph across major terrain change (alpine pasture → ocean). The "boundedness vanishing" visual carries the script's caveat. Worth running 2-3 attempts and selecting the best.

**Motion prompt:**
```
Camera holds steady, gentle drift forward as if the landscape is opening before the viewer. Stone walls of the alpine meadow lose continuity and dissolve toward the edges — boundaries fading rather than breaking. Mountain peaks recede into atmospheric distance and resolve into open horizon. Sheep and cooperative figures fade from the foreground; meadow surface transitions through a grey-blue tint into rolling ocean waves. Single distant boat appears at horizon as the only remaining figure. Same warm amber light overhead throughout. No abrupt cuts. No particle effects.
```

**Negative prompt (extended for hero morph):**
```
-neg flicker, morphing, warping, smoke, dust, particles, atmospheric haze, fog, mist, rising elements, fire, steam, text drift, watermark, jitter, abrupt transition, snap-cut, palette change, photoreal texture, anime style, multiple boats, figure crowd, animal swarm, ghost figures, double exposure, sudden zoom, camera shake
```

**Production note:** This is the editorially most important shot in the new pipeline. Run multiple attempts — recommended 3-4 — and pick the best. Look specifically for:
- Stone walls dissolving smoothly (not popping out of frame)
- No ghosts of sheep persisting in the ocean frame
- The transition through grey-blue should feel atmospheric, not like a wipe
- The boat should resolve cleanly at horizon, not appear abruptly

If all attempts fail to produce the smooth dissolve, fall back options in order:
1. Try Vidu Q1 reference-to-video with all 3 frames as references in a single 5s clip — the all-in-one approach may handle the environmental morph better than pairwise.
2. Hard cut between aigen-12a alpine and aigen-13 ocean with a brief color-wash transition. The script's "boundaries are unclear" line lands on the cut. Less elegant but editorially acceptable.

---

## NLE assembly notes

- **Hard cuts between morph clips.** No transitions inside the chain. The morph IS the transition.
- **Scene-entry transition** (from prior MG into Frame A): per script `DIR: cut(dissolve)` — soft dissolve from the KineticTypography "Cooperation isn't a miracle. It's designed." card into the terraced commons.
- **Scene-exit transition** (from Frame C into next visual): scene ends Beat 4. Beat 5 opens with `TitleTransition · "YOUR GAME"` so the scene exits via a beat-boundary transition (fade through bone or ink, 400-600ms per VISUAL_LANGUAGE.md transition grammar).
- **Color-grade snap pass** in DaVinci/Resolve: sample dominant amber and ink hex from Frame A, apply snap-to-canonical to all three clips. Especially important for the hero morph — palette drift on the alpine→ocean transition would weaken the "boundedness vanishing" effect.
- **Treatment pass:** standard LUT + grain (~6-8% per CHAINED_STILL_LESSONS.md) + vignette via `tools/brand-treatment/treat_video.py` after assembly. The ocean caveat could justify slight grain bump (~10%) to read as "older / more weathered" but standard treatment should suffice.

## Narration mapping

The scene plays under the Ostrom caveat narration. Frame timing approximate:

| Frame / Clip | Duration | Narration over it |
|---|---|---|
| Frame A (terraced, hold) | ~3s | "One important caveat. Ostrom's cases are mostly community-scale —" |
| Morph A → B | 8s | "...identifiable people, clear boundaries, face-to-face relationships." |
| Frame B (alpine, hold) | ~2s | (brief beat) |
| Morph B → C (HERO) | 10s | "The global climate commons and oceanic fisheries resist her principles precisely because boundaries are unclear and monitoring is expensive." |
| Frame C (ocean, hold) | ~3s | "The PD isn't wrong about everything. But it's wrong about most of the things we've been applying it to." |

Total scene duration: ~26 seconds. Narration runs ~28-30 seconds, scene exits a beat or two before narration ends — beat-boundary transition into Beat 5 carries the residual narration.

## Asset locations (current → production)

| Frame/Clip | Current location | Production location (target) |
|---|---|---|
| Frame A | `assets/stills/aigen-12-terraced-farmland.png` | `assets/stills/aigen-cooperation-arc-A.png` (rename) |
| Frame B | (regen pending — generate new) | `assets/stills/aigen-cooperation-arc-B.png` |
| Frame C | `assets/stills/aigen-13-ocean-vastness.png` | `assets/stills/aigen-cooperation-arc-C.png` (rename) |
| Morph A→B | (regen pending) | `assets/clips/aigen-cooperation-arc-AB.mp4` |
| Morph B→C (HERO) | (regen pending) | `assets/clips/aigen-cooperation-arc-BC.mp4` |

**Existing aigen-12 Hailuo clip and aigen-13 Hailuo clip are SUPERSEDED by this scene block.** The Hailuo single-shot animations of terraces (~6s) and ocean (~6s) get replaced by the chained-morph clips. Keep the original clips in `assets/clips/` as backup; remove from `PrisonersDilemmaShowcase.tsx` sequence.

## Test sequence (recommended)

1. Generate Frame B (aigen-12a alpine) in ChatGPT with the prompt above and Frame A + Frame C uploaded as references.
2. Verify the 3-up grid: do all three frames look like the same world at the same moment? If Frame B's lighting or palette has drifted, regenerate before proceeding.
3. Run Morph A → B (terraces → alpine) on Pika 2.5. Single attempt likely sufficient.
4. **Run Morph B → C (alpine → ocean) — HERO — 3-4 attempts**. Pick the cleanest dissolve.
5. NLE-assemble the 3 clips with hard cuts, color-grade snap, treatment pass.
6. Watch the assembled ~26s scene against the script's Ostrom-caveat narration. Does the hero morph land at "boundaries are unclear"? If timing is off, adjust morph durations.
7. If the hero morph fails after 4 attempts on Pika 2.5, escalate to fallback options in order (Vidu Q1, hard cut).
