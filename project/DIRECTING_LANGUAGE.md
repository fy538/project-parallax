# Parallax — Directing Language

## Purpose

The directing language is a concise markup for embedding camera direction, reveal choreography, timing anchors, and transition specs directly into the script's visual column. It bridges the gap between "what to show" (which the script already specifies) and "how to show it" (which is currently left to template defaults).

Created: May 3, 2026

**Related docs:**
- **SCRIPT_FORMAT.md** — The two-column format this extends (direction goes in the right column)
- **VISUAL_LANGUAGE.md** — Editorial logic for *when* to use each register and transition type
- **PACING_SYSTEM.md** — The companion pacing system (`PACE:` annotations, proportional camera paths, Whisper sync)
- **remotion-templates/references/template-schemas.md** — JSON field reference that direction maps to

---

## Why This Exists

Without directing language, the script says:
```
[MG:] ChoroplethMap · supply-chain-phases.json · 12s
```

And the template renders with its default camera: linear pan between phase centers, uniform timing, no emphasis. Every map looks the same regardless of what the narration is doing.

With directing language, the script says:
```
[MG:] ChoroplethMap · supply-chain-phases.json · 12s
DIR: cam(wide → tight:Taiwan, sync:"single point of failure")
DIR: reveal(sequential, per-phase:3s, settle)
DIR: hold(2s)
```

Now visual-spec generates JSON with `cameraPath`, `revealMode`, and `holdAfter` fields that the template reads — and the map's camera pushes in to Taiwan exactly as the narration hits its emotional peak.

---

## Formal Syntax

Every `DIR:` line follows this grammar:

```
directive  = "DIR:" SP type "(" params ")"
type       = "cam" | "reveal" | "hold" | "cut" | "mood"
params     = param ("," SP param)*
param      = keyword ":" value | bare_value
keyword    = [a-z][a-z_-]*
value      = quoted | number | array | bare_value
quoted     = '"' [^"]+ '"'
number     = [0-9.]+ ("s" | "ms" | "%")?
array      = "[" value ("," value)* "]"
bare_value = [a-zA-Z0-9._:-]+
```

**Parsing rules:**
- The first parameter is always positional (the primary mode/type/target)
- Arrow notation `A → B` is syntactic sugar for two positions (start → end)
- Subsequent parameters are keyword:value pairs or bare modifiers
- Bare modifiers (no colon) are matched against known values for that directive type
- Unknown parameters generate a warning and are ignored

**Disambiguation:** When a bare value could match multiple parameter slots, precedence is: mode/type → behavior → easing. Example: in `reveal(stagger:200ms, spring)`, "spring" matches easing because mode is already filled.

---

## The Five Directives

Every direction annotation starts with `DIR:` followed by one of five directive types. Multiple `DIR:` lines can stack on a single visual entry.

### 1. `cam()` — Camera Movement

Controls where the virtual camera points, how close it is, and how it moves.

**Syntax:**
```
DIR: cam(<start> → <end>, [modifiers])   # move from start to end
DIR: cam(<position>, [modifiers])          # hold at position (static framing)
```

**Parameters:**

| Parameter | Values | Notes |
|-----------|--------|-------|
| Position | `wide`, `tight:<element>`, `element:<id>`, `group:<name>`, `overview`, `[lng,lat]` | Where to point |
| Zoom | `zoom:1.0` (default), `zoom:1.3` (close), `zoom:1.6` (detail), `zoom:2.0` (extreme) | Always keyword form |
| Timing | `sync:"word"`, `at:3s`, `over:4s` | When/how long |
| Behavior | `track` (smooth glide), `snap` (instant cut) | Easing style |
| Shake | `shake:0.3` (subtle tension), `shake:0.7` (conflict) | Vibration overlay |

**Camera systems (visual-spec translates differently per template):**

| Camera system | Templates | JSON output | Position vocabulary |
|---------------|-----------|-------------|---------------------|
| **Geographic** (Mapbox viewport) | ChoroplethMap, RouteAnimation | Phase `center`/`scale` or `camera` object | `[lng,lat]`, country names, `wide` (world), `tight:<region>` |
| **Canvas** (useNarratedCamera) | NetworkDiagram, EscalationLadder, DataChart, GameBoard | `cameraPath[]` array | `element:<N>`, `group:<name>`, `overview` |
| **Scroll** (useTimelineCamera) | HorizontalTimeline | `scrollTo` offset | `element:<N>`, `start`, `end` |
| **Scene brief** (text direction) | [AI-GEN:] entries | Natural language in generation brief | `static`, `push-in`, `pull-back`, `pan-left`, `pan-right`, `orbit` |

The script writer uses the same `cam()` syntax regardless of system. Visual-spec determines which JSON shape to emit based on the template type.

**Override rules:** When `cam()` conflicts with a template's built-in camera data (e.g., ChoroplethMap's per-phase `center`/`scale`), `_direction.cameraPath` takes precedence. Visual-spec should omit per-phase camera fields from the content data when `cam()` is present, moving the camera logic entirely into `_direction`.

**Examples:**
```
DIR: cam(wide → tight:Taiwan, sync:"single point", track)
DIR: cam(overview → element:3, over:2s, track)
DIR: cam(tight:node-conflict, shake:0.4, over:5s)
DIR: cam([121.5, 25.0], zoom:1.4, at:3s)
DIR: cam(static)
DIR: cam(push-in, over:7s)
```

**How it generates JSON (canvas system):**
```json
{
  "_direction": {
    "cameraPath": [
      { "target": "overview", "zoom": 1.0, "duration": 4, "behavior": "track" },
      { "target": "element:5", "zoom": 1.4, "duration": 4, "behavior": "track", "syncWord": "single point" }
    ]
  }
}
```

**How it generates JSON (geographic system):**
```json
{
  "_direction": {
    "cameraPath": [
      { "center": [0, 20], "scale": 150, "duration": 4 },
      { "center": [121.5, 25.0], "scale": 400, "duration": 4, "syncWord": "single point" }
    ]
  }
}
```

**How it generates JSON (AI-GEN scene brief):**
```json
{
  "_direction": {
    "cameraNote": "Begin static establishing shot, then slow push-in over 7s"
  }
}
```

---

### 2. `reveal()` — Element Appearance Choreography

Controls how data elements appear on screen — all at once, staggered, counted up, or spotlighted.

**Syntax:**
```
DIR: reveal(<timing-mode>, [focus], [easing])
```

`reveal()` composes three independent layers. Each layer is optional, and only one value per layer is allowed:

| Layer | Purpose | Values | Default |
|-------|---------|--------|---------|
| **Timing** (required) | When elements appear | `instant`, `stagger:<ms>`, `sequential`, `count-up`, `draw` | `instant` |
| **Focus** (optional) | Which elements get emphasis | `spotlight:[indices]`, `hero:<index>`, `progressive` | all equal |
| **Easing** (optional) | How elements land | `settle`, `pulse`, `spring`, `glow` | linear fade |

**Composability rules:**
- One timing mode per `reveal()` — no combining `stagger` + `sequential`
- One focus mode per `reveal()` — no combining `hero` + `spotlight`
- One easing per `reveal()` — last one wins if multiple specified
- `progressive` (focus) combines naturally with `sequential` (timing): items appear one at a time and earlier ones dim as later ones arrive
- `hero:<index>` works with any timing mode: the hero element gets glow/scale treatment regardless of when it appears

**Additional timing modifiers:**
- `over:<duration>` — total animation duration
- `per-phase:<duration>` — duration per item/phase (for sequential/stagger)

**Examples:**
```
DIR: reveal(stagger:200ms, spring)
DIR: reveal(sequential, per-phase:3s, settle)
DIR: reveal(count-up, over:1.5s, pulse)
DIR: reveal(sequential, spotlight:[0,2,4], progressive)
DIR: reveal(draw, over:2s)
DIR: reveal(stagger:300ms, hero:0, pulse)
```

**Anticipatory entrance timing (automatic).** When `reveal()` is paired with `cam(sync:"word")` — or when the segment has `_direction.syncPoints[]` — TitleTransition, KineticTypography, StatReveal, BayesianUpdate, and TitleBlock all apply *anticipatory* entrance timing per D17 (May 11, 2026). The visual element starts settling ~5 frames (≈150ms) *before* the narration word lands, so the viewer reads the element as already-present-and-settled when the spoken word arrives. This is the Economist 150ms rule, baked into the templates via `useEntrance()` consuming the syncPoint at the hook layer. You don't have to opt in — every sync'd reveal gets it automatically. Practical implication: when you write `cam(sync:"single island")`, the visual is at full opacity ~150ms before "single" is spoken, not landing on the word. This produces the "settled-not-arriving" feel that separates editorial video from PowerPoint reveals. See `remotion-templates/src/utils/animation.ts` → `anticipatoryStartFrame()` and `remotion-templates/references/template-research/motion-design.md` § 3.

**How it generates JSON:**
```json
{
  "_direction": {
    "revealMode": "stagger",
    "staggerMs": 200,
    "revealEasing": "spring",
    "highlightIndex": 0
  }
}
```

With spotlight:
```json
{
  "_direction": {
    "revealMode": "sequential",
    "spotlightSequence": [
      { "barIndices": [0, 2, 4], "zoom": 1.3, "duration": 3, "dimAmount": 0.55 }
    ],
    "progressive": true
  }
}
```

**Mode → Template mapping:**

| Mode | Best for | Template support |
|------|----------|-----------------|
| `stagger:<ms>` | Bar charts, list items, framework nodes | DataChart, StatReveal, FrameworkDiagram |
| `sequential` | Map phases, timeline events, escalation steps | ChoroplethMap, HorizontalTimeline, EscalationLadder, BayesianUpdate |
| `count-up` | Statistics, percentages, monetary values | KineticTypography, StatReveal, DataChart |
| `draw` | Routes, flow paths, connections | RouteAnimation, SankeyFlow, NetworkDiagram |
| `spotlight` | Focusing on specific data points | DataChart, NetworkDiagram, RadarChart |
| `progressive` | Flow diagrams, step sequences | FrameworkDiagram flow, DecisionTree, SankeyFlow |

---

### 3. `hold()` — Timing Control

Controls how long a visual stays on screen beyond its narration match, where silence falls, and where the visual "breathes."

**Syntax:**
```
DIR: hold(<duration or preset>)
DIR: hold(until:"word")
DIR: hold(pre:<seconds>)
```

**Three distinct uses** (can combine `pre` with a duration/preset, but `until` stands alone):

| Form | Meaning | Maps to |
|------|---------|---------|
| `hold(2s)` | Extra 2s after narration ends | `holdAfter: 2.0` |
| `hold(breathe)` | 2s extra with gentle drift continuing | `holdAfter: 2.0, holdBehavior: "breathe"` |
| `hold(land)` | 1s static pause (drift stops) | `holdAfter: 1.0, holdBehavior: "land"` |
| `hold(linger)` | 3s with slow zoom creep | `holdAfter: 3.0, holdBehavior: "linger"` |
| `hold(until:"word")` | Don't advance to next segment until this word is spoken | `narrationGate: { word: "word" }` |
| `hold(pre:1s)` | Delay 1s before the reveal animation begins | `preDelay: 1.0` |

**Combining:** `hold(pre:1s, breathe)` means "wait 1s before animation starts, then after narration ends hold 2s with drift." This is two timing decisions at opposite ends — use it when you want a beat of anticipation before the visual appears AND a beat of absorption after.

**`hold(until:)` vs `cam(sync:)`:**
These serve different purposes:
- `cam(sync:"word")` = "trigger camera move at this word" (the visual is already on screen, and the camera starts moving when the word hits)
- `hold(until:"word")` = "don't advance to the NEXT composition until this word" (gate the assembly manifest's segment boundary)

**How it generates JSON:**
```json
{
  "_direction": {
    "holdAfter": 2.0,
    "holdBehavior": "breathe",
    "preDelay": 1.0,
    "narrationGate": { "word": "therefore" }
  }
}
```

**Why this matters:**
The assembly manifest currently uses `durationSec` per segment, which is calculated from narration word count. But the best visual moments *breathe* — they hold a beat after the narration so the viewer can absorb. Without `hold()`, every visual is exactly as long as the narration, creating a metronomic pace with no dramatic pauses.

---

### 4. `cut()` — Transition to Next Composition

Controls how one visual ends and the next begins. Overrides default `cut` transition.

**Syntax:**
```
DIR: cut(<type>, [origin], [color], [duration])
```

**Parameters:**

| Parameter | Values | Maps to |
|-----------|--------|---------|
| Type | `cut`, `fade`, `dissolve`, `wipe-left`, `wipe-right`, `wipe-up`, `blur-through`, `color-wash`, `iris`, `match-cut`, `whip-pan`, `spatial-zoom` | `transitionOut` in assembly manifest |
| Origin | `origin:center`, `origin:element-<id>`, `origin:[x,y]` | Iris/spatial-zoom origin point |
| Duration | `0.5s`, `0.8s`, etc. | Override default transition duration |
| Color | `ink`, `amber`, `rust` (for color-wash only) | `washColor` resolved from palette.json |

**`match-cut` note:** A match-cut requires visual continuity between this segment and the next. Visual-spec sets `transitionOut: "match-cut"` on this segment AND `transitionIn: "match-cut"` on the next segment. The FullEpisode composition uses synced zoom/position between both TransitionWrappers. The script writer is responsible for choosing compositions where visual rhyming is possible (e.g., a bar chart ending on a tall bar → next composition starting with a tall building).

**Examples:**
```
DIR: cut(iris, origin:element-3, 0.6s)
DIR: cut(color-wash, ink, 0.7s)
DIR: cut(blur-through, 0.8s)
DIR: cut(dissolve)
DIR: cut(match-cut)
```

**Register grammar integration:**
The register transition grammar from VISUAL_LANGUAGE.md specifies which transition type to use between registers. `cut()` lets the script override or refine this:

| Register transition | Default `cut()` | When to override |
|--------------------|--------------------|--------------|
| Analytical → Grounding | `color-wash` | Rarely — strong boundary needed |
| Grounding → Atmospheric | `blur-through` | Rarely — natural register shift |
| Atmospheric → Analytical | `iris` | Override `origin:` to point at the "answer" element |
| Same register | `cut` or `fade` | Use `match-cut` for visual rhyming, `dissolve` for soft time-skip |

**How it generates JSON:**
```json
{
  "_direction": {
    "transitionOut": "color-wash",
    "washColor": "#1C1814",
    "transitionDuration": 0.7
  }
}
```

---

### 5. `mood()` — Atmosphere and Ambience

Controls background atmosphere, drift intensity, and visual "temperature" of a composition. All parameters are static for the composition's duration (no intra-composition transitions — use separate compositions to change mood).

**Syntax:**
```
DIR: mood(<atmosphere>, [modifiers])
```

**Parameters:**

| Parameter | Values | Maps to | JSON field |
|-----------|--------|---------|------------|
| Atmosphere | `none`, `subtle`, `normal`, `dense` | `Background` component's density preset | `atmosphere` |
| Particles | `particles:<N>` (8–25 range) | Ambient particle count | `ambientParticles` |
| Drift | `drift:<preset>` — see preset table below | Camera motion register | `driftPreset` |
| Dim | `dim:<0-1>` | Global dimming of non-focus elements | `globalDim` |
| Tint | `tint:<palette-name or hex>` | Background color temperature | `backgroundTint` |

**Drift presets → useCompositionAnimation mapping (May 14, 2026 revision):**

The default register (when `drift:` is omitted) is `editorial` — barely-perceptible inward zoom, no pan, no rotation. Charts stay level; the channel reads as print-newsroom + film, not as handheld documentary camera. Eight presets cover the editorial range:

| Preset | Mode | maxScale | maxPanX | maxPanY | maxRotation | Editorial intent |
|--------|------|----------|---------|---------|-------------|------------------|
| `drift:none` | — | (noDrift) | 0 | 0 | 0 | Maps, interactive comps, showreel evaluation |
| `drift:editorial` *(default)* | linear | 1.02 | 0 | 0 | 0 | Charts, all dataviz — "the camera is watching" |
| `drift:slow` | linear | 1.03 | 8 | 4 | 0.15 | Pre-May-2026 episodes (back-compat) |
| `drift:normal` | linear | 1.06 | 18 | 8 | 0.3 | Pre-May-2026 episodes (back-compat) |
| `drift:documentary` | linear | 1.06 | 18 | 8 | 0.3 | Photo / archival segments — **NEVER charts** |
| `drift:breathing` | breathing | 1.008 | 0 | 0 | 0 | Long-held stats — "this number is alive" |
| `drift:settle` | settle | 1.025 | 0 | 0 | 0 | Title cards — "the camera lands" |
| `drift:sway` | sway | 1.0 | 6 | 4 | 0 | Photo plates — subtle handheld feel, no net drift |

**Hard rule:** charts use `drift:editorial` (default) or `drift:none`. The 0.3° rotation in `drift:documentary` tilts axis baselines visibly — reserved for photo-driven segments where axes don't exist.

**Naming note:** `drift:normal` and `drift:documentary` resolve to identical envelopes. The former is kept for backward-compat with episodes built before the May 2026 editorial revision; new work should reach for `drift:documentary` (when cinematic Ken Burns is the intent) or `drift:editorial` (the new safe default).

**Examples:**
```
DIR: mood(dense, particles:20, drift:editorial)   # default for charts
DIR: mood(subtle, dim:0.6)                        # editorial drift implied
DIR: mood(none, drift:none)                       # maps, interactive
DIR: mood(normal, tint:oxblood, drift:documentary) # archival photo segment
DIR: mood(subtle, drift:breathing)                # held stat reveal
DIR: mood(subtle, drift:settle)                   # title card / section divider
```

**Editorial logic:**
- Tension building → increase mood density across sequential compositions: `subtle` → `normal` → `dense`
- Analytical clarity → `mood(none, drift:none)` — pure clean data, no distraction
- Emotional weight → `mood(dense, dim:0.5)` — isolated focus on key element
- Breathing room → `mood(subtle, drift:slow)` — relaxed ambient texture

**How it generates JSON:**
```json
{
  "_direction": {
    "atmosphere": "dense",
    "ambientParticles": 20,
    "driftPreset": "slow",
    "globalDim": 0.0,
    "backgroundTint": null
  }
}
```

---

## How Direction Appears in the Script

Direction annotations go in the right column, immediately below the visual spec line:

```markdown
| NARRATION | VISUAL PRODUCTION |
|-----------|-------------------|
| The entire world's advanced chips | **P1** · [MG:] ChoroplethMap · supply-chain.json · 12s |
| come from a single island.        | DIR: cam(wide → tight:Taiwan, sync:"single island", track) |
| *[Beat.]*                          | DIR: reveal(sequential, per-phase:3s, settle) |
|                                    | DIR: hold(breathe) |
|                                    | DIR: mood(subtle) |
|                                    | DIR: cut(color-wash, ink) |
| Inside the cleanroom, everything  | **P1** · [AI-GEN:] fab-walkthrough · 7s |
| runs on precision.                 | DIR: cam(push-in, over:7s) |
|                                    | DIR: mood(dense, particles:15) |
|                                    | DIR: cut(blur-through) |
| That's what makes this a trap —   | **P2** · [ILLUST:] metaphor · "dependency as tightening vise" · 6s |
| you can't escape what you built.   | DIR: mood(dense, dim:0.4) |
|                                    | DIR: hold(2s) |
|                                    | DIR: cut(iris, origin:center) |
| TSMC's yield hit ninety-two       | **P1** · [MG:] DataChart · yield-comparison.json · 8s |
| percent.                           | DIR: reveal(stagger:300ms, hero:0, pulse) |
|                                    | DIR: cam(overview → element:0, sync:"ninety-two") |
|                                    | DIR: hold(land) |
```

**Density in this example:** 4 compositions × 3-4 DIR lines each = ~14 directive annotations. This represents a high-intensity stretch (the cold open or a P1 sequence). Most mid-episode compositions would have 0-2 DIR lines.

---

## Directing Vocabulary Quick Reference

### Camera (`cam`)
```
cam(wide → tight:<element>)           Pan + zoom to specific element
cam(overview)                          Full view, no focus
cam(overview → element:<N>)            Pull focus from wide to specific
cam(element:<N>)                       Static frame on element N
cam(group:<name>)                      Focus on element group
cam([lng,lat], zoom:<N>)               Geographic position (maps only)
cam(static)                            No camera movement (explicit)
cam(push-in|pull-back|orbit)           Scene direction (AI-GEN only)
cam(pan-left|pan-right)                Scene direction (AI-GEN only)
cam(..., sync:"word")                  Trigger move at narration word
cam(..., over:<duration>)              Duration of the move
cam(..., track|snap)                   Smooth glide vs. instant cut
cam(..., shake:<0-1>)                  Tension vibration
```

### Reveal (`reveal`)
```
# Timing modes (pick one):
reveal(instant)                        Everything at once
reveal(stagger:<ms>)                   Sequential with delay between
reveal(sequential, per-phase:<s>)      One phase at a time
reveal(count-up, over:<s>)             Numeric animation
reveal(draw, over:<s>)                 Path/route drawing

# Focus modes (pick one, optional):
reveal(..., spotlight:[indices])       Highlight specific items
reveal(..., progressive)               Dim earlier as later appears
reveal(..., hero:<index>)              One element gets glow treatment

# Easing (pick one, optional):
reveal(..., spring)                    Springy overshoot
reveal(..., settle)                    Overshoot then settle
reveal(..., pulse)                     Micro-pulse on land
reveal(..., glow)                      Soft luminance bloom
```

### Hold (`hold`)
```
hold(<seconds>)                        Extra time after narration
hold(breathe)                          2s with gentle drift
hold(land)                             1s static pause
hold(linger)                           3s with slow zoom
hold(pre:<seconds>)                    Delay before animation starts
hold(until:"word")                     Gate: don't advance until word
```

### Cut (`cut`)
```
cut(cut|fade|dissolve)                 Basic transitions
cut(iris, origin:<element|center>)     Circular reveal
cut(color-wash, <ink|amber|rust>)      Color flood between registers
cut(blur-through)                      Blur dissolve
cut(match-cut)                         Visual rhyme (needs visual continuity)
cut(whip-pan)                          Fast directional sweep
cut(spatial-zoom)                      Deep zoom into detail
cut(..., <duration>)                   Override default timing
```

### Mood (`mood`)
```
mood(none|subtle|normal|dense)         Background atmosphere level
mood(particles:<N>)                    Ambient particle count (8-25)
mood(drift:none|slow|normal)           Ken Burns intensity
mood(dim:<0-1>)                        Global non-focus dimming
mood(tint:<palette-name|hex>)          Background color cast
```

---

## How visual-spec Processes Direction

When the `visual-spec` skill encounters `DIR:` annotations:

1. **Parse** — Extract directive type and parameters from each `DIR:` line using the formal grammar
2. **Identify camera system** — Determine which JSON shape to emit based on template type (geographic / canvas / scroll / scene-brief)
3. **Validate** — Check that the template supports the requested direction. Unsupported directives emit a `// WARN: cam() not supported on KineticTypography, ignored` comment in the JSON and are omitted from `_direction`
4. **Resolve conflicts** — If `cam()` is present, remove per-phase camera fields from content data (override rule). If `reveal()` is present and conflicts with template's default `revealMode`, `_direction` wins
5. **Translate** — Convert directing shorthand to JSON fields:
   - `cam()` → `cameraPath[]` (canvas), phase `center`/`scale` (geographic), `cameraNote` (AI-GEN)
   - `reveal()` → `revealMode`, `staggerMs`, `spotlightSequence`, `highlightIndex`, `progressive`, `revealEasing`
   - `hold()` → `holdAfter`, `holdBehavior`, `preDelay`, `narrationGate`
   - `cut()` → `transitionOut`, `washColor`, `transitionDuration` (also propagates to assembly manifest)
   - `mood()` → `atmosphere`, `ambientParticles`, `driftPreset`, `globalDim`, `backgroundTint`
6. **Merge** — Place all direction fields in the `_direction` namespace within the data JSON file
7. **Fallback** — If no direction is specified, no `_direction` block is emitted. Templates use their built-in defaults (current behavior, fully backward compatible)

**Example output JSON:**
```json
{
  "episode": "silicon-trap",
  "title": "Supply Chain Concentration",
  "template": "ChoroplethMap",
  "phases": [
    { "title": "Phase 1", "countries": [...], "durationSec": 4 },
    { "title": "Phase 2", "countries": [...], "durationSec": 4 }
  ],

  "_direction": {
    "cameraPath": [
      { "center": [0, 20], "scale": 150, "duration": 4 },
      { "center": [121.5, 25.0], "scale": 400, "duration": 4, "syncWord": "single island" }
    ],
    "revealMode": "sequential",
    "phaseStagger": 3.0,
    "revealEasing": "settle",
    "holdAfter": 2.0,
    "holdBehavior": "breathe",
    "atmosphere": "subtle",
    "transitionOut": "color-wash",
    "washColor": "#1C1814"
  }
}
```

The `_direction` block is a namespace within the data file. Templates read from it alongside their main data fields. This keeps direction separate from content data while living in the same file.

---

## Template Support Matrix

Not every directive works on every template. The visual-spec skill should warn if a directive targets an unsupported template.

### MG Templates (Register 1: Analytical)

| Template | cam() | reveal() | hold() | cut() | mood() |
|----------|-------|----------|--------|-------|--------|
| ChoroplethMap | ✅ geographic | ✅ sequential | ✅ | ✅ | ✅ |
| RouteAnimation | ✅ geographic | ✅ draw | ✅ | ✅ | ✅ |
| DataChart | ✅ canvas (spotlight) | ✅ stagger, hero, count-up | ✅ | ✅ | ✅ |
| NetworkDiagram | ✅ canvas (full) | ✅ progressive, spotlight | ✅ | ✅ | ✅ |
| FrameworkDiagram | ✅ canvas (flow variant only) | ✅ stagger, progressive | ✅ | ✅ | ✅ |
| EscalationLadder | ✅ canvas (vertical climb) | ✅ sequential | ✅ | ✅ | ✅ |
| HorizontalTimeline | ✅ scroll | ✅ sequential | ✅ | ✅ | ✅ |
| SankeyFlow | partial (zoom only) | ✅ draw, progressive | ✅ | ✅ | ✅ |
| GameBoard | ✅ canvas (zoom to cells) | ✅ sequential (moves) | ✅ | ✅ | ✅ |
| BayesianUpdate | ❌ | ✅ sequential (evidence) | ✅ | ✅ | ✅ |
| RadarChart | partial (zoom) | ✅ morph | ✅ | ✅ | ✅ |
| DecisionTree | ✅ canvas (tree camera) | ✅ progressive | ✅ | ✅ | ✅ |
| TimeSeriesChart | partial (zoom) | ✅ draw | ✅ | ✅ | ✅ |
| DualTimeline | ❌ | ✅ sequential | ✅ | ✅ | ✅ |
| DuelingFrameworks | ❌ | ✅ stagger | ✅ | ✅ | ✅ |
| SplitComposition | ❌ | ✅ stagger | ✅ | ✅ | ✅ |

### Typography/Display Templates

| Template | cam() | reveal() | hold() | cut() | mood() |
|----------|-------|----------|--------|-------|--------|
| KineticTypography | ❌ | ✅ count-up | ✅ | ✅ | ✅ |
| StatReveal | ❌ | ✅ stagger, count-up | ✅ | ✅ | ✅ |
| TitleTransition | ❌ | ❌ | ✅ | ✅ | partial (tint only) |

### Image/Composite Templates

| Template | cam() | reveal() | hold() | cut() | mood() |
|----------|-------|----------|--------|-------|--------|
| AnnotatedImage | partial (zoom to annotations) | ✅ sequential | ✅ | ✅ | ✅ |
| PhotoMontage | ❌ | ✅ sequential | ✅ | ✅ | ✅ |
| ImageComposite | ❌ | ❌ | ✅ | ✅ | ✅ |
| ProbabilityGauge | ❌ | ✅ count-up | ✅ | ✅ | ✅ |
| BifurcationRoute | ❌ | ✅ sequential | ✅ | ✅ | ✅ |

### Non-MG Visual Modes

| Visual mode | cam() | reveal() | hold() | cut() | mood() |
|-------------|-------|----------|--------|-------|--------|
| [FOOTAGE:] | ❌ (camera is baked into footage) | ❌ | ✅ | ✅ | ✅ (tint, dim) |
| [ILLUST:] | ❌ (static image) | ❌ | ✅ | ✅ | ✅ (atmosphere, dim) |
| [AI-GEN:] | ✅ scene brief | ❌ | ✅ | ✅ | ✅ (tint → treatment selection) |
| [LAYERED:] | ❌ | ❌ | ✅ | ✅ | ✅ |

---

## Directing Density Guidelines

Not every visual needs direction. Default behavior is fine for ~60% of compositions. Direct the moments that matter:

**Always direct:**
- P1 hero visuals (these are the moments the viewer remembers)
- Emotional peaks (where narration hits maximum tension/surprise)
- Register transitions (the `cut()` between registers defines flow)
- Data reveals that sync to specific words ("ninety-two percent" → bar lands)

**Usually direct:**
- P2 supporting visuals that carry analytical weight
- Moments where visual-first or counterpoint timing is needed (see VIS-06)

**Rarely need direction:**
- P3 ambient texture (footage wallpaper, breathing room)
- Title cards and section breaks
- Simple definition/quote cards (KineticTypography with defaults)

**Target density:** For a typical 12-14 minute episode with ~50 visual segments:
- ~8-12 segments get `DIR:` annotations (the P1/P2 moments)
- Those segments average 2-3 `DIR:` lines each
- Total: ~20-35 individual `DIR:` lines per episode
- This means roughly 75% of segments use template defaults

If you're writing more than 4 `DIR:` lines on a single composition, you're probably over-directing. Simplify or accept that some nuance will be handled by template defaults.

---

## Narration Sync Points

The most powerful feature of directing language is **syncing visual events to narration words.** This is what makes the difference between "illustration of what I'm saying" and "the visual IS the storytelling."

**How sync works:**

1. Script specifies: `DIR: cam(wide → tight:Taiwan, sync:"single island")`
2. Visual-spec generates: `{ "syncWord": "single island", ... }` in the `_direction` block
3. After narration is recorded, the assembly manifest generator (Whisper mode) finds the timestamp of "single island" in the audio
4. The composition's animation is anchored to that timestamp

**Sync word resolution:** Whisper produces word-level timestamps. For multi-word sync phrases like `sync:"single island"`:
- The sync point anchors to the **start** of the first word in the phrase ("single")
- Whisper finds the first occurrence of the phrase within the segment's narration text
- If the exact phrase isn't found (narration deviated from script), falls back to the nearest matching word

**Before narration recording:** Sync points work in "estimate mode" — the assembly manifest estimates word timing at 150 WPM. The sync word's position in the sentence determines its estimated timestamp. After recording, Whisper timestamps replace estimates.

**Sync-worthy moments (direct these):**
- Numbers landing as bars grow: `sync:"ninety-two"` + `reveal(hero:0, pulse)`
- Geographic focus on place name: `sync:"Taiwan"` + `cam(tight:Taiwan)`
- Conceptual shift word: `hold(until:"but")` to gate the next composition
- Dramatic pause: `hold(until:"therefore")` to let previous visual breathe

---

## Error Handling

When visual-spec encounters problems in `DIR:` annotations:

| Situation | Behavior |
|-----------|----------|
| `cam()` on unsupported template | Emit JSON comment: `// DIR-WARN: cam() not supported on [template], ignored`. Omit from `_direction`. |
| Unknown parameter value | Emit JSON comment: `// DIR-WARN: unknown behavior "drift", using "track"`. Use closest valid value. |
| Conflicting parameters | Last parameter wins. Emit warning if ambiguous. |
| `reveal()` mode not supported by template | Emit warning. Fall back to closest supported mode (e.g., `draw` on StatReveal → `stagger`). |
| `sync:"word"` but word not in narration text | Emit warning: `// DIR-WARN: sync word "phrase" not found in segment narration`. Leave sync in place for Whisper to attempt matching post-recording. |
| Template data conflicts with `_direction` | `_direction` takes precedence. Remove conflicting fields from content data. |

---

## Implementation Phases

### Phase 1 (Now): Document the vocabulary
This document exists. The vocabulary is defined and the mapping to existing parameters is clear.

### Phase 2: visual-spec reads direction
Update visual-spec skill to parse `DIR:` lines and emit `_direction` blocks in JSON data files. Key changes:
- Camera system detection (geographic vs. canvas vs. scroll vs. scene-brief)
- Conflict resolution (direction overrides content camera fields)
- Warning generation for unsupported directives
- Sync word extraction and placement

### Phase 3: Templates read `_direction`
Add a shared hook (`useDirection`) that reads the `_direction` block from data JSON and applies it. Implementation:
- `useDirection` wraps existing hooks: if `_direction.cameraPath` exists, pass it to `useNarratedCamera`; if `_direction.driftPreset` exists, map to `useCompositionAnimation` options
- Templates check for `_direction` before using their built-in defaults
- Fully backward compatible — no `_direction` block = current behavior unchanged

### Phase 4: Assembly manifest integration
`hold()` and `cut()` directives feed into the assembly manifest:
- `generate_manifest.py` reads `_direction.holdAfter` and adds to segment `durationSec`
- `_direction.preDelay` becomes a pause before the segment's visual animation begins
- `_direction.transitionOut` and `_direction.transitionDuration` populate the segment's `transition` field
- `_direction.narrationGate` creates timing anchors that Whisper mode resolves to frame-accurate boundaries

### Phase 4b: Audio-spec integration
`audio-spec` reads `DIR:` annotations from the script to make direction-aware SFX and music decisions:
- `cut(type)` → determines transition SFX type (e.g., `cut(iris)` → section-open SFX, `cut(color-wash)` → register shift SFX)
- `hold(preset)` → silence moments in the cue sheet (breathe = 2s gap, land = 1s, linger = 3s)
- `mood(tone)` → music bed shift cues (e.g., `mood(tension)` triggers crossfade to tension bed)
- `reveal(sync:"word")` → SFX timestamp placement anchored to narration words

Note: The audio cue sheet is a separate output from the assembly manifest. The manifest carries timing (holdAfter, preDelay, transitions); the cue sheet carries SFX/music assignments. The NLE editor uses both together.

### Phase 5: script-draft skill writes direction
Once the vocabulary is proven through manual use, update the script-draft skill to write `DIR:` annotations as part of its visual column output. This closes the loop: the script is the single source of truth for both content and direction.

---

## Principles

1. **Direction is optional.** Every template renders with sensible defaults if no `DIR:` is present. Direction enhances; it doesn't enable.

2. **Narration drives timing.** Camera moves, reveals, and holds are all relative to the narration timeline. The visual serves the story, not the other way around.

3. **Less is more.** Well-placed direction on 25% of compositions beats micro-managing every frame. Direct the peaks, let the valleys handle themselves.

4. **The script is the single source.** After Phase 5, there should be no directing decisions made *outside* the script. If it's not in the script, it doesn't happen. This makes revision clean — change the script, the direction changes with it.

5. **Human narration is the clock.** All timing is approximate until recording. The system is designed to snap to real audio timing via Whisper timestamps. Write direction for editorial intent, not frame accuracy.

6. **Rhythm over clock.** Camera path durations are proportional fractions (0.4 = 40% of segment time), not absolute seconds. The script author thinks in rhythm — "spend 40% on the overview, 35% zooming in, 25% on the detail" — and the actual seconds resolve at render time. See PACING_SYSTEM.md.

7. **One camera system, one syntax.** The script writer doesn't need to know whether `cam()` becomes a Mapbox viewport state or a useNarratedCamera path. Visual-spec handles the translation based on template type.

8. **Warn, don't break.** Invalid or unsupported directives produce warnings but never prevent JSON generation. The video can always render — direction just degrades gracefully to defaults.
