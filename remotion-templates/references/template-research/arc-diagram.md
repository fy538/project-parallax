# ArcDiagram — Research Dossier

> Created: May 13, 2026. Research compiled from primary sources (Wattenberg 2002, Bostock/Observable, The Pudding, Lucioni); integrated and Parallax-aligned by claude. Update when new outlet conventions are observed.

## 1. The form's editorial purpose

An arc diagram earns its rectangle on screen when **order along an axis is itself the argument**. Nodes sit on a horizontal baseline in a fixed sequence (time, generation, citation depth, position in a piece of music) and arcs above encode the claim that *something at position i connects to something at position j across the gap between them*. The viewer's takeaway should be: *"this idea / person / event reached across the sequence to that one — and the shape of the reach is the structure."* Use it whenever the narration says "skipped a generation," "rehabilitated decades later," "predicted by," or "echoes back to" — the long-span arc is the visual sentence.

### When *not* to reach for it

| Alternative | When it wins over ArcDiagram |
|---|---|
| **NetworkDiagram** | Entities have no natural ordering, or the topology (clusters, hubs) is the point. Arc diagrams flatten 2D topology into 1D order — if order doesn't matter, you're throwing away a dimension. |
| **HorizontalTimeline** | Story is duration / overlap of episodes on a calendar, not skip-connections between named figures. |
| **FrameworkDiagram (flow)** | Causation is strictly linear (A→B→C) with no skip arcs. Arc diagrams pay for their geometry by showing non-adjacent reach; if everything is adjacent, use boxes-and-arrows. |
| **DataChart** | Story is magnitude per entity. Arcs encode relationship, not value. |

**Arc diagram's superpower fires when:** there's a natural 1D ordering (chronology, generation, position in a sequence) AND the editorially loaded relationships are *non-adjacent* — the long skip arcs are where the structure lives.

## 2. Canonical idioms

### a. Music / sequence self-similarity — Wattenberg "Shape of Song"
- **Martin Wattenberg**, *The Shape of Song* (IBM Research, 2002): each translucent arc connects two identical passages of a MIDI piece; Beethoven's "Für Elise" famously reveals nested self-rhyme.
- Wattenberg & Hochheiser, *Arc Diagrams: Visualizing Structure in Strings* (IEEE InfoVis 2002) — the founding paper.

*Works because:* the eye reads the *envelope* of arc lengths as the piece's recursive structure; you don't need to read individual arcs to feel the form. *Fails when:* density crosses ~50 arcs — the page turns into a translucent blur and the argument dissolves into texture.

### b. Co-occurrence / character network on a sequence — Les Misérables
- **Mike Bostock**, *Les Misérables Co-occurrence* (bost.ocks.org, 2012, ported to Observable's D3 gallery as the canonical "Arc Diagram" example) — Hugo's 77 characters on a baseline, arcs where two share a chapter, thickness ∝ co-occurrence count.

*Works because:* node ordering is hand-tuned to cluster Bostock's communities (Valjean's orbit, the students at the barricade) so arcs largely stay short within clusters and the few long arcs read as cross-community bridges. *Fails when:* node order is arbitrary (alphabetical, by-id) — long arcs criss-cross everything and the diagram becomes a wool ball. **Node order is the whole game.**

### c. Co-voting / influence network on a temporal axis — Senate
- **Renzo Lucioni**, *Senate Voting Relationships* (2013, viral on Sunlight Foundation / xraydelta) — actually a circular network rather than a pure arc diagram, but the small-multiples-by-Congress animation became the canonical reference for "how relationships across a fixed roster evolve."
- The arc-diagram cousin of this work — same data laid out left-to-right by seniority or party-position — appears repeatedly in academic poli-sci viz (Andris et al., Fowler co-sponsorship networks) precisely because Senate seat order isn't editorially arbitrary.

*Works because:* when one axis dimension (party, seniority) is meaningful, the arc diagram makes within-party vs. cross-aisle reach legible at a glance. *Fails when:* the axis is forced — if there's no real ordering, the form lies about structure.

### d. Citation / intellectual lineage — academic viz
- D3 / Observable gallery community implementations (e.g., influence graphs of philosophers, scientific citation chains, programming language ancestry diagrams on Observable and the D3 Graph Gallery, 2018–present).
- *Frontiers in Research Metrics* (2017), "Leveraging Citation Networks to Visualize Scholarly Influence Over Time" — establishes citation chronology + arc-skip as a standard form for "this 1923 paper was re-discovered in 1971."

*Works because:* citation is intrinsically time-directed, so chronological order is honest; the editorial payoff is the long arc that reveals which old idea got revived. *Fails when:* used for >15 papers — needs aggregation (cluster the period; show one arc per era).

### e. The Pudding's interactive sequence-arc — pop culture
- **Michelle Pera-McGhee**, *Wonky* (The Pudding, 2023) — visualization of musical groove patterns over decades, using arc-like connections between beat positions in a sequence to show how J Dilla's "drunk" rhythms broke the grid.
- **The Pudding**'s house style on sequence-based stories (musical genealogy, "shared DNA" pieces) consistently lands on arc-diagram derivatives when the claim is "this 2010 track borrowed from a 1973 break."

*Works because:* The Pudding pairs the diagram with audio scrubbing — the arc *is* the cross-reference and you can hear it. *Fails when:* lifted into static / video form without the audio scaffold; the long arcs need labels carrying their own weight.

**Historical anchor:** Wattenberg's 2002 paper is the founding text. Every editorial use since — Bostock's Les Mis, Pudding's music genealogy, every D3-gallery riff — descends from his choice to make arcs *translucent* and let density itself become the structural reading. **Translucency is not decoration; it is the form's load-bearing trick.**

## 3. General principles

The arc diagram is a specialized linearization of a network graph, and inherits both the cost and the payoff. Cost: you've collapsed a 2D layout problem to 1D, so any non-ordering information about the nodes is gone. Payoff: along the one dimension you kept, **position along a common scale** (Cleveland & McGill's top perceptual rank) governs how the viewer reads each arc — they read it as *reach* (Δposition), not as some abstract graph edge. The arc's *length* and the arc's *non-adjacency* are the units of meaning.

Tufte's data-ink discipline applies brutally: every arc that doesn't carry editorial weight is noise, and the baseline / axis labels should be minimal. Munzner (*Visualization Analysis and Design*, 2014) classifies the arc diagram under "Arrange Networks → Connection, with ordering constraint" — note that the *order* of nodes is a designer choice, not a data property, and a bad order destroys the form. Wattenberg's translucency trick is the equivalent of overplotting alpha in scatterplots: it lets density itself become signal.

**Failure-mode arithmetic:** with N nodes you can have up to N(N-1)/2 arcs. At N=10 that's 45 — already past the legibility cliff for video. The form wants 5–10 nodes and arc counts in the 5–15 range; above that, aggregate or split.

## 4. Recommendation for Parallax

**Default:** **5–8 named nodes on a chronological baseline**, **3–8 arcs**, **at most one accent (amber) arc** — the editorial-hero connection the narration names — with **the rest in muted ink at 35–55% opacity**. Apex height proportional to span (short hops nearly semicircular; wide spans flattened to fit the canvas). Baseline as a single thin muted rule, not a full axis.

**Palette:**
- Ink at 40–55% for muted arcs
- **Single amber `#E5A544` accent** on the load-bearing arc (the relationship narration spends a beat naming)
- Rust `#C23B22` reserved for a *second* hero only — e.g., the rebuttal arc opposing the extension arc
- Source attribution bottom-right

**Typography:**
- Node labels in IBM Plex Sans (the primary protagonist gets Plex Sans 700; supporting nodes 600)
- Axis stamps (dates / generations) in IBM Plex Mono uppercase, small, ABOVE the disc
- Arc labels ("inverted," "extended," "rehabilitated") in IBM Plex Mono *lowercase* — verbs read as commentary, not as titles. Keep ≤16 chars; longer kills legibility against bg.
- One axis title at the right edge of the baseline ("Century," "Generation"), Plex Mono uppercase

**Form discipline:** node order is editorial. The form's whole payoff is that the long-skip arc means something. If chronology is the order, label the dates. If generations or schools-of-thought is the order, label those. **Never alphabetical, never by ID.**

**Scrub tolerance:** at 8–12s per frame the viewer must (a) read the baseline as ordered in <1s, (b) see which arc is the hero in <1s, (c) read 1–2 arc labels. Reserve longer holds (12s+) for diagrams with >5 arcs.

## 5. Current template alignment

The existing `ArcDiagram` template (`src/templates/ArcDiagram/`):
- ✅ Baseline draws in left-to-right then nodes stagger in — feels like an axis being laid down, matching canon
- ✅ Per-arc `strength` ∈ [0.4, 1.0] drives stroke width + opacity (hero hierarchy is there)
- ✅ `style: "solid" | "dashed"` distinguishes registers (extension vs. rebuttal); dashed arcs fade in rather than stroke-dash to avoid pattern conflict
- ✅ Hero arcs (strength ≥ 1) get a soft glow underlay — subtle, palette-aligned
- ✅ `color: "accent"` brand-token resolution keeps data files semantic, not hex-bound
- ✅ Arc labels sit at apex with a small backing rect — solves the on-arc legibility problem outlets struggle with
- ✅ Apex clamped to `maxArcHeight` (baseline−title−30px) so wide spans don't shoot into the title zone
- ✅ `warnIf` fires above 12 nodes — matches canon's legibility cliff
- ✅ Sample data (Mahan→Mackinder→Spykman→Kennan→Brzezinski) is an exemplary application: clear chronological order, the editorial point is the non-adjacent `mahan→spykman "recovered"` arc skipping Mackinder
- **Diverges from canon:** no built-in "node order is editorial" affordance — array order is order, no validation that the order makes narrative sense (this is unfixable in code; lives in audit)
- **Diverges from canon:** no aggregation for ≥10 nodes; warning, but no "split into eras" pattern
- **Diverges from canon:** arc colors default to `theme.text.muted` for everything not-accent — fine, but no `emphasis: "muted" | "accent"` sugar like SankeyFlow has

## 6. Specific upgrades proposed

1. **`emphasis: "accent" | "muted" | "rebut"` per connection.** Mirror SankeyFlow's link-emphasis pattern. Today data files set `color: "accent"` or hardcode hex for the hero arc; richer semantics would expose a third register (`rebut` = rust) for the canonical Parallax pattern of "thesis arc vs. counter-thesis arc." Effort: small; impact: every multi-arc episode gets cleaner data files. **(low effort / medium impact)**

2. **Arc-label collision detection + auto-vertical-offset.** When two arcs have overlapping spans and their apex labels are within `labelWidth/2` of each other, push one label outward (above its apex, with a leader tick). Catches the most common at-scale failure: two parallel arcs labeled "extended" and "operationalized" stacking on the same y. Effort: medium; impact: removes the #1 legibility regression at 6+ arcs. **(medium effort / high impact)**

3. **`groupBy` era affordance — split-baseline variant.** Optional `data.eras?: Array<{ label, range: [startIdx, endIdx], color? }>` to render a faint background band per era ("Cold War," "Post-Containment") under the baseline. Lets the diagram do double duty as a periodization argument without adding a second template. Effort: medium; impact: episodes about "the long arc of strategic thought across eras" stop needing two side-by-side diagrams. **(medium effort / medium impact)**

4. **Translucency mode for high-density catalog use.** Wattenberg's actual innovation. Add `variant: "density"` that drops all per-arc emphasis, renders every arc at uniform ~25% opacity, omits arc labels entirely — for the rare case where the *envelope* of arc lengths is the story (e.g., "every Treaty of Westphalia echo from 1648 to 2022"). Reuses existing geometry. Effort: small; impact: niche but unlocks a viz Parallax can't currently make. **(low effort / low-medium impact)**

5. **Arc-direction affordance — directed lineage.** Today `from`/`to` is positional only (arc geometry is symmetric). For lineage / causation where direction matters editorially, add an optional arrowhead at the `to` end. Reserve for `style: "directed"` to avoid making every diagram into a flow chart — most influence stories are non-directional ("they spoke to each other"); directed mode is for explicit "X caused Y." Effort: small; impact: small but removes occasional confusion about which way the influence flows. **(low effort / low impact)**

## 7. Failure mode flags (always catch in audit)

- **Arbitrary node order** — alphabetical, by-id, or "whatever order the data was written in." The form's whole rhetorical power is that order is the argument; if it isn't, switch to NetworkDiagram.
- **>12 nodes, no aggregation** — labels collide, short adjacent arcs flatten into the baseline, the form becomes texture without signal. The template warns; audit must enforce.
- **No editorial hero arc** — every arc the same weight reads as a co-occurrence map, not as an argument. There should be one (occasionally two: thesis/counter-thesis) arc the eye lands on first.
- **Arc labels >16 chars** — overflow the backing rect, collide with adjacent labels, become unreadable at scrub speed. Use a verb or a short noun.
- **Long-span arcs apex'd higher than the title** — clamped in code (`maxArcHeight`) but visual-spec audit should still flag scripts demanding a 7-node-span arc on a 5-node diagram.
- **Mixed temporal + non-temporal ordering** — "Mahan, Mackinder, Spykman, Kennan, ... Sun Tzu" because narration name-checks Sun Tzu. Pick a baseline meaning and hold it.
- **Decorative arc clutter** — adding light "context" arcs that don't carry narration weight. Every arc on screen is a claim; unclaimed arcs are noise.
- **Missing source attribution** — every arc encodes a historiographic claim ("Kennan operationalized Spykman"). Cite the survey.
- **Used when sequence isn't meaningful** — e.g., comparing five competing AI labs (no order). Use NetworkDiagram bipartite or hub-spoke; the arc diagram lies by suggesting order.

## TL;DR

**5–8 nodes on a chronological baseline, 3–8 arcs with one amber hero, dashed for rebuttals, lowercase mono verbs at apex, axis stamps in mono uppercase above the disc — Wattenberg's shape-of-song trick applied to intellectual lineage. The long-skip arc is the whole point.**

Last updated: May 14, 2026
