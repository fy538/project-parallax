# NetworkDiagram — Research Dossier

> Expanded from stub: May 14, 2026. Companion dossiers: [`sankey-flow.md`](./sankey-flow.md), [`arc-diagram.md`](./arc-diagram.md). Update when new outlet conventions are observed.

## 1. The form's editorial purpose

A network diagram earns its frame when **the relationship structure between named entities is itself the argument** and the geography (or any other spatial coordinate the eye expects) carries no editorial weight. The viewer's takeaway should be: *"these entities relate this way, and the SHAPE of the relationship is what I want you to see"* — one hub everyone depends on, two camps splitting along a fault line, a chain of intermediaries between source and outcome, a quiet bipartite "all of these → only this."

It is the editorial form for relationship structure when geography is irrelevant. The decision rule from `NetworkDiagram.tsx` is: *"Is the spatial position editorially meaningful? yes → ChoroplethMap/RouteAnimation; no → NetworkDiagram."* A schematic graph that pins nodes to fake positions throws away latitude, distance, and border information for free; when those mean nothing, the schematic form wins because it lets shape do the talking.

### When *not* to reach for it

| Alternative | When it wins over NetworkDiagram |
|---|---|
| **ChoroplethMap / RouteAnimation** | Entities are real places and the *where* matters (trade routes, alliance maps anchored to territory). |
| **SankeyFlow** | Edges carry conserved quantity and the editorial point is the ratio — not the topology. |
| **FrameworkDiagram** | Pure conceptual relationship with no enumerable entities ("legitimacy → consent → stability"). |
| **DataChart (tabular)** | More than ~8 entities and the relationship is uniform (every node connects to every node) — the network reads as "many things in a circle." |
| **ArcDiagram / chord** | Pairwise relationships across a *linear ordering* (timeline of contacts, co-occurrence) where the order is the argument. |

## 2. Canonical idioms

### a. Hub-and-spoke chokepoint diagram
- **FT** "Why everyone needs TSMC" (2022, semiconductor supply); **Reuters Graphics** OPEC+ producer dependency (2023); **NYT Upshot** central-banker influence networks (2019).

One protagonist node, dwarfing the satellites, with N inbound dependencies. The hub carries an in-circle hero numeral (the chokepoint stat — "92% of advanced-node chips"); satellites stay quiet typographic discs. *Works because:* the mass hierarchy IS the argument — the eye lands on the hub before reading any label and intuits "everything routes through here." *Failure mode:* without a real chokepoint, hub-spoke imposes false hierarchy on a flat dataset. Don't use to "make it look organized."

### b. Bipartite "many → one" (NEW, May 13 2026)
- **FT** "Where Russian oil actually goes" (2023, two-column source→destination); **Bloomberg** lithium offtake agreements (2022); **Reuters** Chinese rare-earth refinery dependencies (2024).

Two parallel columns — N entities on the left, M (typically 1–3) on the right — connected by straight diagonal lines. Inverts the hub-spoke "radiating outward" gesture: instead of one center with arms, the eye scans a vertical list and sees that *every line lands on the same handful of targets*. The chokepoint is implied by convergence, not by size. *Works because:* it reads as inventory ("here are all 11 mines") rather than ornament ("here is a flower"), which is the right register for a long enumeration of dependent entities. *Failure mode:* if the right column has the same N as the left, it's just a mesh; use only when the right column is materially smaller.

### c. Coalition / two-camp diagram
- **The Economist** post-invasion UN vote alignment (2022); **WaPo** Senate caucus structure (2020); **CSIS Reconnecting Asia** strategic-alignment maps.

Two clusters with internal density and a thin contested seam between them. Often a third "neutral" cluster floating between. *Works because:* visual proximity does the editorial work — viewers read "blocs" without needing a legend. *Failure mode:* force-directed layout slips into hairball if any node has cross-cluster ties; better to lay out manually as two columns or two arcs.

### d. Causation / influence cascade (DAG, left-to-right)
- **NYT Magazine** "How we got here" intellectual-lineage diagrams; **The Pudding** "How Spotify's algorithm works" (2020); **FT** Edward Snowden agency-flow diagrams (2013).

Acyclic graph reading L→R, multiple roots converging through 2–3 mid-stages to one outcome. *Works because:* the time/causation arrow is implicit in the layout itself; readers don't need arrowheads to know which direction "drives." *Failure mode:* if real causation loops back (feedback effects), you're lying with a DAG. Use FrameworkDiagram's cycle variant or a NetworkDiagram with explicit dashed back-edges.

### e. Concept map / typed-relationship diagram
- **Information Is Beautiful** debunking diagrams; **NYT** explanatory features ("what does X mean, exactly").

Central concept with sub-claims branching out, typed edges (supports / undermines / depends-on). *Works because:* it externalizes an argument's structure for the reader to audit. *Failure mode:* without typed edges (the typing IS the point), this is a fancy bulleted list.

### Avoid: generic D3 force-directed "hairball"
Recent newsroom convention (FT chart-doctor, 2021 onward; NYT R&D 2022 essay on graph viz) is explicit: **do not ship the force-directed default**. Reach for hub-spoke, bipartite, arc, or matrix instead. Force layouts hide structure rather than reveal it — the wiggling reads as "complex" to the producer and "noise" to the viewer. Use force only when chaos itself is the message (e.g., "global cyber-attack attempts in one hour").

## 3. General principles

Munzner (*Visualization Analysis & Design*, 2014) — node-link is best when topology is the argument and the graph is small (≤ ~50 nodes); above that, adjacency matrices read faster. Cleveland's perceptual hierarchy doesn't apply directly (no axes), but two corollaries do: (i) **position is the strongest channel available** — use it deliberately, not from a physics simulator, and (ii) **mass hierarchy via size** beats labeling-by-bold for naming the protagonist node. FT chart-doctor (Alan Smith, 2021) summarizes the editorial doctrine: *"if you can replace your network with a list or a Sankey, do it; ship the network only when shape itself is unobservable any other way."*

For video at 8–12s scrubbing speed the constraint tightens: every additional node costs label legibility and reading time. Newsroom graphics tolerate denser graphs because readers can dwell; Parallax cannot.

## 4. Recommendation for Parallax

**Defaults by editorial intent:**

| Editorial intent | Default layout | Cap |
|---|---|---|
| "Everyone routes through X" | **hub-spoke** with `importance: primary` on the hub | 4–7 spokes |
| "All of these depend on these few" | **bipartite** (NEW) | 6–10 left, 1–3 right |
| "Two camps and a seam" | **grid** or `hub-spoke` with offset clusters | 2 × 3–5 nodes |
| "From cause to outcome" | **horizontal-chain** or **vertical-chain** | 4–6 stages |
| "Concept with sub-claims" | **hub-spoke** (concept type), no stat | 5–7 satellites |

**Palette:** circles for nations + institutions (the editorial-newsroom baseline shape); rounded-rect for `actor` typographic plates; diamond reserved for `concept` markers. Hexagon exists but reads as blockchain/mesh UI — off-brand for the intelligence-briefing register and avoided unless a specific lattice argument calls for it.

**Style:** flat editorial discs — filled circle plus single stroke, NO glossy specular, NO concentric inner rings, NO 3D ornament (cleaned up May 2026; see §5). The hub earns presence through SIZE and its in-circle hero numeral, not through chrome. Single accent color (amber or rust) on the editorially loaded node + its inbound edges; everything else stays in ink/bone/muted tones.

## 5. Current template alignment

The existing `NetworkDiagram` template supports five layouts (`horizontal-chain`, `hub-spoke`, `grid`, `vertical-chain`, `bipartite`) and a virtual-camera narration mode keyed off `cameraPath`.

What matches canon:
- Mode-aware node radii (May 2026): when ANY node is marked `importance: "primary"`, hub = 96px and satellites = 36px (~2.7× ratio, matches FT/Bloomberg/NYT Upshot hub-spoke proportions); when no node is primary, all nodes render at 52px (uniform satellite size for chain/grid/mesh). Old behavior defaulted undefined to 56px always, which collapsed the hub hierarchy when authors forgot to mark satellites — fixed.
- Flat editorial disc treatment (May 2026 refactor): removed glossy specular highlights, concentric inner detail rings, and the secondary "gravity-well" ring. The hub now reads as a print-newsroom diagram, not a 3D UI mockup ("marbles and bubbles"). Hub presence comes from radius differential + display-weight in-circle numeral.
- Hub-side convergence terminator: a small filled dot where each spoke meets the hub, pulling the eye inward to the chokepoint. Matches FT/Reuters convention for dependency diagrams.
- Edge curvature: 0.18 default (curved bezier, reads "designed"), but **0 for bipartite** (straight diagonals — curves there add noise without information). Correct.
- `actor` → `RoundedRectNode`, `concept` → `DiamondNode`, `nation`/`institution` → `CircleNode`. Hexagon retained but unwired by default (off-brand for editorial register).
- Five-step narrated-camera animation when `cameraPath` is set: pans, focus isolation (dim + blur + scale), single-step label overlay top-right.
- Stress-test guard: `warnIf(nodes.length > 8)` cross-references DIAGRAM_TEMPLATE_SELECTOR.md.
- Callout treatment: thin amber accent rule on inner edge + display-weight value + mono-caps muted label. No bordered box. Matches the doctrine-D shift (drop card chrome).

What still diverges:
- The static-mode entrance is 5 staggered phases (structure → nodes → edges → controls → callouts) — readable, but slightly busier than the FT/Economist convention of "everything on by 0.8s, then the camera does the work." The cinematic narrated-camera mode is the eventual default; static mode is the fallback.
- No automatic protagonist detection: authors must mark `importance: "primary"` manually. Otherwise the template assumes "flat" sizing.
- No explicit blocking or warning when `bipartite` is selected without `side: "left" | "right"` on every node — fails silently into single-column.

## 6. Specific upgrades proposed

1. **Bipartite `side` validation.** Hard error (not warn) when `layout: "bipartite"` and any node lacks a `side`. Currently fails into a single-column rendering with no signal to the script writer. Effort: trivial; impact: high (catches errors before render).
2. **Force `cap` on bipartite right column.** Lint-warn when bipartite right column > 3 — the form's editorial point is "many → few," and a right column of 5+ is a mesh, not a bipartite. Effort: small; impact: medium.
3. **Implicit hub detection.** When a node has degree ≥ N-1 (connects to all others), auto-suggest `importance: "primary"` via a soft warn — guides script writers to use the mass-hierarchy machinery without reading the dossier. Effort: medium; impact: medium.
4. **Edge emphasis field.** Mirror SankeyFlow's `link.emphasis?: "accent" | "muted"` — let visual-spec promote one inbound dependency without per-frame color overrides. The current `edge.color` is too low-level; an emphasis token cascades better through directing language. Effort: medium; impact: high for narration peaks.
5. **`vertical-chain` typographic refit.** Vertical chain currently inherits the horizontal-chain label-below-node placement; flipping to label-right-of-node for vertical-chain reads cleaner (Economist convention for org charts and lineage cascades). Effort: small; impact: medium.
6. **Deprecate hexagon from defaults.** Document inline in `types.ts` that hexagon is reserved for explicit lattice arguments — current type enum invites authors to pick it as a "cooler circle." Effort: trivial; impact: small but compounding.

## 7. Failure mode flags (always catch in audit)

- **Hairball / generic force-directed** — no clear protagonist, edges crisscross, viewer cannot extract structure. Replace with hub-spoke, bipartite, or matrix.
- **>8 nodes in hub-spoke** — see safe-count below; the form collapses into "many things in a circle." Demote to SankeyFlow (if allocation) or DataChart tabular.
- **Flat sizing on a real hub** — protagonist marked as `secondary` (or all undefined) when narration treats it as a chokepoint. Mark `importance: "primary"` so the hub blooms.
- **False hub** — `primary` set when there is no real chokepoint, just to "make it look organized." Imposes false hierarchy.
- **Bipartite without `side`** — silently renders as single column. Hard error in audit until §6.1 ships.
- **Bipartite mesh** — right column ≥ 5; pick a different layout.
- **Geography would have been the better encoding** — entities are real places, distances matter. Switch to ChoroplethMap or RouteAnimation.
- **Cycles drawn as DAG** — feedback loops hidden in a left-to-right chain. Use dashed back-edges or switch to FrameworkDiagram cycle.
- **Edge labels on curved edges that cross** — labels untether from edges. Move to controls or callouts.
- **Hexagon node for nations/institutions** — reads as blockchain/mesh UI. Use circles.
- **Glossy / 3D node treatment** — if you see specular highlights, inner rings, or "marble" shading, the May 2026 refactor was reverted somewhere. Restore flat disc.

> **Safe-count range (NetworkDiagram hub-spoke, May 2026 stress-test):** 4–7 spokes at typical label length (≤ 25 chars per node, optional ≤ 30-char sublabel). Above 7 spokes OR with long labels (60+ chars), node CIRCLES still place cleanly on the radial layout (uniform angular spacing scales arbitrarily), but the LABELS at 3-o'clock and 9-o'clock positions collide with adjacent spokes and the hub stat reads through them. The stress build (12 spokes × 60-char labels) showed two failure layers: (i) horizontal-axis labels overlap each other end-to-end at radii smaller than the longest label, and (ii) the hub's `stat` callout ("92% of advanced-node chips") gets crossed through by the 3-o'clock and 9-o'clock spoke labels.
>
> The form's editorial argument *is* the spoke count — "every leading-edge designer goes through TSMC" reads at 5–6 spokes; above that the visual collapses into "many entities in a circle" with no protagonist legibility. If an episode needs to enumerate ≥ 8 dependent entities, route to a **bipartite** layout (where vertical-list inventory absorbs the count cleanly, see §2b), to a Sankey (where width carries volume), or to a tabular DataChart variant rather than fighting the radial-label layout.

> **Safe-count range (bipartite, May 2026):** Left column 6–10 entries × right column 1–3 entries reads cleanly. Above 10 left entries the column scrolls past the vertical content area; above 3 right entries the diagonals fan out enough that they read as a mesh rather than a convergence. Long labels on the left column (>30 chars) crowd the diagonals — truncate or move to sublabel.

## TL;DR

**Reach for hub-spoke when one chokepoint dominates (4–7 spokes, mark the hub `primary` to bloom the 96/36 mass hierarchy). Reach for bipartite when "many → one" — a vertical inventory of dependents converging on one or two targets reads as enumeration, not ornament. Avoid force-directed hairballs. Flat editorial discs, single accent color on the loaded edges, hub-side convergence dots, the camera does the narration.**

Last updated: May 14, 2026.
