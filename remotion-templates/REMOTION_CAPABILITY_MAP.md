# Remotion Capability Map

> What Remotion can do that Parallax isn't using yet. We currently use Remotion as a
> *chart/diagram renderer* (~83 templates) — roughly 25% of its surface. This maps the rest,
> ranked by leverage, with a showcase index of working prototypes.
>
> Strategy context: `project/REMOTION_MOTION_LAYER_ROADMAP.md`. Created May 23, 2026 (Remotion 4.0.457).

## Installed today
`remotion` core · `@remotion/cli/bundler/renderer` · `@remotion/transitions` (just added) ·
`@remotion/three` + `three` + R3F · `@remotion/google-fonts` · `@remotion/layout-utils` ·
`@remotion/lambda` · `mapbox-gl` + `deck.gl` (maps) · `katex` (math) · `zod` v4 ·
`@remotion/paths` + `@remotion/shapes` + `@remotion/noise` (geometric/generative prototypes) ·
`@remotion/media-utils` (`useAudioData`/`visualizeAudio` — narration-sync prototype).

**Not installed (capability gaps):** `@remotion/motion-blur`, `@remotion/animation-utils`,
`@remotion/captions`, `@remotion/install-whisper-cpp`, `@remotion/lottie`, `@remotion/gif`,
`@remotion/skia`, `@remotion/player`.

## The capability surface (by area)

- **Transitions** — `@remotion/transitions`: `<TransitionSeries>` + presets (fade, slide, wipe, flip, clockWipe, iris, zoom) + custom presentations. Our transition grammar can live here instead of the NLE.
- **Vector motion** — `@remotion/paths` (`evolvePath` draw-on, `interpolatePath` morph, `getPointAtLength`, `warpPath`) + `@remotion/shapes` (parametric rect/circle/triangle/star/polygon/pie/arrow). The slick geometric layer.
- **Generative** — `@remotion/noise` (simplex `noise2D/3D/4D`) for drift, flow-fields, grain, displacement.
- **Motion polish** — `@remotion/motion-blur` (`<Trail>`/`<MotionBlur>`), `@remotion/animation-utils` (`interpolateStyles`, `makeTransform`), core `spring`/`interpolate`/`Easing`/`interpolateColors`.
- **Audio + narration** — `@remotion/media-utils` (`useAudioData`, `visualizeAudio`, `useWindowedAudioData`) for audio-reactive visuals; `@remotion/install-whisper-cpp` + `@remotion/captions` for **word-level timing → on-screen animation** (drives the text-animation register + D17 reveals off the narration WAV).
- **3D / GPU** — `@remotion/three` (R3F → video, `useOffthreadVideoTexture`); `@remotion/skia` (GPU shaders/filters via `--gl=angle`) for render-time grain/halftone/paper texture.
- **Compositing** — `<OffthreadVideo>` (Rust frame extraction), CSS/SVG masking, canvas pixel ops (duotone/green-key at render time). Substrate for "AI still under code-driven vector motion."
- **Parametric power** — `calculateMetadata` (async: fetch data at render time, dynamic duration/dimensions), Zod-typed props, SSR/CLI batch render (`renderMedia`, `renderFrames`) → many variants from one composition (EN/ZH, A/B, multi-format).
- **Layout** — `@remotion/layout-utils` (`measureText`, `fitText`, `fillTextBox`) → text that never overflows across 83 templates.
- **Distribution** — `@remotion/player` (interactive embedded chart on a site), `@remotion/lambda` (scalable cloud render), native multi-format (16:9 + Shorts + GIF/thumbnail).

## Underused, ranked by leverage (the build queue)

1. **Whisper word-timing → animation** (`install-whisper-cpp` + `captions`) — auto-drives the text-animation register + D17 reveals off the narration WAV; removes hand-timed `syncPoints`/`revealAtSec`. Highest leverage; near-free given the `narrate` skill already exists.
2. **`calculateMetadata` parametric multi-variant** — one composition → EN/ZH, auto-duration from narration, unified Shorts/16:9. Compresses the pipeline.
3. **`@remotion/layout-utils`** — `measureText`/`fitText` kills overflow bugs across all templates; cheap retrofit.
4. **`@remotion/paths` morph + `@remotion/shapes`** — replace hand-rolled stroke reveals / Bezier connections; on-brand constructivist geometry; the clean alternative to AI morph for vector transforms.
5. **AI stills as compositing layers** — `OffthreadVideo`/canvas duotone + vector overlay; palette-match AI-GEN footage at render time (the compositing unlock, P2 of the roadmap).
6. **`@remotion/transitions`** — native branded transitions from the manifest (prototyped ✓; productionizing is P1).
7. **`@remotion/player`** — interactive embedded charts on a companion site (audience-growth, not production).

## Not worth chasing (for our use case)
- **Heavy 3D** beyond an occasional signature globe — render cost fights the flat-illustration identity.
- **Lambda/Cloudrun** until volume demands it (pre-launch; Cloud Run is frozen anyway).
- **`@remotion/animated-emoji` / TikTok-style captions** — tonally wrong for a rigorous essay channel.
- **`@remotion/media-parser` / `@remotion/webcodecs`** — deprecated Feb 2026 (migrating to Mediabunny); don't build on them.

## Showcase index (prototypes — `src/templates/_proto/`)

> All six play back-to-back with slate cards in **`ProtoReel`** (`proto-reel`, ~48s) — the single shareable R&D cut. ✅ rendered → `out/proto-reel.mp4`.

| Capability | Prototype | Status |
|---|---|---|
| Native branded transitions | `BrandTransitions` (`proto-brand-transitions`) | ✅ rendered |
| Geometric vector (grid→table) | `GridToTable` | in progress (forked) |
| Masked reveal | `MaskedStateReveal` | in progress |
| Draw-on + path morph | `GeometricMotion` (`proto-geometric-motion`) | ✅ rendered |
| AI-still render-time compositing | `AIStillComposite` (`proto-ai-still-composite`) | ✅ rendered |
| Narration-sync + audio waveform | `NarrationSync` (`proto-narration-sync`) | ✅ rendered |
| `calculateMetadata` bilingual | `ParametricBilingual` (`proto-parametric-en` / `-zh`) | ✅ rendered |
| Generative noise field | `NoiseField` (`proto-noise-field`) | ✅ rendered |
| 3D constructivist globe | — | queued (low priority) |

Research backing: [Remotion API](https://www.remotion.dev/docs/api), [4.0 blog](https://www.remotion.dev/blog/4-0), [paths](https://www.remotion.dev/docs/paths/), [transitions](https://www.remotion.dev/docs/transitions/), [install-whisper-cpp](https://www.remotion.dev/docs/install-whisper-cpp/), [captions](https://www.remotion.dev/docs/captions/), [calculateMetadata](https://www.remotion.dev/docs/calculate-metadata), [layout-utils](https://www.remotion.dev/docs/layout-utils/best-practices), [audio visualization](https://www.remotion.dev/docs/audio/visualization), [Mediabunny migration](https://www.remotion.dev/docs/mediabunny/).
