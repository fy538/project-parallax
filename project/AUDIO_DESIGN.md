# Parallax — Audio Design Guide

## What this document is

The editorial framework for sound in Parallax videos. The audio equivalent of VISUAL_LANGUAGE.md — not a technical spec for file formats, but the *why* behind audio decisions.

The core insight: viewers process audio subconsciously. Good sound design doesn't draw attention to itself — it makes the visuals feel more intentional, the narration more authoritative, and the transitions more cinematic. Bad sound design (including silence where sound should exist) creates a subtle "something is off" feeling that erodes trust and shortens watch time.

Created: May 2, 2026

**Related docs:**
- **VISUAL_LANGUAGE.md** — visual mode decisions that pair with audio choices
- **SCRIPT_FORMAT.md** — where audio cues are annotated in the two-column format
- **PRODUCTION_PIPELINE.md** — where audio-spec fits in the pipeline

---

## The Three Audio Layers

### Layer 1: Music Bed (continuous)

**What the viewer experiences:** Emotional temperature. Pacing backbone. The feeling that "this is a crafted piece, not a lecture." The music bed runs continuously under narration, shaping mood without competing for attention.

**Characteristics for Parallax:**
- **Genre:** Ambient + minimal piano with subtle electronic textures. Think Brian Eno meets Nils Frahm — evolving pads, sparse piano notes, occasional plucked strings or soft synth arpeggios.
- **Dynamics:** Extremely low volume under narration (music should disappear if you're not listening for it). Rises 3-6dB during visual-only moments (transitions, held shots, footage segments without narration).
- **Tempo:** 60-80 BPM for analytical sections. 80-100 BPM for narrative/story beats. Never above 110 BPM — this isn't an action channel.
- **Key:** Minor keys for tension and analysis (Am, Dm, Em). Major keys for resolution moments and cold opens. Avoid key changes mid-beat — they create unintended emotional shifts.
- **Instrumentation:** Piano (primary), ambient pads (foundation), light strings (emotional peaks), electronic textures (data/technology beats). No drums, no bass drops, no vocal chops.

**When the music shifts:**
- **Beat boundaries.** Each narrative beat (opening, act 1, act 2, etc.) should have a distinct music mood. The shift can be a new track section, a key change, or a texture swap.
- **Mode transitions.** When switching from footage-heavy to MG-heavy visual modes, the music can thin out (fewer layers) to compensate for increased visual information density.
- **Tension arcs.** Music builds subtly through a beat's argument and resolves when the conclusion lands. The build is textural (adding layers) not dynamic (getting louder).
- **Cold open exception.** The cold open may use a distinctive musical motif that returns at the episode's conclusion — a bookend that rewards viewers who watch to the end.

**What to avoid:**
- Recognizable melodies that compete with narration
- Sudden volume changes (all transitions should be 1-3 second fades)
- Music that sounds "epic" or "cinematic" in the trailer sense — it signals entertainment, not analysis
- Silence longer than 3 seconds (except for deliberate dramatic pauses marked in the script)

---

### Layer 2: Transition SFX (event-driven)

**What the viewer experiences:** Punctuation. The audio equivalent of a cut or dissolve — it tells the brain "something changed" and briefly elevates attention. Without transition SFX, visual transitions feel incomplete, like a sentence without punctuation.

**The SFX palette (8 cue types):**

| Cue Type | Sound Character | Duration | When to Use |
|---|---|---|---|
| `beat-transition` | Low whoosh + subtle tonal shift | 0.5-1.0s | Between major narrative beats. The most common SFX. |
| `stat-reveal` | Rising tone → soft "lock" click | 0.8-1.2s | When a StatReveal, DataChart, or ProbabilityGauge lands its key number. |
| `tension-rise` | Slowly ascending pad or string tremolo | 2-5s | Building toward a reveal or argument climax. Precedes the payoff. |
| `tension-resolve` | Descending tone + breath/release | 0.5-1.0s | After the reveal lands. Often pairs with the stat-reveal click. |
| `map-whoosh` | Spatial sweep with subtle doppler | 0.5-0.8s | When ChoroplethMap or RouteAnimation shifts geography or a route draws. |
| `quote-bell` | Single clean tone (piano or bell) | 0.3-0.5s | When a KineticTypography quote card appears. Marks "listen to this." |
| `section-open` | Soft atmospheric swell | 1.0-1.5s | At beat/section title cards (TitleTransition). Sets the new section's mood. |
| `end-stinger` | Resolving chord + fade to silence | 2-3s | Episode conclusion. Only used once. |

**Intensity levels:**
- **subtle** — Barely audible. The viewer doesn't consciously notice it but would notice its absence. For routine transitions within a beat.
- **normal** — Noticeable but not foregrounded. For beat boundaries and data reveals. The default.
- **dramatic** — Briefly takes precedence over music bed. For the 2-3 biggest moments per episode (the thesis reveal, the key stat, the closing argument).

**Matching SFX to visual transitions** (canonical types only — see `project/TRANSITION_GRAMMAR.md`):
- `cut` → No SFX, or a very subtle beat-transition at subtle intensity
- `fade` / `dissolve` → beat-transition at normal intensity
- `match-cut` / `match-cut-still` → silent (the visual continuity is the connection — SFX competes)
- `color-wash` → section-open (the color flood signals a new section)
- `iris` → stat-reveal (the circular reveal pairs with the "lock" click)
- ~~`wipe-left` / `wipe-right` / `blur-through`~~ → deprecated; treat as `dissolve` (beat-transition) if encountered in old manifests

**J/L-cut audio bridges (`narrationLeadIn` / `narrationLagOut` in assembly manifest):**
The manifest engine automatically sets `narrationLeadIn: 0.7` on every hard cut — the NLE editor should start the incoming narration 0.7s before the visual cut fires. Override with `DIR: jcut(N)` in the script (written to `segment.narrationLeadIn`). L-cuts are explicit only: `DIR: lcut(N)` → `segment.narrationLagOut`. Suppress the default J-cut when the preceding segment uses `DIR: hold(stillness)` (silence beats need abrupt entry) or when the cut is a `TitleTransition` chapter card.

---

### Layer 3: Texture Hits (micro-SFX)

**What the viewer experiences:** Polish. "This feels premium." Texture hits are so subtle that most viewers can't identify them consciously, but they create the production value gap between a good video essay and a top-tier one.

**The texture palette:**

| Texture | Sound Character | Duration | When to Use |
|---|---|---|---|
| `dot-click` | Soft mechanical click | 50-100ms | When timeline dots, data points, or list items appear |
| `card-settle` | Paper placement + micro-reverb | 100-200ms | When a KineticTypography card or SplitComposition panel lands in position |
| `line-draw` | Soft pencil/pen stroke | 200-500ms | When connection lines draw (DualTimeline, TimelineComparison) |
| `region-glow` | Low ambient tone swell | 300-600ms | When a map region highlights (ChoroplethMap country fill) |
| `bar-grow` | Ascending micro-tone | 200-400ms | When DataChart bars animate up or ProbabilityGauge arcs fill |
| `node-pop` | Soft "pop" or bubble | 100-150ms | When NetworkDiagram or StrategicLandscape bubbles appear |
| `page-turn` | Paper rustle | 200-300ms | When transitioning between light-mode compositions (reinforces the "field report" brand) |

**Rules:**
- Never more than 3 texture hits per 10-second window. Overcrowding creates noise.
- Texture hits should be 15-20dB below narration level. If you can identify the specific sound consciously, it's too loud.
- Not every visual event needs a texture hit. Prioritize the first instance of each type per beat (the first timeline dot gets a click, subsequent dots can be silent).
- Texture hits on staggered animations should also stagger — the sound follows the visual timing exactly.

---

## Audio-Visual Pairing Rules

### The Radio Edit Test (audio version)

Just as VISUAL_LANGUAGE.md defines a radio edit test (does the narration work without visuals?), there's an audio edit test: **Does the visual track feel complete with music bed only, no SFX?** If yes, SFX are polish. If no, the visual pacing has gaps that need structural fixing, not audio band-aids.

### Volume Hierarchy

At any given moment, the mix should follow this priority:

1. **Narration** — always dominant. -0dB reference level.
2. **Transition SFX** — brief moments where SFX can approach narration level, but only during natural pauses or beat boundaries. -6 to -12dB.
3. **Music bed** — constant presence, never competing. -18 to -24dB under narration. -12 to -15dB during visual-only moments.
4. **Texture hits** — atmospheric seasoning. -24 to -30dB.

### Silence as a Tool

Deliberate silence (music bed fades to nothing for 1-3 seconds) is a powerful device when used sparingly — once or twice per episode. Use it for:
- The moment before the thesis statement lands
- After a shocking statistic, before the analysis begins
- The final beat before the end-stinger

Script markers: `[Pause.]` or `[Beat.]` in the narration column signal potential silence moments.

### Mode-Specific Audio Behavior

| Visual Mode | Music Bed | SFX Density | Texture Hits |
|---|---|---|---|
| Footage only | Normal to slightly elevated volume | Minimal — let footage breathe | None (footage has its own ambient sound) |
| Motion graphic only | Normal volume | Moderate — transitions and data reveals | Active — dot clicks, bar grows, line draws |
| Footage + MG layered | Slightly reduced (competing with footage ambient) | Selective — one SFX per layered transition | Sparse — only on the MG element, not the footage |

---

## SFX Library Structure

```
remotion-templates/public/
├── audio/
│   ├── sfx/
│   │   ├── transitions/          # Layer 2 — event-driven (22 files)
│   │   │   ├── beat-transition-{subtle,normal,dramatic}.wav    0.5 / 0.7 / 1.0 s
│   │   │   ├── stat-reveal-{subtle,normal,dramatic}.wav        0.8 / 1.0 / 1.2 s
│   │   │   ├── tension-rise-{subtle,normal,dramatic}.wav       2.0 / 3.5 / 5.0 s
│   │   │   ├── tension-resolve-{subtle,normal,dramatic}.wav    0.5 / 0.7 / 1.0 s
│   │   │   ├── map-whoosh-{subtle,normal,dramatic}.wav         0.5 / 0.65 / 0.8 s
│   │   │   ├── quote-bell-{subtle,normal,dramatic}.wav         0.3 / 0.4 / 0.5 s
│   │   │   ├── section-open-{subtle,normal,dramatic}.wav       1.0 / 1.2 / 1.5 s
│   │   │   └── end-stinger.wav                                 2.5 s
│   │   └── textures/             # Layer 3 — micro-SFX (7 files)
│   │       ├── dot-click.wav       0.05 s
│   │       ├── card-settle.wav     0.15 s
│   │       ├── line-draw.wav       0.30 s
│   │       ├── region-glow.wav     0.50 s
│   │       ├── bar-grow.wav        0.30 s
│   │       ├── node-pop.wav        0.10 s
│   │       └── page-turn.wav       0.25 s
└── episodes/<slug>/audio/music/<slug>/
    └── bed-{contemplative,analytical,tension,resolution}-N.wav  # Layer 1
```

**File format:** WAV 48 kHz · 24-bit · stereo PCM (production master). Remotion's `<Audio>` component handles WAV directly. Music beds use the `loop` prop in `MusicBedLayer` so any track shorter than the bed section loops seamlessly; fade-in/fade-out envelopes fire at section boundaries regardless of loop position.

**SFX generator:** `python3 tools/generate_sfx.py` — regenerates all 29 Layer 2/3 files from Python synthesis. Flags: `--cue <name>` (one type only), `--dry-run` (print plan without writing). Run whenever you want to tweak a sound's character without touching source assets.

**Naming convention:** `{cue-type}-{intensity}.wav` for SFX, `bed-{mood}.wav` for music beds.

---

## Assembly Manifest Integration

The assembly manifest schema already includes a `soundCue` field per segment. The full 3-layer model extends this:

### Existing: Per-Segment Sound Cues (Layer 2)

Already defined in `assembly-manifest.schema.json`:
```json
"soundCue": {
  "type": "beat-transition",
  "offsetSec": 0,
  "intensity": "normal"
}
```

### New: Episode-Level Music Bed (Layer 1)

Add to the manifest root level:
```json
"musicBed": {
  "tracks": [
    {
      "id": "opening",
      "file": "audio/music/EP01/bed-opening.wav",
      "startSec": 0,
      "endSec": 45,
      "fadeInSec": 2,
      "fadeOutSec": 3,
      "volume": 0.15,
      "mood": "contemplative"
    },
    {
      "id": "analytical",
      "file": "audio/music/EP01/bed-analytical.wav",
      "startSec": 43,
      "endSec": 180,
      "fadeInSec": 3,
      "fadeOutSec": 2,
      "volume": 0.12,
      "mood": "analytical"
    }
  ]
}
```

Music tracks can overlap by their fade durations for crossfade transitions.

### New: Texture Hits (Layer 3)

Add optional `textureCues` array to segments:
```json
"textureCues": [
  {
    "type": "dot-click",
    "offsetSec": 0.5,
    "volume": 0.08
  },
  {
    "type": "bar-grow",
    "offsetSec": 1.2,
    "volume": 0.06
  }
]
```

---

## Sourcing Requirements

The pipeline is designed to be **source-agnostic** — any audio file that meets the format spec works. When sourcing:

**Music beds:**
- Must be instrumental only (no vocals, no recognizable samples)
- Must be available for YouTube monetization without Content ID claims
- License must cover commercial use on YouTube, Bilibili, and TikTok/Douyin
- Prefer tracks with stems available (piano stem, pad stem, etc.) for finer mix control

**SFX:**
- Must be royalty-free for unlimited commercial use
- Prefer "designed" sounds over raw recordings (designed = already processed with reverb, EQ, compression)
- Each cue type needs 1-3 variants to avoid repetition fatigue (e.g., 3 dot-click variants randomly cycled)

**Recommended sources (evaluate when ready to source):**
- Epidemic Sound or Artlist (subscription, YouTube-safe, stems available)
- Freesound.org (CC0/CC-BY SFX, high quality with curation effort)
- Splice (one-shots and SFX packs, per-download pricing)

---

## Pipeline Placement

```
... (existing pipeline) ...
Cowork (visual-spec)          7. Visual Spec → JSON
Cowork (audio-spec)              Audio Spec → Cue Sheet    ← NEW
Python CLI (source.py)           Asset Sourcing
...
HUMAN                         8. Narration Recording
NLE (DaVinci/Premiere)        9. Final Assembly
  ├── Lay narration on timeline
  ├── Place music bed tracks (from audio-spec cue sheet)
  ├── Add transition SFX at marked timecodes
  ├── Add texture hits at template event points
  └── Mix and level all 4 tracks (narration + 3 audio layers)
```

The audio-spec skill runs immediately after visual-spec. It reads the same production script but generates an audio cue sheet instead of visual JSON files. The cue sheet is a human-readable document consumed during NLE assembly — it tells the editor exactly which sounds to place where.

---

## Quality Checklist

Before publish, verify:
- [ ] Music bed has no gaps longer than 3 seconds (unless deliberate silence)
- [ ] Music bed volume never exceeds narration during spoken sections
- [ ] All beat boundaries have at least a subtle transition SFX
- [ ] No more than 2 dramatic-intensity SFX per 3-minute window
- [ ] Texture hits are inaudible on laptop speakers (they're for headphone listeners)
- [ ] End-stinger resolves cleanly to silence (no abrupt cutoff)
- [ ] Music beds crossfade at beat boundaries (no hard cuts between tracks)
- [ ] Total SFX count per episode: 15-25 transition SFX, 30-50 texture hits

---

## Template Event → Audio Cue Mapping

The audio-spec skill uses this table to decide which SFX and texture hits accompany each Remotion template. "Entrance" means the segment's first frame. "Key moment" means the animation event where the template's payload lands.

### Transition SFX (Layer 2) by Template

| Template | Entrance Cue | Key Moment Cue | Notes |
|---|---|---|---|
| **TitleTransition** | `section-open` (normal) | — | Episode-title variant gets `section-open` at dramatic. End-card variant gets `end-stinger`. |
| **KineticTypography** | `quote-bell` (normal) | — | Quote and definition variants only. Statistic variant uses `stat-reveal` instead. Bilingual variant uses `quote-bell` at subtle. |
| **DataChart** | — | `stat-reveal` (normal) | Fires when the hero bar finishes growing or highlightIndex bar completes. Comparison variant: fires when both bar groups finish. |
| **TimelineComparison** | `beat-transition` (normal) | — | Each phase transition within the timeline gets `beat-transition` at subtle. Connection lines drawing get no SFX (texture hit handles it). |
| **FrameworkDiagram** | `beat-transition` (normal) | — | Flow variant: `beat-transition` at subtle when arrows animate. Matrix variant: no additional SFX (cells cascade handles pacing). |
| **ChoroplethMap** | `map-whoosh` (normal) | — | Each phase transition gets `map-whoosh` at subtle. First phase entrance gets normal intensity. |
| **RouteAnimation** | `map-whoosh` (normal) | — | Each new route segment drawing gets `map-whoosh` at subtle. Camera transitions between phases get `map-whoosh` at normal. |
| **DecisionTree** | `beat-transition` (normal) | `stat-reveal` (normal) | stat-reveal fires when the highlighted path completes and probability labels appear. |
| **SplitComposition** | `beat-transition` (normal) | — | Divider animation gets no SFX. Each panel reveal uses texture hits. |
| **ProbabilityGauge** | — | `stat-reveal` (normal) | Gauge: fires when arc animation completes. Shift: fires when "after" bar finishes. Scorecard: fires on each outcome reveal. |
| **ImageComposite** | — | — | No transition SFX. Image segments use footage audio rules (let footage breathe). |
| **PhotoMontage** | — | — | No transition SFX. Each image-to-image transition within the montage is handled by texture hits. |
| **NetworkDiagram** | `beat-transition` (normal) | — | Node appearances are texture hits. Edge drawing gets no SFX. |
| **TimeSeriesChart** | — | `stat-reveal` (normal) | Fires when heroStat counter finishes. Annotation markers get `tension-resolve` at subtle. |
| **SankeyFlow** | `beat-transition` (normal) | `stat-reveal` (subtle) | stat-reveal fires when flow values finish animating. |
| **GameBoard** | `beat-transition` (normal) | — | Each phase transition within the game gets `beat-transition` at subtle. Piece/stone placement uses texture hits. |
| **BayesianUpdate** | — | `stat-reveal` (normal) | Fires when the posterior distribution settles. Each evidence item shifting the curve gets `tension-rise` → `tension-resolve` pair at subtle. |
| **StatReveal** | — | `stat-reveal` (dramatic) | The hero template for stat reveals. Fires when the main number finishes counting up. Comparison bars finishing get `stat-reveal` at subtle. |
| **RadarChart** | `beat-transition` (normal) | — | Polygon morph completion (if morphFrom exists) gets `tension-resolve` at subtle. |
| **AnnotatedImage** | — | — | No transition SFX. Callout appearances use texture hits. Image segments follow footage rules. |
| **EscalationLadder** | `tension-rise` (normal) | — | The entire ladder builds tension. Each rung appearance gets no SFX (texture hits). The `current: true` rung gets `tension-resolve` (normal). |
| **StrategicLandscape** | `beat-transition` (normal) | — | Actor bubble appearances use texture hits. Quadrant label reveals get no SFX. |
| **DuelingFrameworks** | `beat-transition` (normal) | `tension-resolve` (normal) | tension-resolve fires when the winning/dominant framework is revealed. |
| **DualTimeline** | `beat-transition` (normal) | — | Each intercut transition gets `beat-transition` at subtle. Convergence moment gets `tension-resolve` (normal). |

### Texture Hits (Layer 3) by Template

| Template | Event | Texture Cue | Notes |
|---|---|---|---|
| **DataChart** | Bar grows | `bar-grow` | One per bar, staggered to match animation timing. Hero bar only if ≤5 bars. |
| **DataChart** | Reference line appears | `line-draw` | Single hit. |
| **TimelineComparison** | Event dot appears | `dot-click` | First 3-4 dots per track. After that, skip to avoid overcrowding. |
| **TimelineComparison** | Connection line draws | `line-draw` | One per connection. |
| **FrameworkDiagram** | Column/cell appears | `card-settle` | Comparison: one per column. Matrix: first cell per row only. |
| **FrameworkDiagram** | Arrow draws (flow) | `line-draw` | One per arrow. |
| **ChoroplethMap** | Country fills | `region-glow` | First 2-3 countries per phase. After that, skip. |
| **RouteAnimation** | Route segment draws | `line-draw` | One per segment. |
| **DecisionTree** | Node appears | `node-pop` | One per node in reveal order. |
| **DecisionTree** | Branch line draws | `line-draw` | One per branch. |
| **SplitComposition** | Panel slides in | `card-settle` | One per panel (left, then right). |
| **ProbabilityGauge** | Arc fills | `bar-grow` | One per gauge arc. |
| **ProbabilityGauge** | Shift bar animates | `bar-grow` | One for "before," one for "after." |
| **NetworkDiagram** | Node appears | `node-pop` | Primary importance nodes only. Secondary/tertiary use no texture. |
| **NetworkDiagram** | Edge draws | `line-draw` | First 3-4 edges only. |
| **TimeSeriesChart** | Line draws | `line-draw` | One per line series (not per data point). |
| **TimeSeriesChart** | Annotation marker | `dot-click` | One per annotation. |
| **SankeyFlow** | Flow link draws | `line-draw` | One per link, staggered. |
| **SankeyFlow** | Node labels appear | `card-settle` | First column nodes only. |
| **GameBoard** | Piece/stone placed | `dot-click` | One per piece placement. |
| **BayesianUpdate** | Evidence item shifts curve | `bar-grow` | One per evidence item. |
| **BayesianUpdate** | Market price line appears | `line-draw` | Single hit. |
| **StatReveal** | Main number counting | — | No texture hit during count-up (the stat-reveal SFX covers it). |
| **StatReveal** | Comparison bar grows | `bar-grow` | One per comparison bar. |
| **RadarChart** | Polygon draws/morphs | `line-draw` | One per subject polygon. |
| **RadarChart** | Grid levels appear | — | No texture hit (too subtle, grid is backdrop). |
| **AnnotatedImage** | Callout appears | `card-settle` | One per callout, staggered. |
| **AnnotatedImage** | Callout line draws | `line-draw` | One per callout line. |
| **EscalationLadder** | Rung appears | `dot-click` | One per rung, matching the upward cascade. |
| **EscalationLadder** | Current rung pulses | `node-pop` | Single hit on pulse start. |
| **StrategicLandscape** | Actor bubble appears | `node-pop` | One per actor. |
| **PhotoMontage** | Image transition | `page-turn` | One per image-to-image transition. |
| **DuelingFrameworks** | Framework panel appears | `card-settle` | One per framework side. |
| **DualTimeline** | Event reveal | `dot-click` | Alternating left/right events. |

### Texture Hit Budget per Template

To enforce the "≤3 hits per 10-second window" rule, the audio-spec skill caps hits per template instance:

| Template Duration | Max Texture Hits | Priority Rule |
|---|---|---|
| 3-5 seconds | 3-4 hits | First instance of each type only |
| 6-10 seconds | 5-8 hits | Stagger across animation phases |
| 11-20 seconds | 8-12 hits | Prioritize P1 visual events, skip repetitive cascades |
| 20+ seconds | 12-15 hits | Hard cap — mark overflow events as "optional" in cue sheet |

### Transition Type → SFX Pairing (expanded)

The assembly manifest's `transition.in` and `transition.out` fields determine which transition SFX plays at segment boundaries:

| Transition | SFX | Intensity | Notes |
|---|---|---|---|
| `cut` | none or `beat-transition` | subtle | Cut is the default — only add SFX at beat boundaries |
| `fade` | `beat-transition` | normal | Chapter break / silence beat |
| `dissolve` | `beat-transition` | normal | Beat-boundary softener |
| `match-cut` / `match-cut-still` | none | — | Visual continuity is the connection — SFX competes |
| `color-wash` | `section-open` | normal | Color flood = new section; always has washColor token |
| `iris` | `stat-reveal` | normal | Circular reveal pairs with "lock" click; premium — ≤2 per episode |
| ~~`wipe-left`~~ | ~~`map-whoosh`~~ | — | **Deprecated** — use `dissolve` |
| ~~`wipe-right`~~ | ~~`map-whoosh`~~ | — | **Deprecated** — use `dissolve` |
| ~~`wipe-up`~~ | ~~`beat-transition`~~ | — | **Deprecated** — use `dissolve` |
| ~~`blur-through`~~ | ~~`tension-rise → tension-resolve`~~ | — | **Deprecated** — use `dissolve` |

### Music Bed Mood Mapping

The audio-spec skill assigns music bed mood based on narrative beat content:

| Beat Content | Music Mood | Tempo | Key |
|---|---|---|---|
| Cold open / hook | contemplative → building | 70-80 BPM | Major → minor |
| Historical context | analytical | 65-75 BPM | Minor (Am, Dm) |
| Data / statistics | analytical | 60-70 BPM | Minor (Em) |
| Tension / escalation | tension | 80-90 BPM | Minor (Dm, Gm) |
| Reveal / thesis | tension → resolution | 75-85 BPM | Minor → relative major |
| Philosophical framework | contemplative | 60-70 BPM | Minor (Am) |
| Cross-domain connection | analytical → contemplative | 70-80 BPM | Mode mixture |
| Conclusion / synthesis | resolution | 70-80 BPM | Major (C, F) |
| End card / CTA | resolution (fading) | 65-75 BPM | Major |
