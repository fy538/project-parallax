# Engineering Polish Audit — 2026-05-16

> Post text-animation + camera-consolidation + pipeline-alignment sweep. Scope: stale docs, dead code, orphaned tests, magic numbers, and similar accumulated cruft. WIP HOLD_MOTION work in the working tree is excluded from findings per scope instructions.

## TL;DR

**SOME CRUFT.** Code itself is in good shape — every new symbol (`motionEasings`, `useStepFramework`, `EMPTY_BOUNDARY`, `detectProportionalMode`, `buildSyncLookup`, `buildNarratedCameraBoundaries`, `computeStepFrameworkState`, `getStepProgress`) is used by either templates, camera hooks, or tests. The cruft is concentrated in doc/comment drift from the visual-regression overhaul (file-size → pixel-diff migration) and one missed template in the `PhaseWindow extends StepBoundary` consolidation.

Headline findings:
1. **ChoroplethMap was missed from the PhaseWindow consolidation** — still uses the legacy `startFrame`/`endFrame` shape, does not extend `StepBoundary`, does not consume `computeStepBoundaries`. The other four map templates (AtlasPlate via atlasCamera, DensityMap, CartogramMap, ProportionalSymbolMap) all converged. (HIGH)
2. **`templates.test.ts` file header + `AGENTS.md:92` still document the deprecated 5% file-size tolerance** even though the implementation moved to pixelmatch with 0.5% pixel-diff threshold (see `render-helper.ts:181-200`). (MEDIUM)
3. **`project/DECISIONS.md` "Last updated"** header says April 26, 2026, but the file's most recent entry is D40 dated May 10, 2026. Header stale by ~3 weeks. (MEDIUM)
4. The local `PhaseWindow` interface body is still redeclared in DensityMap, CartogramMap, ProportionalSymbolMap (each adds its own per-template `phase` typing). Could share AtlasPlate's `PhaseWindow<P>` generic; current redeclarations are 3-line near-duplicates. (LOW)

---

## HIGH-priority findings

### H1. ChoroplethMap missed from StepBoundary consolidation
`remotion-templates/src/templates/ChoroplethMap/ChoroplethMap.tsx:117-140`

```ts
interface PhaseWindow {
  phase: AnimationPhase;
  startFrame: number;
  endFrame: number;
  index: number;
}
function computePhaseWindows(phases: AnimationPhase[]): PhaseWindow[] {
  let cursor = 0;
  return phases.map((phase, i) => { ... });
}
```

No `StepBoundary` import; no `computeStepBoundaries` call; locally implements the same frame-cumulative math the step framework owns. Every other map template in the consolidation series uses `PhaseWindow extends StepBoundary` plus delegated math. This is the "after our last commit they all extend StepBoundary" claim drifting.

**Recommendation:** Convert ChoroplethMap to the same shape — `interface PhaseWindow extends StepBoundary { phase; index }`, delegate to `computeStepBoundaries`, replace `getCurrentPhase` with `getCurrentStepIndex`. Mirrors the DensityMap/CartogramMap pattern.

---

## MEDIUM-priority findings

### M1. Stale 5% file-size tolerance documentation
- `remotion-templates/src/__tests__/templates.test.ts:6` — JSDoc header still says "renders are compared with file-size tolerance (5%)". The implementation in `render-helper.ts:181-200` is pixelmatch with 0.5% pixel-diff threshold.
- `AGENTS.md:92` — "catches future drift via 5% file-size tolerance" in the Testing section.

**Recommendation:** Replace both with the pixel-diff description that already lives in `render-helper.ts` JSDoc.

### M2. `project/DECISIONS.md` header lying
`project/DECISIONS.md:6` reads `Last updated: April 26, 2026`. Latest entry is **D40 (May 10, 2026)** at line 378. Not dormant — it's being maintained — just the header isn't.

**Recommendation:** Bump header to May 10, 2026, or wire a hook that auto-stamps on `git add` of this file.

### M3. `tools/list_orphan_episode_json.py` not mentioned in CLAUDE.md `tools/` line
CLAUDE.md describes `tools/` as "Python CLIs: assembly, brand-treatment, asset-source, recraft, concepts". Actual contents also include first-class entrypoints `preflight.py`, `postflight.py`, `validate_data.py`, `cost_tracker.py`, `render_log.py`, `migrate_manifest.py`, `sourcing_brief.py`, `pipeline_validator.py`, `check_*.py`, `list_orphan_episode_json.py`. Not all need to be enumerated in CLAUDE.md, but the elevator-pitch line undersells what's there. (AGENTS.md does enumerate them — this is purely a CLAUDE.md-side phrasing nit.)

### M4. Old "Phase 1 / Phase 2 / Phase 3" framing in `remotion-templates/POLISH.md:560`
> "Phase 3 wires `TEMPLATE_DRIFT_DEFAULTS` so each template uses its register's preset by default; Phase 4 adds `DIR: drift(<preset>)` … Phase 5 ships a catalog showcase …"

`DIR: drift(<preset>)` and `DIR: hold(stillness)` are already documented as future-tense here, but the wider system (DIRECTING_LANGUAGE.md, HOLD_MOTION_REGISTER.md) treats them as part of the HOLD_MOTION work-in-progress. Either align (POLISH.md says "pending HOLD_MOTION work") or remove the Phase 3/4/5 framing — that vocabulary belongs to text-animation, not to drift presets.

---

## LOW-priority findings

### L1. `PhaseWindow` interface body redeclared per template
After the StepBoundary consolidation, DensityMap (`DensityMap.tsx:68-72`), CartogramMap (`CartogramMap.tsx:79-83`), ProportionalSymbolMap (`ProportionalSymbolMap.tsx:97-111`), and AtlasPlate (`atlasCamera.ts:60-63`) all carry near-identical four-line interface bodies that differ only in the `phase` field's domain type. Could collapse to a single generic in `stepFramework.ts`:

```ts
export interface PhaseWindow<P> extends StepBoundary { phase: P; index: number; }
```

Take-or-leave; the redeclaration is cheap and keeps each template self-contained for grep.

### L2. `// TODO: switch to binary search when boundaries.length > 50`
`remotion-templates/src/utils/stepFramework.ts:135` — flagged in scope. The comment is accurate (current callers use ≤20-element arrays, linear scan is faster than binary search for that size). Worth keeping; consider rephrasing as `// NOTE:` rather than `// TODO:` so it doesn't pollute TODO greps as actionable.

### L3. Stale HorizontalTimeline TODOs
`remotion-templates/src/catalog/Timelines.tsx:227, 274` — two identical `// TODO: HorizontalTimelineData doesn't expose 'source' yet — when it does, …` comments. If the source field isn't on the roadmap, downgrade to NOTE; if it is, link to the issue or DIRECTING_LANGUAGE entry.

### L4. `remotion-templates/POLISH.md`, `BRAND.md` "Last updated" headers
`POLISH.md` says May 14 (A6 rewrite). `BRAND.md` says May 14 (Motion Register). Both files were touched in the May 16 camera-consolidation series. Headers are not load-bearing but worth a quick bump if anything material changed; verify by `git log --since=2026-05-15 -- remotion-templates/BRAND.md remotion-templates/POLISH.md`.

### L5. AI_VIDEO_PIPELINE.md uses Phase 1/2/3 labels for iteration plan
`project/AI_VIDEO_PIPELINE.md:688-703` — "Phase 1: Style Lock (before EP01 records)" / "Phase 2: EP01 Integration" / "Phase 3: Pipeline Automation". The EP01 framing is now stale (no episode is called EP01; slug-based identification per CLAUDE.md). Not blocking — re-frame next time this doc is touched. Mentioned because scope flagged Phase 1/2/3 hunting.

### L6. `templates.test.ts:9-15` header lists landscape compositions that drift
The JSDoc enumeration at the top of templates.test.ts is hand-maintained and now lists `TimelineComparison` and `DualTimeline` as if active even though both are deprecated (removed from `COMPOSITIONS` array in the same file per the comment at line 63-65). Header description doesn't match the constant. Trim the list or replace it with "See `COMPOSITIONS` const below."

---

## Non-findings (checked, clean)

- **Dead exports.** All flagged new symbols (`motionEasings`, `useStepFramework`, `computeStepFrameworkState`, `getStepProgress`, `EMPTY_BOUNDARY`, `StepBoundary.id`, `detectProportionalMode`, `buildSyncLookup`, `buildNarratedCameraBoundaries`) have live callers in `src/hooks/useNarratedCamera.ts`, `src/hooks/useTimelineCamera.ts`, `src/hooks/useTreeCamera.ts`, or `__tests__/`. Zero references to legacy `cinematicEasings`, `TRACK_EASE`, `SNAP_EASE`, `ZOOM_EASE` outside historical engineering memos in `project/CAMERA_CONSOLIDATION_*.md` (those are intentional review artifacts).
- **Orphan catalog/EditorialDirections.** Imported by `catalog/index.tsx:147`; the three exploratory layouts are registered through that path. Not orphaned.
- **Orphan tests.** `useStepFramework.test.ts`, `useNarratedCamera.test.ts`, `stepFramework.test.ts` all import live symbols. `catalog-smoke.test.ts:282` and `templates.test.ts:265` use `expect(true).toBe(true)` only inside the baseline-pass branch of a real pixel-diff comparison (correct vitest pattern for "no regression"). `expect(typeof ...).toBe("function")` calls are sanity gates immediately followed by behavioral assertions (`stepFramework.test.ts:247`, `animation.test.ts:85`, `atlasProjection.test.ts:73`).
- **Deprecation markers.** All four `@deprecated` blocks (TimelineComparison.tsx, DualTimeline.tsx, plus the `cinematicEasings` comment-only deprecation note in stepFramework.ts:189-193) cite the replacement and have shipping migrations. Not stale.
- **`motion-design.md § 8`.** Referenced from `POLISH.md:484` and exists at `remotion-templates/references/template-research/motion-design.md` § 8 "Specific upgrades proposed". Link still resolves.
- **`computePhaseWindows` / `getCurrentPhaseIndex` / `FALLBACK_PHASE_WINDOW.start`.** All still exist (and are now thin wrappers around the step-framework primitives where the consolidation reached). No drift in their JSDoc names.
- **Repo-map drift in CLAUDE.md / AGENTS.md.** Neither doc enumerates templates or hooks at the level that would drift; both stop at directory-level. CLAUDE.md only undersells `tools/` (see M3).
- **Magic numbers in new step-framework code.** No unexplained constants. `EMPTY_BOUNDARY` is named; `boundaries.length > 50` in the TODO at L2 is the only literal.
- **README files.** Only `tools/recraft/README.md` exists; current and accurate. No `remotion-templates/README.md` to go stale.
- **`scripts/` entrypoints.** All eight (`test.sh`, `typecheck.sh`, `lint.sh`, `clean.sh`, `regen-baselines.sh`, `test-watch.sh`, `worktree.sh`, `check-episode.sh`) documented in AGENTS.md.
