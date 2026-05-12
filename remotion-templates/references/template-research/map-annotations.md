# Map Annotations — Research Dossier

> The editorial overlay layer that separates a Parallax atlas plate from a Mapbox screenshot.
>
> Last updated: May 11, 2026 (initial)

## 1. The form's editorial purpose

When you have a base map (Mapbox tiles, deck.gl overlay, or a flat-art SVG) and you need a viewer to *read* it — to know that this water is the South China Sea, that this corner of the frame names a chokepoint, that the source is UNCTAD 2024 — you need an annotation layer. Tiles draw geography; annotations draw the *argument*. Without them a map is a substrate; with them a map becomes editorial.

Annotations exist in a different register from point labels (which are bound to data points) or chart titles (which name the whole composition). They name *places, regions, features, and sources* in the cartographer's voice. They're the part of the map a viewer's eye returns to when they're trying to remember what they saw.

## 2. Canonical idioms

### 2a. Region label — uppercase display, large, no dot
**References:** FT Visual & Data Journalism (2023, Sahel Sahel security crisis maps); NYT Upshot (2022, "How Russia's invasion has reshaped European energy"); Bartholomew's *Times Atlas* (1972 edition, region naming convention).

**Why it works:** A region is a felt category, not a measurable point. Putting an uppercase Plex Sans SemiBold label across a swath of frame names the *area* without claiming a precise center. The lack of a dot is doing a lot of work — it tells the reader "this is the name of where you are, not a location."

**Failure mode:** Setting region labels in title case competes with the chart title. Always uppercase. Always no leader line. Always no dot.

### 2b. Feature callout — leader line + label, secondary scale
**References:** Reuters Graphics (2024, "Inside the Red Sea crisis" — Bab-el-Mandeb callout); NYT (Feb 2022, Mariupol siege map with port callout); Economist (2023, Suez blockage breakdown).

**Why it works:** A specific feature (a strait, a port, an installation) has a precise lon/lat but the label can't sit on top of the dot without obscuring the map. The leader line is the cartographer's "look here." Length and angle communicate priority — long horizontal leaders = "this is something you might miss"; short angled leaders = "this is in plain sight, I'm just labeling it."

**Failure mode:** Multiple parallel leaders going the same direction read as a grid (industrial diagram, not editorial map). Stagger leader angles. Two leaders going to nearby labels should converge or diverge, never run parallel.

### 2c. Source attribution — Plex Mono, corner, muted
**References:** Universal across editorial outlets — FT, NYT, Bloomberg, Reuters all use small monospace bottom-corner. Bloomberg distinctively uses bottom-left; NYT bottom-right; FT under the title.

**Why it works:** The source line is a "trust signal" that should be present but never compete. Mono separates it from the editorial voice by texture, not size. Putting it on the map (rather than in the surrounding chrome) reminds the viewer that the *map's data* has provenance separate from any narration.

**Failure mode:** Forgetting it. A map without a source attribution reads as opinion, not evidence. Parallax doctrine: every map ships with a source annotation.

### 2d. Water-body / ocean label — italic-feeling, large, sparse
**References:** Bartholomew's atlas plates; National Geographic standard practice; FT (occasional, for narrative emphasis); USGS topographic conventions.

**Why it works:** Oceans are large empty regions that *need* a label to feel like a known place, not a void. Traditional cartography sets these in slanted serif; in our brand we keep Plex Sans but use a sparse letter-spaced, muted-color treatment. The label sits flat on the water, not over a leader.

**Failure mode:** Setting ocean labels too small. The label should occupy the visual weight of the water body itself. A 14px "Indian Ocean" over half the frame reads as forgotten metadata.

### 2e. Annotation cluster — paired primary + secondary
**References:** NYT election maps (state name + county feature); FT trade maps (region + chokepoint); Reuters (country + named installation).

**Why it works:** Two annotations in the same visual neighborhood, in two hierarchies, establish a *zoom relationship* without changing the map. "ASIA" (primary) over Eurasia + "Strait of Malacca" (secondary with leader) inside it tells the viewer "you are in Asia, looking at this specific feature." The hierarchy is the zoom.

**Failure mode:** Three or four hierarchies in the same neighborhood. Annotation hierarchy is a *visual* contract — two levels read as deliberate, three+ read as cluttered.

## 3. General principles

Cartographic annotation is governed by **figure-ground hierarchy** (Tufte) and **typographic register** (Bringhurst). A good annotation layer:

- Maintains a clear ground (the map) and a clear figure (the labels) by varying *texture* and *weight*, not just size.
- Uses **two type families maximum** to create register difference (we use Plex Sans for editorial labels + Plex Mono for evidence/source notes — the Burtin/Bayer Fortune precedent).
- Reserves **hue** for emphasis, not category — accent = "look at this," mute = "context, ignore unless you need it," default = "read this."
- Respects **anchor integrity** — every lon/lat annotation has a dot at its true location. The dot is a contract: "the label is about this exact point, not the general vicinity."
- Lets **the map breathe** — annotation density caps around 1 label per 200×200 visual region. Beyond that, split into phases.

The deep rationale: a video viewer reads a map for ~2-4 seconds before narration moves on. The annotation layer determines what they *take away*. Sparse, high-hierarchy labels move information density up; dense low-hierarchy labels move it down to background.

## 4. Recommendation for Parallax

**Default to three hierarchies, one register each:**
- **primary** — Plex Sans SemiBold uppercase, ink (or bone in dark), no leader, no dot. For regions and countries when named editorially.
- **secondary** — Plex Sans Medium sentence case, ink, with leader for off-anchor placement. For features, chokepoints, named installations.
- **tertiary** — Plex Mono Regular sentence case, taupe. For source notes, parenthetical asides, dates.

**Editorial defaults baked into the component:**
- Anchor dot only for `secondary` and `tertiary` (primary regions get no dot).
- Leader stroke at 55% opacity to keep ground/figure clean.
- `mute` emphasis automatically dims primaries that aren't the focal point of a phase.
- `accent` emphasis (rust) reserved for ≤1 annotation per phase — overuse kills emphasis.

**Phase scoping:** for RouteAnimation/ChoroplethMap with phases, prefer to annotate per-phase rather than globally. A region label that persists across all phases competes with whatever the current phase is doing. Use the `phase` shorthand.

## 5. Current template alignment

`MapAnnotations.tsx` (initial implementation, May 11 2026):

| Canon | Implemented? | Notes |
|---|---|---|
| Region label (uppercase, no leader, no dot) | ✓ | `hierarchy: "primary"` + no `leader` field. Anchor dot still renders — TODO: suppress dot for primary unless `leader` is set. |
| Feature callout (leader + label) | ✓ | `hierarchy: "secondary"` + `leader: { dx, dy }`. |
| Source attribution (Plex Mono, muted) | ✓ | `hierarchy: "tertiary"` + `emphasis: "mute"`. |
| Water-body label (sparse, flat on water) | ⚠ Partial | Renders fine with `secondary` + no leader, but no special letter-spacing/sparse treatment yet. |
| Annotation cluster (paired primary + secondary) | ✓ | Authoring concern — works as data. |

**Divergences from canon:**
- All hierarchies currently render an anchor dot. Editorial canon: primary (region) labels should not. Fix in v2.
- Leader lines are straight; FT/Reuters sometimes use angled (one-bend) leaders for clearance. v2 enhancement.
- No automatic collision detection — overlapping labels are the author's responsibility. This is intentional (annotation placement is editorial judgment) but worth re-evaluating after the first episode.

## 6. Specific upgrades proposed

Ranked by effort/impact:

1. **Suppress anchor dot for `primary` hierarchy when no `leader` is set.** (~10 min)
   Region labels canonically have no dot. Currently we always render one. Easy fix in the dot block.

2. **Sparse / letter-spaced "water body" treatment.** (~30 min)
   Add `emphasis: "ocean"` or `treatment: "ocean"` — secondary hierarchy with extra letter-spacing (~8px) and muted color. Used for ocean and sea names where the label spans a large area.

3. **One-bend leader option.** (~1 hr)
   Add `leader: { dx, dy, kink?: { x: number; y: number } }` — when `kink` is set, draw two segments instead of one. Useful for routing leaders around other annotations.

4. **Per-leader stroke override.** (~10 min)
   Allow `leader.stroke` to override the default 55% opacity (e.g., for an accent annotation that needs its leader to read at full strength).

5. **Collision warning (dev only).** (~2 hr)
   Compute approximate label bounding boxes in screen space and `warnIf()` when they overlap. Editorial layout is judgment, but a heads-up at dev time would catch accidents.

## 7. Failure mode flags

These should always trigger an audit finding when seen:

- **No source annotation on a data-bearing map.** Every map that shows data (choropleth fills, route weights, anything beyond a base reference map) must have a `tertiary` annotation with the source. No exceptions.
- **More than 2 `accent` annotations on screen at once.** Accent reads as "the thing." Multiple accents read as "everything is the thing" → nothing is. Reduce to one.
- **Region label (`primary`) over noisy terrain or dense route lines.** Without enough negative space the label competes with the figure. Move the label, drop the terrain (LESSONS L99 — terrain default is now opt-in), or split into phases.
- **Tertiary label larger than 14px** or **primary label smaller than 28px.** Hierarchy collapse. The whole point of three hierarchies is they read differently in 2 seconds.
- **More than one leader pointing the same direction in the same neighborhood.** Reads as a wiring diagram, not a map. Stagger angles or convert to a single grouped label.
- **Annotations bound to coordinates outside the visible camera frame.** Author error — annotations render off-screen and burn render cycles. Verify lon/lat against the phase camera before shipping.

---

## Adjacent overlays — Graticule

The graticule (parallels and meridians grid) is a sibling editorial overlay implemented at [`components/Graticule.tsx`](../../src/components/Graticule.tsx) and configured via the `graticule` field on `RouteAnimation` / `ChoroplethMap`.

**Editorial purpose.** Where annotations name *places*, the graticule names *coordinates*. It transforms a map from an image of geography into a *plate from an atlas* — a coordinate system the viewer can read from. On-brand because the channel is literally called *Parallax*: the graticule is the cartographic apparatus that lets you triangulate a viewpoint.

**Canonical idioms.**

1. **Minor grid at 10°, major emphasis every 30°.** Bartholomew, National Geographic, USGS. The 30° lines fall on or near the Equator, Tropic of Cancer (23.5°), Tropic of Capricorn (-23.5°), Arctic/Antarctic Circles (66.5°) — these are the "felt" parallels. Two-tier opacity (default 10% minor, ~20% major) makes the system legible without competing with content.

2. **15° spacing for world-scale globe shots.** Sparser, more legible at low zoom. Used by FT and Reuters for globe-mode lead-in shots.

3. **5° spacing for tight regional views.** Higher density justified when the zoom is close enough that 10° spacing would have only one or two visible lines.

4. **Omit entirely for character-mode maps.** Hand-drawn / sketchy / atmospheric registers (e.g., Caspian Report's hand-annotated maps) don't carry graticules — the grid reads as a different aesthetic register. Parallax's atlas register *does* carry it.

**Parallax default.** 10° minor + 30° major emphasis, 10% / 20% opacity, ink in light mode, bone in dark mode. Opt-in per data file (`graticule: { spacing: 10 }`) for now; promote to a default after 2-3 maps confirm it always reads well.

**Failure modes.**
- **Graticule on top of a complex choropleth.** The grid competes with the data. Either drop the graticule or lower its opacity to 5% for those compositions.
- **Graticule at 5° spacing on a world-scale map.** Visual noise. Match spacing to zoom — finer step for tighter shots.
- **Graticule color matched to country borders.** Reads as a confusing extra border layer. Keep the graticule opacity below the border opacity so the hierarchy stays clean.

## References

- Bartholomew, J. (1972 ed.). *The Times Atlas of the World*. Comprehensive house typography + hierarchy conventions for editorial cartography.
- Bringhurst, R. *The Elements of Typographic Style.* Register, hierarchy, ground/figure.
- Tufte, E. *Envisioning Information.* Layering and separation; small multiples; annotation as data-ink.
- FT Visual & Data Journalism, "How the Red Sea attacks are reshaping shipping" (2024).
- Reuters Graphics, "Inside the Red Sea crisis" (2024).
- NYT Upshot, "How Russia's invasion has reshaped European energy" (2022).
- USGS Topographic Map Symbols (2017 ed.). Hierarchy + register conventions.
