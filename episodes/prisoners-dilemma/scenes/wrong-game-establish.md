# Scene: wrong-game-establish

> Beat 3 opening. The script's "It's *remaking* the world in its own image" moment — visualizes the model's grip on reality as a 4-frame chained scene, where a geometric grid projected onto a landscape resolves into a stylized negotiation room with two figures arriving. The viewer sees the model literally constructing the scene it then occupies.
>
> Block: 4 frames over ~30s · register=grounding · arc=linear · emotional arc: dread → recognition → resignation
>
> Source: validated in the May 9, 2026 prisoners-dilemma Scene C bakeoff (`bakeoff/scene-c-prompts.md`, `bakeoff/scene-c-morph-prompts.md`). The bakeoff's 4 stills and 3 morph clips become the production assets for this scene, after the Pair 2 smoke fix (see Morph B → C below).

## Camera & continuity

- **Camera position:** Eye-level, fixed throughout. The world resolves around a fixed viewpoint; the camera does not move.
- **Lighting direction:** Above-left amber wash throughout. Frame D's interior shifts the wash to read as overhead room lighting, but the directional source remains constant.
- **Palette pinned:** ink `#1C1814`, amber `#E5A544`, bone `#F0E6D0`, with walnut accents allowed where natural.
- **Style anchor:** 4 episode reference images (the same set used for the original 17-shot prisoners-dilemma generation, attached at the top of the ChatGPT conversation per `chatgpt-prompts.md`).

## Continuation message (paste once at start of ChatGPT scene conversation)

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

## Frame A — Landscape with grid projection

**Production filename:** `aigen-wrong-game-establish-A.png` (current bakeoff file: `aigen-bakeoff-scene-c-A.png`)
**Upload:** None additional. The 4 episode style references already at the top of this conversation are the style anchor.

```
Frame A. Eye-level view across a wide landscape: distant mountains on the horizon, mid-ground hills, foreground meadow. From above and behind the camera, a geometric grid is being projected onto the land — like a spotlight beam, but rectilinear. Where the grid touches the ground, the terrain is starting to flatten into rectangular fields and straightened rivers — but still organic at the edges of frame. No figures. No buildings. No text. The grid lines are amber on the ink-and-bone landscape. Color-blocked, no gradients. Lighting from above-left, amber wash. Constructivist editorial style. Palette: ink #1C1814, amber #E5A544, bone #F0E6D0, walnut accents allowed. 16:9 landscape.
```

---

## Frame B — Grid tightens and dominates

**Production filename:** `aigen-wrong-game-establish-B.png`
**Upload:** Frame A. (The 4 episode style references already in this conversation continue to anchor the style.)

```
Frame B. Same eye-level view as the uploaded Frame A. CAMERA POSITION UNCHANGED. Same horizon line, same mid-ground hills, same foreground meadow. Same lighting direction (above-left, amber wash). Same palette: ink #1C1814, amber #E5A544, bone #F0E6D0.

What has changed — and ONLY this: the projected grid has tightened and intensified. Gridlines are sharper, more rigid, spaced more tightly. The landscape under the grid has resolved further into geometric shapes — more rectangular fields, more straightened rivers — while the very edges of the frame remain organically curved. The grid is denser; the terrain underneath is the same terrain, just more captured by the grid.

What has NOT changed: the horizon, the camera angle, the lighting, the palette, the edges of frame. No figures, no buildings, no text. Don't introduce anything I didn't ask for. 16:9 landscape.
```

---

## Frame C — Table forms at convergence

**Production filename:** `aigen-wrong-game-establish-C.png`
**Upload:** Frame A + Frame B. (The 4 episode style references already in this conversation continue to anchor the style.)

```
Frame C. Same eye-level view as the uploaded frames. CAMERA POSITION UNCHANGED. Same horizon line. Same lighting direction (above-left). Same palette: ink #1C1814, amber #E5A544, bone #F0E6D0.

What has changed: at the convergence point of the gridlines — mid-frame, slightly below center — the gridlines have resolved into the rectangular outline of a stylized table. Geometric, austere, clean edges. The table emerges FROM the existing gridlines (the gridlines that were there in Frame B are now the table's edges) — it is not placed onto the landscape. Around the table, the gridlines closer to it are starting to suggest interior architecture: faint vertical lines at the left and right edges of frame, like wall corners beginning to coalesce. The horizon is still visible but the foreground has become more interior than landscape.

The table is amber with ink shadow underneath. The walls-forming are barely there — implied, not solid.

Still no figures. Still no text. Still no buildings other than the implied walls. Lighting unchanged. 16:9 landscape.
```

---

## Frame D — Negotiation room resolved, figures arriving

**Production filename:** `aigen-wrong-game-establish-D.png`
**Upload:** Frame A + Frame C. (Skip B — C is closer in composition to D. The 4 episode style references continue to anchor the style.)

```
Frame D. Same eye-level view as the uploaded frames. CAMERA POSITION UNCHANGED. The far horizon of Frame A is now the far wall of the room. Same lighting direction (above-left, now reading as overhead room lighting). Same palette: ink #1C1814, amber #E5A544, bone #F0E6D0.

What has changed: the room has fully resolved. The table from Frame C is now central in a clean geometric interior — walls have coalesced from the gridded landscape, floor is a flat plane, ceiling implied above. The "landscape" is gone; the world has become a room.

Two angular figures in dark suits have appeared at opposite ends of the table, standing (not seated). Their poses are symmetric; they face each other across the table. The figures are constructivist style: angular, color-blocked in ink with bone accents on shirt collars, faceless (eyes obscured by hat brim or visor shadow, no skin detail, no rendered features). They are small relative to the room — the architecture dominates.

The table is amber. The walls are bone-on-ink. The figures are ink silhouettes. No text. No signs. No props on the table. Lighting unchanged. 16:9 landscape.
```

---

## Morph A → B (geometric tightening)

- **Tool:** Pika 2.5 (start+end frame, 1080p)
- **Duration:** 8s
- **Risk:** LOW — minor change, mountains hold, no new elements
- **Status (May 9, 2026):** ✅ Validated in bakeoff. Output clean.

**Motion prompt:**
```
Camera holds static. Foreground gridlines tighten and sharpen across the meadow. Meandering river bed straightens into a geometric path. Mountains and distant terrain hold position. No camera movement. No new elements appear.
```

**Negative prompt:**
```
-neg flicker, morphing, warping, smoke, dust, particles, atmospheric haze, fog, mist, rising elements, fire, steam, text drift, watermark, jitter, mountain shift, palette change, photoreal texture, camera move, figure appearing, anime style
```

---

## Morph B → C (table forms at convergence) — REGEN PENDING

- **Tool:** Pika 2.5 (start+end frame, 1080p)
- **Duration:** 8s
- **Risk:** MEDIUM — hero test. The table must emerge from gridlines, not fade in on top.
- **Status (May 9, 2026):** ⚠️ Initial bakeoff produced smoke artifact from "lift" verb. Regen with smoke fix below pending.

**Motion prompt (FIXED — May 9, 2026):**
```
Camera holds static. At the vanishing point mid-frame, the gridlines clarify and sharpen into the rectangular edges of a wooden table. Table edges form in place where the gridlines converged — no particles, no smoke, no rising elements. Mountains and gridded background hold position. No camera movement. No figures.
```

**Negative prompt (extended for smoke fix):**
```
-neg flicker, morphing, warping, smoke, dust, particles, atmospheric haze, fog, mist, rising elements, fire, steam, text drift, watermark, jitter, figure appearing, table moving, palette change, photoreal texture, camera move, anime style
```

**Why the change:** Original prompt used "lift and resolve" — Kling/Pika reads vertical-motion verbs literally and renders them as particle effects. Replaced with "clarify and sharpen" + explicit no-particles instruction in the prompt body + smoke/dust/particles/fog/mist in the negative prompt. See `project/CHAINED_STILL_LESSONS.md` Failure Modes table for the full discipline rule.

---

## Morph C → D (interior coalesces, figures arrive)

- **Tool:** Pika 2.5 (start+end frame, 1080p)
- **Duration:** 8s
- **Risk:** HIGH — landscape becomes interior + figures appear. Two compounding changes.
- **Status (May 9, 2026):** ✅ Validated in bakeoff. Output "wonderful" per Tiger's review — significantly better than predicted. The constructivist faceless-figure aesthetic is forgiving of figure-resolution morphs.

**Motion prompt:**
```
Camera holds static. The gridded landscape coalesces into a clean geometric interior — walls form from the edges of frame, ceiling implied above, mountains in distance fade and resolve into wall blocks. Outdoor amber light transitions into interior directional lighting from upper-left. Two angular faceless figures in dark suits resolve into visibility at opposite ends of the table — appearing as if they were always there, holding static pose once visible. Table holds central position throughout.
```

**Negative prompt:**
```
-neg flicker, morphing, warping, smoke, dust, particles, atmospheric haze, fog, mist, rising elements, fire, steam, text drift, watermark, jitter, figure walking, figure shifting pose, figure dancing, palette change, camera move, photoreal texture, anime style, multiple figures, figure crowd
```

**Production note:** Run 2-3 attempts and pick the best — figure introduction has high seed-to-seed variance even when the discipline is right.

---

## NLE assembly notes

- **Hard cuts between morph clips.** No transitions. The morph IS the transition; a fade creates double-transition stutter.
- **Scene-entry transition** (from prior visual into Frame A): per script `DIR: cut(iris, origin:center)` — iris-in from preceding KT card.
- **Scene-exit transition** (from Frame D into next visual): per script `DIR: cut(color-wash, ink)` — color-wash into the trap-mechanism GameBoard MG.
- **Color-grade snap pass** in DaVinci/Resolve: sample dominant amber and ink hex from Frame A, apply snap-to-canonical to all three clips. Corrects any palette drift across the chain.
- **Treatment pass:** standard LUT + grain (~6-8% per CHAINED_STILL_LESSONS.md, lighter than footage default) + vignette via `tools/brand-treatment/treat_video.py` after assembly.

## Asset locations (current → production)

| Frame/Clip | Bakeoff location (current) | Production location (target) |
|---|---|---|
| Frame A | `bakeoff/stills/aigen-bakeoff-scene-c-A.png` | `assets/stills/aigen-wrong-game-establish-A.png` |
| Frame B | `bakeoff/stills/aigen-bakeoff-scene-c-B.png` | `assets/stills/aigen-wrong-game-establish-B.png` |
| Frame C | `bakeoff/stills/aigen-bakeoff-scene-c-C.png` | `assets/stills/aigen-wrong-game-establish-C.png` |
| Frame D | `bakeoff/stills/aigen-bakeoff-scene-c-D.png` | `assets/stills/aigen-wrong-game-establish-D.png` |
| Morph A→B | `bakeoff/clips/aigen-bakeoff-scene-c-AB.mp4` | `assets/clips/aigen-wrong-game-establish-AB.mp4` |
| Morph B→C | (regen pending with smoke fix) | `assets/clips/aigen-wrong-game-establish-BC.mp4` |
| Morph C→D | `bakeoff/clips/aigen-bakeoff-scene-c-CD.mp4` | `assets/clips/aigen-wrong-game-establish-CD.mp4` |

Move/rename when assembling for final render.
