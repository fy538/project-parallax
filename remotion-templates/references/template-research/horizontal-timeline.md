# HorizontalTimeline — Research Dossier

> Created: May 15, 2026. Research compiled from primary sources (NYT, FT, The Economist, Reuters, Bloomberg); integrated and Parallax-aligned by claude. Update when new outlet conventions are observed.

## TL;DR

**A horizontal spine with a virtual camera — Vox/documentary-standard for cinematic event sequences.** Single-spine (`single` mode) for up to 8 events with era brackets for periodization; dual-spine (`dual` mode) for exactly two parallel histories aligned by phase, not calendar; morph (`morph` mode) for institutional rhymes where the same lever appears in different eras' clothing; `phaseAxis` for conceptual timelines where x-position encodes phase distance, not uniform spacing. The camera tracks, snaps, and pulls back; the viewer follows. Era brackets (`eras` prop, Group F) are the periodization idiom; `connectionRevealStart` should be set after both eras' events are visually established so the viewer sees the evidence before the claim. `durationSec: 10–14` for camera-path narratives; `6–8` for reference panels.

---

## § 1 Editorial purpose

### When to reach for it

The HorizontalTimeline earns its place when the argument unfolds **along a temporal or conceptual sequence** and the camera's movement through that sequence is itself the narrative device. This is the documentary standard — the camera walks the viewer through time rather than presenting all events simultaneously.

Use it when:
- There is a sequence of 4–8 events in a single era that the narration walks through in order (`single` mode, camera track).
- Two historical parallels need to be aligned not by calendar date but by phase of a common process — week-of-crisis, year-of-war, months-since-coup (`dual` mode with `phaseAxis`).
- An institutional form has survived across eras with different machinery — blockade-as-instrument, delegated rule, monetary discipline — and the argument is that it is the *same lever* in different clothing (`morph` mode, EDITORIAL GATE: see below).
- Periodization is the argument: "the Cold War / détente / post-Cold War phases each had a distinct character" (`eras` prop — era brackets above the spine).
- A reference panel is needed alongside an article or annotation: 4–6 events, year-only labels, small footprint (`Economist chronology` idiom).

### When not to reach for it

| Alternative | When it wins over HorizontalTimeline |
|---|---|
| **TimelineComparison** | Legacy horizontal events comparison — now superseded by HorizontalTimeline for all new work. |
| **EscalationLadder** | Events have severity levels (low/moderate/high/critical) that drive color-coded card backgrounds. HorizontalTimeline has no severity encoding. |
| **ArcDiagram** | The argument is about non-adjacent skip connections across a sequence (intellectual lineage, citation networks). HorizontalTimeline emphasizes the sequence; ArcDiagram emphasizes the span. |
| **DataChart (time series)** | The data is continuous (daily, monthly, quarterly readings). HorizontalTimeline is for discrete events with labels, not continuous traces. |
| **FrameworkDiagram** | Events are stages of a causal process (A → B → C) with no camera narrative. Boxes-and-arrows is cleaner than a timeline spine for linear causation. |

**`morph` EDITORIAL GATE:** use `morph` mode only for INSTITUTIONAL rhymes — the same lever across eras, different machinery. Morph implies institutional continuity; using it for coincidental parallels implies a causal connection that doesn't exist. Rule of thumb: if you cannot complete the sentence "the same [X] in different clothing," use `dual` mode instead. Morph is a once-per-episode analytical punchline, not a layout trick.

---

## § 2 Canonical idioms

### a. NYT horizontal timeline
- **New York Times** news and feature timelines (2012–present): single horizontal spine, events **alternating above and below** the spine, a dot at the spine intersection for each event, date label in Plex Mono above the dot, event title in Plex Serif below — the canonical single-spine arrangement.
- Key editorial convention: **alternating above/below placement** prevents horizontal crowding when events are close in time. NYT places the date in mono (it is an anchor, not description) and the description in serif (it is prose, not data). The dot is the junction between timeline position and event meaning.
- *Works because:* alternating placement creates visual rhythm; the eye reads down-up-down-up as it tracks left-to-right, which is more engaging than a uniform above-or-below pattern. *Fails when:* the alternating pattern is violated by events at irregular intervals — bunched events still collide even with alternation. The auto-stagger lane system (`computeStaggerLanes`) resolves this.

### b. FT "dual-track" timeline
- **Financial Times** historical parallels graphics (2018–present): two parallel horizontal spines for two actors, series, or eras; events on each spine aligned by calendar or phase; paired events connected by faint horizontal rules when the parallel is direct.
- Key editorial convention: **era labeling** is the first visual element — the reader must understand "top = 1940s Pacific / bottom = 2020s Semiconductors" before any event is readable. FT places era labels as large-type anchors at the far left of each spine. Connection lines appear **after** events on both spines are established, because the connection is a claim that requires evidence first.
- *Parallax alignment:* `eraATitle` and `eraBTitle` are required for `dual` mode. `connectionRevealStart` should be set to after both eras' events have settled — typically 3–4s for a 6-event dual timeline.

### c. The Economist "chronology" sidebar
- **The Economist** uses compact single-spine timelines as reference panels alongside long-form analysis (weekly edition, 2010–present): 4–6 events maximum, year-only labels in mono, event descriptions ≤ 8 words, no camera animation — the viewer reads it in one glance.
- Key editorial convention: **restraint**. The Economist chronology sidebar is supporting material, not the headline argument. Its job is to anchor the reader in "when did this happen" without demanding sustained attention.
- *Parallax application:* use `single` mode with `durationSec: 6–8` and no `cameraPath` for reference-panel compositions. All events render with full card content (`focusMode: "settled"`); mild dimming on non-focused events only.

### d. Reuters interactive timelines
- **Reuters Graphics** interactive timelines (2015–present): events revealed progressively as the reader scrolls; camera pans from left to right; each "stop" is a chapter; the final stop pulls back to reveal the full timeline for context.
- Key editorial convention: **each camera stop is a chapter.** The camera doesn't just frame an event — it holds until the viewer has absorbed the narration, then tracks to the next. The pull-back at the end is the "now you see it whole" moment — the editorial payoff for having walked through each event.
- *Parallax application:* `cameraPath` with `behavior: "track"` between events and a final `{ focus: "pullback", zoom: 0.6 }` step mirrors the Reuters pattern exactly. `focusMode: "cinematic"` hides off-focus cards during camera tracking, then `"settled"` for the pullback reveals all events simultaneously.

### e. Era brackets (FT / Bloomberg periodization)
- **Financial Times** and **Bloomberg Opinion** use thin bracket lines above a timeline spine to mark era boundaries — "Cold War / Détente / Post-Cold War" — with the era label centered above the bracket (2014–present).
- Key editorial convention: the bracket is a **periodization argument** — it asserts that events within the bracket share a structural character. The bracket is editorial; the events themselves don't declare their era membership. The bracket color often matches the dominant analytical register (amber for normal periods, rust for crisis periods).
- *Parallax application:* `eras` prop (Group F addition) renders thin brackets above the spine with era labels. Only rendered in `mode: "single"`. Use `color?: string` to override from the default `palette.amber` for crisis-era brackets (`palette.rust`).

---

## § 3 General principles

**Timeline Visual Discipline T1–T6** (POLISH.md May 12, 2026):

- **T1. Entrance settled by frame 30.** All chrome (spine, era labels, title) must reach rest state by frame 30. The auto-stagger and spine animation are fast by design; any entrance that runs past 1s reads as "loading" in stills.
- **T2. Spanning title names the parallel.** Every `dual` or `morph` composition requires a single spanning `title` that names the comparison's claim, plus a one-line `subtitle` that declares the framing. Two parallel H1s with no spanning frame read as two unrelated articles.
- **T3. Connection labels are the spine of the argument.** Every pair in `dual` mode declares a `connection` label. These are the editorial hypothesis — not chrome between rows. `connectionRevealStart` ensures they land after evidence.
- **T4. Date typography is the row anchor.** Dates use `fonts.mono`, weight 600, era accent color — the first thing the eye reads on each event. Dates as body-weight brown text look like descriptions, not anchors.
- **T5. No row chrome in `dual` / `morph` modes.** No filled card backgrounds, no tinted panel surfaces, no pin-bar sidebars. One thin spine per timeline, a dot per event, clean type. Heavy row chrome is org-chart UI, not editorial layout.
- **T6. Use the canvas.** Horizontal spines should widen to the safe area. Timeline content squeezed into one-third of the canvas with 60% empty paper reads as "underbuilt."

**Tufte's smallest effective difference:** the alternating above/below placement of event cards on a single spine is the minimum-chrome solution to the crowding problem. Heavy card backgrounds are unnecessary; the type and dot pattern carry the weight.

**Phase alignment vs. calendar alignment:** for historical parallels, phase alignment (`phaseAxis`) is the analytically honest form. Calendar alignment implies that "this happened on the same date" is meaningful — which is rarely true for historical analogies. Phase alignment asserts only "this happened at the same stage of the process," which is the actual claim Parallax makes (week-of-crisis, year-of-war, months-since-collapse).

**Connection-reveal timing:** connection lines between dual-spine events are **editorial claims** ("this event structurally rhymes with that event"). They should appear after both events are visually established so the viewer sees the evidence before the claim. `connectionRevealStart: 3.0` is the recommended minimum for a 6-event dual timeline.

---

## § 4 Recommendation for Parallax

**`single` mode:**
- Up to 8 events; use `eras` prop for periodization brackets (Group F).
- `focusMode: "cinematic"` when `cameraPath` is provided — off-focus events collapse to dot+year, preventing double-card overlap during tracking.
- `focusMode: "settled"` for reference panels (no camera path) — all events render their full cards with mild dimming.
- `durationSec: 10–14` for camera-path narratives; `6–8` for reference panels.

**`dual` mode:**
- Exactly 2 parallel tracks; events paired when conceptually aligned; never use for > 2 actors.
- `phaseAxis` for historical parallels — do not use calendar dates as x-positions when the claim is "the phases rhyme, not the dates."
- `eraWeight: "equal"` (both eras analytical peers) is the Parallax default. `foil-old` or `foil-new` for secondary-era reference panels.
- `connectionRevealStart` set to at least `3.0` seconds (after both eras' events are visually established).
- `durationSec: 12–18` to allow narration to establish both eras before pulling back.

**`morph` mode:**
- Exactly 2 states (eraA → eraB). Use only for institutional rhymes.
- `durationSec: 10–14` — morph animation should complete by mid-composition so the viewer can read the final state.

**`phaseAxis` mode:**
- Requires `phasePosition` on every pair in `dual` mode.
- Non-uniform event spacing is the whole point — events cluster at their actual phase positions, revealing the structural rhythm.
- `durationSec: 12–16` — camera path should stop at clustered events long enough for the viewer to read the temporal density.

**Color:**
- `eraAColor: palette.amber` (default) for the primary/contemporary era.
- `eraBColor: palette.rust` for the historical foil.
- Era bracket `color: palette.rust` for crisis periods (conflict, war, sanctions); default `palette.amber` for transitional or analytical periods.

---

## § 5 Current template alignment

**Modes:**
- ✅ `single`, `dual`, `morph` — all three implemented.
- ✅ `phaseAxis` — phase-position-based x-coordinate mapping for `dual` mode; `computeStaggerLanes` auto-staggers cards that would horizontally overlap.
- ✅ `focusMode: "cinematic" | "settled"` — cinematic hides off-focus cards (dot+year only); settled shows all cards with mild dimming.
- ✅ `eraWeight: "equal" | "foil-old" | "foil-new"` — opacity weighting for protagonist/foil framing.
- ✅ `eras` prop (Group F) — thin era brackets above the spine in `mode: "single"`; amber default, color-overridable.
- ✅ `connectionRevealStart` prop — delays connection lines until after both eras are established.

**Architecture:**
- ✅ Canvas width = `layout.width * 2.5` for `single`/`dual` — the full timeline extends past the viewport; the camera pans to reveal.
- ✅ `useTimelineCamera` hook — derives pan offset from `cameraPath` steps; `generateDefaultTimelineCameraPath` auto-builds a path when none is provided.
- ✅ Glowing amber spine with animated gradient pulse — the pulse travels left-to-right at 1.0px/frame (doubled from original for visible travel within a composition).
- ✅ Auto-stagger lane system (`computeStaggerLanes`) — prevents horizontal card overlap on phase-axis timelines with unevenly spaced events.
- ✅ UNDERLINE_WIDTH (140px) fixed-width rule under each event card — replaces card chrome per the May 13, 2026 visual-register pass.

**Visual discipline:**
- ✅ T4: Dates in Plex Mono, weight 600, era accent color — row anchor treatment.
- ✅ T5: No card backgrounds in `dual`/`morph` — UNDERLINE_WIDTH rule replaces filled cards.
- ✅ T6: Timeline canvas extends to 2.5× viewport width; camera panning uses the full canvas.
- ✅ `warnIf` fires for `dual` mode without `phaseAxis` when `pairs` contain `phasePosition` — notifies when phase data is present but the phase axis isn't configured.

**Gaps:**
- ⚠️ No `warnIf` for `morph` mode with more than 2 states — the types support exactly 2 (eraA/eraB), but no runtime validation checks that `morphEvents` is non-empty.
- ⚠️ T2 is not enforced at data level — `dual`/`morph` compositions without a spanning `title` won't be warned. Audit must catch.
- ⚠️ `connectionRevealStart` defaults to `sec(0.3)` — basically immediate. Dossier convention is to set to ≥3s for dual timelines; the default is the wrong prior.

---

## § 6 Specific upgrades

1. **Flip `connectionRevealStart` default to `null` with a minimum of 2.0s.** The current default of `sec(0.3)` fires connections almost immediately, before either era's events are established. Change the default to `null` (no connections) and add a `warnIf` when it is omitted in `dual` mode — forcing data files to declare an intentional reveal time. Minimum validated value: 2.0s. Effort: trivial (change one constant and add a `warnIf`). Impact: eliminates the most common T3 violation (connection lines rendering as visual noise before the events they connect are legible). **(trivial effort / high editorial impact)**

2. **`morph` mode guard — `warnIf` for empty `morphEvents`.** Add `warnIf(data.mode === "morph" && (!data.morphEvents || data.morphEvents.length === 0), ...)` to fire at render time. The template silently renders an empty spine when `morphEvents` is missing. Effort: trivial. Impact: prevents invisible morph compositions. **(trivial effort / high reliability impact)**

3. **Era bracket color for `dual` mode (two-era bracket support).** The `eras` prop currently only renders in `mode: "single"`. Extend it to `dual` mode: era A events grouped under the `eraATitle` bracket, era B events under the `eraBTitle` bracket. This would let the bracket communicate the era's structural character (rust for crisis, amber for transition) alongside the era-label text. Effort: medium (requires second bracket row and phase-aware span computation). Impact: unifies the periodization idiom across single and dual modes. **(medium effort / medium editorial impact)**

4. **`pullback` camera step as auto-last step.** When a `cameraPath` is provided but does not end with `{ focus: "pullback" }`, automatically append a final 2s pullback step. This enforces the Reuters pattern — every camera-path narrative ends with a full-timeline reveal — without requiring data files to remember the pullback. Add a `autoPullback?: boolean` field (default: `false`) so data files can opt in explicitly. Effort: small. Impact: ensures the "now you see it whole" editorial payoff is always present in camera-path narratives. **(low effort / medium impact)**

---

## § 7 Failure mode flags

- **`dual` mode without `connectionRevealStart` (or with the default 0.3s)** — connection lines appear before either era's events are established, reading as visual noise rather than editorial claims. Audit: check `connectionRevealStart > 2.0` for all `dual` mode compositions.
- **`morph` mode for coincidental parallels, not institutional rhymes** — morph implies "the same lever"; using it for surface-level historical resemblances implies causation. Audit: verify the narration can complete "the same [X] in different clothing." If not, redirect to `dual` mode.
- **`dual` mode without a spanning `title`** — two era-label H1s with no spanning frame reads as two unrelated articles. Audit: every `dual`/`morph` composition must have a `title` that names the comparison's claim.
- **Calendar-date x-positions on a historical analogy composition** — asserts that events happened on the same date, which is rarely the claim. Use `phaseAxis` with `phasePosition` values. Audit: flag any `dual` mode composition without `phaseAxis` where the editorial argument is "phase structural rhyme, not calendar coincidence."
- **More than 8 events in `single` mode** — card overlap and label collision are unavoidable above 8 events on a camera-pan canvas. Audit: flag `events.length > 8` in single mode; consider splitting into two compositions.
- **`eras` brackets in `dual`/`morph` mode (currently not rendered)** — a data file that sets `eras` in `dual` mode will silently have no brackets. Audit: verify mode before using `eras` prop.
- **Auto-stagger lanes not compensated in camera-path zoom** — when `computeStaggerLanes` bumps a card to lane 1 (further from spine), the camera step's `zoom` value that was calibrated for a lane-0 card will cut off the lane-1 card at the top. Audit: verify camera `zoom` values after stagger-lane assignment.
- **T5 violation: filled card backgrounds remaining from a previous template version** — events should render with UNDERLINE_WIDTH rule only, no background fill. Audit: inspect frame 60 for any non-transparent card surface in `dual`/`morph` modes.

---

Last updated: May 15, 2026
