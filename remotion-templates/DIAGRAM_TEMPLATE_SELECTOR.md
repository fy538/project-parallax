# Diagram Template Selector — Wall-Table

> One page. Pin it. When a script beat needs a structural / conceptual diagram, look here BEFORE writing visual-spec JSON.
>
> Last updated: May 17, 2026

> **⚠ DELETED TEMPLATE — DO NOT PICK.** `BifurcationRoute` was removed from the codebase May 13, 2026 (phylogenetic-tree register didn't fit Parallax; no queued episodes required it). Rows below mentioning BifurcationRoute are kept only for historical context — the template no longer exists and rendering one will produce a silent null segment. **For "forked future / scenario divergence" use `DuelingFrameworks` (two head-to-head scenarios) or `DecisionTree` (branching with probabilities) instead.**

**Nine live diagram templates** with overlapping-but-distinct purposes. This family is the most under-indexed in the codebase — easy to mis-route. Picking wrong wastes hours and produces visuals that argue the wrong thing.

Full editorial rationale and failure modes live in the per-template dossiers under `references/template-research/`:
- [`framework-diagram.md`](references/template-research/framework-diagram.md)
- [`network-diagram.md`](references/template-research/network-diagram.md)
- [`sankey-flow.md`](references/template-research/sankey-flow.md)
- [`escalation-ladder.md`](references/template-research/escalation-ladder.md)
- [`game-theory.md`](references/template-research/game-theory.md) (GameBoard)
- [`arc-diagram.md`](references/template-research/arc-diagram.md) (ArcDiagram)
- DecisionTree, StrategicLandscape, DuelingFrameworks, PricingWaterfall — no dedicated dossier yet, see `template-picker.md`
- ~~BifurcationRoute~~ — DELETED; see banner above

---

## The selection question

```
What KIND of structure are you showing → which TEMPLATE
```

| Structure | Template |
|---|---|
| Two or more concepts compared side-by-side (parallel rows) | **FrameworkDiagram (comparison variant)** |
| A → B → C sequential chain or causation | **FrameworkDiagram (flow variant)** |
| 2×2 typology (two independent axes, four cells) | **FrameworkDiagram (matrix variant)** |
| Peer-to-peer relationship web (hub + spokes, alliance graph) | **NetworkDiagram** |
| Relationships among items on a single ordered axis (chord-arc above a horizontal spine) | **ArcDiagram** — same nodes-and-edges domain as NetworkDiagram but with positional ordering (chronological, alphabetic, severity-ranked). Use when the relationships matter AND the linear ordering of the items is part of the editorial point. Bloomberg / FT supply-chain diagrams often pick this form when one axis is "ordered by year" or "ordered by tier." |
| Sequential choice under uncertainty (branching with probabilities) | **DecisionTree** |
| Simultaneous strategic choice (payoff matrix, Nash equilibrium) | **GameBoard** |
| Conserved-total allocation (where it splits and flows) | **SankeyFlow** |
| Escalating severity / crisis intensity / ladder of moves | **EscalationLadder** |
| Two opposing frameworks compared (head-to-head) | **DuelingFrameworks** |
| A path bifurcates into two scenarios / futures | **DuelingFrameworks** or **DecisionTree** ← was BifurcationRoute (DELETED) |
| Single fixed total broken into stage segments ($1 → stages) | **PricingWaterfall** |
| Positions on 2D axes (capability vs. intent, strategic landscape) | **StrategicLandscape** |

---

## Decision tree

```
Is the editorial point about a STRUCTURE / framework?
│
├─ Is it about HOW THINGS FLOW or CONNECT?
│   ├─ Sequential causation (A→B→C, ordered stages) ──── FrameworkDiagram (flow)
│   ├─ Peer-to-peer web of relationships ──────────────── NetworkDiagram
│   ├─ Same nodes-and-edges, BUT items have a meaningful linear order ──── ArcDiagram (spine + chord arcs)
│   ├─ Conserved total being allocated (% adds up) ────── SankeyFlow
│   └─ One fixed total ($1) decomposed into stages ────── PricingWaterfall
│
├─ Is it about CHOICES / STRATEGY?
│   ├─ Sequential branching choices + probabilities ──── DecisionTree
│   ├─ Simultaneous payoff matrix (Nash, PD) ─────────── GameBoard
│   └─ Forked future / scenario divergence ───────────── DuelingFrameworks (or DecisionTree) ← was BifurcationRoute (DELETED)
│
├─ Is it about COMPARISON / TYPOLOGY?
│   ├─ Two systems compared row-by-row (parallel) ────── FrameworkDiagram (comparison)
│   ├─ Two FRAMEWORKS head-to-head, full hero ─────────── DuelingFrameworks
│   ├─ 2×2 cells (two independent axes) ─────────────── FrameworkDiagram (matrix)
│   └─ Positions on 2D space (capability×intent etc.) ── StrategicLandscape
│
├─ Is it about ESCALATION / SEVERITY?
│   └─ Vertical ladder of intensifying events (5-7 rungs) ──── EscalationLadder
│
└─ (If none fit, your beat may be a different family — re-check TEMPLATE_FAMILIES.md)
```

---

## Sibling-template disambiguation

The hardest part of diagram selection: choosing between siblings with overlapping purposes.

### FrameworkDiagram (flow) vs. NetworkDiagram

| | FrameworkDiagram flow | NetworkDiagram |
|---|---|---|
| Direction | A → B → C, ordered, hierarchical | Bidirectional, peer-to-peer |
| Editorial point | Sequence / causation matters | Topology / web of connections matters |
| Sample sentence | "First X happens, which triggers Y, which leads to Z" | "Here's how all the actors connect" |
| Max nodes | 6-8 in a chain | 7 spokes around a hub; ND collapses above 8 entities |
| If exceeded | Should be small multiples, not one flow | Should be SankeyFlow (allocation) or tabular DataChart |

### DecisionTree vs. GameBoard

| | DecisionTree | GameBoard |
|---|---|---|
| Choice timing | Sequential (one moves, opponent responds) | Simultaneous (both decide blind) |
| Editorial point | Drama of branching, "what if X chose Y" | Strategic trap — "both rational actors choose badly" |
| Probabilities | First-class (per branch) | Implicit in payoff weighting |
| Max depth | 3 levels × 2 branches = ~12 terminals | 2×2 or 3×3 strategies per side |
| Canonical use | Forecasting, scenario branching, Cuban missile crisis ExComm | Prisoner's Dilemma, Nash analysis, deterrence |

### FrameworkDiagram (flow) vs. SankeyFlow

| | FrameworkDiagram flow | SankeyFlow |
|---|---|---|
| What flows | Conceptual sequence | Quantitative units (dollars, watts, people) |
| Width meaning | None (decorative) | Proportion / volume |
| Editorial point | "Here's the sequence" | "Here's how the total splits" |
| Requires | Ordered stages | A conserved total (must sum) |
| Max scale | 6-8 stages | Up to 10 nodes / 15 ribbons; spaghetti beyond |

### FrameworkDiagram (matrix) vs. GameBoard

| | FrameworkDiagram matrix | GameBoard |
|---|---|---|
| 2×2 of what | Concepts (typology) | Payoffs (strategic stakes) |
| Editorial register | Organizational clarity | "Rational actors trap themselves" |
| Nash equilibrium | N/A | Must be highlighted (border, glyph, arrows) |
| Sample sentence | "There are four kinds of X" | "Both will defect even though cooperation wins" |

### EscalationLadder vs. TimeSeriesChart

| | EscalationLadder | TimeSeriesChart |
|---|---|---|
| Mode | Discrete rungs, qualitative | Continuous data, quantitative |
| Editorial point | "Each step was inevitable" | "Look at the slope / inflection" |
| Max events | 5-7 rungs (above → silent clipping) | 20+ data points fine |
| Sample sentence | "First sanctions, then asset freezes, then SWIFT" | "Trade volume rose 40% then crashed" |

### SplitComposition vs. FrameworkDiagram (comparison) vs. DuelingFrameworks

| | SplitComposition | FrameworkDiagram comparison | DuelingFrameworks |
|---|---|---|---|
| Family | Typography/layout | Diagrams | Diagrams |
| Mode | Visual / image-based opposition | Attribute-based parallel rows | Full hero treatment of two frameworks |
| Editorial point | "These two visuals are opposites" | "These two systems differ on X, Y, Z" | "Here are two competing models" |
| Example | Soviet vs. American factory floor photos | Western capitalism vs. state capitalism rows | Realism vs. liberalism IR theory |

---

## Mode flags by template

These compose on top of any base template:

| Template | Common flags / variants |
|---|---|
| FrameworkDiagram | `variant: "matrix" \| "flow" \| "comparison" \| "hero"`; `heroStage` (which stage gets emphasis) |
| NetworkDiagram | hub-spoke layout default; ≤7 spokes for label legibility |
| DecisionTree | `cameraPath` for autofocus; `nodes[].probability` for branch labels |
| SankeyFlow | `linkOpacity`, `nodeColor`; conservation enforced by schema |
| GameBoard | `cells[].highlight: boolean` to mark Nash equilibrium; per-round `highlights: number[]` for iterated play |
| EscalationLadder | Cap rungs to 5-7 in data (template has no `safeRungCount` field; ≥8 rungs is silently clipped — runtime warnIf at >7) |
| PricingWaterfall | `stages[].hero: boolean` marks the editorial protagonist (renders in accent color) |

---

## Mandatory overlays

Every data-bearing diagram MUST include:

1. **Source attribution** at the bottom-right (FooterStrip OR a tertiary annotation). For diagrams citing real data (payoff matrices with citations, escalation ladders from official doctrine), provenance is required.
2. **Editorial labels** for every visible node / cell / rung. Unlabeled circles read as decorative.
3. **Hierarchy emphasis** — at least one node should be the focal point (FrameworkDiagram `heroStage`, NetworkDiagram hub, EscalationLadder current-rung-highlight, GameBoard equilibrium-cell). Diagrams without a focal point read as inventory, not argument.

---

## Quick-fail checklist (read before generating JSON)

- [ ] Does the structure match the template? (sequence → flow; web → network; allocation → sankey; choice → tree/game; etc.)
- [ ] Is the node / cell / rung count under the template's safe range?
- [ ] Is there a labeled hierarchy / focal point?
- [ ] Is there source attribution if the diagram cites real data?
- [ ] Could a sibling template tell the story better? (re-check disambiguation tables)

---

## Common mistakes — flagged by `diagram-audit` skill

1. **NetworkDiagram with >7 spokes** → label collisions; demote to SankeyFlow or DataChart tabular.
2. **DecisionTree with simultaneous moves** → use GameBoard instead. The math is *Nash equilibrium*, not *expected value*.
3. **SankeyFlow without a conserved total** → ribbons don't sum to a meaningful number; use FrameworkDiagram flow instead.
4. **EscalationLadder with >7 rungs** → silent clipping below safe-area; cap rungs or split into multiple compositions.
5. **GameBoard without Nash equilibrium highlight** → viewer can't find the analytical punchline; set `cells[].highlight: true` on the equilibrium cell.
6. **FrameworkDiagram (comparison) with non-parallel rows** → one column padded with placeholder; if rows can't be parallel, use SplitComposition (visual) or DuelingFrameworks (conceptual).
7. **FrameworkDiagram (matrix) with dependent axes** → matrix collapses to a line; should be DataChart or a single-axis form.
8. **Payoff numbers without units or source** in GameBoard / DecisionTree → cite or omit. Invented probabilities are worse than no probabilities.
9. **PricingWaterfall without any `stages[].hero: true`** → loses the editorial punch (the whole point is to highlight the disproportionate slice in accent color).
10. **Diagram without a focal point / hero stage** → reads as inventory, not argument.

---

## References

- `references/template-picker.md` — long-form selection prose
- `references/template-research/` — per-template dossiers
- `TEMPLATE_FAMILIES.md` — cross-family wayfinding index
- `BRAND.md` — design system
- `POLISH.md` — D1-D18 editorial doctrine (drop card chrome, ordinal numbering, hero hierarchy)
