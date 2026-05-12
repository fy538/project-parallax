# Timeline Template Selector — Wall-Table

> One page. Pin it. When a script beat needs a timeline, look here BEFORE writing visual-spec JSON.
>
> Last updated: May 11, 2026

Four timeline templates. Parallax's signature form lives here — TimelineComparison is the "bounded analogy" rendered as a visual structure. Picking wrong dilutes the channel's editorial differentiator.

Per-template dossier:
- [`timeline-comparison.md`](references/template-research/timeline-comparison.md)
- HorizontalTimeline, DualTimeline, TimelineMorph — no dedicated dossier; see `template-picker.md` § Timelines (lines 144-157)

---

## The selection question

```
What KIND of time structure are you showing → which TEMPLATE
```

| Time structure | Editorial point | Template |
|---|---|---|
| Two historical eras with paired events (structural rhyme) | "The shape of this rhymes with the shape of that" | **TimelineComparison** |
| Single chronological arc with embedded callbacks | "Continuity / single arc with historical anchors" | **HorizontalTimeline** |
| Two eras intercut with attentional shifting (documentary-style) | "Alternate deep-dives across two timelines" | **DualTimeline** |
| Structural transformation as the punchline (same instrument, new tech) | "Continental Blockade becomes SWIFT sanctions" | **TimelineMorph** (use rarely) |

---

## Decision tree

```
Does the editorial argument involve TIME?
│
├─ Is the argument that TWO ERAS structurally rhyme?
│   ├─ Side-by-side comparison, static-but-revealing ──── TimelineComparison
│   └─ Intercutting attention between both eras ──────── DualTimeline
│
├─ Is the argument a SINGLE chronological arc?
│   └─ Events along a horizontal axis with annotations ──── HorizontalTimeline
│
├─ Is the argument that INSTITUTIONAL IDENTITY persists across transformation?
│   └─ Same shape, different epoch — morph as punchline ──── TimelineMorph (rare)
│
└─ (If the editorial point is something OTHER than "look at time," check TEMPLATE_FAMILIES.md)
```

---

## Sibling-template disambiguation

### TimelineComparison vs. HorizontalTimeline

| | TimelineComparison | HorizontalTimeline |
|---|---|---|
| Number of eras | 2 (stacked, parallel) | 1 |
| Editorial point | Pairing IS the argument | Continuity IS the argument |
| Alignment | Phase-aligned (NOT calendar-aligned) | Chronological |
| Sample sentence | "1812 Continental Blockade → 2022 SWIFT — same shape" | "From Babbage to Turing to ChatGPT, one arc" |
| Connection lines | Yes (between paired events) | No |
| **This is** | Parallax's signature form (bounded analogy) | Standard reference timeline |

### TimelineComparison vs. DualTimeline

| | TimelineComparison | DualTimeline |
|---|---|---|
| Pacing | Static side-by-side, reveal-by-pairing | Dynamic, attentional shifting |
| Both eras visible | Always (full hero) | Always — but dimmed (0.4 opacity) when not in focus |
| Editorial style | "Look at this pairing" (single revelation) | "First this era, then that, then back" (intercutting) |
| Best for | The whole-episode analogy diagram | Documentary-style alternating deep-dives |
| Cognitive load | Lower (one comparison structure) | Higher (viewer tracks two threads in parallel) |

### Any timeline vs. TimelineMorph

| | Standard timeline | TimelineMorph |
|---|---|---|
| When to use | Most timeline moments | Once per episode at most — the analytical climax |
| Editorial point | "Here's the time-shape" | "Same instrument, different epoch" |
| What persists | Events at specific points | The visual STRUCTURE itself transforming |
| Failure mode | (none specific) | Coincidental parallels implying false causation |
| Rule of thumb | Default to non-Morph | Only when *institutional continuity* is genuinely the punchline |

---

## Editorial register (Parallax-specific)

TimelineComparison is **Parallax's signature form**. It's the literal-visual rendering of the "bounded analogy" doctrine — show two structures side-by-side, name where they rhyme, then name where the analogy breaks. This template is the channel's differentiator from generic geopolitics content (which uses HorizontalTimeline) and from civilizational-prophecy content (which doesn't pair at all).

Use TimelineComparison early in any episode that names a historical analogy. Use HorizontalTimeline for *non-analogy* time arguments (technology evolution, institutional history).

---

## Mode flags by template

| Template | Common flags / variants |
|---|---|
| TimelineComparison | `leftEvents[]` + `rightEvents[]`; `connections[]` (paired events with `leftIndex`/`rightIndex`); `leftColor`/`rightColor`; phase alignment is established by event ordering, not a flag |
| HorizontalTimeline | `mode: "single" \| "dual" \| "morph"`; `events[]` (single) or `pairs[]` (dual); `eraAColor`/`eraBColor`; `eraWeight` for opacity foiling — the modern canonical timeline; supersedes DualTimeline/TimelineMorph for new authoring |
| DualTimeline | `pairs[]` of `{ eraA, eraB }`; `eraATitle`/`eraBTitle`; `eraAColor`/`eraBColor`. Deprecated for new authoring; use HorizontalTimeline `mode: "dual"`. Still wired in FullEpisode for legacy manifests. |
| TimelineMorph | `events[]` of `{ eraALabel, eraAText, eraBLabel, eraBText }`; `holdDurationSec`, `morphDurationSec`. Deprecated for new authoring; use HorizontalTimeline `mode: "morph"`. |

---

## Mandatory rules

1. **TimelineComparison MUST be phase-aligned** (not calendar-aligned) when the argument is structural rhyme. Calendar alignment turns a structural analogy into a chronology mismatch.
2. **Color discipline for DualTimeline**: each era gets one persistent color. Switching color schemes mid-composition destroys era tracking.
3. **Connection lines (TimelineComparison)** draw AFTER both eras are established (don't pre-reveal the claim).
4. **Event density caps**:
   - TimelineComparison: ≤5 paired connections; above that, spaghetti
   - HorizontalTimeline: ≤32 events total; above that, narration outruns reading speed
   - DualTimeline: combined ≤20 events
5. **Source attribution** on every event with a specific date or named source.

---

## Quick-fail checklist (read before generating JSON)

- [ ] Is the editorial point a PAIRING (TimelineComparison) or a CONTINUITY (HorizontalTimeline)?
- [ ] If TimelineComparison: is it phase-aligned, not calendar-aligned?
- [ ] Are events under the density cap for the chosen template?
- [ ] Does each era have a single distinguishing color (not coded by event type)?
- [ ] If TimelineMorph: does *institutional continuity* genuinely persist, or is the parallel coincidental?
- [ ] Source attribution on every dated event?

---

## Common mistakes — flagged by `timeline-audit` skill

1. **TimelineComparison calendar-aligned when phase alignment is the argument** → re-align to phase.
2. **Events color-coded by TYPE in TimelineComparison** → use era color, not event-type color.
3. **Connection lines drawn before both eras established** → defer connection reveal until both eras have entered.
4. **>5 connections in TimelineComparison** → spaghetti; reduce to 3-5 most-structural pairings.
5. **>32 events total in HorizontalTimeline** → narration outruns reading speed; split into multiple compositions.
6. **DualTimeline non-focus opacity below 0.35** → era becomes illegible instead of receded.
7. **TimelineMorph for coincidental parallel** → implies false causation; use TimelineComparison instead.
8. **TimelineMorph used more than once per episode** → erodes the analytical punchline.
9. **HorizontalTimeline when editorial point IS pairing** → use TimelineComparison.
10. **TimelineComparison without connection lines** → reduces to two parallel timelines; defeats the pairing form.

---

## References

- `references/template-picker.md` § Timelines (lines 144-157)
- `references/template-research/timeline-comparison.md`
- `project/CONTENT_IDENTITY.md` → "Bounded Analogy: The Signature Form"
- `TEMPLATE_FAMILIES.md` — cross-family wayfinding
- `POLISH.md` — D1-D18 editorial doctrine
