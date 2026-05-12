---
name: chart-audit
description: >
  Audit the chart shots in a Parallax production script against the 6 chart
  templates (DataChart, TimeSeriesChart, StatReveal, RadarChart, BayesianUpdate,
  ProbabilityGauge) and their data files. Catches Cleveland-hierarchy violations
  (truncated y-axes, rainbow bars, pie-chart attempts), template mis-selection
  (StatReveal without comparison bars, BayesianUpdate where ProbabilityGauge
  fits, DataChart where TimeSeriesChart is correct), density-cap violations,
  and missing source attribution. Sister to script-audit and visual-concept;
  runs after script-draft, before or alongside visual-spec.

  Use whenever someone asks to "check the charts", "audit the chart shots",
  "are the right chart templates picked", "chart review", or when finalizing a
  script with multiple data-viz beats. Trigger proactively when [MG:] beats
  route to DataChart (most-used, most-misused) or StatReveal (canonical
  comparison-bar omission).
---

# Chart Audit

You are auditing the **chart shots** in a Parallax production script for template-fit, Cleveland-perceptual-honesty, density-cap compliance, annotation quality, and source attribution. Cleveland's perceptual hierarchy is the underlying theory — *position-along-common-scale* > *length* > *angle/area*. Picking the wrong chart can falsify the editorial argument; truncating a y-axis is the cardinal Tufte sin.

## Context

The canonical "if your data looks like X, use template Y" lookup is `remotion-templates/CHART_TEMPLATE_SELECTOR.md` — read it BEFORE running the audit. The 6 chart templates cover categorical comparison, continuous time, hero statistics, multi-dimensional profiles, and probability reasoning.

You are NOT generating new visual-spec JSON. You are reading what's already there (in script + data file form) and flagging issues with concrete remediation suggestions.

## When to use this skill

- After `script-draft` produces a draft with chart beats.
- Before `visual-spec` so any reshape is done while it's cheap.
- When porting older episode chart data to the current template registry.
- Standalone "are my charts right" check at any pipeline stage.

Sister skills: `script-audit`, `visual-concept`, `map-audit`, `diagram-audit`, `timeline-audit`, `typography-audit`, `visual-spec`.

This skill is narrowly scoped: ONLY chart beats, ONLY the template-selection / encoding-honesty / density / annotation dimensions.

## Inputs

1. **The script file** (required).
2. **The data files** (when they exist).
3. **CHART_TEMPLATE_SELECTOR.md** (read at start).
4. **Per-template dossiers** (read on demand) — `remotion-templates/references/template-research/{data-chart, time-series-chart}.md`.

## Reference docs (read first)

1. **`remotion-templates/CHART_TEMPLATE_SELECTOR.md`** — the wall-table.
2. **`project/SCRIPT_FORMAT.md`** — script-format conventions.
3. **`remotion-templates/references/template-research/data-chart.md` + `time-series-chart.md`** — dossier-canonical idioms and failure modes.
4. **Cleveland (1985), Tufte** references in the selector doc for the encoding-honesty rules.

## The seven audit lenses

Run each lens INDEPENDENTLY. For each issue: **Location**, **Problem**, **Replacement**.

### Lens 1 — Cleveland-honesty violations (cardinal sins)

**1a. Truncated y-axis on a quantitative bar/line.**
The cardinal Tufte sin. Bars must start at 0 unless there's a documented editorial reason AND a broken-axis treatment. Silent truncation falsifies the data.
→ Flag as P0 every time. Replacement: set `yAxisMin: 0` OR add explicit broken-axis annotation.

**1b. Rainbow bars in DataChart.**
Multi-color bars destroy hierarchy. Use one accent color OR muted-bars-plus-one-highlight.
→ Flag as P0. Replacement: set a single `accentColor` + `highlightIndex` for the focal bar.

**1c. Pie chart attempted.**
Not in the toolkit by design. Angle encoding is at the bottom of Cleveland's hierarchy.
→ Flag as P0. Replacement: DataChart bar (if comparing categories) or PricingWaterfall (if decomposing a fixed total).

### Lens 2 — Template-selection mismatch

**2a. DataChart vs. TimeSeriesChart.**
Time-as-category in DataChart is fine for 3-5 discrete year buckets (2000, 2010, 2020). Dense quarterly/monthly belongs in TimeSeriesChart.
→ Flag: DataChart with >5 time-buckets, dense monthly data, or "trend" narration. Replacement: TimeSeriesChart.

**2b. StatReveal vs. KineticTypography (statistic).**
StatReveal requires comparison bars. KineticTypography statistic is the context-free hero number.
→ Flag: StatReveal with no `comparisons[]` → P0 (use KineticTypography OR add bars).
→ Flag: KineticTypography statistic with narration giving comparison context → wrong template; use StatReveal.

**2c. BayesianUpdate vs. ProbabilityGauge.**
BayesianUpdate teaches the *mechanism* (prior → evidence → posterior). ProbabilityGauge shows the *outcome*.
→ Flag: BayesianUpdate where narration just says "P(X) = 42%" without naming evidence → demote to ProbabilityGauge.
→ Flag: ProbabilityGauge where narration teaches updating → promote to BayesianUpdate.

**2d. RadarChart vs. DataChart small-multiples.**
RadarChart caps at 3 subjects × 3-6 axes. Above 3 subjects, polygon overlap is unreadable.
→ Flag: RadarChart with 4+ subjects. Replacement: DataChart small-multiples.

### Lens 3 — Density cap violations

| Template | Cap | Failure mode |
|---|---|---|
| DataChart (vertical) | 8 items | Bar collision; use horizontal/lollipop |
| TimeSeriesChart (multi-line) | 3 series | Spaghetti; use small multiples |
| RadarChart | 3 subjects | Polygon overlap |
| RadarChart axis labels | 25 chars | Radial collision |
| BayesianUpdate (compare) | 2 hypotheses | Visual collapses |
| ProbabilityGauge scorecard | 4 rows | Unreadable grid |

→ Flag: any data file exceeding cap.

### Lens 4 — Annotation quality

Annotations must describe **WHY**, not WHAT.
- Bad: "Sales declined in 2008."
- Good: "Sales declined — Lehman collapse triggered Q4 inventory liquidation."

→ Flag: any chart annotation that describes the shape rather than naming the cause.

For TimeSeriesChart: reference bands (era highlights) should use brand era-colors from `theme.ts`, not arbitrary tints.

### Lens 5 — Missing source attribution

Every chart MUST cite its source (FooterStrip OR tertiary annotation).
→ Flag: any data file without `source`. P0.

### Lens 6 — Hero-stat placement (TimeSeriesChart)

Hero stat overlays should be POSITIONED (anchored to a point on the line), not floating independently. Floating hero stats decouple from the data.
→ Flag: TimeSeriesChart with `heroStat` but no `heroStatAnchor` / position.

### Lens 7 — Schema / data-file health

For each chart data file:
- Validate against Zod schema.
- Confirm narration claim matches data (if script says "3× the previous record," data should support that ratio).
- Confirm precision is appropriate (don't show 3 decimals when narration says "around five thousand").

## Output format

```markdown
# Chart Audit — <episode slug>

**Charts in this episode:** <count>
**Issues found:** <P0> P0 (cardinal sins / argument-falsifying), <P1> P1 (visually wrong), <P2> P2 (cosmetic)

---

## P0 — Cardinal sins / argument-falsifying

### Beat <N>, line <X> — <one-line summary>
- **Current:** `TEMPLATE: DataChart` with `yAxisMin: 50` on a 0-100 scale
- **Problem:** Truncated y-axis falsifies the proportions; bars appear 5× more dramatic than the data supports.
- **Replacement:** Set `yAxisMin: 0`. If the editorial point is "differences at the high end," use the lollipop variant or zoom annotation with explicit broken-axis treatment.
- **Reference:** CHART_TEMPLATE_SELECTOR.md § Mandatory editorial rules #1

[... repeat per issue ...]

---

## P1 — Visually-wrong but renderable

[same format]

---

## P2 — Cosmetic / opportunity-cost

[same format]

---

## Summary

<2-3 sentences>
```

If no issues:

```markdown
# Chart Audit — <episode slug>

**Charts in this episode:** <count>
**Issues found:** 0 — chart templates are correctly assigned, encoding is Cleveland-honest, sources cited.
```

## Doctrine / failure modes to ALWAYS flag

1. **DataChart with truncated y-axis** — P0.
2. **DataChart with rainbow bars** — P0.
3. **Pie chart attempted** — P0.
4. **StatReveal without comparisons[]** — P0.
5. **No source attribution** — P0.
6. **DataChart 8+ items vertical** — P1 (use horizontal/lollipop).
7. **TimeSeriesChart 4+ multi-line** — P1 (use small multiples).
8. **TimeSeriesChart only 3 x-axis ticks** — P1.
9. **TimeSeriesChart annotation describes WHAT not WHY** — P1.
10. **RadarChart with >3 subjects** — P1.
11. **RadarChart axis label >25 chars** — P1.
12. **BayesianUpdate with invented probabilities** — P0.
13. **BayesianUpdate compare with >2 hypotheses** — P1.
14. **ProbabilityGauge teaching Bayesian reasoning** — P1 (use BayesianUpdate).
15. **ProbabilityGauge scorecard with >4 rows** — P1.

## Tone

Match the Parallax skill set: terse, surgical. Quote the script line. Cite the selector or dossier reference. Suggest the specific replacement.
