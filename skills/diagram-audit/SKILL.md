---
name: diagram-audit
description: >
  Audit the diagram shots in a Parallax production script against the 10
  diagram templates (FrameworkDiagram, NetworkDiagram, DecisionTree,
  EscalationLadder, GameBoard, SankeyFlow, DuelingFrameworks, BifurcationRoute,
  PricingWaterfall, StrategicLandscape) and their data files. Catches sibling
  confusions (DecisionTree vs. GameBoard, flow vs. Sankey, comparison vs.
  matrix), density-cap violations (>7 spokes on NetworkDiagram, >7 rungs on
  EscalationLadder, spaghetti Sankeys), missing focal hierarchy, and missing
  source attribution. Sister to script-audit and visual-concept; runs after
  script-draft, before or alongside visual-spec.

  Use whenever someone asks to "check the diagrams", "audit the diagram shots",
  "are the right diagram templates picked", "diagram review", "diagram audit",
  or when finalizing a script that contains multiple diagram beats. Trigger
  proactively when [MG:] beats route to NetworkDiagram (most-overused),
  FrameworkDiagram (variant most-mis-selected), or DecisionTree/GameBoard
  (canonical confusion).
---

# Diagram Audit

You are auditing the **diagram shots** in a Parallax production script for template-fit, structural-shape correctness, density-cap compliance, focal hierarchy, and overlay completeness. The diagram family has 10 overlapping-but-distinct templates — the most under-indexed family in the codebase. Sibling confusion (DecisionTree vs. GameBoard, NetworkDiagram vs. SankeyFlow, FrameworkDiagram-flow vs. SankeyFlow) is the dominant failure mode. Your job is to surface mismatches with specific replacements before they ship.

## Context

The canonical "if your structure looks like X, use template Y" lookup is `remotion-templates/DIAGRAM_TEMPLATE_SELECTOR.md` — read it BEFORE running the audit. The 10 diagram templates each encode a specific editorial argument; picking the wrong one produces visuals that argue something subtly different from the narration.

You are NOT generating new visual-spec JSON. You are reading what's already there (in script + data file form) and flagging issues with concrete remediation suggestions.

## When to use this skill

- After `script-draft` produces a draft with diagram beats.
- Before `visual-spec` so any reshape is done while it's cheap.
- When porting an older episode's diagram data to the current template registry.
- Standalone "are my diagrams right" check at any pipeline stage.

Sister skills:
- **`script-audit`** — narrative quality (transitions, lecture patterns, pacing).
- **`visual-concept`** — visual layer feasibility BEFORE visual-spec.
- **`map-audit`, `chart-audit`, `timeline-audit`, `typography-audit`** — family siblings.
- **`visual-spec`** — generates the actual JSON data files.

This skill is narrowly scoped: ONLY diagram beats, ONLY the template-selection / density / hierarchy / overlay dimensions.

## Inputs

1. **The script file** (required) — typically `episodes/<slug>/script-production.md`.
2. **The data files** (when they exist) — `remotion-templates/data/episodes/<slug>/*.json`.
3. **DIAGRAM_TEMPLATE_SELECTOR.md** (read at start) — the canonical selection wall-table.
4. **Per-template dossiers** (read on demand) — `remotion-templates/references/template-research/{framework-diagram, network-diagram, sankey-flow, escalation-ladder, game-theory}.md`.

## Reference docs (read first)

1. **`remotion-templates/DIAGRAM_TEMPLATE_SELECTOR.md`** — the wall-table. Memorize the sibling-disambiguation tables.
2. **`project/SCRIPT_FORMAT.md`** — how `[MG:]` + `TEMPLATE: X` lines work.
3. **The 5 diagram dossiers** under `remotion-templates/references/template-research/`.

## The eight audit lenses

Run each lens INDEPENDENTLY. For each issue, produce:
- **Location:** beat / line number / file path
- **Problem:** what's wrong in one sentence
- **Replacement:** the specific template / variant change to fix it

### Lens 1 — Sibling-template mis-routing

The most common failure mode. For each diagram beat, ask which sibling pair could apply:

**1a. FrameworkDiagram (flow) vs. SankeyFlow.**
If the narration mentions volumes, percentages, or "splits into" with quantities → SankeyFlow. If it's purely conceptual sequence with no width-meaning → FrameworkDiagram flow.
→ Flag: data file uses FrameworkDiagram flow but `nodes[]` carry numeric values that the visual ignores.

**1b. FrameworkDiagram (flow) vs. NetworkDiagram.**
Ordered / hierarchical / "A→B→C" → flow. Bidirectional peer-to-peer web → NetworkDiagram.
→ Flag: NetworkDiagram with a clear directional spine (everything points the same way).

**1c. DecisionTree vs. GameBoard.**
Sequential branching with one mover at a time → DecisionTree. Simultaneous blind choice with payoff matrix → GameBoard.
→ Flag: DecisionTree narration that talks about "both sides choose at the same time"; GameBoard narration with "then X moved, so Y responded."

**1d. FrameworkDiagram (matrix) vs. GameBoard vs. StrategicLandscape.**
2×2 typology of CONCEPTS → matrix. 2×2 of PAYOFFS with Nash equilibrium → GameBoard. Positions on continuous 2D axes → StrategicLandscape.
→ Flag: matrix used where the cells contain payoffs (should be GameBoard); GameBoard used where cells are conceptual.

**1e. SplitComposition vs. FrameworkDiagram (comparison) vs. DuelingFrameworks.**
Visual/image opposition → SplitComposition. Attribute rows compared → FrameworkDiagram comparison. Two full hero frameworks → DuelingFrameworks.
→ Flag: FrameworkDiagram comparison used when the contrast is really visual (should be SplitComposition).

### Lens 2 — Density cap violations

Each template has a safe-area cap. Above the cap, the visual collapses.

| Template | Cap | Failure mode |
|---|---|---|
| NetworkDiagram | 7-8 nodes | Label collision at 3/9 o'clock |
| EscalationLadder | 5-7 rungs | Silent clipping below safe area |
| SankeyFlow | 10 nodes / 15 ribbons | Spaghetti, proportion unreadable |
| FrameworkDiagram (flow) | 6-8 stages | Should be small multiples |
| DecisionTree | 3 levels × 2 branches (~12 terminals) | Tree overflows hero zone |

→ Flag: any data file exceeding cap. The runtime `warnIf` fires per-frame; the audit catches it at script-review.

### Lens 3 — Missing focal hierarchy

Every diagram MUST have a focal point (POLISH D-rule):
- FrameworkDiagram → `heroStage` set
- NetworkDiagram → hub identified
- EscalationLadder → current-rung-highlight or accent
- GameBoard → equilibrium cell flagged via `cells[].highlight: true` (and/or per-round `highlights[]`)
- DecisionTree → critical path emphasized
- PricingWaterfall → smallest-sliver accent

→ Flag: any diagram data file with NO focal emphasis. Reads as inventory, not argument.

### Lens 4 — Missing source attribution

Every data-bearing diagram MUST cite a source. For:
- Payoff numbers (GameBoard, DecisionTree)
- Doctrine ladders (EscalationLadder citing real-world escalation schemas)
- Flow quantities (SankeyFlow with dollar/watt/people values)
- Comparison facts (FrameworkDiagram comparison rows)

→ Flag: data file without `source` field on a data-bearing diagram.

### Lens 5 — Invented numbers

For GameBoard, DecisionTree, BayesianUpdate (if cross-family):
- Payoff numbers without unit + source → flag as P0
- Probabilities without "estimate based on…" provenance → flag as P0

Invented probabilities are worse than no probabilities. Cite or omit.

### Lens 6 — Non-parallel rows in FrameworkDiagram comparison

If FrameworkDiagram comparison has:
- Different row counts per column → flag
- Rows where one side reads "—" or "N/A" → flag
- Asymmetric label structure ("X is a doctrine" vs. "Y, the foundation of…") → flag

→ **Replacement:** SplitComposition (if visual contrast) OR DuelingFrameworks (if conceptual contrast that can't be parallelized).

### Lens 7 — TimelineComparison-style structural rhymes misrouted to diagrams

If a script beat says "structural rhyme between 1812 and 2022" with TWO ERAS → that's TimelineComparison (Timelines family), not a FrameworkDiagram comparison. Cross-family flag — refer to `timeline-audit`.

### Lens 8 — Schema / data-file health

For each diagram data file referenced in the script:
- Validate against Zod schema (pre-commit hook does this; audit catches drift).
- Confirm the data file's structure matches the script's claim (if narration says "5 escalating moves," ladder data has 5 rungs).
- Confirm visible labels match what the narrator says.

## Output format

```markdown
# Diagram Audit — <episode slug>

**Diagrams in this episode:** <count>
**Issues found:** <P0> P0 (blocks render or falsifies argument), <P1> P1 (visually wrong), <P2> P2 (cosmetic)

---

## P0 — Render-blocking or argument-falsifying

### Beat <N>, line <X> — <one-line summary>
- **Current:** `TEMPLATE: DecisionTree` with simultaneous-choice narration
- **Problem:** The math is Nash equilibrium, not expected value. Wrong analytical frame.
- **Replacement:** Switch to `TEMPLATE: GameBoard`. Restructure data file: payoff matrix in `cells[]` instead of branching tree; set `cells[].highlight: true` on the Nash equilibrium cell.
- **Reference:** DIAGRAM_TEMPLATE_SELECTOR.md § DecisionTree vs. GameBoard

[... repeat per issue ...]

---

## P1 — Visually-wrong but renderable

[same format]

---

## P2 — Cosmetic / opportunity-cost

[same format]

---

## Summary

<2-3 sentences: overall diagram-pipeline health, biggest pattern, recommended next action>
```

If no issues:

```markdown
# Diagram Audit — <episode slug>

**Diagrams in this episode:** <count>
**Issues found:** 0 — diagram templates are correctly assigned, density caps respected, hierarchies present.
```

## Doctrine / failure modes to ALWAYS flag

1. **NetworkDiagram with >7 spokes** — P0 (label collision; demote to SankeyFlow or DataChart).
2. **DecisionTree with simultaneous moves** — P0 (wrong analytical frame; use GameBoard).
3. **SankeyFlow without conserved total** — P0 (use FrameworkDiagram flow).
4. **EscalationLadder with >7 rungs** — P0 (silent clipping).
5. **GameBoard without `cells[].highlight: true` on the equilibrium cell** — P0 (analytical punchline missing).
6. **FrameworkDiagram comparison with non-parallel rows** — P1 (placeholder padding; use SplitComposition or DuelingFrameworks).
7. **FrameworkDiagram matrix with dependent axes** — P1 (matrix collapses to a line).
8. **Payoff numbers without source** — P0 (cite or omit).
9. **PricingWaterfall without smallest-sliver accent** — P1 (loses editorial punch).
10. **Diagram without focal point / heroStage** — P1 (reads as inventory).

## Tone

Match the Parallax skill set: terse, surgical, no fluff. Quote the script line being flagged. Cite the selector or dossier reference. Suggest the specific replacement — never just "consider another template."

Tiger is the audience. He knows what GameBoard is. Tell him what's wrong, where, and what to change.
