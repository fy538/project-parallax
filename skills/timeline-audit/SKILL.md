---
name: timeline-audit
description: >
  Audit the timeline shots in a Parallax production script against the 4
  timeline templates (TimelineComparison, HorizontalTimeline, DualTimeline,
  TimelineMorph) and their data files. TimelineComparison is Parallax's
  signature form (bounded analogy as visual structure) — mis-routing it
  dilutes the channel's editorial differentiator. Catches sibling confusions
  (TimelineComparison vs. HorizontalTimeline-dual, TimelineMorph misuse),
  density-cap violations (>32 events, >5 connections), calendar-vs-phase
  alignment errors, era-coloring mistakes, and missing source attribution.
  Sister to script-audit and visual-concept; runs after script-draft, before
  or alongside visual-spec.

  Use whenever someone asks to "check the timelines", "audit the timeline
  shots", "are the right timeline templates picked", "timeline review", or
  when finalizing a script with multiple time-based beats. Trigger
  proactively when [MG:] beats route to HorizontalTimeline where the
  editorial argument is bounded analogy (should be TimelineComparison) or
  when TimelineMorph appears more than once per episode.
---

# Timeline Audit

You are auditing the **timeline shots** in a Parallax production script for template-fit, alignment correctness (phase vs. calendar), density-cap compliance, era-color discipline, and Parallax's signature-form integrity. TimelineComparison is the literal-visual rendering of the bounded analogy doctrine — its mis-routing is the highest-leverage failure mode in the timeline family.

## Context

The canonical "if your time structure looks like X, use template Y" lookup is `remotion-templates/TIMELINE_TEMPLATE_SELECTOR.md` — read it BEFORE running the audit. The 4 timeline templates each encode a specific time-argument: pairing (TimelineComparison), continuity (HorizontalTimeline), intercutting (DualTimeline), structural-transformation (TimelineMorph).

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

### Lens 5 — TimelineMorph guardrails

TimelineMorph is the analytical climax — use ONCE per episode at most, and only when **institutional continuity** is genuinely the punchline (same instrument across epochs: Continental Blockade → SWIFT sanctions).

→ Flag: TimelineMorph used more than once in an episode.
→ Flag: TimelineMorph used for a coincidental parallel (no institutional through-line). Replacement: TimelineComparison.

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

1. **HorizontalTimeline used for bounded-analogy beat** — P0 (use TimelineComparison).
2. **TimelineComparison events paired by calendar instead of by structural phase** — P0.
3. **TimelineMorph used >1× per episode** — P0 (erodes analytical punchline).
4. **TimelineMorph for coincidental parallel** — P0 (false-causation implication).
5. **TimelineComparison without connection lines** — P0 (defeats the pairing form).
6. **TimelineComparison with >5 connections** — P1 (spaghetti).
7. **HorizontalTimeline with >32 events** — P1 (narration outruns reading).
8. **DualTimeline combined >20 events** — P1.
9. **Events color-coded by type in multi-era timeline** — P1 (use era color).
10. **Connection lines indexing events that don't share a structural phase** — P1.
11. **DualTimeline non-focus opacity below 0.35** — P1.
12. **Missing source attribution on dated event** — P0.

## Tone

Match the Parallax skill set: terse, surgical. Quote the script line. Cite the selector or dossier reference. Suggest the specific replacement.

TimelineComparison is the signature form — be especially direct when it's mis-routed. The whole channel's editorial differentiator depends on this template being used correctly when the argument calls for it.
