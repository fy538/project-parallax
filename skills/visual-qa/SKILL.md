---
name: visual-qa
description: >
  Pixel-level visual QA using Claude's vision capabilities. Reads rendered still PNGs (from render-stills.sh) and analyzes them against POLISH.md design rules: spacing, typography hierarchy, color contrast, shadow depth, layout composition, animation entrance states. Use whenever someone asks 'visual QA', 'check the renders visually', 'do the stills look right', 'polish check', 'design QA', 'screenshot check', or when rendered stills exist and need visual verification. This is the vision-based pixel check — distinct from render-qa (which is a code-level/data-level checklist without looking at actual images).
---

# Visual QA — AI-Powered Screenshot Analysis

You are performing a visual quality assurance pass on rendered Remotion composition screenshots. Your job is to look at each still image and evaluate it against the POLISH.md design specification, producing a scored report with specific, actionable findings.

## Why This Exists

`polish_lint.py` catches code-level violations (magic numbers, missing tokens). But some problems are only visible in the rendered output: text that's technically positioned correctly but visually collides, backgrounds that are technically gradients but read as flat, spacing that passes the 8px grid but looks cramped at 1920×1080. This skill closes the gap between "code looks right" and "output looks right."

## Prerequisites

1. **Stills must be rendered first.** Run `tools/qa/render-stills.sh` to generate PNGs.
   - Stills live in: `project-parallax/tools/qa/stills/`
   - Each composition has 2 stills: `{CompositionId}-frame0.png` (entrance) and `{CompositionId}-frame{N}.png` (midpoint)

2. **POLISH.md must be read.** Before analyzing any still, read `remotion-templates/POLISH.md` for the current design rules. The rules change as the system evolves.

## Workflow

### Step 1: Inventory stills

List all PNG files in `tools/qa/stills/`. Group by composition. If stills are missing, tell Tiger to run `render-stills.sh` first.

### Step 2: Read POLISH.md

Read `remotion-templates/POLISH.md` in full. You need the complete specification to evaluate against.

### Step 3: Analyze each composition

For each composition's stills (frame 0 + midpoint), read the PNG using the Read tool and evaluate against these **7 visual lenses**:

#### Lens 1: Layout & Spacing (POLISH.md §2)
- Does the title block have proper separation from content (≥48px gap)?
- Is the safe area respected (80px margins on all sides)?
- Does content fill ≤80% of the safe area (≥20% negative space)?
- Source attribution at bottom-right in muted text?
- For multi-column layouts: are columns evenly spaced with adequate gutters?

#### Lens 2: Typography Hierarchy (POLISH.md §4)
- Are there exactly 3 text size tiers visible?
- Is the primary text clearly dominant (largest, boldest)?
- Is there sufficient weight contrast between tiers?
- Do headers have visible letter-spacing?
- Is Chinese text (if present) at appropriate relative size?
- Are data labels in monospace font?

#### Lens 3: Visual Depth (POLISH.md §3)
- Is the background a gradient (not flat color)?
- Do content cards/elements have visible drop shadows?
- Are highlighted elements visually elevated (glow or stronger shadow)?
- Does the composition have 3 visual planes (background → content → accent)?
- Chart bars: do they have internal gradients?

#### Lens 4: Color & Contrast (POLISH.md §4 T5)
- Is text readable against its background?
- Do dark-mode compositions use the correct bone/amber palette?
- Do light-mode compositions use the correct ink/oxblood palette?
- Is there sufficient contrast between text tiers (primary vs. secondary vs. muted)?
- Are accent colors (amber, rust) used for emphasis, not decoration?

#### Lens 5: Animation State (frame 0 only)
- Are elements in a plausible pre-entrance state (slightly translated, opacity 0)?
- Or has the entrance already fired (indicating startFrame=0 for everything)?
- Is the stagger visible (some elements appeared, others haven't)?

#### Lens 6: Composition & Balance
- Does the layout feel centered/balanced, or does it lean to one side?
- Is there dead space that could be used, or overcrowding?
- For map compositions: is the camera zoomed to the relevant region (not showing globe)?
- Are dividers properly faded at edges (not hard-line full-width)?

#### Lens 7: Data Integrity
- Are chart proportions visually reasonable?
- Do numbers/statistics look correctly formatted?
- Is text truncated or overflowing?
- Are all expected elements present (no missing labels, empty containers)?

### Step 4: Score each composition

Rate each lens 1-5:
- **5** = Perfect — matches POLISH.md spec exactly
- **4** = Good — minor nitpicks only
- **3** = Acceptable — noticeable issues but not broken
- **2** = Needs work — clear violations of POLISH.md rules
- **1** = Broken — fundamental layout/visual failures

Overall score = average of 7 lenses, rounded to 1 decimal.

### Step 5: Generate report

Produce a markdown report saved to the episode folder or the project root:

```markdown
# Visual QA Report — [Date]

## Summary
- Compositions analyzed: N
- Average score: X.X / 5.0
- Critical issues: N (any lens scored ≤2)
- Pass rate: X% (compositions with all lenses ≥3)

## Results by Composition

### [CompositionId] — Score: X.X / 5.0
| Lens | Score | Notes |
|------|-------|-------|
| Layout & Spacing | X | ... |
| Typography | X | ... |
| Visual Depth | X | ... |
| Color & Contrast | X | ... |
| Animation State | X | ... |
| Composition | X | ... |
| Data Integrity | X | ... |

**Critical findings:**
- [specific issue with location and fix suggestion]

**Frame 0 observations:**
- [entrance state analysis]

**Midpoint observations:**
- [steady-state analysis]

---
(repeat for each composition)

## Priority Fix List
1. [Most impactful fix] — affects [compositions]
2. ...

## Comparison with polish_lint.py
- Lint violations that are visible in renders: ...
- Render issues NOT caught by lint: ...
```

## Important Notes

- **Be specific.** "The title is too close to the content" is useless. "Title block bottom edge is ~20px from the first chart bar; POLISH.md L5 requires 48px minimum" is useful.
- **Reference POLISH.md rules.** Every finding should cite the rule it violates (A1, L7, T3, V2, etc.).
- **Compare frame 0 and midpoint.** The entrance state reveals animation sequencing; the midpoint reveals the final layout.
- **Cross-reference with lint.** If polish_lint.py found violations in a template, mention whether those violations are visually apparent in the render.
- **Don't over-report.** A score of 4 means "basically fine with nitpicks." Reserve scores of 1-2 for real problems that would be visible to viewers.

## Context Files

Read these as needed during analysis:
- `remotion-templates/POLISH.md` — the design specification (MUST READ)
- `remotion-templates/BRAND.md` — color palette, font stack
- `remotion-templates/LESSONS.md` — known rendering quirks
- `episodes/EDITORIAL_PLAYBOOK.md` — production rules that may affect visual expectations
