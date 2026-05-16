# Camera Consolidation — External Research

Research for the `peppy-singing-patterson` plan (extract shared step/phase boilerplate from six camera files into `src/utils/stepFramework.ts`). Surveys how Remotion, Framer Motion, GSAP, Theatre.js, drei/camera-controls, Mapbox GL JS, After Effects, and xstate handle the same problem.

## 1. TL;DR

- **Proceed with the plan, mostly as written.** Every mature system (Remotion `<Series>`, GSAP timeline labels, Theatre.js sheets, Mapbox `AnimationOptions`) keeps the same two-layer split the plan proposes: (a) a domain-neutral *timing/easing primitive*, (b) a domain-specific *pose interpolator*. The plan's Layer A / Layer B division is industry-standard.
- **Rename `cinematicEasings` to keep narrower scope.** The three presets (`track`, `snap`, `zoom`) describe *motion intent*, not "cinematic" vs other. Suggest `motionEasings` or `transitEasings` — more accurate, less marketing.
- **Adopt "waypoint" or "keyframe" vocabulary, not "step boundary".** Theatre.js, GSAP, Framer Motion all call these *keyframes*; drei/camera-controls calls them *poses*. "Step" is fine internally but `StepBoundary` is a Parallax-specific term — keep it but document the synonym.
- **Don't replace boundary math with Remotion `<Series>`.** `<Series.Sequence>` cuts/unmounts at boundaries, but our hooks need *frame-continuous* access across boundaries to interpolate the camera. The plan correctly keeps manual boundary math.
- **Layer B (generic `Pose<T>`) is correctly deferred.** Mapbox, SVG, and FreeCamera diverge on coordinate semantics (lng/lat vs px vs meters-altitude) in ways no library has cleanly unified. Wait for a second consumer.

## 2. Findings by source

**Remotion.** [`interpolate`](https://www.remotion.dev/docs/interpolate) + [`useCurrentFrame`](https://www.remotion.dev/docs/use-current-frame) is the canonical camera-move idiom; multi-keyframe `interpolate(frame, [0, t1, t2, end], [v0, v1, v2, vE])` is recommended over spring for camera. The official [Ken Burns template](https://www.reactvideoeditor.com/remotion-templates/ken-burns) uses exactly the pattern Parallax already uses. [`<Series.Sequence>`](https://www.remotion.dev/docs/series) eliminates cumulative-frame math for *mounting* children — but Parallax cameras need a continuous frame value to interpolate across boundaries, so `<Series>` isn't a substitute for `computeStepBoundaries`. [Discussion #639](https://github.com/orgs/remotion-dev/discussions/639) confirms `interpolate` is the recommended path for camera zoom. No official "shared camera hook" utility exists in the Remotion ecosystem — every project rolls its own.

**Framer Motion.** Camera-style animations use [keyframe arrays + a parallel `times` array](https://www.framer.com/motion/animation/) (`animate={{ x: [0, 100, 50] }}` paired with `transition={{ times: [0, 0.6, 1] }}`). The crucial design choice: *times are normalized 0–1, not absolute*. Parallax's frame-based `StepBoundary` is the absolute-time equivalent. Framer also exposes [`useTime`](https://www.framer.com/motion/) for frame-driven custom hooks, which is structurally identical to `useCurrentFrame`. There's no notion of phase/step as a first-class concept — keyframes are flat arrays.

**GSAP.** [Timeline labels](https://gsap.com/docs/v3/GSAP/Timeline/) are GSAP's answer to phase boundaries: `tl.addLabel("zoom-in").to(...).addLabel("hold")`. Labels can be referenced positionally (`"zoom-in+=0.2"`) and seeked. This is the closest industry analog to what Parallax calls "step boundaries". Key insight: GSAP labels are *named* and embedded in the timeline, not computed separately. Parallax could borrow this idea — give each phase an optional `id` so debug tooling can reference it ("camera-step-3" instead of `[2]`).

**Theatre.js / drei.** [Theatre.js](https://www.theatrejs.com/docs/latest/api/r3f) and [`camera-controls`](https://yomotsu.github.io/camera-controls/classes/CameraControls.html) both maintain a strict **pose vs interpolation** separation. `setLookAt(px, py, pz, tx, ty, tz, enableTransition)` takes a pose (position + target) plus a single boolean for "animate or jump". No notion of named easing presets; the library owns the easing curve. `saveState()`/`toJSON()`/`fromJSON()` persist poses. This validates the plan's choice to *not* generalize pose math (each domain has its own `CameraPose` shape) — the libraries that try (Theatre.js) end up with editor-tool overhead Parallax doesn't need.

**Mapbox GL JS.** [`easeTo`/`flyTo`](https://docs.mapbox.com/mapbox-gl-js/api/properties/) accept `CameraOptions` (`center`, `zoom`, `bearing`, `pitch`, `padding`) plus `AnimationOptions` (`duration`, `easing`, `curve`, `speed`, `essential`, `offset`, `maxDuration`, `preloadOnly`). The `essential` flag respects `prefers-reduced-motion` — Parallax doesn't need this (offline render), but the *separation of pose from transition options* is the lesson. Parallax already mirrors this implicitly: `CameraPose` (the where) is separate from `cinematicEasings` (the how). Mapbox's `flyTo` doesn't support intermediate waypoints; it ballistic-arcs between two poses. So our `RouteAnimation` pattern (sequence of `flyTo`-like phases) is actually *more powerful* than Mapbox's native API — there's no off-the-shelf primitive to inherit from.

**After Effects.** The [null-parented camera rig](https://www.schoolofmotion.com/blog/cameras-after-effects) is the standard motion-graphics camera model: a null object holds transforms, the camera is parented to the null, expressions drive the null. This is the "outer transform" pattern AtlasPlate already uses (SVG `<g transform>` wrapping the inner projection). No expression library has standardized "phase" as a first-class concept — motion designers usually hand-key markers and write per-project expressions.

**xstate / phase machines.** State machines [model animation phases](https://css-tricks.com/coordinating-svelte-animations-with-xstate/) when phases are *event-driven* (user clicks → opening → open). Parallax's phases are *time-driven* — frame X is always in phase Y. xstate adds overhead with no benefit for time-driven animation. Confirms the plan correctly stays with array-of-boundaries instead of a state machine.

## 3. What translates to Parallax

Concrete suggestions for `stepFramework.ts`:

1. **Keep the three exports** (`computeStepBoundaries`, `getCurrentStepIndex`, `cinematicEasings`). Every external system has all three, just under different names.
2. **Consider a fourth helper: `getStepProgress(frame, boundary)`**. Five of the six files compute `(frame - start) / (end - start)` clamped to [0, 1] right after `getCurrentStepIndex`. Adding it costs three lines and removes another duplication.
3. **Rename `cinematicEasings` → `motionEasings`.** `track` / `snap` / `zoom` map to Mapbox's intuition of "linear-ish dolly" / "outExpo reveal" / "leads-pan zoom curve". The word "cinematic" is brand fluff. Industry names: `track` ≈ "ease" (CSS), `snap` ≈ "easeOutExpo" (Penner), `zoom` ≈ no standard name (it's a Parallax invention — keep it).
4. **Use `StepBoundary { start, end }` as the canonical type.** Theatre.js calls intervals `{from, to}`, GSAP uses labels (no interval type). `{start, end}` is the clearest. Document `PhaseWindow` (AtlasPlate) and the implicit `boundary` (Mapbox hooks) as type aliases.
5. **Make `getCurrentStepIndex` binary-search-ready.** Current linear scan is fine at N≤20. Add a `// TODO: binary search if boundaries.length > 50` comment so the future swap is obvious. Don't pre-optimize.
6. **Add a `lastBoundary` accessor**. Multiple files compute `boundaries[boundaries.length - 1].end` to get total duration. Tiny helper.

## 4. What to skip

- **`Pose<T>` generic abstraction (Layer B).** Three.js's `Vector3` + quaternion model, Mapbox's spherical-mercator lng/lat, and SVG's 2D affine are too different. Theatre.js generalizes by treating each pose property as an independent scalar — which loses the geometric invariants Parallax relies on (e.g. AtlasPlate's `targetScale / baseScale` ratio). Skip until 3+ consumers force the issue.
- **xstate-style phase machine.** Adds dependency + concept burden for a time-driven (not event-driven) system. Wrong tool.
- **Theatre.js editor integration.** Tempting (visual keyframe editor!) but the tool is built for interactive web 3D; Parallax's keyframes live in JSON and are author-typed. The editor would slow the pipeline.
- **GSAP labels-as-strings.** Pretty for hand-authored code; ugly in JSON. Parallax's JSON-first authoring means string IDs are inferior to numeric indices.
- **Mapbox `flyTo` curve parameter (`curve: 1.42`).** Beautiful idea — controls the "altitude profile" of a fly-through — but only useful when a single transition spans many zoom levels. Parallax's transitions are short (≤1.2s) and don't need ballistic arcs.

## 5. Updated plan delta

Specific changes to `peppy-singing-patterson.md`:

- **Add a fourth utility export**: `getStepProgress(frame: number, boundary: StepBoundary): number` — clamped 0–1. Used in 5 of 6 files. Adds ~5 lines, deletes ~10. ([precedent: Framer Motion `times` array semantics](https://www.framer.com/motion/transition/))
- **Rename `cinematicEasings` → `motionEasings`** OR keep the name but add a JSDoc comment citing the industry equivalents (CSS `ease`, Penner `easeOutExpo`). Either is fine; pick one and document.
- **Add type aliases for cross-domain naming**: `export type PhaseWindow = StepBoundary & { phase: T; index: number }` as a generic helper, so AtlasPlate doesn't need to redefine its own. Optional, low priority.
- **Document the "why not `<Series>`" decision in the new file's header comment.** Future readers will ask. One-liner: "Camera hooks need continuous frame access across boundaries to interpolate; `<Series>` only handles mount/unmount."
- **Add a unit test specifically for the boundary-at-exact-frame case** (`frame === boundary.end`). Off-by-one is the classic bug here; every external system has had it.
- **Skip the rename of `TRACK_EASE` to `cinematicEasings.track` in mid-function blocks** if it makes diff review harder — destructure at the top of each file instead: `const { track, snap, zoom } = cinematicEasings`. Cleaner.

## 6. Open questions

1. **Should we adopt named phase IDs (GSAP-style labels)?** Adds debuggability (`console.log("entered phase: zoom-in")`) at the cost of authoring overhead. Recommend: defer until a debugging episode forces the issue.
2. **Should `getStepProgress` be added in this PR or follow-up?** Five-of-six duplication argues for now; scope creep argues for follow-up. Leaning: include it — same conceptual unit.
3. **Do we want a `useStepFramework(durations)` React-side hook?** Combines `computeStepBoundaries` + `getCurrentStepIndex` + `getStepProgress` into one `useMemo`-cached call. Possibly cleaner. But hooks-over-functions adds a React dep where currently there is none, and `usePhase.ts` already does roughly this — maybe just rename/repurpose `usePhase.ts` as the canonical "step framework hook". Needs a decision before implementation.
4. **Should `FALLBACK_PHASE_WINDOW` in `atlasCamera.ts` move into `stepFramework.ts` as a generic `EMPTY_BOUNDARY: StepBoundary`?** Six consumers all need an empty-array guard; consolidating the sentinel would be nice. Low priority.

---

Sources cited inline above. Key references:

- Remotion: <https://www.remotion.dev/docs/interpolate>, <https://www.remotion.dev/docs/series>, <https://github.com/orgs/remotion-dev/discussions/639>
- Framer Motion: <https://www.framer.com/motion/animation/>, <https://www.framer.com/motion/transition/>
- GSAP: <https://gsap.com/docs/v3/GSAP/Timeline/>
- Theatre.js: <https://www.theatrejs.com/docs/latest/api/r3f>, <https://tympanus.net/codrops/2023/02/14/animate-a-camera-fly-through-on-scroll-using-theatre-js-and-react-three-fiber/>
- camera-controls / drei: <https://yomotsu.github.io/camera-controls/classes/CameraControls.html>, <https://drei.docs.pmnd.rs/controls/camera-controls>
- Mapbox: <https://docs.mapbox.com/mapbox-gl-js/api/properties/>, <https://docs.mapbox.com/mapbox-gl-js/example/camera-animation/>
- xstate: <https://css-tricks.com/coordinating-svelte-animations-with-xstate/>
- After Effects: <https://www.schoolofmotion.com/blog/cameras-after-effects>
