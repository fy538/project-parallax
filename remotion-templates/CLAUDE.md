# Geopolitics Video Templates — Remotion Project

> Last updated: April 26, 2026

## What this is

A Remotion-based template library for producing educational geopolitics YouTube
videos. Templates are React components that render to MP4. Each template is
data-driven: feed it a JSON file and it generates the visual segment.

**15 compositions (11 landscape + 3 Shorts + EP01 master sequence) are built and functional.**
All templates use Zod schemas for runtime validation and `calculateMetadata` for dynamic durations.
EP01 ("The Silicon Trap") has 24 data files covering every visual beat in the
18-minute script. Templates now cover all 8 content identity directions defined
in CONTENT_IDENTITY.md.

## Workspace layout (/content/)

```
content/
├── project/                  # Project-level docs (vision, pipeline, decisions, research log, ideas)
├── episodes/                 # Per-episode work (scripts, briefs, research)
│   └── EP01-silicon-trap/    # Script-v3 finalized, 24 visual data files generated
├── remotion-templates/       # ← YOU ARE HERE — the Remotion project
├── skills/                   # Packaged .skill files (visual-spec, script-audit, persona-eval)
├── prompts/                  # Reusable prompt templates
└── archive/                  # One-off docs, old versions
```

## Remotion project structure

```
remotion-templates/
├── BRAND.md                              # Canonical design system (colors, type, timing)
├── CLAUDE.md                             # This file — project overview for AI sessions
├── IMAGES.md                             # Image treatment pipeline (duotone, grain, compositing)
├── LESSONS.md                            # Technical gotchas and iteration learnings
├── POLISH.md                             # Visual quality spec — checkable polish rules
├── package.json
├── remotion.config.ts
├── tsconfig.json                         # strict: false, noImplicitAny: false
├── vitest.config.ts                      # Test config (visual regression tests)
├── scripts/
│   ├── render-ep01.sh                    # Bash render script (all 24 EP01 clips)
│   ├── render-episode.mjs                # Node render script (universal, with --only/--from)
│   ├── deploy-lambda.mjs                 # Deploy Remotion Lambda (function + S3 site)
│   └── render-lambda.mjs                # Render via Lambda (single clip or full episode)
├── src/
│   ├── index.ts                          # Entry point (registerRoot)
│   ├── Root.tsx                          # Registers all 15 compositions in Folder groups
│   ├── declarations.d.ts                 # Manual types for react-simple-maps
│   ├── __tests__/                        # Visual regression tests (vitest + @remotion/renderer)
│   │   ├── setup.ts                      # Browser detection + test helpers
│   │   ├── render-helper.ts              # renderStill wrapper for snapshot tests
│   │   └── templates.test.ts             # Per-template frame snapshot tests
│   ├── design/
│   │   ├── theme.ts                      # Colors, fonts, layout, timing (as const)
│   │   └── fonts.ts                      # Font preloading via @remotion/google-fonts
│   ├── components/
│   │   ├── FadeIn.tsx                    # Fade + slide wrapper
│   │   ├── AnimatedText.tsx              # Word/character reveal
│   │   ├── Background.tsx                # Full-frame bg (gradient vignette + grain + border)
│   │   ├── MetadataStrip.tsx             # Branded header + footer chrome (∴ STRUCTURAL · PARALLELS)
│   │   └── Crosshair.tsx                 # Animated reticle (maps, data emphasis)
│   ├── hooks/
│   │   ├── index.ts                      # Barrel export for all hooks
│   │   ├── useCompositionAnimation.ts    # Auto Ken Burns drift + exit fade (wired into ALL templates)
│   │   ├── useEntrance.ts                # Semantic element entrance presets (hero/content/data/label/structure)
│   │   └── useDivider.ts                # Shared gradient divider animation
│   ├── utils/
│   │   ├── animation.ts                  # fadeIn, slideIn, stagger, springs, Ken Burns, exit fades
│   │   └── depth.ts                      # Shadows, accent glows, bar gradients, card styles
│   └── templates/
│       ├── ChoroplethMap/                # ✅ Phase-based country highlighting on world map
│       ├── RouteAnimation/               # ✅ Animated trade/supply routes between points
│       ├── TimelineComparison/           # ✅ Dual-column historical comparison timeline
│       ├── DataChart/                    # ✅ Bar charts, comparisons, animated data viz
│       ├── KineticTypography/            # ✅ Quote, definition, bilingual, statistic variants
│       ├── FrameworkDiagram/             # ✅ Comparison columns, flow diagrams, matrices
│       ├── TitleTransition/              # ✅ Episode title, section cards, end cards
│       ├── DecisionTree/                 # ✅ Branching scenario diagrams (Wargamer format)
│       ├── SplitComposition/             # ✅ Antipode vertical split (Translator/Dialectician)
│       ├── ProbabilityGauge/             # ✅ Confidence meters, market prices (Oracle format)
│       ├── ImageComposite/               # ✅ Duotone photo treatment (Time Collapse cinematic)
│       ├── Episodes/                     # ✅ Master compositions (EP01 — 24-clip Series)
│       └── Shorts/                       # ✅ Vertical 9:16 variants for TikTok/YouTube Shorts
│           ├── KineticShort.tsx           #    "Framework in 45 Seconds" series
│           ├── DataChartShort.tsx         #    "The Market Says..." series
│           └── SplitShort.tsx            #    "Both Sides Are Wrong" series
├── data/
│   └── episodes/
│       └── ep01/                         # 24 JSON data files for "The Silicon Trap"
│           ├── SEQUENCE.md               # Canonical render order (24 clips → 5 beats)
│           ├── title-*.json              # 7 title/section/endcard files
│           ├── choropleth-*.json         # 3 map compositions
│           ├── chart-*.json              # 5 data chart compositions
│           ├── kinetic-*.json            # 4 typography compositions
│           ├── framework-*.json          # 2 framework diagram compositions
│           ├── timeline-*.json           # 2 timeline compositions
│           └── route-*.json              # 1 route animation composition
└── public/
    └── geo/                              # Local TopoJSON (if needed for offline)
```

## Template reference

### 1. ChoroplethMap
Phase-based world map with country highlighting. Uses react-simple-maps + world-atlas@2 TopoJSON.
- **Variants:** Color ramp (value 0-1) or explicit fill colors per country
- **Data:** phases[] with title, subtitle, durationSec, countries[]
- **Key constraint:** Country names must exactly match TopoJSON properties ("United States of America", not "USA")
- **Sample data:** choropleth-supply-chain.json, choropleth-bifurcation.json, choropleth-reshoring.json

### 2. RouteAnimation
Animated lines between geographic points (trade routes, supply chains). Segments draw in with strokeDashoffset animation. Points pulse on first appearance.
- **Data:** points[] (with coordinates), segments[] (from/to indices), phases[]
- **Duration:** Auto-calculated from sum of phase durations
- **Sample data:** route-chip-supply.json

### 3. TimelineComparison
Dual-column timeline with left/right event tracks and optional connections between them.
- **Data:** leftEvents[], rightEvents[], connections[] (leftIndex → rightIndex)
- **Colors:** Configurable left/right colors (e.g., success green vs danger red)
- **Sample data:** timeline-oil-chips.json, timeline-deepseek.json

### 4. DataChart
Animated bar charts and comparison charts with growing bars and value labels.
- **Variants:** "bar" (standard bars) and "comparison" (side-by-side with vs divider)
- **Key fix applied:** Value labels use justifyContent: flex-end positioning so they sit directly above each bar's actual height (not floating at top of container)
- **Sample data:** chart-lithography.json, chart-export-controls.json, chart-kirin-teardown.json, chart-chips-everywhere.json, chart-pen-contrast.json

### 5. KineticTypography
Text-focused compositions with 4 sub-variants:
- **quote:** Word-by-word text reveal + attribution line
- **definition:** Chinese character + pinyin + translation + definition (character-by-character)
- **bilingual:** Chinese text above divider + English below
- **statistic:** Animated count-up number + label + context
- **Sample data:** kinetic-morris-chang.json, kinetic-kabozi.json, kinetic-7pct.json, kinetic-juguo.json

### 6. FrameworkDiagram
Analytical diagrams with 3 sub-variants:
- **comparison:** Side-by-side columns (2-column gets "vs" divider). Staggered item animations.
- **flow:** Sequential nodes connected by SVG arrow lines
- **matrix:** Grid with row/column headers and highlightable cells
- **Sample data:** framework-chess-go.json, framework-cocom-china.json

### 7. TitleTransition
Episode-level and section-level title cards with 3 sub-variants:
- **episode-title:** Ken Burns scale effect, animated divider, series name + episode label
- **section:** Large muted section number (I, II, III...) + section title
- **end-card:** CTA text + next episode teaser
- **Sample data:** title-episode.json, title-section-*.json, title-endcard.json

### 8. DecisionTree
Branching scenario/decision tree diagrams for Wargamer format episodes.
- **Data:** nodes[] (flat array with children refs), rootId, highlightedPath[]
- **Features:** Level-by-level reveal animation, probability labels, market price annotations, highlighted decision path with glow
- **Format fit:** Wargamer, Oracle (scenario analysis with Kalshi integration)

### 9. SplitComposition
Full-bleed vertical split (Antipode brand variant) for side-by-side analytical comparisons.
- **Data:** left{} and right{} with tag, title, items[], accentColor
- **Features:** Left-then-right reveal sequence (thesis→antithesis reading rhythm), center divider with label, subtle color tints per side, auto Chinese font detection
- **Format fit:** Translator, Dialectician

### 10. ProbabilityGauge
Probability visualizations for Oracle format and Kalshi prediction market layer.
- **Variants:** "gauge" (semicircular arc meters), "shift" (before/after probability transitions), "scorecard" (prediction track record grid)
- **Features:** Animated arc fill with spring physics, count-up numbers, market source badges, calibration scoring
- **Format fit:** Oracle, "Was I Right?" retrospectives, any episode using Kalshi data

### 11. ImageComposite
Treated photograph rendering with duotone pipeline per IMAGES.md.
- **Variants:** "background" (full-bleed + Ken Burns), "inset" (bordered frame), "portrait" (person with name strip)
- **Features:** CSS grayscale + duotone gradient overlay, film grain, vignette, text shadow for legibility
- **Format fit:** Time Collapse (historical photos), any cinematic moment

### 12. Shorts (vertical 9:16)
Three vertical compositions for TikTok/YouTube Shorts/Douyin at 1080×1920.
- **KineticShort:** Vertical quote/stat/definition — maps to "Framework in 45 Seconds" and "History Rhymes" series
- **DataChartShort:** Horizontal bar chart — maps to "The Market Says..." series
- **SplitShort:** Horizontal split (top vs bottom) — maps to "Both Sides Are Wrong" series
- **Shared:** Larger text for mobile, faster animation pace, tighter safe areas, no MetadataStrip

## Design system

See **BRAND.md** for the canonical color palette, typography scale, and animation timing.
See **POLISH.md** for the visual quality specification — concrete, checkable rules for animation, layout, depth, and typography that define the "done" bar.
See **IMAGES.md** for the image sourcing and treatment pipeline — duotone ramps, grain, compositing modes.
See **theme.ts** for the code implementation of the design system.

Key values:
- Resolution: 1920×1080 @ 30fps
- Safe area: 80px padding on all sides
- Brand: Meridian dual-mode system (dark: ink/bone/amber, light: paper/ink/oxblood)
- Shared palette: ink (#1A1A2E), amber (#E5A544), rust (#C23B22), bone (#F0E6D0), paper (#F5F0E8), oxblood (#6B1D1D)
- Semantic: us (#3266AD), china (#C23B22), neutral (#888780), highlight (#F5A623), success (#5DAA68), danger (#D64545)
- Fonts: Space Grotesk (display), IBM Plex Mono (body/metadata), JetBrains Mono (data), Noto Sans SC (Chinese)
- Timing helper: `sec(n)` converts seconds to frames

## How to create a new template

1. Create a folder under `src/templates/YourTemplate/`
2. Create: `types.ts` (data interfaces), `YourTemplate.tsx` (component), `index.tsx` (composition registration)
3. Register in `src/Root.tsx` inside the appropriate `<Folder>`
4. Add sample data in `data/episodes/ep01/`

### Component pattern

```tsx
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { palette, dark, fonts, layout, sec } from "../../design/theme";
import { fadeIn, stagger } from "../../utils/animation";
import { Background } from "../../components/Background";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import type { YourDataType } from "./types";

export const YourTemplate: React.FC<{ data: YourDataType }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { style: compStyle } = useCompositionAnimation();
  // Options: { noDrift: true } for maps, { noExit: true } if template has own exit
  return (
    <Background variant="dark">
      <AbsoluteFill style={compStyle}>
        {/* Content here gets Ken Burns drift + exit fade automatically */}
      </AbsoluteFill>
    </Background>
  );
};
```

## Animation utilities (src/utils/animation.ts)

- `fadeIn(frame, startFrame, duration)` → 0 to 1
- `fadeOut(frame, endFrame, duration)` → 1 to 0
- `fadeInOut(frame, start, visible, fadeDuration)` → in, hold, out
- `slideIn(frame, startFrame, distance, duration)` → offset to 0
- `scaleIn(frame, startFrame, duration)` → 0 to 1
- `gentleSpring(frame, fps, config?)` → smooth spring (less bouncy than default)
- `heroSpring(frame, fps, delay?)` → cinematic spring with more overshoot for hero elements
- `microSettle(frame, fps, delay?)` → high-damping settle after bar growth / counter finish
- `stagger(index, delayPerItem, baseDelay)` → start frame for sequential items
- `layerDelay(layer, baseDelay, gap)` → start frame per reveal layer (0=structure, 1=data, 2=labels)
- `kenBurnsDrift(frame, totalFrames, maxScale?)` → subtle scale drift (1.0 → 1.02)
- `panDrift(frame, totalFrames, maxOffset?)` → slow position drift (px)
- `exitFade(frame, totalFrames, exitDuration?)` → fade out over last N frames
- `pulse(frame, startFrame, duration?, peakScale?)` → scale pulse 1.0 → peak → 1.0

## Animation hooks (src/hooks/)

Three hooks enforce POLISH.md animation rules by default so templates don't need to remember which utility to call.

### useCompositionAnimation(options?)
**Wired into all 14 templates.** Provides automatic Ken Burns drift (1.0→1.02 scale + 6px pan) and exit fade (last 15 frames). Returns `{ style, frame, totalFrames, fps, exitOpacity, driftScale }`.

Configuration per template type:
- Standard templates (DataChart, KineticTypography, etc.): `useCompositionAnimation()` — full drift + exit
- Map templates (ChoroplethMap, RouteAnimation): `{ noDrift: true }` — exit fade only (maps have their own coordinate systems)
- Templates with own exits (TitleTransition, DecisionTree, SplitComposition, ProbabilityGauge, ImageComposite): `{ noExit: true }` — drift only
- Shorts (KineticShort, DataChartShort, SplitShort): `{ noDrift: true }` — exit fade only (too short/mobile for drift)

### useEntrance(role, startFrame?)
Semantic element entrance presets. Declare the element's *role* and get the right animation character:
- `"hero"` — spring physics (damping 12), scale 0.92→1.0, translateY 20→0px. For titles, key stats.
- `"content"` — ease-out 18 frames, translateY 15→0px. For general content blocks.
- `"data"` — ease-out 15 frames, scale 0.85→1.0. For chart bars, fills.
- `"label"` — quick 10-frame fade, translateY 6→0px. For captions, value labels.
- `"structure"` — near-instant 6-frame fade. For axes, grids, dividers.

Returns `{ opacity, scale, translateY, settled, style }`. Also: `useStaggeredEntrance(role, index, baseDelay, staggerFrames)` for lists.

### useDivider(startFrame?, options?)
Shared gradient divider animation (replaces 6+ duplicated patterns). Gradient line that fades at edges, draws in with eased progress.
Options: `color`, `width`, `height`, `duration`, `orientation` ("horizontal"|"vertical").
Returns `{ progress, opacity, lineStyle, animatedSize }`.

## Depth utilities (src/utils/depth.ts)

- `contentShadow(isDark?)` → subtle lift shadow for content-layer elements
- `mediumShadow(isDark?)` → stronger shadow for highlighted elements
- `accentGlow(color, spread?)` → colored halo glow for accent-layer elements
- `highlightShadow(color, isDark?)` → combined content shadow + accent glow
- `textShadow(isDark?)` → subtle text lift for body text on dark backgrounds
- `barGradient(baseColor)` → top-to-bottom gradient for chart bars (15% darker at bottom)
- `gradientDivider(color, widthPercent?)` → centered fade-edge divider styles
- `cardStyle(isDark?, highlighted?)` → consistent card padding + shadow + border
- `lightenHex(hex, amount)` / `darkenHex` (internal) → hex color math

## Shared components

- `<FadeIn startFrame={n} direction="up" distance={30}>` — fade + slide wrapper
- `<AnimatedText text="..." mode="word" startFrame={n} />` — word/character reveal
- `<Background variant="dark|light|map" border? noGrain?>` — layered background (gradient vignette + film grain + optional ruled border)
- `<MetadataStrip episodeNumber={1} episodeTitle="..." date="..." scale="..." variant="dark">` — branded header (∴ STRUCTURAL · PARALLELS) + footer (REC + scale + date)
- `<Crosshair x={960} y={540} startFrame={30} size={64} color? opacity?>` — animated reticle with draw-in sequence (hairlines → outer circle → inner circle → dot pulse)
- `<Callout annotations={[{type, x, y, ...}]} startFrame={n}>` — arrows, circles, and bracket annotations with staggered SVG draw-in

## Rendering

```bash
# Preview in Remotion Studio (local machine)
npm start

# Render a composition to MP4
npx remotion render src/index.ts ChoroplethMap out/map.mp4

# Render a single frame as PNG (for QA)
npx remotion still src/index.ts ChoroplethMap --frame=60 --output=frame.png

# Override data via props
npx remotion render src/index.ts ChoroplethMap out/map.mp4 --props='{"data":{...}}'

# In Claude's sandbox, use Playwright's Chromium:
npx remotion still src/index.ts ChoroplethMap --frame=60 \
  --browser-executable=$(find ~/.cache/ms-playwright -name "headless_shell" | head -1) \
  --output=frame.png
```

## Skills (in /content/skills/ as .skill files)

- **visual-spec-v2.skill** — Reads a script, produces visual breakdown table, generates all JSON data files after approval. References BRAND.md and LESSONS.md.
- **script-audit.skill** — Audits scripts for broken transitions, lecture patterns, pacing, unverified claims
- **persona-eval.skill** — Evaluates scripts through 5 audience personas for resonance

## Zod schemas + calculateMetadata

Every template has a `schema.ts` file with Zod validation. Schemas are wired into `<Composition schema={...}>` which enables runtime prop validation and visual editing in Remotion Studio. All compositions use `calculateMetadata` to derive `durationInFrames` dynamically from the `durationSec` field in JSON data — no more hardcoded frame counts.

## Font preloading (src/design/fonts.ts)

Uses `@remotion/google-fonts` to preload all four Meridian brand fonts: Space Grotesk, IBM Plex Mono, JetBrains Mono, Noto Sans SC. Imported in Root.tsx so fonts are guaranteed loaded before the first frame renders.

## Performance memoization

Expensive per-frame computations (Math.max, color scale builds, BFS layout, bar width calcs) are wrapped in `useMemo`. Pure sub-components (AnimatedBar, ComparisonBars, TreeNodeComponent, etc.) use `React.memo` to skip re-renders when frame-independent props haven't changed.

## EP01 master composition (src/templates/Episodes/)

A `<Series>` composition that stitches all 24 EP01 clips into one continuous ~191s video. 15-frame overlaps between clips provide cross-fade transitions. Render with `npx remotion render src/index.ts EP01 out/ep01-full.mp4`.

## Rendering & Assembly

Four render scripts live in `scripts/`:

- **`render-ep01.sh`** — Bash version, straightforward. `bash scripts/render-ep01.sh` renders all 24 clips.
- **`render-episode.mjs`** — Node version, more robust (writes props to temp files to avoid shell escaping). Supports `--only=05,06` and `--from=16` for partial renders.
- **`deploy-lambda.mjs`** — Deploys Remotion Lambda (function + S3 site). Run once, outputs env vars.
- **`render-lambda.mjs`** — Renders via Lambda. `--comp=DataChart --props=...` for single clips, `--episode=ep01` for all 24.

Local render scripts:
- Read JSON data files, wrap as `{"data": ...}` props, pass to `npx remotion render`
- Output numbered MP4s to `out/ep01/` (e.g., `01-title-episode.mp4`)
- Support `--preview` mode (renders stills at frame 90 instead of MP4)
- Support `--concat` to concatenate all clips into a preview reel via ffmpeg
- Auto-detect Playwright Chromium for sandbox rendering

**Sequence map:** `data/episodes/ep01/SEQUENCE.md` defines the canonical render order — which composition plays when, mapped to script beats.

## Testing

Visual regression tests in `src/__tests__/` using Vitest + `@remotion/renderer`. Each test renders frame 30 of a composition, saves/compares baseline PNGs. Run with `npm test`. First run creates baselines; subsequent runs detect regressions.

```bash
npm test              # Run all visual regression tests
npm run test:baseline # Regenerate baselines after intentional changes
```

## EP01 status: "The Silicon Trap"

- Script: v3 finalized (episodes/EP01-silicon-trap/script-v3.md)
- Data files: 24/24 generated and validated
- Visual QA: 20/24 passed (4 maps need local Remotion Studio for CDN access)
- Sequence map: Complete — 24 clips mapped to 5 beats + opening/closing
- Render pipeline: Two scripts ready (bash + Node)
- Narration: Not yet recorded
- Final assembly: Render clips → import to NLE → place on timeline with narration

## Known issues and constraints

See **LESSONS.md** for the full technical reference. Key ones:
- Map templates (ChoroplethMap, RouteAnimation) need network access for TopoJSON CDN — won't render geography in sandboxed environments, but work fine in local Remotion Studio
- react-simple-maps has no @types package — manual declarations in src/declarations.d.ts
- theme.ts uses `as const` creating readonly tuples — all code consuming color ramps must use `readonly string[]` types
- tsconfig.json has strict: false to accommodate third-party library typing gaps

## Content context

**Structural Parallels** — Bilingual (EN/CN) YouTube/Bilibili channel analyzing geopolitics through historical
analogy and philosophical frameworks. Tone: intellectually rigorous but narratively
engaging. Visual references: CaspianReport (maps), Wendover (infographics), PolyMatter
(clean data viz).
