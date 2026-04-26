# Lessons Learned — Technical Gotchas & Iteration Log

> Every hard-won lesson from building and iterating on templates.
> Read this before making changes — it prevents re-discovering known issues.
>
> Last updated: April 26, 2026

---

## TypeScript / Remotion

### L1: readonly tuples from `as const` break mutable array assignments
**Problem:** `theme.ts` uses `as const` on color ramp arrays (e.g., `rampBlue: ["#E6F1FB", ...] as const`), which creates `readonly` tuples. These can't be assigned to `string[]` parameters.
**Fix:** Any code consuming color ramps must declare parameters as `readonly string[]`, not `string[]`. Applied to `rampLookup` (type `Record<string, readonly string[]>`), `getColorRamp` (return type `readonly string[]`), and `getCountryFill` (parameter type `readonly string[]`) in ChoroplethMap.
**Rule:** When adding new functions that accept theme colors, always use `readonly` array types.

### L2: react-simple-maps has no @types package
**Problem:** `npm install @types/react-simple-maps` fails — the package doesn't exist.
**Fix:** Created `src/declarations.d.ts` with manual type declarations for ComposableMap, Geographies, Geography, Marker, and Line components with their prop interfaces.
**Rule:** If adding new react-simple-maps components (e.g., Annotation, Sphere), add their types to declarations.d.ts.

### L3: tsconfig strict mode disabled for pragmatism
**Problem:** Multiple third-party libraries (react-simple-maps, Remotion internals) produced implicit `any` errors under strict mode that couldn't be resolved without excessive type gymnastics.
**Fix:** Set `strict: false` and `noImplicitAny: false` in tsconfig.json. This is a deliberate trade-off — we get faster iteration at the cost of some type safety.
**Rule:** Don't re-enable strict mode unless all third-party type issues are resolved first.

### L4: Composition duration must be calculated, not hardcoded
**Pattern:** For templates with phases (maps, routes, timelines), calculate `durationInFrames` from the sum of phase durations in the JSON data: `sec(data.phases.reduce((sum, p) => sum + p.durationSec, 0) + 1)`. The `+1` adds a 1-second buffer for fade-out.
**Why:** Hardcoded durations desync when phase durations change in the JSON.

---

## Rendering & Self-QA

### L5: Remotion ignores PUPPETEER_EXECUTABLE_PATH env var
**Problem:** Setting `PUPPETEER_EXECUTABLE_PATH` or `REMOTION_CHROME_EXECUTABLE` environment variables does nothing. Remotion tries to download its own Chrome from `remotion.media`, which fails in sandboxed environments.
**Fix:** Use the CLI flag `--browser-executable=/path/to/chrome` on every `remotion still` or `remotion render` command.
**Setup:** Install Playwright's Chromium with `npx playwright install chromium`, then find the binary with `find ~/.cache/ms-playwright -name "headless_shell" | head -1`.

### L6: Map templates won't render geography in sandboxed environments
**Problem:** ChoroplethMap and RouteAnimation fetch TopoJSON from `cdn.jsdelivr.net` at render time. Sandboxed environments (Claude's Linux shell) can't reach this CDN, so maps render with no country outlines.
**Workaround:** Maps render correctly in local Remotion Studio (`npm start`). For QA in sandbox, test non-map templates (charts, typography, titles, frameworks) which don't need external data.
**Future fix:** Bundle TopoJSON in `public/geo/` for fully offline rendering.

### L7: Self-render QA loop
**Process:** `npx remotion still` renders a single frame as PNG → Read the PNG with Claude's image tool → critique against BRAND.md rules → edit code → re-render. This loop works for all non-map templates in sandbox.
**Key frames to check:** frame 0 (initial state), frame at ~40% (mid-animation), final frame -1 (completed state).
**Validated on:** DataChart (frame 60 + frame 180), confirming bar growth and label positioning.

---

## DataChart

### L8: Bar value labels must use flex-end positioning, not absolute/fixed
**Problem (original):** Value labels (e.g., "93%") were positioned at the top of a fixed-height container column. For short bars, labels floated far above the bar, looking disconnected.
**Fix:** Restructured `AnimatedBar` component to use a column with `justifyContent: "flex-end"`. The value label and bar rect are direct children of this column. Labels naturally sit directly above whatever height the bar has reached.
**Lesson:** Never position data labels relative to the container ceiling. Position them relative to the data element they annotate.

### L9: Chart comparison variant needs explicit "vs" visual
**Pattern:** The "comparison" variant of DataChart places two bar groups side by side with a "vs" divider in the center. Each side has its own accentColor. This is used for fact-check style visuals (e.g., Kirin chip "marketing 5nm" vs "actual 7nm").

---

## ChoroplethMap

### L10: Country names must exactly match TopoJSON properties
**Problem:** Using "USA" or "US" won't match. The world-atlas@2 TopoJSON uses full names from Natural Earth data.
**Required names (common ones):**
- "United States of America" (not USA/US)
- "United Kingdom" (not UK/Britain)
- "South Korea" (not Republic of Korea)
- "Taiwan" (in world-atlas@2, listed as "Taiwan")
- "Russia" (not Russian Federation)
- "Iran" (not Islamic Republic of Iran)
**Rule:** Always check against the actual TopoJSON feature names. When in doubt, fetch and inspect the topology.

### L11: Phase transitions need overlapping fade
**Pattern:** When a country changes color between phases, the transition is a hard cut by default. For smoother transitions, use `interpolateColors` with a brief overlap window at phase boundaries. Currently not implemented — add if visual QA reveals jarring cuts.

---

## KineticTypography

### L12: Statistic variant parses numeric prefix
**Pattern:** The statistic variant extracts the numeric portion from `statValue` (e.g., "7%" → 7, "93%" → 93) and animates a count-up. The suffix (%, B, M, etc.) is preserved. If the value starts with a non-numeric character, it displays as static text.
**Gotcha:** Decimals work but animate in integer steps. For "3.5nm", it counts 0, 1, 2, 3, 3.5 — which looks slightly uneven.

### L13: Chinese text needs explicit font-family
**Rule:** Any `<span>` or `<div>` rendering Chinese characters must explicitly set `fontFamily: fonts.chinese` ("Noto Sans SC, PingFang SC, sans-serif"). Inter does not contain CJK glyphs and will fall back to system fonts inconsistently across render environments.

---

## RouteAnimation

### L14: Coordinates are [longitude, latitude], not [lat, lng]
**Convention:** react-simple-maps and D3 use `[longitude, latitude]` (x, y) order. Google Maps uses `[latitude, longitude]`. This is a common source of points appearing in the wrong ocean.
**Common coordinates:**
- Washington DC: [-77.0, 38.9]
- Beijing: [116.4, 39.9]
- Taipei: [121.5, 25.0]
- Tokyo: [139.7, 35.7]
- Seoul: [127.0, 37.6]
- Amsterdam: [4.9, 52.4]
- Singapore: [103.8, 1.4]

### L15: Segment stroke animation accumulates across phases
**Pattern:** `activeSegments` and `activePoints` accumulate — once drawn in a phase, they remain visible in subsequent phases. This is deliberate: routes build up over time rather than disappearing between phases.

---

## FrameworkDiagram

### L16: Comparison column width depends on column count
**Pattern:** 2-column comparisons get a "vs" divider between them. 3+ columns share space equally without a divider. The layout adjusts automatically, but content should be written accordingly — 2-column items can be slightly longer.

---

## TitleTransition

### L17: Ken Burns effect on episode titles
**Pattern:** Episode title variant applies a subtle scale animation (1.02 → 1.0 via Easing.out) creating a cinematic "settling" feel. This is small enough to not be distracting but adds production value.

### L18: Section number uses large muted style
**Pattern:** Section numbers (I, II, III, IV, V) render at 120px in muted color as background texture, with the section title at normal heading size in front. The number provides visual weight without competing with the title text.

---

## Data Pipeline

### L19: JSON data file naming convention
**Format:** `{template-type}-{descriptive-slug}.json`
**Examples:** `choropleth-bifurcation.json`, `kinetic-juguo.json`, `chart-export-controls.json`, `title-section-denial.json`
**Rule:** Slugs should be descriptive enough to identify the content without opening the file. Use lowercase, hyphens only.

### L20: Color values in JSON should match BRAND.md tokens
**Rule:** Never invent new hex colors in data files. Always use values from BRAND.md's semantic palette or sequential ramps. This allows global retheming by updating BRAND.md + theme.ts.
**Shared palette:** #1A1A2E (ink), #E5A544 (amber), #C23B22 (rust), #F0E6D0 (bone), #F5F0E8 (paper), #6B1D1D (oxblood)
**Semantic colors:** #3266AD (us), #C23B22 (china), #888780 (neutral), #F5A623 (highlight), #5DAA68 (success), #D64545 (danger)

---

## Skills

### L21: Skill files are zip archives with .skill extension
**Structure:** A `.skill` zip contains a folder with the skill name, which contains `SKILL.md` (instructions) and optionally `references/` (supporting docs).
**Installation:** Skills are installed to the Claude skills directory and become available as slash commands.
**Constraint:** The skills directory in sandbox is read-only. Build skills in the outputs directory, then package as .skill zip.

### L22: Visual-spec skill requires human checkpoint
**Pattern:** The skill produces a visual breakdown table first, then waits for user approval before generating JSON files. This prevents wasted effort if the visual plan doesn't match the creator's vision. Never skip this checkpoint.

---

## General

### L23: Duration calibration rule of thumb
- Simple title card: 3 seconds
- Section header: 3 seconds
- Single data point or quote: 4-5 seconds
- Multi-phase map or chart: 4-5 seconds per phase
- Complex framework with multiple items: 10-15 seconds total
- End card with CTA: 5 seconds
**Rule:** Viewer needs ~2 seconds to read a subtitle + 1 second per complex element on screen. When in doubt, add time — too fast loses viewers, too slow just gets skipped.

### L24: QA render frame selection matters
**Context:** When rendering single frames for QA, elements with staggered fade-ins may not be visible at early frames.
**Rule of thumb:** Render at frame 45 (1.5s) for initial state, frame 90 (3s) for mid-state with most elements visible, and frame at `durationInFrames - 30` for final state. For the episode title, the subtitle doesn't appear until ~frame 60. For end cards, the next-episode teaser fades in at frame 45. Always render at least two frames to catch animation timing issues.

### L25: Sample data files may not match episode data
**Problem (caught in QA):** `title-episode.json` still contained old sample data ("The Chip War") from when the template was first built, not the actual EP01 title ("The Silicon Trap"). The visual-spec skill generated section titles and new compositions but didn't update the original sample file.
**Rule:** After running visual-spec, always diff the generated files against any pre-existing sample data files in the episode directory. Sample data created during template development may be stale.

### L26: Composition IDs in Root.tsx must be unique
**Pattern:** Each `<Composition id="...">` in Root.tsx must be globally unique. Convention: use the template name for the default composition (e.g., "ChoroplethMap") or add a suffix for multiple compositions of the same type (e.g., "ChoroplethMap-bifurcation"). Currently, each template registers one default composition; episode-specific overrides use `--props`.

### L27: EP01 visual QA results (April 25, 2026)
**Status:** All non-map templates rendered and reviewed. Zero template code bugs found. One data issue fixed (L25).
**Templates verified:** TitleTransition (7 compositions), KineticTypography (4), DataChart (5), FrameworkDiagram (2), TimelineComparison (2). Total: 20/24 compositions rendered. Remaining 4 are maps (ChoroplethMap ×3, RouteAnimation ×1) which require CDN access — verified working in local Remotion Studio previously.

---

## Assembly & Render Pipeline

### L28: Props must be passed via temp file, not inline JSON
**Problem:** Complex JSON data (especially with quotes, special characters, or nested objects) breaks when passed as inline `--props='...'` in shell commands. Bash escaping is fragile and error-prone.
**Fix:** Write props to a temp file (`_props-XX.json`), pass `--props=path/to/file.json` to Remotion. Both render scripts use this pattern.
**Rule:** Never inline props JSON for data files with quotes, Chinese characters, or deeply nested objects.

### L29: Render scripts output numbered clips, not a single video
**Pattern:** Each composition renders to its own MP4: `01-title-episode.mp4`, `02-title-section-act1.mp4`, etc. These are NLE-ready assets placed on a timeline alongside narration audio and B-roll. The `--concat` flag produces an optional preview reel (all clips back-to-back) for quick review, but the real assembly happens in the NLE.
**Why:** Motion graphics total ~3.5 minutes across an ~18-minute episode. They overlay narration — they don't replace it. Concatenation alone can't produce the final video.

### L30: Sequence map is the source of truth for render order
**Pattern:** `data/episodes/epXX/SEQUENCE.md` defines the canonical order. Both render scripts mirror this sequence exactly. When adding or reordering compositions, update SEQUENCE.md first, then update the scripts.
**Rule:** Never change render order in scripts without updating SEQUENCE.md, and vice versa.

### L31: Playwright cache path differs between macOS and Linux
**Problem:** Render scripts used `~/.cache/ms-playwright` (Linux path). On macOS, Playwright installs to `~/Library/Caches/ms-playwright`. Combined with `set -euo pipefail`, the `find` on a nonexistent directory caused the entire script to exit silently with no output.
**Fix:** Search both paths. Also removed `set -e` from render scripts — errors are handled per-command instead. On macOS, the Chrome binary may be named `Google Chrome for Testing` rather than `headless_shell`.
**Fallback chain:** Playwright Chromium → system Chrome (`/Applications/Google Chrome.app/...`) → Remotion default.
**Rule:** Always test render scripts on the actual target OS. Silent failures from `set -e` are the worst kind of bug.

### L32: First render in a batch hits Remotion cold-start race condition
**Problem:** The first `npx remotion render` in a batch frequently fails with "Visited http://localhost:3000/index.html but got no response." Subsequent renders succeed because the internal server is warm.
**Fix:** Added retry logic (2 attempts per clip) and a 1-second cooldown between renders in the bash script. The Node script can re-run failed clips with `--only=01`.
**Rule:** Always include retry logic in batch render scripts. Remotion's internal server needs a moment to spin up on the first render.

---

## Polish Components (April 26, 2026)

### L33: Background.tsx layers must be pointer-events: none
**Pattern:** Background overlays (grain, vignette, ruled border) all set `pointerEvents: "none"` so they don't intercept clicks in Remotion Studio. Only the children layer receives events.
**Grain setup:** noise-512.png is a 512×512 monochromatic Gaussian noise PNG tiled via CSS `backgroundRepeat`. Mix-blend-mode: `overlay` at 12% (dark) or `multiply` at 4% (light).

### L34: MetadataStrip positions within safe area, not at edge
**Pattern:** Header sits at `top: safeArea.top - 40` (40px, halfway into the 80px safe margin). Footer at `bottom: safeArea.bottom - 40`. This keeps metadata visible but clearly subordinate to content, which lives inside the full 80px safe area.
**Typography:** All metadata text uses IBM Plex Mono at 11px, weight 400, letter-spacing 2.5px, uppercase. This is the smallest text tier in the system.

### L35: Crosshair animation phases overlap for fluidity
**Pattern:** The crosshair draw-in is NOT strictly sequential. Outer circle starts drawing at 30% through the hairline extension, inner circle appears at 60% through the outer circle draw. This overlap prevents a "step by step" robotic feel. The center dot appears last and pulses once (scale 1 → 1.3 → 1) for the "lock-on" moment.
**Sizing:** Default 64px diameter outer circle. For maps, use 48-80px depending on the geographic area being targeted.

### L36: depth.ts barGradient darkens by 15% — matches POLISH.md V4
**Pattern:** `barGradient(baseColor)` creates a `linear-gradient(to bottom, base, darkenHex(base, 0.15))`. This simulates overhead lighting on chart bars. The darken function is channel-wise multiplication, not HSL shift — fast and predictable for hex colors.
**Rule:** Never use flat `backgroundColor` for chart bars. Always wrap in `barGradient()`.

### L37: Animation system has three spring configs for different purposes
**Configs:**
- `gentleSpring` — damping 15, stiffness 80, mass 0.8 → smooth, no visible bounce. For UI elements.
- `heroSpring` — damping 12, stiffness 100, mass 1.0 → slight overshoot, cinematic feel. For titles, key stats.
- `microSettle` — damping 25, stiffness 200, mass 0.5 → tiny settle after growth. For bar completion, counter finish.
**Rule:** Match spring to element importance: hero > gentle > micro. Never use the same spring for everything.

---

## New Templates (April 26, 2026)

### L38: DecisionTree layout is level-based, not recursive render
**Pattern:** Tree nodes are positioned by computing levels first (BFS from root), then spreading siblings horizontally within each level. This is simpler than recursive rendering and avoids React re-render issues with deeply nested trees.
**Sizing:** Default node is ~160×60px. For trees wider than 5 leaves, nodes shrink automatically. Keep trees shallow (3-4 levels max) for readability — deeper trees should be split into multiple compositions.

### L39: SplitComposition uses auto Chinese font detection
**Pattern:** A `hasChinese(text)` helper checks for CJK characters via regex (`/[一-鿿]/`). When detected, `fontFamily` switches from `fonts.display` to `fonts.chinese`. This runs per text element, so mixed content (English title, Chinese items) works correctly.
**Rule:** Always use this pattern when text comes from JSON data that might contain Chinese. Don't assume language based on the template variant.

### L40: ProbabilityGauge arc animation uses strokeDasharray
**Pattern:** Semi-circular gauges are SVG circles with `strokeDasharray` set to half the circumference (180° arc). The fill animates by interpolating `strokeDashoffset` from full to the target percentage. This is more reliable than SVG arc paths for animation because dashoffset is a single numeric value.
**Gotcha:** The arc's visual "start" position depends on `transform: rotate(-90deg)` on the circle element. Without this, the arc starts at 3 o'clock instead of 12 o'clock.

### L41: ImageComposite duotone is CSS-based, not pixel-level
**Pattern:** True duotone (per-pixel remap) requires canvas or WebGL, which is heavy in Remotion. The template approximates duotone with: `filter: grayscale(100%) contrast(1.1)` + a gradient overlay using the duotone ramp colors at 40-60% opacity. This looks 80% as good at 1% of the complexity. For pixel-perfect duotone, preprocess images outside Remotion per IMAGES.md.

### L42: Shorts vertical layout uses shortsLayout constants, not layout
**Pattern:** The `shortsLayout` object in `Shorts/types.ts` defines 1080×1920 dimensions with tighter safe areas (48px sides, 100px top, 120px bottom). The larger bottom safe area accounts for mobile UI overlaps (share button, comments). Templates import `shortsLayout` instead of `layout` for all positioning.
**Rule:** Never use `layout.safeArea` in Shorts components — those are for 1920×1080 landscape.

### L43: Shorts data schemas reuse landscape types
**Pattern:** Vertical Shorts use the exact same JSON data schemas as their landscape counterparts. `KineticShort` accepts `QuoteData`, `DataChartShort` accepts `DataChartData`, etc. This means the same JSON file can render in both landscape and vertical — just change which composition renders it.
**Benefit:** No schema duplication. The visual-spec skill doesn't need separate Shorts logic — it generates one JSON, and you choose the composition at render time.

---

## Animation Hooks Architecture

### L44: useCompositionAnimation enforces Ken Burns + exit fade by default
**Pattern:** Every template calls `useCompositionAnimation()` and wraps its content in `<AbsoluteFill style={compStyle}>`. The hook auto-applies Ken Burns drift (1.0→1.02 scale + 6px pan) and exit fade (last 15 frames opacity ramp). Templates that need exceptions use options: `{ noDrift: true }` for maps/Shorts, `{ noExit: true }` for templates with custom exit logic.
**Rule:** New templates MUST call this hook. Never implement Ken Burns or exit fade manually — that's the hook's job.
**Convention:** Standard = `()`, Maps = `{ noDrift: true }`, Own-exit = `{ noExit: true }`, Shorts = `{ noDrift: true }`.

### L45: useEntrance separates animation character from animation timing
**Pattern:** Templates declare an element's semantic *role* (`"hero"`, `"content"`, `"data"`, `"label"`, `"structure"`) and get the correct animation physics without choosing between `fadeIn`, `heroSpring`, `slideIn`, or `interpolate`. The hook maps roles to animation parameters: hero gets spring physics with overshoot, data gets scale-in, labels get quick fades, structure is near-instant.
**Rule:** Use `useEntrance` for individual element animations. Use `useStaggeredEntrance(role, index, baseDelay)` for lists. Control ordering via `startFrame`, not by choosing different animation functions.
**Gotcha:** Hooks can't be called conditionally or in loops (React rules). For dynamic lists, compute the startFrame outside and pass it to `useEntrance` — or use the raw `interpolate`/`spring` functions from animation.ts.

### L46: useDivider replaces 6+ duplicated gradient divider patterns
**Pattern:** The "gradient line that fades at edges" appeared in TitleTransition (3×), KineticTypography (2×), and SplitComposition (1×) — each with slightly different animation code. `useDivider(startFrame, options)` standardizes this into one hook returning `{ lineStyle }` ready to spread onto a `<div>`.
**Rule:** For any decorative divider line, use `useDivider`. For structural dividers that are part of the layout (like SplitComposition's center column), it's fine to keep custom code.

### L47: Hook wiring pattern — compStyle wraps inside Background
**Pattern:** The correct nesting is `<Background> → <AbsoluteFill style={compStyle}> → content`. Background stays static (no drift/fade) while all content inside the compStyle wrapper animates together. Don't apply compStyle to the Background itself — it would cause the vignette and grain to drift/fade.
**Gotcha:** Some templates (ImageComposite's BackgroundVariant) use `backgroundColor` on an outer AbsoluteFill instead of Background component. In these cases, compStyle wraps an inner AbsoluteFill, not the outermost one.

---

## Prop Validation & Dynamic Durations

### L48: Zod schemas enable runtime validation + Studio visual editing
**Pattern:** Each template has a `schema.ts` file with a Zod schema matching its TypeScript interface. The schema is wired into `<Composition schema={SchemaName}>`. This gives two benefits: (1) invalid JSON data throws clear errors at render time instead of silently rendering garbage, and (2) Remotion Studio shows a visual prop editor.
**Convention:** Schema wraps `data` in an outer object: `z.object({ data: z.object({ ... }) })`. This matches how props flow: `defaultProps={{ data: jsonData }}`.
**Rule:** When adding new fields to a template's types.ts, also update its schema.ts.

### L49: calculateMetadata replaces hardcoded durationInFrames
**Pattern:** Instead of `durationInFrames={sec(8)}` on the Composition, use `calculateMetadata={({ props }) => ({ durationInFrames: sec(props.data.durationSec || 8), fps, width, height })}`. The composition auto-sizes to its data — if the JSON says 12 seconds, it gets 12 seconds.
**Gotcha:** Phase-based templates (ChoroplethMap, RouteAnimation, TimelineComparison) need helper functions that sum phase durations. These helpers are kept in the index.tsx and called inside calculateMetadata.

### L50: @remotion/google-fonts loadFont() takes style name, not weight options
**Problem:** Initial attempt passed `{ weights: [400, 500, 600, 700] }` to `loadFont()` — TS error because the first param is a style name ("normal" | "italic"), not an options object.
**Fix:** Call `loadFont()` with no arguments to load all weights and styles. The return value `{ fontFamily }` gives the CSS font-family string.
**Rule:** Import in Root.tsx with `import "./design/fonts"` — side-effect import triggers preloading.

## Performance

### L51: useMemo for data-derived values, React.memo for sub-components
**Pattern:** Any computation that depends only on `data` (not `frame`) should be memoized: `useMemo(() => Math.max(...data.dataPoints.map(d => d.value)), [data.dataPoints])`. Pure sub-components that receive data + frame-derived values get `React.memo`.
**Gotcha:** `React.memo` wrapping changes the component definition syntax: `const Foo: React.FC<Props> = React.memo(({ ... }) => { ... })` — the closing needs `});` not `};`.
**Key targets:** Math.max in DataChart, BFS layout in DecisionTree, color scale in ChoroplethMap, arc geometry in ProbabilityGauge, cell lookup Maps in FrameworkDiagram.

## Master Compositions

### L52: Series composition with overlap for cross-fade transitions
**Pattern:** EP01 uses `<Series>` with `<Series.Sequence offset={-15}>` on all clips after the first. This creates 15-frame overlaps where the exit fade of clip N and the enter fade of clip N+1 blend. Total duration = sum of all clip durations - (23 × 15 frames).
**Gotcha:** The KineticTypography type is `QuoteData`, not `KineticTypographyData`. Import names must match the actual exports in types.ts.

## Lambda & Cloud Rendering

### L53: Lambda deploy is a two-step process: function + site
**Pattern:** `deploy-lambda.mjs` first bundles the project with `@remotion/bundler`, then uploads to S3 via `deploySite()`, then creates the Lambda function via `deployFunction()`. The output env vars (function name, serve URL, bucket) are needed by `render-lambda.mjs`.
**Config:** 2048MB memory, 240s timeout, 2048MB disk. Good balance for 1080p@30fps renders. Increase memory for 4K or complex compositions.
