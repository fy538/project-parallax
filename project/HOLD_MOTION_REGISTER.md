# Parallax — Hold-Beat Motion Register

## Purpose

This document names Parallax's eight canonical hold-beat motion techniques and matches each to its editorial context. It exists so that script-writing and visual-spec skills can select the right hold-motion register for a given segment — not by defaulting to the global `editorial` drift on every template, but by following clear use-case rules grounded in the channel's editorial register.

**Hold-beat motion** = what happens between entrance settle and exit fade. After D17 anticipatory entrance lands the element ~150ms before the narrator names it, and before the 15-frame exit fade per A7, there's a window of 2-8 seconds where the element is just *on screen* — narrator continues, music bed continues, but nothing new is *revealing*. What happens visually in that window is editorial register, not afterthought.

Created: May 16, 2026

**Related docs:**
- **PROJECT_VISION.md** — the channel's mid-century editorial lineage and "educated mysticism" register
- **TEXT_ANIMATION_REGISTER.md** — sibling doctrine (text-on-screen techniques); same structure
- **DIRECTING_LANGUAGE.md** — `DIR:` annotation vocabulary; the proposed `DIR: hold(stillness)` directive lives there after Phase 3
- **VISUAL_LANGUAGE.md** — three-register system (analytical / atmospheric / grounding); the four hold-motion registers below map onto it
- **HOLD_MOTION_AUDIT_PHASE0.md** — numerical baseline (5 templates render byte-identical frames during 2-second hold; that gap motivated this doc)
- **remotion-templates/references/template-research/hold-motion.md** — Phase 1 outlet-research dossier (NYT VI, FT, Economist, Bloomberg, Vox Atlas, PBS Frontline, primary sources)
- **remotion-templates/src/hooks/useDirection.ts** — `DRIFT_PRESETS` implementation (the technical surface; this doc is what *selects from* it)
- **remotion-templates/POLISH.md** — `D20` (pending) will be the rule-form of this doc

---

## Why a register, not a palette

Hold-beat motion is a **register choice**. Picking the wrong technique reads as a *category error* — Documentary Ken Burns on a 4-column data chart mis-claims that the chart is *atmospheric establishing material*; total stillness on a historical photo plate mis-claims that the photo is *printed reproduction* rather than *footage in motion*. The wrong choice doesn't just look off, it makes a *wrong factual claim* about what kind of element this is.

The eight techniques below each carry an implicit claim about WHAT KIND OF ELEMENT this is:

| Technique | Implicit claim |
|---|---|
| **Stillness** | "this is a document of record; nothing should compete with reading it" |
| **Editorial drift** | "this is analytical content; the screen is barely alive, intentionally" |
| **Breathing** | "this single idea is held and alive; the scale pulses, the frame goes nowhere" |
| **Settle** | "this composition established itself and is now waiting, fully composed" |
| **Sway** | "this view is held with subtle life and no directional slip" |
| **Documentary Ken Burns** | "this image is a master shot; meaning accrues through duration" |
| **Atmospheric particles** | "the world around this scene is alive — dust, light, ambient texture" |
| **Mood pulse** | "this single accent is responding to the moment's tension" |

When an editorial moment matches a technique's claim, the motion *reinforces* the meaning. When it doesn't, it *competes* with the meaning, or telegraphs production effort ("look, I have After Effects") rather than editorial intent.

**Pick the one whose implicit claim matches the editorial intent. Default-on-every-template is itself a wrong choice.**

---

## The eight techniques (quick reference)

| # | Technique | Existing preset | Visible motion | Best for |
|---|---|---|---|---|
| 01 | Stillness | `none` | None | Eulogy, casualty list, document-of-record quote |
| 02 | Editorial drift | `editorial` (current default) | Scale ≤1.02, no pan | Charts, diagrams, dense analytical content |
| 03 | Breathing | `breathing` | Sinusoidal scale ±0.8% | Held hero stat, quote, single definition |
| 04 | Settle | `settle` | One-time scale lock then hold | Framework headers, chart kickers post-entrance |
| 05 | Sway | `sway` | Zero-net pan (±9px X, ±4px Y) | Held map view, contemplative geographic frame |
| 06 | Documentary Ken Burns | `documentary` | Scale 1.06 + pan 18/8px + rotation 0.3° | Photo plates, archival, atmospheric atlas |
| 07 | Atmospheric particles | substrate layer (`FilmOverlay`) | Dust drift, light-leaks at substrate level | Dark cinematic scenes, evidentiary footage |
| 08 | Mood pulse | component chrome | Single-accent oscillation | REC indicator, gauge, hero accent on dark |

Six are direct `DRIFT_PRESETS` entries. Two (atmospheric particles, mood pulse) are *adjacent register entries* that live at the substrate/chrome layer rather than the per-element drift system — they're named here because they're often the right answer for a given moment, but they're applied via different mechanisms (FilmOverlay cascade for particles, per-component chrome for mood pulse).

---

## 01 · Stillness

**Existing preset:** `none` (`{ noDrift: true }`)

**Implicit claim:** "This is a document of record; nothing should compete with reading it."

### Use for
- Eulogy, casualty list, memorial moment where motion reads as inappropriate
- Long-form quote where the words are the entire visual content
- Data table where any drift competes with row-by-row reading
- The "thinking beat" — punctuation between two arguments (paired with audio silence per D18)
- Section / chapter divider held for emotional weight

### Avoid for
- Photo plates, archival images, atmospheric atlases (use Documentary Ken Burns instead)
- Held charts where the audience needs >3s to read (Editorial drift marks "this is video, not slide")
- Anything in dark cinematic register — stillness on dark backdrop reads as paused movie player
- Default-state holds — stillness as default makes Parallax look like PowerPoint

### Parallax examples
- Heraclitus "Character is destiny." quote held on paper substrate. Currently 0.87% pixel diff (effectively still); should explicitly opt into `none` so the diff is *zero* and the choice is *deliberate*, not accidental.
- Cold War casualty memorial card (future episode work)
- The "thinking beat" between BEAT 1 and BEAT 2 of an episode

### Real-world references (Phase 1 research)
- **The Economist Daily Charts video** — held title plates frequently use full stillness on cream substrate. The doctrine `Off the Charts` substack confirms institutional discipline here.
- **ProPublica investigation videos** — casualty lists held in stillness; motion would feel disrespectful.
- **NYT Visual Investigations "Day of Rage"** — final tally card held in stillness as the section closes.

### Technical brief
- Data: `_direction.driftPreset: "none"` on the segment data file.
- Script: `DIR: hold(stillness)` directive (pending Phase 3 implementation in `parse_dir_lines`).
- Template-level force: `useCompositionAnimation({ noDrift: true })` — but per-template hardcoding is the *exception*, not the rule. Prefer per-segment script-side authoring.
- Visual contract: every frame from entrance-settle through exit-fade is byte-identical. Pixel diff between any two hold-window frames = 0.

### Failure mode
Looks like a paused movie player on a dark backdrop. Looks like a PowerPoint slide on a paper backdrop *unless* the editorial intent specifically wants that read (memorial moments).

---

## 02 · Editorial drift

**Existing preset:** `editorial` (current default — `mode: linear, maxScale: 1.02, maxPanX: 0, maxPanY: 0, maxRotation: 0`)

**Implicit claim:** "This is analytical content; the screen is barely alive, intentionally."

### Use for
- DataChart, TimeSeriesChart, BumpChart, RidgelinePlot — analytical charts where the data is the argument
- NetworkDiagram, ArcDiagram, FrameworkDiagram (all variants) — relationship diagrams
- DecisionTree, EscalationLadder — scenario diagrams
- HorizontalTimeline, GameBoard — structured analytical content
- Default for any template category not specifically called out by the other techniques

### Avoid for
- Photo plates (under-served — use Documentary Ken Burns)
- Hero stat reveals (under-served — use Breathing)
- Atlas plates (under-served — use Sway or scale-only Breathing)
- Dark cinematic scenes (under-served at the element level — pair with Atmospheric particles at substrate)

### Parallax examples
- Confirmed in Phase 0 audit: 7+ analytical chart templates cluster at 2-3% pixel diff over the f90→f150 hold window. This is the editorial register *working as designed* — restrained, not gratuitous.
- TSMC chokepoint NetworkDiagram (catalog hub-spoke) — 2.838% drift. Correct.
- Phillips Curve ConnectedScatterplot — 2.487% drift. Correct.

### Real-world references
- **FT Climate Graphic Detail** — analytical chart pieces sit with very low drift (estimated ~1.02 scale). The Economist's `Off the Charts` doctrine: animation that competes with the data is gratuitous.
- **NYT Upshot** — chart explainers default to restrained drift; the data is doing the work.

### Technical brief
- This is the *current global default* — segments that don't specify a `driftPreset` get this. It's correctly chosen for the analytical case; the gap is *other* categories that also default to this and shouldn't.
- Scale 1.02 over composition duration. No pan, no rotation.
- The 2-3% pixel diff in the audit comes from gradual scaling, not directional motion. Frame N and frame N+30 differ slightly because the whole frame is ~0.05% bigger.

### Failure mode
Too restrained for photo plates and atmospheric content. The 1.02 scale over 10 seconds is invisible on a static photograph that should be *traveling* with Ken Burns. Using `editorial` as a one-size-fits-all default is the Phase 0 audit's primary finding.

---

## 03 · Breathing

**Existing preset:** `breathing` (`mode: breathing, maxScale: 1.008`, sinusoidal cycle ~8s)

**Implicit claim:** "This single idea is held and alive; the scale pulses, the frame goes nowhere."

### Use for
- Hero stat reveal that holds for >3 seconds (StatReveal, KineticTypography statistic variant)
- Held quotes and definitions on paper substrate (KineticTypography quote, definition variants)
- Single-element editorial-hero compositions where stillness reads as PowerPoint but Ken Burns over-claims atmospheric weight
- AtlasPlate maps (scale-only breathing is projection-safe — see Section 06 *vs* this technique trade-off)
- Probability gauges holding a forecast value

### Avoid for
- Dense analytical content (Editorial drift is enough; breathing on charts can read as data-jittering)
- Photo plates and archival material (Documentary Ken Burns is the correct register)
- Section dividers (Settle is cleaner)

### Parallax examples
- "$257B Apollo Cost" StatReveal — currently shows visible motion because of *staggered reveals* in the hold window; once those settle, breathing should take over (Phase 3 will wire this).
- Heraclitus quote — alternative to Stillness for the same content; the editorial choice is "pulse with meaning" vs "punctuate with silence." Both are correct for different moments.
- TSMC chokepoint atlas plate held at "92% of advanced nodes" — scale-only breathing on a held map.

### Real-world references
- **Cinemagraphs (Beck & Burg, 2011)** — the conceptual ancestor. Isolated subtle motion on an otherwise-still scene was the entire premise of the format.
- **The Economist** — hero pull-quotes in video pieces pulse subtly without going anywhere; one of the channel's signature held-content treatments.
- **FT Visual Vocabulary cards** — short held value cards breathe gently rather than drift directionally.

### Technical brief
- Data: `_direction.driftPreset: "breathing"` on the segment.
- Existing implementation: sinusoidal scale oscillation between 1.0 and 1.008 over ~8s period. No pan, no rotation. Projection-safe (zero pan = zero risk of overshooting safe area, critical for maps).
- The 1.008 max scale is *deliberately* below the editorial 1.02 — breathing is felt, not seen. Viewer registers "alive" without registering "moving."

### Failure mode
Too aggressive on dense content (charts, network diagrams) where the breathing pulse competes with data scanning. Visible breathing on a 4-bar comparison chart can make the bars feel like they're "growing" — false signal.

---

## 04 · Settle

**Existing preset:** `settle` (`mode: settle, maxScale: 1.025`, one-shot during first ~0.6s, then hold)

**Implicit claim:** "This composition established itself and is now waiting, fully composed."

### Use for
- Framework matrix headers — the matrix "lands" then sits
- Chart title kickers post-entrance
- TitleTransition section dividers — title slides in then holds in place
- Network diagram first frame after all nodes have entered — the diagram "settles" into its final shape
- Beat-divider title cards (paired with audio silence per D18 cold open rule)

### Avoid for
- Held content that benefits from continued motion (use Breathing or Editorial)
- Photo plates (use Documentary Ken Burns — the entire point of a photo is meaning-through-duration)
- Long holds >6s where Settle reads as static after the initial scale lock fades from memory

### Parallax examples
- "The Eisenhower Matrix" FrameworkDiagram title — currently editorial; could be Settle for cleaner "established then waiting" feel.
- TitleTransition section variant — "Where the Argument Turns" lands with a Settle, then holds.
- BumpChart "China overtakes Japan" header — title scale-locks while line draws below.

### Real-world references
- **Vox Atlas** — title cards land and hold; no drift after.
- **NYT Upshot longform** — chart headers settle and lock.
- **FT Big Read video adaptations** — chapter titles use Settle as the canonical "this section is named" gesture.

### Technical brief
- Data: `_direction.driftPreset: "settle"`.
- Implementation: scale interpolates from 1.0 to 1.025 over the first 0.6s of the composition, then holds at 1.025 for the remaining duration. No pan, no rotation.
- Combines well with `cam(static)` directives — Settle is a *one-time camera land*.

### Failure mode
On long holds (>6s), the initial settle is forgotten by frame 90 and the rest of the composition reads as Stillness. If the editorial intent is "alive across the full hold," use Breathing instead.

---

## 05 · Sway

**Existing preset:** `sway` (bidirectional sinusoidal pan, ±maxPanX/2 X, ±maxPanY/2 Y, slow asymmetric cycles)

**Implicit claim:** "This view is held with subtle life and no directional slip."

### Use for
- Held atmospheric atlas plates where the *projection* must stay registered (no directional pan)
- Map views where the audience needs to stay oriented (Cold War blocs, COCOM membership, supply chain geography)
- Contemplative geographic establishers — the world map "breathes" but doesn't go anywhere specific
- Dark scenes where atmospheric particle layers are NOT enough; the underlying composition needs life

### Avoid for
- Stat reveals (Breathing is purer)
- Charts (any pan introduces apparent data-shift; bad signal)
- Photo plates (Documentary Ken Burns is the correct register — pan with direction)
- Short holds <3s — the cycle period is too long for the motion to register

### Parallax examples
- AtlasPlate Cold War vintage — alternative to scale-only Breathing. Sway adds zero-net pan that reads as "the camera is alive but doesn't favor one bloc." Diagnostic: does the editorial argument want a stationary view (Breathing) or a "watched" view (Sway)?
- The "blocks of empire" world map establisher (future episode work).

### Real-world references
- **The Economist** — held world maps on long voice-over segments use slow sway rather than directional drift.
- **Bloomberg Quicktake China+** — establishing shots of Beijing/Shanghai sway during context narration.

### Technical brief
- Data: `_direction.driftPreset: "sway"`.
- Implementation: independent X and Y sinusoidal pans on asymmetric periods (6s X, 9s Y) so the motion doesn't trace a perfect ellipse — reads organic. Net displacement zero.
- Default pan magnitudes inherit from `motionBudget`; reduce per-segment if the composition has tight safe-area constraints.

### Failure mode
Visible at viewer attention. If the pan is large enough to be *seen* as panning, the technique fails — it should be *felt*. Default magnitudes are tuned for this; don't crank them.

---

## 06 · Documentary Ken Burns

**Existing preset:** `documentary` (`mode: linear, maxScale: 1.06, maxPanX: 18, maxPanY: 8, maxRotation: 0.3`)

**Implicit claim:** "This image is a master shot; meaning accrues through duration."

### Use for
- ImageComposite — historical photo plates, archival imagery
- PhotoMontage — multi-image archival sequences
- AnnotatedImage — when the image IS the evidence being annotated
- Atmospheric atlas plates where directional motion serves the argument (zooming toward Taiwan, panning across the Pacific)
- Cold-open evidentiary photographs

### Avoid for
- Charts, diagrams, network/arc topologies (rotation tilts axis baselines — explicit doctrine violation)
- Stat hero reveals (Breathing is purer)
- Held quote cards (the rotation reads as careless)
- Maps where the projection must stay registered (Sway or scale-only Breathing instead)

### Parallax examples
- Confirmed in Phase 0 audit: ImageComposite "archive" composition renders **0 pixels different** between f90 and f150 — *byte-identical*. The image holds for 2+ seconds without any motion. This is the textbook Documentary Ken Burns case currently under-served. **Wiring this preset closes the worst finding in the audit.**
- PhotoMontage "treatments" — second under-served photo template (0.080% pixel diff). Same fix.
- Cold-open historical photograph in BEAT 1 of any episode.

### Real-world references
- **Ken Burns himself** — the namesake. *Brooklyn Bridge* (1981) 33-second Roebling photograph zoom is the canonical example. Burns treats every photo as a *master shot*, not an illustration. "Meaning accrues through duration" — his own framing.
- **NYT *Greenland Is Melting Away*** (Derek Watkins, 2015) — combined drone-and-archival sequence using documentary Ken Burns on historical maps.
- **PBS Frontline** — institutional doctrine; every archival photo gets some scale + pan.
- **National Geographic Explorer** — atmospheric atlas plates use full documentary range.

### Technical brief
- Data: `_direction.driftPreset: "documentary"`.
- Implementation: linear scale 1.0 → 1.06 over composition duration. Pan up to ±9px X / ±4px Y. Rotation up to 0.3° (small but present).
- The rotation is what separates documentary from settle/sway. Don't strip it — the slight rotational drift is what makes Ken Burns feel cinematic rather than mechanical.

### Failure mode
On data content, rotation tilts axis baselines — viewer parses "is the data tilted?" The DRIFT_PRESETS comment explicitly flags this: "NOT for charts — the rotation tilts axis baselines."

On maps where projection registration matters (Cold War blocs, COCOM membership), the directional pan shifts which countries are foregrounded — false editorial signal. Use Sway or scale-only Breathing instead.

---

## 07 · Atmospheric particles (substrate layer)

**Not a `DRIFT_PRESETS` entry.** This technique lives at the substrate / FilmOverlay layer, not the per-element drift register.

**Implicit claim:** "The world around this scene is alive — dust, light, ambient texture."

### Use for
- Dark cinematic scenes (Cold War strategic landscapes, conflict footage, archival video plates)
- Evidentiary footage holding for investigative-register beats
- Atmospheric atlas plates that already have other element-level motion (combine atmospheric layer + element-level Sway or Breathing)
- Episode openings on dark backdrops where the cold-open ambient should *feel populated*

### Avoid for
- Light / paper-substrate analytical content (particles on cream paper read as game UI or dust on the lens — gratuitous)
- Anything in editorial restraint register (charts, frameworks, structured diagrams)
- Combined with Documentary Ken Burns *and* mood pulse — three motion layers compete; pick one element-level motion plus one substrate effect, not three

### Parallax examples
- Silicon Trap BEAT 2 (Cold War context with COCOM regime) — dark scene atmospheric layer.
- Prisoners' Dilemma RAND scenes — institutional corridor with fluorescent atmospheric particles.
- Future "Origins of Empire" cold-open archival montage.

### Real-world references
- **NYT Visual Investigations *Day of Rage*** — Capitol riot scenes carry continuous atmospheric particle layers. The dark scenes never go fully still even when the primary content is held.
- **NYT VI *Mariupol Drama Theatre*** — atmospheric texture on dark-bg overlays creates an "alive" cold-open.
- **Bloomberg Quicktake China+** — Beijing night-scene establishers continuously carry particle drift.
- **Validation from outlet research:** light/paper backdrops in editorial register (Economist, FT, Reuters Graphics) explicitly do NOT carry particle layers. The asymmetry is institutional, not stylistic.

### Technical brief
- Not a drift preset. Applied via the FilmOverlay cascade in `src/components/FilmOverlay.tsx` or via `<AmbientParticles>` component.
- Driven by `filmOverlay.preset` (e.g., `"nocturnal"`, `"surveillance"`, `"investigation"`) at the segment level.
- The cascade resolves per-segment via `resolveFilmOverlay.ts` — preset → effects → intensity.
- Combine with one element-level drift preset (e.g., Documentary Ken Burns on the photo + atmospheric particles on the FilmOverlay substrate).

### Failure mode
Particles on light/paper backdrops. The editorial register collapses immediately to "YouTube explainer with particle effects." The Phase 1 outlet research found ZERO instances of FT / Economist / Reuters / NYT Upshot using particle layers on light backdrops — the institutional discipline is universal.

---

## 08 · Mood pulse (component chrome)

**Not a `DRIFT_PRESETS` entry.** This technique lives at the per-component chrome layer.

**Implicit claim:** "This single accent is responding to the moment's tension."

### Use for
- REC indicator (already wired in HeaderStrip — pulses to mark "we are recording")
- ProbabilityGauge needle subtly pulsing while holding the forecast
- Hero accent color (typically amber or rust) pulsing on dark backdrops in the tense register
- Reference line on a held chart subtly pulsing to mark threshold attention

### Avoid for
- Light / paper-substrate content (pulsing accents on cream backdrop read as game UI)
- Multiple simultaneous pulses (cascading anxiety — pick one accent, not five)
- Combined with breathing on the same element (the breathing already provides life; mood pulse on top reads as nervous)

### Parallax examples
- HeaderStrip REC indicator — already shipped, this is the canonical example.
- ProbabilityGauge held-value indicator pulsing on the tense forecast moment.
- Future: Silicon Trap export-control timeline rung accent pulse at peak tension.

### Real-world references
- **Bloomberg Quicktake** — the live-indicator chrome pulses subtly during held data.
- **NYT election-night dashboards** — projected-state highlight pulses subtly.
- **Sports broadcast chrome** — universal pattern in live-data overlays.

### Technical brief
- Not a drift preset. Per-component implementation via `useMoodPulse()` hook (pending — currently inline in HeaderStrip).
- Applied to a *single* accent element, not the whole composition.
- Mood pulse should be felt, not seen — subtle scale or opacity oscillation, max 5-10% magnitude.

### Failure mode
Multiple pulsing accents on the same composition. The viewer's eye is drawn to motion; cascading pulses create motion competition and read as nervous / unfinished.

---

## Decision matrix — which technique for which moment

### Register A — Analytical hold (data, diagrams)

Editorial intent: *the data is the argument; motion should not compete with reading*.

| Template | Default | Alternative |
|---|---|---|
| DataChart | Editorial | Settle (post-entrance lock) |
| TimeSeriesChart | Editorial | — |
| BumpChart | Editorial | — |
| RidgelinePlot | Editorial | — |
| Streamgraph | Editorial | — |
| NetworkDiagram | Editorial | Settle (when fully built up) |
| ArcDiagram | Editorial | Settle |
| FrameworkDiagram (matrix) | Settle | Editorial |
| FrameworkDiagram (flow/comparison) | Editorial | — |
| GameBoard | Editorial | — |
| DecisionTree | Editorial | — |
| EscalationLadder | Editorial | — |
| HorizontalTimeline | Editorial | — |
| BeeswarmChart / CalendarHeatmap / ConnectedScatterplot / TernaryPlot / HorizonChart / MarimekkoChart / DumbbellPlot / PopulationPyramid / RankChangeDotPlot | Editorial | — |
| BayesianUpdate / ProbabilityGauge / RadarChart | Editorial | Mood pulse (on threshold value) |
| IsotypeChart | Editorial | — |

### Register B — Editorial-hero hold (typography, single stats)

Editorial intent: *one idea, one value, alive but stationary*.

| Template | Default | Alternative |
|---|---|---|
| StatReveal | Breathing | Settle |
| KineticTypography (statistic variant) | Breathing | Settle |
| KineticTypography (quote variant) | Breathing | Stillness (for memorial/casualty/silence beats) |
| KineticTypography (definition variant) | Breathing | Settle |
| KineticTypography (bilingual variant) | Settle | — |

### Register C — Documentary hold (photo plates, archival material)

Editorial intent: *the image is a master shot; meaning accrues through duration*.

| Template | Default | Alternative |
|---|---|---|
| ImageComposite | Documentary | — |
| PhotoMontage | Documentary | — |
| AnnotatedImage | Documentary | — |

### Register D — Cartographic hold (maps)

Editorial intent: *the geography is the argument; motion must not shift projection registration*.

| Template | Default | Alternative |
|---|---|---|
| AtlasPlate | Breathing (scale-only, projection-safe) | Sway |
| ChoroplethMap | Editorial | Documentary (atmospheric register) |
| RouteAnimation | Editorial | Documentary (atmospheric register) |
| DensityMap | Editorial | Documentary |
| CartogramMap | Editorial | — |
| TilegramUSMap | Editorial | — |
| ProportionalSymbolMap | Editorial | — |

### Adjacent (substrate / chrome)

Editorial intent: *the world or chrome is alive while the element holds*.

| Register | Treatment | When |
|---|---|---|
| Dark cinematic backdrops | Atmospheric particles (FilmOverlay) | Pair with one element-level technique |
| HeaderStrip REC indicator | Mood pulse | Always (already wired) |
| ProbabilityGauge held value | Mood pulse | Tense forecast register |
| Single hero accent on dark | Mood pulse | Peak-tension moments |

---

## Combining techniques

**Allowed combinations:**

- **Element drift + atmospheric particles** — Documentary Ken Burns on a photo + atmospheric particle layer on the FilmOverlay substrate. The element moves with directional intent; the substrate moves ambiently. They're at different layers so they don't compete.
- **Settle + Editorial** — first 0.6s settles the composition, subsequent hold is editorial drift on top of the settled scale. Wired automatically when `settle` is the preset; the post-settle drift is implicit.
- **Stillness + audio silence** — pair Stillness with no music bed and a measured narration pause for the "thinking beat" register. The visual silence and audio silence reinforce each other.
- **Mood pulse + any element drift** — the pulse is on a *single accent*, the drift is on the *whole composition*. Different scopes, no competition.

**Forbidden combinations:**

- **Documentary Ken Burns + Sway** — two competing pan systems on the same composition.
- **Breathing + Mood pulse on the same element** — the breathing already provides life; the mood pulse on top reads as nervous.
- **Multiple atmospheric layers** — atmospheric particles + light leaks + dust + grain = visual mud.
- **Continuous-zoom uniform across composition** — the legacy `normal` preset applied to everything is the YouTube-explainer signature anti-pattern.

---

## Anti-patterns to watch for

### Uniform continuous-zoom on every template

Setting `driftPreset: "normal"` or `"documentary"` as a global default produces the YouTube-explainer signature — every shot zooming, every cut a slow push-in. The Phase 1 outlet research found this pattern *only* on lower-tier explainer channels; FT, Economist, NYT, Bloomberg all explicitly vary their drift register per content type.

### Particle layers on light/paper substrate

Atmospheric particles on cream paper read as dust on the lens or sparkle stickers. The Phase 1 research found *zero* instances of editorial outlets (FT, Economist, Reuters, NYT Upshot) using particle layers on light backdrops. Reserve particles for dark cinematic register only.

### Independent layer drifts (parallax mismatch)

If foreground text drifts left while background photo drifts right, viewers register parallax mismatch — the leading cause of motion-induced disorientation per OpenNews "Your Interactive Makes Me Sick" (2018). Per Gestalt Common Fate (Wertheimer, 1923), elements that move together are perceived as belonging together; elements moving in opposite directions are perceived as belonging to different worlds.

**Rule:** drift at the composition level, never independent layers. `useCompositionAnimation()` applies one transform to the whole AbsoluteFill. Per-element drift is forbidden.

### Stillness as default

Choosing `none` as the global default is the *opposite* of choosing `documentary` as the global default — both are mistakes for the same reason. Default-on-everything is itself a wrong choice; each segment is editorial register, not afterthought.

### Visible breathing on charts

Breathing pulse on a 4-bar comparison chart can make bars feel like they're "growing" — false data signal. Reserve breathing for single-hero content (one stat, one quote, one held idea). Multi-element analytical content uses Editorial drift.

### Rotation drift on data

`documentary` includes 0.3° rotation. This is fine on a photograph; on a chart it tilts the X-axis baseline — viewer parses "is the data tilted?" The DRIFT_PRESETS comment explicitly flags this; respect the flag.

---

## Implementation status & extraction roadmap

### Already wired (technical surface complete)

- `DRIFT_PRESETS` in `src/hooks/useDirection.ts` — 7 presets covering 6 of the 8 techniques here.
- `useCompositionAnimation()` in `src/hooks/useCompositionAnimation.ts` — 4 motion modes (linear, breathing, settle, sway) consumed by every template.
- `<AmbientParticles>` component for substrate-layer atmospheric motion.
- FilmOverlay cascade for substrate-layer treatment selection.
- HeaderStrip REC indicator for mood pulse (the canonical chrome implementation).

### Adoption gap (the Phase 0 audit finding)

- **0 templates explicitly set `driftPreset`** — every template uses the global `editorial` default.
- **0 episode segments override** `driftPreset` in their data files.
- The register exists; the discipline of *selecting from* it doesn't yet.

### Phase 3 roadmap (per-template defaults)

Wire `TEMPLATE_DRIFT_DEFAULTS` in `useDirection.ts` cascade:

```ts
const TEMPLATE_DRIFT_DEFAULTS: Partial<Record<TemplateComponent, DriftPreset>> = {
  // Register C — documentary
  ImageComposite: "documentary",
  PhotoMontage: "documentary",
  AnnotatedImage: "documentary",
  // Register B — editorial hero
  StatReveal: "breathing",
  // Register D — cartographic (projection-safe)
  AtlasPlate: "breathing",  // scale-only, no pan, no rotation
  // ...
};
```

Cascade resolution: `data._direction.driftPreset → TEMPLATE_DRIFT_DEFAULTS[component] → "editorial" fallback`.

### Phase 4 — new directives

Add to `parse_dir_lines` in `tools/assembly/generate_manifest.py`:

- `DIR: hold(stillness)` — sets `driftPreset: "none"` on the segment, distinguishable from existing `hold(land)` (which is a duration directive).
- `DIR: drift(<preset>)` — explicit script-side opt-in. Sets `driftPreset: "<preset>"` on the segment.

The vocabulary is opt-in, not required — most segments take the template default.

### Phase 5 — catalog showcase

`CatalogDriftRegisterShowcase`: mosaic composition showing all 8 techniques side-by-side on identical content. The visual reference card that script-writers consult before picking a preset for a non-default moment.

### Phase 6 — lint

Add `M-DRIFT-DEFAULT` rule: warn when a TEMPLATE segment uses a `driftPreset` that contradicts the template's recommended register (e.g., AtlasPlate set to `documentary` — possible but worth flagging; ImageComposite set to `none` — likely a mistake).

---

## How to use this doc when generating visual specs

When `visual-spec` is called on a segment, it should:

1. **Identify the editorial register** of the segment from the script: is it analytical (data argument), editorial-hero (single idea), documentary (photo/archival), or cartographic (map)?
2. **Look up the recommended preset** in the Section 4 register tables.
3. **If the recommended preset is the template default** → no `_direction.driftPreset` field needed; the template will use its default.
4. **If the segment warrants a different preset** (e.g., a memorial moment on a normally-editorial chart wants Stillness) → emit `_direction.driftPreset: "<preset>"` in the data file.
5. **For substrate-layer treatment** (atmospheric particles, mood pulse) → that's handled by the FilmOverlay cascade and HeaderStrip / component chrome, not by `driftPreset`.

When `script-draft` is called and wants to express a hold-motion choice in the script:

- Default: don't write a directive; the template default handles it.
- Override: `DIR: drift(breathing)` or `DIR: drift(stillness)` or `DIR: drift(documentary)` etc.
- Memorial/silence moments: `DIR: hold(stillness)` is the preferred sugar.

When `script-audit` runs, it should:

- Verify that segments using `DIR: drift(<preset>)` use a preset that exists in the register (no typos, no invented values).
- Flag segments where the chosen preset contradicts the doctrine (e.g., `drift(documentary)` on a chart segment).

---

## Summary

Hold-beat motion is editorial register, not decoration. The eight canonical techniques each carry an implicit claim about what kind of element they animate; matching technique to claim is the work. The technical surface already exists in `DRIFT_PRESETS` + `useCompositionAnimation()` + FilmOverlay cascade + component chrome — the doctrine work is *assignment*, not *invention*.

The Phase 0 audit found five 🔴 static templates (ImageComposite, PhotoMontage, AtlasPlate ×2, KineticTypography statistic). Phase 3 will wire per-template defaults that close all five. Phase 5 will ship the catalog showcase. After that lands, every hold beat in every Parallax episode is a deliberate editorial choice — same compounding leverage as text animation.
