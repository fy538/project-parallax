# Parallax — Soundscape Register

## Purpose

This document names Parallax's six canonical ambient-soundscape registers and matches each to its editorial context. It exists so that visual-spec, script-draft, and audio-spec skills can select the right ambient bed for a given segment by following clear use-case rules grounded in the channel's editorial register — not by leaving each segment to drift through whatever music bed is loaded globally.

**Ambient soundscape** = the continuous low-level audio bed that runs beneath narration and music during a segment. Distinct from the three layers AUDIO_DESIGN.md already names (music bed, transition SFX, texture hits): the **soundscape register** sits BENEATH those layers as the room-tone substrate — what the segment *sounds like to be in*, irrespective of music or narration. The music bed shapes mood; the soundscape register shapes place.

Created: May 19, 2026

**Related docs:**
- **AUDIO_DESIGN.md** — the WHY behind sound decisions (this doc is the HOW: per-template selection + cascade rules)
- **TRANSITION_GRAMMAR.md** — sibling register; transition SFX cues defined there pair with ambient handoffs defined here
- **HOLD_MOTION_REGISTER.md** — structurally analogous (per-template defaults + cascade); read for register-system pattern
- **VISUAL_LANGUAGE.md** — three-register visual system (analytical / atmospheric / grounding); the six soundscape registers map onto these visual registers
- **PARALLAX_VISUAL_VOCABULARY.md** — per-template visual chooser; soundscape registry adds the audio counterpart per template
- **remotion-templates/src/utils/resolveSoundscape.ts** — implementation of the 5-tier cascade documented below

---

## Why a register, not a playlist

Ambient soundscape is a **register choice**, not a track-picker. Picking the wrong register reads as a *category error* — archive-room ambient on a cinematic terrain fly-through mis-claims that the fly-through is *quiet evidentiary reading*; atmospheric outdoor ambient on a chart segment mis-claims that the chart is *establishing material* rather than *analytical argument*. The wrong choice doesn't just sound off; it makes a *wrong implicit claim* about what kind of editorial moment this is.

The six registers below each carry an implicit claim about WHAT KIND OF SEGMENT this is:

| Register | Implicit claim |
|---|---|
| **Archive room** | "We're reading a primary source; you should be able to hear the page" |
| **Editorial print** | "This is analytical work; the room is alive but doesn't demand attention" |
| **Atmospheric outdoor** | "We're somewhere in the world; the geography is present, not abstract" |
| **Cinematic dark** | "Something is heavy here; the silence is doing editorial work" |
| **Cyclical drone** | "This is a feedback system; you should feel it loop" |
| **Silence** | "Stop. Pay attention. The visual is the entire signal" |

When the soundscape register matches the segment's editorial register, the ambient *reinforces* what the narration and visuals are doing. When it doesn't, the ambient *competes* — viewers don't consciously notice, but watch time drops and trust erodes.

**Pick the register whose implicit claim matches the editorial intent.** Defaulting one register globally for every segment is itself a wrong choice — it flattens the editorial topology of the episode into one tonal hue.

---

## The six registers (quick reference)

| # | Register | Asset slot | Visible character | Best for |
|---|---|---|---|---|
| 01 | Archive room | `archive-room.mp3` | Distant hum, occasional paper rustle, faint fluorescent buzz | PrimarySourceReveal, TelegramCable, HandwrittenLetter, NewspaperHeadlineRotator |
| 02 | Editorial print | `editorial-print.mp3` | Quiet office room tone, faint typewriter clatter, low hum | DataChart, TimeSeriesChart, BumpChart, StatReveal, KPICard, all analytical chart templates |
| 03 | Atmospheric outdoor | `atmospheric-outdoor.mp3` | Wind, distant nature, occasional bird, no human voices | CinematicMap, AtlasPlate (atmospheric/vintage), RouteAnimation atmospheric variant |
| 04 | Cinematic dark | `cinematic-dark.mp3` | Deep low drone, sub-bass, no melody | EscalationLadder, DecisionTree (extensive variant in dark mode), DialecticFlow tension moments |
| 05 | Cyclical drone | `cyclical-drone.mp3` | Low pulsing motif repeating every 6-12s, audible "loop" character | CausalLoopDiagram, SpiralTimeline (recurrence-thesis moments) |
| 06 | Silence | (none) | No ambient at all | KineticTypography quote cards, TitleTransition section openers, the "thinking beat" between arguments |

All asset slots are stubs initially — see `remotion-templates/public/assets/audio/README.md` for sourcing.

---

## The cascade

Soundscape resolution follows the same five-tier cascade as `FilmOverlay` — at render time, each segment's effective register is computed by walking these tiers from most-specific to most-general:

| Priority | Source | Applies to |
|---|---|---|
| 1 | `segment.template.soundscape.ambient` | Explicit per-segment override (script-level `[AMB: archive-room]`) |
| 2 | `backdrop.recommendedSoundscape` from `backdrop-manifest.json` | Backdrop-driven default (paired with `recommendedPreset` for FilmOverlay) |
| 3 | `TEMPLATE_SOUNDSCAPE_DEFAULTS[component]` in `soundscape.ts` | Per-template default — most segments use this |
| 4 | `manifest.soundscape.ambient` (episode default) | Episode-wide default (set in assembly-manifest top-level) |
| 5 | `"editorial-print"` (channel default) | Final fallback — neutral analytical room tone |

**Per-field cascade:** Authors can override just `ambient` for one segment without disturbing the cascade-resolved transition SFX and texture hits (each resolves independently). This matches the FilmOverlay per-field pattern.

**Implementation note:** the resolver lives in `src/utils/resolveSoundscape.ts`; the registry of per-template defaults in `src/design/soundscape.ts`. Cascade unit tests at `src/__tests__/resolveSoundscape.test.ts` lock all five priority levels (mirroring the FilmOverlay test pattern).

---

## 01 · Archive room

**Asset slot:** `archive-room.mp3` (loop 12-30s)

**Implicit claim:** "We're reading a primary source; you should be able to hear the page."

### Character
Quiet ambient room — distant air-handling hum, occasional paper rustle, faint fluorescent buzz at the edge of audibility. Conveys "indoor evidentiary space" — reading-room of a library, declassified-document archive, manuscript collection.

### Use for
- **PrimarySourceReveal** (treaty articles, formal documents)
- **TelegramCable** (diplomatic correspondence — adds typewriter texture-hits on body reveal)
- **HandwrittenLetter** (Burns-style letter reading — adds optional pen-stroke micro-hits)
- **NewspaperHeadlineRotator** (period newspaper sequences — adds paper-rustle on page advance)
- Any segment where the editorial register is "we are studying a document"

### Avoid for
- Cinematic terrain fly-throughs (use Atmospheric outdoor)
- Analytical charts (use Editorial print — archive-room implies evidentiary primary source, charts are derived analysis)
- Bright Editorial-Hero moments (use Editorial print — archive register reads as too quiet for energy peaks)

### Real-world references
- Ken Burns' *The Civil War* sequences when letters are read aloud — quiet room tone under voiceover
- BBC documentary archive sequences (Adam Curtis *HyperNormalisation*) when classified documents are on-screen
- PBS *American Experience* declassified-document scenes

### Failure mode
Sounds like dead air on the wrong template. Cinematic terrain shot with archive-room ambient feels like the camera is stuck inside a library while showing the outside world — incongruent.

---

## 02 · Editorial print

**Asset slot:** `editorial-print.mp3` (loop 15-30s)

**Implicit claim:** "This is analytical work; the room is alive but doesn't demand attention."

### Character
Quiet office room tone with faint typewriter or keyboard clatter at the bottom of the mix, distant traffic / HVAC, no music. Conveys "newsroom or working office" — productive, focused, present without being foregrounded. The **default register for the channel's analytical core**.

### Use for
- **DataChart**, **TimeSeriesChart**, **BumpChart**, **Slopegraph**, **StepLine** — chart family
- **StatReveal**, **KPICard**, **BulletChart**, **ProbabilityGauge** — hero stat / scorecard family
- **RadarChart**, **MarimekkoChart**, **TernaryPlot**, **HorizonChart** — analytical viz family
- **FrameworkDiagram**, **DecisionTree**, **EscalationLadder**, **NetworkDiagram**, **ArcDiagram** — analytical diagram family (UNLESS dark mode → Cinematic dark)
- **SmallMultiples**, **ComparisonPair** — comparison forms
- **AxiomList**, **Syllogism**, **ConditionalArgument** — argument primitives (UNLESS the editorial moment requires Cinematic dark / Cyclical drone)
- **HorizontalTimeline** — chronological structure
- **MorphTransition** — data-state-change moments
- Default fallback for any template not specifically called out by the other registers

### Avoid for
- Primary-source document reads (use Archive room)
- Cinematic terrain (use Atmospheric outdoor)
- Cold-open / closing-card moments (use Silence)
- Feedback-loop diagrams (use Cyclical drone — Editorial print misses the "this loops" register)

### Real-world references
- The Economist *Daily Charts* — quiet office ambient under their data segments
- FT *Visual Stories* — newsroom register on chart packages
- NYT Upshot interactive articles when narrated — print-room ambient as the implicit baseline

### Failure mode
Wrong density for cinematic moments — Editorial print on a CinematicMap fly-through reads as "the analyst is sitting in their office watching the world from a screen" rather than "we are present in the geography."

---

## 03 · Atmospheric outdoor

**Asset slot:** `atmospheric-outdoor.mp3` (loop 20-40s)

**Implicit claim:** "We're somewhere in the world; the geography is present, not abstract."

### Character
Wind layer (low rumbling), distant nature (occasional bird call, distant water), no human voices, no traffic. Conveys "outdoor real-place" — not a specific location but a present-in-the-world register. The audio companion to the visual atmospheric register (CinematicMap with `fogPreset: atmospheric`).

### Use for
- **CinematicMap** (terrain fly-throughs — the wind matches the camera's motion through atmosphere)
- **AtlasPlate** with `aesthetic: vintage` or atmospheric register (the world being shown is a geography, not a diagram)
- **RouteAnimation** with `fogPreset: atmospheric` (cinematic register)
- **ChoroplethMap** with full-globe / continental scale (the "world from above" register)
- **AnnotatedImage** when the image is a real outdoor scene (landscape, military terrain, geography)

### Avoid for
- AtlasPlate with `aesthetic: atlas` (formal-atlas register — use Editorial print instead)
- Maps in tight regional scope where the editorial point is the data overlay, not the geography (use Editorial print)
- Indoor archival images (use Archive room — wind contradicts the room)

### Real-world references
- *Apollo 11* (Todd Douglas Miller, 2019) — atmospheric wind under aerial Earth-from-orbit sequences
- BBC *Earth from Space* — atmospheric outdoor register beneath narration when surveys are continental
- Ken Burns *The National Parks* — wind + distant nature throughout terrain shots

### Failure mode
Sounds wrong on a tight regional choropleth where the editorial point is the data — the wind makes the chart feel like an establishing shot rather than analytical content. If you can't see geography on screen, you probably shouldn't hear it either.

---

## 04 · Cinematic dark

**Asset slot:** `cinematic-dark.mp3` (loop 30-45s)

**Implicit claim:** "Something is heavy here; the silence is doing editorial work."

### Character
Deep low drone (50-80 Hz), sub-bass swell, no rhythm, no melody. The audio equivalent of dark mode — the room itself is dim. Conveys "weight, gravity, consequence" without leaning on dramatic music cues. Pairs with `backgroundVariant: "dark"`.

### Use for
- **EscalationLadder** (the consequence-stack itself implies cinematic-dark register)
- **DecisionTree** (extensive variant in dark mode — chess openings, game-theory branches with stakes)
- **DialecticFlow** at the tension-marker moment (when the contradiction is foregrounded)
- **ConditionalArgument** when the FALSE branch is `severity: "critical"` — the catastrophic-consequence moment
- **CounterfactualPath** when one of the counterfactuals is existential (nuclear-war class)
- **CinematicMap** at night / dusk light presets where the editorial mood is weight, not survey
- The "before the reveal" beat preceding a major argument's punchline

### Avoid for
- Analytical chart segments (use Editorial print — Cinematic dark on charts reads as artificial drama)
- Primary-source reads (use Archive room — the deep drone competes with quiet evidentiary register)
- Any light-mode segment (Cinematic dark requires the visual to match)

### Real-world references
- Adam Curtis *HyperNormalisation* — low sub-bass throughout the most consequential argumentative moments
- BBC *The Power of Nightmares* — Cinematic dark register dominates the entire series ambient layer
- Errol Morris *The Fog of War* — Philip Glass-style low drone under McNamara's most weighted recollections

### Failure mode
Used for routine analytical content, sounds melodramatic ("watch this chart, with feeling!"). The register requires the visual to ALSO be heavy — without the dark visual, the dark audio reads as forced.

---

## 05 · Cyclical drone

**Asset slot:** `cyclical-drone.mp3` (loop 6-12s, audibly repeating)

**Implicit claim:** "This is a feedback system; you should feel it loop."

### Character
A low motif (3-5 notes or a single sustained tone with a sub-rhythm) that repeats every 6-12 seconds. The repetition is intentionally audible — viewers should consciously notice the loop without being able to name what they're noticing. The auditory companion to the visual feedback-loop register (CausalLoopDiagram's rotating R/B badge arc).

### Use for
- **CausalLoopDiagram** (the recurrence in the audio reinforces the recurrence in the diagram — security dilemma, arms race, sanctions spiral)
- **SpiralTimeline** when the editorial point is recurrence ("the same crisis every 50 years")
- **StreamGraph** when the data shows cyclical behaviour
- The "this is a feedback loop, not a sequence" moment in any chart that COULD be read either way

### Avoid for
- Linear processes (use Editorial print — Cyclical drone implies recurrence)
- Single-event stat reveals (use Editorial print)
- Argument primitives where the structure isn't cyclical (Syllogism, AxiomList — these don't loop)
- Documentary archival templates (use Archive room — Cyclical drone competes with the document-reading register)

### Real-world references
- Steve Reich's phase-music compositions (*Music for 18 Musicians*) — the structural reference for "audibly cyclical drone"
- Documentary scoring for ecological-collapse pieces — low cyclical drone as the audio for feedback systems
- *The Century of the Self* (Curtis 2002) — repetitive motif under the consumerism / advertising feedback-loop sequences

### Failure mode
Used on a non-cyclical segment, viewers feel a vague unease ("why does this music keep coming back?") without knowing why. The cyclical claim must match the visual structure.

---

## 06 · Silence

**Asset slot:** (none — explicit silence)

**Implicit claim:** "Stop. Pay attention. The visual is the entire signal."

### Character
No ambient bed. Music bed may also drop (per AUDIO_DESIGN.md). The room is gone. Used for moments where the editorial register requires the viewer to focus ENTIRELY on the visual or narration without any auditory companion.

### Use for
- **KineticTypography** quote cards (the words are the entire signal)
- **TitleTransition** section openers (the chapter title needs to land in cleared air)
- **StatReveal** for the 1-2 hero stats per episode where the number IS the moment (paired with `quote-bell` per AUDIO_DESIGN.md)
- The "thinking beat" between two arguments (paired with `hold(stillness)` per HOLD_MOTION_REGISTER.md)
- End-card moments before the closing stinger
- Any moment where the script explicitly says "PAUSE" or "BEAT"

### Avoid for
- Default state — silence as default makes the episode feel hollow / unfinished
- Routine transitions within a beat (use the appropriate ambient register)
- Background under continuous narration (the absence of ambient under voice reads as unfinished mix)

### Real-world references
- Adam Curtis' use of total silence at the moments of strongest editorial argument
- BBC *The Day Today* and other parodies — total silence as a deliberate dramatic device
- Documentary practice generally — the editorial weight of silence is well-established

### Failure mode
Overused, kills momentum. Reserve for the 3-5 most weighted moments per episode. If every transition is silent, the editorial argument that "this moment is different" stops landing.

---

## Decision matrix — visual register → soundscape register

The matrix below summarises the canonical pairing. Read left-to-right: given the visual register a segment is in, here's the soundscape register that pairs with it by default. Authors override per-segment when the editorial moment requires it.

| Visual register | Soundscape register | Rationale |
|---|---|---|
| Analytical (charts, diagrams, stat reveals) | **Editorial print** | Productive working-room register; doesn't compete with data |
| Documentary archival (letters, cables, sources) | **Archive room** | Evidentiary reading-room register; paper rustle is congruent |
| Atmospheric (cinematic maps, terrain, vintage atlases) | **Atmospheric outdoor** | Present-in-the-world register; wind matches the geography |
| Cinematic dark (escalation, decision trees in dark) | **Cinematic dark** | Weight register; the deep drone matches the visual register |
| Feedback / recurrence (causal loops, spiral timeline) | **Cyclical drone** | The loop-as-structure claim made audible |
| Title / quote / hero moments | **Silence** | The visual or narration is the entire signal; ambient would dilute |

This is the same matrix the resolver implements as `TEMPLATE_SOUNDSCAPE_DEFAULTS` in `src/design/soundscape.ts`. Per-template override happens at register-design time (TelegramCable defaults to Archive room because the template's whole point is primary-source diplomatic correspondence); per-segment override happens at script-author time via `[AMB: <register>]` script directive.

---

## Per-template defaults

See `remotion-templates/src/design/soundscape.ts` for the canonical registry. Summary by template family:

**Documentary archival** → Archive room
- HandwrittenLetter, TelegramCable, PrimarySourceReveal, NewspaperHeadlineRotator, AnnotatedImage (when image is archival)

**Cinematic / atmospheric** → Atmospheric outdoor
- CinematicMap, AtlasPlate (atmospheric variant), RouteAnimation (atmospheric variant), ChoroplethMap at continental scale

**Cinematic dark / weight** → Cinematic dark
- EscalationLadder, DecisionTree extensive (dark mode), DialecticFlow tension marker beat

**Feedback / recurrence** → Cyclical drone
- CausalLoopDiagram, SpiralTimeline

**Hero / title / quote** → Silence
- StatReveal (hero number reveal — pairs with `quote-bell` SFX), KineticTypography quote cards, TitleTransition section openers

**Default for everything else** → Editorial print
- All analytical chart templates, all argument primitives (default), ComparisonPair, MorphTransition, SmallMultiples, every diagram-family template not otherwise specified

---

## Script-side directive

Authors override the cascade with a single line in the two-column script (per SCRIPT_FORMAT.md):

```
[AMB: archive-room]
[AMB: editorial-print]
[AMB: atmospheric-outdoor]
[AMB: cinematic-dark]
[AMB: cyclical-drone]
[AMB: silence]
```

The directive lives in the right column (visual / direction column) and applies to the segment it's authored against. It's parsed by `tools/assembly/generate_manifest.py` into `segment.template.soundscape.ambient`.

The script-draft / visual-spec / audio-spec skills read this register doc and emit the appropriate `[AMB:]` directive when the editorial moment requires an override of the per-template default.

---

## Failure modes (cross-cutting)

- **Defaulting one register globally for every segment.** Makes the episode sound flat; the soundscape becomes wallpaper rather than register signal. The whole point of the register is per-segment variation.
- **Stacking incompatible ambients across a fast cut.** Going from Archive room (PrimarySourceReveal) directly to Atmospheric outdoor (CinematicMap) without a transition SFX bridge creates jarring sonic boundaries. Use `beat-transition` or `section-open` SFX from AUDIO_DESIGN.md to bridge.
- **Ambient louder than narration.** Soundscape ambient should sit -25 dB to -20 dB below narration. Louder = ambient becomes the foreground, defeating its purpose.
- **Music bed conflicting with cyclical drone register.** When the soundscape register is Cyclical drone, the music bed should THIN OUT (drop layers) rather than continue at full mix — the audible loop in the drone is the editorial signal; music competing dilutes it.
- **Silence used as default fallback when audio assets are missing.** If the asset isn't sourced yet, fall back to Editorial print (the channel default), not Silence. Silence is a deliberate editorial choice, not an absence-of-content.
- **Visual register mismatch.** Pairing Cinematic dark ambient with a light-mode visual reads as forced drama. The register must match the visual mode — dark visual + dark ambient, light visual + light ambient (Archive room, Editorial print, etc.).
