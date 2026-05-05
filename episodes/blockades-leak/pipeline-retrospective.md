# EP02 Pipeline Retrospective — End-to-End Stress Test Results

## Date: May 2, 2026
## Purpose: Document handoff gaps, format mismatches, and pipeline improvements discovered by running all 16 skills sequentially on EP02.

---

## Test Summary

Ran the full Parallax production pipeline on EP02 ("Why Technological Blockades Always Leak") from signal through visual-spec:

| Stage | Skill(s) | Output | Status |
|-------|----------|--------|--------|
| 1-2 | topic-viability | viability-check.md | ✅ Clean |
| 3 | (research simulation) | brief.md | ✅ Clean |
| 4 | research-audit | research-audit.md | ✅ Clean |
| 5 | angle-memo | angle-memo.md | ✅ Clean |
| 6 | script-draft | script-v1-production.md | ✅ Clean |
| 7a | visual-concept | visual-concept-audit.md | ✅ Clean |
| 7b | script-audit | script-audit.md | ✅ Clean |
| 7c | persona-eval | persona-eval.md | ✅ Clean |
| 7d | review-package | review-package.md | ✅ Clean |
| 7e | thumbnail-concept | thumbnail-concepts.md | ✅ Clean |
| 8 | visual-spec | visual-spec.md | ✅ Clean |
| 9 | shorts-adaptation | shorts-briefs.md | ✅ Clean |

**12 artifacts produced. Zero blocking handoff failures.** Every skill consumed the previous skill's output without format errors or missing information.

---

## Finding 1: The Pipeline Works

The most important finding: **the skills chain together cleanly.** Each skill's output format matches the next skill's expected input. Specifically:

- topic-viability → research-audit: The viability check's 5-question structure gave research-audit enough context to calibrate its lenses.
- research-audit → angle-memo: The "READY FOR SCRIPTING" verdict with rubric scores provided clear go/no-go for angle-memo to begin. The brief's cross-domain connections fed directly into the angle memo's connection selection.
- angle-memo → script-draft: All 9 narrative decisions (named concept, cold open, emotional arc, visual motif, format, connections, stakes, decoder framing, concept callbacks) provided exactly the scaffolding script-draft needed. No decisions had to be re-made during drafting.
- script-draft → audits: The two-column format with visual mode tags, priority tiers, claim verification tags, and asset summaries gave all three audit skills (visual-concept, script-audit, persona-eval) everything they needed to run independently.
- audits → review-package: Three separate reports synthesized into one document without information loss. Review-package correctly identified convergent findings (Beat 4-5 rhythm issues flagged by both visual-concept and script-audit independently).
- script → visual-spec: The right-column specs were detailed enough for visual-spec to map every visual moment to a template, generate filenames, and produce data field specs.
- script → shorts-adaptation: The two-column format gave shorts-adaptation access to both narration (for standalone test) and visual specs (for template assignment).

---

## Finding 2: Convergent Audit Findings Validate the Multi-Lens Design

When visual-concept and script-audit independently flag the same issue (Beat 4-5 MG monotony, max-3 consecutive rule violations), it confirms the issue is real, not a false positive. The review-package synthesis correctly elevated these convergent findings to highest priority.

Similarly, persona-eval's Marcus friction point at minute 4-7 aligned with script-audit's lecture detection in Beat 2 (define-then-illustrate ordering). Three separate lenses found the same structural weakness through different analytical paths.

**Pipeline implication:** The parallel audit design (visual-concept + script-audit + persona-eval running simultaneously) produces better signal than sequential auditing would, because convergent findings get amplified in review-package.

---

## Finding 3: Handoff Gaps Identified (Non-Blocking)

### Gap A: Visual-concept audit findings not automatically fed to visual-spec

**What happened:** Visual-concept flagged template mismatches (e.g., Hong Kong smuggling map should be RouteAnimation not ChoroplethMap) and complexity warnings (pasture animation needs simplification). Visual-spec was run next and had to read the visual-concept audit to incorporate these findings.

**The gap:** There's no structured handoff format between visual-concept and visual-spec. Visual-spec had to parse a prose report to find actionable items.

**Suggested fix:** Visual-concept audit should include a machine-readable "Fixes for Visual-Spec" section at the end — a simple table of composition ID, current template, recommended template, and reason. Visual-spec can then consume this directly.

### Gap B: Angle memo's concept registry check has no structured format for script-draft

**What happened:** Angle memo identified 3 EP01 callbacks and 6 new concepts. Script-draft used them, but had to extract concept names and definitions from prose paragraphs in the angle memo.

**The gap:** The concept registry information in the angle memo isn't in a format that script-draft can mechanically check against. Script-draft could miss a callback or introduce a concept inconsistently.

**Suggested fix:** Angle memo should include a "Concept Registry" section with structured entries: concept name, type (callback vs. new), definition (if new), suggested introduction beat. This becomes a checklist for script-draft.

### Gap C: Review-package cold-open variants not connected to thumbnail-concept

**What happened:** Review-package included 3 cold-open variants. Thumbnail-concept ran in parallel and designed thumbnails based on the angle memo's title options. The two outputs (cold-open variants + thumbnail concepts) weren't coordinated — a specific cold-open variant might pair better with a specific thumbnail approach, but this wasn't analyzed.

**The gap:** The title/hook workshop step (which coordinates title + cold open + thumbnail as a package) hasn't been formalized as a skill. It's currently a manual Tiger step.

**Suggested fix:** Consider formalizing a title-hook-workshop skill that takes review-package cold-open variants + thumbnail-concept options and produces a coordinated package (title + opening + thumbnail as a matched set). Low priority — this is a creative judgment step that may be better left manual.

### Gap D: Shorts-adaptation doesn't consume visual-concept findings

**What happened:** Shorts-adaptation assigned Remotion templates to each Short (KineticShort, SplitShort, etc.) but didn't reference the visual-concept audit's feasibility findings. If a template has known complexity issues for the full episode, the same issues likely apply to the Shorts version.

**The gap:** Shorts-adaptation runs independently of visual-concept findings. It should at least check whether any templates it assigns were flagged with complexity warnings.

**Suggested fix:** Low priority. Shorts use different (simpler) templates than the full episode. But adding a brief cross-check against visual-concept findings would be good hygiene.

---

## Finding 4: Format Consistency Issues (Minor)

### Issue A: Claim verification tag syntax varies

The script uses `{✅}`, `{⚠️}`, and `{NEW}` tags per SCRIPT_FORMAT.md. However, in several places the script has double-brace typos: `{{✅}`, `{{⚠️}`. This didn't break anything because script-audit's claim lens is flexible enough to catch both formats, but it could cause problems if a future tool does exact-match parsing.

**Fix:** Add a note to script-draft skill: "Use single braces for claim tags: {✅}, {⚠️}, {NEW}. Double braces are a common typo to watch for."

### Issue B: Visual rhythm map format differs between skills

Visual-concept, script-audit (Lens 6), and review-package all produce visual rhythm maps, but each uses slightly different formatting. Visual-concept uses tree notation (`├─`), script-audit uses bracket notation (`[F 10s] [MG:Chart 8s]`), and review-package uses its own hybrid.

**The gap:** If a future tool needs to parse rhythm maps programmatically, the inconsistent format would be a problem.

**Fix:** Low priority for now (all three are human-readable), but consider standardizing the rhythm map format in SCRIPT_FORMAT.md if it becomes a handoff format.

### Issue C: Priority tier distribution in script-draft doesn't match targets

The script's asset summary shows P1: 14, P2: 25, P3: 10. The target ranges from SCRIPT_FORMAT.md suggest P1: 5-8, P2: 10-15, P3: 8-12. The P1 and P2 counts significantly exceed targets. Script-audit noted MG at 33% (3% over target) but didn't specifically flag the priority tier overcount.

**Fix:** This may indicate the script is overspecifying hero visuals. Consider adding a priority tier count check to script-audit Lens 6 or visual-concept Lens 1.

---

## Finding 5: Skill Performance Observations

### What worked exceptionally well:

1. **Research-audit → angle-memo handoff** was the cleanest in the pipeline. The 8-lens audit with a clear verdict gave angle-memo complete confidence about what was script-ready and what needed work.

2. **Angle-memo as narrative scaffolding** proved its value dramatically. The 9 decisions (named concept, emotional arc, visual motif, decoder framing, format, connections, stakes, title options, concept callbacks) eliminated creative decision-making during script-draft, allowing the drafting skill to focus purely on craft.

3. **Persona-eval's visual awareness** (evaluating both columns) produced insights that script-audit's Lens 6 couldn't: the distinction between "this visual works technically" and "this visual works for Marcus's attention span" is genuinely different.

4. **Review-package synthesis** successfully prioritized convergent findings from three independent audits. The "one document Tiger reads" design works.

### What could be improved:

1. **Script-draft produced a long script.** 2,597 words / 17:18 is at the high end of the 15-18 minute target. The four cross-domain parallels in Beat 5 are individually excellent but collectively create the rhythm problem that all three audits flagged. A lighter-touch approach (2 detailed + 2 brief, as review-package suggests) would keep knowledge density while improving pacing. Consider adding a word-count / parallel-count check to script-draft's self-check.

2. **Visual-concept and script-audit both produce visual rhythm maps,** creating redundancy. Review-package had to reconcile two slightly different rhythm analyses. Consider making visual-concept the authoritative source for visual rhythm and having script-audit reference it rather than re-derive it.

3. **Thumbnail-concept ran without awareness of review-package findings.** In the actual pipeline, these would run sequentially (review first, then thumbnail after Tiger approves direction). In the stress test, we ran them in parallel for speed. No issues resulted, but the sequencing matters for real production.

4. **Shorts-adaptation yielded 4 strong Shorts across 4 series** — better diversity than EP01 (which was also 4 Shorts but with less series variety). The "Philosopher's Lens" format is more Shorts-fertile than expected. Note for pipeline: the cross-domain parallels (Venice, COCOM) are the richest Short sources because they're inherently standalone stories.

---

## Finding 6: Pipeline Timing Estimates

Based on this stress test, approximate timing for the full pipeline:

| Stage | Estimated Time | Notes |
|-------|---------------|-------|
| Viability check | 5 min | Quick gate |
| Research (Deep Research) | 30-45 min | Outside Cowork |
| Research-audit | 10 min | 8 lenses |
| Angle-memo | 15 min | 9 decisions |
| Script-draft | 30-40 min | 3-phase process |
| Visual-concept + script-audit + persona-eval | 15 min (parallel) | Run simultaneously |
| Review-package | 10 min | Synthesis |
| Tiger human review | 30 min | Reads one document |
| Thumbnail-concept | 5 min | 3 compositions |
| Visual-spec | 20 min | Template mapping + footage manifest |
| Shorts-adaptation | 10 min | 3-4 briefs |
| **Total pre-production** | **~3-3.5 hours** | Excludes narration, render, assembly |

The parallel audit stage (visual-concept + script-audit + persona-eval) is the biggest time saver — running them simultaneously instead of sequentially saves ~20-30 minutes.

---

## Recommendations

### High Priority (address before EP02 production)

1. **Standardize visual-concept → visual-spec handoff.** Add a structured "Fixes for Visual-Spec" table to visual-concept audit output. Update visual-concept SKILL.md.

2. **Add priority tier count check.** Either in script-audit Lens 6 or visual-concept Lens 1, flag when P1/P2 counts exceed targets by >50%.

3. **Fix claim tag syntax in script-draft.** Add a self-check item: "All claim tags use single braces {✅}, not double {{✅}."

### Medium Priority (address before EP03)

4. **Standardize concept registry format in angle-memo.** Add structured entries (name, type, definition, introduction beat) so script-draft can consume them mechanically.

5. **Add cross-domain parallel count limit to script-draft.** Suggest max 3 detailed parallels per episode (with option for brief evidence callouts beyond that). EP02's 4 detailed parallels created the primary pacing issue.

6. **Deduplicate visual rhythm maps.** Make visual-concept the authoritative source; script-audit Lens 6 references it rather than re-deriving.

### Low Priority (consider for future)

7. **Title-hook-workshop skill.** Formalizes the coordination of title + cold open + thumbnail as a matched package.

8. **Shorts-adaptation cross-check against visual-concept.** Brief feasibility check on assigned templates.

---

## Verdict

**The pipeline works.** Twelve artifacts, ten skills, zero blocking handoff failures. The format standardization work done across sessions (SCRIPT_FORMAT.md, EDITORIAL_PLAYBOOK.md, consistent skill output formats) is paying off — every skill found what it expected in the previous skill's output.

The gaps identified are all non-blocking and addressable with minor skill updates. The most impactful improvement would be the visual-concept → visual-spec structured handoff (#1 above), which would save visual-spec from parsing prose to find actionable items.

The stress test also validated that the parallel audit design works: three independent lenses finding the same issue (Beat 4-5 rhythm) through different analytical paths produces high-confidence findings that review-package can elevate with certainty.

**EP02 is production-ready** pending Tiger's review of the review-package and the 5 targeted fixes it recommends (~1-2 hours of rewriting).
