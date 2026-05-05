# Remotion AI Workflow Research — May 2026

> What others are doing, what tools exist, and what Parallax should adopt.

---

## 1. The New Standard: Remotion Agent Skills

Since January 2026, Remotion ships **official Agent Skills** — a set of 30+ rule files that teach AI coding assistants (Claude Code, Cursor, Codex) how to write correct, production-quality Remotion code.

### What's in the official skill (`remotion-dev/skills`)

| Rule File | What It Teaches |
|-----------|----------------|
| `timing.md` | Bézier easing curves, spring physics, composing interpolations |
| `text-animations.md` | Typewriter effects, word highlighting |
| `transitions.md` | `TransitionSeries`, fade/slide/wipe/flip/clockWipe, overlays |
| `light-leaks.md` | WebGL light leak overlays (`@remotion/light-leaks`) |
| `sfx.md` | Built-in sound effects library (whoosh, page-turn, shutter, etc.) |
| `sequencing.md` | `Sequence`, `Series`, premounting, nested timing |
| `audio-visualization.md` | Spectrum bars, waveforms, bass-reactive effects |
| `3d.md` | Three.js + React Three Fiber integration |
| `mapbox.md` | Map animations with Mapbox GL |
| `html-in-canvas.md` | WebGL effects via `<HtmlInCanvas>` |
| `measuring-text.md` | Text fitting, overflow detection |
| `voiceover.md` | AI-generated voiceover via ElevenLabs |

### Installation

```bash
# From within your remotion-templates/ directory:
npx skills add remotion-dev/skills
```

This gives Claude Code (or any AI assistant working on the project) instant access to all best practices when generating or modifying compositions.

---

## 2. Key Techniques We Should Adopt

### A. `@remotion/light-leaks` (WebGL-based)

**What:** A real-time light leak overlay that reveals and retracts. WebGL-rendered, so it looks organic rather than canned.

**Why it matters for us:** Our transitions between compositions currently cut or fade. Light leaks add cinematic warmth — especially at section transitions (Beat 1 → Beat 2). Can be hue-shifted to match our palette (gold = ~45°, rust/conflict = ~15°).

```tsx
import { TransitionSeries } from "@remotion/transitions";
import { LightLeak } from "@remotion/light-leaks";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={sec(8)}>
    <DataChart data={chartData} />
  </TransitionSeries.Sequence>
  <TransitionSeries.Overlay durationInFrames={sec(1)}>
    <LightLeak seed={3} hueShift={45} />  {/* Gold-tinted */}
  </TransitionSeries.Overlay>
  <TransitionSeries.Sequence durationInFrames={sec(10)}>
    <FrameworkDiagram data={frameworkData} />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

**Action:** `npx remotion add @remotion/light-leaks` and integrate into FullEpisode.tsx transition logic.

---

### B. TransitionSeries (replaces our custom Transitions.tsx?)

**What:** Remotion's official transition system. Supports fade, slide, wipe, flip, clock-wipe with spring or linear timing. Handles duration math automatically (overlapping scenes shorten total).

**Current state:** We built `Transitions.tsx` with 9 custom types. Worth comparing — theirs handles duration calculation and premounting natively.

**Action:** Evaluate whether `@remotion/transitions` + our custom visual treatments is better than maintaining our own system.

---

### C. Bézier Easing Best Practices

The official timing guide recommends these exact curves:

```ts
// Crisp entrance (strong ease-out, no overshoot) — for UI elements appearing
Easing.bezier(0.16, 1, 0.3, 1)

// Editorial / slow fade (balanced ease-in-out) — for cinematic moves
Easing.bezier(0.45, 0, 0.55, 1)

// Playful overshoot — for emphasis moments (stat reveals, etc.)
Easing.bezier(0.34, 1.56, 0.64, 1)
```

**Compare to ours:** Check what easing curves our templates use. The "editorial" curve (0.45, 0, 0.55, 1) is specifically what gives motion that "documentary" feel vs. snappy UI feel.

---

### D. Sound Effects Library

Remotion now ships `@remotion/sfx` with built-in sounds:
- `whoosh.wav` — transitions
- `page-turn.wav` — section changes
- `shutter-modern.wav` — stat reveals
- `switch.wav` — toggle moments

**Relevance:** Our audio-spec skill defines 3-layer audio (music bed + transition SFX + texture hits). These built-in SFX could serve as placeholders or even production audio for Layer 2 transition cues.

---

## 3. Community Templates (81 Free, MIT Licensed)

Repository: `github.com/reactvideoeditor/remotion-templates`

### Templates worth studying for polish techniques:

| Template | Technique to steal |
|----------|-------------------|
| `bokeh-circles.tsx` | Deterministic bokeh with sin-wave drift + breathing size (similar to our Background.tsx but simpler implementation) |
| `film-burn.tsx` | Multi-layer radial gradients with animated positions for organic light leak (non-WebGL fallback) |
| `cinematic-title-intro.tsx` | Spring-based title entrance with animated underline reveal |
| `letterbox-reveal.tsx` | Animated letterbox bars revealing content (cinematic framing) |
| `particle-explosion.tsx` | 150 spring-driven particles with `random()` seeding |
| `parallax-pan.tsx` | Multi-layer parallax on images |

### Key observation:

Most community templates are **simpler than ours** — single-effect components without the layered design system (no Background, no MetadataStrip, no crosshair). They use generic colors (`#111827`, blue/purple gradients) rather than a coherent brand palette.

**Our advantage:** We have a full design system. Their advantage: each effect is isolated and clearly readable, making it easy to steal individual animation patterns.

### ⚠️ Anti-pattern spotted:

The `ken-burns.tsx` and `parallax-pan.tsx` templates use **CSS `@keyframes` animations** — which the official Remotion docs explicitly say are FORBIDDEN (they don't render correctly in frame-based output). Only `useCurrentFrame()` + `interpolate()` is correct. Our codebase correctly uses frame-based animation.

---

## 4. The AI-Assisted Iteration Loop (What's New in 2026)

The production workflow others are using:

```
1. Open Remotion Studio (npm start) → see compositions live
2. Describe change to Claude Code: "make the bars enter with more dramatic stagger,
   add a subtle glow on the hero bar, slow down the exit fade"
3. Claude writes the code change using official skill knowledge
4. Studio hot-reloads → see result instantly
5. Iterate conversationally until cinematic
```

**Time per iteration:** ~30 seconds (describe → code generates → hot reload)
**vs. manual editing:** ~3-5 minutes per change (find file → understand structure → edit → save → check)

### The "Prompt to Motion Graphics" SaaS pattern:

Remotion's official template (`template-prompt-to-motion-graphics-saas`) shows the pipeline:
1. Validate prompt (is this a visual?)
2. Detect which "skill" (pattern library) to apply
3. Generate React component code
4. Strip imports, compile in-browser via Babel
5. Preview with all Remotion APIs injected

**Relevance for us:** We don't need the SaaS wrapper, but the skill-detection + code-generation pattern is exactly what our Cowork skills already do (visual-spec generates JSON). The difference is they generate *entire compositions* from prompts, while we generate *data files* that feed fixed templates.

---

## 5. Gaps in Our Current System

| Gap | What exists in ecosystem | Priority |
|-----|--------------------------|----------|
| No light leaks between scenes | `@remotion/light-leaks` (WebGL, official) | HIGH |
| No built-in SFX | `@remotion/sfx` with whoosh/page-turn/shutter | MEDIUM |
| Custom transition system | Could use `@remotion/transitions` TransitionSeries | EVALUATE |
| No AI-assisted iteration | Install official Agent Skills | HIGH |
| Easing curves not audited | May be using defaults instead of editorial beziers | AUDIT |
| No letterbox framing | Community template pattern, easy to add | LOW |

---

## 6. Recommended Actions

### Immediate (this session):
1. **Install `@remotion/light-leaks`** — adds cinematic transition overlays
2. **Install official Remotion Agent Skills** into the project — enables AI-assisted polish iteration
3. **Audit easing curves** across all templates — replace any `Easing.linear` or plain springs with editorial beziers

### Next session:
4. **Run `npm start`** and watch every composition in Studio — judge actual render quality
5. **Pick 3 templates that feel most "PowerPoint"** and iterate them conversationally with Claude Code using the installed skills
6. **Add letterbox reveal** as a transition variant for section openings

### Later:
7. Evaluate `@remotion/transitions` TransitionSeries vs. our custom Transitions.tsx
8. Integrate `@remotion/sfx` as Layer 2 placeholder audio
9. Consider audio-visualization for any music-reactive moments

---

## 7. Sources

- Official Remotion AI docs: https://remotion.dev/docs/ai/
- Agent Skills: https://remotion.dev/docs/ai/skills
- Claude Code + Remotion guide: https://remotion.dev/docs/ai/claude-code
- Prompt to Motion Graphics template: https://github.com/remotion-dev/template-prompt-to-motion-graphics-saas
- Community templates (81): https://github.com/reactvideoeditor/remotion-templates
- ClippKit component library: https://github.com/reactvideoeditor/clippkit
- Custom transitions skill: https://github.com/Ashad001/remotion-transitions
- Remotion Best Practices: https://skills.sh/remotion-dev/skills/remotion-best-practices
- Quality Guide: https://remotion.dev/docs/quality
