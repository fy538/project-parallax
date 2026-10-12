# Motion Director — Phase 2a: Perception

> The perception step of the motion director (`project/MOTION_DIRECTOR_SPEC.md` §3A).
> A vision-capable agent reads each still and emits a structured record of the
> features the motion taxonomy keys on. **Perception only — no technique decisions here.**
> Output feeds Phase 2b (decision) and is human-skimmable for spot-checking.

## How to run

For each still in `episodes/<slug>/assets/stills/*.png` (skip `*copy*`, skip retired
shots per `shot-list.json`): open it with the `Read` tool and fill the record below from
what is *actually visible*. Report features, not opinions — do not pick a motion technique.

Write all records to `episodes/<slug>/development/still-analysis.json`.

## Per-still record schema

```jsonc
{
  "shot_id": "aigen-01",
  "faces":   { "count": 0, "max_scale": "close|mid|distant|none", "orientation": "front|profile|back|mixed|none" },
  "figures": { "count": 0, "scale": "close|mid|distant|none", "implied_action": "seated|walking|gesturing|working|standing|none" },
  "hands_or_partial_limbs": { "present": false, "action": "writing|pointing|reaching|none" },  // a disembodied hand/forearm is NOT a figure — record it here
  "depth":   { "structure": "one-point|layered|flat", "clear_layers": ["fg: ...", "bg: ..."] },
  "reflective_surfaces": [],          // glossy floor, water, glass — the things that warp worst
  "repeating_patterns": [],           // checkerboard, tiles, dense grids — crawl risk under motion
  "text_or_marks": [],                // matrices, tallies, signage — warp risk; blocks morph
  "ambient_elements": [],             // flame, smoke, clouds, foliage, spinning reels — cinemagraph candidates
  "resolution": { "width": 0, "needs_upscale_for_kenburns": false },   // true if width < 1920
  "dominant_subject_region": "center|left|right|upper|lower",
  "palette_on_brand": true,           // ink/amber/bone/walnut/grey-green only
  "named_elements": [],               // ★ GROUND TRUTH: every distinct thing ACTUALLY visible ("two figures walking", "empty table", "wall panels"). The motion prompt may name ONLY these — anything named that isn't here gets hallucinated in (the aigen-07 "papers" bug).
  "dynamic_action": { "present": false, "what": "sprint|big-gesture|mid-stride|reaching|none" },  // ★ figures frozen in high-energy poses → i2v warps limbs → BAD live-still candidate (prefer ken-burns / cinemagraph)
  "style_register": "faceted|painterly-regionalist|flat-vector|photoreal|other",  // ★ for continuity + style-drift detection
  "era": "contemporary|mid-century|primitive|ancient|timeless|other",             // ★ for continuity across cut/dissolve neighbours
  "perception_notes": "one line of anything notable the fields don't capture"
}
```

## Detection guidance for flat constructivist art

- **Faces:** count any face where eyes/brow/jaw planes are legible. A back-turned or
  sub-~3%-frame-height figure is `none` for faces even if a body is present. Be
  conservative — when unsure between mid and distant, call it mid (triggers head-hold downstream).
- **Reflective surfaces:** look for a mirror-image of above-floor content in the floor, or
  specular highlights. Matte checkerboard is NOT reflective; a glossy dark floor IS.
- **Repeating patterns:** flag any regular tiling/grid that fills a large frame area
  (checkerboard floors, coffered ceilings, dense tally fields) — these crawl if the frame moves.
- **Depth structure:** `one-point` = strong single-vanishing-point recession (corridors);
  `layered` = distinct fore/mid/back planes; `flat` = a surface seen head-on (a tabletop, a board).
- **Ambient elements:** only list things that *physically move in the world* (fire, water,
  cloud, foliage, machine reels) — these are the maskable cinemagraph candidates.
- **named_elements (★ the anti-hallucination ground truth):** list every distinct subject/
  object actually in the frame, in plain words, with its state ("two figures walking toward
  the table", "empty table", "rows of seated students, backs to camera"). Be literal — if
  there are no papers on the table, do not invent them. The downstream motion prompt is only
  allowed to reference items on this list; that is what kills the "papers appear" failure.
- **dynamic_action:** set `present: true` when figures are frozen in a high-energy pose —
  sprinting, lunging, a big arm swing, hands reaching mid-gesture. These warp under i2v, so
  they push the shot off live-still toward ken-burns or cinemagraph (Phase 2b decides; here
  you just flag it). A calm walk or a seated lean is NOT dynamic_action.
- **style_register / era:** name the rendering style (`faceted` = angular planes like the RAND
  office; `painterly-regionalist` = Benton/WPA muralist like the timber-raising; `flat-vector`
  = smooth flat fills, the under-modeled "fakish" look; `photoreal`; else `other`) and the
  period the scene reads as. These exist so Phase 2b can flag **continuity breaks** between
  shots that cut/dissolve into each other (the aigen-11 → 11b modern-painterly → ancient-
  faceted mismatch).

## What this step does NOT do
No `motion_technique`, no params, no seams. Those are Phase 2b, which consumes this file
plus the script beat + thread context and applies the hard gates from the spec.
