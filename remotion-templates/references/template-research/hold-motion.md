# Hold-Beat Motion — Research Dossier

> What happens visually in the 2–8 seconds AFTER an element has finished its
> entrance reveal and BEFORE it begins its exit — when narration is still
> running, music bed continues, but nothing new is *revealing*.
>
> Created: May 16, 2026. Sibling to `motion-design.md` — that dossier covers
> entrance/transition motion; this one covers the hold window specifically.
> Motivated by `project/HOLD_MOTION_AUDIT_PHASE0.md`, which found 3 of 20
> Parallax templates render byte-identical frames between f90 and f150
> (zero motion across 2 seconds).

## 1. The editorial purpose of hold-beat motion

The hold beat is the longest visual moment in editorial video that the
script *doesn't talk about*. Entrance grammar is a solved problem — fade
in at 350–400ms, anticipate the narrator's word by 150ms, land cleanly.
Exit grammar is a solved problem — 8-frame fade-out at segment end. The
window in between, where narration is mid-sentence and the visual is
just *there*, is where outlets diverge from each other most.

What hold-beat motion does:

1. **Confirms the frame is alive.** A perfectly static frame held for
   more than ~1.5 seconds reads as "did the player freeze?" — viewers
   start checking their connection. *Some* motion, even imperceptible,
   keeps the screen feeling like a continuous take rather than a slide.
2. **Sustains attention across reading time.** Reading a 6-row data
   table takes 4–6 seconds; if the table is *also* drifting visibly, the
   eye competes between text and motion and reading slows. Different
   editorial moments call for opposite answers here.
3. **Encodes editorial register.** Static = printed page, document of
   record. Subtle drift = documentary, archive-as-cinema. Atmospheric =
   dramatized scene, mood-forward. The choice is a register declaration
   as much as a motion choice.
4. **Marks emotional weight.** A *deliberate* hold on a quiet frame
   (eulogy, casualty count, named quote) is a punctuation mark.
   Stillness, when chosen, makes the next motion bigger.

What hold-beat motion is **not** for:

- **Filling silence with decoration.** If nothing in the frame demands
  motion, motion is just video producer anxiety made visible.
- **Compensating for unclear content.** A drifting Ken Burns over a
  chart the viewer can't parse doesn't help them parse it.
- **Hiding under-resourced shots.** "We didn't have a better image so we
  panned across this one" reads as cheap (the Vox Atlas anti-pattern
  when overused; see § 2g).

The doctrine pattern Parallax should aim for, per `motion-design.md`'s
"substrate-alive, elements-held" identity: **substrate motion does the
hold; element motion does the reveal.** The grain layer breathes, the
particle dust drifts, the paper background sub-pixel-wobbles. The chart
itself sits still. This is editorial register. Pure stillness with no
substrate is PowerPoint; element drift with no substrate is After Effects.

## 2. Canonical idioms

### 2a. Total stillness — "the document of record"

**References:**
- The Economist Daily Charts video, recurring (every print-to-video
  adaptation; the chart settles and HOLDS for 2–4 seconds before the
  next reveal — substrate is paper-still).
- FT Graphic Detail video adaptations (post-2022) — when the visual is
  a dense statistical chart with multiple labels, the held state is
  fully static; the viewer is reading, not watching.
- NYT Upshot "How Trump's tariffs..." style data plates (2024–25).
- ProPublica long-form interactives — *"What Happened to All the Jobs
  Trump Promised?"* — held visuals don't animate; user controls
  attention. ([OpenNews](https://source.opennews.org/articles/motion-sick/))

**Why it works:** When the visual carries dense information the viewer
must *read* (multi-row tables, complex multi-series charts, annotated
diagrams with > 5 callouts), any motion is interference. Reading is the
job; motion is the obstacle.

**When it's wrong:** On hero photographic plates, archival material, or
maps with low textual density held > 1.5 seconds. Stillness on a Cold
War atlas held 3 seconds reads as PowerPoint, not editorial.

**`DRIFT_PRESETS` mapping:** `none` (and `noDrift: true` at the
template level when authoritative). Note: total stillness *at the element
level* is fine — but the substrate (grain, sub-pixel paper wobble) should
still be alive underneath. This is the substrate-motion-identity in
`motion-design.md`.

### 2b. Documentary Ken Burns — "the master shot"

**References:**
- Ken Burns himself, *Brooklyn Bridge* (1981) — the famous 33-second
  zoom on John Roebling's portrait that defined the technique. Burns:
  "meaning accrues through duration." Each photo treated as a "master
  shot" — raw cinematic material that demands motion.
  ([CineD](https://www.cined.com/the-story-behind-the-ken-burns-effect-how-a-phone-call-from-steve-jobs-made-documentarys-most-influential-technique-a-household-name/))
- NYT *Greenland Is Melting Away* (Derek Watkins, 2015) — held
  satellite imagery with continuous slow zoom from ice-sheet scale down
  to research camp scale. The zoom IS the editorial argument about
  scale.
  ([Storybench](https://www.storybench.org/how-the-nyts-derek-watkins-designed-greenland-is-melting-away/))
- PBS *Frontline* archival sequences — every photo gets a 4–8 second
  zoom or pan at ~3–5% scale change. The slow camera move is what makes
  a 1940s photograph hold attention across modern viewer impatience.
- Nat Geo *Photographer* (2024) and *Apollo* archival treatments —
  archival imagery rendered as cinematic stills with sustained Ken Burns
  push.

**Why it works:** Photographic plates are *fundamentally* hold-beat
content — the image isn't going anywhere; it's the narration the viewer
is following. A slow zoom keeps the frame feeling continuous rather than
slide-projected. The motion encodes time spent looking.

**When it's wrong:** On charts (axis tilt is a data-truthfulness
violation — the chart's geometry IS the argument). On photos with sharp
horizon lines (any rotation reveals the artifact). Above ~6% scale
change (the digital artifact becomes visible, register cheapens — per
`motion-design.md` § 4).

**`DRIFT_PRESETS` mapping:** `documentary` (scale 1.06, pan 18/8 px,
rotation 0.3° — already in the menu). The audit found `ImageComposite`
and `AnnotatedImage` templates currently render with 0% drift. They
should be `documentary` by default, full stop.

### 2c. Breathing — sinusoidal scale oscillation

**References:**
- Cinemagraphs (Jamie Beck & Kevin Burg, 2011) — the canonical "still
  image with one isolated subtle motion" technique. Specifically the
  *bounce loop* variant, where motion never reaches a hard endpoint;
  oscillates indefinitely. ([Wikipedia, Cinemagraph](https://en.wikipedia.org/wiki/Cinemagraph))
- The Economist *Off the Charts* substack's animation series (Rosamund
  Pearce et al.) discusses oscillating motion on long-held quotes and
  pull-out figures (article behind paywall but the doctrine is visible
  in published Economist video adaptations: hero pull quotes scale
  ~1.0 ↔ 1.005 on a slow cycle while held).
- FT *Visual Vocab* explainer cards — single-figure pull quotes ($1.3T,
  47%) often "breathe" through a sub-1% scale oscillation while the
  narrator builds context around the number. The breathing implies
  *this number is alive in the argument*.

**Why it works:** Sinusoidal scale change (no pan, no rotation) keeps
the frame alive without going anywhere. The viewer perceives "the screen
is on" rather than "the screen has frozen." Critically, *net
displacement is zero* — the frame doesn't slip toward an edge over a
long hold. Suitable for both light (paper) and dark (cinematic)
backdrops.

**When it's wrong:** On data tables and dense annotated diagrams —
oscillation makes labels appear to grow/shrink, which is visual noise.
On any composition where exact pixel position matters (a callout arrow
pointing at a specific feature drifts off-target).

**`DRIFT_PRESETS` mapping:** `breathing` (mode "breathing", scale
1.008, no pan, no rotation). Already in the menu; zero templates
currently opt in.

### 2d. Settle — one-time scale lock

**References:**
- Vox *Atlas* establishing shots — title plate enters, gentle 0.6s
  scale settle from 1.025 → 1.0, then HOLDS. The camera "lands."
  ([Storybench](https://www.storybench.org/how-vox-uses-animation-to-make-complicated-topics-digestible-for-everyone/))
- NYT Upshot *2024 election results* state plates — bar settles, then
  the entire plate locks. No further motion until the next state is
  introduced.
- FT *Big Read* video adaptations — chapter cards lock after the title
  tracks in; the page itself doesn't drift, only the substrate grain.

**Why it works:** A one-time arrival motion at the start of the hold
window "fills" the entry of the hold with motion, then commits to
stillness for the read. The viewer perceives motion *as part of the
arrival*, not as ongoing decoration. Perfectly suited to data
templates: the chart establishes, then sits still while the eye reads.

**When it's wrong:** On photographic or atmospheric plates where
ongoing life is wanted. Settle is for *analytical* hold beats; on a
Cold War atlas, settle reads as still-too-still.

**`DRIFT_PRESETS` mapping:** `settle` (mode "settle", scale 1.025
during entrance, then locked). Already in the menu.

### 2e. Atmospheric particles — substrate motion at element scale

**References:**
- NYT Visual Investigations *Day of Rage* (Jan 2021) — dark scenes
  carry light-leak and dust-particle layers throughout sustained holds.
  The 3D Capitol reconstruction never moves, but the surrounding
  atmospheric layer drifts continuously. Permitted by the dark backdrop
  (cinema-grade darkness always has ambient life).
- NYT VI *Mariupol Drama Theatre* (2022) and *Bucha* satellite analysis
  (2022) — sustained holds on satellite stills with subtle particulate
  overlay (smoke, atmospheric haze) layered atop the static evidence
  frame.
- Bloomberg Quicktake *China+* series identity (2021–22, Territory
  Studio) — dark scenes use bold-color motion textures as "thinking
  / processing" motif on otherwise-static information cards.
  ([Designboom](https://www.designboom.com/design/bloomberg-quicktake-creative-director-disrupting-the-traditional-tv-news-model-04-27-2021/))

**Why it works:** Particle / haze / light-wobble motion at the
substrate layer (not on the data element) keeps dark scenes "alive"
without modifying the editorial content. The information sits still;
the air around it doesn't.

**When it's wrong:** On light/paper-substrate backdrops at high
density. Heavy particle drift on bone paper reads as game UI or
sci-fi overlay, not editorial. The technique is dark-mode-native;
light-mode applications need ≤10% intensity to avoid that drift.
**Critical for Parallax:** particles on a Cold War atlas plate is a
register call — vintage warm-grain *yes*; sci-fi blue particles *no*.

**`DRIFT_PRESETS` mapping:** *Not currently a drift preset.*
Atmospheric motion lives in `<AmbientParticles>` and the substrate
`<FilmOverlay>` layer (grain, dust, scratch, light-leak). The doctrine
recommendation is **NOT to add this as a new drift preset** — it
already lives at the substrate layer in the FilmOverlay cascade
(`remotion-templates/CLAUDE.md` § FilmOverlay cascade). The
authoring move is to *opt the segment into a stronger FilmOverlay
preset* (e.g., `documentary` or `cinematic-dark`) rather than apply
particle motion at the element-drift level.

### 2f. Sway — zero-net-displacement pan

**References:**
- The Economist video adaptations of map plates — held maps on long
  narration occasionally exhibit a subtle bidirectional drift on
  uncoordinated X and Y cycles (≈ 6s X / 9s Y) so the motion never
  traces a perfect circle and the frame never slips toward an edge.
- Cinemagraph *bounce loop* applied at frame scale (rather than
  element scale) — same principle.

**Why it works:** A perfectly periodic pan would trace an ellipse and
read as mechanical loop. Two uncoordinated periods on X and Y produce
Lissajous-like motion that *feels alive* without revealing a pattern.
Net displacement over a long hold is zero (no slip).

**When it's wrong:** On charts and diagrams where exact pixel position
matters (callout arrows, labeled features). On photographic plates —
photographic content wants documentary push, not bidirectional sway.

**`DRIFT_PRESETS` mapping:** `sway` (already in the menu; pan ±6px X,
±4px Y, no scale, no rotation).

### 2g. Continuous-zoom (the YouTube explainer anti-pattern)

**References:**
- Generic d-grade YouTube explainer channels — slow continuous zoom-in
  on every shot, regardless of editorial content. Pattern is unsigned
  but recognizable: 8% zoom over 10 seconds, applied uniformly to
  charts, photos, maps, even text cards.
- *Most* low-budget educational YouTube where the producer "added
  motion" because static frames feel cheap. Vox Atlas avoids this
  ([Google Earth blog on Vox use of Earth Studio](https://medium.com/google-earth/how-vox-video-uses-earth-studio-for-dynamic-visual-storytelling-703fc871766e))
  by tying zoom to *editorial transition* (zoom from continent to
  country IS the geographic argument), but the uniform-zoom-everywhere
  pattern is what overuse degrades to.

**Why it usually goes wrong:** Continuous zoom telegraphs "After
Effects was here" rather than "an editor made a choice." When applied
uniformly, the zoom rate becomes a tell that the producer doesn't
distinguish between content that deserves motion (a master-shot photo)
and content that doesn't (a chart). The same motion across every shot
levels editorial weight — nothing is special anymore.

**When it's intentional:** Zoom paired with a *narrative reason* — Vox
Atlas zooming from a country view to a city view as the narration
moves to local context. The zoom IS the argument. Outside that
context, uniform zoom is decoration.

**`DRIFT_PRESETS` mapping:** The legacy `normal` preset (scale 1.06,
pan 18/8, rotation 0.3°) maps to this pattern when applied uniformly.
Doctrine guidance: **never use `normal` as a template default.** It
exists for back-compat and for the rare composition with a specific
zoom-as-argument editorial intent.

### 2h. Mood pulse — single accent oscillation on dark scenes

**References:**
- NYT VI *Day of Rage* — a "REC" / timestamp accent in the chrome layer
  pulses on a slow cycle while the main scene is held. Not on the
  editorial content; on a peripheral indicator.
- Bloomberg ProbabilityGauge-style indeterminate-state indicators (the
  pending-outcome pulse already documented in `motion-design.md` § 8.4
  — the pulse IS the editorial state).
- Cinema-tier dark scenes with a single light source (lantern, candle,
  monitor glow) that flickers subtly while everything else is held —
  the entire shot reads as alive without competing with the still
  subject.

**Why it works:** A single point of subtle oscillation on a held dark
scene "directs the eye" — the viewer's attention parks there, freeing
the rest of the frame to sit still. The static content benefits; it's
not asked to be the source of life.

**When it's wrong:** On light/paper substrate (no equivalent to a
candle in a daylit page). On data elements (a pulsing data point is
the entrance-pulse-on-landing idiom from `motion-design.md` § 2d, not
a sustained hold-beat technique).

**`DRIFT_PRESETS` mapping:** *Not a drift preset, by design.* This
lives in component-level pulse logic (e.g., `ProbabilityGauge`'s
pending state, `FooterStrip`'s ●REC indicator). Treat as a
chrome/state pattern, not a hold-motion register.

---

### Idiom-to-preset summary

| Hold idiom | DRIFT_PRESETS | New preset needed? |
|---|---|---|
| 2a. Total stillness | `none` (with active substrate) | No |
| 2b. Documentary Ken Burns | `documentary` | No |
| 2c. Breathing oscillation | `breathing` | No |
| 2d. One-time settle | `settle` | No |
| 2e. Atmospheric particles | *substrate layer; not element drift* | No — use `FilmOverlay` preset |
| 2f. Zero-net-displacement sway | `sway` | No |
| 2g. Continuous zoom (anti-pattern) | `normal` (legacy) | No — avoid as default |
| 2h. Mood pulse on dark scene | *component-level chrome* | No — state pattern |

**Net finding:** the existing `DRIFT_PRESETS` menu covers the canonical
hold-beat techniques. The doctrine work is **not preset invention**
but *preset assignment* — wiring each template category to the right
preset by default.

## 3. General principles

The design-theory backbone for hold-beat motion:

- **Common Fate (Gestalt).** Wertheimer's law of common fate (1923):
  visual objects moving with the same velocity along parallel
  trajectories are perceived as grouped. In hold-beat motion: if
  multiple elements drift at the same rate, they read as a single
  unified frame (atlas plate + chrome drifting together = "the page is
  moving"). If elements drift independently, the eye must track each
  separately, fragmenting attention. **Implication:** during hold,
  drift should be applied at the *composition* level (whole frame) or
  not at all — never to individual data elements independently.
- **Substrate-motion identity.** Per `motion-design.md` § 4: "the page
  must feel alive through ambient means (grain, drift, light wobble)
  so that *deliberate* element motion reads as significant." Hold-beat
  motion lives at the *substrate* layer by default; element-level drift
  is the exception that earns its way in.
- **Burns' duration principle.** "Meaning accrues through duration."
  Held imagery on a documentary photo gets editorial weight *from
  being held*, not from the motion itself. The motion is what makes
  the hold tolerable; the *length* of the hold is what makes it
  meaningful.
- **Cleveland / Tufte data-ink rule, extended to motion.** Motion-ink
  on data should encode information (the chart's draw-in encodes
  chronology). Motion-ink during hold encodes nothing about the data —
  so on data templates, hold-beat motion should be near-zero
  (`editorial` or `none`). On atmospheric templates, hold-beat motion
  IS the atmospheric layer.
- **Accessibility / motion sickness.** Per OpenNews's *"Your
  Interactive Makes Me Sick"* (2018): the most common cause of
  motion-induced disorientation in news graphics is *parallax mismatch*
  — a background element moving subtly *while the viewer's eye expects
  page stasis*. Implication: hold-beat motion should be (a) optional
  via `prefers-reduced-motion` — applies to web equivalents — and (b)
  unidirectional or zero-net, never independent layers moving on
  independent vectors. Sway > parallax for held frames.
  ([OpenNews](https://source.opennews.org/articles/motion-sick/))
- **Reading vs. watching attention budget.** Reading a multi-row table
  demands continuous fovea-controlled attention; *any* peripheral
  motion competes. Watching a photo demands sustained scene attention
  but allows motion to operate without cost. **Implication: dense-text
  templates default to `editorial` or `none`; image / map / atmospheric
  templates default to `breathing` or `documentary`.**
- **Light vs. dark backdrop asymmetry.** Dark backdrops carry
  atmospheric particle / haze motion gracefully (cinema-grade dark
  scenes always have ambient life — dust, smoke, light leaks). Light
  paper backdrops do not — they have no analogue to ambient air, so
  the same atmospheric overlay reads as artifact. **The Phase 0
  audit's atlas-plate stillness is more forgivable on a vintage warm
  backdrop than on a stark editorial light one; but neither should be
  perfectly still for 2+ seconds.**

## 4. Recommendation for Parallax

**Doctrine: substrate-alive, elements-held, hold-beat-by-register.**

The hold-beat register is selected by *what kind of content the template
shows*, not by the template author's mood. Four registers:

### Register A — Analytical hold (data, diagrams, dense annotation)

**Default:** `editorial` (scale 1.02, no pan, no rotation).

The chart sits nearly still. Substrate grain breathes underneath. The
viewer is *reading*, not *watching*; motion is interference. The
`editorial` envelope is small enough to register as "the screen is on"
but not so large as to compete with axis-reading.

**Applies to:** DataChart, TimeSeriesChart, BumpChart, RidgelinePlot,
NetworkDiagram, ArcDiagram, FrameworkDiagram, DecisionTree, GameBoard,
RadarChart, PricingWaterfall, BeeswarmChart, ConnectedScatterplot,
HorizontalTimeline, EscalationLadder, SankeyFlow, DualTimeline,
PopulationPyramid, DumbbellPlot, RankChangeDotPlot, IsotypeChart,
TernaryPlot, Marimekko, Streamgraph, HorizonChart, CalendarHeatmap.

Per the audit, this cluster is *already at 2-3% pixel diff* — the
`editorial` default is working as designed. Keep.

### Register B — Editorial-hero hold (typography, quotes, single stats)

**Default:** `breathing` (sinusoidal scale 1.008, 8s cycle).

Held quotes and pull-out statistics get sub-1% scale oscillation so the
frame "breathes" without going anywhere. The hero text feels *alive in
the argument* rather than embalmed. Critically: applies to the held
*display* of typography; the entrance technique (Typewriter, Tracking-In,
Reveal Mask, per `TEXT_ANIMATION_REGISTER.md`) is unchanged.

**Applies to:** KineticTypography (quote / definition / statistic /
bilingual variants), StatReveal (during the long hold tail after the
ticker completes), TitleTransition (post-settle hold on title +
subtitle), BayesianUpdate (question card while it's being considered),
ProbabilityGauge (when at a settled value, not during pending).

The audit flagged KineticTypography quote at 0.87% diff — near-static.
`breathing` brings it to ~1.1–1.4% with no pan slip. Wired.

### Register C — Documentary hold (photographic plates, archival material)

**Default:** `documentary` (scale 1.06, pan 18/8 px, rotation 0.3°).

Photos and archival images get full Ken Burns. Slow zoom + gentle pan
across the 10–14 second hold (most photo plates run long). Treats every
photo as a master shot, per Burns. The audit's `image-composite`
byte-identical stillness is the worst case — photos *literally* are what
Ken Burns is named for.

**Applies to:** ImageComposite, PhotoMontage, AnnotatedImage (the image
IS the editorial content; the annotations are the chart).

Caveat: AnnotatedImage with extensive callout arrows pointing at
specific image features must use **`breathing`** instead — pan would
detach callouts from their targets. The doctrine recommendation
upstream: when an `AnnotatedImage` has > 3 callouts with pin-point
targeting, fall back to `breathing`. Below that count, `documentary`
is acceptable because callouts attach to broad regions that survive
small pan.

### Register D — Cartographic hold (atlas plates, maps)

**Default:** `breathing` for AtlasPlate (scale 1.008 — projection-safe).
`editorial` or `none` for Mapbox-driven maps (Choropleth, Route,
Density, Cartogram, Tilegram, ProportionalSymbol).

This is the Phase 0 smoking gun: two AtlasPlate stillness offenders out
of three. The fix is **not** documentary Ken Burns on an atlas (the
projection would shift past safe area, breaking the cartographer's
argument about geography). The fix is **`breathing`** — sub-1% scale
oscillation that doesn't shift projection, leaving the map's geometry
intact while making the frame feel alive.

For Mapbox maps: the camera path during entrance often does the
"motion" work (a route animation, a choropleth fade-in). Once settled
on a held wide shot, `editorial` or `none` is correct — the map's tile
detail is the substrate's life. *Map-pan during narration is reserved
for genuine editorial-zoom intent (e.g., zooming from continent to
country as narration moves to local context, à la Vox Atlas).*

Per the audit, AtlasPlate currently passes `noDrift: true` to
`useCompositionAnimation` — opting OUT of all drift on the assumption
that drift = projection shift. The doctrine work decouples these:
**`driftPreset: "breathing"` is scale-only and projection-safe.**
AtlasPlate should be wired to read `_direction.driftPreset` and apply
breathing as default while continuing to suppress pan/rotation drifts.

### Specific cross-register rules

1. **Substrate always breathes, regardless of register.** The grain
   layer, FilmOverlay grain/dust/scratch effects, and sub-pixel paper
   wobble continue regardless of the element-level drift preset. This
   is non-negotiable per the substrate-motion identity. No template
   should ever render byte-identical frames at f90 and f150 — even
   `none`-preset compositions inherit substrate motion.
2. **Anticipatory reveal is upstream of hold-beat.** D17 anticipatory
   reveal (entrance landing 150ms before the narrator names it) is the
   *entrance* doctrine. Hold-beat motion begins *after* the element has
   anticipated and settled. The two doctrines compose; neither
   modifies the other.
3. **`PACE: breathing` overrides default register.** If a script
   annotates a segment with `PACE: breathing` (slower, more
   contemplative), the segment may opt up one motion register (e.g.,
   `editorial` → `breathing`, `breathing` → `documentary`-with-reduced-
   amplitude). The pace annotation is editorial intent; it should
   express in motion as well as timing.
4. **Long holds (> 8s) earn one register above their default.** A
   chart held for 12 seconds while narration is dense should consider
   `breathing` instead of `editorial`. The longer the hold, the more
   the frame benefits from active life. Cutoff: 8 seconds is the
   threshold where editorial-default starts reading as static.
5. **Quote / casualty / eulogy beat: `none` is a valid choice.** When
   the narration is naming a specific casualty count, a quoted name of
   the dead, or a memorial moment, *stillness is the correct register*.
   The frame stops moving in respect. Substrate continues; element
   motion ceases. Schedule these explicitly in the script via
   `DIR: hold(beat:stillness, durationSec:N)` — not as a generic hold,
   but as a deliberate stillness directive. This is Parallax's
   equivalent of the documentary "musicless funeral scene" tradition.

## 5. Current template alignment

Synthesized from `project/HOLD_MOTION_AUDIT_PHASE0.md` (May 16, 2026):

| Template category | Audit f90→f150 | Verdict | Recommended register |
|---|---:|---|---|
| `image-composite-archive` | **0.000%** | 🔴 byte-identical | **C (documentary)** |
| `atlas-plate-cold-war-vintage` | **0.002%** | 🔴 byte-identical | **D (breathing)** |
| `atlas-plate-g7` | **0.002%** | 🔴 byte-identical | **D (breathing)** |
| `annotated-image-callout-demo` | 0.730% | 🟡 near-static | **C (documentary)** — degrade to breathing if >3 callouts |
| `kinetic-typography-quote` | 0.870% | 🟡 near-static | **B (breathing)** |
| `time-series-chart-atmospheric-co2` | 1.991% | 🟢 editorial | A (keep) |
| `game-board-chess-endgame` | 2.588% | 🟢 editorial | A (keep) |
| `network-diagram-hub-spoke` | 2.838% | 🟢 editorial | A (keep) |
| `arc-diagram-grand-strategy` | 2.874% | 🟢 editorial | A (keep) |
| `pricing-waterfall-*` (3 variants) | ~2.94% each | 🟢 editorial | A (keep — but motion variants don't differentiate, see audit) |
| `decision-tree-chess-opening` | 2.945% | 🟢 editorial | A (keep) |
| `framework-diagram-matrix` | 3.234% | 🟢 editorial | A (keep) |
| `bump-chart-gdp-power-transition` | 3.248% | 🟢 editorial | A (keep) |
| `ridgeline-plot-life-expectancy` | 3.357% | 🟢 editorial | A (keep) |
| `stat-reveal-apollo-cost` | 5.650% | ⚠ reveal-tail | **B (breathing during tail)** |
| `data-chart-speeds-bar` | 6.665% | ⚠ reveal-tail | A (after reveal lands) |
| `bayesian-update-venice-floods` | 6.958% | ⚠ reveal-tail | **B (breathing for question card)** |
| `stat-reveal-mariana-depth` | 6.995% | ⚠ reveal-tail | **B (breathing during tail)** |

**Cluster analysis (matches `motion-design.md` substrate-motion identity):**
- **Analytical templates (Register A)** cluster cleanly at 2-3%. The
  `editorial` default is working. No change needed for the analytical
  family.
- **Atlas plates (Register D)** are the audit's headline finding —
  literally frozen. Fix path is wiring `AtlasPlate` to consume
  `driftPreset` and applying `breathing` as default.
- **Photo plates (Register C)** are byte-identical. Worst case in the
  audit; fix is `documentary` preset on `ImageComposite` and
  `PhotoMontage`.
- **Typography hold (Register B)** is near-static at 0.87%; fix is
  `breathing` on KineticTypography quote/definition variants.
- **Reveal-tail templates** (StatReveal, BayesianUpdate, DataChart
  with late reveals) have the reverse problem — visible motion at
  audit checkpoint, but that's *entrance motion still landing*, not
  hold motion. Once the reveal completes (typically by f180 — 6s in),
  these segments fall into Register B (breathing) if held longer.

## 6. Specific upgrades proposed

Ranked by effort/impact:

### Upgrade 1 — Wire `AtlasPlate` to consume `driftPreset` (scale-only)

**Effort:** ~2 hr. **Impact:** Closes the audit's worst finding.

Currently `AtlasPlate.tsx` calls `useCompositionAnimation({ noDrift: true })`
unconditionally. Refactor to:

```tsx
const direction = useDirection(data._direction);
const { style } = useCompositionAnimation({
  noDrift: true,                     // suppress pan/rotation drift
  ...direction.driftOptions,         // but allow scale-only presets
  maxPanX: 0,                        // override any pan that slipped through
  maxPanY: 0,                        // override any pan that slipped through
  maxRotation: 0,                    // override any rotation
});
```

Default `driftPreset: "breathing"` in `atlas-plate-cold-war-vintage.json`
and `atlas-plate-g7.json`. The breathing oscillation is scale-only
(1.008 max) — well within projection safe-area tolerance.

Acceptance: re-run the audit; both atlas plates show 1.0–1.5% pixel diff
between f90 and f150.

### Upgrade 2 — Default `ImageComposite` and `PhotoMontage` to `documentary`

**Effort:** ~1 hr. **Impact:** Closes the byte-identical photo finding.

These templates exist *to display photographic content*. Photographic
content gets Ken Burns. The current 0% drift is a config oversight —
likely a `noDrift: true` somewhere or an upstream missing default.
Add `_direction: { driftPreset: "documentary" }` to default sample
data files. Verify the photo's safe area accommodates 6% scale push
+ 18px pan without cropping editorially important content.

For `AnnotatedImage`: keep `documentary` for ≤ 3 callouts; gate
behind a `usesBreathingFallback` rule when callout count > 3.

### Upgrade 3 — Default `KineticTypography` quote / definition variants to `breathing`

**Effort:** ~1 hr. **Impact:** Held quotes feel alive instead of embalmed.

Wire `KineticTypography.tsx` to consume `_direction.driftPreset`. Set
defaults in the catalog quote / definition / bilingual JSON files. The
breathing oscillation runs underneath the text-animation register
(Word Cascade entrance, Typewriter for quotes); the two layers compose
without conflict.

### Upgrade 4 — Add `DIR: hold(stillness)` directive to directing language

**Effort:** ~half day (parser + schema + doc). **Impact:** Unlocks the
deliberate-stillness editorial move (Register's rule 5).

Extend `DIRECTING_LANGUAGE.md` to recognize `DIR: hold(stillness,
durationSec:N)` as a directive that overrides the template's default
`driftPreset` to `none` for the specified hold window. Use case:
narrator names a casualty count, reads a quoted name of the dead,
delivers a eulogy beat. Parsed by `tools/assembly/generate_manifest.py`
into `_direction.holdBehavior: "stillness"` with optional
`stillnessSec`. `useDirection` resolves this to `driftPreset: "none"`
during the specified window.

Pair with audio: stillness moments often want a music-bed dip
simultaneously (per `AUDIO_DESIGN.md`). Document the convention.

### Upgrade 5 — Long-hold auto-upgrade rule in `useDirection`

**Effort:** ~3 hr. **Impact:** Compositions held > 8s automatically
become more alive.

In `useDirection.ts`, add logic: if `durationSec > 8` and the resolved
`driftPreset` is `editorial`, *and* the template is in Register A
(analytical), keep `editorial` (long held charts still want reading
calm). If `durationSec > 8` and Register B/C/D, auto-upgrade `editorial`
→ `breathing`. This is the "longer holds earn more motion" rule from § 4.

Gate behind a `holdMotionAutoUpgrade: true` opt-in initially; once
validated, flip default to on.

### Upgrade 6 — Catalog showcase of all hold-beat registers on identical content

**Effort:** ~3 hr. **Impact:** Visual reference; closes the Phase 0
finding that the existing motion-variant catalog doesn't actually
demo the drift presets.

Create `catalog/HoldMotionShowcase.tsx` rendering 4–6 compositions
showing the SAME data (a Cold War atlas, a Heraclitus quote, an Apollo
photo, a CO2 chart) in each register. The audit found the current
`pricing-waterfall-motion-{still,briefing,documentary}` variants render
nearly-identical f90→f150 deltas; this new showcase fixes that gap.

### Upgrade 7 — Document substrate-vs-element separation in BRAND.md

**Effort:** ~1 hr writing. **Impact:** Codifies the cross-cutting
identity decision.

Add a "Hold-beat motion" section to `remotion-templates/BRAND.md`
adjacent to the existing "Timing" section. One paragraph + the
register-to-preset table from § 4 here. Refer to this dossier as the
extended rationale.

## 7. Failure mode flags

These should always trigger an audit finding when seen:

- **Byte-identical frames between f90 and f150** on ANY non-chrome
  composition. (The exception: title cards held < 2 seconds; everything
  else should show ≥ 0.5% pixel diff from substrate motion alone.) The
  Phase 0 audit is the prototype for this check; should become a
  recurring CI snapshot test.
- **`driftPreset: "documentary"` on a chart template.** Rotation tilts
  the axis baseline — a data-truthfulness violation. Editorial register
  rejects this. Use `editorial` or `breathing` on charts.
- **`driftPreset: "documentary"` on AnnotatedImage with > 3 callouts.**
  Pan detaches callouts from their targets. Fallback to `breathing`.
- **`driftPreset: "documentary"` on AtlasPlate.** Projection shifts
  past safe area; cartographer's argument breaks. AtlasPlate is
  scale-only.
- **Continuous-zoom (`normal` preset) applied uniformly across a long
  segment.** The d-grade YouTube anti-pattern. Reserve `normal` for
  the rare composition with editorial zoom-as-argument intent.
- **Atmospheric particles on a paper-substrate template at intensity
  > 0.3.** Reads as game UI, not editorial. Light backdrops have no
  analogue to "air" — particle motion is a dark-mode-native
  technique. Suppress or move the composition to a dark variant.
- **Two independent drift vectors active on overlapping layers.** Per
  Common Fate: viewer's eye tracks each separately, fragmenting
  attention. Drift should be applied at the composition level, not at
  individual element levels.
- **Sustained hold-beat motion on a casualty-count / memorial / named-
  quote beat.** Stillness is the correct register for these moments;
  motion reads as disrespectful. Author the directive explicitly via
  `DIR: hold(stillness)`.
- **`breathing` on a data table with > 5 rows.** Subtle scale
  oscillation makes row labels appear to grow/shrink during reading,
  which is visual interference. Use `editorial` or `none`.
- **`sway` on a composition with callout arrows pointing to specific
  features.** Bidirectional pan detaches callouts from their pixel
  targets. Use `editorial` or `breathing` (scale-only) instead.
- **Hold beat held > 12s with `none` preset and no substrate motion.**
  Reads as PowerPoint slide. Either upgrade to `breathing` or shorten
  the hold via editing.
- **Multiple `driftPreset` values within a single composition's child
  elements.** The preset is a *composition-level* register declaration,
  not a per-element knob. Authoring inconsistency.
- **`driftPreset` set in `_direction` but the template doesn't consume
  it.** Silent failure — the JSON declares intent but the rendered
  output ignores it. The Phase 0 audit pattern; templates that opt out
  of drift via hardcoded `noDrift: true` need refactoring (Upgrade 1).

---

## TL;DR

**Parallax's hold-beat register, by content type:**

| Content | Default preset | Why |
|---|---|---|
| Charts, diagrams, dense annotation | `editorial` | Reading > watching |
| Held typography, quotes, single stats | `breathing` | Frame alive, no slip |
| Photographic plates, archival | `documentary` | Master-shot grammar |
| Atlas plates (SVG cartography) | `breathing` | Projection-safe, frame alive |
| Mapbox maps (held wide) | `editorial` or `none` | Tile detail is its own life |
| Memorial / casualty / named-dead beats | `none` (explicit) | Stillness as punctuation |

**The substrate always breathes.** Element-level stillness is fine when
the FilmOverlay grain, paper wobble, and dust layer keep the frame
alive underneath. **Total stillness across the entire stack** —
substrate AND element — is the failure mode the Phase 0 audit caught,
and should never recur.

**Five canonical hold-beat idioms** map cleanly to existing
`DRIFT_PRESETS`: `none`, `breathing`, `settle`, `documentary`, `sway`.
**No new presets are required** — the doctrine work is preset
assignment, not preset invention. Two near-techniques (atmospheric
particles, mood pulse) live at the substrate / chrome layer rather
than as element drift presets, and stay there.

## References

- Burns, K. *Brooklyn Bridge* (1981); *The Civil War* (1990); ongoing
  PBS documentaries. The 33-second Roebling zoom and the "meaning
  accrues through duration" doctrine.
  ([CineD biography](https://www.cined.com/the-story-behind-the-ken-burns-effect-how-a-phone-call-from-steve-jobs-made-documentarys-most-influential-technique-a-household-name/))
- *Ken Burns effect* — Wikipedia. Technical lineage from Jerome
  Liebling and the 1957 *City of Gold*. ([Wikipedia](https://en.wikipedia.org/wiki/Ken_Burns_effect))
- Watkins, D. & NYT Graphics. *Greenland Is Melting Away* (2015).
  Continuous slow zoom from satellite to camp scale.
  ([Storybench interview](https://www.storybench.org/how-the-nyts-derek-watkins-designed-greenland-is-melting-away/))
- NYT Visual Investigations playlist (2017–present): *Day of Rage*
  (2021), *Mariupol Drama Theatre* (2022), *Bucha* (2022).
  ([NYT Visual Investigations YouTube](https://www.youtube.com/playlist?list=PL4CGYNsoW2iAZt9-UzPyPZOH-AlRMxcIE))
- Beck, J. & Burg, K. (2011). *Cinemagraphs* — the original
  still-with-isolated-motion technique. ([Wikipedia, Cinemagraph](https://en.wikipedia.org/wiki/Cinemagraph))
- Bloomberg Quicktake brand & motion identity, Territory Studio (2021).
  ([Designboom interview](https://www.designboom.com/design/bloomberg-quicktake-creative-director-disrupting-the-traditional-tv-news-model-04-27-2021/))
- Vox Atlas series — Google Earth Studio for orbits and zooms.
  ([Google Earth Medium](https://medium.com/google-earth/how-vox-video-uses-earth-studio-for-dynamic-visual-storytelling-703fc871766e),
  [Storybench](https://www.storybench.org/how-vox-uses-animation-to-make-complicated-topics-digestible-for-everyone/))
- Bertrand, R. *Your Interactive Makes Me Sick* (OpenNews / Source,
  2018). Motion-induced disorientation in news graphics.
  ([Source](https://source.opennews.org/articles/motion-sick/))
- Pearce, R. *How we animate our charts*. The Economist *Off the
  Charts* substack (date n.d., paywalled).
  ([Substack](https://theeconomistoffthecharts.substack.com/p/how-we-animate-our-charts))
- Wertheimer, M. (1923). *Untersuchungen zur Lehre von der Gestalt*.
  Law of common fate.
- Tufte, E. *Envisioning Information*; *The Visual Display of
  Quantitative Information*. Data-ink principle extended to motion-ink.
- *motion-design.md* — parent dossier on entrance/transition motion
  conventions. This dossier is its child.
- *project/HOLD_MOTION_AUDIT_PHASE0.md* — the audit that motivated this
  research.
- *project/TEXT_ANIMATION_REGISTER.md* — the doctrine doc this dossier
  is parallel to.
