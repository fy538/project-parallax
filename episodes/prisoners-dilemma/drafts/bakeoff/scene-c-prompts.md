# Bakeoff — Scene C (The Capture) — 4-Frame Morph Chain

> First test of chained-still morph workflow. Generates 4 stills in sequence intended to be animated as 3 morph clips for ~24–30s of continuous video.
>
> Scene maps to Beat 3 opening: "The Prisoner's Dilemma isn't just mislabeling the world. It's remaking the world in its own image."
>
> Camera: eye-level, static position throughout. World resolves; viewpoint does not.
>
> Generated: May 9, 2026.

## What this is testing

1. **Morph-aware prompting discipline** — whether prompts that explicitly state camera position, what hasn't changed, and pinned palette produce more morph-friendly stills than morph-naive prompts.
2. **Multi-anchor reference uploads** — whether uploading two prior frames (not just one) bounds drift better through the chain.
3. **Geometric-morph viability** — whether ChatGPT-generated constructivist stills morph cleanly when the only changes are geometric (Frames A→B, B→C) and whether figure introduction (Frame C→D) is morphable or needs to land on a hard cut.

## The chain

| Frame | What it shows | Anchor uploads |
|---|---|---|
| A | Grid projected on landscape | Episode style refs only |
| B | Grid tightened, landscape more captured | Frame A + style refs |
| C | Gridlines form a table at convergence | Frame A + Frame B + style refs |
| D | Resolved negotiation room with figures arriving | Frame A + Frame C + style refs |

## Continuation message (paste once before generating Frame A)

> Run this in the **same ChatGPT conversation** that already has the 4 episode reference images attached at the top (the same conversation used for the original 17-shot generation in `chatgpt-prompts.md`). Those 4 references stay the canonical style anchor for the bakeoff.
>
> If you're starting a fresh conversation for any reason, re-attach the 4 episode reference images first, then paste this continuation message.

```
We're going to test a 4-frame morph chain in this same conversation, building on the same style established by the 4 episode reference images already attached at the top of this conversation. Those 4 references continue to be the canonical visual anchor for every frame I'm about to ask for — same constructivist editorial aesthetic, same warm palette, same figure stylization, same brushwork and grain. Treat them as the style source for ALL 4 new frames; do not drift toward a different style even if a prior generated frame in this conversation suggests one.

I'll generate the 4 new frames one at a time. Each frame after the first will reference one or two prior generated frames I'll upload alongside the prompt — but those uploads are for COMPOSITIONAL continuity (same camera position, same lighting, same world). The 4 episode references remain the STYLE source throughout.

The 4 frames need to chain together so they can be animated as morph clips later — meaning each adjacent pair needs to share composition, lighting direction, and palette tightly enough that a video model can interpolate between them without warping.

Discipline:
- Camera position is FIXED across all 4 frames. Eye-level. Same focal area in every frame.
- Lighting direction is FIXED. Amber wash from above-left throughout.
- Palette is locked to: ink #1C1814, amber #E5A544, bone #F0E6D0, with walnut accents allowed where natural.
- When I describe what changes between frames, only that thing should change. Don't introduce new elements I didn't ask for.
- Style stays anchored to the 4 episode reference images — bold color-blocked forms, no gradients, no soft shading, no photoreal texture, no Cyrillic or Russian text anywhere.

The first frame is the anchor for the chain. Generate it from the 4 episode style references alone — no additional uploads needed for Frame A.
```

---

## FRAME A — Landscape with grid projection

**Upload:** None additional. The 4 episode style references already at the top of this conversation are the style anchor.

```
Frame A. Eye-level view across a wide landscape: distant mountains on the horizon, mid-ground hills, foreground meadow. From above and behind the camera, a geometric grid is being projected onto the land — like a spotlight beam, but rectilinear. Where the grid touches the ground, the terrain is starting to flatten into rectangular fields and straightened rivers — but still organic at the edges of frame. No figures. No buildings. No text. The grid lines are amber on the ink-and-bone landscape. Color-blocked, no gradients. Lighting from above-left, amber wash. Constructivist editorial style. Palette: ink #1C1814, amber #E5A544, bone #F0E6D0, walnut accents allowed. 16:9 landscape.
```

---

## FRAME B — Grid tightens and dominates

**Upload:** Frame A. (The 4 episode style references already in this conversation continue to anchor the style — no need to re-upload them.)

```
Frame B. Same eye-level view as the uploaded Frame A. CAMERA POSITION UNCHANGED. Same horizon line, same mid-ground hills, same foreground meadow. Same lighting direction (above-left, amber wash). Same palette: ink #1C1814, amber #E5A544, bone #F0E6D0.

What has changed — and ONLY this: the projected grid has tightened and intensified. Gridlines are sharper, more rigid, spaced more tightly. The landscape under the grid has resolved further into geometric shapes — more rectangular fields, more straightened rivers — while the very edges of the frame remain organically curved. The grid is denser; the terrain underneath is the same terrain, just more captured by the grid.

What has NOT changed: the horizon, the camera angle, the lighting, the palette, the edges of frame. No figures, no buildings, no text. Don't introduce anything I didn't ask for. 16:9 landscape.
```

---

## FRAME C — Table forms at convergence

**Upload:** Frame A + Frame B. (The 4 episode style references already in this conversation continue to anchor the style.)

```
Frame C. Same eye-level view as the uploaded frames. CAMERA POSITION UNCHANGED. Same horizon line. Same lighting direction (above-left). Same palette: ink #1C1814, amber #E5A544, bone #F0E6D0.

What has changed: at the convergence point of the gridlines — mid-frame, slightly below center — the gridlines have resolved into the rectangular outline of a stylized table. Geometric, austere, clean edges. The table emerges FROM the existing gridlines (the gridlines that were there in Frame B are now the table's edges) — it is not placed onto the landscape. Around the table, the gridlines closer to it are starting to suggest interior architecture: faint vertical lines at the left and right edges of frame, like wall corners beginning to coalesce. The horizon is still visible but the foreground has become more interior than landscape.

The table is amber with ink shadow underneath. The walls-forming are barely there — implied, not solid.

Still no figures. Still no text. Still no buildings other than the implied walls. Lighting unchanged. 16:9 landscape.
```

---

## FRAME D — Negotiation room resolved, figures arriving

**Upload:** Frame A + Frame C. (Skip B — C is closer in composition to D. The 4 episode style references already in this conversation continue to anchor the style.)

```
Frame D. Same eye-level view as the uploaded frames. CAMERA POSITION UNCHANGED. The far horizon of Frame A is now the far wall of the room. Same lighting direction (above-left, now reading as overhead room lighting). Same palette: ink #1C1814, amber #E5A544, bone #F0E6D0.

What has changed: the room has fully resolved. The table from Frame C is now central in a clean geometric interior — walls have coalesced from the gridded landscape, floor is a flat plane, ceiling implied above. The "landscape" is gone; the world has become a room.

Two angular figures in dark suits have appeared at opposite ends of the table, standing (not seated). Their poses are symmetric; they face each other across the table. The figures are constructivist style: angular, color-blocked in ink with bone accents on shirt collars, faceless (eyes obscured by hat brim or visor shadow, no skin detail, no rendered features). They are small relative to the room — the architecture dominates.

The table is amber. The walls are bone-on-ink. The figures are ink silhouettes. No text. No signs. No props on the table. Lighting unchanged. 16:9 landscape.
```

---

## After generating all 4 frames

1. Save as `aigen-bakeoff-scene-c-A.png` through `aigen-bakeoff-scene-c-D.png` in `episodes/prisoners-dilemma/bakeoff/stills/`.
2. Verify the chain in a 4-up grid: do all 4 frames look like the same world from the same viewpoint at the same moment-in-time? If frame N has different lighting, palette, or geometry from frame N-1, regenerate before moving to morph step.
3. Run morphs:
   - **Kling 3.0 chain (3 clips):** A→B at 8s, B→C at 8s, C→D at 8s. Hard cuts between clips in NLE.
   - **Vidu Q1 reference-to-video:** All 4 frames as references in a single call, output ~5s clip. Compare continuity vs. Kling chain.
4. Document outcomes in `bakeoff/scene-c-results.md`:
   - Which prompts honored the discipline (camera fixed, palette pinned, no extra elements)? Which drifted?
   - Did multi-anchor uploads reduce drift vs. single-anchor (Frame B vs. Frame C, both got a different number of anchors)?
   - Did the C→D figure-introduction morph work, or does it need a hard cut?
   - Which morph tool produced more continuous-feeling output?
5. Write up lessons in `tools/recraft/CHAINED_STILL_LESSONS.md` (new file). This becomes the prompting-discipline doc for all future episodes.
