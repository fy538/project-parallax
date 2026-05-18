# Template Research Dossier — DecisionTree

> **Status: canonical.** Updated May 13, 2026 with full canonical-idioms research + gap analysis. See `_FORMAT.md` for dossier structure.

## Editorial purpose

DecisionTree is the right answer when the editorial point is **sequential choice under uncertainty** — one actor moves, the opponent (or fate) responds, and the drama is in the *branching*. The form encodes "what if X chose Y" at every node. It is distinct from GameBoard (simultaneous moves, Nash equilibrium) and from FrameworkDiagram flow (deterministic A→B→C without choice). Canonical use cases: forecasting under contingency, Allison-style ExComm deliberation, chess-opening trees, escalation paths where each rung has a counterfactual.

## Canonical idioms

### 1. Horizontal extensive-form tree with typography-only nodes — NYT Upshot canon

The seminal piece is Bostock & Carter's *512 Paths to the White House* (NYT, 2012). Layout: D3 Reingold–Tilford tidy tree, root at top, terminals at bottom (vertical when terminals are *outcomes*; horizontal when terminals are *consequences over time*). Nodes are **typography only** — state abbreviation set in serif/sans cap, no card chrome, no border, no fill. Edges are **thin solid grey curves** (~1 px). The decisive treatment is **color-coded edge weight on the active path**: chosen edges turn solid blue or red (~2 px), unchosen edges stay grey at reduced opacity. **There is no node "highlight" in the dashboard sense — the *edge* carries the emphasis.**

NYT/FT explanation-tree variants (vaccine/booster pathway, Putin-decision-path 2022) use the same logic: serif label, typographic-only nodes, thin solid edges, muted ink + one accent color. Probabilities appear only when sourced (Tetlock / Good Judgment Project style) and render as small mono on the edge itself, not in a separate badge floating above the node.

### 2. Allison nested rectangles → flat options panel — the deliberation canon

The seminal diagram in *Essence of Decision* (1971/1999, Allison & Zelikow) for Cuban Missile Crisis ExComm options **is not a tree** — it's a vertical stack of bordered panels, each labeled with the option's *name in display weight* and the consequences as **short prose paragraphs inside the panel** (not bullets, not nested mini-trees). RAND's nuclear-escalation studies (Kahn-derived) follow the same form. **Crucially, Allison's panels are not children of a root node — there's no root + branches structure. They're a list. The "tree-ness" is implicit in the prose, not the geometry.**

### 3. Game-theory extensive-form (textbook canon)

Schelling, Axelrod, Osborne — nodes are tiny circles (chance) or squares (decision), edges are straight black lines with action labels *along* the edge, terminal payoff pairs as `(a, b)` tuples in Mono. No card chrome ever. Stratechery and Matt Levine reproduce this style when they need it.

### 4. Kahn ladder — Economist / FP canon

When the editorial point is *escalation*, outlets converge on a literal numbered ladder (rungs stacked vertically, no branching) with each rung a single phrase + brief gloss. *On Escalation* (1965) used a 44-rung table; The Economist and FP redraw it as a stepped staircase or numbered list with weight-of-rule indicating severity. **Parallax already has this as `EscalationLadder`** — a poorly-rendered ladder variant of DecisionTree should usually be re-routed to EscalationLadder.

### Cross-cutting treatment conventions

- **Emphasis is via WEIGHT and SATURATION, not BRIGHTNESS.** FT/NYT/Economist house style: chosen path = solid 2–3 px stroke in ink or a single accent (NYT red/blue, FT oxford-blue, Economist red); unchosen = 1 px solid ink at 25–35 % opacity. **Dashed lines are reserved for *hypothetical* / *uncertain* edges** — they signal "this didn't happen" or "this is speculation." Using dashes for the *chosen* path inverts the convention.
- **No card backgrounds on branch/leaf nodes.** Cards belong to dashboard UX (Notion, Figma, Linear). Editorial node treatment is typography on the surface, occasionally with a thin baseline rule or a small leading marker.
- **Edge labels sit *on* the edge, mid-segment**, rotated to the edge angle or in a small horizontal break in the line. Mono register (Plex Mono in Parallax), 11–12 pt, ink at 60–70 %. They're often the most important text in the diagram.
- **Probabilities, when shown, are typographic — same family as the body, mono numerals.** Never in a pill/badge with a surface color.
- **Curves vs. orthogonal:** NYT Upshot uses bezier diagonals; FT and Economist often use right-angle/orthogonal connectors. Pure straight diagonals read as math-textbook, not editorial. Parallax uses `smoothStepEdge` (cubic bezier with vertical control points) which sits between the two.

## Parallax defaults

### Variant chooser (five aesthetics as of May 18, 2026)

| Variant | When to pick | Visual signature |
|---|---|---|
| `extensive` (default) | Contingency / scenario branching with curved-edge typographic register | Typography-only nodes, smooth-step bezier edges, canvas viewport with virtual camera pan |
| `ladder` | Allison-style deliberation: "decision-maker X weighed N options and picked this one" — ExComm 1962, Politburo, boardroom | Flat option list, left-rail ordinal numerals, 3px accent left-bar + faint walnut tint on the highlighted option (no card-chrome rectangles) |
| `indented` | Script-density reasoning, policy taxonomies, branching outlines; tall narrow trees where horizontal branching wastes space | Manuscript outline; depth = horizontal indent; Plex Mono ordinals (1, 1.a, 1.a.i); right-aligned probability column when gated |
| `spine` | Sequential decision moments along a through-line; "the world forked here, then again there" — ≤3 levels deep | Vertical ordinal spine on the left; rung labels in display weight; discarded alternatives fan rightward as hairlines + leaf dots; non-highlighted fans dim to 35% when a `highlightedPath` exists |
| `schematic` | Engineering-drawing register; wargaming nomographs, contingency planning trees, technical "and-then-then" sequences | Thin-bordered boxed nodes with mono corner ordinals (`01`, `02`, …); orthogonal right-angle edges (parent → vertical → horizontal → vertical); same canvas-camera-pan as `extensive` |

### Field-level guidance (applies across variants except where noted)

- **Node labels describe the STATE; edge labels describe the TRANSITION.** Use `node.edgeLabel` (added May 13, 2026) for qualitative branch character ("Sharp", "Mainline", "Drift away") — it renders mid-segment on the incoming edge in the metadata mono register.
- Keep `probabilityWeights: false` (the default) unless every numeric `%` in `nodes[].probability` traces to a named source in `data.source`. The schema automatically suppresses numeric strings matching `/\d+\s*%/` when this gate is off; qualitative labels always render. Probability labels now render on the EDGE mid-segment alongside (or in place of) `edgeLabel` — same gate.
- Mark the protagonist branch with `highlightedPath: [...]`. Mark the current "you are here" node with `active: true` — it gets a 2 px accent underline (replaces the prior accent-glow shadow).
- For extensive-variant trees, `highlightColor` defaults to the per-episode primary accent (`useEpisodeColorEmphasis`) — typically oxblood. **Don't hardcode green or off-palette accents.**
- The default `cameraPath` now ARGUES rather than inventories when a `highlightedPath` is set: establish on root → reveal the fork → drive the chosen path leaf-by-leaf → glance at one named counterfactual → return to the chosen leaf and hold. Override only when the script needs a specific framing.
- Cap depth at ~3 levels × 2 branches (≈12 terminals) per the SELECTOR. Beyond that, split into staged compositions or demote the deep tail to a tabular DataChart.
- **Ladder variant is now flat, not nested.** Top-level options stack as panels; the FIRST CHILD's label (and any subsequent children's labels, joined) renders as the consequence prose INSIDE the panel — matching Allison's actual book layout. If the script needs deep nesting, it wants the extensive variant or two staged ladders, not arbitrary recursion.

## Failure mode flags

- **Numeric `%` probabilities with `probabilityWeights: false` AND no `data.source`** — the schema currently strips these; if the script depends on the percentage landing, either cite a source and flip the gate, or rewrite to a qualitative label.
- **Numeric `%` probabilities with `probabilityWeights: true` but no `data.source`** — "invented probabilities are worse than no probabilities." Reject in audit.
- **Simultaneous-move scenarios rendered as DecisionTree** — wrong template. The math is Nash equilibrium, not expected value. Route to GameBoard.
- **Tree with no `highlightedPath` and no `active` node** — reads as inventory of possibilities rather than an argument with a protagonist branch. The default camera falls back to a simple establish→pullback tour, but the audit-skill should flag this.
- **Depth exceeding ~12 terminals** — visual collapses; viewer can't track. Split or demote.
- **Dashed edges** — dashes mean *hypothetical*, not *chosen*. The template now renders all edges solid by default; a future `edge.speculative` flag can opt back in to dashes for explicitly counterfactual edges.
- **Linear escalation rendered as DecisionTree** — if there are no real branches (each rung has exactly one successor), the form is an `EscalationLadder`, not a DecisionTree. Route accordingly.
- **Card chrome on branch/leaf nodes** — the May 13, 2026 refactor dropped node card backgrounds in favor of typography-only rendering. Don't reintroduce them.

## Current template alignment

- `node.edgeLabel` field (added May 13, 2026) matches canon — transition labels on edges, not nodes.
- `probabilityWeights` editorial gate matches canon: numeric percentages are suppressed by default unless explicitly opted-in.
- Node styling matches NYT Upshot canon: typography-only, no card chrome, active-node underline.
- Ladder variant matches Allison's actual book layout: flat options panel + prose gloss.
- **Horizontal layout shipped May 15, 2026 (commits `ff6b14d`, `8f52d9b`).** Adds a horizontal Reingold–Tilford layout option (root at left, terminals at right) alongside the existing vertical canon. Both layouts now use **track-style path highlighting** in the FT race-stripe register: a thick translucent ribbon underlay traces the highlighted path while individual edges remain hairlines on top.
  - Horizontal mode: 7px amber ribbon for on-path edges; off-path edges render at 1px in muted ink. Left margin tuned to 12% (was 8%) and edge labels anchor near the fork rather than mid-edge so they read as branch decisions, not transit annotations.
  - Vertical mode: parity pass landed May 16, 2026 (commit `efe7651`). 5px ribbon (smaller than horizontal because vertical row-gap is closer, so a 7px ribbon dominates the gap rather than tracing it); r=3.5 arrowhead at child top of each on-path segment to carry the direction read; off-path dim 0.5 → 0.6 and edge mute 0.30 → 0.25 (slightly more dimming, slightly less mute on the line itself — keeps off-path edges legible enough to register as alternatives without competing).
  - Both modes preserve the FT/NYT canon of "emphasis via weight + saturation, not brightness or dashes."
- Edge styling matches FT/NYT canon: solid emphasis (no dashes, no glow filter) with the ribbon-underlay treatment encoding the chosen path.
- Camera path is now editorial (argument arc) rather than inventory (tour).

## References

- `DIAGRAM_TEMPLATE_SELECTOR.md` — selection wall-table
- `src/templates/DecisionTree/types.ts` — schema reference (including `edgeLabel` field)
- `src/hooks/useTreeCamera.ts` — `generateDefaultCameraPath` (highlighted-path-aware argument camera)
- `diagram-audit` skill — runtime audit lens
- `references/template-research/game-theory.md` § A2 (Allison nested rectangles), § A4 (probability discipline)

### Canonical pieces (external)

- NYT — *512 Paths to the White House* (Bostock/Carter, 2012)
- FT Visual Vocabulary (Schwabish & Chalabi via FT) — scenario-tree section
- Allison & Zelikow — *Essence of Decision*, 2nd ed., 1999 (the ExComm options diagram)
- Schelling — *The Strategy of Conflict* (1960); Axelrod — *The Evolution of Cooperation* (1984) — extensive-form canon
- Kahn — *On Escalation* (1965); Economist redraws — escalation-ladder canon
- The Pudding visual-essay structure — explanation-tree narrative conventions

---

Last revised: May 18, 2026 — three new variants landed in the research-driven aesthetic exploration: `indented` (manuscript-outline register), `spine` (Kahn-ladder-derived stem-and-leaf), `schematic` (engineering-drawing boxed nodes + orthogonal edges). Pre-existing `ladder` variant got a POLISH.md D1 cleanup (per-option borders replaced with left-rail accent). Sibling template `OutcomePartition` shipped for the "decision space narrows" register that doesn't fit a tree gestalt. See `PARALLAX_VISUAL_VOCABULARY.md` § 10 for the chooser table.
