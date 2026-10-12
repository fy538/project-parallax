# ChordDiagram — Template Research Dossier

> Last updated: May 2026

## Editorial register

The chord diagram is the canonical form for **bilateral relationship networks** — situations where every pair-wise relationship is independently meaningful and the *comparative volume* across pairs is the editorial argument. The geometry encodes two quantities simultaneously without a legend: arc length (entity's total traffic) and chord thickness (bilateral flow magnitude).

## When to use

- **Trade interdependence** — bilateral goods/services flows between N countries (the flagship use case; 4–8 entities ideal)
- **Alliance webs** — mutual-defense commitments, treaty coverage, co-signatory networks
- **Migration patterns** — bilateral corridor flows (origin ↔ destination where both directions matter)
- **Influence networks** — media citation networks, academic co-authorship, diplomatic démarche frequency
- Any story where the frame is *"how interconnected are these actors?"* and the answer requires showing ALL pairs simultaneously

## When NOT to use

| Scenario | Better template |
|---|---|
| Directional ONE-WAY flows (sources → sinks) | SankeyFlow |
| Fewer than 4 entities | ArcDiagram (the hierarchy is clearer on a line) |
| Absolute values matter more than relationships | DataChart or BulletChart |
| You want to emphasize a single dominant flow | NetworkDiagram with hub emphasis |
| Time dimension matters | BumpChart (ranking over time) or DualTimeline |

## Layout conventions

### Geometry
- Entities placed on a circle (radius 360px, 1920×1080 canvas)
- Arc width: 40px (outer R=360, inner R=320)
- Entities sorted by total flow descending — largest entity gets 12-o'clock position
- Gap between arcs: 0.025 radians (~1.4°) — enough to separate visually without wasting angular space

### Arc length
- Proportional to entity's total traffic volume (sum of all flows involving that entity)
- For bidirectional flows: both directions count separately, so a 575B bidirectional flow contributes 1,150B equivalent to both entities' arc budgets
- This means arc length encodes *gravitational importance* in the network, not just outbound or inbound

### Chord geometry
- Cubic bezier through (0,0) — the center pull creates the characteristic chord "belly"
- Contact angle within each arc allocated proportionally to flow magnitude
- Stroke width: 1–8px range, linearly scaled to flow value
- Chord color: matches the `from` entity's color (convention from Bostock's canonical D3 chord)
- Opacity: 0.4 for standard chords; 0.2 for `emphasis: "muted"` chords; 0.4 for `emphasis: "accent"` chords (in combination with the `someAccent` dimming logic)

### Labels
- Positioned at R+30 from center at each entity's mid-angle
- Text anchor: "start" (right half), "end" (left half), "middle" (top/bottom)
- Small tick line from arc edge to label for clean connection
- Font: IBM Plex Mono, label size — consistent with ArcDiagram/NetworkDiagram precision-marker aesthetic

## Color conventions

- Entities should have **distinct, non-competing colors** — brand palette works well for 4–6 entities
- When specifying colors in data JSON, use hex values directly (entity-level `color` field)
- For 7+ entities, fall back to sequential palette tokens; label proximity will carry the semantic load
- Chord color = `from` entity color (don't override this — it's the legibility convention)

## Animation sequence

| Phase | Timing | What happens |
|---|---|---|
| Arc entrance | 0 → 0.6s | Entity arcs + chords scale from center (scale 0→1) |
| Label reveal | 0.3s → 0.8s (staggered 0.06s/entity) | Labels fade in outside the ring |
| Chord reveal | 0.6s → ~2.0s (staggered 0.15s/chord) | Chords fade in sequentially |
| Value label | 1.0s → 1.4s | Center void label fades in |

The scale-from-center entrance is the canonical chord diagram reveal: it echoes how the form emerges from the data computation (matrix → arc → chord). Staggered chord reveal lets the narrator walk through specific relationships as they appear.

## Known failure modes

1. **Too many entities (>8)**: Arc labels collide at the outer ring; chords become a visual hairball. Split into two diagrams or use NetworkDiagram with a hub structure.
2. **Asymmetric flows without bidirectional flag**: An A→B flow of 500B where only `from: "A", to: "B"` is specified will allocate arc to both A and B, but the chord will appear as a one-directional line. Use `bidirectional: true` for truly bilateral measurements.
3. **One dominant entity**: If US takes 60% of the arc, remaining entities get thin slivers. Consider normalizing to percentages of total rather than absolute values.
4. **Low-value chords**: Chords below ~50B in a 500B-denominated dataset render as 1px hairlines that read as noise. Either aggregate small flows into an "Other" entity or set `emphasis: "muted"` to visually de-emphasize.

## State-of-the-art references

- **NYT Upshot** — bilateral trade chord diagrams during US-China tariff coverage (2018–2019); notable for animated chord-by-chord reveal matching the narration
- **FT Visual Vocabulary** — "Flow" section recommends chord for "bilateral flows between multiple categories"
- **Observable / D3 chord** (Bostock 2012) — canonical algorithm; Parallax's implementation replaces D3 with pure trig for SSR compatibility with Remotion
- **Bloomberg** — alliance network chords during NATO expansion coverage (2022); used a greyed-out "muted" state for non-highlighted chords during animated spotlight sequences

## Parallax-specific defaults

- `backgroundVariant: "dark"` — chord diagrams read better on dark backgrounds; the translucent colored chords need a neutral void to register
- `valueLabel` at center — keeps units legible without cluttering the ring
- `noDrift: true` via `useDirection(data._direction, "none")` — the radial geometry is self-contained; Ken Burns drift would mis-register the center label
- Source attribution at 2.0s — delayed until the chord animation completes
