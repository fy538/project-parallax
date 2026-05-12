---
name: map-audit
description: >
  Audit the map shots in a Parallax production script against the 6 available
  map templates (ChoroplethMap, RouteAnimation, AtlasPlate, ProportionalSymbolMap,
  CartogramMap, DensityMap) and their data files. Catches template-data mismatches
  (count data routed to ChoroplethMap, categorical data routed to ChoroplethMap
  when AtlasPlate fits better, modern register for Cold-War analogies, etc.)
  and missing mandatory overlays (source annotations, disputed boundaries for
  geopolitics-relevant regions). Sister to script-audit and visual-concept;
  runs after script-draft, before or alongside visual-spec.

  Use whenever someone asks to "check the maps", "audit the map shots", "are the
  right map templates picked", "map review", "map audit", or when finalizing a
  script that contains multiple map beats. Also trigger proactively when a script
  is drafted and has [MG:] beats with TEMPLATE: ChoroplethMap or TEMPLATE:
  RouteAnimation — those are the templates most often misapplied because they
  were available before the 4 new map templates shipped.
---

# Map Audit

You are auditing the **map shots** in a Parallax production script for template-fit, data-shape correctness, editorial-register match, and overlay completeness. The map toolkit grew from 2 templates to 6 in May 2026; scripts written or copied from older episodes often route map beats to ChoroplethMap or RouteAnimation when one of the 4 newer templates would be the correct fit. Your job is to surface those mismatches with specific replacements before they ship.

## Context

The Parallax map pipeline now has 6 templates plus 5 overlay components and 3 aesthetic modes. The canonical "if your data looks like X, use template Y" lookup is `remotion-templates/MAP_TEMPLATE_SELECTOR.md` — read it BEFORE running the audit.

You are NOT generating new visual-spec JSON. You are reading what's already there (in script + data file form) and flagging issues. Outputs are findings with locations and concrete remediation suggestions.

## When to use this skill

- After `script-draft` produces a draft with map beats.
- Before `visual-spec` so any reshape is done while it's cheap.
- When porting an older episode's map data (silicon-trap, prisoners-dilemma early drafts) to the new template registry.
- Standalone "are my maps right" check at any pipeline stage.

Sister skills:
- **`script-audit`** — narrative quality (transitions, lecture patterns, pacing).
- **`visual-concept`** — visual layer feasibility BEFORE visual-spec.
- **`visual-spec`** — generates the actual JSON data files.

This skill is more narrowly scoped than `visual-concept` — it audits ONLY map beats and ONLY the template-selection / data-shape / overlay-completeness dimensions. Run alongside `visual-concept` (which catches broader feasibility issues) rather than instead of it.

## Inputs

1. **The script file** (required) — typically `episodes/<slug>/script-production.md`.
2. **The data files** (when they exist) — `remotion-templates/data/episodes/<slug>/*.json` for any map composition.
3. **MAP_TEMPLATE_SELECTOR.md** (read at start) — the canonical selection table.
4. **Per-template dossiers** (read on demand) — `remotion-templates/references/template-research/{choropleth-map, route-animation, atlas-plate, proportional-symbol-map, cartogram-map, density-map, map-annotations}.md`.

## Reference docs (read first)

Before running the audit:

1. **`remotion-templates/MAP_TEMPLATE_SELECTOR.md`** — the wall-table. Memorize the decision tree.
2. **`project/SCRIPT_FORMAT.md`** — how `[MG:]` + `TEMPLATE: X` lines work in the two-column format.
3. **The 7 map-related dossiers** under `remotion-templates/references/template-research/` for failure-mode references.

## The seven audit lenses

Run each lens INDEPENDENTLY. For each issue, produce:
- **Location:** beat / line number / file path
- **Problem:** what's wrong in one sentence
- **Replacement:** the specific template + mode change to fix it

### Lens 1 — Data-shape mismatch on ChoroplethMap

ChoroplethMap is for **quantitative rates / shares / %**. Two common misuses to flag:

**1a. Categorical fills routed to ChoroplethMap.**
Symptoms in the data file: every country in `countries[]` has a `fill` field, NONE have `value` or `noData`. The ColorBrewer ramp infrastructure is wasted; you're using Mapbox tiles + terrain to render what is essentially a flag-coloring exercise.
→ **Replacement:** AtlasPlate (modern aesthetic) — pure-SVG editorial register, faster, no Mapbox dependency, designed for categorical "members of X" stories.

**1b. Count data routed to ChoroplethMap.**
Symptoms: `value` field is an integer count (number of fabs, number of bases, number of incidents), not a rate or share. Country fills make small-area countries (Iceland, Singapore) visually disappear and large-area countries (Russia) dominate — the OPPOSITE of the editorial point.
→ **Replacement:** ProportionalSymbolMap (5-12 countries) or DensityMap (100s of points) or CartogramMap (15+ countries in dense region).

The dossier failure-mode reference: `choropleth-map.md` § 7. Audit notes from the runtime `warnIf`: a ChoroplethMap with all-categorical data fires a dev-time console warning, but that fires AT RENDER time; this audit catches it at script-review time.

### Lens 2 — Template-register mismatch

The 4 new map templates (AtlasPlate, ProportionalSymbolMap, CartogramMap, DensityMap) and the vintage aesthetic on AtlasPlate cover use cases the original 2 templates were misapplied to.

For each `TEMPLATE: ChoroplethMap` or `TEMPLATE: RouteAnimation` beat in the script, ask:

- Does the narration's data shape match the template? (Lens 1)
- Does the editorial register match? (See Lens 3)
- Would one of the new templates serve better?

If yes → flag with the concrete replacement.

The single most common mistake: **Cold War / period analogy beats routed to ChoroplethMap modern.** Should be AtlasPlate + `aesthetic: "vintage"`. Look for any beat that mentions a year before 1990, "Cold War," "NATO vs. Warsaw Pact," "Soviet bloc," or "blocs aligned."

### Lens 3 — Aesthetic-register mismatch

Three registers, each fits different narrative moments:

| Register | Templates | When |
|---|---|---|
| **Atmospheric** (Mapbox basemap) | ChoroplethMap, RouteAnimation, DensityMap | Live data, current geography, terrain matters |
| **Editorial / Tufte** (SVG, flat) | AtlasPlate modern, ProportionalSymbolMap, CartogramMap | Analytical beats, "structural pattern" framing |
| **Period / vintage** | AtlasPlate + `aesthetic: "vintage"` | Historical analogies, Cold War, "in 1962…" |

Audit for:

- **Atmospheric register on analytical beat.** ChoroplethMap with terrain on for a beat that's about "the structure of NATO membership." → AtlasPlate modern.
- **Modern register on period beat.** ChoroplethMap (any) for a beat that's about historical alignments. → AtlasPlate vintage.
- **Vintage on live current-data beat.** AtlasPlate vintage on "current trade flows 2024." Misleading — the register lies about the data's age. → AtlasPlate modern OR ChoroplethMap.

### Lens 4 — Overlay completeness

Every data-bearing map MUST have:

1. **Source annotation.** `annotations: [{ at: ..., label: "Source: ...", hierarchy: "tertiary", emphasis: "mute" }]`. No provenance = no data map. Flag absence.
2. **Named-place annotations** for places the narration explicitly names. If the script says "Hsinchu Science Park" but the data file has no annotation at Hsinchu's lon/lat, that's a flag.
3. **Disputed boundaries** when the map covers a geopolitically-relevant region. Curated tags in `src/utils/disputedBoundaries.ts`:
   - Map covers East Asia or Taiwan → flag if no `taiwan-strait` or `nine-dash`
   - Map covers South Asia → flag if no `kashmir-loc`
   - Map covers Russia/Ukraine → flag if no `crimea`
   - Map covers North Africa → flag if no `western-sahara-berm`
4. **Locator inset** for any composition with `zoom > 4` (regional zoom). Without it, viewers lose "where on the planet" context.

### Lens 5 — Cinematic-camera opportunities

For multi-phase compositions, check whether the camera transition matches the narrative move:

- **Continent-jumping transition** (phase 1 zoomed to North America, phase 2 zoomed to East Asia) without `cameraTransition: "via-globe"` → flag. The default linear transition will feel like a teleport.
- **Dramatic phase change** (e.g., "the system collapsed") with default `cameraTransition: "linear"` → flag. Suggest `"cinematic"` for the Bezier-eased version.
- **Phase 0 doing instant work** without `cameraDwell: { before: 0.3 }` → cosmetic; flag only if the beat would benefit from a settle moment.

### Lens 6 — Cold-open / cinematic-moment fitness

If the script has a cold open or transition beat that pivots from one region to another, ask:

- Could this be **AtlasPlate orthographic with rotation**? Globe rotation is the canonical "we're shifting the lens of analysis" cinematic move. Flag any cold open that uses a static Mapbox view when a 4-5s rotating globe would do the same editorial work better.

### Lens 7 — Schema / data-file health

For each map data file referenced in the script (i.e., each `data.json` in the assembly manifest):

- Validate against the Zod schema. (The pre-commit hook does this for changed files; this lens catches drift in files that haven't been edited but the SCRIPT now references differently.)
- Confirm at least one phase has the editorial content the script promises. E.g., if the script's beat 4 narration says "and then six countries joined," the corresponding data file should have a phase with 6 countries highlighted, not 4.
- Confirm the source attribution in the data file matches what the script cites. Discrepancies between script citation and map source are an audit finding.

## Output format

Produce a structured report:

```markdown
# Map Audit — <episode slug>

**Maps in this episode:** <count>
**Issues found:** <P0 count> P0 (blocks render), <P1 count> P1 (visually wrong), <P2 count> P2 (cosmetic)

---

## P0 — Render-blocking issues

### Beat <N>, line <X> — <one-line summary>
- **Current:** `TEMPLATE: ChoroplethMap` with categorical-fill data
- **Problem:** ChoroplethMap is for quantitative data; categorical fills lose the editorial point.
- **Replacement:** Switch to `TEMPLATE: AtlasPlate` with `aesthetic: "modern"` (or `"vintage"` if period). Migrate data file: drop `value` field, keep `fill` on each country, add explicit `iso3` codes.
- **Reference:** MAP_TEMPLATE_SELECTOR.md § Lens 1a

[... repeat per issue ...]

---

## P1 — Visually-wrong but renderable issues

[same format]

---

## P2 — Cosmetic / opportunity-cost issues

[same format]

---

## Summary

<2-3 sentences: overall map-pipeline health, biggest pattern, recommended next action>
```

If no issues are found, output:

```markdown
# Map Audit — <episode slug>

**Maps in this episode:** <count>
**Issues found:** 0 — map templates are correctly assigned, overlays are complete, registers match.

[brief note on any opportunity-cost item that didn't rise to P2]
```

## Doctrine / failure modes to ALWAYS flag

These are auto-flag conditions regardless of script context:

1. **ChoroplethMap with all-categorical fills** — flag as P0 every time.
2. **Map covers a region with a known dispute but `disputedBoundaries` is unset** — flag as P0 if the dispute is relevant to the script's claim, P1 if it's a geographic neighbor only.
3. **No source annotation on a data-bearing map** — flag as P0.
4. **`aesthetic: "vintage"` on a beat referencing current-year data** — flag as P1.
5. **AtlasPlate `projection: "orthographic"` with `focus`** — schema generates a warnIf at render time; flag as P1 if seen in data files.
6. **`cameraTransition: "via-globe"` on orthographic** — flag as P1 (no effect).
7. **DensityMap with `mode: "heatmap"` and any point has `colorWeight`** — colorWeight ignored; flag as P1.
8. **DensityMap with <10 total points** — flag as P1, suggest ProportionalSymbolMap.
9. **CartogramMap with <10 data points** — flag as P1, suggest ProportionalSymbolMap.
10. **ProportionalSymbolMap with 20+ symbols in a single phase** — flag as P1, suggest CartogramMap.

## Tone

Match the rest of the Parallax skill set: terse, surgical, no fluff. Quote the script line being flagged. Cite the dossier reference. Suggest the specific replacement — never just "consider another template."

The audience for your output is Tiger (the solo creator) doing a pre-render review pass. He's already familiar with the toolkit; you don't need to explain what AtlasPlate is. Tell him what's wrong, where, and what to change.
