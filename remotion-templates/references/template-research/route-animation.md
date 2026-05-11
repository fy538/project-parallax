# RouteAnimation — Research Dossier

> Created: May 10, 2026. Research delegated to web-research agent; integrated and Parallax-aligned by claude. Update when new outlet conventions are observed.

## 1. The form's editorial purpose

A route map is the right form when **the story is about movement across geography that matters** — the path's shape, length, chokepoints, or detours carry argumentative weight.

Pick it over alternatives when:
- **vs. NetworkDiagram:** Use a route map when geographic distance, terrain, or specific waypoints are load-bearing. Switch to abstract network when topology matters more than territory (e.g., correspondent banking, ownership graphs).
- **vs. SankeyFlow:** Sankey wins when proportional flow magnitudes between many sources/sinks is the point (oil exports by country-pair, budget allocations). Route map wins when the *path itself* is the argument.
- **vs. static map:** Route map adds temporal/sequential meaning. If chronology, phasing, or causation along the path matters, animate. If you only need to show a corridor's existence, static is honest and faster to scrub.

**Heuristic:** if removing the basemap would destroy the meaning, it's a route map. If the basemap is decoration, it's a network diagram wearing geography as costume.

## 2. Canonical idioms

### a. Single phased route with named anchors
- **NYT** "The Dangerous Journey of Migrants Through Mexico" (2014, repeated 2018, 2023)
- **Nat Geo** Magellan/Shackleton replays

A single bold path, ~4–7 named stops, drawn segment-by-segment with date or event annotations. *Works because:* the eye follows one line and labels appear in sequence, never simultaneously. *Fails when:* intermediate waypoints have no narrative purpose — becomes a connect-the-dots.

### b. Many-routes-from-one-hub (radial)
- **Reuters** "How Russia is moving troops to Ukraine" (Feb 2022)
- **FT** "China's Belt and Road" hub-spoke version (2019)

One origin, multiple destinations, drawn as 3–8 arcs leaving simultaneously or in priority sequence. *Works because:* it makes the hub legible as a center of action. *Fails when:* destinations are clustered (arcs overlap) or when the hub's centrality is rhetorical rather than real.

**This is the "Rome with 5 destinations" / "trade hub with many connections" use case we currently don't handle.**

### c. Multi-route comparison overlay
- **NYT** "The Refugee Crisis Routes to Europe" (Sep 2015)
- **Bloomberg** "Three Routes Russian Oil Now Takes" (2023)

Two to four parallel routes drawn in distinct hues, typically with volume labels. *Works because:* the comparison is the argument. *Fails when:* more than 4 routes — spaghetti — or when routes diverge so widely the basemap can't hold them.

### d. Thickness-by-volume routes
- **FT** "How Taiwanese Chips Travel the World" (2023)
- **Bloomberg** "LNG Flows After Sanctions" (2022)

Path width encodes magnitude; usually 2–6 corridors on one basemap. *Works because:* one variable, one channel — clean. *Fails when:* volumes span orders of magnitude (thinnest route invisible) or when the basemap projection distorts perceived width.

### e. Annotated journey with stops + dates
- **Pudding** "Human Terrain" / Nat Geo expedition retrospectives
- **NYT** "Tracking the Wagner Convoy" (June 2023)

Path + dated callout cards at each stop, often with photo or quote. *Works because:* time becomes spatial. *Fails when:* narration tries to compete with on-screen text — pick one.

## 3. Animation conventions

The dominant pattern is **sequential reveal anchored to narration**:
- Path draws (SVG stroke-dasharray) at narrator's pace
- Anchor markers pop on arrival
- Label fades in *after* the marker lands (200–400ms delay)

NYT and Reuters almost never animate concurrent routes — even on multi-route maps, they reveal one at a time, then hold all together. Labels live above-right of the marker by default, but flip to avoid the coastline or another label. Camera rarely zooms during the draw; zoom transitions happen *between* phases, not during.

**Easing:** ease-out cubic — fast departure, soft landing — never linear (mechanical) and never bouncy.

## 4. Recommendation for Parallax

**Default form:** single phased route, **ink-colored path** on **taupe/bone basemap**, **rust accent** only for the *current* segment being drawn, anchor markers as filled 6px circles with a 1.5px gold ring, labels in **IBM Plex Sans Medium 18–22px** set in ink, left- or right-aligned per coastline.

**Path style:** stroke 2px, dashed when speculative or contested.

**Easing:** ease-out cubic, 800–1400ms per segment, with a 300ms hold before the next segment starts so the viewer can land at 8–12s/frame.

**Extension for hub-with-radial:** add a `radial` mode to `RouteAnimation` rather than a new template. Geometry is the same (origin → destination polyline or great-circle); the only differences:
1. Shared origin marker drawn first and held
2. Staggered start times with 150–250ms offset between arcs
3. Optional thickness-by-volume parameter
4. Label placement algorithm that sorts destinations by bearing and places labels on the *outside* of the arc fan

New template only if the hub needs a tier-1 visual treatment (concentric rings, sphere of influence shading) — for pure routes, extend.

**Projection rule:** great-circle arcs only when spans exceed ~3000km; below that, geodesic and rhumb look identical and the curve reads as decorative.

## 5. Current template alignment

The existing `RouteAnimation` template:
- Phased reveal of named routes ✓
- Catalog variants: `silk-road`, `magellan`, `chokepoints` — single-route phased reveals
- Does NOT have a `radial` mode → confirmed gap (already in `remotion-templates/CLAUDE.md` Known gaps)

## 6. Specific upgrades proposed

1. **Build the `radial` mode** (extends `RouteAnimation`, not a new template). Hub field + destinations array; bearing-sorted label placement; staggered arc starts. This closes the gap docced in CLAUDE.md.
2. **Path-style audit.** Current routes may be using saturated colors; default should be ink + rust-for-current-segment.
3. **Anchor marker treatment.** Filled 6px circle + 1.5px gold ring — codify as the standard marker.
4. **Easing review.** Confirm ease-out cubic with 300ms hold between segments; flag any linear easing.
5. **Great-circle threshold guard.** Don't render great-circle arcs for spans under ~3000km — looks decorative, not informative.

## 7. Failure mode flags (always catch in audit)

- Great-circle arcs across Europe or one country — pretentious, looks wrong
- All labels appearing at landing simultaneously — label spaghetti
- Animated dashed line that keeps re-animating after landing — fidgety
- Path crosses itself with no visual hierarchy on which segment is "on top"
- Basemap with country borders bolder than the route
- More than one accent color on the route layer (rust *and* gold both as path colors)
- Multi-route map where routes are distinguished only by hue, no labels at branch points
- Animation timing fixed regardless of route length — short hops feel sluggish, long voyages feel rushed
- Markers larger than label x-height — destination feels heavier than its name
- Mercator projection for any route crossing 60°N (Arctic shipping, transpolar flights)

## TL;DR

**Single phased route, ink path + rust current-segment + gold-ringed anchors.** Build a `radial` mode on `RouteAnimation` with staggered arc starts and bearing-sorted labels.
