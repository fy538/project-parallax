# Parallax — Counterfactual Register

> Created: May 19, 2026

## What this document is

The specification for how counterfactual arguments are visually styled across Parallax's data templates. A counterfactual is a claim about what *would have happened* if a historical fork had gone differently — "China's semiconductor output without US export controls," "NATO expansion without the 1994 Budapest Memorandum," "GDP trajectory if the 2008 bailout hadn't passed."

Counterfactual reasoning is one of Parallax's signature analytical moves. The channel's bounded-analogy doctrine (see `project/PROJECT_VISION.md`) depends on it — "this analogy is useful here, breaks down there" requires showing what the alternative trajectory looks like, not just asserting it exists.

This document defines two layers of counterfactual styling:

1. **In-chart counterfactual styling** — marking a specific data series or bar as a projection rather than a historical record, using visual grammar (dashed line, ghost bar) rather than a dedicated template
2. **Dedicated counterfactual templates** — when the counterfactual IS the entire segment, not a modifier on data

The two layers are not interchangeable. Picking the wrong one fails editorially.

**Related docs:**
- **`project/PROJECT_VISION.md`** — Bounded Analogy: The Signature Form (the doctrine that motivates counterfactual reasoning)
- **`references/template-research/counterfactual-path.md`** — dossier for the `CounterfactualPath` template
- **`PARALLAX_VISUAL_VOCABULARY.md`** § 1–2 — counterfactual styling notes per chart type
- **`project/PACING_REGISTER.md`** — pacing of counterfactual beats (typically `breathing`)

---

## The visual contract

**Actual** = solid. **Counterfactual** = dashed + ghosted.

This is borrowed from the cartography and engineering-drawing traditions (proposed route = dashed, surveyed boundary = solid) and adopted by FT, NYT Upshot, and Economist for projection lines. The reader decodes it unconsciously: solid lines are facts, dashed lines are arguments.

The counterfactual visual contract has three components:

| Component | Actual | Counterfactual |
|---|---|---|
| Line style | Solid | Dashed, 12px on / 6px off |
| Bar fill | Gradient solid fill | Transparent, dashed outline |
| Opacity | 100% | 45% |
| Leading-edge dot (TimeSeriesChart) | Present (live recording) | Absent (projection has no recording moment) |
| Glow/drop-shadow | Present | Absent |
| Area fill | Optional | Never (fills the ghost, reads as real) |

Opacity 45% is the deliberate choice: low enough to read as "secondary / hypothetical" against the solid actual line, but high enough to trace the shape at video scrubbing speed. Lower (30%) becomes invisible on light backgrounds; higher (60%) starts to look like a second actual line.

---

## Layer 1: In-chart counterfactual styling

Use when the counterfactual is ONE SERIES among several in a chart that primarily presents actual data. The ghost line or bar is a reference point — "here's where we'd be" — not the main editorial argument.

### TimeSeriesChart — counterfactual series

Add `counterfactual: true` to any line in `lines[]`:

```json
{
  "lines": [
    {
      "label": "Actual semiconductor exports",
      "color": "#C4A747",
      "hero": true,
      "points": [...]
    },
    {
      "label": "Without export controls",
      "color": "#7AA3C9",
      "counterfactual": true,
      "points": [...]
    }
  ]
}
```

**What renders:** dashed line at 45%, no leading-edge dot, no drop-shadow. The label is the only identification — name the hypothetical explicitly ("Without export controls," "Pre-2001 trajectory," "WTO-accession scenario"). A counterfactual line with a generic label ("Scenario B") is uninterpretable.

**Counterfactual zone:** optionally, shade the X-range where the divergence lives:

```json
{
  "counterfactualZone": {
    "fromX": 2022,
    "toX": 2024,
    "label": "Without sanctions",
    "color": "#7AA3C9"
  }
}
```

The zone renders as a faint taupe/bone fill with a dashed left-boundary line and a mono-uppercase label at top-right. Use it when you want to explicitly mark "the divergence begins here." Omit it when the counterfactual line's own shape makes the divergence readable.

**Pairing:** the counterfactual line should always DIVERGE visibly from the actual line somewhere in the chart. If the two lines are nearly identical (small counterfactual effect), the ghost reads as visual noise, not argument. Abandon the in-chart counterfactual and use a `StatReveal` or `DataChart` showing the delta directly.

### DataChart — counterfactual bar

Add `counterfactual: true` to any item in `dataPoints[]`:

```json
{
  "dataPoints": [
    { "label": "China (actual)", "value": 41, "color": "#A64D46" },
    { "label": "China (w/o controls)", "value": 68, "color": "#7AA3C9", "counterfactual": true },
    { "label": "US", "value": 29, "color": "#4A7BA7" }
  ]
}
```

**What renders:** transparent bar with dashed outline, 45% opacity, no specular highlight or gradient. The value label still renders (the number is the argument). Name the bar's label to identify the hypothetical — don't use the same entity name as the actual bar; it reads as a duplicate.

**Constraint:** only `bar` and `horizontal` variants support counterfactual styling. `comparison` variant pairs values in columns, which makes the ghost treatment redundant (the column itself is the counterfactual slot). `lollipop` suppresses the dot stem on the ghost bar — not yet implemented; use `bar` instead.

---

## Layer 2: Dedicated counterfactual templates

Use when the ENTIRE SEGMENT is about the counterfactual — the actual data is context, the fork is the argument.

### CounterfactualPath

The Hawthorn-compliant timeline bifurcation template. Use when:
- The editorial argument IS the road-not-taken: "Had Kennedy not imposed the quarantine, Soviet ships would have reached Cuba by October 24"
- You need to show TWO futures diverging at a named moment (plausibility-annotated branches)
- The script names the decision point explicitly ("October 22, 1962")

**Not** for cases where the counterfactual is a supporting reference point in a data-heavy segment. That's in-chart styling (Layer 1).

### MorphTransition (before/after)

When the counterfactual is about WHAT THE DATA WOULD LOOK LIKE — two DataChart or TimeSeriesChart states where one is "with" and one is "without" — `MorphTransition` can be used as a before/after: the "from" state is the counterfactual, the "to" state is actual (or vice versa, depending on narrative direction). This is rarer than in-chart styling but works well for "watch the bars collapse" editorial beats.

---

## Decision rule: in-chart styling vs. CounterfactualPath

| Situation | Use |
|---|---|
| 1-2 counterfactual data points in a chart that's primarily about actual data | In-chart styling (`counterfactual: true`) |
| The entire segment argues that history could have gone differently | `CounterfactualPath` |
| You want to show quantitative magnitude of the counterfactual effect | In-chart styling — ghost bar next to actual bar |
| You want to show the structural fork moment (one date, two futures) | `CounterfactualPath` |
| Both the actual and counterfactual trajectories are long multi-year series | `TimeSeriesChart` with `counterfactual: true` line |
| You have one branching point and 2+ diverging paths | `CounterfactualPath` (handles multi-branch) |

---

## Editorial discipline (Hawthorn test)

Before rendering any counterfactual — in-chart or template — ask: does this counterfactual pass Geoffrey Hawthorn's three criteria?

1. **The change at the branching point was historically possible** — real actors actually considered it, or the mechanism for it existed
2. **Downstream consequences follow from known causal relationships** — not pure speculation
3. **The alternative doesn't require multiple unlikely things to happen in sequence** — single-point counterfactuals only

If any of the three fail, the counterfactual is not admissible — use a conditional (`ConditionalArgument` template) or an axiom (`AxiomList`) instead. The visual treatment makes the argument; a visually confident ghost line that fails the Hawthorn test is an editorial lie.

**Label precision rule:** every counterfactual line or bar must name its condition in the label or subtitle. "Without X" or "Pre-Y" or "Under Z scenario" — never "Scenario A" or "Alternative." Unnamed counterfactuals are unfalsifiable.

---

## Pacing counterfactual beats

Counterfactual beats almost always require `PACE: breathing` — the viewer needs 2-3 extra seconds to:
1. Decode that the dashed line is hypothetical (not just stylistically different)
2. Compare the actual vs. counterfactual trajectories
3. Absorb the editorial claim about causation

Standard `analytical` pace (4-6s) is too short for a chart with a counterfactual element. The absorption window needs to be ~7-9s minimum. Set `durationSec: 10` or annotate with `PACE: breathing` in the script.

**Exception:** if the counterfactual effect is visually dramatic (the ghost bar is 3× the actual bar, or the counterfactual line veers sharply upward), `analytical` pace may be sufficient — the drama does the absorption work.

---

## Anti-patterns

**Don't use counterfactual styling for model projections.** A confidence interval or model forecast is not a counterfactual — it's a forward uncertainty range. Use `referenceBands` in TimeSeriesChart for that. Counterfactual styling implies a specific mechanism ("if X hadn't happened"), not distributional uncertainty.

**Don't render two counterfactual lines.** Multiple ghosts compete for attention and the viewer can't tell which is the editorial protagonist. One counterfactual per chart; if you need two alternative trajectories, use `CounterfactualPath` (which has explicit branch labeling).

**Don't put a counterfactual bar next to a muted `highlightIndex` bar.** The `highlightIndex` rendering (30% opacity on non-highlighted bars) and the counterfactual rendering (45% opacity dashed) look similar. The viewer can't distinguish "ghost because muted" from "ghost because counterfactual." Choose one hierarchy or the other — not both.

**Don't use area fill on counterfactual lines.** The fill makes the ghost look substantial, undermining the "this didn't happen" visual contract.

---

## Implementation reference

| Feature | Schema field | Renders in |
|---|---|---|
| Counterfactual time series | `TimeSeriesLine.counterfactual: true` | `TimeSeriesChart.tsx` |
| Counterfactual zone (X-band) | `TimeSeriesChartData.counterfactualZone` | `TimeSeriesChart.tsx` |
| Counterfactual bar | `DataPoint.counterfactual: true` | `DataChart.tsx` (bar/horizontal only) |
| Dedicated bifurcation template | `CounterfactualPath` component | `CounterfactualPath.tsx` |
