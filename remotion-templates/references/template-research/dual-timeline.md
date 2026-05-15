# DualTimeline — Research Dossier

> Created: May 15, 2026. Research compiled from primary sources (NYT Upshot, FT Weekend, Economist Films, BBC interactives); integrated and Parallax-aligned by claude. Update when new outlet conventions are observed.
>
> **Deprecation note:** `DualTimeline.tsx` is marked `@deprecated` in the source. `HorizontalTimeline` is now the canonical timeline template for Parallax. This dossier covers `DualTimeline` as a standalone template because it remains in production in existing episode manifests and differs architecturally from `HorizontalTimeline`'s `mode: "dual"`. Do not use `DualTimeline` for new compositions — reach for `HorizontalTimeline` with `mode: "dual"`.

## TL;DR

**Two vertical dot-spine timelines side by side, intercutting focus (one brightens, the other dims to 0.4 opacity) through five animation phases: intro → era A focus → crossfade → era B focus → pullback with dashed connection lines. The connection label IS the editorial argument — name the structural rhyme in 3–6 words. Retired in favor of `HorizontalTimeline`; do not use for new compositions.**

---

## 1. The form's editorial purpose

DualTimeline earns its rectangle when **two historical sequences, separated by decades or centuries, need to be read simultaneously as structurally parallel**. The viewer's takeaway should be: *"these two moments are not merely similar — the pattern is the same at the mechanistic level."* The crossfade intercutting (era A in focus, era B dimmed, then reverse) mirrors how a skilled lecturer walks an audience through a historical parallel: first establish one sequence fully, then establish the other, then show the rhyme.

Differentiated from `TimelineComparison` (static side-by-side, both columns equal weight throughout, argument is synchronic) and from `HorizontalTimeline mode: "morph"` (same timeline transforming from one configuration to another, argument is metamorphosis). `DualTimeline`'s argument is cinematic intercutting: the viewer's attention is directed, not left to scan.

### When not to reach for it

| Alternative | When it wins over DualTimeline |
|---|---|
| **HorizontalTimeline mode: "dual"** | Always — for new compositions. `HorizontalTimeline` provides horizontal camera tracking, depth-of-field focus, and a configurable column gap. Use it. |
| **TimelineComparison** | Both sequences should be read simultaneously at equal weight; no focus intercutting needed. |
| **HorizontalTimeline mode: "single"** | Only one historical sequence is being traced; no parallel argument. |
| **ArcDiagram** | Entities have a natural 1D ordering and the skip-connections are the argument, not the parallel sequences. |

---

## 2. Canonical idioms

### a. NYT "parallel histories" form

NYT Upshot and NYT Magazine use a two-column layout for "then and now" histories — most prominently in pandemic comparisons (1918 vs. 2020), economic cycles, and geopolitical recurrence ("The Last Time This Happened"). The standard NYT form is static (both columns readable simultaneously), not intercutted. The intercutting in DualTimeline departs from this in the editorial direction of a documentary film rather than a print spread.

*Works because:* static parallel columns let readers set their own pace, scanning between columns. *Fails for video:* the viewer can't control their eye — a static two-column layout at video scrubbing speed reads as a confused split screen.

### b. FT "two countries" comparison timeline

Financial Times frequently runs bilateral comparison timelines for "how did X and Y arrive here?" stories — most commonly G7 vs. China economic trajectory, or two nations' policy responses to the same external shock. FT Weekend's house style: dotted rule connecting paired events across the column gap, with event labels in different type colors per track (blue/red for the usual bilateral pair). The dashed connecting lines in DualTimeline's pullback phase implement this convention.

*Works because:* the dashed connection line at pullback says "here is the structural rhyme" without the commentary — the label on the line is the argument. *Fails when:* the dashed lines cross each other (more than one connection per vertical band) — the crossing creates visual noise.

### c. Synchronization conventions

The central editorial challenge of any dual-timeline form is: what does "same row" mean? `DualTimeline` uses `pairs[]` where each pair has one event from each era at the same visual height. This implies that the events at the same height are the *structural* analogs — not necessarily the same date. The `connection` label on each pair makes the analogy explicit. Without `connection`, the same-height placement implies temporal alignment — which is almost always false and editorially dishonest.

**POLISH T3 applies:** "A `mode: 'dual'` timeline with no `connection` per pair reads as two parallel lists." The connection text names the parallel.

### d. The "pull-back reveal" ending convention

Documentary filmmakers (Ken Burns, Adam Curtis) use a structural pull-back at the end of a historical parallel: after cutting between the two sequences, the film reveals both simultaneously so the viewer can see the pattern whole. DualTimeline's `pullback` phase implements this — both columns brighten to full opacity, and dashed connection lines draw between paired events. This is the editorial climax of the form; it should not be rushed. The `pullback` phase is `sec(1.5)` by default.

*Works because:* the simultaneous view after directed intercutting is revelatory — the viewer has been primed by the focused viewing phases to see the pattern. *Fails when:* the pullback is too short (< 1.2s) — the connection lines don't have time to draw, and the "aha" moment is compressed into a flash.

### e. Dim-not-hide convention for the off-focus era

`DualTimeline` dims the off-focus column to 0.4 opacity (not 0.2 as initially coded). The critical editorial principle: **the off-focus era should remain visible, not invisible.** The crossfade intercutting is attentional, not topological — the viewer's attention is directed to one era while the other remains as a subliminal context. Dimming to 0.2 effectively removes the off-focus era, defeating the parallel reading.

FT, BBC, and NYT comparison layouts always keep both tracks visible — the focus shift is a spotlight, not a blackout. The comment in `DualTimeline.tsx` documents this fix: `// Dim non-focus era to 0.4 (canonical) rather than 0.2`.

---

## 3. General principles

Dual-timeline intercutting is the visual equivalent of a Hegelian dialectic lecture: "consider Era A... now consider Era B... now observe the synthesis." The form's power comes from the directed attention sequence, not from the visual complexity of the two-column layout. A two-column static layout is a comparison; a directed intercutting sequence is an argument.

**POLISH T2 (spanning title) is mandatory for this form:** the spanning `title` above both columns must name the comparison's claim, not just the two era labels. "How Empires Hand Off" with "Two transitions, four centuries apart" as subtitle is the form. Two parallel H1s ("Roman Empire" + "US Hegemony") with no spanning frame is not — the reader invents the parallel.

**POLISH T4 (date typography):** event date labels are the row anchors; they must be visually first (Plex Mono, bold, era accent color). The template achieves this via `fontFamily: fonts.mono, fontWeight: 600, color: accentColor` on the event date label.

**POLISH T6 (use the canvas):** with two 47%-wide columns and an 8px gap, the timeline fills the safe area horizontally. Vertically, the content area should be occupied — if only 2–3 pairs fit comfortably, that's the correct data density; do not pad with empty rows.

The form is best at 3–5 paired events per era. Below 3 pairs, the connection pattern is too sparse to feel like a structural argument (it looks like a coincidence). Above 5 pairs, the `pullback` phase connection lines crowd each other.

---

## 4. Recommendation for Parallax

**Do not use `DualTimeline` for new compositions.** Reach for `HorizontalTimeline` with `mode: "dual"`. `HorizontalTimeline` offers horizontal camera tracking, depth-of-field focus isolation, and configurable column spacing that `DualTimeline`'s vertical dot-spine layout does not.

**For existing manifests using `DualTimeline`:** treat the following as the correct data pattern.

**Data construction discipline:**
- `title`: name the structural argument ("The Oil-Chip Parallel," "How Resource Denial Works"). Not the era names.
- `subtitle`: frame the comparison claim explicitly ("Two attempts to deny a strategic resource to a rising power").
- `eraATitle` / `eraBTitle`: name the eras, not entities ("1940s Pacific" + "2020s Semiconductors").
- `eraAColor` / `eraBColor`: use semantic colors when geopolitical actors are fixed (`semantic.us` for US-led actions, `semantic.china` for China-aligned). For non-geopolitical comparisons, use brand colors (`palette.amber` + `palette.rust`).
- `pairs[i].connection`: **always required.** 3–6 words that name the structural rhyme: "Resource denial escalates," "Third-party denial enabled," "Escalation triggers counter-coalition." These are the editorial argument — they are the reason the composition exists.

**Duration:** `durationSec` auto-calculated from the phase timings (intro 1s + eraA 3.5s + crossfade 0.5s + eraB 3.5s + pullback 1.5s + exit 0.5s = 11s default for N events). For 4–5 pairs, events need stagger time — effective duration is 13–15s.

---

## 5. Current template alignment

- ✅ Five-phase animation (intro → eraA → crossfade → eraB → pullback → exit) via `usePhase` — clean phase management
- ✅ DIM_OPACITY = 0.4 (corrected from 0.2) — off-focus era remains visible per editorial convention
- ✅ Cubic-in-out crossfade between phases — smooth, not sudden
- ✅ Event card: dot + spine + `cardPresets.accentEdge` (no full border chrome) — POLISH T5 (no row chrome) compliant
- ✅ Date label in `fonts.mono`, 600 weight, era accent color — POLISH T4 (date anchor) correct
- ✅ `usePhase` with named phases and `getPhaseStart()` — timing math is clean and readable
- ✅ `useTemplateLayout` with `split: true` — column layout correct
- ✅ `stagger()` for event entrance with 100ms delay — POLISH A3 compliant
- ✅ Dashed connection lines in pullback phase with label at midpoint — FT bilateral convention
- ✅ `TitleBlock` used for spanning title + subtitle — POLISH L13 compliant
- ⚠️ Connection line Y position computed from a fixed `eventHeight: 160` constant — may not match actual rendered event card heights, especially if events have long text (which increases card height). Lines may not align with dots.
- ⚠️ `slideIn` on entry is used as both the `opacity` value and the `transform` input — `slideIn` returns a pixel offset, not a 0–1 range, so `opacity: slideIn(...)` works only because Remotion clips opacity to [0,1] and slideIn returns values ≈ [0, 24] during entrance... except when it returns the full `24px` offset value at the start. This likely causes a brief opacity flash at 0.
- ❌ Marked `@deprecated` — no new features or bug fixes planned. Migrate to `HorizontalTimeline`.
- ❌ No `connection` validation — `warnIf` should fire when any pair has no `connection` label (per POLISH T3). Currently silent.
- ❌ No overflow protection on event text — long narration texts will overflow the 47%-width card and clip below the bottom safe area.

---

## 6. Specific upgrades proposed

(Marked as documentation only — do not implement in `DualTimeline`; implement in `HorizontalTimeline mode: "dual"` instead.)

1. **Connection line Y-position tied to actual DOM layout.** The fixed `eventHeight: 160` should be replaced with computed positions from the rendered DOM. In Remotion, this requires `useRef` + `getBoundingClientRect` in a `useEffect` — not possible in the frame-based render loop. The architectural solution is to fix event card height as a design constant (e.g., always `rowHeight = 160px`, text truncated at 3 lines with ellipsis). Implement in `HorizontalTimeline`.

2. **`warnIf` for missing `connection` labels.** Fire a warning when any `pair.connection` is undefined or empty. "Pairs without connection labels defeat the form's editorial purpose." Effort: trivial. Implement in both `DualTimeline` (as a quick audit aid) and `HorizontalTimeline`.

3. **Connection line anti-crossing.** When two connection lines cross each other (because adjacent row's eraB event is chronologically inverted from the eraA event), route one line with a slight arc to avoid the crossing. Requires computing pairwise crossing geometry. Medium effort. Implement in `HorizontalTimeline`.

---

## 7. Failure mode flags (always catch in audit)

- **No `connection` labels** — without connection text on each pair, the composition is two unrelated lists. The connection IS the editorial argument. Never omit.
- **No spanning title** — two era labels with no spanning title frame means the viewer invents the parallel. The spanning title names the claim; era labels name the instances.
- **Era title as entity names** — "United States" + "China" as era titles conflates the geopolitical actors with the historical era. Use "1940s Pacific" + "2020s Semiconductors" — the era labels should be temporal, not nominal.
- **Too many pairs (>5)** — pullback connection lines crowd. The argument dilutes. Use the three to five most structurally analogous events.
- **Connection lines crossing** — when pairs are not in chronological order within an era, the connection lines cross each other. This is visually confusing. Either reorder the pairs or accept that this specific parallel doesn't have clean row alignment.
- **Off-focus opacity too low** — reverting `DIM_OPACITY` to 0.2 or lower effectively removes the off-focus era from the screen. The intercut must be attentional, not topological. Both columns must be visible throughout.
- **Pullback phase too short** — at `< 1.0s` the connection lines don't fully draw and the pattern-recognition moment is lost. Hold the pullback for at least 1.5s.
- **Using for new compositions** — always redirect to `HorizontalTimeline mode: "dual"`. `DualTimeline` is a deprecated vertical layout; the horizontal camera-tracking version in `HorizontalTimeline` is the editorial upgrade.

Last updated: May 15, 2026
