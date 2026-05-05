# Parallax — Pacing System

> Created: May 4, 2026

## What this document is

The specification for how narration timing, camera animation, and visual density are synchronized across the Parallax production pipeline. This system ensures that camera movements fill their segments naturally, sync words anchor animations to spoken narration, and episode-level pacing is budgeted at the script stage.

Three subsystems work together:

1. **Proportional Camera Paths** — camera step durations as rhythm fractions, not absolute seconds
2. **Whisper Sync Loop** — post-recording word timestamps resolve sync markers to frame accuracy
3. **Visual Density Budgeting** — per-beat pacing profiles control visual change rate

**Related docs:**
- **DIRECTING_LANGUAGE.md** — the `DIR:` annotation vocabulary (cam, reveal, hold, cut, mood)
- **SCRIPT_FORMAT.md** — two-column production script format with `DIR:` and `PACE:` annotations
- **AUDIO_DESIGN.md** — 3-layer audio model (timing interacts with hold/silence)
- **PRODUCTION_PIPELINE.md** — end-to-end pipeline stages

---

## The Problem

The pipeline has three timing clocks that don't coordinate:

| Clock | Where it lives | Units | When it's known |
|---|---|---|---|
| Narration | generate_manifest.py | Seconds per segment | Estimated pre-recording, precise post-Whisper |
| Camera | cameraPath in JSON data | Absolute seconds per step | Authored at visual-spec time |
| Animation | useCurrentFrame() + durationInFrames | Frames | Set by FullEpisode from manifest |

**Failure mode:** If narration for a segment is 14 seconds but the camera path totals 8 seconds, the camera finishes its journey and sits idle for 6 seconds. If narration is only 6 seconds, the camera gets cut off mid-zoom. Template-internal animations (Ken Burns drift, exit fades) are proportional and scale correctly — but camera paths don't.

**What the industry does:** Nobody has fully solved this. Kurzgesagt manually keys 200+ illustrations over 8 weeks. Vox inverts the process (writer pre-visualizes exact animations during scripting). Everyone uses scratch audio passes to negotiate timing. The common pattern is a 3-5 second "absorption window" — viewers need ~3 seconds to process a new visual, attention drops after 5.

---

## Subsystem 1: Proportional Camera Paths

### Concept

Instead of `{duration: 3}` (absolute seconds), camera steps specify `{duration: 0.4}` (40% of total composition time). The rhythm is authored, not the clock — "spend 40% on the overview, 35% zooming in, 25% on the detail" — and the actual seconds resolve at render time from the segment's `durationInFrames`.

### Detection

**Backwards compatible** — the hook auto-detects mode:

- If `proportional: true` is set in the `_direction` block, all step durations are treated as fractions.
- If step durations sum to exactly or close to 1.0 (within ±0.01), treat as proportional.
- Otherwise, treat as absolute seconds (current behavior).

When proportional mode is active, each step's frame count = `step.duration * totalDurationInFrames`.

### Format

```typescript
// Current (absolute) — still supported
cameraPath: [
  { target: "overview", zoom: 0.8, duration: 3, focus: [] },
  { target: "element:0", zoom: 1.4, duration: 2, focus: [0] },
]

// New (proportional) — preferred for new content
cameraPath: [
  { target: "overview", zoom: 0.8, duration: 0.4, focus: [] },
  { target: "element:0", zoom: 1.4, duration: 0.35, focus: [0] },
  { target: "element:1", zoom: 1.6, duration: 0.25, focus: [1] },
]
// Sum = 1.0 → proportional mode auto-detected
```

### Implementation: useNarratedCamera changes

```typescript
// In the step boundaries computation:
const isProportional = direction?.proportional === true
  || cameraPath.reduce((sum, s) => sum + s.duration, 0) <= 1.01;

const stepBoundaries = useMemo(() => {
  const boundaries = [];
  let cumulative = 0;

  for (const step of cameraPath) {
    const stepFrames = isProportional
      ? Math.round(step.duration * durationInFrames)  // fraction of total
      : sec(step.duration);  // absolute seconds (current behavior)
    boundaries.push({ start: cumulative, end: cumulative + stepFrames });
    cumulative += stepFrames;
  }

  // If absolute mode and total steps < composition duration,
  // extend last step to fill remaining frames (auto-fill)
  if (!isProportional && boundaries.length > 0) {
    const last = boundaries[boundaries.length - 1];
    if (last.end < durationInFrames) {
      last.end = durationInFrames;
    }
  }

  return boundaries;
}, [cameraPath, durationInFrames, isProportional]);
```

**Key addition:** In absolute mode, the last step auto-extends to fill the composition duration, preventing the "camera finishes early and sits idle" problem. This is a safe default — the camera holds its final position with continued drift.

### What visual-spec emits

Visual-spec translates `DIR: cam()` into proportional durations by default:

```
Script: DIR: cam(wide:Asia → tight:Guangdong, sync:"Guangdong")
Segment estimated duration: ~12s

visual-spec output:
_direction: {
  proportional: true,
  cameraPath: [
    { target: { center: [104, 35], zoom: 3 }, duration: 0.4 },
    { target: { center: [113.3, 23.1], zoom: 7 }, duration: 0.35 },
    // Last step holds the tight view
    { target: { center: [113.3, 23.1], zoom: 7 }, duration: 0.25 }
  ],
  syncWords: ["Guangdong"]
}
```

The same proportions work whether the segment ends up being 8 seconds or 18 seconds after recording.

---

## Subsystem 2: Whisper Sync Loop

### Concept

`DIR: cam(tight:Taiwan, sync:"Taiwan")` means "start zooming when I say 'Taiwan'." Before recording, this is an intent marker. After recording, Whisper resolves it to an exact timestamp.

### Pipeline flow

```
Pre-recording (estimate mode):
  Script → generate_manifest.py → manifest with syncWords: ["Taiwan"]
  Camera steps use proportional timing (best guess at where the word falls)

Post-recording (Whisper mode):
  generate_manifest.py --audio narration.wav →
    1. WhisperX transcribes with phoneme-level alignment
    2. Fuzzy-match each syncWord to a word timestamp
    3. Write resolved syncPoints into manifest segments
    4. Optionally: adjust camera step boundaries to anchor on sync words
```

### Manifest schema addition

```json
{
  "id": "beat2-seg04",
  "startSec": 45.2,
  "endSec": 57.8,
  "syncWords": ["Taiwan", "ninety-two"],
  "syncPoints": [
    { "word": "Taiwan", "timeSec": 48.3, "frame": 1449, "confidence": 0.94 },
    { "word": "ninety-two", "timeSec": 53.1, "frame": 1593, "confidence": 0.88 }
  ]
}
```

### Sync-anchored camera steps

After Whisper resolution, camera step boundaries can be snapped to sync words. The proportional timing gives the default rhythm; sync points override specific boundaries:

```
Before Whisper: step 1 ends at 40% of segment (proportional)
After Whisper:  step 1 ends when "Taiwan" is spoken (frame 1449)
                step 2 starts at "Taiwan" + transition overlap
```

Implementation in generate_manifest.py:
```python
def resolve_sync_points(segment, word_timestamps):
    """Resolve syncWords to frame-accurate timestamps."""
    if not segment.get("syncWords"):
        return

    resolved = []
    for sync_word in segment["syncWords"]:
        # Fuzzy-match against words in this segment's time range
        match = find_word_in_range(
            sync_word, word_timestamps,
            segment["startSec"], segment["endSec"]
        )
        if match:
            resolved.append({
                "word": sync_word,
                "timeSec": round(match["start"], 3),
                "frame": round(match["start"] * FPS),
                "confidence": match.get("confidence", 1.0),
            })
    if resolved:
        segment["syncPoints"] = resolved
```

### Template consumption

Templates can read sync points through `useDirection` (extended) or directly from data:

```typescript
// In a template that wants to sync a reveal to a word:
const syncFrame = data._direction?.syncPoints
  ?.find(sp => sp.word === "ninety-two")?.frame;
// Use syncFrame to trigger a bar reveal, counter start, etc.
```

For camera paths, `useNarratedCamera` gains a `syncAnchors` option:

```typescript
cameraPath: [
  { target: "overview", zoom: 0.8, duration: 0.4 },
  { target: "element:0", zoom: 1.4, duration: 0.35, syncStart: "Taiwan" },
  { target: "element:1", zoom: 1.6, duration: 0.25, syncStart: "ninety-two" },
]
```

When `syncPoints` are available, the hook adjusts step boundaries to anchor on the resolved frame. When they're not (estimate mode), proportional timing is used as the fallback.

---

## Subsystem 3: Visual Density Budgeting

### Concept

At the script stage, each beat gets a pacing profile that controls how fast visuals change. This is the episode-level rhythm — urgency vs. breathing room — declared in the script itself.

### The PACE: annotation

Added to the script right column alongside DIR: annotations:

```
| NARRATION | VISUAL |
|---|---|
| In the first quarter of 2024... | [MG: DataChart] Revenue breakdown |
| | PACE: analytical |
```

Three pacing profiles:

| Profile | Target visual change rate | Use when |
|---|---|---|
| `urgent` | 2-4 seconds per visual change | Rapid-fire evidence, escalation, tension build |
| `analytical` | 4-6 seconds per visual change | Data presentation, framework explanation (default) |
| `breathing` | 6-10 seconds per visual change | Emotional beats, let-it-sink-in moments, after a major reveal |

### Where PACE: is consumed

**script-draft** — emits PACE: annotations based on narrative arc. Urgent at the hook, analytical through the body, breathing at emotional peaks, urgent again at the climax.

**script-audit** — checks pacing variation: at least 2 profile changes per beat, no more than 90 seconds at a single pace, appropriate pacing for content type.

**visual-spec** — uses PACE: to set default composition durations when the script doesn't specify explicit timing. An analytical beat with 3 visual elements might get 5s/5s/5s; an urgent version of the same content might get 3s/3s/3s.

**generate_manifest.py** — reads PACE: annotations alongside DIR: lines. Applies pacing profile as a duration multiplier when visual duration isn't explicitly stated:

```python
PACE_MULTIPLIERS = {
    "urgent": 0.7,      # 30% shorter than default
    "analytical": 1.0,  # baseline
    "breathing": 1.4,   # 40% longer than default
}
```

### Beat-level pacing map

The script-draft skill generates a pacing summary alongside the script:

```markdown
## Pacing Map

| Beat | Profile | Avg Change Rate | Rationale |
|---|---|---|---|
| Cold Open | urgent | 3.2s | Hook — rapid juxtaposition |
| Beat 1 | analytical | 5.0s | Framework setup |
| Beat 2 | breathing → urgent | 7.0s → 3.5s | Emotional reveal then evidence cascade |
| Beat 3 | analytical | 4.5s | Data heavy |
| Conclusion | breathing | 8.0s | Let-it-land |
```

### Interaction with camera paths

Proportional camera paths work naturally with density budgets:
- `urgent` segments are shorter → same proportional camera path plays faster
- `breathing` segments are longer → same proportions stretch out, camera moves feel slower and more deliberate
- No per-template adjustment needed — the rhythm adapts automatically

---

## Integration Summary

### Pre-recording (estimate mode)

```
Script with DIR: + PACE: annotations
    ↓
script-draft: emits DIR: lines (~25% of compositions)
              emits PACE: per beat (urgent/analytical/breathing)
    ↓
visual-spec: parses DIR: → _direction with proportional cameraPath
             uses PACE: for default durations
    ↓
audio-spec: reads DIR: for SFX/music decisions
            uses PACE: for music bed intensity matching
    ↓
generate_manifest.py (estimate):
    - Applies PACE multiplier to segment durations
    - Stores syncWords as text markers
    - Camera paths are proportional → will adapt to any duration
```

### Post-recording (Whisper mode)

```
generate_manifest.py --audio narration.wav:
    - WhisperX gives phoneme-level word timestamps
    - Segment boundaries snap to real narration timing
    - syncWords resolve to syncPoints (frame-accurate)
    - Camera step boundaries adjust to sync anchors
    - PACE multipliers are ignored (real timing replaces estimates)
```

### At render time

```
FullEpisode.tsx:
    - Reads manifest with resolved durations
    - Each template gets durationInFrames from manifest
    - useNarratedCamera reads proportional cameraPath
      → step durations = fraction × durationInFrames
    - If syncPoints available, step boundaries snap to sync frames
    - Ken Burns drift, exit fades, particle systems all proportional (already work)
```

---

## File Changes Required

| File | Change |
|---|---|
| `useNarratedCamera.ts` | Add proportional mode detection, auto-fill last step, syncAnchor support |
| `useDirection.ts` | Pass `proportional` flag through, expose sync points |
| `generate_manifest.py` | Add syncPoint resolution in Whisper mode, PACE: parsing, pace multiplier |
| `SCRIPT_FORMAT.md` | Document PACE: annotation |
| `DIRECTING_LANGUAGE.md` | Document proportional camera timing, sync resolution flow |
| `script-draft SKILL.md` | Teach PACE: emission |
| `script-audit SKILL.md` | Add pacing profile checks |
| `visual-spec SKILL.md` | Emit proportional durations, use PACE: for defaults |
| `audio-spec SKILL.md` | Use PACE: for music bed intensity |
| `CLAUDE.md` | Update built-and-verified |
| `PRODUCTION_PIPELINE.md` | Update pipeline stages |

---

## Design Principles

1. **Proportional by default.** New content uses proportional camera paths. Absolute durations are a legacy escape hatch.

2. **Estimate → refine.** The system produces reasonable results before recording (proportional timing + 150 WPM estimate) and frame-accurate results after (Whisper sync + real durations).

3. **Rhythm over clock.** The script author thinks in rhythm ("40% overview, 35% zoom, 25% detail") not in seconds. The system converts rhythm to clock at render time.

4. **Pacing is an editorial choice.** PACE: annotations make visual density an explicit creative decision, not an emergent property of whoever happened to write the JSON data files.

5. **Graceful degradation.** No PACE: = analytical default. No proportional flag = absolute seconds work. No syncPoints = proportional timing. Every layer is optional.

---

## Implementation Status

| Component | Status | Details |
|---|---|---|
| Proportional camera paths in `useNarratedCamera.ts` | ✅ Built | Auto-detect (sum ≤1.01), explicit `proportional` flag, auto-fill last step |
| Sync anchor adjustment in `useNarratedCamera.ts` | ✅ Built | `syncStart` on camera steps, `syncPoints` in options, frame-level boundary snapping |
| `useDirection.ts` bridge | ✅ Built | Passes `proportional` and `syncPoints` through to templates |
| `SyncPoint` type export | ✅ Built | Exported from hooks index for template consumption |
| `visual-spec` proportional emission | ✅ Built | Step 7 sets `proportional: true`, durations as fractions |
| Whisper sync resolution in `generate_manifest.py` | ✅ Built | `resolve_all_sync_points()` + `_find_sync_word()` wired as Step 5 of `upgrade_manifest_precise()` |
| PACE: parsing in `generate_manifest.py` | ✅ Built | `PACE_LINE_RE` detection in `parse_script()`, `current_pace` state, multiplier application to `vis_dur` |
| PACE manifest metadata | ✅ Built | `pacing` block in manifest output with multipliers and profiles used |
| `paceProfile` segment annotation | ✅ Built | Non-default pace segments annotated for QA visibility |
| PACE: in SCRIPT_FORMAT.md | ✅ Documented | Full spec with profiles, format, guidelines |
| PACE: in script-draft skill | ✅ Documented | Emission guidance + checklist items |
| PACE: in script-audit skill | ✅ Documented | Lens 6 verification checks |
| PACE: in visual-spec skill | ✅ Documented | Pass-through note (consumed by manifest generator) |
| PACE: in audio-spec skill | ✅ Documented | Music bed intensity matching guidance |
| Template-level pace in `useEntrance.ts` | ✅ Built | `timingScale` param scales animation durations per role; `useStaggeredEntrance` scales stagger gap |
| Pace timing scales in `useDirection.ts` | ✅ Built | `paceTimingScale` (0.7/1.0/1.4) and `paceStaggerScale` (0.6/1.0/1.5) from `PACE_TIMING` constants |
| Pace-driven transitions (Rule 7) | ✅ Built | urgent: compress duration ×0.6, downgrade dissolve→cut; breathing: stretch ×1.5, upgrade cut→dissolve |
| Beat-boundary pace reset | ✅ Built | Auto-reset to `analytical` at each beat header with warning print |
| `match_narration` guard | ✅ Built | PACE multiplier skipped when `durationMode == "match_narration"` |
| Sync anchor cascading guard | ✅ Built | Minimum 0.5s duration for steps squeezed by sync point snapping |
| Pacing curve visualization (`--pace-map`) | ✅ Built | `print_pace_map()` — ASCII timeline with segment types, durations, pace profiles, change rates |
| silicon-trap PACE annotations | ✅ Validated | 7 annotations (3 urgent, 4 breathing), 25/58 segments paced, +3.0s delta, beat resets confirmed |
| `paceProfile` in visual-spec `_direction` | ✅ Built | visual-spec tracks PACE state, injects `paceProfile` into `_direction` JSON; templates receive via `useDirection` |
| Pace linting (`lint_pacing()`) | ✅ Built | 4 checks: urgent >45s, no breathing in 15min+ episodes, 3+ transitions/beat, urgent→breathing whiplash |
| Pace diff in `--pace-map` | ✅ Built | Shows base vs actual duration for multiplier-affected segments; stored in `pacing.diffs` manifest block |
| Backward compatibility | ✅ Verified | silicon-trap regression test: 57→58 segments (PACE rows parsed), zero regression |
