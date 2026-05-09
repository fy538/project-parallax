# Remotion Render Quality Roadmap

> Focused follow-up to the May 2026 render-quality audit.
> Goal: reduce review-loop failures like title/content overlap, off-center assets,
> and layout regressions that only show up in final visual review.

## Current state

The biggest structural wins are already in:

- Charts now use the shared `chartLayout()` contract instead of ad-hoc title/chart/source math.
- `HorizontalTimeline` now uses `useTemplateLayout()` overlay bands instead of raw `safeAreaTier + 60` offsets.
- `SplitComposition` now uses one shared content rect for both cinematic and static modes.
- Real-data regression suites now exist for charts, timelines, and splits:
  - `src/__tests__/chart-real-data.test.ts`
  - `src/__tests__/horizontal-timeline-real-data.test.ts`
  - `src/__tests__/split-real-data.test.ts`
- Font preload noise was reduced in `src/design/fonts.ts` by narrowing Latin weights/subsets.

That means the problem has shifted. The main blocker is no longer "we don't have a system." The blocker is the smaller set of templates and QA gaps that can still slip past the system.

## Highest-leverage remaining work

### 1. ✅ Add render-level collision assertions — DONE

**Delivered (May 2026):**

- `src/__tests__/layout-assertions.ts` — generic zone integrity helpers (`assertNoOverlap`, `assertInBounds`, `assertPositiveDimensions`, `assertCentered`, `assertMinHeight`, `assertZoneIntegrity`). Template-agnostic; operates on any `{ top, left, width, height }` zone.
- `src/__tests__/chart-zone-integrity.test.ts` — 91 pure-function unit tests covering `chartLayout()` across a full config matrix (all four `safeAreaTier` values, every flag combination, multi-row stacking, `extraPad`/`insets` overrides, all active episode DataChart/TimeSeriesChart shapes, plus injected-collision regression tests). Zero browser/render overhead — runs in ~6ms.

**Why this matters (restated for future reference):**
These tests call the layout math directly and cannot be "fixed" by updating a PNG baseline. A collision introduced into `chartLayout()` fails CI even if a developer accepts the broken visual.

**Also delivered (May 2026):**
- `useTemplateLayout.ts`: geometry extracted into exported `computeTemplateLayout()` pure function; all types exported. Hook is now a thin `useMemo` wrapper — zero behaviour change for callers.
- `src/__tests__/template-zone-integrity.test.ts` — 80 pure-function unit tests covering `computeTemplateLayout()` across all title variants, all safe-area tiers, split mode, footer variants, gap overrides, HorizontalTimeline + SplitComposition specific shapes, and split-panel invariants. HorizontalTimeline and SplitComposition zone integrity now covered transitively.

### 2. ✅ Migrate `NetworkDiagram` onto the shared overlay contract — DONE

**Delivered (May 2026):**

Introduced `const safe = layout.safeAreaTier.generous` at the top of the component body. All four overlay sites now derive from this single constant:

- Background grid reference lines (SVG)
- Callout cards — was using `layout.safeArea` (80 px standard tier), now uses `safe` (120 px generous). This also fixes a real bug: callouts were positioned 40 px closer to the edge than TitleBlock and node zones, risking overlap into the title area.
- Source attribution text (SVG)
- Camera step label div

No behavioural change for the source/camera-label overlays (already used generous). The callout fix is a real correctness improvement. Real-data QA suite deferred until an episode actively uses the template.

### 3. ✅ Second-pass cleanup on `TimeSeriesChart` — DONE

**Delivered (May 2026):**

Two fixes applied:

1. **`sourceBottomOffset` computation** — replaced opaque three-step derivation (`H - safeArea.bottom - sourceBottom`) with the direct expression `layout.safeAreaTier.generous.bottom - layout.safeArea.bottom` (always 40 px — the delta between generous and standard tiers). `SourceAttribution` internally adds `layout.safeArea.bottom`, so adding 40 lands it at exactly the generous safe area boundary, matching the rest of the layout.

2. **Hero stat position** — `top/right: layout.padding + 20` (80 + 20 = 100 px) placed the stat 20 px above the generous safe area top, in the HeaderStrip zone. Fixed to `layout.safeAreaTier.generous.top/right` (120 px), keeping the stat inside the safe area and aligned with the TitleBlock.

**Left intentionally unchanged:**
- Annotation labels use chart-space coordinates (annotX derived from data values) — correct by design, not a layout contract issue.
- Y-axis label zone uses `layout.padding` (80 px standard) rather than generous — intentional extra space for tick mark text; narrowing it would risk label overflow.

### 4. Expand real-data QA to one more high-surface template family

Why this matters:

- The new chart/timeline/split suites are much better than the legacy "render frame 30 of every template" smoke test in `src/__tests__/templates.test.ts`.
- The next quality gains will come from using real episode data on the templates that appear most often, not from adding more generic one-frame tests.

Best candidates:

- `FrameworkDiagram`
- `GameBoard`
- `KineticTypography`

Why these are second-tier:

- They do not currently show the same mixed-layout smell as the chart/timeline/split/network group.
- They are still high-surface templates, so a thin real-data suite would improve confidence on the shots that appear most often.

Definition of done:

- Each candidate gets a small review suite with one live shot and one stress variant, following the pattern used by chart/timeline/split QA.

## Second-tier layout migration batch

These are real follow-up candidates that showed the same broad smell pattern on a second pass, but they are not as urgent as collision QA or `NetworkDiagram`.

### `DuelingFrameworks` cinematic mode

What I found:

- Static mode already uses `useTemplateLayout()`.
- Cinematic mode still positions its two framework panels and scoring band with raw offsets. The relevant code lives in `CinematicDuelingFrameworks.tsx` after the sub-component refactor (previously in the monolithic `DuelingFrameworks.tsx` around lines 473, 596, 659 — those line numbers are stale post-refactor; search for `safeAreaTier` in `CinematicDuelingFrameworks.tsx` to find current locations).

Why it matters:

- This is another half-migrated template: one mode uses shared zones, the other still uses bespoke viewport math.
- That makes it vulnerable to the same "looks fine until title/copy density changes" problem we just removed from timeline and split layouts.

Why it is second-tier:

- It is a meaningful cleanup, but it is not currently the clearest launch-review blocker compared with collision QA and `NetworkDiagram`.

### `EscalationLadder`

What I found:

- The ladder itself is anchored with `contentArea("content", "generous")`.
- The camera label and legend are still free-positioned with offsets from generous safe areas:
  - `src/templates/EscalationLadder/EscalationLadder.tsx:499`
  - `src/templates/EscalationLadder/EscalationLadder.tsx:531`

Why it matters:

- Structurally, this is very similar to the pre-migration timeline state: core content is zone-based, overlays are not.

Why it is second-tier:

- I would group it into a later "overlay normalization" pass unless an upcoming episode depends heavily on it.

### `TimelineMorph` and `TimelineComparison`

What I found:

- Both templates combine `contentArea("minimal", "generous")` content boxes with separate top and footer overlays using raw `layout.safeAreaTier.generous.*` positions.
- Relevant lines:
  - `src/templates/TimelineMorph/TimelineMorph.tsx:300`
  - `src/templates/TimelineMorph/TimelineMorph.tsx:354`
  - `src/templates/TimelineComparison/TimelineComparison.tsx:166`
  - `src/templates/TimelineComparison/TimelineComparison.tsx:228`

Why it matters:

- These older timeline comps look stable, but they still reflect the pre-`useTemplateLayout()` pattern.
- If they come back into active use, they are good candidates for the same overlay-band treatment used in `HorizontalTimeline`.

Why they are second-tier:

- They are more "consistency debt" than proven current blockers.

## Useful cleanup, but not the main blocker

These are worth doing eventually, but they are not the best answer to "why are reviews still painful?"

### Inline shadow token cleanup

The linter's remaining infos are mostly `POL-10` inline shadow strings. These should be normalized over time, but they are stylistic consistency issues, not the main overlap/centering blocker.

Examples:

- `src/templates/HorizontalTimeline/HorizontalTimeline.tsx:700`
- `src/templates/SplitComposition/SplitComposition.tsx:773`
- `src/templates/TimeSeriesChart/TimeSeriesChart.tsx:450`

### Template polish infos outside the active pain path

Examples like `ImageComposite` background duplication are real cleanup items, but they are not likely to explain repeated review loops on charts, timelines, or split screens.

### Templates that look healthy enough for now

A second pass did not turn up anything more urgent than the items above in:

- `ProbabilityGauge`
- `RouteAnimation`

Those templates still have room for polish, but they do not currently show the same mixed-contract layout risk as the main backlog items.

## Suggested execution order

1. Build render-level collision assertions for the templates already under real-data QA.
2. Migrate `NetworkDiagram` if the next episode needs it, or move directly to item 3 if not.
3. Do the second-pass `TimeSeriesChart` overlay cleanup if chart review still finds issues.
4. Add one more real-data QA suite for a high-surface but structurally safer template family.
5. Batch the second-tier layout migrations: `DuelingFrameworks`, `EscalationLadder`, then the legacy timeline comps.
6. Sweep `POL-10` inline shadow cleanup when the layout/blocking work is stable.

## Decision rule

When choosing between a cleanup and a layout migration, prefer the work that does one of these:

- removes a mixed layout contract from a live template
- catches a collision class in automation
- improves confidence on templates used by real episode shots

If a task only makes the code prettier or reduces linter infos, it should usually wait behind the three items above.
