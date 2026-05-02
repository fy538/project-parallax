# Sound Design System

> Audio language for Parallax. Complements the visual template system with a consistent sonic identity.

## Core Principle

Sound in Parallax serves **structural comprehension**, not decoration. Every sound cue maps to a narrative function — if removing it makes the argument harder to follow, it belongs. If it's just "cool," it doesn't.

Narration is always king. Sound cues sit underneath, never competing with the voice. Mix at -18dB to -24dB relative to narration.

## Sound Palette

### Structural Cues (mark narrative architecture)

| Cue | When | Sound Character | Duration |
|-----|------|----------------|----------|
| `beat-transition` | Beat boundary (dissolve between sections) | Low sub-bass swell + filtered reverse cymbal | 1.5–2s |
| `section-open` | Section title card appears | Clean resonant tone (piano harmonic or bell) + subtle room verb | 1s |
| `end-stinger` | End card / episode close | Brand-signature chord (minor → resolve) + fade tail | 3s |

### Data & Reveal Cues (punctuate information delivery)

| Cue | When | Sound Character | Duration |
|-----|------|----------------|----------|
| `stat-reveal` | Key number appears (KineticTypography stat, DataChart hero bar) | Short crystalline ping + sub thud | 0.3s |
| `quote-bell` | Attributed quote card | Single tubular bell, dry | 0.5s |

### Tension Cues (shape emotional arc)

| Cue | When | Sound Character | Duration |
|-----|------|----------------|----------|
| `tension-rise` | Escalation sequence (timeline building, sanctions tightening) | Rising filtered drone, builds over segment duration | Match segment |
| `tension-resolve` | After climax — the "let it land" moment | Drone dissipates, room tone returns | 2s |

### Motion Cues (accompany visual movement)

| Cue | When | Sound Character | Duration |
|-----|------|----------------|----------|
| `map-whoosh` | ChoroplethMap phase change or RouteAnimation path draw | Soft directional whoosh (L→R or R→L matching map motion) | 0.5s |

## Intensity Levels

- **subtle**: -24dB relative to narration. Texture-level; viewer barely notices consciously but feels the structural punctuation.
- **normal**: -18dB. Clear but subordinate. Default for most cues.
- **dramatic**: -12dB. Momentarily foreground — use sparingly (1-2 per episode for peak moments).

## Ambient Bed

A low drone/texture bed runs underneath the entire episode at -30dB:
- Cool, spacious synth pad (think Blade Runner 2049 ambience, not Hans Zimmer bombast)
- Shifts subtly with beat emotional register (mirrors `backgroundTint` color temperature)
- Drops out entirely during the most dramatic pauses (silence is the loudest sound)

## Assembly Manifest Integration

Sound cues are specified per-segment in the manifest via the `soundCue` field:

```json
{
  "id": "beat2-seg05",
  "type": "TEMPLATE",
  "soundCue": {
    "type": "stat-reveal",
    "offsetSec": 0.5,
    "intensity": "normal"
  }
}
```

The assembly manifest marks *where* sound cues go. The actual audio files are sourced and mixed in the NLE (DaVinci Resolve / Premiere) — Remotion does not render these sound effects.

## Sourcing

Recommended sources for the sound palette:
- **Artlist.io** — subscription, high quality, clean licensing
- **Epidemic Sound** — good for ambient beds and transitions
- **Custom synthesis** — use Ableton or Logic for the brand stinger and ambient drone

Build a reusable sound effects library in `assets/sfx/` with one file per cue type:
```
assets/sfx/
├── beat-transition.wav
├── section-open.wav
├── end-stinger.wav
├── stat-reveal.wav
├── quote-bell.wav
├── tension-rise-loop.wav
├── tension-resolve.wav
├── map-whoosh-lr.wav
├── map-whoosh-rl.wav
└── ambient-bed.wav
```

Once established, the same library serves every episode — just the placement changes.
