# Pipeline Alignment Audit — 2026-05-16

## TL;DR

- **Status: MOSTLY ALIGNED, three real gaps.** The author-facing work (text-animation register, per-element D17 vocabulary, sourcing-brief) is reflected on the surfaces that need it. The camera-primitive consolidation is correctly *not* surfaced in author docs — that's right.
- **Gap 1:** `remotion-templates/references/template-schemas.md` documents `anticipatoryStartFrame` but never `_direction.textAnimation` or `_direction.isCallback` — the two new schema fields visual-spec now emits.
- **Gap 2:** `CLAUDE.md` "Shipped May 14, 2026" block (lines 23-26) has no May 15-16 entry.
- **Gap 3:** `project/TEXT_ANIMATION_REGISTER.md` lines 511-555 still describe Phases 1/2/3 as future work — all three shipped (`bdbbd59`, `c149f3b`, `ac28029`).
- Minor: `project/DECISIONS.md` session log ends April 26 (D40); three weeks of decisions unrecorded.

Git used: `git log --oneline -40`, `git log --since='3 days ago' --pretty=format:'%h %ad %s' --date=short`, plus targeted `grep -rn` against each surface.

## What landed (May 14-16, ~50 commits)

- **Camera-primitive consolidation (11 commits, ending `6eac4e6`)** — new `src/utils/stepFramework.ts` + `src/hooks/useStepFramework.ts` (+ pure `computeStepFrameworkState`). Six hook/template consumers migrated (AtlasPlate, useNarratedCamera, useTimelineCamera, useTreeCamera, RouteAnimation, usePhase) + 3 sister maps (Density/Cartogram/ProportionalSymbol). Three pure helpers extracted from `useNarratedCamera`. `project/CAMERA_CONSOLIDATION_RESEARCH.md` / `_REVIEW.md` / `REVIEW_PASS_2.md`.
- **D17 per-element extension (`f1ff70e`, `9859022`, `5583c82`, `1bcc817`)** — `syncs:[…]` DIR vocabulary, 7 analytical templates, M-SYNC lint rules in `tools/lint/manifest_lint.py`.
- **Sourcing-brief generator (`248f070`)** — `tools/sourcing_brief.py`.
- **Text-animation pipeline (`7f3c3ac` → `ac28029`)** — doctrine doc; 4 components (`textAnimation.tsx`, `ConceptCallback`, `CompositePatterns`, `EditorialDirections`); `_direction.textAnimation` + `isCallback` schema; KineticTypography dispatch; StatReveal HeroStat→`useNumberTicker`; 8 episode backfills; `callback-check` CLI; `DIR:type()` parser; M-TEXT-ANIM lint; visual-spec / script-audit / audio-spec skill updates.
- **Hold-motion research (`246bfcd`, `39c20d9`, `7c2ce70`)** — `HOLD_MOTION_AUDIT_PHASE0.md`.

## Alignment by surface

- **`AGENTS.md`** — VERDICT: current. Line 41 documents `sourcing_brief.py` with flags + use case. Camera internals correctly absent (not CLI-facing).
- **`CLAUDE.md`** — VERDICT: stale (gap 2). Line 86 lists `TEXT_ANIMATION_REGISTER.md` in Key Documents (good). But "Shipped" block needs a May 15-16 entry.
- **`remotion-templates/CLAUDE.md`** — VERDICT: stale header / mostly current body. Line 5 reads "Last updated: May 5, 2026". Line 92 "Key hooks" lists `useCompositionAnimation` / `useDirection` / `useEntrance` / `useThemeMode` / `useVerticalLayout`. Omitting `useStepFramework` and the three camera hooks is defensible — those have their own decision matrix in `src/hooks/index.ts`.
- **`remotion-templates/src/hooks/index.ts`** — VERDICT: current and correct. Lines 13-37 decision matrix covers the three camera hooks. `useStepFramework` is exported (lines 60-61) but deliberately NOT listed in the matrix. Right call — it's a primitive the three hooks compose. Don't promote it.
- **Skills** — VERDICT: current. `visual-spec` line 24 + §397+ has full text-animation dispatch table; §414 documents `isCallback`. `script-audit` line 212 covers register check; line 223 cites `callback-check` CLI. `audio-spec` lines 26-42 map `textAnimation` → SFX defaults. `sourcing_brief.py` correctly absent (Tiger-facing, not a skill stage).
- **`project/PRODUCTION_PIPELINE.md`** — VERDICT: stale. Stage 7 Track B (lines 335-356) covers `source.py` + `source-feedback` but not `sourcing_brief.py`. Stage 7 visual-spec (line 276) doesn't reference `_direction.textAnimation` as an output.
- **`remotion-templates/references/template-schemas.md`** — VERDICT: stale (gap 1). §16 covers `anticipatoryStartFrame`. Nothing on `_direction.textAnimation` (11-value enum), `_direction.isCallback`, or `_direction.syncPoints[].id` (the new field that enables per-element D17). Visual-spec authors are expected to write these per `skills/visual-spec/SKILL.md` §397, but the schema reference is silent.
- **`project/TEXT_ANIMATION_REGISTER.md`** — VERDICT: stale roadmap (gap 3). Lines 511-555 list Phases 1/2/3 as future. All shipped. Line 531 "Still inline-only: RevealMask, Backspace, Scramble" is also wrong now — extracted in `7f3c3ac`.
- **`remotion-templates/POLISH.md`** — VERDICT: stale at D17 (lines 476-484). D17 documents single-element anticipation; says nothing about per-element `syncs:[…]` and the 7-template adoption. `DIRECTING_LANGUAGE.md` line 189 has the canonical paragraph; POLISH.md should cross-link.
- **`episodes/EDITORIAL_PLAYBOOK.md`** — VERDICT: missing entries. No `VIS-NN` rules covering anticipatory reveals or text-animation register selection. These are compounding production rules — exactly the playbook's purpose. Per its gate, candidates go in the Pending table, not directly in a domain section.
- **`project/DECISIONS.md`** — VERDICT: significantly stale. Last entry is "Session 10 — April 26-27" / D40. Three weeks of decisions unrecorded. Low urgency but doctrine of "check DECISIONS before re-deciding" erodes as the log decays.
- **`project/IDEAS.md`** — VERDICT: no change needed.

## Real gaps (prioritized)

1. **HIGH — Document new `_direction` fields in `remotion-templates/references/template-schemas.md`.** Add a sub-section under "Universal conventions" (after line 18) listing `textAnimation` (11-value enum), `isCallback`, and `syncPoints[].id`. Cross-reference `TEXT_ANIMATION_REGISTER.md` and `skills/visual-spec/SKILL.md` §397.
2. **HIGH — Update `CLAUDE.md` lines 23-26** with a "Shipped May 15-16, 2026" entry: text-animation pipeline (with `TEXT_ANIMATION_REGISTER.md` + `_direction.textAnimation` anchors), per-element D17 vocabulary, `tools/sourcing_brief.py`.
3. **MEDIUM — Rewrite `TEXT_ANIMATION_REGISTER.md` lines 511-555** as "Implementation status (May 16, 2026): all 8 atomic + 3 composite extracted; `DIR: type()` parser live; `_direction.textAnimation` schema field live; M-TEXT-ANIM lint live." Remove Phase 1/2/3 future-tense framing.
4. **MEDIUM — Extend `POLISH.md` D17** with a "D17.1 Per-element variant" sub-rule documenting `syncs:[…]` + the 7-template adoption list. Cross-link `DIRECTING_LANGUAGE.md` §189.
5. **MEDIUM — Bump `remotion-templates/CLAUDE.md` line 5 timestamp** to May 16.
6. **LOW — Add `tools/sourcing_brief.py` mention** to `PRODUCTION_PIPELINE.md` Stage 7 Track B (line 335). One sentence.
7. **LOW — Append two candidate rules** to `EDITORIAL_PLAYBOOK.md` Pending Rules table: (i) `VIS-NN`: reveals must land settled (Economist 150ms); (ii) `VIS-NN`: pick text-animation register whose implicit claim matches editorial intent.
8. **LOW — Refresh `DECISIONS.md`** with a Session 11+ block summarizing May 5-16, or formally retire the file as a live log.

## Non-gaps (deliberately not changing)

- **Camera consolidation in author docs / skills.** Internal hygiene. No author writes `useStepFramework`; template authors interact with the three semantic camera hooks. Promoting `stepFramework.ts` to author-facing docs would invite reaching for the wrong layer. The three review-artifact `CAMERA_*.md` files belong in `project/` as engineering memos.
- **`sourcing_brief.py` as a skill.** It's a Tiger-facing CLI joining manifest + shot-list to Markdown. The `asset-source` skill correctly runs `source.py`, not the brief generator.
- **`useStepFramework` in the `hooks/index.ts` decision matrix.** Primitive, not a semantic camera hook. Correctly absent.
- **`TEXT_ANIMATION_REGISTER.md` body (8 technique entries).** Doctrine is accurate; only the roadmap tail is stale.

## Recommended actions (in order)

1. Patch `template-schemas.md` with `_direction.textAnimation` / `isCallback` / `syncPoints[].id` documentation. (Highest leverage — closes the loop between the skill emitting these and the schema reference authors check.)
2. Patch `CLAUDE.md` "Shipped" block with the May 15-16 entry.
3. Rewrite `TEXT_ANIMATION_REGISTER.md` roadmap tail to "shipped" status; bump `remotion-templates/CLAUDE.md` timestamp.
4. Append D17.1 to `POLISH.md`.
5. Bundle the low-priority one-liners (`PRODUCTION_PIPELINE.md` sourcing-brief mention + `EDITORIAL_PLAYBOOK.md` Pending rules) into a single docs commit.
