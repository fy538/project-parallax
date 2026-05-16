---
name: audio-spec
description: >
  Generate an audio cue sheet from a production script. This skill reads a two-column script and
  produces a complete audio specification — music bed mood assignments per beat, transition SFX
  placement at segment boundaries, and texture hit timing for template animation events. The output
  is a human-readable cue sheet for the NLE editor plus JSON extensions for the assembly manifest.
  Use this skill whenever someone says 'audio spec', 'generate audio cues', 'sound design pass',
  'what sounds does this need', 'cue sheet', 'audio layer', or any request to add sound design to
  an episode. Also trigger after visual-spec completes and the next pipeline step is audio planning,
  or when someone asks 'what's the audio plan for this episode'.
---

# Audio Spec Generator

You are generating the audio design layer for a bilingual geopolitics video channel. Your job is to read a production script (and optionally its assembly manifest) and produce a complete audio cue sheet that tells the NLE editor exactly which sounds to place where.

## Context

**Read `project/AUDIO_DESIGN.md` before starting.** It defines the 3-layer audio model, the SFX palette, volume hierarchy, and all template-to-cue mappings. That document is the authoritative reference — this skill applies its rules to a specific script.

**Read `project/DIRECTING_LANGUAGE.md` for direction-to-audio integration.** The script's `DIR:` annotations are the single source of truth for timing, transitions, and mood. Three directives directly inform audio cues:
- **`cut()`** → determines which transition SFX to use at segment boundaries. `cut(color-wash)` → `register-shift` SFX. `cut(iris)` → `section-open` SFX. `cut(blur-through)` → `beat-transition` SFX with atmospheric flavor.
- **`hold()`** → creates audio silence/breathing opportunities. `hold(breathe)` → music bed thins to 50% volume during the hold. `hold(land)` → all audio pauses for 1s (deliberate silence candidate). `hold(linger)` → music bed continues at low volume.
- **`mood()`** → maps directly to music bed mood and volume. `mood(dense)` → increase music intensity, add low-frequency texture. `mood(none)` → thin the bed, emphasize clarity. `mood(dim:0.5)` → reduce texture hits to minimum. A `mood()` change mid-beat may warrant a music bed crossfade within the beat.
- **`type()` and `_direction.textAnimation`** → text-animation register dictates a default SFX/texture cue. See **`project/TEXT_ANIMATION_REGISTER.md`** for the technique catalog. The default mapping (apply unless the script overrides with an explicit cue) is:

  | textAnimation technique | Default cue | When it fires |
  |---|---|---|
  | `typewriter` | `quote-bell` (Layer 2 SFX) | At cursor start (segment entrance) |
  | `quote-attribution` | `quote-bell` (Layer 2) | At cursor start |
  | `number-ticker` | `stat-reveal` (Layer 2) | At ticker settle (end of count-up) |
  | `stat-caption` | `stat-reveal` (Layer 2) | At ticker settle |
  | `definition-reveal` | `card-settle` (Layer 3 texture) | At term arrival (frame 0 of reveal) |
  | `backspace` | `card-settle` (Layer 3) | At the moment the correction completes (NOT during backspace — at settle) |
  | `reveal-mask` | `section-open` (Layer 2) | At wipe start |
  | `scramble` | `tension-resolve` (Layer 2) | At all-positions-resolved (end of scramble) |
  | `tracking-in` | None (let typography land in silence) | — |
  | `underline-draw` | None (already an emphasis marker — adding cue would double-up) | — |
  | `word-cascade` | None (the channel's default; cue adds nothing) | — |

  When a segment's data file declares `_direction.textAnimation: "typewriter"`, automatically emit `quote-bell` as the Layer 2 cue at that segment's entrance unless the script's `DIR: cut(...)` already specifies a different SFX. Script-level direction wins; defaults fill in where the script is silent.

Also read `episodes/EDITORIAL_PLAYBOOK.md` for any audio-related production rules that have been validated by analytics.

## The Three Audio Layers

1. **Music Bed (Layer 1)** — continuous ambient music under narration. Shifts mood at beat boundaries.
2. **Transition SFX (Layer 2)** — punctuation at segment boundaries and key moments. 8 cue types, 3 intensity levels.
3. **Texture Hits (Layer 3)** — micro-SFX tied to template animation events. 7 cue types, nearly inaudible.

## Inputs

1. **Production script** (required) — the two-column script with `[FOOTAGE:]`, `[MG:]`, `[LAYERED:]`, `[AI-GEN:]`, `[ILLUST:]` visual mode tags and `DIR:` annotations
2. **Assembly manifest** (optional) — if `assembly-manifest.json` exists for this episode, use it for precise segment timing. If not, estimate from script structure.
3. **Visual-spec data files** (optional) — if JSON data files exist in `remotion-templates/data/episodes/<slug>/`, read them to identify specific template animation events (e.g., how many bars in a DataChart, how many phases in a ChoroplethMap). If they contain `_direction` blocks, use those for precise timing of reveals, holds, and transitions.

## Step 1 — Beat Structure Analysis

Read the full script. Identify:

- **Beat boundaries** — where the script transitions between major narrative sections
- **Emotional arc** — the tension curve across beats (calm → building → climax → resolution)
- **Visual mode distribution** — which beats are footage-heavy vs. MG-heavy (affects SFX density)
- **Deliberate pauses** — `[Beat.]` or `[Pause.]` markers AND `DIR: hold(land)` or `DIR: hold(breathe)` that signal potential silence moments
- **Quote cards** — attributed quotes that will become KineticTypography (trigger `quote-bell`)
- **Data reveals** — statistics and numbers that will land as DataChart/StatReveal (trigger `stat-reveal`). Look for `DIR: reveal(count-up, sync:"...")` — the sync word tells you exactly when the stat lands.
- **Geographic shifts** — map transitions (trigger `map-whoosh`). Look for `DIR: cam(wide → tight:...)` — the camera move is the audio trigger.
- **Register transitions** — `DIR: cut()` annotations that specify transition type. These are the most reliable audio cue triggers: `cut(color-wash)` = register shift (dramatic audio moment), `cut(iris)` = focal reveal, `cut(blur-through)` = atmospheric softening.
- **Mood shifts** — `DIR: mood()` changes within or between beats. A shift from `mood(subtle)` to `mood(dense)` signals the music bed should intensify.
- **The thesis moment** — the single most important argument beat (candidate for dramatic intensity + deliberate silence before it). Often marked with `DIR: hold(land)` or a `DIR: mood(dense, dim:0.5)`.
- **`PACE:` annotations** — visual density markers that also inform audio decisions. `PACE: urgent` sections pair with faster music tempo and denser SFX; `PACE: breathing` sections pair with sustained pads, reduced SFX, and silence moments. Note PACE changes in the beat map — they signal structural tempo shifts that the music bed should reinforce.

Output a beat map:

```
| Beat | Time Est. | Emotional Temp | Visual Mode | DIR: Mood | Music Mood | Key Audio Moments |
|------|-----------|----------------|-------------|-----------|------------|-------------------|
| Opening | 0:00-0:45 | Hook → curiosity | FOOTAGE heavy | subtle→normal | contemplative → building | section-open (dramatic) at episode title |
| Beat 1 | 0:45-3:00 | Analytical | Mixed | normal | analytical | stat-reveal at 92% yield (sync:"ninety-two"), map-whoosh at coalition map (cam: wide→tight), cut(color-wash) at register shift |
| ... | ... | ... | ... | ... | ... | ... |
```

**Direction-informed audio planning:** The `DIR: Mood` column tracks `mood()` directives across the beat. When mood shifts within a beat (e.g., `subtle` in the first segment → `dense` at the climax), the music bed may need a within-beat crossfade. Also note `hold()` directives — each `hold(land)` is a silence candidate, and each `hold(breathe)` means the music bed should thin during the hold period.

## Step 2 — Music Bed Plan

Assign a music bed mood to each beat based on the emotional arc. Follow AUDIO_DESIGN.md's mood mapping:

| Beat Content | Music Mood | Tempo Range | Key |
|---|---|---|---|
| Cold open / hook | contemplative → building | 70-80 BPM | Major → minor |
| Historical context | analytical | 65-75 BPM | Minor (Am, Dm) |
| Data / statistics | analytical | 60-70 BPM | Minor (Em) |
| Tension / escalation | tension | 80-90 BPM | Minor (Dm, Gm) |
| Reveal / thesis | tension → resolution | 75-85 BPM | Minor → relative major |
| Philosophical framework | contemplative | 60-70 BPM | Minor (Am) |
| Conclusion / synthesis | resolution | 70-80 BPM | Major (C, F) |

**Rules:**
- Adjacent beats with the same mood can share a track (crossfade at boundary)
- Adjacent beats with different moods need separate tracks with 2-3s crossfade overlap
- The cold open may use a distinctive motif that returns at the episode conclusion (bookend)
- Music thins (fewer layers) when switching from footage-heavy to MG-heavy sections

Output the music bed track list:

```
| Track ID | Mood | Start | End | Fade In | Fade Out | Volume | Beat Coverage |
|----------|------|-------|-----|---------|----------|--------|---------------|
| opening | contemplative | 0:00 | 0:45 | 2s | 3s | 0.15 | Opening |
| analytical-1 | analytical | 0:43 | 3:00 | 3s | 2s | 0.12 | Beat 1 |
| ... | ... | ... | ... | ... | ... | ... | ... |
```

**Validation checks:**
- No silence gaps > 3 seconds (unless marked as deliberate)
- Crossfade overlaps at every boundary (endSec of track N ≥ startSec of track N+1)
- Volume: 0.10-0.15 under narration, 0.20-0.30 during visual-only moments

## Step 3 — Transition SFX Placement (Layer 2)

Walk through the script segment by segment. For each segment, consult the template event → SFX mapping in AUDIO_DESIGN.md:

### Decision Logic

For each segment:

1. **Does the previous segment have a `DIR: cut()` annotation?** → The cut type determines the transition SFX:
   - `cut(color-wash)` → `register-shift` SFX (dramatic — this is a register boundary)
   - `cut(iris)` → `section-open` SFX (focal reveal)
   - `cut(blur-through)` → `beat-transition` SFX with atmospheric overtone
   - `cut(match-cut)` → silent transition (the visual continuity IS the connection — SFX would compete)
   - `cut(dissolve)` → `beat-transition` SFX at subtle intensity
   - `cut(fade)` → `beat-transition` SFX at subtle intensity
   - No `cut()` → use the default logic below
2. **Is this a beat boundary?** → At minimum, `beat-transition` at normal intensity
3. **What template is this?** → Look up the template's entrance cue and key moment cue in the mapping table
4. **Does this segment have `DIR: reveal()` with `sync:"word"`?** → The sync word is when the key animation event fires. Place the `stat-reveal` or `data-tick` SFX at the sync word's estimated timestamp, not at segment start.
5. **Does this segment have `DIR: hold(land)` or `DIR: hold(breathe)`?** → `hold(land)` → silence moment candidate. `hold(breathe)` → music bed thins for the hold duration.
6. **Is this one of the episode's 2-3 biggest moments?** → Consider dramatic intensity
7. **Would this benefit from tension build?** → Add `tension-rise` before the segment, `tension-resolve` at the reveal. `DIR: mood(dense)` followed by a data reveal is a strong tension-rise candidate.

### Intensity Budget

Per AUDIO_DESIGN.md:
- **dramatic** — max 2-3 per episode. Reserve for: thesis reveal, most shocking statistic, closing argument
- **normal** — the default for beat boundaries, data reveals, map shifts
- **subtle** — for routine within-beat transitions, repeated cue types

### Output Format

For each SFX placement:

```
| Time | Segment | Cue Type | Intensity | Trigger | Notes |
|------|---------|----------|-----------|---------|-------|
| 0:00 | title-episode | section-open | dramatic | Episode title card appears | Bookend — returns at end-stinger |
| 0:45 | beat1-section | section-open | normal | Beat 1 title card | New section mood |
| 1:12 | beat1-yield-stat | stat-reveal | normal | 92% yield number lands | Hero stat moment |
| 2:30 | beat1-coalition | map-whoosh | normal | Coalition map phase 1 | Geographic reveal |
| ... | ... | ... | ... | ... | ... |
```

**Validation checks:**
- Total SFX count: 15-25 for a 13-20 minute episode
- No more than 2 dramatic-intensity SFX per 3-minute window
- Every beat boundary has at least a subtle transition SFX
- `end-stinger` appears exactly once, at the final segment

## Step 4 — Texture Hit Placement (Layer 3)

For each TEMPLATE segment, identify animation events that should receive micro-SFX. Consult the template event → texture cue table in AUDIO_DESIGN.md.

### Decision Logic

For each template instance:

1. **What type of template is it?** → Look up the texture cue mappings
2. **Does it have `DIR: reveal()` annotations?** → These tell you exactly how elements appear:
   - `reveal(stagger:300ms)` → texture hits spaced 300ms apart starting at reveal onset
   - `reveal(sequential, per-phase:3s)` → one texture hit per phase, 3s apart
   - `reveal(count-up, over:1.5s)` → single `stat-reveal` hit at the count-up completion (onset + 1.5s)
   - `reveal(draw, over:2s)` → `line-draw` texture starting at onset, over 2s
   - `reveal(hero:0, pulse)` → extra emphasis hit on element 0 (use slightly louder `bar-grow` at 0.10 vol)
3. **Does it have `DIR: cam(sync:"word")`?** → The sync word timestamp is when the camera move fires — place any camera-related texture cue (e.g., `map-whoosh`) at this timestamp
4. **How many visual events does it contain?** → Read the JSON data file if available (e.g., count bars in DataChart, countries in ChoroplethMap)
5. **Apply the budget:** ≤3 hits per 10-second window, prioritize first instances
6. **Calculate offsets:** Use `_direction` timing if available, otherwise estimate from template duration and typical animation phasing. Direction timing is always more accurate.

### Animation Timing Estimates

When precise JSON data isn't available, use these heuristics:

| Template | Typical Animation Phasing |
|---|---|
| DataChart (5 bars, 8s) | Bars start at ~30% (2.4s), stagger 0.3s each, hero bar last |
| ChoroplethMap (3 countries/phase, 5s/phase) | Countries fill at ~20% (1s), stagger 0.5s each |
| TimelineComparison (4 events/track, 12s) | Events appear every ~2s starting at ~15% |
| NetworkDiagram (5 nodes, 8s) | Nodes pop at ~25% (2s), stagger 0.4s each |
| StatReveal (1 hero + 3 comparisons, 8s) | Hero lands at ~40% (3.2s), comparison bars start at ~55% |
| BayesianUpdate (3 evidence items, 10s) | Prior shown at ~20%, evidence items every ~2s starting at ~35% |

### Output Format

```
| Time | Segment | Texture Type | Offset | Volume | Label |
|------|---------|-------------|--------|--------|-------|
| 1:14 | beat1-chart | bar-grow | +1.5s | 0.08 | First bar (Taiwan 92%) |
| 1:15 | beat1-chart | bar-grow | +1.8s | 0.06 | Second bar (S.Korea 5%) |
| 1:16 | beat1-chart | bar-grow | +2.1s | 0.06 | Third bar (US 2%) |
| 1:18 | beat1-chart | line-draw | +3.0s | 0.06 | Reference line appears |
| ... | ... | ... | ... | ... | ... |
```

**Validation checks:**
- Total texture hits: 30-50 per episode
- ≤3 hits per 10-second window (count across all segments active at that time)
- Volume: 0.05-0.10 (never above 0.12)
- No texture hits on FOOTAGE-only segments (footage has its own ambient sound)
- Texture hits at 15-20dB below narration (effectively inaudible on laptop speakers)

## Step 5 — Silence Moments

Identify 1-2 deliberate silence moments per episode where the music bed fades to nothing for 1-3 seconds. Candidates:

- The moment before the thesis statement lands
- After a shocking statistic, before analysis begins
- The final beat before the end-stinger
- Any `[Pause.]` or `[Beat.]` markers in the script

For each:

```
| Time | Duration | Preceding Event | Following Event | Rationale |
|------|----------|-----------------|-----------------|-----------|
| 4:30 | 2s | "that number should terrify you" | Thesis statement | Maximum impact on thesis reveal |
```

## Step 6 — Consolidated Cue Sheet

Combine all layers into a single chronological cue sheet. This is the primary deliverable — the document the NLE editor reads during assembly.

### Format

```markdown
# Audio Cue Sheet — EP01: The Silicon Trap

## Episode Summary
- Duration: ~13 minutes
- Music bed tracks: 5
- Transition SFX: 22
- Texture hits: 38
- Silence moments: 2
- Dramatic SFX: 3

## Chronological Cue Sheet

### 0:00 — OPENING

**Music:** Track "opening" starts (contemplative, 0.15 vol, 2s fade-in)

| Time | Layer | Cue | Intensity/Vol | Trigger |
|------|-------|-----|---------------|---------|
| 0:00 | L2 | section-open | dramatic | Episode title card |
| 0:03 | L1 | music bed rises | 0.25 | Visual-only title hold |
| 0:15 | L2 | beat-transition | normal | Cut to TSMC footage |

### 0:45 — BEAT 1: The Stranglehold

**Music:** Crossfade to "analytical-1" (analytical, 0.12 vol, 3s fade-in from 0:43)

| Time | Layer | Cue | Intensity/Vol | Trigger |
|------|-------|-----|---------------|---------|
| 0:45 | L2 | section-open | normal | Beat 1 title card |
| 1:12 | L2 | stat-reveal | normal | 92% yield stat lands |
| 1:14 | L3 | bar-grow | 0.08 | First DataChart bar |
| 1:15 | L3 | bar-grow | 0.06 | Second bar |
| ... | ... | ... | ... | ... |

[Continue for all beats...]

## Quality Checklist
- [ ] Music bed: no gaps > 3s (except 2 deliberate silences)
- [ ] Music bed: volume ≤ narration during all spoken sections
- [ ] All beat boundaries: at least subtle transition SFX
- [ ] Dramatic SFX: ≤ 2 per 3-minute window (have: X)
- [ ] Texture hits: inaudible on laptop speakers
- [ ] End-stinger: resolves cleanly to silence
- [ ] Music crossfades: smooth at all beat boundaries
- [ ] Total counts: L2 = X (target 15-25), L3 = X (target 30-50)
```

## Step 7 — Assembly Manifest Audio Extensions (Optional)

If an assembly manifest exists, generate the audio extensions as JSON patches:

### musicBed object (root level)

```json
{
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
        "mood": "contemplative",
        "beat": "opening"
      }
    ]
  }
}
```

### soundCue + textureCues per segment

For each segment that needs audio, provide the `soundCue`, `soundCueSecondary` (if two SFX moments), and `textureCues` array to merge into the manifest.

**Note:** The `file` paths in musicBed tracks are placeholders — actual audio files haven't been sourced yet. The cue sheet is source-agnostic by design. When Tiger sources music and SFX, the file paths get filled in.

## Output Checklist

Before finishing, verify:

- [ ] Every beat has a music bed mood assignment
- [ ] Music bed tracks crossfade at every boundary (no hard cuts)
- [ ] Every beat boundary has at least a subtle transition SFX
- [ ] Dramatic intensity used ≤ 3 times total
- [ ] end-stinger appears exactly once
- [ ] Texture hits respect the ≤3-per-10s budget
- [ ] No texture hits on FOOTAGE-only segments
- [ ] Silence moments are marked (1-2 per episode)
- [ ] Total L2 count: 15-25
- [ ] Total L3 count: 30-50
- [ ] Cue sheet is chronological and human-readable
- [ ] All `DIR: cut()` annotations have matching transition SFX (type matches the direction-to-SFX mapping)
- [ ] All `DIR: hold(land)` moments are flagged as silence candidates
- [ ] All `DIR: reveal(sync:"word")` moments have SFX placed at the sync word timestamp, not segment start
- [ ] Music bed mood shifts align with `DIR: mood()` changes (no mood mismatch between visuals and audio)

Present the cue sheet to Tiger for review. The cue sheet is consumed during NLE assembly — it tells the editor exactly which sounds to place at which timecodes.
