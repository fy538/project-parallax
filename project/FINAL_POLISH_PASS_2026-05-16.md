# Final Polish Pass — 2026-05-16

Third audit after `PIPELINE_ALIGNMENT_AUDIT_2026-05-16.md` and `ENGINEERING_POLISH_AUDIT_2026-05-16.md`. Scope: perf, API ergonomics, test coverage, skill↔implementation truth.

## 1. TL;DR

Consolidation landed cleanly. Three things worth doing before the next episode:

1. **`skills/audio-spec/SKILL.md` lines 130–134 contradict `project/AUDIO_DESIGN.md`** — names a SFX cue (`register-shift`) that doesn't exist in the palette and assigns the wrong cue to two other `cut(...)` types. The one finding here that produces wrong output if unfixed.
2. **The locked bug in `buildNarratedCameraBoundaries` (end<start when `next.start < this.start`) should be fixed, not locked.** One-line floor at `useNarratedCamera.ts:308`.
3. **`usePhase` runs `computePhaseState` every frame** even though its memoised `starts` carry the same data. Wasteful and confusing.

Everything else is clean.

## 2. Real findings

### F1 — Audio-spec skill names a SFX cue that doesn't exist [P1]
`skills/audio-spec/SKILL.md:130`: `cut(color-wash) → register-shift`. `register-shift` is not in `AUDIO_DESIGN.md`'s SFX palette (lines 53–60) or audio tree (142–151). Three mismatches in the same paragraph:

| Skill (line 130–134) | AUDIO_DESIGN.md (line 398–400) |
|---|---|
| `color-wash → register-shift` | `color-wash → section-open` (`register-shift` doesn't exist) |
| `iris → section-open` | `iris → stat-reveal` |
| `blur-through → beat-transition` | `blur-through → tension-rise → tension-resolve` |

Same three claims repeat at `SKILL.md:23`. Fix both blocks.

### F2 — `buildNarratedCameraBoundaries` can produce `end < start` [P2]
`useNarratedCamera.ts:307–312`. When `cameraPath[i+1].start < cameraPath[i].start + sec(0.5)`, the `Math.min(...)` picks the next step's untouched cumulative start, which can be *below* the snapped start. The test at `useNarratedCamera.test.ts:252–272` locks this and comments "the implementation does NOT clamp end ≥ start, so this exposes a potential issue."

Downstream tolerates this only by accident: `getStepProgress` short-circuits on `span <= 0` (`stepFramework.ts:188`); `transitionEnd = Math.min(start+transitionFrames, end)` clamps to end<start so `isTransitioning = frame >= start && frame < transitionEnd` is *always false* for that step. Silent wrong behaviour, not a crash.

Fix in §5.

### F3 — `usePhase` runs the math twice per frame [P3]
`usePhase.ts:178–189`. `useMemo([phasesKey])` builds `{starts, totalDuration}`; then `computePhaseState(frame, phases, baseDelay)` rebuilds `boundaries`/`starts`/`totalDuration` inside `stepFramework.ts:100` every render. The memo's `starts` is only used by two `useCallback`s. Cheap (N≤8 in practice) but the file looks like the memo is load-bearing.

Cleanest fix: change `computePhaseState`'s signature to accept pre-built boundaries (mirror of `computeStepFrameworkState`). Or drop the memo and derive helpers from `state`.

### F4 — `.gitignore` missing two entries [P3]
`git ls-files --others --exclude-standard` shows:
- `.claude/scheduled_tasks.lock`
- `node_modules/` (root — only `remotion-templates/node_modules/` is ignored)

Add both. Top-level `node_modules/` is currently empty but will fill if anyone runs `npm install` from repo root.

### F5 — Two minor edge cases not covered in `useNarratedCamera.test.ts` [P3]
- Duplicate `syncPoints` words: `buildSyncLookup` (`useNarratedCamera.ts:240–242`) uses `Map.set` — last write wins silently. Add a one-line test + comment.
- Two consecutive `syncStart` words snapping to the same frame: analogous squeeze tested (237–250) but not explicit duplicate snap.

Single-step `duration: 0` is safe by inspection (`stepFramework.ts:188` guard).

## 3. API observations (take-or-leave)

- **Parameter order** consistent: `(durations, baseOffset?, ids?)` across `useStepFramework`, `computeStepBoundaries`, `computeStepFrameworkState`.
- **`motionEasings`** destructured identically across hooks (`useNarratedCamera.ts:49`, `useTimelineCamera.ts:40`, `useTreeCamera.ts:48` — last only imports `track, zoom`). No aliasing drift.
- **`StepFrameworkState` vs `PhaseState`** both expose `progress` (same meaning); other fields don't overlap. Different layers, no confusion risk.
- **`EMPTY_BOUNDARY` + per-template `FALLBACK_PHASE_WINDOW`.** Four templates spread `{ ...EMPTY_BOUNDARY, phase: {...}, index: 0 }`. A generic `EMPTY_PHASE_WINDOW<P>(initial: P)` factory saves ~3 lines × 4 sites at the cost of obscuring intent. Leave it.

## 4. Non-findings (checked, clean)

- `JSON.stringify` cacheKey at `useStepFramework.ts:104`: microseconds for N≤20; collision regression test at `useStepFramework.test.ts:179–194`.
- `useMemo` dep arrays in `useNarratedCamera` (lines 394, 400, 403): correct, no per-frame bust.
- React 19 + `@testing-library/react@^16.3.2` + `happy-dom@^20.9.0` + `vitest@^4.1.5`: RTL 16 IS the React 19 release; compatible.
- `skills/visual-spec/SKILL.md` variant claims (`quote`/`definition`/`bilingual`/`statistic`) match `KineticTypography/schema.ts:12` exactly.
- `skills/script-audit/SKILL.md:223` `callback-check` CLI matches `tools/concepts/lookup.py`'s actual subcommand.
- `useTimelineCamera`/`useTreeCamera` outer-`useMemo([cameraPath])` + inner JSON-stringify is redundant but harmless; don't touch.
- `motionEasings` test (`stepFramework.test.ts:255–273`) catches overshoot via the `out ≤ 1.0001` range check, not just monotonicity.

## 5. Should the locked bug be fixed?

**Yes.** One-line change at `useNarratedCamera.ts:307`:

```ts
// before
boundaries[i].end = Math.min(
  boundaries[i].start + sec(0.5),
  i < boundaries.length - 1 ? boundaries[i + 1].start : durationInFrames,
);
// after — floor at start
boundaries[i].end = Math.max(
  boundaries[i].start,
  Math.min(
    boundaries[i].start + sec(0.5),
    i < boundaries.length - 1 ? boundaries[i + 1].start : durationInFrames,
  ),
);
```

Update test `useNarratedCamera.test.ts:264–271` to assert `boundaries[1].end === 200` (clamped to start when next.start is below). Comment becomes "when next.start < this.start the step collapses to zero width — accept the degenerate window over inverted boundaries."

Why fix not lock: locked behaviour silently kills `isTransitioning` for the affected step. The test comment (line 268–270) explicitly flags it as "a potential issue." Regression-locking a confirmed bug stops a future refactor from accidentally fixing it.
