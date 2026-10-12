# Remotion Motion Layer — Roadmap

> Strategy for pulling more of the **motion / transition / compositing** layer into Remotion,
> instead of outsourcing it to AI-morph and the NLE. Sibling of `project/ASSET_GENERATION_REGISTER.md`
> and `project/CHAINED_STILL_LESSONS.md`.
>
> Created May 23, 2026. Status: planning.

## The realization

Production currently runs as three pillars, and Remotion only owns one:

| Pillar | Tool | Owns |
|---|---|---|
| Analytical graphics | **Remotion** | charts, diagrams, frameworks, maps, typography |
| Illustrated scenes | **AI-gen** (ChatGPT + Pika/Hailuo) | textured stills + organic morphs |
| Assembly | **NLE** (DaVinci) | transitions, trims, grade |

But Remotion is a full motion-graphics + compositing + 3D engine. Most of what we hand to
AI-morph (geometric transforms) and the NLE (transitions) it can do **natively — branded,
frame-perfect, data-driven, automated.** Dormant capability proves it: `@remotion/transitions`,
`@remotion/paths`, `@remotion/shapes`, `@remotion/noise`, `flubber` are all **unused or not installed**.

## The organizing principle (from this sprint's doctrine)

> **Deterministic tool where precision matters; AI tool where richness/organicity matters.**

- **Organic / atmospheric** (terrain→ocean, smoke, figures regrouping) → AI morph. Gooey *is* the aesthetic.
- **Geometric / precise / transitions / 2.5D / draw-on** → **Remotion vector/code.** Warping is the failure.

The "motion layer" is everything in the second bucket, pulled into Remotion.

## The compositing architecture (the core idea)

Stop treating AI-gen and Remotion as separate pillars — **composite them**:

```
┌─ Remotion composition ─────────────────────────────┐
│  Layer 3:  vector motion (grids, draw-on, labels,   │  ← code, precise, eased
│            highlights, the grid→table, annotations) │
│  Layer 2:  2.5D camera move on the still            │  ← code parallax
│  Layer 1:  AI-generated still (painterly texture)   │  ← ChatGPT richness
│  Layer 0:  documentary finish (grain/halation)      │  ← treat_video / overlay
└─────────────────────────────────────────────────────┘
```

AI gives texture; Remotion gives motion-design precision. The grid→table transform is the first
instance of this pattern.

## The roadmap (ranked by leverage)

### P1 — Native branded transitions  ·  `@remotion/transitions`  ·  effort M  ·  **highest system leverage**
Implement the transition grammar (`cut / dissolve / fade / iris / color-wash / match-cut`) as
Remotion presentations, auto-applied from the assembly manifest. Replaces hand-done NLE
transitions with frame-perfect, consistent, *actually-branded* ones (a real ∴-iris, a brand-amber
color-wash). Removes a whole manual stage and its drift. **Prototype first.**
- Build: custom `Presentation`s (color-wash, iris) + a `TransitionSeries` driver keyed off
  `manifest.segments[].transition`. Wire into `FullEpisode.tsx`.

### P2 — AI-still + Remotion compositing layer  ·  effort M–L  ·  **highest creative leverage**
The architecture above as reusable infrastructure: a component that takes an AI still + a stack
of vector-motion layers (annotation, grid, draw-on, parallax) and composites them. Every
illustrated scene can then carry precise motion. (Grid→table is the pilot — in progress.)

### P3 — Programmatic vector motion + path morphing  ·  `@remotion/paths` + `flubber`  ·  effort M
The "slick geometric" toolkit: **draw-on** (routes tracing, diagrams building stroke-by-stroke,
handwriting, borders drawing) and **true SVG path morphing** (country borders A→B, shape→shape,
chart reshaping). The clean alternative to AI-morph for anything vector. Feeds P2.

### P4 — 2.5D parallax in Remotion  ·  effort M
Slice an AI still into depth planes, animate the camera in code. The doorway/corridor depth move
without After Effects — deterministic, re-renderable. Retires the AE dependency from
`CHAINED_STILL_LESSONS.md`'s parallax-2.5d family.

### P5 — Narration-synced motion  ·  `@remotion/media-utils` + Whisper timings  ·  effort L
Drive reveals / kinetic text / waveforms from the actual narration WAV + word timings. We have
the PACE + D17 anticipatory-reveal *doctrine*; this makes Remotion **execute** it instead of
hand-timing in the NLE.

### Menu (build when an episode needs it)
- **Stylized 3D** (`three` installed): constructivist globe, real 3D fly-throughs (CinematicMap
  without Mapbox/AI-morph), extruded data.
- **Generative backgrounds** (`@remotion/noise`): flow-fields for diffusion/contagion/trade-spread,
  atmospheric hold-beat backdrops.
- **Bilingual auto-render:** render EN + ZH from one composition via a locale prop (channel is bilingual).
- **Motion blur** (`@remotion/motion-blur`): polish on fast moves.

## Sequencing
1. **P1 (transitions)** — system win, unblocks the NLE stage. *(prototyping now)*
2. **P2 + P3 together** — creative win; the compositing layer + the vector toolkit that fills it.
3. **P4** — once P2/P3 exist, parallax is a small addition.
4. **P5** — after narration workflow stabilizes.
5. Menu items opportunistically.

## What this changes elsewhere
- `ASSET_GENERATION_REGISTER.md` tool-selection: add "geometric transform / transition / 2.5D → Remotion" rows.
- `CHAINED_STILL_LESSONS.md`: parallax-2.5d family moves from AE → Remotion (P4).
- `theme.ts`: add named easing tokens (`cubic-bezier(0,0,.2,1)` etc.) so all motion is consistently eased.
- The NLE's role shrinks toward final grade + audio mix; transitions + motion move upstream into Remotion.
