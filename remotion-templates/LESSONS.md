# Lessons Learned — Technical Gotchas & Iteration Log

> Every hard-won lesson from building and iterating on templates.
> Read this before making changes — it prevents re-discovering known issues.
>
> Last updated: May 12, 2026

## Visual-baseline honesty (calibration-drift audit)

The visual regression suite has a 0.5% pixel-diff tolerance — calibration changes (stroke widths, opacities, fontSizes, durations) can drift inside that tolerance silently. The baseline doesn't get refreshed; the test reports PASS; the reference is stale. A later visual edit then compares against a wrong reference. Commit ac0ca91 (May 11, 2026 — TimeSeriesChart stroke widths 7/3/5 → 5/2/3.5) was the canonical example; commit 0adb109 caught + corrected it by regenerating all 22 frame-30 baselines.

**Audit methodology** (re-run when concerned about drift):

1. `git log --since="N months ago" --oneline -- src/templates/ src/design/theme.ts src/utils/animation.ts` to enumerate candidate commits.
2. For each, check `git show --stat <hash> | grep baselines` — empty result = no baseline refresh in that commit.
3. Cross-reference against the latest wholesale baseline-regen commit (currently `0adb109`, 2026-05-11). Commits BEFORE the most recent regen are captured by it; commits AFTER need individual review.
4. For "after the last regen" suspects, run `npm run test:visual` and inspect per-test pixel-diff %. Anything > 0.0% but < 0.5% is drift-within-tolerance and needs an explicit refresh decision.

**Last audit: 2026-05-11.** 16 drift candidates identified post-baseline-birth; all 16 fell before `0adb109`, which already regenerated the affected baselines wholesale. Post-`0adb109` commits (D17 `anticipatoryStartFrame` adoption across 5 templates, catalog-smoke addition, dossier doc-only commits) ran clean: `npm run test:visual` reports **0.000% pixel diff on every test** (32/32 passing, 6 map-skipped), and `npm run test:catalog` reports **0.000% on all 58 catalog-smoke tests**. The suite is honest.

If a calibration commit lands after this date, update this entry with the new audit timestamp and re-run the methodology before claiming honesty.

## Shared infrastructure (use these — don't reinvent)

When building a new template or polishing an existing one, prefer these shared building blocks over inline implementations. They enforce brand consistency and update across all consumers when refined.

- **`<HeaderStrip>`** (`src/components/HeaderStrip.tsx`) — top intelligence-briefing strip per BRAND.md (∴ PARALLAX wordmark + EP/coordinates). Three variants (meridian/antipode/stratum). Use instead of ad-hoc top-left episode labels.
- **`<FooterStrip>`** (`src/components/FooterStrip.tsx`) — bottom strip with pulsing REC dot, live runtime, scale label, FILED date. Auto-formats from `useCurrentFrame`/`fps`. Replaces ad-hoc footer text.
- **`<SourceAttribution>`** (`src/components/SourceAttribution.tsx`) — POLISH.md L6 enforcer; bottom-right placement with `bottomOffset` so it can lift above FooterStrip when both are present.
- **`<Crosshair>`** (`src/components/Crosshair.tsx`) — animated reticle (outer ring → inner ring → center dot → hairlines). Use for callouts, map highlights, hero stat anchors.
- **`lockOnPulse(frame, startFrame)`** (`src/utils/animation.ts`) — the brand 200ms scale pulse (1.0 → 1.1 → 1.0). Apply on first-appearance of any focal element. Already used on year markers, callout dots, route points, network nodes.
- **`bezierEdge(x1,y1,x2,y2,curvature)` / `smoothStepEdge(...)`** (`src/utils/edges.ts`) — replaces straight `<line>` edges with curves. Used by NetworkDiagram, DecisionTree.
- **`formatNumber(value, options)` / `formatCountUp(...)`** (`src/utils/numberFormat.ts`) — Intl-based formatting with thousands separators, abbreviation (1.2M / 3.4B), percent, currency. Replaces ad-hoc `toFixed` / `toLocaleString` across templates.
- **Three text-shadow filters** in NetworkDiagram (`text-shadow-caption`, `text-shadow`, `text-shadow-stat`) — apply hierarchy-aware shadow weight to SVG text. Pattern: caption `dy=0.5`, label `dy=1`, stat `dy=1.5`.
- **SVG duotone filter chain** (saturate → luminance → feFuncR/G/B ramp) used by PhotoMontage and ImageComposite. Reuse instead of CSS gradient overlays (which are not real duotone).
- **Beat flash at beat boundaries** — FullEpisode uses an inline **BeatFlash** (CSS radial burst + screen blend + per-beat `hueShift`), not `@remotion/light-leaks`. Light leaks relied on WebGL and could hard-fail headless renders without a GL context; BeatFlash is CPU/CSS-only. See comment block on BeatFlash in `src/templates/Episodes/FullEpisode.tsx`.
- **Mood-driven atmosphere intensity** — `getAtmosphereIntensityAtTime(manifest, sec)` maps the active `musicBed` track’s `mood` to a multiplier. ForegroundSegment merges `musicBedAtmosphereMultiplier` into `data._direction`; `resolveDirection` in `useDirection.ts` combines it with `ambientParticles` so tension beds scale Background atmosphere without per-template edits.
- **`useDirection(data._direction)`** (`src/hooks/useDirection.ts`) — bridge between DIRECTING_LANGUAGE.md `_direction` JSON blocks and Remotion rendering. Returns resolved atmosphere, drift, hold, and tint values. All FullEpisode-registered templates are wired. Pattern: `const direction = useDirection(data._direction)` → pass `direction.driftOptions` to `useCompositionAnimation()`, pass `direction.atmosphere`/`direction.atmosphereIntensity`/`direction.backgroundTint` to `<Background>`. Direction overrides template defaults via nullish coalescing (`direction.atmosphere ?? "normal"`). Fully backward compatible — if `_direction` is absent, all values are undefined and existing defaults take over.
- **Brand chrome default wiring** — Templates that ship editorial chrome import `<HeaderStrip>` and `<FooterStrip>` by default. Pattern: place inside `<Background>` wrapper, pass template's `mode` variable. TitleTransition additionally has animated `<Crosshair>` tracking in EpisodeTitleVariant.
- **Light mode editorial signatures** — `<Background variant="light">` now renders ruled border (inset 40px) by default (`effectiveBorder = border ?? (variant === "light")`). Optional `stampLabel` prop renders rotated rubber stamp element in top-right area. Both per BRAND.md editorial briefing aesthetic.

## Visual-polish patterns established (third-pass cinematic upgrades)

- **Bar specular highlights** — every animated bar (DataChart hero, ScoringBar, HypothesisBar, ProbabilityGauge.shift) gets a thin 1-1.5px white gradient along the top edge. Reads as light catching the bar.
- **Inner radial highlight on circular nodes** — NetworkDiagram and StrategicLandscape circles get a small white speck upper-left (radius 18-30% of node, 18-50% opacity). Suggests volumetric sphere.
- **Vertical gradient on bar fills** — replace flat color with `linear-gradient(180deg, ${color}E0 0%, ${color} 100%)` and inset shadow on bottom-right edge. Used in ScoringBar, HypothesisBar, ProbabilityGauge.shift.
- **Inner shadow on bar end-cap** — `inset -1px 0 0 rgba(0,0,0,0.18)` simulates volumetric end. Used in DataChart.
- **Crawling grain** — for any film-grain overlay, shift `backgroundPosition` deterministically per frame: `${frame * 1.5 % 512}px ${frame * 0.85 % 512}px`. Used in PhotoMontage and ImageComposite.
- **Anamorphic streak** — horizontal lens flare across title bloom: `linear-gradient(90deg, transparent, ${accent} 50%, transparent)`, 1.5px tall, 80% width, screen blend mode. Used in TitleTransition.
- **Chromatic-aberration kick** — 3-frame R/B channel split on stat lock-in: render two ghost spans at offset positions in opposite-tinted colors, screen blend, decay opacity over 3 frames.
- **Card perspective tilt** — subtle `rotateY(±3-4deg)` (or rotateX for matrix) alternating per index gives depth without animation cost. Used in FrameworkDiagram flow + matrix.

---

---

## TypeScript / Remotion

### L1: readonly tuples from `as const` break mutable array assignments
**Problem:** `theme.ts` uses `as const` on color ramp arrays (e.g., `rampBlue: ["#E6F1FB", ...] as const`), which creates `readonly` tuples. These can't be assigned to `string[]` parameters.
**Fix:** Any code consuming color ramps must declare parameters as `readonly string[]`, not `string[]`. Applied to `rampLookup` (type `Record<string, readonly string[]>`), `getColorRamp` (return type `readonly string[]`), and `getCountryFill` (parameter type `readonly string[]`) in ChoroplethMap.
**Rule:** When adding new functions that accept theme colors, always use `readonly` array types.

### L2: TypeScript strict mode is enabled — patterns to maintain
**History:** Strict mode was previously disabled to work around third-party type gaps (notably `react-simple-maps`, since removed in favor of Mapbox GL). As of Sprint A (May 2026), `tsconfig.json` has `"strict": true` and the codebase is clean under it.
**Patterns that made it work:**
- Optional fields on data props (`durationSec?: number`) need `?? 0` fallbacks at use site, not access bypass. JSON-imported data often lacks fields the runtime code expects.
- Cast through `unknown` for shape mismatches between JSON and types: `data as unknown as MyType`. Used in `SiliconTrap.tsx` for episodes of-hand JSON imports that don't match Zod-validated shapes.
- React hooks (`useMemo`, `useState`, `useId`) must be called **before** any conditional `return` (Rules of Hooks). Common trap when adding memoization to a component with an early-return guard.
- Use named animation constants from `src/utils/animation.ts` (`KEN_BURNS_MAX_SCALE`, `EXIT_FADE_DURATION`, `PAN_DRIFT_MAX_OFFSET`) and `src/design/theme.ts` (`timing.entrance.*`) — don't reintroduce hardcoded `1.02`, `15`, `sec(0.4)`.
**Rule:** Don't disable strict mode. Add `?? fallback`, narrow with type guards, or cast through `unknown` — never widen types to `any`.

### L3: Composition duration must be calculated, not hardcoded
**Pattern:** For templates with phases (maps, routes, timelines), calculate `durationInFrames` from the sum of phase durations in the JSON data: `sec(data.phases.reduce((sum, p) => sum + p.durationSec, 0) + 1)`. The `+1` adds a 1-second buffer for fade-out.
**Why:** Hardcoded durations desync when phase durations change in the JSON.

---

## Rendering & Self-QA

### L4: Remotion ignores PUPPETEER_EXECUTABLE_PATH env var
**Problem:** Setting `PUPPETEER_EXECUTABLE_PATH` or `REMOTION_CHROME_EXECUTABLE` environment variables does nothing. Remotion tries to download its own Chrome from `remotion.media`, which fails in sandboxed environments.
**Fix:** Use the CLI flag `--browser-executable=/path/to/chrome` on every `remotion still` or `remotion render` command.
**Setup:** Install Playwright's Chromium with `npx playwright install chromium`, then find the binary with `find ~/.cache/ms-playwright -name "headless_shell" | head -1`.

### L5: Map templates require MAPBOX_ACCESS_TOKEN — no CDN TopoJSON
**Problem:** ChoroplethMap and RouteAnimation have been migrated from react-simple-maps + CDN TopoJSON to Mapbox GL (`react-map-gl/mapbox`). They now require a `MAPBOX_ACCESS_TOKEN` env var to fetch Mapbox vector tiles. Sandboxed environments (Claude's Linux shell, CI without the token) cannot render them at all.
**Workaround:** Maps render correctly in local Remotion Studio (`npm start`) with a `.env` token. Visual regression tests skip the map compositions automatically when `MAPBOX_ACCESS_TOKEN` is unset (`getSkipReason` in `templates.test.ts`). For QA in sandbox, test non-map templates (charts, typography, titles, frameworks).
**Note:** The old "Future fix: Bundle TopoJSON in `public/geo/`" no longer applies — the templates use Mapbox vector tiles, not file-based TopoJSON. Offline map rendering would require switching to MapLibre GL + PMTiles, which is substantial scope.

### L6: Self-render QA loop
**Process:** `npx remotion still` renders a single frame as PNG → Read the PNG with Claude's image tool → critique against BRAND.md rules → edit code → re-render. This loop works for all non-map templates in sandbox.
**Key frames to check:** frame 0 (initial state), frame at ~40% (mid-animation), final frame -1 (completed state).
**Validated on:** DataChart (frame 60 + frame 180), confirming bar growth and label positioning.

---

## DataChart

### L7: Bar value labels must use flex-end positioning, not absolute/fixed
**Problem (original):** Value labels (e.g., "93%") were positioned at the top of a fixed-height container column. For short bars, labels floated far above the bar, looking disconnected.
**Fix:** Restructured `AnimatedBar` component to use a column with `justifyContent: "flex-end"`. The value label and bar rect are direct children of this column. Labels naturally sit directly above whatever height the bar has reached.
**Lesson:** Never position data labels relative to the container ceiling. Position them relative to the data element they annotate.

### L8: Chart comparison variant needs explicit "vs" visual
**Pattern:** The "comparison" variant of DataChart places two bar groups side by side with a "vs" divider in the center. Each side has its own accentColor. This is used for fact-check style visuals (e.g., Kirin chip "marketing 5nm" vs "actual 7nm").

---

## ChoroplethMap

### L9: Country names must exactly match TopoJSON properties
**Problem:** Using "USA" or "US" won't match. The world-atlas@2 TopoJSON uses full names from Natural Earth data.
**Required names (common ones):**
- "United States of America" (not USA/US)
- "United Kingdom" (not UK/Britain)
- "South Korea" (not Republic of Korea)
- "Taiwan" (in world-atlas@2, listed as "Taiwan")
- "Russia" (not Russian Federation)
- "Iran" (not Islamic Republic of Iran)
**Rule:** Always check against the actual TopoJSON feature names. When in doubt, fetch and inspect the topology.

### L10: Phase transitions need overlapping fade
**Pattern:** When a country changes color between phases, the transition is a hard cut by default. For smoother transitions, use `interpolateColors` with a brief overlap window at phase boundaries. Currently not implemented — add if visual QA reveals jarring cuts.

---

## KineticTypography

### L11: Statistic variant parses numeric prefix
**Pattern:** The statistic variant extracts the numeric portion from `statValue` (e.g., "7%" → 7, "93%" → 93) and animates a count-up. The suffix (%, B, M, etc.) is preserved. If the value starts with a non-numeric character, it displays as static text.
**Gotcha:** Decimals work but animate in integer steps. For "3.5nm", it counts 0, 1, 2, 3, 3.5 — which looks slightly uneven.

### L12: Chinese text needs explicit font-family
**Rule:** Any `<span>` or `<div>` rendering Chinese characters must explicitly set `fontFamily: fonts.chinese` ("Noto Sans SC, PingFang SC, sans-serif"). The brand fonts (Space Grotesk, IBM Plex Mono, JetBrains Mono) do not contain CJK glyphs and will fall back to system fonts inconsistently across render environments.

---

## RouteAnimation

### L13: Coordinates are [longitude, latitude], not [lat, lng]
**Convention:** Mapbox GL, deck.gl, and D3 use `[longitude, latitude]` (x, y) order. Google Maps uses `[latitude, longitude]`. This is a common source of points appearing in the wrong ocean.
**Common coordinates:**
- Washington DC: [-77.0, 38.9]
- Beijing: [116.4, 39.9]
- Taipei: [121.5, 25.0]
- Tokyo: [139.7, 35.7]
- Seoul: [127.0, 37.6]
- Amsterdam: [4.9, 52.4]
- Singapore: [103.8, 1.4]

### L14: Segment stroke animation accumulates across phases
**Pattern:** `activeSegments` and `activePoints` accumulate — once drawn in a phase, they remain visible in subsequent phases. This is deliberate: routes build up over time rather than disappearing between phases.

---

## FrameworkDiagram

### L15: Comparison column width depends on column count
**Pattern:** 2-column comparisons get a "vs" divider between them. 3+ columns share space equally without a divider. The layout adjusts automatically, but content should be written accordingly — 2-column items can be slightly longer.

---

## TitleTransition

### L16: Ken Burns effect on episode titles
**Pattern:** Episode title variant applies a subtle scale animation (1.02 → 1.0 via Easing.out) creating a cinematic "settling" feel. This is small enough to not be distracting but adds production value.

### L17: Section number uses large muted style
**Pattern:** Section numbers (I, II, III, IV, V) render at 120px in muted color as background texture, with the section title at normal heading size in front. The number provides visual weight without competing with the title text.

---

## Data Pipeline

### L18: JSON data file naming convention
**Format:** `{template-type}-{descriptive-slug}.json`
**Examples:** `choropleth-bifurcation.json`, `kinetic-juguo.json`, `chart-export-controls.json`, `title-section-denial.json`
**Rule:** Slugs should be descriptive enough to identify the content without opening the file. Use lowercase, hyphens only.

### L19: Color values in JSON should match BRAND.md tokens
**Rule:** Never invent new hex colors in data files. The single source of truth is `tools/brand-treatment/palette.json` — `theme.ts` imports it directly, and Python tools (`treat.py`, `treat_video.py`) read the same file via `palette_loader.py`. To change a brand color: edit palette.json → regenerate LUTs → done; both stacks pick it up. Do not paste hex values; use palette tokens (`palette.gold`, `palette.umber`, `semantic.us`, `semantic.china`, etc.) from `theme.ts` instead.

---

## Skills

### L20: Skill files are SKILL.md in a named directory
**Structure:** A skill is a directory containing `SKILL.md` (instructions) and optionally `references/`, `scripts/`, `assets/` subdirectories.
**Installation:** Skills are installed to the Cowork plugins skills directory and trigger automatically based on their description field. The research-audit skill is also version-controlled at `skills/research-audit/SKILL.md`.
**Constraint:** The plugins skills directory is read-only at runtime. Build and test skills outside the plugins directory, then install manually.

### L21: Visual-spec skill requires human checkpoint
**Pattern:** The skill produces a visual breakdown table first, then waits for user approval before generating JSON files. This prevents wasted effort if the visual plan doesn't match the creator's vision. Never skip this checkpoint.

---

## General

### L22: Duration calibration rule of thumb
- Simple title card: 3 seconds
- Section header: 3 seconds
- Single data point or quote: 4-5 seconds
- Multi-phase map or chart: 4-5 seconds per phase
- Complex framework with multiple items: 10-15 seconds total
- End card with CTA: 5 seconds
**Rule:** Viewer needs ~2 seconds to read a subtitle + 1 second per complex element on screen. When in doubt, add time — too fast loses viewers, too slow just gets skipped.

### L23: QA render frame selection matters
**Context:** When rendering single frames for QA, elements with staggered fade-ins may not be visible at early frames.
**Rule of thumb:** Render at frame 45 (1.5s) for initial state, frame 90 (3s) for mid-state with most elements visible, and frame at `durationInFrames - 30` for final state. For the episode title, the subtitle doesn't appear until ~frame 60. For end cards, the next-episode teaser fades in at frame 45. Always render at least two frames to catch animation timing issues.

### L24: Sample data files may not match episode data
**Problem (caught in QA):** `title-episode.json` still contained old sample data ("The Chip War") from when the template was first built, not the actual silicon-trap title ("The Silicon Trap"). The visual-spec skill generated section titles and new compositions but didn't update the original sample file.
**Rule:** After running visual-spec, always diff the generated files against any pre-existing sample data files in the episode directory. Sample data created during template development may be stale.

### L25: Composition IDs in Root.tsx must be unique
**Pattern:** Each `<Composition id="...">` in Root.tsx must be globally unique. Convention: use the template name for the default composition (e.g., "ChoroplethMap") or add a suffix for multiple compositions of the same type (e.g., "ChoroplethMap-bifurcation"). Currently, each template registers one default composition; episode-specific overrides use `--props`.

### L26: silicon-trap visual QA results (April 25, 2026)
**Status:** All non-map templates rendered and reviewed. Zero template code bugs found. One data issue fixed (L24).
**Templates verified:** TitleTransition (7 compositions), KineticTypography (4), DataChart (5), FrameworkDiagram (2), TimelineComparison (2). Total: 20/24 compositions rendered. Remaining 4 are maps (ChoroplethMap ×3, RouteAnimation ×1) which require CDN access — verified working in local Remotion Studio previously.

---

## Assembly & Render Pipeline

### L27: Props must be passed via temp file, not inline JSON
**Problem:** Complex JSON data (especially with quotes, special characters, or nested objects) breaks when passed as inline `--props='...'` in shell commands. Bash escaping is fragile and error-prone.
**Fix:** Write props to a temp file (`_props-XX.json`), pass `--props=path/to/file.json` to Remotion. Both render scripts use this pattern.
**Rule:** Never inline props JSON for data files with quotes, Chinese characters, or deeply nested objects.

### L28: Render scripts output numbered clips, not a single video
**Pattern:** Each composition renders to its own MP4: `01-title-episode.mp4`, `02-title-section-act1.mp4`, etc. These are NLE-ready assets placed on a timeline alongside narration audio and B-roll. The `--concat` flag produces an optional preview reel (all clips back-to-back) for quick review, but the real assembly happens in the NLE.
**Why:** Motion graphics total ~3.5 minutes across an ~18-minute episode. They overlay narration — they don't replace it. Concatenation alone can't produce the final video.

### L29: Sequence map is the source of truth for render order
**Pattern:** `data/episodes/epXX/SEQUENCE.md` defines the canonical order. Both render scripts mirror this sequence exactly. When adding or reordering compositions, update SEQUENCE.md first, then update the scripts.
**Rule:** Never change render order in scripts without updating SEQUENCE.md, and vice versa.

### L30: Playwright cache path differs between macOS and Linux
**Problem:** Render scripts used `~/.cache/ms-playwright` (Linux path). On macOS, Playwright installs to `~/Library/Caches/ms-playwright`. Combined with `set -euo pipefail`, the `find` on a nonexistent directory caused the entire script to exit silently with no output.
**Fix:** Search both paths. Also removed `set -e` from render scripts — errors are handled per-command instead. On macOS, the Chrome binary may be named `Google Chrome for Testing` rather than `headless_shell`.
**Fallback chain:** Playwright Chromium → system Chrome (`/Applications/Google Chrome.app/...`) → Remotion default.
**Rule:** Always test render scripts on the actual target OS. Silent failures from `set -e` are the worst kind of bug.

### L31: First render in a batch hits Remotion cold-start race condition
**Problem:** The first `npx remotion render` in a batch frequently fails with "Visited http://localhost:3000/index.html but got no response." Subsequent renders succeed because the internal server is warm.
**Fix:** Added retry logic (2 attempts per clip) and a 1-second cooldown between renders in the bash script. The Node script can re-run failed clips with `--only=01`.
**Rule:** Always include retry logic in batch render scripts. Remotion's internal server needs a moment to spin up on the first render.

---

## Polish Components (April 26, 2026)

### L32: Background.tsx layers must be pointer-events: none
**Pattern:** Background overlays (grain, vignette, ruled border) all set `pointerEvents: "none"` so they don't intercept clicks in Remotion Studio. Only the children layer receives events.
**Grain setup:** noise-512.png is a 512×512 monochromatic Gaussian noise PNG tiled via CSS `backgroundRepeat`. Mix-blend-mode: `overlay` at 12% (dark) or `multiply` at 4% (light).

### L33: MetadataStrip positions within safe area, not at edge
**Pattern:** Header sits at `top: safeArea.top - 40` (40px, halfway into the 80px safe margin). Footer at `bottom: safeArea.bottom - 40`. This keeps metadata visible but clearly subordinate to content, which lives inside the full 80px safe area.
**Typography:** All metadata text uses IBM Plex Mono at 11px, weight 400, letter-spacing 2.5px, uppercase. This is the smallest text tier in the system.

### L34: Crosshair animation phases overlap for fluidity
**Pattern:** The crosshair draw-in is NOT strictly sequential. Outer circle starts drawing at 30% through the hairline extension, inner circle appears at 60% through the outer circle draw. This overlap prevents a "step by step" robotic feel. The center dot appears last and pulses once (scale 1 → 1.3 → 1) for the "lock-on" moment.
**Sizing:** Default 64px diameter outer circle. For maps, use 48-80px depending on the geographic area being targeted.

### L35: depth.ts barGradient darkens by 15% — matches POLISH.md V4
**Pattern:** `barGradient(baseColor)` creates a `linear-gradient(to bottom, base, darkenHex(base, 0.15))`. This simulates overhead lighting on chart bars. The darken function is channel-wise multiplication, not HSL shift — fast and predictable for hex colors.
**Rule:** Never use flat `backgroundColor` for chart bars. Always wrap in `barGradient()`.

### L36: Animation system has three spring configs for different purposes
**Configs:**
- `gentleSpring` — damping 15, stiffness 80, mass 0.8 → smooth, no visible bounce. For UI elements.
- `heroSpring` — damping 12, stiffness 100, mass 1.0 → slight overshoot, cinematic feel. For titles, key stats.
- `microSettle` — damping 25, stiffness 200, mass 0.5 → tiny settle after growth. For bar completion, counter finish.
**Rule:** Match spring to element importance: hero > gentle > micro. Never use the same spring for everything.

---

## New Templates (April 26, 2026)

### L37: DecisionTree layout is level-based, not recursive render
**Pattern:** Tree nodes are positioned by computing levels first (BFS from root), then spreading siblings horizontally within each level. This is simpler than recursive rendering and avoids React re-render issues with deeply nested trees.
**Sizing:** Default node is ~160×60px. For trees wider than 5 leaves, nodes shrink automatically. Keep trees shallow (3-4 levels max) for readability — deeper trees should be split into multiple compositions.

### L38: SplitComposition uses auto Chinese font detection
**Pattern:** A `hasChinese(text)` helper checks for CJK characters via regex (`/[一-鿿]/`). When detected, `fontFamily` switches from `fonts.display` to `fonts.chinese`. This runs per text element, so mixed content (English title, Chinese items) works correctly.
**Rule:** Always use this pattern when text comes from JSON data that might contain Chinese. Don't assume language based on the template variant.

### L39: ProbabilityGauge arc animation uses strokeDasharray
**Pattern:** Semi-circular gauges are SVG circles with `strokeDasharray` set to half the circumference (180° arc). The fill animates by interpolating `strokeDashoffset` from full to the target percentage. This is more reliable than SVG arc paths for animation because dashoffset is a single numeric value.
**Gotcha:** The arc's visual "start" position depends on `transform: rotate(-90deg)` on the circle element. Without this, the arc starts at 3 o'clock instead of 12 o'clock.

### L40: ImageComposite duotone is CSS-based, not pixel-level
**Pattern:** True duotone (per-pixel remap) requires canvas or WebGL, which is heavy in Remotion. The template approximates duotone with: `filter: grayscale(100%) contrast(1.1)` + a gradient overlay using the duotone ramp colors at 40-60% opacity. This looks 80% as good at 1% of the complexity. For pixel-perfect duotone, preprocess images outside Remotion per IMAGES.md.

### L41: Shorts vertical layout uses shortsLayout constants, not layout
**Pattern:** The `shortsLayout` object in `Shorts/types.ts` defines 1080×1920 dimensions with tighter safe areas (48px sides, 100px top, 120px bottom). The larger bottom safe area accounts for mobile UI overlaps (share button, comments). Templates import `shortsLayout` instead of `layout` for all positioning.
**Rule:** Never use `layout.safeArea` in Shorts components — those are for 1920×1080 landscape.

### L42: Shorts data schemas reuse landscape types
**Pattern:** Vertical Shorts use the exact same JSON data schemas as their landscape counterparts. `KineticShort` accepts `QuoteData`, `DataChartShort` accepts `DataChartData`, etc. This means the same JSON file can render in both landscape and vertical — just change which composition renders it.
**Benefit:** No schema duplication. The visual-spec skill doesn't need separate Shorts logic — it generates one JSON, and you choose the composition at render time.

---

## Animation Hooks Architecture

### L43: useCompositionAnimation enforces Ken Burns + exit fade by default
**Pattern:** Every template calls `useCompositionAnimation()` and wraps its content in `<AbsoluteFill style={compStyle}>`. The hook auto-applies Ken Burns drift (1.0→1.02 scale + 6px pan) and exit fade (last 15 frames opacity ramp). Templates that need exceptions use options: `{ noDrift: true }` for maps/Shorts, `{ noExit: true }` for templates with custom exit logic.
**Rule:** New templates MUST call this hook. Never implement Ken Burns or exit fade manually — that's the hook's job.
**Convention:** Standard = `()`, Maps = `{ noDrift: true }`, Own-exit = `{ noExit: true }`, Shorts = `{ noDrift: true }`.

### L44: useEntrance separates animation character from animation timing
**Pattern:** Templates declare an element's semantic *role* (`"hero"`, `"content"`, `"data"`, `"label"`, `"structure"`) and get the correct animation physics without choosing between `fadeIn`, `heroSpring`, `slideIn`, or `interpolate`. The hook maps roles to animation parameters: hero gets spring physics with overshoot, data gets scale-in, labels get quick fades, structure is near-instant.
**Rule:** Use `useEntrance` for individual element animations. Use `useStaggeredEntrance(role, index, baseDelay)` for lists. Control ordering via `startFrame`, not by choosing different animation functions.
**Gotcha:** Hooks can't be called conditionally or in loops (React rules). For dynamic lists, compute the startFrame outside and pass it to `useEntrance` — or use the raw `interpolate`/`spring` functions from animation.ts.

### L45: useDivider replaces 6+ duplicated gradient divider patterns
**Pattern:** The "gradient line that fades at edges" appeared in TitleTransition (3×), KineticTypography (2×), and SplitComposition (1×) — each with slightly different animation code. `useDivider(startFrame, options)` standardizes this into one hook returning `{ lineStyle }` ready to spread onto a `<div>`.
**Rule:** For any decorative divider line, use `useDivider`. For structural dividers that are part of the layout (like SplitComposition's center column), it's fine to keep custom code.

### L46: Hook wiring pattern — compStyle wraps inside Background
**Pattern:** The correct nesting is `<Background> → <AbsoluteFill style={compStyle}> → content`. Background stays static (no drift/fade) while all content inside the compStyle wrapper animates together. Don't apply compStyle to the Background itself — it would cause the vignette and grain to drift/fade.
**Gotcha:** Some templates (ImageComposite's BackgroundVariant) use `backgroundColor` on an outer AbsoluteFill instead of Background component. In these cases, compStyle wraps an inner AbsoluteFill, not the outermost one.

---

## Prop Validation & Dynamic Durations

### L47: Zod schemas enable runtime validation + Studio visual editing
**Pattern:** Each template has a `schema.ts` file with a Zod schema matching its TypeScript interface. The schema is wired into `<Composition schema={SchemaName}>`. This gives two benefits: (1) invalid JSON data throws clear errors at render time instead of silently rendering garbage, and (2) Remotion Studio shows a visual prop editor.
**Convention:** Schema wraps `data` in an outer object: `z.object({ data: z.object({ ... }) })`. This matches how props flow: `defaultProps={{ data: jsonData }}`.
**Rule:** When adding new fields to a template's types.ts, also update its schema.ts.

### L48: calculateMetadata replaces hardcoded durationInFrames
**Pattern:** Instead of `durationInFrames={sec(8)}` on the Composition, use `calculateMetadata={({ props }) => ({ durationInFrames: sec(props.data.durationSec || 8), fps, width, height })}`. The composition auto-sizes to its data — if the JSON says 12 seconds, it gets 12 seconds.
**Gotcha:** Phase-based templates (ChoroplethMap, RouteAnimation, TimelineComparison) need helper functions that sum phase durations. These helpers are kept in the index.tsx and called inside calculateMetadata.

### L49: @remotion/google-fonts loadFont() takes style name, not weight options
**Problem:** Initial attempt passed `{ weights: [400, 500, 600, 700] }` to `loadFont()` — TS error because the first param is a style name ("normal" | "italic"), not an options object.
**Fix:** Call `loadFont()` with no arguments to load all weights and styles. The return value `{ fontFamily }` gives the CSS font-family string.
**Rule:** Import in Root.tsx with `import "./design/fonts"` — side-effect import triggers preloading.

## Performance

### L50: useMemo for data-derived values, React.memo for sub-components
**Pattern:** Any computation that depends only on `data` (not `frame`) should be memoized: `useMemo(() => Math.max(...data.dataPoints.map(d => d.value)), [data.dataPoints])`. Pure sub-components that receive data + frame-derived values get `React.memo`.
**Gotcha:** `React.memo` wrapping changes the component definition syntax: `const Foo: React.FC<Props> = React.memo(({ ... }) => { ... })` — the closing needs `});` not `};`.
**Key targets:** Math.max in DataChart, BFS layout in DecisionTree, color scale in ChoroplethMap, arc geometry in ProbabilityGauge, cell lookup Maps in FrameworkDiagram.

## Master Compositions

### L51: Series composition with overlap for cross-fade transitions
**Pattern:** silicon-trap uses `<Series>` with `<Series.Sequence offset={-15}>` on all clips after the first. This creates 15-frame overlaps where the exit fade of clip N and the enter fade of clip N+1 blend. Total duration = sum of all clip durations - (23 × 15 frames).
**Gotcha:** The KineticTypography type is `QuoteData`, not `KineticTypographyData`. Import names must match the actual exports in types.ts.

## Spatial Consistency & Border Safety (May 2026)

### L52: Background.tsx enforces hard clipping on ALL templates
**Change:** Added `overflow: hidden` to Background's outermost AbsoluteFill.
**Why:** Text, labels, and map markers could previously render partially off-screen. Now anything beyond 1920×1080 is cleanly clipped at the frame boundary.
**Rule:** Never remove this. If content is being clipped unexpectedly, the fix is to move the content inward — not to remove overflow:hidden.

### L53: MapGL clips projected content
**Change:** Added `overflow: hidden` to MapGL's container.
**Why:** Map Markers (city labels, sublabels) are geo-projected and can extend beyond the viewport when cities are near frame edges. Clipping prevents half-visible text at edges.
**Rule:** If a label is being clipped, fix it by adjusting camera center/zoom or label position — not by removing the clip.

### L54: Content must wait for camera to settle
**Problem:** In animated camera templates (RouteAnimation, ChoroplethMap), text and labels appeared simultaneously with camera movement — creating a desync where you'd read "US → Taiwan" while looking at the mid-Atlantic.
**Fix:** Introduced `CONTENT_DELAY` pattern: camera begins moving first, content (labels, phase titles) fades in 0.8s later when camera is ~75% settled.
**Rule:** Any template with animated camera must stagger: camera moves → visual elements draw → text labels appear. Never show text while the view is still in transit.
**Sequence:** camera (t+0) → arcs/shapes (t+0.4s) → labels/titles (t+0.8s)

### L55: Auto-centering for widely-separated geographic points
**Problem:** Averaging longitude of US (-95°) and Taiwan (+121°) gives centroid at +13° (mid-Atlantic) — useless.
**Fix:** When point spread > 100° longitude, center on the DESTINATION of active route segments rather than computing centroid. Narrative logic: "US → Taiwan" should show Taiwan.
**Rule:** For map templates, never naively average coordinates when spread > 100°. Use segment destination logic or pick the last/primary point.

### L56: Title positioning uses exactly two patterns
**Pattern A — Data templates:** Use `<TitleBlock>` (shared component). Positions at `layout.safeArea.top/left`, enforces maxWidth, handles mode-aware colors.
**Pattern B — Full-bleed templates:** (RouteAnimation, ChoroplethMap, KineticTypography, TitleTransition). Position title using `contentArea("content")` — which accounts for safeArea + title height gap.
**Rule:** Never hardcode pixel positions for titles. Use TitleBlock (preferred) or contentArea(). If a title looks too close to the edge, it's because the template isn't using either system.
**Audit (May 2026):** 13/26 templates use TitleBlock, 12 use contentArea/safeArea, 1 (TitleTransition) uses centered flex. No templates should hardcode raw pixel values for title position.

### L57: textSafe utilities prevent text overflow
**Added:** `textSafe` object in theme.ts with: `.ellipsis` (single-line), `.wrap` (multi-line word-break), `.clamp(N)` (N-line limit), `.bounded` (maxWidth within safe area).
**Rule:** Any text element that could grow unbounded (data-driven labels, dynamic titles, long subtitles) must use one of these. Prefer `.clamp(2)` for subtitles, `.ellipsis` for single-line metadata.

### L58: Tiered safe areas — not all templates need the same padding
**Problem:** 80px (7.4%) is tighter than broadcast standard (10%). Data-dense templates with titles, bars, labels, and source text feel cramped. But centered compositions (KineticTypography) waste space with wide margins.
**Fix:** Added `layout.safeAreaTier` with four levels:
- `tight` (48px) — centered compositions: KineticTypography, TitleTransition
- `standard` (80px) — default, most templates
- `broadcast` (108px) — matches TV broadcast safe (10% inset)
- `generous` (120px) — data-dense: DataChart with many bars, FrameworkDiagram with many nodes
`contentArea()` now accepts a second argument: `contentArea("content", "generous")`.
**Rule:** When a template feels cramped near edges, don't patch individual positions — switch to a higher safe area tier. When it feels wastefully padded, drop to tight. This compounds: the decision lives in one place and affects all positioning derived from contentArea().

### L59: Cards — hierarchy-aware containers, not uniform boxes
**Problem:** Every template used `cardPresets.outlined` — `1px border + 8px radius + transparent bg`. This reads as PowerPoint: the visible border announces "I am a UI container." Cinematic motion graphics never show container edges. The uniform treatment also means hero events and supporting events have identical visual weight.
**Fix:** Redesigned `cardPresets` with hierarchy tiers:
- **Hero** (`accentEdge`): Left accent line + tinted background. Signals "this matters." Used for highlighted events, key moments.
- **Standard** (`inset`): Pressed-into-paper effect (tinted bg + inner shadow). Default for most content. Editorial, tactile.
- **Supporting** (`minimal`, `ruled`): Barely-there separators. Typography carries the hierarchy.
- **Floating data** (`shadowFloat`): Layered shadows, no border. For stat panels, tooltips.
Border radius reduced from 8px to 2px (editorial, not UI-kit). Legacy `outlined` preserved but softened (0.5px border, 2px radius).
All card presets now include `overflow: "hidden"` and `overflowWrap: "break-word"` — text can never escape its container.
**Rule:** Container treatment scales with content importance. The most important card gets the strongest treatment. Some content deserves no container at all. If every card looks the same, you have no hierarchy.

### L60: NetworkDiagram edges connect at node borders, not centers
**Problem:** Edge lines drew from node center to node center, visually passing through the node circles.
**Fix:** Added `edgeEndpoints()` helper that offsets start/end coordinates by `nodeRadius + 2px` along the line direction. All three edge styles (solid, dashed, blocked) now terminate cleanly at the node border.
**Rule:** When connecting geometric shapes with lines, always offset endpoints by the shape's radius plus a small gap.

### L61: Absolute-positioned elements overlap when `top` ignores preceding element height
**Problem:** In DuelingFrameworks, the title (h1, 64px × 1.1 lineHeight = 70px) positioned at `top: safeArea.top` (80px) extended to 150px. Framework panel names started at `top: safeArea.top + spacing.xl` = 128px — 22px INSIDE the title. Same bug in DualTimeline: era headers used `contentArea("minimal").top - spacing.lg`, pulling them 11px into the subtitle.
**Root cause:** When two elements are both absolutely positioned, the second element's `top` must account for the first element's **rendered height** (font size × line height + margins), not just add a fixed spacing offset. This is easy to miss because the overlap only shows at runtime, not in code review.
**Fix:** Compute title area height explicitly: `Math.ceil(fontSizes.h1 * lineHeight.h1) + spacing.xl`. Or use `contentArea()` helper which already encodes title heights for standard variants (episode: 220px, section: 160px, content: 92px, minimal: 56px). Never subtract from `contentArea().top` — that erases the gap it provides.
**Rule:** Every absolutely-positioned element below another must reference the preceding element's computed height, not guess with spacing constants. Use `contentArea()` whenever possible. If bypassing it, calculate: `safeArea.top + ceil(fontSize × lineHeight) + gap`.

### L62: Never nest Ken Burns drift — one transform context per composition
**Problem:** DuelingFrameworks had TWO drift layers: `compStyle` from `useCompositionAnimation()` (scale 1.06 + translate + rotate) AND an inner `AbsoluteFill` with `kenBurnsDrift(frame, totalFrames, 1.02)`. They compound to 1.08 total zoom. Worse: the title was OUTSIDE the inner wrapper while panels were INSIDE, so they drifted at different rates — making the panels visually slide into the title over time even though their static positions were correct.
**Fix:** Removed the inner Ken Burns wrapper. `useCompositionAnimation()` is the single source of drift. All content lives in one `<AbsoluteFill style={compStyle}>` — same transform context, no relative drift.
**Rule:** Never add a second `kenBurnsDrift` or `scale()` wrapper inside `compStyle`. One drift layer per composition. If you need different drift rates for different elements, use the hook's `noDrift` option and apply drift manually to ALL elements from the same origin.

### L63: TitleBlock safeAreaTier must match contentArea/columnLayout safeAreaTier
**Problem:** FrameworkDiagram, DecisionTree, EscalationLadder, and BayesianUpdate all used `safeAreaTier="generous"` (120px) on TitleBlock but default `"standard"` (80px) in `contentArea()`/`columnLayout()`. The title started at 120px and extended to ~203px. Content started at `80 + 92 + 48 = 220px` — only 17px gap. Visually the column headers touched the subtitle.
**Fix:** Added `safeAreaTier` option to `columnLayout()`. All templates now pass the same tier to both TitleBlock and content positioning helpers. With generous tier: `120 + 92 + 48 = 260px` — a comfortable 57px gap below the title.
**Rule:** When a template uses a non-default safeAreaTier on TitleBlock, it MUST pass the same tier to `contentArea()`, `columnLayout()`, or `useTemplateLayout()`. Mismatched tiers silently eat title-to-content spacing.

### L64: Body cards must have EQUAL or MORE visual definition than title treatments
**Problem:** Inset cards (body content) had `border: "none"` with only a 5% background tint + faint inner shadow. Titles above had underlines + bold typography. The visual hierarchy was inverted — titles had more visual weight than the content containers beneath them, making the layout feel unfinished.
**Fix:** Added `0.5px solid rgba(0,0,0,0.10)` border to inset cards in light mode, `rgba(255,255,255,0.08)` in dark mode. The border provides clear containment that matches or exceeds the title's underline treatment.
**Rule:** Content containers should have equal or greater visual definition than headers/titles. The hierarchy of containment must match or exceed the hierarchy of typography. Test by squinting: if the title area reads as "more defined" than the content area, the cards need stronger edges.

---

## Lambda & Cloud Rendering

### L65: useTemplateLayout — zone-based positioning replaces manual arithmetic
**Problem:** Templates hand-computed `top: safeArea.top + spacing.xl` for every element, leading to overlap bugs when the offset didn't account for preceding elements' rendered height (L61). Each template was its own source of truth for positioning math.
**Fix:** `useTemplateLayout` hook returns pre-computed zone rects (title, content, footer, left, right) with ready-to-spread `style` objects and raw `rect` numbers. Templates spread `zones.content.style` instead of writing position math. Supports title variants (none/minimal/content/section/episode/custom), safe area tiers, split mode, and configurable gaps.
**Migration pattern:** Replace `contentArea("content")` with `const { zones } = useTemplateLayout({ title: "content" }); const area = zones.content.rect;` — minimal diff, same data shape. For split layouts, add `split: true` and use `zones.left.style` / `zones.right.style`. For custom h1 titles, use `title: "custom", customTitleHeight: Math.ceil(fontSizes.h1 * lineHeight.h1)`.
**Rule:** New templates MUST use `useTemplateLayout` for all positioning. Never write `top: layout.safeArea.top + ...` manually. The hook exists specifically to make overlap bugs impossible.

### L66: Virtual camera for tree/graph templates — move the camera, not the nodes
**Problem:** DecisionTree rendered all nodes into a fixed viewport with tiny stagger delays. Result: cramped layout, dead space, no narrative pacing. The tree was a static diagram, not a cinematic moment.
**Fix:** `useTreeCamera()` hook implements a virtual camera system. The full tree is rendered at natural scale; a viewport container animates `transform: scale() + translate()` to zoom/pan between nodes. Each `CameraStep` targets a node ID with zoom level, duration, and optional dimming. Camera transitions use `Easing.bezier(0.25, 0.1, 0.25, 1)` for cinematic feel, with zoom settling ~200ms before pan completes.
**Key details:** (1) `transform-origin: 0 0` with manual translate math — don't use center origin with scale or the offset doubles. (2) Title and source overlays render OUTSIDE the camera viewport so they stay fixed on screen. (3) `getNodeDim()` returns per-node dimming factor (0–0.75) based on path ancestry to the focus node. (4) `getNodeScale()` adds 1.0→1.08 spring-settle on the focused node. (5) `generateDefaultCameraPath()` auto-generates root→branch→leaves→pullback if no cameraPath is in JSON. (6) `buildParentMap()` inverts children→parent for ancestry lookups.
**Data contract:** `cameraPath: [{ focus: "nodeId", zoom: 2.2, duration: 2, dimOthers: true, label: "..." }]` in the JSON data file. Optional — auto-generates from tree structure if omitted.
**Reuse potential:** This hook works for any node/graph visualization (NetworkDiagram, EscalationLadder) — not DecisionTree-specific.

### L67: Lambda deploy is a two-step process: function + site
**Pattern:** `deploy-lambda.mjs` first bundles the project with `@remotion/bundler`, then uploads to S3 via `deploySite()`, then creates the Lambda function via `deployFunction()`. The output env vars (function name, serve URL, bucket) are needed by `render-lambda.mjs`.
**Config:** 2048MB memory, 240s timeout, 2048MB disk. Good balance for 1080p@30fps renders. Increase memory for 4K or complex compositions.

### L68: Standardize ALL templates on generous safe area (120px)
**Problem:** Templates used a mix of "standard" (80px) and "generous" (120px) safe areas for title positioning, causing a visible 40px jump when cutting between compositions. Some templates used manual title JSX at `layout.safeArea.top` (80px) while others used TitleBlock at 120px.
**Fix:** Every template now uses `safeAreaTier="generous"` on TitleBlock and `contentArea(..., "generous")` / `layout.safeAreaTier.generous.*` for content positioning. This ensures titles sit at a consistent 120px top offset across all compositions.
**Gotcha:** RouteAnimation's type has `backgroundTint` (a color string), not `backgroundVariant` — TitleBlock mode must be hardcoded "light" there. StatReveal's `useTemplateLayout` option is `safeArea`, not `safeAreaTier`.

### L69: Horizontal timeline camera > vertical list for cinematic timelines
**Problem:** Vertical dot-line-card timelines look like web UI components, not documentary graphics. The brain pattern-matches "scrolling a list" rather than "watching a film."
**Solution:** HorizontalTimeline template uses a wide canvas (events distributed along x-axis at 480px spacing) with a virtual camera that tracks horizontally between events. `useTimelineCamera()` hook handles pan/zoom interpolation, focus isolation (dim + blur + scale), and step transitions.
**Key insight:** What separates "cinematic" from "UI": (1) camera moves through SPACE, (2) focus isolation via depth-of-field blur, (3) scale encodes importance, (4) atmosphere between elements (grain, glow, particles), (5) transitions have physics (easing, overshoot). The Vox/documentary standard is horizontal camera tracking between "stations."
**Architecture:** Single configurable template with 3 modes (single/dual/morph) replaces TimelineComparison + DualTimeline + TimelineMorph. Camera path is data-driven (auto-generated if omitted). Glowing spine with animated gradient pulse.
**File:** `index.tsx` (not `index.ts`) because composition wrappers contain JSX.

### L70: useNarratedCamera — generalized 2D virtual camera for all data templates
**Problem:** useTimelineCamera is 1D (x-axis only), useTreeCamera is tree-specific. Other templates (NetworkDiagram, EscalationLadder, DataChart, RadarChart) needed cinematic camera but had no shared hook.
**Solution:** `useNarratedCamera()` — 2D camera that pans to arbitrary (x,y) coordinates, zooms, and applies focus isolation. Targets can be: explicit coordinates, element indices (`element:N`), groups (`group:name`), or `overview`. All five data templates now support optional `cameraPath` field for narrated camera mode while maintaining backward compatibility (static mode when no path provided).
**Pattern:** Camera features are opt-in via data. When `cameraPath` is absent, template renders exactly as before. When present, wraps content in viewport+content divs with camera transform. Per-element effects (opacity, scale, blur) applied via camera's getter functions.

### L71: Ambient particles add depth without distraction
**Problem:** Static compositions feel flat — they lack the "living" quality of real footage.
**Solution:** `AmbientParticles` component — deterministic floating particles (SVG circles) with seeded pseudo-random positions, slow drift, and gentle opacity pulse. Key constraints: max opacity 0.15, max radius 2.5px, slow speed (0.3-0.4). Uses `seededRandom()` for reproducible renders (no Math.random). Theme-aware default colors.
**Rule:** Particles should NEVER be noticeable on first viewing. If someone says "I see particles," they're too dense/fast/bright.

### L72: Flow particles for SankeyFlow bring data to life
**Problem:** Static Sankey links are just colored ribbons — they don't communicate "flow."
**Solution:** `FlowParticlesLayer` renders dots that travel along cubic bezier paths. Particle count proportional to flow value. Uses `bezierPoint()` to evaluate position at parameter t. Edge-fading at endpoints prevents pop-in/out.
**Key:** Particle speed must be slow enough to track visually but fast enough to suggest motion. Speed 0.008 per frame at 30fps = ~4 seconds per full traversal.

### L73: Axis rotation for RadarChart creates guided narration
**Problem:** Radar charts show all dimensions at once — no way to guide viewer through each dimension sequentially.
**Solution:** `axisFocusSequence` rotates the chart so each focused axis is at 12 o'clock position. Counter-rotates text labels to keep them upright. Pulsing vertex highlight draws the eye. Value callout appears at focused vertex.
**Gotcha:** SVG rotation via CSS transform on the `<svg>` element; must set `transformOrigin: "center center"`. Text counter-rotation uses SVG `transform` attribute per-element.

### L74: useBeatSync for audio-reactive timing
**Problem:** Camera moves feel disconnected from narration rhythm. Zoom pulses would feel better if synced to audio emphasis points.
**Solution:** `useBeatSync()` hook accepts beat marker timestamps and returns exponentially-decaying pulse (0-1), isOnBeat boolean, and timing data. Beat markers can come from assembly manifest or be manually placed in JSON data. Anticipation offset (default 2 frames) makes visuals lead audio slightly for perceived sync.
**Usage:** `const zoomBoost = 1 + beat.pulse * 0.05` adds 5% zoom on each beat. Degrades gracefully (returns 0 pulse) when no markers provided.

### L75: spatial-zoom transition for inter-composition continuity
**Problem:** Cut/fade between compositions breaks spatial continuity. When camera-driven templates end zoomed into a detail, the next composition should feel like emerging from that depth.
**Solution:** `spatial-zoom` transition type: exit zooms to 2.5x (pushing through), entry zooms from 2.5x to 1x (emerging). Combined with 8px blur at peak for depth-of-field. Creates illusion of continuous camera movement through a 3D space between compositions.

### L76: AudioLayer — 3-layer sound rendering in FullEpisode
**Problem:** Assembly manifest defines a complete 3-layer audio system (musicBed, soundCue, textureCues) but FullEpisode rendered only narration. Sound design required a separate NLE step.
**Solution:** `AudioLayer` component handles all three layers via Remotion's `<Audio>` + `<Sequence>`:
- **Layer 1 (Music Bed):** Each track is a `<Sequence>` with a volume callback that implements fade-in/fade-out envelope. Overlapping tracks naturally crossfade.
- **Layer 2 (Transition SFX):** Sound cues resolved to files via `{type}-{intensity}.wav` naming. Positioned at `segment.startSec + offsetSec`.
- **Layer 3 (Texture Hits):** Micro-SFX at precise offsets, capped at 0.20 volume.
**Key insight:** Remotion's `volume` prop accepts a callback `(frame: number) => number`, enabling per-frame volume interpolation without custom gain nodes. Use `Math.min(fadeInVol, fadeOutVol)` for envelope — whichever fade is more restrictive wins.
**Gotcha:** Audio components must be OUTSIDE `<FilmOverlay>` — FilmOverlay wraps children in visual effect layers, and nesting `<Audio>` inside can cause rendering artifacts. Keep all `<Audio>` as direct children of the root `<AbsoluteFill>`.
**File convention:** SFX at `audio/sfx/transitions/{type}-{intensity}.wav`, textures at `audio/sfx/textures/{type}.wav`, music beds at `audio/music/{episode}/{file}`.

### L77: cinematicMode flag for progressive template modernization
**Problem:** Templates like DuelingFrameworks and SplitComposition feel like "PowerPoint slides" — static layouts with staggered fade-ins, no spatial camera movement, no depth-of-field. But rewriting them entirely would break existing data files.
**Solution:** Add `cinematicMode?: boolean` to data types. When true, renders through a cinematic alternate path (horizontal camera tracking + focus isolation + ambient particles). When false/absent, renders through the original static path. This allows gradual migration: new episodes use cinematicMode: true, old data files render exactly as before.
**Pattern for cinematic comparison templates:**
1. Wide virtual canvas (1.5-2.2× viewport) with elements placed horizontally
2. Camera starts zoomed into side A (translateX + scale > 1)
3. Sequential item build with staggered slide-in (0.3s per item, not simultaneous)
4. Camera pans to side B (inactive side dims to 0.15 opacity + 2px blur)
5. Pull back to overview (scale → 1.0, translateX → 0) for verdict/scoring
**Key insight:** The "PowerPoint" feeling comes from: (1) everything visible simultaneously, (2) no spatial depth hierarchy, (3) all items at same visual weight. The fix is temporal sequencing (build items one by one) + spatial focus (dim/blur non-active) + camera motion (simulate physical tracking). You don't need useNarratedCamera for every template — simple interpolate() on scale/translateX with opacity/blur on inactive zones achieves 80% of the cinematic effect.

### L78: Progressive focus pattern for sequential templates
**Problem:** Flow/timeline templates feel flat because all nodes have equal visual weight once appeared. The eye has nowhere to rest.
**Fix:** Track `activeNodeIndex` (most recently appeared node). Nodes *before* active dim based on distance: `dimAmount = interpolate(activeNodeIndex - i, [0, 3], [0, 0.5], CLAMP)`. Apply as both opacity reduction AND subtle CSS `blur(${dimAmount * 1.5}px)` — opacity alone doesn't create enough separation.
**Rule:** Any template with sequentially-appearing elements (FlowVariant, EscalationLadder, timeline) should dim earlier elements. The blur threshold should be > 0.1 to avoid sub-pixel rendering cost on nodes with zero dim.

### L79: Overshoot-settle pattern for animated values
**Problem:** Linear or cubic interpolation between two values (probability gauge arcs, Bayesian curve means) feels mechanical and weightless.
**Fix:** Two-phase interpolation: (1) Rush to 103% of target in first 50% of time using CLAMP_CUBIC_INOUT, (2) Settle back from overshoot to true target in next 30% of time. Combined with a `pulse(frame, settleFrame, 9, 1.04)` on the numeric display for tactile feedback when the value "lands."
**Pattern:**
```
const overshoot = target + (target - from) * 0.03;
const t = evidenceT <= 0.5 ? interp(evidenceT, [0, 0.5], [0, 1]) : 1;
const settleT = evidenceT > 0.5 ? interp(evidenceT, [0.5, 0.8], [0, 1]) : 0;
const value = (from + t * (overshoot - from)) - (overshoot - target) * settleT;
```

### L80: SVG duotone filters — slope/intercept, not feDisplacementMap
**Problem:** PhotoMontage's duotone used `feDisplacementMap` (pixel displacement — wrong effect entirely) with only shadow color in intercept (flat tint instead of ramp).
**Fix:** Proper duotone maps luminance to a two-color ramp via `feComponentTransfer` with linear functions: `slope = highlight[channel] - shadow[channel]`, `intercept = shadow[channel]`. Preceded by `feColorMatrix type="saturate" values="0.25"` for partial desaturation, then luminance conversion matrix, then the component transfer.
**Rule:** Never use `feDisplacementMap` for color treatment — it's a geometric distortion filter. Duotone = luminance → linear color ramp.

### L81: Background atmosphere prop expects AtmosphereDensity string, not boolean
**Problem:** Using `atmosphere` as bare prop (shorthand for `={true}`) fails TS — the type is `"none" | "subtle" | "normal" | "dense"`.
**Fix:** Always use `atmosphere="subtle"` (data-viz templates) or `atmosphere="normal"` (hero/cinematic). Never use bare boolean shorthand.

### L82: AmbientParticles density prop, not count
**Problem:** `<AmbientParticles count={25} />` — component uses `density` prop (particles per viewport area unit), not `count`.
**Fix:** Use `density={20}` for dark modes, `density={8-12}` for light modes. The component internally derives actual particle count from density × viewport area.

## Pacing System (May 2026)

### L83: useEntrance timingScale — pace-aware animations without template changes
**Problem:** Templates hardcode animation durations. When pace shifts from analytical to urgent, animations should tighten; when breathing, they should relax. But modifying every template's animation code is impractical.
**Solution:** `useEntrance(role, startFrame, timingScale)` accepts an optional `timingScale` (default 1.0). For hero elements, it scales spring mass (higher mass = slower spring). For all others, it scales the interpolation duration: `dur = Math.round(baseDur * ts)`. Clamped to [0.4, 2.0] to prevent absurd values. `useStaggeredEntrance` also scales the stagger gap: `scaledStagger = Math.round(staggerFrames * timingScale)`.
**Usage:** `const entrance = useEntrance("data", 15, direction.paceTimingScale)` — existing calls without the third arg work unchanged.

### L84: Beat-boundary pace reset prevents infection
**Problem:** A `PACE: urgent` in Beat 3 could infect all of Beat 4 if the writer forgot to reset. Silent bugs — the manifest would show compressed durations in unintended segments.
**Solution:** `generate_manifest.py` auto-resets `current_pace` to `"analytical"` at each beat header, printing a note when it resets from a non-default value. Writers only need to set pace changes, never worry about cleanup.

### L85: match_narration guard for PACE multiplier
**Problem:** When `durationMode == "match_narration"`, the visual's purpose is to match narration timing exactly. Applying a 0.7× or 1.4× multiplier would create gaps or overlaps between narration and visuals.
**Fix:** Skip PACE multiplier when `parsed["durationMode"] != "match_narration"`. The explicit intent to match narration overrides density-based pacing.

### L86: Sync anchor cascading can squeeze previous steps to zero
**Problem:** In `useNarratedCamera`, when a sync point snaps a step's start boundary backward past the previous step's start, the previous step gets negative width — invisible but it breaks interpolation.
**Fix:** After snapping, check if `boundaries[i-1].end <= boundaries[i-1].start` and enforce a minimum 0.5s duration, pushing the current step's start forward to compensate.

## Layout polish patterns (May 2026)

### L87: `zones.centeredStyle` — one-liner for centered content in any zone
`useTemplateLayout` zones now expose a `centeredStyle` field alongside `style`. Spread it on any container that needs to vertically + horizontally center its children: `<div style={zones.content.centeredStyle}>`. It sets `display:flex, flexDirection:column, alignItems:center, justifyContent:center, overflow:hidden` at the pre-computed zone position. No separate `alignItems`/`justifyContent` or explicit `height` needed — the zone already carries the correct height.

### L88: `textSafe.wrap` — prevent text overflow in bounded boxes
Spread `...textSafe.wrap` on any text container in a bounded region (matrix cell, timeline card, framework node) to get `overflow:hidden, wordBreak:break-word, overflowWrap:break-word`. Also add `maxWidth: containerWidth - padding * 2` so the text wraps rather than pushes out of its cell. The `textSafe` object also has `.ellipsis` (single-line truncation) and `.clamp(n)` (n-line WebkitBox clamp).

### L89: MatrixVariant cells — `minHeight` not `height`, dynamic sizing not hardcoded
Fixed-`height` on matrix cells caused text overflow as soon as a cell label wrapped. Pattern: compute `availCellH = Math.floor((area.height - headerHeight - rows * margin * 2) / rows)` then `cellHeight = Math.min(180, Math.max(80, availCellH))` and apply as `minHeight` (not `height`) so cells grow with content. Same for `cellSize` (width). Wrap in `useMemo` — called at 30fps.

### L90: `titleHeight.content` must cover the two-line wrapping case
`titleHeight.content` was 92px (single-line estimate). A two-line h2 title wraps at ~106px and the subtitle adds ~33px → total ≈147px. Bumped to 150px. All 19 templates using `contentArea("content", ...)` or `useTemplateLayout({ title: "content" })` immediately get the corrected gap without any template changes.

### L91: NetworkDiagram nodes must use `contentArea`, not `defaultSafeArea`
`defaultSafeArea.top = layout.safeArea.top + 100 = 180px` — hard-coded before the generous safe area tier (120px) and before `titleHeight.content` grew to 150px. Actual content starts at `contentArea("content", "generous").top = 318px`. Using `defaultSafeArea` put nodes under the TitleBlock overlay. Fix: replace `defaultSafeArea` with a `SafeArea` object built from `contentArea("content", "generous")` in the `positions` useMemo.

---

## AI-Generated Clip Integration (May 2026)

### L92: OffthreadVideo + playbackRate for stretching fixed-duration AI clips
**Problem:** AI video generators (Hailuo, Kling, Pika) output clips at fixed durations (e.g., Hailuo free tier = 6s). Scripts often need these atmospheric shots to hold for 8-10s to cover narration.
**Solution:** Use `<OffthreadVideo playbackRate={nativeDuration / targetDuration} />` to slow clips to fill the needed time. A 6s clip at `playbackRate={0.75}` fills 8s; at `0.6` it fills 10s. Works especially well for atmospheric/establishing shots generated with low motion intensity (0-1), since the slowdown is nearly imperceptible.
**Component:** `src/components/AiGenClip.tsx` — reusable wrapper. Accepts `src` (staticFile path) and `playbackRate`. Renders full-bleed with `objectFit: "cover"` on ink background.
**Setup:** Copy AI-gen clips into `public/episodes/<slug>/clips/`. Reference via `staticFile("episodes/<slug>/clips/<filename>.mp4")`.
**Practical limits:** Below 0.5x (6s → 12s) motion artifacts become noticeable even on slow clips. For shots needing >12s coverage, loop or cut to a different visual.
**Why OffthreadVideo over Video:** `<Video>` causes cache eviction stalls at 20-30% render progress in long compositions with many short clips. `<OffthreadVideo>` extracts frames off-thread, avoiding this. Always use `OffthreadVideo` for episode showcase/assembly compositions.

### L93: Showcase compositions should include ALL visual layers
**Pattern:** Episode showcase files (e.g., `PrisonersDilemmaShowcase.tsx`) should sequence all visual segments — Remotion templates, AI-gen clips, and archival stills — not just the MG layer. This gives a complete preview of the visual rhythm before NLE assembly. Use three clip types:
- `mg()` — data-driven Remotion template (component + JSON data)
- `vid()` — AI-gen video clip via OffthreadVideo + playbackRate stretch
- `arch()` — placeholder card for archival stills not yet sourced
The total segment count = MG compositions + AI-gen clips + archival stills. Duration auto-calculates from the clip array.

### L94: AI-gen clips go in public/, not imported as modules
**Problem:** Importing `.mp4` files as ES modules requires webpack/bundler config for media assets. Remotion's `staticFile()` is simpler and doesn't bloat the JS bundle.
**Rule:** All video/audio assets go in `public/` and are referenced via `staticFile()`. Never `import clip from "./clip.mp4"`. Directory convention: `public/episodes/<slug>/clips/` for AI-gen, `public/audio/` for SFX/music.

---

## Testing & Code Quality (May 2026)

### L95: Extract pure functions from hooks for unit-testable math
**Problem:** Hooks with load-bearing math (phase transitions, beat sync, layout computation) can't be tested without mocking Remotion internals (`useCurrentFrame`, `useVideoConfig`). Without tests the math is invisible — future refactors silently break transitions.
**Pattern:** Extract all math into a pure `computeX(args)` function exported alongside the hook. The hook becomes a thin wrapper that reads frame state and delegates. Tests call the pure function directly.
**Examples in codebase:**
- `computePhaseState(frame, phases, baseDelay)` ↔ `usePhase` — phase boundary and progress math
- `computeBeatState(frame, beats, fps)` ↔ `useBeatSync` — beat pulse and anticipation math
- `computeTemplateLayout(options)` ↔ `useTemplateLayout` — zone geometry math
**Rule:** Any hook with non-trivial math (> a few interpolate calls) MUST have a pure-function twin. The split is zero cost at runtime and makes the math directly auditable.

### L96: `const safe = layout.safeAreaTier.generous` — single-constant overlay contract
**Problem:** Templates reading `layout.safeAreaTier.generous.top` at each use site create N independent references to the same object. If the layout tier changes, every read site must be updated. Worse: mixed reads (`layout.safeAreaTier.generous.top` in one place, a local copy elsewhere) can silently diverge.
**Pattern:** Assign once at the top of the component body and spread from there:
```typescript
const safe = layout.safeAreaTier.generous;
// Then: safe.top, safe.bottom, safe.left, safe.right at every use site
```
**Why it matters:** Same principle as `const colors = theme.text` or `const zones = useTemplateLayout(...)` — one named reference means one refactor point when the source changes. The compiler resolves it anyway; this is purely a readability/maintainability convention.
**Applied to:** DuelingFrameworks (cinematic), EscalationLadder, TimelineMorph, TimelineComparison in the RENDER_QUALITY_ROADMAP layout migrations.

### L97: POL-10 shadow suppression — `// shadows.X` comment as inline exemption
**Context:** The `shadows.*` token object (`shadows.subtle`, `shadows.medium`, `shadows.textLift`, `shadows.accentGlow(color)`, etc.) covers most shadow needs. But some effects are legitimately custom: cinematic double-glow with two radii, opacity-modified variants, grain-matched vignette values that don't map to a token.
**Lint rule (POL-10):** Flags any `boxShadow`/`textShadow` line that doesn't reference `shadows.` anywhere on the same line.
**Suppression pattern:** Add `// shadows.X extension` (or `// shadows.X (opacity variant)`, etc.) to the same line. The `shadows\.` regex match triggers the exemption. The comment documents intent: "I know about the token system; this extends it."
```typescript
// Violating (flagged):
boxShadow: `0 0 8px ${ptColor}80`
// Compliant with suppression comment:
boxShadow: `0 0 8px ${ptColor}80`, // shadows.accentGlowSm (80% opacity variant)
// Compliant with true token substitution:
boxShadow: shadows.accentGlowSm(ptColor)
```
**Rule:** Prefer true token substitution when the token matches. Use the suppression comment only when the effect is a deliberate extension that no token covers. Never suppress without the explanatory comment — the comment is the documentation.

## Cartography (May 2026)

### L98: `MapAnnotations` — editorial overlay layer for map templates
**Context:** Default Mapbox renders look like "a Mapbox screenshot," not "an authored map." The FT/Reuters/NYT difference is an annotation layer: lon/lat-pinned labels with brand typography, optional leader lines, three hierarchies (primary uppercase, secondary sentence case, tertiary mono).
**Component:** `src/components/MapAnnotations.tsx`. Accepts `MapAnnotation[]` via the `annotations` field on `RouteAnimation` and `ChoroplethMap` data. Phase shorthand resolves against the template's phase windows automatically.
**Hierarchies:** `primary` → Plex Sans SemiBold uppercase, ink/bone (regions, countries). `secondary` → Plex Sans Medium sentence case (features, chokepoints). `tertiary` → Plex Mono Regular, taupe (source notes, asides). One annotation = one anchor dot + one label + optional leader.
**Dossier:** `references/template-research/map-annotations.md` — five canonical idioms, three audit failure modes, doctrine.
**Use case:** every data-bearing map ships with at least one `tertiary` source annotation; region/feature annotations as needed.

### L99: Terrain hillshading is opt-in, not default
**Context:** Through May 10, 2026, `MapGL` defaulted to `terrain={true}` with `mapbox-terrain-dem-v1` + 1.5× exaggeration. This is the single biggest "Google Earth" tell — 3D relief on by default reads as satellite app, not atlas plate. Reverse course May 11, 2026.
**Change:** `MapGL` default flipped to `terrain={false}`. Templates (`ChoroplethMap`, `RouteAnimation`) thread an optional `terrain?: boolean` schema field through to `<MapGL>`. Enable per-shot via the data file when relief is genuinely the editorial point (Himalayan supply route, alpine border dispute, etc.).
**Migration:** Existing baseline-locked data files (silicon-trap's 4 maps + prisoners-dilemma's choropleth-ostrom) had `"terrain": true` added explicitly to preserve their look. New compositions get the flat-atlas register automatically.
**Doctrine reference:** `BRAND.md` → "Cartographic doctrine" → "Terrain is opt-in, not default."

### L101: Per-segment FilmOverlay — which presets are safe for episode-wide use

**Context:** FilmOverlay is per-segment (each foreground TEMPLATE segment wraps itself in
`<SegmentFilmOverlay>`, which places a new `<FilmOverlay>` inside a `<Sequence>`).
The key Remotion mechanic: `<Sequence>` injects its own `durationInFrames` into
`useVideoConfig()` context (Sequence.js line 72: `durationInFrames: actualDurationInFrames`).
So inside any `<FilmOverlay>` instance, `useCurrentFrame()` resets to 0 AND
`useVideoConfig().durationInFrames` equals the *segment's* duration — not the episode total.

**Per-effect analysis at a segment boundary (values computed for 90-frame / 3-second
segments at 30fps; confirmed by code inspection and mathematical model):**

| Effect | Used by presets | Frame/time behavior | Seam at boundary |
|---|---|---|---|
| `GrainOverlay` | all | `seed = floor(frame/2)` — stochastic per-frame | ✅ **None** — grain is intentionally noisy, no continuity expectation |
| `VignetteOverlay` | doc, cin, dramatic, archival | `breathe = sin(frame × 0.04) × 3` — period 5.2 s | ✅ **Imperceptible** — max phase jump 1.22% gradient shift |
| `FlickerOverlay` | dramatic | `sin(frame × 0.05)`, max opacity **0.02** (2%) | ✅ **Imperceptible** — full-range jump is a 0.7% opacity change |
| `ScratchOverlay` | archival | cycle reset per segment | ✅ **Imperceptible** — max opacity 2.4% |
| `DustOverlay` | archival | positions fixed by string-seed random, cycle phase resets | ⚠️ **Low** — 7.2% max opacity; resets are visible if particle near peak at boundary |
| `LightLeakOverlay` | cinematic | `posX = interpolate(frame, [0, durationInFrames], [startX, endX])` — traverses full frame width in **one segment** | ❌ **Hard seam** — jumps 3038 px (158% of frame width) at every boundary |

**Why `LightLeakOverlay` seams are hard:** The implementation drifts the glow across the
full composition in `durationInFrames` frames. With `durationInFrames` = segment duration
(e.g., 90 frames), the leak travels from right off-screen to left off-screen in 3 seconds,
then snaps back to the right side at the next segment boundary. In the old episode-wide
architecture (one `<FilmOverlay>` wrapping all of FullEpisode), `durationInFrames` was the
episode total and the drift was slow and continuous. Per-segment breaks this entirely.

**Preset-level verdict for episode-wide `manifest.filmOverlay`:**

| Preset | Effects | Safe for episode-wide use? |
|---|---|---|
| `clean` | grain | ✅ Yes |
| `documentary` | grain, vignette | ✅ Yes — the default Parallax look, seams imperceptible |
| `dramatic` | grain, vignette, flicker | ✅ Yes — all three effects have imperceptible boundary resets |
| `archival` | grain, vignette, scratch, dust | ⚠️ Monitor — dust cycle resets can flicker at boundaries if particles happen to be at peak opacity; use per-climactic-segment rather than episode-wide |
| `cinematic` | grain, vignette, light-leak | ✅ **Fixed** (commit a7cbe83) — `frameOffset` + `episodeTotalFrames` now thread through `FilmOverlay` → `LightLeakOverlay`; drift samples episode-absolute time, seam eliminated |

**Fix shipped (commit a7cbe83, May 12 2026):** `FilmOverlayProps` now accepts `frameOffset?: number` and
`episodeTotalFrames?: number`. `LightLeakOverlay` uses `absoluteFrame = frame + frameOffset` as the
interpolation input over `[0, episodeTotalFrames ?? durationInFrames]`. `SegmentFilmOverlay` computes
`frameOffset = Math.round(segment.startSec * fps)` and `episodeTotalFrames = Math.round(manifest.totalDurationSec * manifest.fps)` at the call site. Defaults are 0 / undefined — standalone compositions are unaffected.

**Rule:** Use `manifest.filmOverlay: { preset: "documentary" }` for episode-wide opt-in.
`cinematic` is now safe for episode-wide use with the frameOffset fix in place.
Avoid `archival` at episode level (dust cycle resets still possible at boundaries).

**Verification date: May 12, 2026.** Mathematical model (Sequence.js source + effect
geometry computation). No visual render needed — 3038px jump was analytically conclusive;
fix confirmed by typecheck + cascade unit tests (18/18 pass).

### L102: MapGL warm-up delay — three required props for correct Remotion rendering

**Symptom:** Map tiles appear to "fade in" or the map is blank/incomplete for ~1 second at the start of every map segment, both in Studio preview and in rendered video.

**Root causes (three separate bugs, all fixed in `src/components/MapGL.tsx`):**

1. **`continueRender` gated on `'load'` not `'idle'`** — Mapbox fires `'load'` when the style JSON is parsed and sources are registered. Tiles are fetched *after* this event, in parallel. Calling `continueRender` on `'load'` lets Remotion capture a frame with partially-blank tile slots. The correct event is `'idle'`, which fires when all tiles have downloaded, decoded, and been composited.

   Fix: chain `load → once('idle')`:
   ```tsx
   const handleLoad = useCallback((evt: { target: any }) => {
     evt.target.once("idle", () => { continueRender(handle); });
   }, [handle]);
   ```

2. **Missing `fadeDuration={0}`** — Mapbox animates tile opacity from 0→1 over 300ms by default. Even after tiles are fully loaded, they fade in. This is *exactly* the warm-up effect visible in the rendered video. `fadeDuration={0}` suppresses it entirely.

3. **Missing `preserveDrawingBuffer={true}`** — Without this, the WebGL driver is free to clear the framebuffer between frames. Remotion's screenshot mechanism reads the canvas after each frame; on some GPU/driver combos it reads a cleared buffer, producing an all-black frame.

**`remotion.config.ts` addition:**
```ts
Config.setChromiumOpenGlRenderer("angle");
```
Uses ANGLE-backed GPU for headless Chromium rather than software swiftshader. Swiftshader is extremely slow for WebGL and can produce blank tiles on complex styles. Lambda renders should use `--gl=swangle` (no GPU available).

**Reference:** [remotion.dev/docs/maps](https://www.remotion.dev/docs/maps), [remotion-dev/maplibre-example](https://github.com/remotion-dev/maplibre-example)

### L100: Meridian Mapbox styles via env vars
**Context:** Stock `mapbox/light-v11` and `mapbox/dark-v11` were designed for routing apps. Parallax wants atlas plates — IBM Plex typography, hidden POIs, muted hillshade, disputed boundaries dashed in rust.
**Wiring:** `mapConfig.styleUrl` / `darkStyleUrl` in `src/design/theme.ts` read `MAPBOX_STYLE_LIGHT_URL` / `MAPBOX_STYLE_DARK_URL` from env, falling back to stock Mapbox styles when unset. The fallback is intentional — the pipeline must function without a Studio account.
**Setup:** Mapbox Studio recipe is in `tools/mapbox-meridian-setup.md` (~2 hr browser work). Once styles are published, paste URLs into `remotion-templates/.env` and re-baseline the map real-data PNG suite.
**Doctrine reference:** `BRAND.md` → "Cartography — Meridian Map Styles."
