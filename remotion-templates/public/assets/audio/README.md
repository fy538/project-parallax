# Audio assets — sourcing guide

This directory holds the audio assets the Soundscape register references at render time. **Stub-empty initially** — assets are sourced per-episode or shared across the library as they become available.

When an asset slot is empty, `<AmbientBed>` / `<TransitionSFX>` / `<TextureHit>` silently no-op (one-shot warn in dev mode). The register system is safe to deploy before assets exist; segments degrade gracefully to silent ambient.

**Related docs:**
- `project/SOUNDSCAPE_REGISTER.md` — what each register IS, when to use it
- `project/AUDIO_DESIGN.md` — three-layer audio model, dB targets, philosophy
- `src/design/soundscape.ts` — TS registry (asset paths come from here)
- `src/components/Soundscape.tsx` — React primitives that play the assets

---

## Directory layout

```
public/assets/audio/
├── README.md                          ← this file
├── archive-room.mp3                   ← Ambient — quiet reading room
├── editorial-print.mp3                ← Ambient — newsroom / office
├── atmospheric-outdoor.mp3            ← Ambient — wind, distant nature
├── cinematic-dark.mp3                 ← Ambient — deep low drone
├── cyclical-drone.mp3                 ← Ambient — repeating loop motif
└── sfx/                               ← Transition + texture cues
    ├── beat-transition.mp3            ← Low whoosh, beat boundaries
    ├── stat-reveal.mp3                ← Rising tone + lock click
    ├── tension-rise.mp3               ← Slow ascending pad
    ├── tension-resolve.mp3            ← Descending tone + release
    ├── map-whoosh.mp3                 ← Spatial sweep, doppler
    ├── quote-bell.mp3                 ← Single clean piano/bell tone
    ├── section-open.mp3               ← Soft atmospheric swell
    ├── end-stinger.mp3                ← Resolving chord, fade
    ├── dot-click.mp3                  ← Soft mechanical click
    ├── card-settle.mp3                ← Paper placement
    ├── line-draw.mp3                  ← Pen/pencil stroke
    ├── region-glow.mp3                ← Ambient tone swell
    ├── bar-grow.mp3                   ← Ascending micro-tone
    ├── node-pop.mp3                   ← Soft "pop"
    ├── page-turn.mp3                  ← Paper rustle
    ├── typewriter-clack.mp3           ← Mechanical typewriter strike
    ├── pen-stroke.mp3                 ← Ink-pen on paper
    ├── stamp-impact.mp3               ← Rubber stamp on document
    ├── chime-soft.mp3                 ← Soft chime
    ├── chime-sharp.mp3                ← Sharp chime
    └── vinyl-pop.mp3                  ← Vinyl crackle/pop
```

---

## Sourcing — where to get assets

Order of preference:

### 1. Freesound.org (CC0 + Creative Commons)

Best general-purpose source for ambient beds + SFX. Filter by:
- License: `CC0` or `CC-BY` (CC-BY requires attribution in `episodes/<slug>/CREDITS.md`)
- Duration: matches the loop length in `SOUNDSCAPE_REGISTERS[<name>].loopSeconds`
- Sample rate: 44.1 kHz or 48 kHz (Remotion handles both)

Search terms per register:
- `archive-room.mp3` → "library ambient", "reading room", "quiet indoor hum"
- `editorial-print.mp3` → "office ambience", "newsroom", "typewriter distant"
- `atmospheric-outdoor.mp3` → "wind ambient", "outdoor nature", "field wind low"
- `cinematic-dark.mp3` → "cinematic drone", "sub bass drone", "tension low"
- `cyclical-drone.mp3` → "minimal drone", "phase music", "looped motif"

### 2. Pixabay Audio (royalty-free, no attribution required)

Cleaner UX than Freesound, less depth. Good for the SFX palette
(transition cues + texture hits) which need shorter, more discrete clips.

### 3. Pexels Audio (royalty-free, attribution appreciated)

Strong on ambient bed sources. Limited SFX library.

### 4. Commercial libraries (Splice, Artlist, Epidemic Sound)

If the channel has a subscription, these are highest-quality for music
+ ambient. Always check the licensing terms for AI-narrated content
(some libraries restrict use over AI voices).

---

## Volume targets (set at source-prep time)

Per the doctrine, soundscape volumes are CALIBRATED — see
`SOUNDSCAPE_REGISTERS[<name>].volumeDb` for each register's target dB
relative to narration. Narration is normalized to **−14 LUFS** (YouTube
target) before assembly.

The React primitives apply the dB → linear conversion at render time
(`<AmbientBed volume={dBToLinear(-24)}>`), but the asset itself should
be normalized to **0 dBFS peak** (full-scale) so the runtime gain has
predictable headroom.

When prepping a sourced asset:
1. Normalize peak to −0.5 dBFS (leaves a tiny safety margin)
2. Trim to the target loopSeconds, ensuring a clean loop boundary
   (zero crossings at both ends)
3. Fade in/out 50ms to avoid loop click artifacts
4. Encode as MP3 192kbps mono (saves bytes; ambient/SFX don't need stereo)
5. Drop into the corresponding slot under `public/assets/audio/`

---

## Licensing + credits

Every sourced asset MUST have its provenance recorded in:
- `episodes/<slug>/CREDITS.md` for episode-specific assets
- `remotion-templates/public/assets/audio/CREDITS.md` for library-wide assets
  (this file)

The credit format mirrors the image-credit convention used elsewhere:

```
**archive-room.mp3**
Title: "Library Ambient" by Freesound user xyz123
Source: https://freesound.org/people/xyz123/sounds/12345/
License: CC-BY 4.0 — attribution required in episode credits
Sourced: 2026-05-19 by tiger
Modifications: normalized to -0.5 dBFS, trimmed to 18s loop, 50ms fades
```

---

## Audit checklist before shipping an episode

- [ ] Every segment's resolved ambient register has an asset present (or is `silence`)
- [ ] Every authored `transitionIn` / `transitionOut` cue has a corresponding SFX asset
- [ ] Every authored texture-hit type has a corresponding SFX asset
- [ ] All assets have CREDITS entries
- [ ] Final mix: ambient never louder than −18 dB at narration RMS peak
- [ ] No "click" artifacts at loop boundaries (test by listening to 60+ seconds of any ambient)
