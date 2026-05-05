# Parallax — AI Video Style Reference Library

> Updated May 4, 2026: Migrated from photoreal-mannequin (7 references) to constructivist (7 references). The prior version is in git history. The post-migration references match the unified constructivist aesthetic per VISUAL_LANGUAGE.md, AI_VIDEO_PIPELINE.md, and PROMPT_PREAMBLES.md.

## Purpose

These 7 reference images define the "Parallax AI-GEN look." Generate once via `python generate_style_refs.py --all` (uses Flux 2 Pro on fal.ai by default). Then reuse them as style anchors for Kling 3.0 / Seedance 2.0 / Sora 2 / Runway Gen-4 across all episodes. Each image locks a specific aspect of the constructivist aesthetic — facial planar simplification, realism dosage, scale, typography integration, register role.

**Workflow:** Generate canonical references → review each output → iterate until it matches the Parallax editorial feel → save as the canonical reference at the filenames below → feed to video generation tools as image references.

**Important:** After generating, run each through `treat.py` to verify the LUT pass produces clean Meridian-palette results. If the raw constructivist illustration fights the LUT (overly saturated, wrong color temperature), adjust the prompt.

**Tool selection note (post-May 4):** Flux 2 Pro is the script's default API but Recraft V3 may produce stronger constructivist outputs since it has native `vector_illustration` and `digital_illustration` styles calibrated for graphic illustration. Worth A/B testing during Phase 1. The fal.ai integration remains for hero P1 references where `realism: grounded` (photographic spatial detail) is the goal.

**API access for Flux 2 Pro:** Via fal.ai ($0.03/MP), DeepInfra, or BFL directly. Pay per image; ~$0.045 per 1920×1080 reference. Total library cost: ~$0.30 for all 7.

---

## Reference 1: Constructivist Face Study

**Locks:** The exact level of facial planar simplification across all grounded scenes.

**Filename:** `style-ref_face_planar-neutral_v1.png`

**LUT primary:** standard

**Prompt:**
```
Editorial illustration in the Parallax constructivist style — Soviet
constructivism meets German political photomontage meets industrial
woodcut tradition, drawing on Alexander Rodchenko, El Lissitzky,
John Heartfield, and Frans Masereel. Bold compositional confidence,
color-blocked forms with no soft shading or gradients. Restricted
warm palette: deep ink (#1C1814), walnut (#5C4A3D), umber (#8B7355),
burnt amber and gold (#C4A747), rust (#A64D46), bone (#F0E6D0) on
paper (#F5F0E8) background. No other colors.

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

**Filename:** `style-ref_industrial_cleanroom-flat_v1.png`

**LUT primary:** standard

**Prompt:**
```
[Constructivist anchor — see Reference 1 for the full anchor text.]

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

**Filename:** `style-ref_industrial_cleanroom-grounded_v1.png`

**LUT primary:** standard

**Prompt:**
```
[Constructivist anchor.]

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

**Filename:** `style-ref_atmospheric_trap-encirclement_v1.png`

**LUT primary:** standard

**Prompt:**
```
[Constructivist anchor.]

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

**Filename:** `style-ref_domestic_beijing-apartment_v1.png`

**LUT primary:** standard

**Prompt:**
```
[Constructivist anchor.]

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

**Filename:** `style-ref_historical_1941-american_v1.png`

**LUT primary:** editorial

**Prompt:**
```
[Constructivist anchor.]

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

**Filename:** `style-ref_conceptual_corridor-splitting_v1.png`

**LUT primary:** standard

**Prompt:**
```
[Constructivist anchor.]

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

## Generation Order

Run `python generate_style_refs.py --all` to generate all seven in the recommended order:

1. **constructivist-face** — establish the planar-face standard first
2. **domestic-intimate** — test the aesthetic at conversational human scale (the hardest test case)
3. **cleanroom-flat** — primary industrial scene, monumentalist
4. **cleanroom-grounded** — same scene at different realism dosage (validates the dosage knob)
5. **historical-modernist** — historical reconstruction mode + English Modernist typography
6. **atmospheric-trap** — atmospheric backdrop (background usage role)
7. **conceptual-corridor** — conceptual metaphor (advanced; tests aesthetic on abstract content)

After each generation, review and iterate the prompt if the output doesn't match the Parallax editorial feel. The references are anchors — getting them right matters more than getting them quickly.

## Quality gate

For each reference after generation:

1. **Does it land in the Parallax editorial feel?** Could this image appear next to a Remotion data chart and feel like the same channel?
2. **Is the constructivist DNA present?** Color-blocked forms, restricted palette, no soft shading, planar features (where figures are present)?
3. **For typographic references (2, 5, 6):** is the text real and parseable in its source language? Tiger to verify Chinese characters; for Russian/Japanese, fall back to native-speaker review or use the minimal variant.
4. **Run through `treat.py`:** does the LUT pass produce clean Meridian-palette output, or does the source fight the treatment?

If any of these fail, iterate the prompt and regenerate. The reference library is canonical — every shot in every future episode anchors to these.
