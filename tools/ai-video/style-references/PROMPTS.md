# Parallax — AI Video Style Reference Library

> Updated May 4-5, 2026: Migrated from photoreal-mannequin reference library to constructivist library, then expanded from 7 → 11 → 15 references through three calibration rounds (broader-family base, risk-mitigation, coverage completion). The prior versions are in git history. The current 15-reference library matches the unified constructivist aesthetic per VISUAL_LANGUAGE.md, AI_VIDEO_PIPELINE.md, and PROMPT_PREAMBLES.md.

## Purpose

These 15 reference images define the "Parallax AI-GEN look." Generate once via `python generate_style_refs.py --all` (uses Flux 2 Pro on fal.ai by default). Then reuse them as style anchors for Kling 3.0 / Seedance 2.0 / Sora 2 / Runway Gen-4 across all episodes. Each image locks a specific aspect of the constructivist aesthetic — facial planar simplification, realism dosage, scale, typography integration, cultural inflection.

The library covers three phases:
- **Phase 1 (refs 1-7):** foundational anchors — face standard, industrial scenes, atmospheric backdrop, intimate domestic, historical reconstruction, conceptual metaphor
- **Phase 2 (refs 8-11):** broader-family cultural anchors — Bauhaus educational, American mid-century modernist, Japanese Showa-era, Soviet Constructivist canonical
- **Phase 3 (refs 12-15):** coverage completion — Chinese traditional / classical, non-Soviet adversarial scene, multi-figure group dynamics, neutral channel default

**Workflow:** Generate canonical references → review each output → iterate until it matches the Parallax editorial feel → save as the canonical reference at the filenames below → feed to video generation tools as image references.

**Important:** After generating, run each through `treat.py` to verify the LUT pass produces clean Meridian-palette results. If the raw constructivist illustration fights the LUT (overly saturated, wrong color temperature), adjust the prompt.

**Tool selection note (post-May 4):** Flux 2 Pro is the script's default API but Recraft V3 may produce stronger constructivist outputs since it has native `vector_illustration` and `digital_illustration` styles calibrated for graphic illustration. Worth A/B testing during Phase 1. The fal.ai integration remains for hero P1 references where `realism: grounded` (photographic spatial detail) is the goal.

**API access for Flux 2 Pro:** Via fal.ai ($0.03/MP), DeepInfra, or BFL directly. Pay per image; ~$0.045 per 1920×1080 reference. Total library cost: ~$0.60 for all 15.

---

## Reference 1: Constructivist Face Study

**Locks:** The exact level of facial planar simplification across all grounded scenes.

**Filename:** `r1_constructivist_face.png`

**LUT primary:** standard

**Prompt:**
```
Editorial illustration in the Parallax 20th-century constructivist
tradition — drawing on the broader graphic-design family that spans
the Bauhaus design school (László Moholy-Nagy, Herbert Bayer),
American mid-century editorial modernism (Saul Bass, Push Pin Studios,
Charley Harper, Jim Flora, Paul Rand, Fortune magazine industrial-
modernism), British industrial modernism (E. McKnight Kauffer,
Edward Bawden), Japanese Showa-era graphic design (Yusaku Kamekura,
Ikko Tanaka), Soviet Constructivism (Alexander Rodchenko, El Lissitzky),
German political photomontage (John Heartfield), and 20th-century
industrial woodcut tradition (Frans Masereel). The base aesthetic is
the shared graphic discipline this family carries: bold compositional
confidence, color-blocked forms with no soft shading or gradients,
geometric clarity, restrained palette, editorial publication weight.
Restricted warm palette: deep ink (#1C1814), walnut (#5C4A3D),
umber (#8B7355), burnt amber and gold (#C4A747), rust (#A64D46),
and bone (#F0E6D0) on paper (#F5F0E8) background. No other colors.
Cultural specificity (Soviet Constructivist intensity, American
mid-century restraint, Chinese vermillion, Japanese Showa minimalism,
literati ink-wash) is supplied by the per-scene typography emphasis —
this base provides the neutral 20th-century editorial-illustration
grammar from which the cultural emphasis emerges. NOT photorealistic,
NOT 3D render, NOT cool blue or teal, NOT Adobe stock aesthetic,
NOT smooth featureless mannequin faces.

Close-up portrait of a figure rendered in the constructivist
vocabulary. Face composed of geometric facets — jaw plane, cheekbone
plane, brow plane — suggesting facial structure without realistic
detail. Eyes obscured by lens shadow from round eyeglasses or by hair
fall — never smooth blank surfaces. Hair simplified to color-blocked
shapes. Crisp white shirt collar visible at the bottom of frame,
color-blocked with no fabric texture. Subtle ambient backlight rim
defining the head's silhouette against a neutral umber background.
Mood: contemplative, intellectually rigorous. 16:9 aspect ratio.

Avoid: photorealism, 3D render, smooth featureless mannequin face,
realistic eyes, Adobe stock aesthetic.
```

**Key constraints:**
- Face must be PLANAR FACETED, not smooth — geometric jaw plane, cheekbone plane, brow plane
- Eyes MUST be obscured (lens shadow, hair fall, hat brim) — never visible
- This sets the "how stylized?" bar for all other figurative references
- Most distinctive single reference — should be the first one Tiger reviews after generation

---

## Reference 2: Cleanroom (Flat Constructivist)

**Locks:** The maximum graphic flatness aesthetic for monumentalist industrial scenes (`realism: flat`).

**Filename:** `r2_cleanroom_flat.png`

**LUT primary:** standard

**Prompt:**
```
Editorial illustration in the Parallax 20th-century constructivist
tradition — drawing on the broader graphic-design family that spans
the Bauhaus design school (László Moholy-Nagy, Herbert Bayer),
American mid-century editorial modernism (Saul Bass, Push Pin Studios,
Charley Harper, Jim Flora, Paul Rand, Fortune magazine industrial-
modernism), British industrial modernism (E. McKnight Kauffer,
Edward Bawden), Japanese Showa-era graphic design (Yusaku Kamekura,
Ikko Tanaka), Soviet Constructivism (Alexander Rodchenko, El Lissitzky),
German political photomontage (John Heartfield), and 20th-century
industrial woodcut tradition (Frans Masereel). The base aesthetic is
the shared graphic discipline this family carries: bold compositional
confidence, color-blocked forms with no soft shading or gradients,
geometric clarity, restrained palette, editorial publication weight.
Restricted warm palette: deep ink (#1C1814), walnut (#5C4A3D),
umber (#8B7355), burnt amber and gold (#C4A747), rust (#A64D46),
and bone (#F0E6D0) on paper (#F5F0E8) background. No other colors.
Cultural specificity (Soviet Constructivist intensity, American
mid-century restraint, Chinese vermillion, Japanese Showa minimalism,
literati ink-wash) is supplied by the per-scene typography emphasis —
this base provides the neutral 20th-century editorial-illustration
grammar from which the cultural emphasis emerges. NOT photorealistic,
NOT 3D render, NOT cool blue or teal, NOT Adobe stock aesthetic,
NOT smooth featureless mannequin faces.

Interior of a semiconductor fabrication cleanroom rendered in flat
constructivist composition. Three workers in white bunny suits with
reflective polycarbonate face shields, faces composed of geometric
facets behind the visors, eyes obscured by amber visor reflection.
FOUP wafer carriers in foreground rendered as color-blocked geometric
forms. Stacked machinery in background, monumentalist scale, low
horizon line. Bold heiti propaganda typography integrated diagonally:
'微米 — 我们的力量' (Micron — Our Strength) in red, '工业 · 精度 ·
技术' (Industry · Precision · Technology) in stacked black/red blocks.
Maximum graphic flatness, no photographic texture, all surfaces
suggested through palette planes. 16:9 aspect ratio.
```

**Key constraints:**
- `realism: flat` — color-blocked only, no photographic texture
- Chinese propaganda typography (chinese_propaganda) integrated into composition
- Workers' faces obscured by visor reflection — never smooth blank
- Monumentalist scale, propaganda-poster compositional dynamism

---

## Reference 3: Cleanroom (Grounded Constructivist)

**Locks:** The constructivist + photographic-spatial-detail combination for `realism: grounded` scenes.

**Filename:** `r3_cleanroom_grounded.png`

**LUT primary:** standard

**Prompt:**
```
Editorial illustration in the Parallax 20th-century constructivist
tradition — drawing on the broader graphic-design family that spans
the Bauhaus design school (László Moholy-Nagy, Herbert Bayer),
American mid-century editorial modernism (Saul Bass, Push Pin Studios,
Charley Harper, Jim Flora, Paul Rand, Fortune magazine industrial-
modernism), British industrial modernism (E. McKnight Kauffer,
Edward Bawden), Japanese Showa-era graphic design (Yusaku Kamekura,
Ikko Tanaka), Soviet Constructivism (Alexander Rodchenko, El Lissitzky),
German political photomontage (John Heartfield), and 20th-century
industrial woodcut tradition (Frans Masereel). The base aesthetic is
the shared graphic discipline this family carries: bold compositional
confidence, color-blocked forms with no soft shading or gradients,
geometric clarity, restrained palette, editorial publication weight.
Restricted warm palette: deep ink (#1C1814), walnut (#5C4A3D),
umber (#8B7355), burnt amber and gold (#C4A747), rust (#A64D46),
and bone (#F0E6D0) on paper (#F5F0E8) background. No other colors.
Cultural specificity (Soviet Constructivist intensity, American
mid-century restraint, Chinese vermillion, Japanese Showa minimalism,
literati ink-wash) is supplied by the per-scene typography emphasis —
this base provides the neutral 20th-century editorial-illustration
grammar from which the cultural emphasis emerges. NOT photorealistic,
NOT 3D render, NOT cool blue or teal, NOT Adobe stock aesthetic,
NOT smooth featureless mannequin faces.

Interior of a semiconductor fabrication cleanroom rendered in
grounded constructivist composition: planar figures with facial
facets and visor-obscured eyes, but environments rendered with more
photographic spatial detail (atmospheric perspective, material texture
on FOUP carriers and machinery, subtle floor reflections). Three
workers in bunny suits operating wafer-handling equipment, medium
shot from hip level, deeper spatial recession into background. Bold
heiti propaganda typography in red and gold integrated with machinery.
Constructivist DNA preserved — color-blocked figures, restricted
palette, graphic composition — but more spatial depth and material
grounding than the flat variant. 16:9 aspect ratio.
```

**Key constraints:**
- `realism: grounded` — same constructivist DNA as flat, but with spatial depth and material texture
- This is the most photographically immersive variant; use for restricted-facility reconstructions where presence matters
- Pair with Reference 2 to demonstrate the realism dosage spectrum

---

## Reference 4: Atmospheric Trap (Backdrop)

**Locks:** The Register 2 atmospheric backdrop language at low-opacity background usage.

**Filename:** `r4_atmospheric_trap.png`

**LUT primary:** standard

**Prompt:**
```
Editorial illustration in the Parallax 20th-century constructivist
tradition — drawing on the broader graphic-design family that spans
the Bauhaus design school (László Moholy-Nagy, Herbert Bayer),
American mid-century editorial modernism (Saul Bass, Push Pin Studios,
Charley Harper, Jim Flora, Paul Rand, Fortune magazine industrial-
modernism), British industrial modernism (E. McKnight Kauffer,
Edward Bawden), Japanese Showa-era graphic design (Yusaku Kamekura,
Ikko Tanaka), Soviet Constructivism (Alexander Rodchenko, El Lissitzky),
German political photomontage (John Heartfield), and 20th-century
industrial woodcut tradition (Frans Masereel). The base aesthetic is
the shared graphic discipline this family carries: bold compositional
confidence, color-blocked forms with no soft shading or gradients,
geometric clarity, restrained palette, editorial publication weight.
Restricted warm palette: deep ink (#1C1814), walnut (#5C4A3D),
umber (#8B7355), burnt amber and gold (#C4A747), rust (#A64D46),
and bone (#F0E6D0) on paper (#F5F0E8) background. No other colors.
Cultural specificity (Soviet Constructivist intensity, American
mid-century restraint, Chinese vermillion, Japanese Showa minimalism,
literati ink-wash) is supplied by the per-scene typography emphasis —
this base provides the neutral 20th-century editorial-illustration
grammar from which the cultural emphasis emerges. NOT photorealistic,
NOT 3D render, NOT cool blue or teal, NOT Adobe stock aesthetic,
NOT smooth featureless mannequin faces.

An interlocking industrial trap viewed from a low monumentalist
angle: massive factory complexes connected by tangled cable bundles
and pipe networks forming a closing net. Smaller silhouetted figures
inside the structure, dwarfed by scale. Smokestacks belching ribbons
of smoke that twist into the cable network above. Heavy contrast
between deep ink-black machinery and burnt amber accents on smoke
and pipes. Bold geometric forms, color-blocked, no shading.
Composition reads as background — figures are not the subject, the
system is. Mood: civilizational stakes, technological dread,
industrial ambition. 16:9 aspect ratio.
```

**Key constraints:**
- Atmospheric register — used as 30-40% opacity background behind narration
- `text_treatment: none` — purely visual, no signage
- Figures present only as silhouettes for scale, not as subjects
- Strong candidate for visual motif (per VIS-07) — could evolve across episode

---

## Reference 5: Domestic Intimate (Beijing Apartment)

**Locks:** The constructivist aesthetic at conversational human scale — proves the aesthetic isn't locked into monumentalist propaganda-poster.

**Filename:** `r5_domestic_intimate.png`

**LUT primary:** standard

**Prompt:**
```
Editorial illustration in the Parallax 20th-century constructivist
tradition — drawing on the broader graphic-design family that spans
the Bauhaus design school (László Moholy-Nagy, Herbert Bayer),
American mid-century editorial modernism (Saul Bass, Push Pin Studios,
Charley Harper, Jim Flora, Paul Rand, Fortune magazine industrial-
modernism), British industrial modernism (E. McKnight Kauffer,
Edward Bawden), Japanese Showa-era graphic design (Yusaku Kamekura,
Ikko Tanaka), Soviet Constructivism (Alexander Rodchenko, El Lissitzky),
German political photomontage (John Heartfield), and 20th-century
industrial woodcut tradition (Frans Masereel). The base aesthetic is
the shared graphic discipline this family carries: bold compositional
confidence, color-blocked forms with no soft shading or gradients,
geometric clarity, restrained palette, editorial publication weight.
Restricted warm palette: deep ink (#1C1814), walnut (#5C4A3D),
umber (#8B7355), burnt amber and gold (#C4A747), rust (#A64D46),
and bone (#F0E6D0) on paper (#F5F0E8) background. No other colors.
Cultural specificity (Soviet Constructivist intensity, American
mid-century restraint, Chinese vermillion, Japanese Showa minimalism,
literati ink-wash) is supplied by the per-scene typography emphasis —
this base provides the neutral 20th-century editorial-illustration
grammar from which the cultural emphasis emerges. NOT photorealistic,
NOT 3D render, NOT cool blue or teal, NOT Adobe stock aesthetic,
NOT smooth featureless mannequin faces.

Eye-level intimate scene in a 1980s Beijing apartment. A figure in
a dark wool suit and round eyeglasses seated at a small wooden
writing desk, reading a document under the warm amber light of an
Anglepoise-style desk lamp. Face rendered with constructivist planar
facets — jaw plane, cheekbone plane — eyes obscured by the round lens
shadow of the glasses. A traditional Chinese-style teacup with
botanical motif on the desk. Books stacked nearby, a fountain pen on
an open notebook. Window showing dark Beijing rooftop silhouettes.
Wall calendar with subtle Chinese signage ('北京日报', '一九八四年三月',
small scale, period-natural — chinese_minimal typography treatment).
Small framed photograph of Tiananmen on the wall. Bookshelf in
background. Restrained scale, contemplative composition, NOT
propaganda-poster monumentalist — this is the constructivist
tradition turned inward. 16:9 aspect ratio.
```

**Key constraints:**
- `realism: balanced` — works for most scenes including domestic
- `text_treatment: chinese_minimal` — period-natural Chinese signage only, no propaganda
- Eye-level, restrained composition — the test that the aesthetic doesn't force monumentalism
- This was the validating test case (May 4, 2026) — Tiger generated this and it confirmed the aesthetic has range

---

## Reference 6: Historical American (1941 Modernist)

**Locks:** The historical reconstruction mode + English Modernist typography.

**Filename:** `r6_historical_modernist.png`

**LUT primary:** editorial

**Prompt:**
```
Editorial illustration in the Parallax 20th-century constructivist
tradition — drawing on the broader graphic-design family that spans
the Bauhaus design school (László Moholy-Nagy, Herbert Bayer),
American mid-century editorial modernism (Saul Bass, Push Pin Studios,
Charley Harper, Jim Flora, Paul Rand, Fortune magazine industrial-
modernism), British industrial modernism (E. McKnight Kauffer,
Edward Bawden), Japanese Showa-era graphic design (Yusaku Kamekura,
Ikko Tanaka), Soviet Constructivism (Alexander Rodchenko, El Lissitzky),
German political photomontage (John Heartfield), and 20th-century
industrial woodcut tradition (Frans Masereel). The base aesthetic is
the shared graphic discipline this family carries: bold compositional
confidence, color-blocked forms with no soft shading or gradients,
geometric clarity, restrained palette, editorial publication weight.
Restricted warm palette: deep ink (#1C1814), walnut (#5C4A3D),
umber (#8B7355), burnt amber and gold (#C4A747), rust (#A64D46),
and bone (#F0E6D0) on paper (#F5F0E8) background. No other colors.
Cultural specificity (Soviet Constructivist intensity, American
mid-century restraint, Chinese vermillion, Japanese Showa minimalism,
literati ink-wash) is supplied by the per-scene typography emphasis —
this base provides the neutral 20th-century editorial-illustration
grammar from which the cultural emphasis emerges. NOT photorealistic,
NOT 3D render, NOT cool blue or teal, NOT Adobe stock aesthetic,
NOT smooth featureless mannequin faces.

1941 American government office reconstruction. A figure in a
double-breasted dark wool suit seated at a heavy wooden desk, hand
poised over an executive order document. Face rendered with
constructivist planar facets, eyes obscured by hat brim or downturned
head. Dark wood paneling, brass desk lamp casting warm pool of light,
side window with low-angle warm tungsten light streaming in,
period-accurate fountain pen and stacked papers. Other suited figures
standing at the edge of frame, faces equally simplified. American
midcentury modernist typography integrated: 'INDUSTRY · INNOVATION ·
ENTERPRISE' or 'THE AMERICAN CENTURY' in geometric sans-serif
(Push Pin / Saul Bass / Fortune-magazine modernism), bold color
blocks. Slightly desaturated palette suggesting Kodachrome-era film.
Mood: civilizational stakes, historical gravity, American
mid-century industrial confidence. Grounded realism dosage. 16:9
aspect ratio.
```

**Key constraints:**
- `realism: grounded` — more spatial detail and material grounding for the historical-reconstruction mode
- `text_treatment: english_modernist` — Push Pin / Saul Bass / Fortune typography
- LUT primary: `editorial` — desaturated, archival feel signals "reconstruction, not contemporary"
- Demonstrates the contextual-by-episode typography move on a Western scene

---

## Reference 7: Conceptual Corridor (Bifurcation)

**Locks:** The conceptual metaphor mode — physical-metaphor compositions for abstract concepts.

**Filename:** `r7_conceptual_corridor.png`

**LUT primary:** standard

**Prompt:**
```
Editorial illustration in the Parallax 20th-century constructivist
tradition — drawing on the broader graphic-design family that spans
the Bauhaus design school (László Moholy-Nagy, Herbert Bayer),
American mid-century editorial modernism (Saul Bass, Push Pin Studios,
Charley Harper, Jim Flora, Paul Rand, Fortune magazine industrial-
modernism), British industrial modernism (E. McKnight Kauffer,
Edward Bawden), Japanese Showa-era graphic design (Yusaku Kamekura,
Ikko Tanaka), Soviet Constructivism (Alexander Rodchenko, El Lissitzky),
German political photomontage (John Heartfield), and 20th-century
industrial woodcut tradition (Frans Masereel). The base aesthetic is
the shared graphic discipline this family carries: bold compositional
confidence, color-blocked forms with no soft shading or gradients,
geometric clarity, restrained palette, editorial publication weight.
Restricted warm palette: deep ink (#1C1814), walnut (#5C4A3D),
umber (#8B7355), burnt amber and gold (#C4A747), rust (#A64D46),
and bone (#F0E6D0) on paper (#F5F0E8) background. No other colors.
Cultural specificity (Soviet Constructivist intensity, American
mid-century restraint, Chinese vermillion, Japanese Showa minimalism,
literati ink-wash) is supplied by the per-scene typography emphasis —
this base provides the neutral 20th-century editorial-illustration
grammar from which the cultural emphasis emerges. NOT photorealistic,
NOT 3D render, NOT cool blue or teal, NOT Adobe stock aesthetic,
NOT smooth featureless mannequin faces.

A long industrial corridor that physically splits into two diverging
paths ahead, rendered in flat constructivist composition. The left
path is bathed in warm amber/gold and shows collaborative geometric
forms (shared tables, interconnected machinery) through stylized
glass walls. The right path is bathed in deep rust/ink and shows
isolated workstations separated by hard-edged barriers. At the split
point, a single figure stands in dark wool suit with planar
constructivist face, eyes obscured by hat brim — the figure is in
mid-stride, not gestural. Polished floor with directional expansion
joints converging to vanishing point at the corridor split.
One-point perspective, deep one-point composition. Bold
color-blocked forms, no soft shading. Mood: structural choice,
civilizational bifurcation, the moment before commitment. 16:9
aspect ratio.
```

**Key constraints:**
- Either atmospheric (background usage) or grounding (foreground figurative) — flexible role
- `realism: flat` — strongest as graphic metaphor, not photographic
- Locks the physical-metaphor approach for abstract concepts
- Bifurcation, encirclement, collapse, escalation — all variations of this template

---

## Reference 8: Bauhaus Educational

**Locks:** Bauhaus design-school discipline for educational / framework / philosophical scenes — Moholy-Nagy / Bayer compositional rigor.

**Filename:** `r8_bauhaus_educational.png`

**LUT primary:** standard

**Prompt:**
```
Editorial illustration in the Parallax 20th-century constructivist
tradition — drawing on the broader graphic-design family that spans
the Bauhaus design school (László Moholy-Nagy, Herbert Bayer),
American mid-century editorial modernism (Saul Bass, Push Pin Studios,
Charley Harper, Jim Flora, Paul Rand, Fortune magazine industrial-
modernism), British industrial modernism (E. McKnight Kauffer,
Edward Bawden), Japanese Showa-era graphic design (Yusaku Kamekura,
Ikko Tanaka), Soviet Constructivism (Alexander Rodchenko, El Lissitzky),
German political photomontage (John Heartfield), and 20th-century
industrial woodcut tradition (Frans Masereel). The base aesthetic is
the shared graphic discipline this family carries: bold compositional
confidence, color-blocked forms with no soft shading or gradients,
geometric clarity, restrained palette, editorial publication weight.
Restricted warm palette: deep ink (#1C1814), walnut (#5C4A3D),
umber (#8B7355), burnt amber and gold (#C4A747), rust (#A64D46),
and bone (#F0E6D0) on paper (#F5F0E8) background. No other colors.
Cultural specificity (Soviet Constructivist intensity, American
mid-century restraint, Chinese vermillion, Japanese Showa minimalism,
literati ink-wash) is supplied by the per-scene typography emphasis —
this base provides the neutral 20th-century editorial-illustration
grammar from which the cultural emphasis emerges. NOT photorealistic,
NOT 3D render, NOT cool blue or teal, NOT Adobe stock aesthetic,
NOT smooth featureless mannequin faces.

Bauhaus educational scene in the visual tradition of László
Moholy-Nagy and Herbert Bayer. A 1930s design studio interior:
two figures at large drafting tables examining geometric design
exercises. Faces composed of 4-5 color-blocked planes, eyes obscured
by lowered head reading or by round wire-rim glasses casting shadow.
Hands as flat color planes holding drafting tools. Walls feature
pinned geometric studies in primary color-blocks (red, yellow, blue
rendered as walnut/gold/umber in the Parallax warm-palette
translation), grid systems, typographic exercises. Restrained
Bauhaus-tradition palette.

PALETTE EMPHASIS: walnut (#5C4A3D), umber (#8B7355), gold (#C4A747),
bone (#F0E6D0), paper (#F5F0E8) — restrained educational discipline,
NOT propaganda intensity. COMPOSITIONAL EMPHASIS: orthogonal grid
alignment, balanced asymmetric layout, deliberate negative space,
hierarchy through size and placement.

Mood: design-school discipline, geometric universalism, 20th-century
European modernism. 16:9 aspect ratio.
```

**Key constraints:**
- 1930s design-studio scene with two figures at drafting tables
- Walls feature pinned geometric studies (Bauhaus exercises rendered in brand palette)
- Restrained Bauhaus palette (walnut/umber/gold/bone/paper) — NOT propaganda intensity
- Orthogonal grid alignment, balanced asymmetric layout, deliberate negative space
- Mood: design-school discipline, geometric universalism, 20th-century European modernism
- Used for: framework episodes, philosophical content, educational scenes, intellectual-tradition references

---

## Reference 9: American Modernist (Fortune Magazine)

**Locks:** American mid-century editorial design — Fortune magazine industrial-modernism, Saul Bass / Push Pin discipline. The default for contemporary American and Cold War American content.

**Filename:** `r9_american_modernist_fortune.png`

**LUT primary:** standard

**Prompt:**
```
Editorial illustration in the Parallax 20th-century constructivist
tradition — drawing on the broader graphic-design family that spans
the Bauhaus design school (László Moholy-Nagy, Herbert Bayer),
American mid-century editorial modernism (Saul Bass, Push Pin Studios,
Charley Harper, Jim Flora, Paul Rand, Fortune magazine industrial-
modernism), British industrial modernism (E. McKnight Kauffer,
Edward Bawden), Japanese Showa-era graphic design (Yusaku Kamekura,
Ikko Tanaka), Soviet Constructivism (Alexander Rodchenko, El Lissitzky),
German political photomontage (John Heartfield), and 20th-century
industrial woodcut tradition (Frans Masereel). The base aesthetic is
the shared graphic discipline this family carries: bold compositional
confidence, color-blocked forms with no soft shading or gradients,
geometric clarity, restrained palette, editorial publication weight.
Restricted warm palette: deep ink (#1C1814), walnut (#5C4A3D),
umber (#8B7355), burnt amber and gold (#C4A747), rust (#A64D46),
and bone (#F0E6D0) on paper (#F5F0E8) background. No other colors.
Cultural specificity (Soviet Constructivist intensity, American
mid-century restraint, Chinese vermillion, Japanese Showa minimalism,
literati ink-wash) is supplied by the per-scene typography emphasis —
this base provides the neutral 20th-century editorial-illustration
grammar from which the cultural emphasis emerges. NOT photorealistic,
NOT 3D render, NOT cool blue or teal, NOT Adobe stock aesthetic,
NOT smooth featureless mannequin faces.

American mid-century editorial illustration in the tradition of
Fortune magazine industrial-modernism (1950s-60s), Saul Bass
title-sequence aesthetic, Push Pin Studios layout discipline, Charley
Harper geometric wildlife illustration, Jim Flora RCA covers. A 1958
Detroit auto plant or American industrial-corporate scene: three
figures in business attire (suits, ties, white shirts) gathered
around a planning table with industrial blueprints. Faces composed
of color-blocked planes, eyes obscured by hair fall or downturned
head.

PALETTE EMPHASIS: walnut, umber, gold, bone, paper — softer
mid-century American optimism palette with rust as SINGLE sparing
accent only (never dominant). NOT Soviet revolutionary red.
COMPOSITIONAL EMPHASIS: balanced asymmetric editorial layout,
deliberate white-space discipline, hierarchy through size and weight
rather than color saturation, NOT diagonal monumentalist Soviet axis.

Mood: American mid-century industrial optimism, post-war corporate
confidence, magazine-spread quality. Typography integrated as Push
Pin / Bass geometric sans-serif block lettering: 'INDUSTRY ·
INNOVATION · ENTERPRISE' or 'PROGRESS' in walnut and gold. 16:9
aspect ratio.
```

**Key constraints:**
- 1958 Detroit auto plant or American industrial-corporate scene with three figures in business attire
- Softer mid-century palette (walnut/umber/gold/bone/paper) — rust as SINGLE sparing accent only, never dominant
- NOT Soviet revolutionary red palette
- Balanced asymmetric editorial layout, NOT diagonal monumentalist Soviet axis
- Push Pin Studios / Saul Bass / Charley Harper / Jim Flora references
- Typography: 'INDUSTRY · INNOVATION · ENTERPRISE' or 'PROGRESS' in geometric block lettering
- Used for: contemporary American tech, Cold War American content, corporate scenes, the channel's American Modernist sub-tradition

---

## Reference 10: Japanese Showa-Modernist

**Locks:** Japanese Showa-era post-war graphic design — Yusaku Kamekura / Ikko Tanaka discipline. NOT pre-war propaganda.

**Filename:** `r10_japanese_showa.png`

**LUT primary:** editorial

**Prompt:**
```
Editorial illustration in the Parallax 20th-century constructivist
tradition — drawing on the broader graphic-design family that spans
the Bauhaus design school (László Moholy-Nagy, Herbert Bayer),
American mid-century editorial modernism (Saul Bass, Push Pin Studios,
Charley Harper, Jim Flora, Paul Rand, Fortune magazine industrial-
modernism), British industrial modernism (E. McKnight Kauffer,
Edward Bawden), Japanese Showa-era graphic design (Yusaku Kamekura,
Ikko Tanaka), Soviet Constructivism (Alexander Rodchenko, El Lissitzky),
German political photomontage (John Heartfield), and 20th-century
industrial woodcut tradition (Frans Masereel). The base aesthetic is
the shared graphic discipline this family carries: bold compositional
confidence, color-blocked forms with no soft shading or gradients,
geometric clarity, restrained palette, editorial publication weight.
Restricted warm palette: deep ink (#1C1814), walnut (#5C4A3D),
umber (#8B7355), burnt amber and gold (#C4A747), rust (#A64D46),
and bone (#F0E6D0) on paper (#F5F0E8) background. No other colors.
Cultural specificity (Soviet Constructivist intensity, American
mid-century restraint, Chinese vermillion, Japanese Showa minimalism,
literati ink-wash) is supplied by the per-scene typography emphasis —
this base provides the neutral 20th-century editorial-illustration
grammar from which the cultural emphasis emerges. NOT photorealistic,
NOT 3D render, NOT cool blue or teal, NOT Adobe stock aesthetic,
NOT smooth featureless mannequin faces.

Japanese Showa-era post-war graphic design in the tradition of
Yusaku Kamekura (1964 Tokyo Olympics identity), Ikko Tanaka,
Tadanori Yokoo. A 1964 Japanese industrial-modernist scene: two
figures in business attire at a Tokyo office overlooking the city
skyline at dusk. Faces composed of color-blocked planes, eyes
obscured by lowered head reading.

PALETTE EMPHASIS: extremely minimal — black/deep ink, single bold
red (Japanese red, slightly orange-leaning), cream/bone, paper. Often
just 2-3 colors total. NOT Soviet rust dominance. COMPOSITIONAL
EMPHASIS: vertical orientation strongly preferred, geometric
discipline, bold kanji typography integration ('技術 · 産業 · 進歩'
— Technology · Industry · Progress). Real Japanese, not mock-script.
Restrained scale, intentional negative space, Showa-era post-war
modernist confidence (NOT pre-1945 imperial propaganda — this is the
post-war reconstruction Japan that became the Olympics-era /
industrial-rise visual tradition). 16:9 aspect ratio.
```

**Key constraints:**
- 1964 Japanese industrial-modernist scene with two figures in business attire at a Tokyo office
- Extremely minimal palette: black/ink + single bold red (Japanese red, slightly orange-leaning) + cream/bone + paper
- Often just 2-3 colors total — NOT Soviet rust dominance
- Vertical text orientation, geometric discipline, bold kanji at monumental scale
- Real Japanese characters: 技術 (Technology), 産業 (Industry), 進歩 (Progress)
- Showa-era post-war modernist confidence (NOT pre-1945 imperial propaganda)
- Used for: post-war Japanese content, Olympics-era / industrial-rise Japan, Japanese strategic content

---

## Reference 11: Russian Constructivist Canonical

**Locks:** Soviet Constructivist canonical reference — full Rodchenko/Klutsis intensity. Deployed only when content explicitly engages Soviet state power.

**Filename:** `r11_russian_constructivist.png`

**LUT primary:** conflict

**Prompt:**
```
Editorial illustration in the Parallax 20th-century constructivist
tradition — drawing on the broader graphic-design family that spans
the Bauhaus design school (László Moholy-Nagy, Herbert Bayer),
American mid-century editorial modernism (Saul Bass, Push Pin Studios,
Charley Harper, Jim Flora, Paul Rand, Fortune magazine industrial-
modernism), British industrial modernism (E. McKnight Kauffer,
Edward Bawden), Japanese Showa-era graphic design (Yusaku Kamekura,
Ikko Tanaka), Soviet Constructivism (Alexander Rodchenko, El Lissitzky),
German political photomontage (John Heartfield), and 20th-century
industrial woodcut tradition (Frans Masereel). The base aesthetic is
the shared graphic discipline this family carries: bold compositional
confidence, color-blocked forms with no soft shading or gradients,
geometric clarity, restrained palette, editorial publication weight.
Restricted warm palette: deep ink (#1C1814), walnut (#5C4A3D),
umber (#8B7355), burnt amber and gold (#C4A747), rust (#A64D46),
and bone (#F0E6D0) on paper (#F5F0E8) background. No other colors.
Cultural specificity (Soviet Constructivist intensity, American
mid-century restraint, Chinese vermillion, Japanese Showa minimalism,
literati ink-wash) is supplied by the per-scene typography emphasis —
this base provides the neutral 20th-century editorial-illustration
grammar from which the cultural emphasis emerges. NOT photorealistic,
NOT 3D render, NOT cool blue or teal, NOT Adobe stock aesthetic,
NOT smooth featureless mannequin faces.

Soviet Constructivist propaganda in the canonical Rodchenko / Klutsis
/ Lissitzky tradition. A 1930 Soviet industrial scene: three workers
in dark blue overalls and protective goggles operating massive
machinery. Faces composed of color-blocked planes, eyes obscured by
goggle shadow.

PALETTE EMPHASIS: full saturated revolutionary palette — heavy red
(rust dominant), gold accents, deep ink structural elements, bone
highlights. Revolutionary intensity is the goal here. COMPOSITIONAL
EMPHASIS: diagonal compositional axis (signature Soviet Constructivist
move), monumentalist scale, low horizon line, propaganda-poster
dynamism.

Bold Russian Cyrillic typography: 'ИНДУСТРИАЛИЗАЦИЯ' (Industrialization),
'ПЯТИЛЕТКА В ЧЕТЫРЕ ГОДА' (Five-Year Plan in Four Years), 'ПОБЕДА'
(Victory) — real Russian, not mock-script.

Mood: Soviet revolutionary mobilization, full agitprop intensity.
EDITORIAL NOTE: this reference exists for episodes that explicitly
cover Soviet-bloc state-power content. The channel deploys this
aesthetic deliberately and analytically, not as default. 16:9 aspect
ratio.
```

**Key constraints:**
- 1930 Soviet industrial scene with three workers in dark blue overalls
- Full saturated revolutionary palette — heavy red (rust dominant), gold, ink, bone
- Diagonal compositional axis (signature Soviet Constructivist move)
- Monumentalist scale, low horizon line, propaganda-poster dynamism
- Real Russian Cyrillic typography: ИНДУСТРИАЛИЗАЦИЯ, ПЯТИЛЕТКА В ЧЕТЫРЕ ГОДА, ПОБЕДА
- Editorial note: this reference exists for episodes that explicitly cover Soviet-bloc state-power content. The channel deploys this aesthetic deliberately and analytically, not as default.
- Used for: Soviet historical content, Russian state-power episodes, deliberate "propaganda-aesthetic-as-commentary" moments per the Sophisticated mode in TYPOGRAPHY_TRADITIONS.md

---

## Reference 12: Chinese Traditional (Scholar's Study)

**Locks:** Pre-revolutionary Chinese / classical scholarly content — literati ink-wash discipline, scrolls, contemplative restraint. The Translator identity direction's classical-Chinese visual anchor.

**Filename:** `r12_chinese_traditional.png`

**LUT primary:** standard

**Prompt:**
```
Editorial illustration in the Parallax 20th-century constructivist
tradition — drawing on the broader graphic-design family that spans
the Bauhaus design school (László Moholy-Nagy, Herbert Bayer),
American mid-century editorial modernism (Saul Bass, Push Pin Studios,
Charley Harper, Jim Flora, Paul Rand, Fortune magazine industrial-
modernism), British industrial modernism (E. McKnight Kauffer,
Edward Bawden), Japanese Showa-era graphic design (Yusaku Kamekura,
Ikko Tanaka), Soviet Constructivism (Alexander Rodchenko, El Lissitzky),
German political photomontage (John Heartfield), and 20th-century
industrial woodcut tradition (Frans Masereel). The base aesthetic is
the shared graphic discipline this family carries: bold compositional
confidence, color-blocked forms with no soft shading or gradients,
geometric clarity, restrained palette, editorial publication weight.
Restricted warm palette: deep ink (#1C1814), walnut (#5C4A3D),
umber (#8B7355), burnt amber and gold (#C4A747), rust (#A64D46),
and bone (#F0E6D0) on paper (#F5F0E8) background. No other colors.
Cultural specificity (Soviet Constructivist intensity, American
mid-century restraint, Chinese vermillion, Japanese Showa minimalism,
literati ink-wash) is supplied by the per-scene typography emphasis —
this base provides the neutral 20th-century editorial-illustration
grammar from which the cultural emphasis emerges. NOT photorealistic,
NOT 3D render, NOT cool blue or teal, NOT Adobe stock aesthetic,
NOT smooth featureless mannequin faces.

A 1923 Shanghai scholar's study, intimate eye-level composition. A
figure in traditional changshan robe seated at a low wooden desk,
brush in hand, pausing over a long calligraphy scroll. Face composed
of 4-5 distinct color-blocked planes (jaw, cheekbone, brow, lit,
neck), no continuous skin tonality, no rendered facial features.
Eyes obscured by lowered head reading position and round wire-rim
eyeglasses casting shadow. Hands as flat color planes holding the
brush. Wooden desk with stacked classical texts, small inkstone,
teacup with botanical motif. Behind: hanging scroll with vertical
Traditional Chinese calligraphy ('學而時習之' or similar real
classical Chinese phrase) in brush-ink style on bone background.
Window showing Shanghai rooftops at dusk as flat ink silhouettes.

PALETTE EMPHASIS: ink wash dominant — deep ink (#1C1814) on paper
(#F5F0E8) background, walnut and umber as material-grounding
neutrals, sparse rust (#A64D46) only as red seal accent on the
scroll or signature stamp. NOT propaganda intensity; literati
restraint. COMPOSITIONAL EMPHASIS: vertical orientation (text
columns right-to-left), restrained scale, contemplative composition,
extensive negative space as deliberate aesthetic choice. Classical
scholar's-study aesthetic, not industrial-modernist.

Mood: scholarly contemplation, classical Chinese intellectual
tradition, pre-revolutionary intellectual gravity. Realism: balanced
(figure stays planar-constructivist, environment has subtle paper
grain and material texture on books and scroll). 16:9 aspect ratio.
```

**Key constraints:**
- 1923 Shanghai scholar's study with figure in changshan robe at low wooden desk
- Ink wash dominant palette — deep ink on paper background, walnut/umber as material neutrals, sparse rust only as red seal accent
- NOT propaganda intensity; literati restraint
- Vertical orientation (text columns right-to-left), restrained scale, contemplative composition
- Real Traditional Chinese calligraphy (繁體) — verify with Tiger before render
- Mood: scholarly contemplation, classical Chinese intellectual tradition, pre-revolutionary intellectual gravity
- Used for: pre-1949 Chinese scenes, classical Chinese thought (Legalism, Confucianism, Daoism), scenes about Chinese intellectual tradition rather than PRC state, Taiwan/Hong Kong cultural content

---

## Reference 13: Adversarial War Room

**Locks:** Non-Soviet adversarial scene — military command center / intelligence operations with conflict-treatment palette WITHOUT Soviet revolutionary coding.

**Filename:** `r13_adversarial_warroom.png`

**LUT primary:** conflict

**Prompt:**
```
Editorial illustration in the Parallax 20th-century constructivist
tradition — drawing on the broader graphic-design family that spans
the Bauhaus design school (László Moholy-Nagy, Herbert Bayer),
American mid-century editorial modernism (Saul Bass, Push Pin Studios,
Charley Harper, Jim Flora, Paul Rand, Fortune magazine industrial-
modernism), British industrial modernism (E. McKnight Kauffer,
Edward Bawden), Japanese Showa-era graphic design (Yusaku Kamekura,
Ikko Tanaka), Soviet Constructivism (Alexander Rodchenko, El Lissitzky),
German political photomontage (John Heartfield), and 20th-century
industrial woodcut tradition (Frans Masereel). The base aesthetic is
the shared graphic discipline this family carries: bold compositional
confidence, color-blocked forms with no soft shading or gradients,
geometric clarity, restrained palette, editorial publication weight.
Restricted warm palette: deep ink (#1C1814), walnut (#5C4A3D),
umber (#8B7355), burnt amber and gold (#C4A747), rust (#A64D46),
and bone (#F0E6D0) on paper (#F5F0E8) background. No other colors.
Cultural specificity (Soviet Constructivist intensity, American
mid-century restraint, Chinese vermillion, Japanese Showa minimalism,
literati ink-wash) is supplied by the per-scene typography emphasis —
this base provides the neutral 20th-century editorial-illustration
grammar from which the cultural emphasis emerges. NOT photorealistic,
NOT 3D render, NOT cool blue or teal, NOT Adobe stock aesthetic,
NOT smooth featureless mannequin faces.

Interior of a contemporary American military strategic operations
center, dark and tense. Five figures in tactical uniforms gathered
around a central display table — two seated examining maps, two
standing in discussion, one pointing at a screen on the back wall.
Faces composed of 4-5 distinct color-blocked planes, eyes obscured
by helmet brim shadow or hat brim shadow. Hands as flat color planes
pointing or holding documents. Multiple display screens in
background showing radar, maps, and stylized data graphics — flat
ink-and-rust panels. Composition shows clear group dynamic with
lines of attention between figures.

PALETTE EMPHASIS: conflict treatment palette — heavy contrast deep
ink (#1C1814) shadows, oxblood (#7A2E1A) and rust (#A64D46) accents
from displays, bone (#F0E6D0) highlights. Cool-blue display glow at
secondary level only (NOT dominant; this is conflict-treatment, not
generic-military-blue). Adversarial-American visual rhetoric, NOT
Soviet revolutionary palette. COMPOSITIONAL EMPHASIS: balanced
asymmetric editorial layout (Push Pin / Saul Bass discipline applied
to military scene). Tension through deep shadow and rim-light
isolation, NOT through Soviet diagonal monumentalist axis.
Composition feels intentional and architectural.

Mood: tension, contained adversarial weight, contemporary American
military intelligence operations. NOT Cold War Soviet rocket factory.
Realism: balanced. 16:9 aspect ratio.
```

**Key constraints:**
- Contemporary American military strategic operations center with five figures in tactical uniforms
- Conflict treatment palette — heavy contrast deep ink, oxblood and rust accents from displays, bone highlights
- Cool-blue display glow at SECONDARY level only (NOT dominant)
- Adversarial-American visual rhetoric, NOT Soviet revolutionary palette
- Balanced asymmetric editorial layout (Push Pin / Bass discipline applied to military scene)
- Tension through deep shadow and rim-light isolation, NOT through Soviet diagonal axis
- Used for: contemporary military scenes, intelligence operations, sanctions enforcement, contested-moment scenes when content is American/Western (not Soviet-bloc)

---

## Reference 14: Multi-Figure Boardroom

**Locks:** Multi-figure group dynamics — diplomatic summit / corporate negotiation / panel discussion at 4-6 figure scale. Validates how planar-face standard holds when figures interact directionally.

**Filename:** `r14_multifigure_boardroom.png`

**LUT primary:** standard

**Prompt:**
```
Editorial illustration in the Parallax 20th-century constructivist
tradition — drawing on the broader graphic-design family that spans
the Bauhaus design school (László Moholy-Nagy, Herbert Bayer),
American mid-century editorial modernism (Saul Bass, Push Pin Studios,
Charley Harper, Jim Flora, Paul Rand, Fortune magazine industrial-
modernism), British industrial modernism (E. McKnight Kauffer,
Edward Bawden), Japanese Showa-era graphic design (Yusaku Kamekura,
Ikko Tanaka), Soviet Constructivism (Alexander Rodchenko, El Lissitzky),
German political photomontage (John Heartfield), and 20th-century
industrial woodcut tradition (Frans Masereel). The base aesthetic is
the shared graphic discipline this family carries: bold compositional
confidence, color-blocked forms with no soft shading or gradients,
geometric clarity, restrained palette, editorial publication weight.
Restricted warm palette: deep ink (#1C1814), walnut (#5C4A3D),
umber (#8B7355), burnt amber and gold (#C4A747), rust (#A64D46),
and bone (#F0E6D0) on paper (#F5F0E8) background. No other colors.
Cultural specificity (Soviet Constructivist intensity, American
mid-century restraint, Chinese vermillion, Japanese Showa minimalism,
literati ink-wash) is supplied by the per-scene typography emphasis —
this base provides the neutral 20th-century editorial-illustration
grammar from which the cultural emphasis emerges. NOT photorealistic,
NOT 3D render, NOT cool blue or teal, NOT Adobe stock aesthetic,
NOT smooth featureless mannequin faces.

A 2026 international trade negotiation in a wood-paneled conference
room with warm tungsten lighting from a side window. Six figures in
business attire seated around a large rectangular conference table,
mid-discussion. Two figures gesturing across the table; one figure
referring to documents; one figure typing on a laptop; two figures
in side-conversation. Faces composed of 4-5 distinct color-blocked
planes, eyes obscured by hair fall, lowered head, or hand-raised
gesture. Hands as flat color planes (palm + finger silhouette only,
no individual finger detail) holding pens, pointing, or resting on
documents. The composition reads as 6-figure group dynamic with
lines of attention establishing who's engaged with whom.

PALETTE EMPHASIS: American mid-century editorial restraint — walnut
(#5C4A3D), umber (#8B7355), gold (#C4A747), bone (#F0E6D0), paper
(#F5F0E8). Rust as single sparing accent (one document folder, one
chair, one tie). NOT Soviet revolutionary intensity. Saul Bass /
Push Pin / Fortune-magazine palette discipline. COMPOSITIONAL
EMPHASIS: balanced asymmetric editorial layout, Push Pin Studios'
deliberate white-space discipline. The 6 figures arranged so that
lines of attention between them are readable; NOT symmetric centered
layout (PowerPoint-coded), NOT diagonal monumentalist (Soviet-coded).
Editorial-magazine spread quality.

Mood: contemporary diplomatic / corporate institutional discussion,
intentional and architectural. Realism: balanced (figures flat,
environment has selective material texture on wood paneling and
documents). 16:9 aspect ratio.
```

**Key constraints:**
- 2026 international trade negotiation, six figures around conference table mid-discussion
- American mid-century editorial restraint palette (walnut/umber/gold/bone/paper, rust sparing only)
- NOT Soviet revolutionary intensity
- Balanced asymmetric editorial layout, lines of attention readable between figures
- NOT symmetric centered layout (PowerPoint-coded), NOT diagonal monumentalist (Soviet-coded)
- Used for: diplomatic summits, congressional hearings, corporate negotiations, panel discussions, any institutional multi-figure scene

---

## Reference 15: Neutral Channel Default

**Locks:** The channel's neutral default visual identity — soft American-Modernist palette with no specific cultural geography. Used for channel art, banner imagery, default thumbnails, framework episodes, abstract-topic content.

**Filename:** `r15_neutral_default.png`

**LUT primary:** standard

**Prompt:**
```
Editorial illustration in the Parallax 20th-century constructivist
tradition — drawing on the broader graphic-design family that spans
the Bauhaus design school (László Moholy-Nagy, Herbert Bayer),
American mid-century editorial modernism (Saul Bass, Push Pin Studios,
Charley Harper, Jim Flora, Paul Rand, Fortune magazine industrial-
modernism), British industrial modernism (E. McKnight Kauffer,
Edward Bawden), Japanese Showa-era graphic design (Yusaku Kamekura,
Ikko Tanaka), Soviet Constructivism (Alexander Rodchenko, El Lissitzky),
German political photomontage (John Heartfield), and 20th-century
industrial woodcut tradition (Frans Masereel). The base aesthetic is
the shared graphic discipline this family carries: bold compositional
confidence, color-blocked forms with no soft shading or gradients,
geometric clarity, restrained palette, editorial publication weight.
Restricted warm palette: deep ink (#1C1814), walnut (#5C4A3D),
umber (#8B7355), burnt amber and gold (#C4A747), rust (#A64D46),
and bone (#F0E6D0) on paper (#F5F0E8) background. No other colors.
Cultural specificity (Soviet Constructivist intensity, American
mid-century restraint, Chinese vermillion, Japanese Showa minimalism,
literati ink-wash) is supplied by the per-scene typography emphasis —
this base provides the neutral 20th-century editorial-illustration
grammar from which the cultural emphasis emerges. NOT photorealistic,
NOT 3D render, NOT cool blue or teal, NOT Adobe stock aesthetic,
NOT smooth featureless mannequin faces.

A neutral atmospheric backdrop scene establishing the Parallax
channel's default visual identity. Abstract industrial-modernist
landscape: layered geometric forms suggesting infrastructure
(architectural silhouettes, transportation corridors, network
connections) at distance, no specific cultural geography or named
location. No human figures.

PALETTE EMPHASIS: the channel's softest American-Modernist-leaning
default — walnut (#5C4A3D), umber (#8B7355), gold (#C4A747), bone
(#F0E6D0), paper (#F5F0E8) — with rust (#A64D46) only as a single
sparing accent on one element (a transportation line, a sun glint,
a building edge). NOT Soviet revolutionary palette dominance. This
is the channel's neutral default — Saul Bass / Push Pin / Charley
Harper restraint applied to abstract infrastructure.

COMPOSITIONAL EMPHASIS: balanced asymmetric editorial layout,
deliberate negative space, hierarchy through size and weight rather
than color saturation. Push Pin Studios / Eames-era flat-modernist
grid discipline. NOT diagonal monumentalist Soviet axis.

Mood: contemporary American mid-century editorial design optimism,
intentional, architectural. The channel's default visual register
when no specific cultural geography applies.

Used for: channel art, banner imagery, default thumbnail style,
episodes covering abstract topics or philosophical frameworks
without strong geographic specificity. Realism: flat (atmospheric
backdrop usage; full graphic flatness for monumentalist editorial
composition). 16:9 aspect ratio.
```

**Key constraints:**
- Abstract industrial-modernist landscape suggesting infrastructure (architectural silhouettes, transportation corridors, network connections), NO specific cultural geography or named location, NO human figures
- Channel's softest American-Modernist-leaning default palette — walnut/umber/gold/bone/paper, rust only as single sparing accent
- NOT Soviet revolutionary palette dominance
- Balanced asymmetric editorial layout, deliberate negative space, Push Pin / Eames-era flat-modernist discipline
- Mood: contemporary American mid-century editorial design optimism
- Used for: channel art, banner imagery, default thumbnail style, episodes covering abstract topics or philosophical frameworks without strong geographic specificity, "what does Parallax look like by default" anchor

---

## Generation Order

Run `python generate_style_refs.py --all` to generate all fifteen in the recommended order. Three phases:

**Phase 1 — foundational anchors (validate these first):**

1. **constructivist-face** — establish the planar-face standard first; every figurative scene inherits its face standard from this
2. **domestic-intimate** — test the aesthetic at conversational human scale (the hardest test case; validates the May 4 face-realism fix)
3. **cleanroom-flat** — primary industrial scene, monumentalist propaganda-poster aesthetic, Chinese propaganda typography
4. **cleanroom-grounded** — same scene at different realism dosage (validates the dosage knob)
5. **historical-modernist** — historical reconstruction mode + English Modernist typography, validating the architecture's American-coded historical scenes
6. **atmospheric-trap** — atmospheric backdrop (background usage role)
7. **conceptual-corridor** — conceptual metaphor (tests aesthetic on abstract content)

**Phase 2 — broader 20th-century constructivist family (May 4 risk-mitigation calibration):**

8. **bauhaus-educational** — Bauhaus design-school discipline for educational/framework scenes
9. **american-modernist-fortune** — Fortune-magazine / Saul Bass / Push Pin American mid-century discipline (the channel's main contemporary American anchor)
10. **japanese-showa-modernist** — Kamekura / Tanaka post-war Japanese modernism (NOT pre-war propaganda)
11. **russian-constructivist-canonical** — Soviet Constructivist canonical reference (deployed deliberately for Soviet content, not channel default)

**Phase 3 — coverage completion (May 4 calibration round 3):**

12. **chinese-traditional-scholar** — pre-revolutionary Chinese / classical scholarly content with literati ink-wash discipline (Tiger to verify Traditional Chinese before render)
13. **adversarial-warroom** — non-Soviet adversarial scene with conflict-treatment palette (American military / intelligence operations)
14. **multi-figure-boardroom** — multi-figure group dynamics validation (4-6 figure scale, lines of attention)
15. **neutral-channel-default** — channel's neutral default visual identity (Saul Bass / Push Pin restraint, no specific cultural geography); used for channel art, banner, default thumbnails

After each generation, review and iterate the prompt if the output doesn't match the Parallax editorial feel. The references are anchors — getting them right matters more than getting them quickly. Phase 1 is non-negotiable; Phase 2 supports broader cultural range; Phase 3 closes coverage gaps.

## Quality gate

For each reference after generation:

1. **Does it land in the Parallax editorial feel?** Could this image appear next to a Remotion data chart and feel like the same channel?
2. **Is the constructivist DNA present?** Color-blocked forms, restricted palette, no soft shading, planar features (where figures are present)?
3. **For typographic references (2, 3, 6, 9, 10, 11, 12):** is the text real and parseable in its source language? Tiger to verify Chinese characters (both Simplified and Traditional); for Russian and Japanese, fall back to native-speaker review or use the minimal variant.
4. **For multi-figure references (13, 14):** does the planar-face standard hold across all figures? Are lines of attention readable?
5. **For Phase 2/3 cultural-emphasis references (8-15):** does the palette emphasis distinguish the cultural inflection cleanly? Soviet vs. American vs. Chinese vs. Japanese should each read as their own cultural register, not as variations of the same Soviet aesthetic.
6. **Run through `treat.py`:** does the LUT pass produce clean Meridian-palette output, or does the source fight the treatment?

If any of these fail, iterate the prompt and regenerate. The reference library is canonical — every shot in every future episode anchors to these.
