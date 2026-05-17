---
name: timeline-audit
description: >
  Audit the timeline shots in a Parallax production script against the 4
  timeline templates (TimelineComparison, HorizontalTimeline, DualTimeline,
  and the legacy-now-deleted TimelineMorph) and their data files. TimelineComparison is Parallax's
  signature form (bounded analogy as visual structure) — mis-routing it
  dilutes the channel's editorial differentiator. Catches sibling confusions
  (TimelineComparison vs. HorizontalTimeline-dual; HorizontalTimeline mode-morph misuse — formerly the TimelineMorph guardrail set),
  density-cap violations (>32 events, >5 connections), calendar-vs-phase
  alignment errors, era-coloring mistakes, and missing source attribution.
  Sister to script-audit and visual-concept; runs after script-draft, before
  or alongside visual-spec.

  Use whenever someone asks to "check the timelines", "audit the timeline
  shots", "are the right timeline templates picked", "timeline review", or
  when finalizing a script with multiple time-based beats. Trigger
  proactively when [MG:] beats route to HorizontalTimeline where the
  editorial argument is bounded analogy (should be TimelineComparison) or
  when HorizontalTimeline `mode: "morph"` (the successor to the deleted TimelineMorph template) appears more than once per episode.
---

# Timeline Audit

You are auditing the **timeline shots** in a Parallax production script for template-fit, alignment correctness (phase vs. calendar), density-cap compliance, era-color discipline, and Parallax's signature-form integrity. TimelineComparison is the literal-visual rendering of the bounded analogy doctrine — its mis-routing is the highest-leverage failure mode in the timeline family.

## Context

The canonical "if your time structure looks like X, use template Y" lookup is `remotion-templates/TIMELINE_TEMPLATE_SELECTOR.md` — read it BEFORE running the audit. The 3 live timeline templates each encode a specific time-argument: pairing (TimelineComparison), continuity (HorizontalTimeline — also handles structural-transformation via `mode: "morph"`, which replaced the deleted TimelineMorph May 13), intercutting (DualTimeline).

You are NOT generating new visual-spec JSON. You are reading what's already there and flagging issues with concrete remediation suggestions.

## When to use this skill

- After `script-draft` produces a draft with timeline beats.
- Before `visual-spec` so any reshape is done while it's cheap.
- When porting older episode timeline data to the current registry.
- Standalone "are my timelines right" check at any pipeline stage.
- **Always** when the episode involves a historical analogy — verify TimelineComparison is used (not HorizontalTimeline).

Sister skills: `script-audit`, `visual-concept`, `map-audit`, `chart-audit`, `diagram-audit`, `typography-audit`, `visual-spec`.

## Inputs

1. **The script file** (required).
2. **The data files** (when they exist).
3. **TIMELINE_TEMPLATE_SELECTOR.md** (read at start).
4. **Per-template dossier** — `remotion-templates/references/template-research/timeline-comparison.md`.
5. **`project/CONTENT_IDENTITY.md` → "Bounded Analogy: The Signature Form"** — the editorial doctrine grounding TimelineComparison.

## The seven audit lenses

Run each lens INDEPENDENTLY. For each issue: **Location**, **Problem**, **Replacement**.

### Lens 1 — Bounded-analogy mis-routing (signature-form integrity)

The most editorially consequential lens. If the script argues a **historical analogy / structural rhyme** between two eras, the correct template is TimelineComparison. Generic geopolitics channels use HorizontalTimeline for everything; Parallax differentiates by using TimelineComparison for the analogy beats.

→ Flag: HorizontalTimeline used where narration says "echoes," "the shape of X rhymes with Y," "same pattern as 1812," or any explicit bounded-analogy phrase.
→ Replacement: TimelineComparison with phase-aligned eras and connection lines on the load-bearing pairings.

### Lens 2 — Phase-alignment vs. calendar-alignment

If the editorial argument is **structural rhyme**, the timeline must be **phase-aligned** (events at structurally analogous positions on a shared axis), not calendar-aligned (1812 events at 1812-position, 2022 events at 2022-position).

Phase alignment is established by the SHAPE of the data, not a flag — there is no `phaseAligned` field on TimelineComparison or HorizontalTimeline. The relevant signal is `leftEvents[].phasePosition` / `rightEvents[].phasePosition` (TimelineComparison) or `pairs[].phasePosition` (HorizontalTimeline dual mode):

→ Flag: TimelineComparison where `leftEvents[]` and `rightEvents[]` index 1:1 by calendar year (e.g., both arrays sorted by date and connected by year-proximity), instead of by structural phase. Replacement: re-pair by phase (trigger → response → escalation → resolution), regardless of calendar gap.
→ Flag: HorizontalTimeline (`mode: "dual"`) with pairs whose `phasePosition` is absent — the dual axis collapses to two unrelated chronologies. Replacement: assign each pair a shared phasePosition (e.g., both "Phase 1: opening move").
→ Flag: Connection lines in TimelineComparison that connect events on the basis of calendar proximity rather than structural role.

### Lens 3 — Density cap violations

| Template | Cap | Failure mode |
|---|---|---|
| TimelineComparison connections | 5 | Spaghetti, pairing argument unreadable |
| HorizontalTimeline events (total) | 32 | Narration outruns reading speed |
| DualTimeline events (combined) | 20 | Viewer can't track two threads |
| Any timeline | (none) | n/a |

→ Flag: any data file exceeding cap.

### Lens 4 — Era-color discipline

Each era in a multi-era timeline gets ONE persistent color. Switching color schemes mid-composition destroys era tracking.

→ Flag: events color-coded by TYPE (e.g., red for "military," blue for "diplomatic") instead of by era.
→ Replacement: use era color for the spine and event accents; encode event-type via icon, glyph, or label.

For DualTimeline:
→ Flag: non-focus era opacity below 0.35 (illegible) or above 0.6 (no attention-shift).
→ Replacement: `0.4` is the canonical foil opacity.

### Lens 5 — Morph-mode guardrails (formerly "TimelineMorph" — template deleted May 13, 2026; rules apply to `HorizontalTimeline mode: "morph"`)

`HorizontalTimeline mode: "morph"` is the analytical climax — use ONCE per episode at most, and only when **institutional continuity** is genuinely the punchline (same instrument across epochs: Continental Blockade → SWIFT sanctions).

→ Flag: morph-mode used more than once in an episode.
→ Flag: morph-mode used for a coincidental parallel (no institutional through-line). Replacement: TimelineComparison.

### Lens 6 — Connection-line presence

Connection-line reveal timing is **template-managed** (drawn after both eras' events complete entrance, per the dossier-canonical choreography) — there is no per-connection `appearAt` field. So the audit's role is presence + density:

→ Flag: TimelineComparison **without** any entries in `connections[]`. Reduces to two parallel timelines and defeats the pairing form. (Already enforced by runtime warnIf; this lens catches it at script-review.)
→ Flag: `connections[]` indexing events that don't structurally pair (e.g., `leftIndex: 0, rightIndex: 4` skipping the parallel phase). Replacement: re-index to match phase alignment (Lens 2).

### Lens 7 — Source attribution + schema health

- Every event with a specific date or named source MUST have source attribution.
- Validate against Zod schema (pre-commit hook does this; audit catches drift).
- Confirm narration matches data (if script says "five paired events," data has 5 connections).

## Output format

```markdown
# Timeline Audit — <episode slug>

**Timelines in this episode:** <count>
**Issues found:** <P0> P0 (signature-form / argument-falsifying), <P1> P1 (visually wrong), <P2> P2 (cosmetic)

---

## P0 — Signature-form integrity / argument-falsifying

### Beat <N>, line <X> — <one-line summary>
- **Current:** `TEMPLATE: HorizontalTimeline` with narration: "the 2022 sanctions echo the 1812 blockade"
- **Problem:** Bounded-analogy beat routed to HorizontalTimeline dilutes Parallax's signature form. The pairing IS the argument.
- **Replacement:** Switch to `TEMPLATE: TimelineComparison`. Map each era's events to a shared phase axis (trigger → response → escalation → resolution) and identify 3-5 structural pairings as `connections[]` entries (e.g., "naval blockade ↔ financial blockade").
- **Reference:** TIMELINE_TEMPLATE_SELECTOR.md § Editorial register

[... repeat per issue ...]

---

## P1 — Visually-wrong but renderable

[same format]

---

## P2 — Cosmetic / opportunity-cost

[same format]

---

## Summary

<2-3 sentences: overall timeline-pipeline health, biggest pattern, signature-form integrity status>
```

If no issues:

```markdown
# Timeline Audit — <episode slug>

**Timelines in this episode:** <count>
**Issues found:** 0 — timeline templates correctly assigned, signature form preserved, alignment correct.
```

## Doctrine / failure modes to ALWAYS flag

> **Template-architecture note (May 12, 2026):** `HorizontalTimeline` with `mode: "single" | "dual" | "morph"` is the canonical timeline template. The pre-May-12 templates `TimelineComparison`, `DualTimeline`, and `TimelineMorph` are DEPRECATED — they remain in the source tree for legacy episodes but new work routes to `HorizontalTimeline`. The rules below name the modes; if you find data using a deprecated template, flag it for migration to `HorizontalTimeline` first, then apply the rules.

### Template-fit failures

1. **HorizontalTimeline `mode: "single"` used for bounded-analogy beat** — P0 (use `mode: "dual"`; bounded analogy is the channel's signature form).
2. **`mode: "dual"` events paired by calendar instead of by structural phase** — P0 (set `phaseAxis` + `phasePosition` per pair; otherwise the parallel is decorative).
3. **`mode: "morph"` used >1× per episode** — P0 (erodes the analytical-climax punch).
4. **`mode: "morph"` for coincidental parallel** — P0 (morph implies institutional continuity; reserve for *same instrument, different substrate* claims).
5. **`mode: "dual"` without `connection` labels per pair** — P0 (the connection labels ARE the editorial claim; without them, two lists side by side don't read as a comparison).

### Density / scale failures

6. **`mode: "dual"` with >5 connections** — P1 (spaghetti; consider dropping to ~4 anchor beats).
7. **`mode: "single"` with >32 events** — P1 (narration outruns reading speed).
8. **`mode: "dual"` combined >20 events** — P1.
9. **EscalationLadder with >7 rungs** — P1 (silently clipped below safe area; cap or split).

### Color + register failures

10. **Events color-coded by type in a multi-era timeline** — P1 (era color is the encoding; type is noise).
11. **Era colors at full brand saturation** — P1 (mute by ~30%; rust+navy at 100% reads hot, not analytical).
12. **`mode: "dual"` non-focus opacity below 0.35** — P1 (kills the parallel-reading affordance).
13. **Severity legend on EscalationLadder shows tiers not used in the data** — P1 (drop unused tiers from the legend, or add at least one event at that severity).

### Editorial-chrome failures

14. **Missing source attribution on dated events** — P0 (every analytical chart cites; even "Author's synthesis from [textbook]" is better than nothing).
15. **Inconsistent date formatting within one timeline** — P1 (mixing "284 CE" with bare "330" reads as oversight; pick a rule).
16. **No spanning title naming the parallel** — P0 in `dual`/`morph` modes (title must declare *what's being compared and why*, not just the two subjects).

## Visual Discipline (POLISH.md T-prefix rules)

These six rules catch the failure modes that survived the template-fit pass but ship as "looks unprofessional" anyway. Each maps to a rule in POLISH.md under the **T** (Timeline) prefix.

### T1 — Settled by frame 30

Title and era-label entrance animations must be **complete** by frame 30 (1 second in at 30fps). Anything still moving — chromatic kick, slide-in, scale pulse — at the still-preview frame reads as unstable. If frame-30 capture shows residual motion, the entrance easing is too long. Check with `npx remotion still ... --frame=30`.

### T2 — Spanning title names the parallel

Every timeline beyond a bare chronology gets a single title that **names the comparison's claim** (`title`), plus a one-line subtitle that **declares the framing** (`subtitle`). Examples:

- ✅ "How Empires Hand Off" / "Two transitions, four centuries apart"
- ✅ "Two Revolutions, One Cadence" / "Aligned by phase, not by calendar"
- ❌ "First Industrial Revolution" + "Information Revolution" as parallel H1s with no spanning title

Two side-by-side H1s without a spanning frame read as "two unrelated articles, not a comparison."

### T3 — Connection labels are the spine of the argument

In `mode: "dual"`, every pair declares a `connection: "..."` label. These four-to-six phrases (Center divides → Handoff complete; Onset → Endemic; Enabling primitive → Information layer) ARE the editorial hypothesis. Render them prominently on or near the spine — never as gray afterthoughts floating in dead space between columns. A `dual` timeline without `connection` labels is two unrelated lists.

### T4 — Date typography is the row anchor

Date labels should be:
- Plex Mono small caps,
- Bold (600 weight),
- In the era's accent color (rust for historical era, navy for contemporary, etc.),
- Visually the **first** thing the eye reads on each row.

Dates as warm-brown body-weight descriptors (the prior DualTimeline default) bury the row's anchor.

### T5 — No row chrome in `dual`/`morph` modes

Avoid filled background rows / tinted panels per event. Editorial timelines (Economist, NYT Upshot, FT) render on paper white with a thin spine and clean type — no row backgrounds, no pin-bar sidebars, no per-row tinted card surfaces. Heavy row chrome reads as org-chart UI, not magazine spread. Severity-color cards on `EscalationLadder` are the lone justified exception (the color encoding is editorial).

### T6 — Use the canvas

A timeline that uses <50% of the canvas (content squeezed into one third with the rest empty) is undersized. Either:

- Widen the content to the safe area, OR
- Add a contextual right-side annotation (a small map, a portrait, a pull-quote), OR
- Center the column horizontally so whitespace is balanced.

Bias toward centering for vertical ladders (EscalationLadder); bias toward widening for horizontal spines (HorizontalTimeline). Never let the canvas sit half-empty.

### Visual-discipline scan (run alongside template-fit)

When auditing a script + data file pair, additionally run these checks on each timeline beat:

```
□ T1 — Entrance settled by frame 30? (spot-check render: `npx remotion still --frame=30`)
□ T2 — Spanning title + subtitle that name the comparison?
□ T3 — `mode: "dual"` has `connection` per pair?
□ T4 — Dates rendered in mono caps + era color, bold?
□ T5 — No row chrome / no pin-bar sidebar markers?
□ T6 — Content fills or centers the canvas? (≥50% used or symmetric whitespace)
□ Source attribution present?
□ Date formatting consistent within the timeline?
```

If any item flags, name the specific row + field in the audit output. Cross-cutting failures (e.g., the whole timeline lacks a spanning title) get one verdict at the top.

## Tone

Match the Parallax skill set: terse, surgical. Quote the script line. Cite the selector or dossier reference. Suggest the specific replacement. The T1–T6 visual-discipline rules each map to POLISH.md by ID — cite both when filing a finding.

TimelineComparison is the signature form — be especially direct when it's mis-routed. The whole channel's editorial differentiator depends on this template being used correctly when the argument calls for it.
