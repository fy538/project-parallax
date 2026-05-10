# Audio Asset Library — Remotion-Side

> This directory contains audio assets that ship with Remotion renders.
> Per AUDIO_DESIGN.md, the 3-layer audio model is: Music Bed (Layer 1),
> Transition SFX (Layer 2), Texture Hits (Layer 3). Narration lives per-episode
> and is loaded from `public/episodes/{slug}/`.
>
> Files referenced here are loaded via Remotion's `staticFile(...)` from
> `src/components/AudioLayer.tsx` — which is rendered inside FullEpisode.tsx
> when the assembly manifest contains `musicBed`, per-segment `soundCue`, or
> `textureCues` entries.

## Directory layout

```
public/audio/
├── README.md                        ← this file
├── sfx/
│   ├── transitions/                 # Layer 2 — event-driven, 0.3-3s clips
│   │   ├── beat-transition-subtle.wav
│   │   ├── beat-transition-normal.wav
│   │   ├── beat-transition-dramatic.wav
│   │   ├── stat-reveal-subtle.wav
│   │   ├── stat-reveal-normal.wav
│   │   ├── stat-reveal-dramatic.wav
│   │   ├── tension-rise-subtle.wav
│   │   ├── tension-rise-normal.wav
│   │   ├── tension-rise-dramatic.wav
│   │   ├── tension-resolve-subtle.wav
│   │   ├── tension-resolve-normal.wav
│   │   ├── tension-resolve-dramatic.wav
│   │   ├── map-whoosh-subtle.wav
│   │   ├── map-whoosh-normal.wav
│   │   ├── map-whoosh-dramatic.wav
│   │   ├── quote-bell-subtle.wav
│   │   ├── quote-bell-normal.wav
│   │   ├── quote-bell-dramatic.wav
│   │   ├── section-open-subtle.wav
│   │   ├── section-open-normal.wav
│   │   ├── section-open-dramatic.wav
│   │   └── end-stinger.wav
│   └── textures/                    # Layer 3 — micro-SFX, 50-600ms clips
│       ├── dot-click.wav
│       ├── card-settle.wav
│       ├── line-draw.wav
│       ├── region-glow.wav
│       ├── bar-grow.wav
│       ├── node-pop.wav
│       └── page-turn.wav
```

## File-naming convention

- **Transition SFX:** `{cue-type}-{intensity}.wav` where intensity ∈ `{subtle, normal, dramatic}`.
  - Special case: `end-stinger.wav` (no intensity suffix — used once per episode).
- **Texture hits:** `{type}.wav` (no intensity — texture hits use the manifest `volume` field instead).
- **Format:** WAV 48kHz 24-bit (production master). MP3 320kbps acceptable for Remotion preview.
- **Duration targets:** see AUDIO_DESIGN.md §"The SFX palette" for per-cue duration ranges.

## Sourcing checklist (Tiger)

The full SFX library needs **22 transition SFX files + 7 texture hit files = 29 files** before any
episode can render with full audio. Subscriptions covering all of this:

- **Epidemic Sound** (recommended) — subscription, YouTube-safe, stems available, sound-design libraries match the Parallax aesthetic.
- **Artlist** — alternative subscription with similar coverage.
- **Splice** — per-download for one-shots; useful for textures.

For each cue type, source **2-3 variants** even though the manifest currently references one file —
this gives the editor room to randomize for repetition fatigue (next iteration will randomize via
`*-1.wav` / `*-2.wav` / `*-3.wav` suffixes).

## Volume reference (matches AudioLayer.tsx)

| Layer | Source volume in WAV | AudioLayer multiplier |
|-------|----------------------|----------------------|
| Music Bed | normalized -23 LUFS | 0.10–0.15 (under narration) |
| Transition SFX (subtle) | -18 dBFS peak | 0.15 |
| Transition SFX (normal) | -12 dBFS peak | 0.35 |
| Transition SFX (dramatic) | -8 dBFS peak | 0.55 |
| Texture Hits | -22 dBFS peak | 0.06–0.08 |

**Don't pre-mix volumes into the WAVs themselves.** AudioLayer's `volume` callback handles
narration-relative mixing. Source files should be intensity-balanced inside their tier (all
"normal" SFX should be roughly the same loudness).

## Behavior when files are missing

**All 29 SFX files must exist on disk before rendering.** Remotion pre-downloads every asset
referenced by `staticFile()` before frame 1 renders — a 404 on any WAV crashes the render
immediately with "Received a status code of 404."

Silent placeholder WAVs (0.5s silence, 44100 Hz mono 16-bit PCM) are committed to this repo
for all 29 expected files so renders work out of the box. Replace them with real SFX when
sourced from Epidemic Sound / Artlist — it is a drop-in swap with no manifest or code changes
required. The cue point timings in the manifest are preserved regardless.

## Music bed (Layer 1)

Music beds live **per-episode**, not in this shared library:

```
public/episodes/{slug}/audio/music/
├── bed-opening.wav
├── bed-analytical.wav
├── bed-tension.wav
└── bed-resolution.wav
```

The path is `episodes/{slug}/{track.file}` per the manifest's `musicBed.tracks[].file` field.
See AUDIO_DESIGN.md §"Music Bed" for sourcing guidance (60-80 BPM, minor keys for analytical
sections, no recognizable melodies).

## Related docs

- `project/AUDIO_DESIGN.md` — full editorial framework
- `remotion-templates/data/assembly-manifest.schema.json` — `musicBed`, `soundCue`, `soundCueSecondary`, `textureCues` schema
- `remotion-templates/src/components/AudioLayer.tsx` — render implementation
