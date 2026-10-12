# Parallax repository: the existing knowledge system, and where the 7–11 October 2026 findings and tools sit relative to it

> Local repository audit, 11 October 2026. Files read on disk only; no web. Nothing in the repository was edited other than this notes file. No render, build, lint or test was run.
>
> **Conventions.** Every source link is a path relative to the repo root `/Users/feihuyan/project-parallax/`. "(measured)" means the number came from a read-only shell command run for this audit (`wc -l`, `grep -c`, `git show --name-only`, a short Python read of a JSON file). File modification times are from the filesystem; a large batch of files carries the same mtime (9 Oct 14:20), so mtime alone is not evidence that a file's content changed on that day.

---

## 1. The existing system, layer by layer

### Takeaway

The knowledge system is a seven-layer stack: context files, doctrine documents, chooser documents, skills, machine-readable schemas and registries, lint and tests, and logs/memory. A rule only acts on production when it reaches one of three places: a skill's prompt, a schema enum or field that a generator and `FullEpisode` read, or a lint rule; everything else is reference text. The stack is large (47 doctrine files and 15,079 lines in `project/`, 23 files and 7,839 lines at the top of `remotion-templates/`, 25 skills and 7,978 lines) and it was built for a geopolitics channel whose pictures were maps, charts and stock footage.

### Cited Findings

**Layer 1: project context files (loaded into every session)**

- Three context files total 691 lines: `CLAUDE.md` 180, `AGENTS.md` 341, `remotion-templates/CLAUDE.md` 170 (measured) — [CLAUDE.md](../../CLAUDE.md), [AGENTS.md](../../AGENTS.md), [remotion-templates/CLAUDE.md](../../remotion-templates/CLAUDE.md)
- `CLAUDE.md` holds: the Oct 7 "Focus" section, a status table that a validator checks against `episodes/pipeline-state.json`, a dated "Shipped" changelog (May 14 through Oct 10/11), channel identity, the one-line pipeline, a "Key documents" list of 21 entries (which does not include `TRANSITION_GRAMMAR.md`, `VISUAL_QA.md` or `VISUAL_TOOLBOX.md`; measured), and "Critical relationships" — [CLAUDE.md](../../CLAUDE.md)
- `CLAUDE.md` lines are very long: the file is 180 lines, but single "Shipped" bullets run to several hundred words each (measured; e.g. line 84 SanctionsNetwork, line 87 transition engine) — [CLAUDE.md](../../CLAUDE.md)
- `AGENTS.md` holds build commands, the pipeline tool list by stage, the manifest-doctrine `M-*` rule list, cross-document drift checks, slash commands and subagents, CI, code style, "Things NOT to do" — [AGENTS.md](../../AGENTS.md)
- `remotion-templates/CLAUDE.md` says "Last updated: September 22, 2026" in its header but its "Known constraints" already describe `StillFrame.tsx` and `scaleToSlot.ts` (both created 10–11 Oct); file mtime is 11 Oct 16:20 — [remotion-templates/CLAUDE.md](../../remotion-templates/CLAUDE.md)

**Layer 2: doctrine documents in `project/`**

- `project/` holds 47 Markdown files, 15,079 lines (measured), plus subfolders `research/` (21 entries), `psychology/` (7), `_archive/` (6), `decisions/`, `visual-identity/` — [project/](../../project/)
- The "register" family (each names a small set of canonical techniques, the editorial claim each makes, and a decision matrix):

| Doctrine file | Lines | Last modified | What it governs |
|---|---:|---|---|
| [project/TEXT_ANIMATION_REGISTER.md](../../project/TEXT_ANIMATION_REGISTER.md) | 565 | 16 May | 8 text-animation techniques + 3 composites; `_direction.textAnimation` |
| [project/HOLD_MOTION_REGISTER.md](../../project/HOLD_MOTION_REGISTER.md) | 575 | 16 May | 8 hold-beat motions, 4 registers; `DIR: drift()` |
| [project/TRANSITION_GRAMMAR.md](../../project/TRANSITION_GRAMMAR.md) | 601 | 10 Oct | segment-to-segment transitions; "By seam type" table added 10 Oct; iris retired |
| [project/MATH_RENDER_REGISTER.md](../../project/MATH_RENDER_REGISTER.md) | 409 | 10 Oct | 6 math primitives + Bounded form |
| [project/PACING_REGISTER.md](../../project/PACING_REGISTER.md) | 272 | 10 Oct | 3 `PACE:` profiles |
| [project/COUNTERFACTUAL_REGISTER.md](../../project/COUNTERFACTUAL_REGISTER.md) | 191 | 19 May | dashed 12/6, 45% opacity; Hawthorn test |
| [project/ASSET_GENERATION_REGISTER.md](../../project/ASSET_GENERATION_REGISTER.md) | 409 | 24 May | AI-GEN stills (ChatGPT) and morph clips (Kling/Hailuo/Pika) |
| [project/SOUNDSCAPE_REGISTER.md](../../project/SOUNDSCAPE_REGISTER.md) | 336 | 19 May | ambient-bed registers |

- Other doctrine named in the brief: [project/VISUAL_LANGUAGE.md](../../project/VISUAL_LANGUAGE.md) 587 lines (16 May; three-register system, mode shares); [project/DIRECTING_LANGUAGE.md](../../project/DIRECTING_LANGUAGE.md) 825 lines (10 Oct; `DIR:` vocabulary, template support matrix); [project/SCRIPT_FORMAT.md](../../project/SCRIPT_FORMAT.md) 892 lines (10 Oct; two-column format and mode tags); [project/VISUAL_QA.md](../../project/VISUAL_QA.md) 64 lines (created 10 Oct, extended 11 Oct); [project/CHAINED_STILL_LESSONS.md](../../project/CHAINED_STILL_LESSONS.md) 334 lines (header: "Last updated: May 21, 2026"); [project/DECISIONS.md](../../project/DECISIONS.md) 516 lines ("Last updated: October 10, 2026 (matches the most recent entry — D49)") (all line counts measured)
- Further large doctrine files: [project/PRODUCTION_PIPELINE.md](../../project/PRODUCTION_PIPELINE.md) 659, [project/AI_VIDEO_PIPELINE.md](../../project/AI_VIDEO_PIPELINE.md) 718, [project/AUDIO_DESIGN.md](../../project/AUDIO_DESIGN.md) 413, [project/PACING_SYSTEM.md](../../project/PACING_SYSTEM.md) 404, [project/MOTION_DIRECTOR_SPEC.md](../../project/MOTION_DIRECTOR_SPEC.md) 228 (status line: "design draft (May 23, 2026). Not built") (measured)
- Decision D19 (25 April 2026) states the design intent of the whole stack: "Three-layer memory system: CLAUDE.md (project overview and current state), LESSONS.md (technical gotchas), BRAND.md (design system). Skills reference these files. End-of-session consolidation ensures learnings flow back." — [project/DECISIONS.md](../../project/DECISIONS.md)

**Layer 3: chooser documents in `remotion-templates/`**

- 23 top-level Markdown files, 7,839 lines (measured) — [remotion-templates/](../../remotion-templates/)
- [remotion-templates/PARALLAX_VISUAL_VOCABULARY.md](../../remotion-templates/PARALLAX_VISUAL_VOCABULARY.md) 512 lines: "the chart chooser", editorial argument to template form, modelled on the FT Visual Vocabulary (description quoted in [skills/visual-spec/SKILL.md](../../skills/visual-spec/SKILL.md) line 22)
- Five family selectors, 958 lines together: CHART 220, DIAGRAM 225, MAP 188, TIMELINE 152, TYPOGRAPHY 173 (measured) — [remotion-templates/CHART_TEMPLATE_SELECTOR.md](../../remotion-templates/CHART_TEMPLATE_SELECTOR.md) and siblings
- [remotion-templates/TEMPLATE_FAMILIES.md](../../remotion-templates/TEMPLATE_FAMILIES.md) 405 lines; [remotion-templates/POLISH.md](../../remotion-templates/POLISH.md) 691 lines (rules A1…, Editorial Doctrine up to D21); [remotion-templates/LESSONS.md](../../remotion-templates/LESSONS.md) 1,070 lines (latest entries L118 and L119, both dated 10 Oct 2026); [remotion-templates/BRAND.md](../../remotion-templates/BRAND.md) 693 lines (measured)
- `references/`: [template-picker.md](../../remotion-templates/references/template-picker.md) 1,170 lines; [template-schemas.md](../../remotion-templates/references/template-schemas.md) 1,651 lines; `template-research/` holds 79 dossier files, 10,790 lines (measured) — [remotion-templates/references/](../../remotion-templates/references/)
- There is no selector for still pictures. The five selectors cover maps, charts, diagrams, timelines and typography — [skills/visual-spec/SKILL.md](../../skills/visual-spec/SKILL.md) lines 39–47
- [remotion-templates/REMOTION_CAPABILITY_MAP.md](../../remotion-templates/REMOTION_CAPABILITY_MAP.md) (65 lines, created 23 May) states "We currently use Remotion as a chart/diagram renderer (~83 templates) — roughly 25% of its surface"

**Layer 4: skills, commands, agents**

- `skills/` holds 25 skill folders; `SKILL.md` files total 7,978 lines (measured) — [skills/](../../skills/)
- `.claude/skills/` holds 25 symbolic links, each pointing to `../../skills/<name>`, created 7 Oct 19:53–19:55. There is no duplicated content between the two folders; `.claude/skills/` is untracked in git (`?? .claude/skills/`) (measured with `ls -la` and `git status`) — [.claude/skills/](../../.claude/skills/)
- A third copy exists outside the repo. Ten of the skills are also installed as plugin skills (listed in this session as `anthropic-skills:visual-spec`, `anthropic-skills:script-audit` and so on) under `~/Library/Application Support/Claude/local-agent-mode-sessions/skills-plugin/…/skills/`. All ten differ from the repo copies: for example the plugin `visual-spec` is 135 lines dated 26 Sep against 1,013 lines dated 10 Oct in the repo, and contains zero mentions of `over(previous)` or the iris retirement (repo copy: 3). The ten are asset-source, persona-eval, publish-retro, render-qa, research-audit, review-package, script-audit, source-feedback, visual-concept, visual-spec (measured with `diff -q` and `wc -l`)
- Largest skills: visual-spec 1,013 lines, publish-retro 730, render-qa 568, script-draft 482, angle-memo 456, visual-concept 418, audio-spec 358 (measured)

| Skill (lines) | Reads | Writes |
|---|---|---|
| topic-viability (162) | `project/IDEAS.md`, CONTENT_IDENTITY, SEO_KEYWORDS, CONTENT_RISK_PLAYBOOK, EDITORIAL_PLAYBOOK | VIABLE / INCUBATING / REJECT verdict |
| research-bridge (194) | a Pass 1 research brief (references no project doc) | Pass 2 and Pass 3 research prompts |
| research-audit (319) | brief; EDITORIAL_PLAYBOOK, RESEARCH_LOG, RESEARCH_WORKFLOW, CONTENT_RISK_PLAYBOOK, CONTENT_IDENTITY, LEARNING_LOG, `data/concepts.json` | READY / CONDITIONAL / NEEDS MORE verdict |
| angle-memo (456) | brief; CONTENT_IDENTITY, SEO_KEYWORDS, JIANG_NARRATIVE_RESEARCH, VISUAL_LANGUAGE, EDITORIAL_PLAYBOOK, `data/concepts.json` | angle memo: 10 locked decisions, item 9 is the "visual arc" |
| script-draft (482) | brief, angle memo, EDITORIAL_PLAYBOOK §1–4, SCRIPT_FORMAT, VISUAL_LANGUAGE, template-picker.md, the 5 selectors, dossiers, DIRECTING_LANGUAGE, FOOTAGE_SOURCING, JIANG, CALIBRATION_LANGUAGE, TRANSITION_GRAMMAR, HOLD_MOTION_REGISTER | two-column script with mode tags and `DIR:` lines |
| script-audit (291) | script; runs `tools/lint/script_lint.py`; own `references/lens-6…`, `lens-9…`, `lens-10…`; EDITORIAL_PLAYBOOK, SCRIPT_FORMAT, CALIBRATION_LANGUAGE, LEARNING_LOG | 10-lens audit |
| visual-concept (418) | script; VISUAL_LANGUAGE, SCRIPT_FORMAT, 5 selectors, TRANSITION_GRAMMAR, FOOTAGE_SOURCING, SVG_ILLUSTRATION_PIPELINE, BRAND, LEARNING_LOG, EDITORIAL_PLAYBOOK; carries its own "Visual Toolkit" list of 6 tools with prices | feasibility audit incl. "Script Reshaping Suggestions" |
| persona-eval (212) | script; `data/personas.json`, LEARNING_LOG, EDITORIAL_PLAYBOOK | 5-persona resonance report |
| review-package (241) | the three audits above; BRAND, CONTENT_IDENTITY, LEARNING_LOG, EDITORIAL_PLAYBOOK | one review document + candidate playbook rules |
| chart-audit (203), diagram-audit (220), map-audit (217), timeline-audit (261), typography-audit (198) | script + the family's SELECTOR, a dossier, POLISH, SCRIPT_FORMAT | per-family template-fit audit |
| thumbnail-concept (165) | BRAND, SEO_KEYWORDS, CONTENT_IDENTITY, EDITORIAL_PLAYBOOK | 3 thumbnail concepts |
| visual-spec (1,013) | script; 12 reference docs (listed in §6); `data/concepts.json`; `references/template-schemas.md` | Remotion data JSON, Recraft specs, AI video briefs, footage manifest |
| asset-brief (247) | `shot-list.json`, script, ASSET_GENERATION_REGISTER | `prompts/chatgpt-prompts.md`, `prompts/morph-prompts.md` |
| ground-motion (132) | the generated stills (vision), CHAINED_STILL_LESSONS, `tools/ai-video/perceive.md`, `motion_director.py`, `gen_motion_prompts.py` | motion prompts grounded in the actual still |
| asset-source (258) | `shot-list.json`; runs `tools/asset-source/source.py`; IMAGES, BRAND | ranked shortlist / `asset-manifest.json` |
| source-feedback (242) | `asset-manifest.json`; template-schemas.md, IMAGES, BRAND, PRODUCTION_PIPELINE | gap analysis |
| audio-spec (358) | script; AUDIO_DESIGN, TRANSITION_GRAMMAR, TEXT_ANIMATION_REGISTER, DIRECTING_LANGUAGE, EDITORIAL_PLAYBOOK | audio cue sheet + manifest JSON extensions |
| render-qa (568) | manifest, shot-list schema, template-schemas.md, LESSONS, POLISH, BRAND; lint tools | frame-check commands and checklist |
| visual-qa (155) | rendered PNG stills (vision), POLISH, LESSONS, BRAND | pixel-level findings |
| shorts-adaptation (236) | script `[SHORTS-BEAT:]` tags, SCRIPT_FORMAT, IDEAS, `data/concepts.json` | Shorts briefs |
| publish-retro (730) | YouTube analytics, persona-eval predictions, `data/predictions-log.json`, TRANSITION_GRAMMAR, CALIBRATION_LANGUAGE | retro report; appends to LEARNING_LOG and EDITORIAL_PLAYBOOK |

Sources for the table: each skill's `SKILL.md` description plus a grep of the document paths it names (measured) — [skills/](../../skills/)

- The skill that owns a line in this table is the only place most doctrine is ever read. `publish-retro` describes itself as "the only skill that writes back to EDITORIAL_PLAYBOOK.md" — skill description in the session's skill listing; [skills/publish-retro/SKILL.md](../../skills/publish-retro/SKILL.md)
- Seven slash commands: audit-script, concept-search, log-cost, narrate (190 lines), new-episode, new-template, render-preview. Two subagents: script-reviewer, visual-spec-reviewer — [.claude/commands/](../../.claude/commands/), [.claude/agents/](../../.claude/agents/)
- Skill folders also carry eval workspaces (`evals/evals.json`, `*-workspace/iteration-N/…`) for topic-viability, script-draft, angle-memo, asset-source, research-audit, script-audit; `skills/script-audit/evals/RESULTS-2026-10-07.md` is the round that preceded the "stop with over testing" remark (measured with `find`) — [skills/script-audit/evals/RESULTS-2026-10-07.md](../../skills/script-audit/evals/RESULTS-2026-10-07.md)

**Layer 5: machine-readable registries and schemas**

- [data/concepts.json](../../data/concepts.json): 35 concepts, last modified 14 May; the string `ai-care-motives` does not appear in it (measured). Schema: [data/concept-registry.schema.json](../../data/concept-registry.schema.json). The episode's own spec says "Suggested new entry (not yet added): 'The Unwatched Test'" — [episodes/ai-care-motives/visual-spec.md](../../episodes/ai-care-motives/visual-spec.md) §4
- [data/shot-list.schema.json](../../data/shot-list.schema.json): the `Asset` definition has 14 properties (id, type, priority, treatment, notes, search_terms, fallback_terms, description, register, realism, text_treatment, visual_mode, context, style). It has no `camera_move`, `motion_technique`, `ken_burns`, `anchor_frame` or `reuse` property (measured: `grep -c camera_move` returns 0), although [CLAUDE.md](../../CLAUDE.md) says "`shot-list.json` schema enriched with `camera_move` field on bridge stills". `Asset` does not set `additionalProperties: false`, so extra keys pass validation unchecked
- [remotion-templates/data/assembly-manifest.schema.json](../../remotion-templates/data/assembly-manifest.schema.json): top-level properties include `handWired`; `segment` has 30-odd properties including `framing` (`from`/`to` as `{cx, cy, zoom}`, `ease` ∈ linear/settle/glide), `layered.backgroundSegmentId`, `transition.in/out` (13-value enum that still includes deprecated and retired tokens), `syncWords`, `syncPoints`, `authoredDurationSec`, `narrationGate`, `holdBehavior`; `template.component` is an 87-value enum (measured)
- [remotion-templates/src/templates/Episodes/templateRegistry.ts](../../remotion-templates/src/templates/Episodes/templateRegistry.ts) (239 lines) and [templateSchemas.ts](../../remotion-templates/src/templates/Episodes/templateSchemas.ts) (220 lines); `src/templates/` holds 96 directories (measured). `templateRegistry.ts` is untracked in git
- [tools/brand-treatment/palette.json](../../tools/brand-treatment/palette.json) keys: palette, semantic, ramps, duotone, modes, treatment, brandMark. [tools/config/video.json](../../tools/config/video.json) is the only file in `tools/config/`
- Other data: [data/personas.json](../../data/personas.json), [data/predictions-log.json](../../data/predictions-log.json), [data/visual-identity.schema.json](../../data/visual-identity.schema.json), [episodes/pipeline-state.json](../../episodes/pipeline-state.json) (canonical episode state)

**Layer 6: lint, validation, tests**

- [scripts/lint.sh](../../scripts/lint.sh) is the aggregator. In order: ruff; `lint-conventions.mjs`; `audit-direction-fields.mjs --strict`; `polish_lint.py`; `concepts/lookup.py validate`; `check_brand_mark.py`; `check_status_emoji.py`; `script_lint.py` per episode; `manifest_lint.py` over all manifests; `gen:types:check`; `lint-math-formulas.mjs`; three `pipeline_validator.py` freshness and consistency checks; `check-docs.sh`
- [tools/lint/](../../tools/lint/) holds 8 linters with a test file each: check_anchor_bridge, check_brand_mark, check_docs, check_status_emoji, check_visual_hook, manifest_lint, polish_lint, script_lint
- `manifest_lint.py` rule IDs found in code: M-BGMODE, M-CROSSFADE, M-CUE, M-D18, M-DATAFILE, M-DRIFT-DEFAULT, M-DURATION, M-GENERATIVE-OVERUSE, M-JSON, M-MANIFEST-STALE, M-OVERLAP, M-SYNC, M-SYNC-COUNT, M-SYNC-MISSING, M-TEXT-ANIM, and six M-TRANSITION-* rules (COLOR-WASH-TOKEN, DEPRECATED, DISSOLVE-CREEP, IRIS-CHART, IRIS-OVERUSE, IRIS-RETIRED) (measured) — [tools/lint/manifest_lint.py](../../tools/lint/manifest_lint.py). The list in [AGENTS.md](../../AGENTS.md) names 16 of these and omits M-TRANSITION-IRIS-RETIRED, M-GENERATIVE-OVERUSE, M-MANIFEST-STALE, M-SYNC and M-JSON (measured)
- `script_lint.py` rule IDs: S-DIR-COLOR-WASH, S-DIR-DEPRECATED, S-DIR-IRIS-OVERUSE, S-DIR-IRIS-RETIRED, S-HEDGE-DENSITY, S-HEDGE-L3, S-MG-RUN, S-NEGATION-PIVOT, S-PACE-INVALID, S-SIGNPOST, S-VERIFY-NARRATION (measured) — [tools/lint/script_lint.py](../../tools/lint/script_lint.py)
- [remotion-templates/scripts/lint-conventions.mjs](../../remotion-templates/scripts/lint-conventions.mjs) has 19 rule ids (e.g. hardcoded-brand-color, missing-direction-wiring, no-katex-font-override, template-missing-schema, types-drift-from-schema); [lint-math-formulas.mjs](../../remotion-templates/scripts/lint-math-formulas.mjs) has M-MATH-VALID, M-MATH-COLOR, M-MATH-LENGTH (measured)
- [tools/pipeline_validator.py](../../tools/pipeline_validator.py) (123,639 bytes) keeps `pipeline-state.json`, the `CLAUDE.md` status table, `IDEAS.md`, `PIPELINE.md`/`.html` and per-episode `_status.md` in step
- [remotion-templates/scripts/qa-episode.mjs](../../remotion-templates/scripts/qa-episode.mjs) (630 lines, new on 10 Oct) is a measured QA pass; it is not called from `scripts/lint.sh`
- Tests: 75 `test_*.py` files under `tools/` excluding `tools/parallax/.venv`; 91 files in [remotion-templates/src/__tests__/](../../remotion-templates/src/__tests__/) (measured)
- [.githooks/pre-commit](../../.githooks/pre-commit) runs ruff, pytest, `validate_data.py`, `manifest_lint.py`, concept validation, and the pipeline validators on staged files. `lint.sh` warns that these hooks are dormant unless `core.hooksPath` is `.githooks`

**Layer 7: playbook, learning log, memory**

- [episodes/EDITORIAL_PLAYBOOK.md](../../episodes/EDITORIAL_PLAYBOOK.md): 467 lines. Rule IDs by domain (NAR, VIS, PER, RES, PROD). It has a "Pending Rules (awaiting Tiger approval)" lane with instructions "Skills: append candidate rules here… Tiger: review this section during the script-review checkpoint"; two candidates proposed by a May audit are still pending. VIS-12 was added with "Approved by Tiger Oct 11, 2026"; the file's Revision History table ends at 10 May 2026 and has no row for VIS-12
- [episodes/LEARNING_LOG.md](../../episodes/LEARNING_LOG.md): 60 lines; "No episodes published yet. This log will be populated after EP01 goes live and publish-retro runs."
- Auto-memory at `/Users/feihuyan/.claude/projects/-Users-feihuyan-project-parallax/memory/`: 6 files, 121 lines. `MEMORY.md` indexes 5 entries: psychology research location, IMPERIAL channel, focus shift (Oct 2026), skip over-testing, visual toolbox exploration (measured)
- The user-level command `~/.claude/commands/end-session.md` instructs: "Read `memory/active_context.md` and `memory/progress.md`"; neither file exists in the memory folder (measured with `ls`)

### Inferences

- A finding becomes operative by one of three routes: (a) prompt text in a skill; (b) a field or enum in the manifest schema that `generate_manifest.py` writes and `FullEpisode.tsx` reads; (c) a lint rule in `lint.sh` or the pre-commit hook. Documents that are on none of those routes are consulted only if a session happens to open them.
- The chooser layer is organised by template family, and the families are all code-drawn graphics. A generated still enters the system as an asset to be sourced, never as a thing with a treatment to be chosen.
- Three physical copies of the skills exist (repo, symlinks, plugin install). A change to `skills/visual-spec/SKILL.md` reaches the symlinked copy at once and does not reach the plugin copy; which of `visual-spec` and `anthropic-skills:visual-spec` a session invokes is not determined by anything in the repo.

### Gaps

- I did not read all 25 `SKILL.md` files in full; the "reads" column comes from each skill's description and a grep for document paths, so a skill may read a file it names only indirectly.
- I did not run `lint.sh` or any test, so I cannot say which checks pass today. An earlier report cites a stored test run of 19 May with 111 of 1,638 tests failing ([reports/Remotion polish and AI tooling.md](../../reports/Remotion%20polish%20and%20AI%20tooling.md)); I did not verify it.
- I could not determine whether the git hooks are installed on this machine (`core.hooksPath` not checked).

---

## 2. The house pattern for shipping a new capability

### Takeaway

Every fully shipped register followed the same phased checklist and touched 20 to 43 files with 2,500 to 4,000 inserted lines over 4 to 10 commits. The pattern is research dossier, doctrine document, component, schema field, parser and generator, lint rule, showcase composition, skill updates, context-file entry, tests. The 10 October transition-engine change shows the same pattern run in miniature for a retirement.

### Cited Findings

**Four shipped registers, measured from git** (`git show --name-only` and `--shortstat` on the commits named)

| Capability | Commits | Distinct files | Lines inserted | Where the files were |
|---|---:|---:|---:|---|
| Text-animation register (7f3c3ac, bdbbd59, c149f3b, ac28029; 16 May) | 4 | 29 | 3,172 | 1 doctrine doc; 3 components; 2 catalog files + Root.tsx; 2 hooks (schema + `useDirection`); 2 templates; 8 episode data backfills; 3 skills (visual-spec, audio-spec, script-audit); generator + test; concepts CLI + test; manifest lint + test; 1 TS test |
| Transition grammar (231ebc6 … 4794da0; 16–17 May) | 9 | 20 | 3,322 | 1 research dossier; 1 doctrine doc; POLISH.md D21; manifest schema; visual-identity schema; `Transitions.tsx`; `transitionGrammar.ts`; 1 template schema; generator + test (5 commits); showcase + catalog index + Root.tsx; then a docs commit: CLAUDE.md, AUDIO_DESIGN, DIRECTING_LANGUAGE, SCRIPT_FORMAT, 3 skills |
| Math-rendering register (87ce19a … b823860; 18 May) | 5 | 34 | 3,952 | 3 components; 2 templates × 4 files; 5 catalog fixtures; 6 test files; 2 catalog compositions + Root.tsx; package.json + lock; doctrine doc; 2 lint scripts; `scripts/lint.sh`; `katex-brand.css`; CLAUDE.md; 1 skill (visual-spec) |
| Hold-motion register (7c2ce70 … 2661dd1; 16 May) | 10 | 43 | 2,546 | Phase 0 audit doc; research dossier; doctrine doc; POLISH.md D20; `useDirection` cascade; 6 templates; DIR parser in generator + test; showcase; manifest lint + test; 20 files under `src/__tests__/`; DIRECTING_LANGUAGE; CLAUDE.md; 3 skills |

Source for the table: git history of [project/TEXT_ANIMATION_REGISTER.md](../../project/TEXT_ANIMATION_REGISTER.md), [project/TRANSITION_GRAMMAR.md](../../project/TRANSITION_GRAMMAR.md), [project/MATH_RENDER_REGISTER.md](../../project/MATH_RENDER_REGISTER.md), [project/HOLD_MOTION_REGISTER.md](../../project/HOLD_MOTION_REGISTER.md) (measured)

**The phases, in the order the commits show**

- Text animation: (0) doctrine doc + components + showcase → (1) schema field `_direction.textAnimation` + template dispatch → (2) visual-spec skill update + backfill of 8 existing episode data files → (3) `DIR: type()` parser in `generate_manifest.py` + M-TEXT-ANIM lint + audio-spec and script-audit skills — commit subjects 7f3c3ac, bdbbd59, c149f3b, ac28029
- Transition grammar: scoping dossier → Phase 2 doctrine + POLISH D21 → Phase 3 deprecate six tokens (schema enum, `Transitions.tsx`, generator) → Phase 4 match-cut split → Phase 5 default rule change → Phase 6 `DIR: chapter()` → Phase 7 J/L-cut fields → Phase 8 showcase → docs and skills — commit subjects 231ebc6 through 4794da0
- Math: Phase 1 component + template → Phase 2 engine + second template → Phase 3 primitives → Phase 4 doctrine + lint + showcase + CLAUDE.md + skill → Phase 5 brand CSS + three more lints — commit subjects 87ce19a through b823860
- Hold motion began with a "Phase 0 audit — quantified baseline" and an outlet research dossier before any doctrine was written — commits 7c2ce70, 246bfcd; [project/HOLD_MOTION_AUDIT_PHASE0.md](../../project/HOLD_MOTION_AUDIT_PHASE0.md)

**The pattern as a checklist** (each line observed in at least three of the four traces)

1. Research dossier or audit — `references/template-research/<name>.md` or a `project/*_AUDIT_*.md`
2. Doctrine document in `project/` — techniques, the editorial claim each makes, use/avoid, decision matrix
3. A numbered doctrine rule in `remotion-templates/POLISH.md` (D20 for hold motion, D21 for transitions)
4. Component(s) in `src/components/` and/or template folder(s) in `src/templates/` (4 files each: component, index, schema, types)
5. Schema: a field on `directionBlock.schema.ts` or `assembly-manifest.schema.json`; for a template, entries in `templateRegistry.ts` and `templateSchemas.ts`
6. Script vocabulary: a `DIR:` directive documented in `DIRECTING_LANGUAGE.md` and `SCRIPT_FORMAT.md`
7. Parser and generator: `tools/assembly/generate_manifest.py` + `test_generate_manifest.py`
8. Lint: an `M-*` rule in `manifest_lint.py` (+ test), sometimes an `S-*` rule in `script_lint.py`, or a script wired into `scripts/lint.sh`
9. Showcase composition in `src/catalog/` registered in `Root.tsx` (`catalog-showcase-…`) plus catalog fixtures in `data/episodes/catalog/`
10. Skill updates: visual-spec always; script-draft, script-audit, audio-spec, visual-concept, publish-retro as relevant
11. `CLAUDE.md` "Shipped" entry and "Key documents" entry; `AGENTS.md` rule list
12. Tests: unit tests, visual-regression baseline (`templates.test.ts` COMPOSITIONS), coverage tables
13. Backfill of existing episode data files where the new field applies

- For a new template specifically, `CLAUDE.md` repeats the phrase "Registered in all 5 registration files" and names them for the May 20 batch: `TEMPLATE_COMPONENTS`, `TEMPLATE_SCHEMAS`, `Root.tsx`, `assembly-manifest.schema.json`, `generate_manifest.py` `TEMPLATE_AUDIO_MAP`; plus a dossier, a selector or family entry, the visual-spec skill, `templates.test.ts`, and the `template-schemas-doc-coverage.test.ts` fallback table — [CLAUDE.md](../../CLAUDE.md) "Shipped May 20, 2026"
- `remotion-templates/CLAUDE.md` gives a four-step template recipe and a scaffolder (`node scripts/create-template.mjs`) — [remotion-templates/CLAUDE.md](../../remotion-templates/CLAUDE.md) "How to create a new template"

**The pattern run for a retirement, 10 October (uncommitted; traced by grep)**

- Retiring `iris` and adding hold-under touched: [project/TRANSITION_GRAMMAR.md](../../project/TRANSITION_GRAMMAR.md) (new "On the episode timeline" and "By seam type" sections), [project/DIRECTING_LANGUAGE.md](../../project/DIRECTING_LANGUAGE.md) (new `over` directive, iris marked retired), [project/SCRIPT_FORMAT.md](../../project/SCRIPT_FORMAT.md), [project/PACING_REGISTER.md](../../project/PACING_REGISTER.md), four skills (script-draft, visual-concept, visual-spec, audio-spec), `manifest_lint.py` (M-TRANSITION-IRIS-RETIRED) and `script_lint.py` (S-DIR-IRIS-RETIRED) with tests, `generate_manifest.py` + test, `src/utils/resolveSeams.ts` + `resolveSeams.test.ts`, `FullEpisode.tsx`, the manifest schema, `LESSONS.md` L118, `CLAUDE.md`, and a research file `analysis/transitions-research-2026-10-10.md` (measured with grep for "iris" and "Oct 10, 2026")
- Residue left by that pass: [skills/visual-spec/SKILL.md](../../skills/visual-spec/SKILL.md) line 29 says iris "must not be emitted" and, in the same bullet, still lists "**iris** (premium cinematic open/close… ≤2 per episode)" in its decision matrix and "see all six in motion"; [remotion-templates/POLISH.md](../../remotion-templates/POLISH.md) lines 575 and 587 still list iris-in/iris-out; [AGENTS.md](../../AGENTS.md) still lists M-TRANSITION-IRIS-CHART and IRIS-OVERUSE and not IRIS-RETIRED; [CLAUDE.md](../../CLAUDE.md) line 46 still describes "6 canonical transitions (… iris)" in its May entry; the manifest schema's `transition.in` description still reads "Canonical: cut, dissolve, fade, color-wash, iris, match-cut"

### Inferences

- "Systemizing" under the house pattern means roughly 20–45 files per capability, with the generator, a lint rule, a showcase and three or more skills among them. That is the measured size of one register, not of one technique.
- The order that recurs is component first, doctrine and lint later (math: doctrine arrived in Phase 4 of 5; text animation: doctrine and components in the same first commit). Doctrine was written after something existed on screen.
- Even a carefully propagated change (iris) left at least five stale references in files that the pass itself edited or sat next to. Propagation cost scales with the number of places a rule is restated.
- Two registers (hold motion, transitions) were preceded by an audit or dossier that quantified the baseline. `reports/AI stills beyond Ken Burns.md` plus the QA "Components" section already play that role for stills.

### Gaps

- Time spent per register is not recorded in the repo; commit timestamps cluster within one or two days, which says nothing about hours.
- The 10 October file list is from grep, not from a commit, so it may miss files and may include files changed for other reasons.
- I did not check whether the four showcase compositions still render.

---

## 3. How a script decision reaches the screen today

### Takeaway

The path is script row → (visual-concept audit) → visual-spec → `shot-list.json` and data JSON → `generate_manifest.py` → `assembly-manifest.json` → `FullEpisode.tsx`. For code-drawn graphics every hop has vocabulary and a validator. For a generated still, the treatment is chosen in three disconnected places (free text in the script row, `motion_technique: ken-burns` in the shot list, a hand-written `framing` in the manifest), and since D49 the last of these is the only one that reaches the screen. Roughly a third of the catalogue can be written with fields that exist; the rest has nowhere to be written down.

### Cited Findings

**The path**

- Script right column carries seven content tags (`[FOOTAGE:]`, `[MG:]`, `[LAYERED:]`, `[AI-GEN:]`, `[ILLUST:]`, `[SCENE:]`, `[ARCHIVAL:]`) and four special tags (`[FORECAST:]`, `[BACKDROP: id]`, `[OVERLAY: preset]`, `[SHORTS-BEAT: series]`) — [project/SCRIPT_FORMAT.md](../../project/SCRIPT_FORMAT.md) "Visual Modes"
- `[AI-GEN:]` is defined as "AI-generated grounded scene (Register 3: Grounding)… Used for physically real but unsourceable spaces"; `[SCENE:]` is "3-5 stills generated as a chain… plus 2-4 morph clips between adjacent stills (Pika 2.5 start+end-frame)" — [project/SCRIPT_FORMAT.md](../../project/SCRIPT_FORMAT.md)
- Five `DIR:` directive types (`cam`, `reveal`, `hold`, `cut`, `mood`) plus `drift` (16 May), `chapter`, `jcut`/`lcut`, `type`, and `over` (10 Oct) — [project/DIRECTING_LANGUAGE.md](../../project/DIRECTING_LANGUAGE.md)
- The support matrix for picture modes: `[FOOTAGE:]` — `cam()` ❌ "camera is baked into footage", `reveal()` ❌; `[ILLUST:]` — `cam()` ❌ "static image"; `[AI-GEN:]` — `cam()` ✅ "scene brief" (it becomes natural-language text in an AI video brief), `reveal()` ❌ — [project/DIRECTING_LANGUAGE.md](../../project/DIRECTING_LANGUAGE.md) "Non-MG Visual Modes"
- `DIR: over(previous)` "Sets a text card over the picture before it… `KineticTypography` only for now"; it maps to `layered.backgroundSegmentId` and `layered.backgroundDim` — [project/DIRECTING_LANGUAGE.md](../../project/DIRECTING_LANGUAGE.md) "Over"
- script-draft is told the selection happens at script time: "The picker docs are load-bearing because `visual-spec` is mostly a transcriber of your choice" — [skills/script-draft/SKILL.md](../../skills/script-draft/SKILL.md)
- visual-spec's Step 5 handles every `[AI-GEN:]` row by writing an "AI video brief" for Kling/Sora/Runway with fields `register`, `realism`, `text_treatment`; it states "`cam()` and `reveal()` are not supported on footage" — [skills/visual-spec/SKILL.md](../../skills/visual-spec/SKILL.md) lines 744–748, 789–980
- `generate_manifest.py` contains no handling of `framing`, `ken_burns` or `camera_move` (grep returns only `over(previous)` and `hand_wired_refusal` among still-related terms) — [tools/assembly/generate_manifest.py](../../tools/assembly/generate_manifest.py)
- `FullEpisode.tsx` (1,480 lines) draws a FOOTAGE segment whose file is an image with `<StillFrame framing={segment.framing}>` and a video file with `<OffthreadVideo>` — [remotion-templates/src/templates/Episodes/FullEpisode.tsx](../../remotion-templates/src/templates/Episodes/FullEpisode.tsx) lines 603–628
- D49: once hand-wired, "manifest edits are not mirrored back into the script"; "about half of the manifest's 56 segments carried wiring the script cannot express (AI-video clip files, rows split into several shots, hold-under, per-seam transitions)" — [project/DECISIONS.md](../../project/DECISIONS.md) D49

**Where a still's treatment is chosen today, in `ai-care-motives`**

- Script: 22 lines carry an `[AI-GEN:]` tag; tag occurrences are 22 `[AI-GEN:]`, 22 `[MG:]`, 5 `[ARCHIVAL:]`, 2 `[FOOTAGE:]`. Directives used: `cut(` 11, `hold(` 9, `type(` 3, `reveal(` 3, `over(` 2, `mood(` 2, `cam(` 1 (measured). Treatment of a still is free text in the row, e.g. "dinner-table still (aigen-01); two friends in conversation, quiet Ken Burns push" and "back to the desk at night, closer framing (aigen-10, b7close variant)" — [episodes/ai-care-motives/script.md](../../episodes/ai-care-motives/script.md) lines 26, 29
- Shot list: 12 assets, all `type: ai-generate`, all `motion_technique: "ken-burns"` with a `ken_burns {start_scale, end_scale, focus_x, focus_y, duration_sec}` block. The file uses 23 distinct keys, of which `mode`, `thread`, `thread_position`, `status`, `chatgpt_prompt_id`, `anchor_frame`, `duration_sec`, `motion_technique`, `ken_burns`, `reuse`, `camera_move`, `motion_optional`, `editorial_note`, `camera_move_in_edit` are not in the schema (measured) — [episodes/ai-care-motives/shot-list.json](../../episodes/ai-care-motives/shot-list.json), [data/shot-list.schema.json](../../data/shot-list.schema.json)
- Manifest: `handWired: true`; 53 segments over 678.6 s; 25 FOOTAGE + 28 TEMPLATE; 22 segments carry `framing` and point at `.jpg` stills, 3 point at `.mp4` (one AI clip `clips/aigen-03-unwatched.mp4`, two stock clips); 2 segments carry `layered.backgroundSegmentId`; 2 carry `syncWords` (measured) — [remotion-templates/data/episodes/ai-care-motives/assembly-manifest.json](../../remotion-templates/data/episodes/ai-care-motives/assembly-manifest.json)
- Of the 22 framings, 18 use the default ease (linear), 2 `glide`, 2 `settle`; most go from zoom 1.0 to between 1.02 and 1.13 (measured) — same file
- The planned decision step for still motion was never built: MOTION_DIRECTOR_SPEC describes an agent that would write `motion_technique` ∈ ken-burns / live-still / cinemagraph / parallax-2.5d / morph-endpoint / cut and `seam_to_next` into the shot list, with budgets ("`parallax-2.5d`: ≤ 2 per episode", "`morph`: ≤ 6 per episode", "never the same technique 3× consecutively within a thread"). Status: "design draft (May 23, 2026). Not built." — [project/MOTION_DIRECTOR_SPEC.md](../../project/MOTION_DIRECTOR_SPEC.md)

**Existing vocabulary that can carry a still treatment**

| Where | Field or token | What it can express |
|---|---|---|
| Script | `[AI-GEN:]` row free text; `[SCENE:]` block; `DIR: over(previous[, dim])`; `DIR: cut(match-cut \| dissolve \| fade \| color-wash)`; `DIR: hold(…)` | which still, a hold-under card, the seam |
| Shot list (unvalidated keys) | `motion_technique`, `ken_burns{}`, `camera_move`, `anchor_frame`, `reuse`, `thread` | one move per still; a generation anchor |
| Manifest | `segment.framing {from, to, ease}`; consecutive FOOTAGE segments on one still; `layered.backgroundSegmentId` / `backgroundDim`; `transition.in/out` + `durationSec`; `asset.file` (image or clip) | slow push/pull/pan; framed details as separate cut segments; hold-under; cut, dissolve, dip |
| Templates with a schema | `AnnotatedZoom.regions[] {centerX, centerY, scale, revealAtSec, label, showCrosshair}`; `ScrollyReveal` steps + `AnnotationSVGLayer` (callout, highlight); `AnnotatedImage` callouts; `SplitFrame` panes; `ComparisonPair`; `PhotoMontage`; `ImageComposite` (`duotone: "none"` allowed); `PrimarySourceReveal`; `IsotypeChart`; `KineticTypography` over a held picture | zoom stations, labels on a picture, two-up, grid, document on a card, unit chart |

Sources: [remotion-templates/data/assembly-manifest.schema.json](../../remotion-templates/data/assembly-manifest.schema.json); [remotion-templates/src/templates/AnnotatedZoom/schema.ts](../../remotion-templates/src/templates/AnnotatedZoom/schema.ts); [remotion-templates/CLAUDE.md](../../remotion-templates/CLAUDE.md) template list

- Limits of those fields, as the files stand: `match-cut` and `match-cut-still` resolve to a plain cut ("until their paired zoom is rebuilt on top of the overlap") — [remotion-templates/src/utils/resolveSeams.ts](../../remotion-templates/src/utils/resolveSeams.ts) rule 7. `AnnotatedZoom`, `ScrollyReveal` and `AnnotatedImage` take `duotoneRamp` ∈ standard/conflict/editorial with no "none"; `PhotoMontage.treatment` is required with the same three values — the respective `schema.ts` files under [remotion-templates/src/templates/](../../remotion-templates/src/templates/). `over(previous)` works on `KineticTypography` only — [project/DIRECTING_LANGUAGE.md](../../project/DIRECTING_LANGUAGE.md). `framing` is one `from` and one `to`; a still with several stations is several segments
- `StillFrame.tsx` and `StillsReel.tsx` share a framing convention by design: "Framing convention shared with src/experiments/StillsReel.tsx" — [remotion-templates/src/components/StillFrame.tsx](../../remotion-templates/src/components/StillFrame.tsx)

**Which catalogue techniques fit existing fields** (my mapping of [project/VISUAL_TOOLBOX.md](../../project/VISUAL_TOOLBOX.md) rows onto the fields above)

| Status | Techniques |
|---|---|
| Expressible in the manifest today, no new code | Slow push/pull/pan (`framing`); framed details (consecutive segments with different `framing` on one still); insert and reverse angle (a new still, a cut); rapid-cut montage (consecutive short FOOTAGE segments); matched cut as a hard cut between two matched stills; match dissolve (`transition: dissolve`, real since 10 Oct); relight and soft state swap as a dissolve between two registered stills in consecutive segments; any AI clip (in-between, loop, three pinned frames, restyled stock) as a FOOTAGE segment with an `.mp4` |
| Has a template, with a known limit | Two-up (`SplitFrame`, in use once); labels and marks on a picture (`ScrollyReveal`, `AnnotatedImage`; duotone forced); zoom stations (`AnnotatedZoom`; duotone forced); type over a held picture (`KineticTypography` hold-under); a real document (`PrimarySourceReveal`, as a card, not inside the scene); unit chart (`IsotypeChart`, not built from the episode's figure) |
| No place to write it down | State swap or pose swap inside one shot (two sources, one framing, a swap time); accumulation build, colour isolation, cut-out move, line boil, paper theatre, type behind the figures (all need cut-out layers and a plate); layered depth, rack focus, passing light (need planes); lit screen, type on a surface, type in perspective, card flip, a document or portrait placed inside the scene, into-the-screen (need four corner points on the still); video inside a still (a clip plus a mask polygon); four-panel build, triptych, strip recap, storyboard sheet (panel layouts with crops); panorama travel (keyframed travel on a 4:1 picture with labels that ride it); wipe slider, double exposure, onion skin, sketch-to-colour, x-ray scan line; spotlight; plan view with sightlines; spot illustrations as diagram nodes; stepped time; a picture turned into a 3D model; a figure animated on green |

- There is no trim, playback-rate or loop field on a FOOTAGE segment: "The FOOTAGE path passes no trim, rate or loop" — [reports/AI stills beyond Ken Burns.md](../../reports/AI%20stills%20beyond%20Ken%20Burns.md) (line 316); the manifest schema has `holdBehavior` (freeze/loop/continue/linger/breathe/land) described as NLE metadata — [remotion-templates/data/assembly-manifest.schema.json](../../remotion-templates/data/assembly-manifest.schema.json)
- Re-timing: `retime_manifest.py` moves segment boundaries; "Reveal times typed into a graphic's data file are not rewritten" and are scaled at render by `scaleToSlot.ts`. The stills report notes that a pose-to-pose sequence "wired as consecutive manifest segments, each with its own narration reference, will therefore re-time cleanly, and one built as a single template with internal cue times will need checking by hand" — [tools/assembly/retime_manifest.py](../../tools/assembly/retime_manifest.py); [reports/AI stills beyond Ken Burns.md](../../reports/AI%20stills%20beyond%20Ken%20Burns.md) line 318

### Inferences

- For this episode the script stopped being the source of truth at the manifest (D49). Any still technique adopted now is written into the hand-wired manifest, and the script-level vocabulary matters only for the next episode's first generation.
- The cheapest techniques to carry are the ones that decompose into "one manifest segment per picture": each gets its own `narrationRef`, re-times with the recording, and needs no new schema.
- The techniques with no home share four missing data shapes: a second (registered) source on the same framing with a swap time; cut-out layers over a plate; a four-corner quad on a still; a panel layout with per-panel crops. Those four shapes cover most of the "no place" row.
- `shot-list.json` is the natural place a per-still treatment would be recorded before the manifest exists, and it is the least governed file in the path: its real keys are outside its schema and `CLAUDE.md` describes a schema field that is not there.

### Gaps

- The mapping table is mine; no file in the repo classifies catalogue techniques against existing fields. I did not test any of the "expressible today" entries in the episode.
- I did not read `SplitFrame/schema.ts` in full (my grep for its pane kinds returned nothing), so I cannot state exactly which pane contents it accepts.
- I did not check whether `generate_manifest.py` would emit `framing` for a fresh episode from any script input; grep found no code path, which suggests it cannot.

---

## 4. Inventory of what 7–11 October produced

### Takeaway

The four days produced one near-complete episode cut, one catalogue of 70 techniques in 15 families, about 3,500 lines of experiment code holding a dozen reusable pieces, five new tools, five new engine pieces, two synthesis reports and sixteen research files, three recorded rules (D48, D49, VIS-12) and a measured QA standard. The engine pieces and the QA tool are wired into the episode and into `CLAUDE.md`/`AGENTS.md`; the catalogue, the experiment components and `fal_edit.py` are referenced by no skill, lint or context file. None of it is in git, and neither is the May 19–24 sprint underneath it.

### Cited Findings

**Background claims, checked**

- Git: last commit `c6e9ead` dated 2026-05-23; 459 commits; 922 changed paths in the working tree (428 modified, 310 untracked, 89 added, 95 deleted) (measured) — repository root
- The uncommitted work is older than October. 41 template paths under `src/templates/` are untracked, including every template `CLAUDE.md` lists as shipped 19–20 May (Syllogism, AnalogyCrossmap, HandwrittenLetter, CinematicMap, DotPlot, …) and `templateRegistry.ts` itself; `project/PACING_REGISTER.md`, `COUNTERFACTUAL_REGISTER.md`, `ASSET_GENERATION_REGISTER.md`, `SOUNDSCAPE_REGISTER.md`, `skills/asset-brief/` and `skills/ground-motion/` are untracked (measured with `git ls-files` and `git status`)
- Technique count: the catalogue tables hold 70 rows (38 in families A–F, 25 in G–L, 7 in Round 5) (measured by counting rows that carry a reel timestamp). The memory file and its index say 71 — [project/VISUAL_TOOLBOX.md](../../project/VISUAL_TOOLBOX.md); `/Users/feihuyan/.claude/projects/-Users-feihuyan-project-parallax/memory/project_visual_toolbox_exploration.md`
- Tiger's words as recorded in memory: wants to expand the toolbox so that later "we can more effortlessly think about them wrt the script design", "know what type of visual strategy is good for which type of script", and eventually "think about the script from the aspect of visual strategy"; none of that is possible "if we don't expand the ontology of what's possible and what looks good"; verdict "I like all of these, we probably need to polish some of these, but i like having all of these options." — memory file `project_visual_toolbox_exploration.md`
- The same memory file records limits on that verdict: "He did not say which need polish; the catalogue's 'Faults to fix before use' table is my list, not his" and "That verdict is about keeping the options. It is not a go-ahead to wire any technique into an episode, a skill or a pipeline doc; ask before doing that."
- "Let's stop with over testing, my objective now is to push a complete first episode over the line." was said "After a round of skill evals"; the memory's stated reason is "Tooling polish (evals, lint, skill refactors) was crowding out the actual deliverable" — memory file `feedback_skip_over_testing.md`
- The toolbox memory calls the exploration "a deliberate exception" to that feedback and labels this "My interpretation" — memory file `project_visual_toolbox_exploration.md`
- Catalogue status line: "exploration catalogue, 11 October 2026. Nothing here is wired into an episode, a skill or a pipeline document yet. Every entry has been seen once on the `ai-care-motives` art, in one take." — [project/VISUAL_TOOLBOX.md](../../project/VISUAL_TOOLBOX.md)

**A. The catalogue: [project/VISUAL_TOOLBOX.md](../../project/VISUAL_TOOLBOX.md) (331 lines, modified 11 Oct 20:55)**

- Organising question: "what is this sentence doing, and which of the six should change to show it?" Two defined terms: **registered** ("two pictures that are pixel-identical except where a change was asked for") and **cut-out** ("a figure separated from its background with a mask, over a clean plate")
- Fifteen families:

| Family | What changes | Techniques (count) |
|---|---|---|
| A. The frame | the camera over one picture | slow push/pull/pan · framed details · panorama travel · rack focus · push-through · AI camera arc (6) |
| B. The picture | the picture, between registered states | state swap · pose swap · pose-to-pose · relight · accumulation build · wipe slider · colour isolation · AI in-between · AI transition (9) |
| C. Part of the picture | one region moves | video inside a still · loop · lit screen · layered depth · cut-out move · line boil · depth-map parallax (7) |
| D. The layout | several pictures share the frame | two-up · four-panel build · triptych · strip recap · video in one panel · spot illustrations as nodes · unit chart from the figure (7) |
| E. The sequence | pictures follow each other | rapid-cut montage · matched cut · match dissolve · a cut inside an AI clip (4) |
| F. Drawing on it | code draws on the picture | marks · spotlight · labels and connectors · type behind the figures · type on a surface (5); type in perspective added in Round 5 |
| G. The angle | where the camera stands | reverse angle · insert · plan view with sightlines (3) |
| H. The meaning | the picture stops being literal | shadow does something else · giant watchers · x-ray · sketch to colour · double exposure · onion skin (6) |
| I. The sheet | one generation, many shots | storyboard sheet (1) |
| J. The world | one picture contains the next | into the screen (1) |
| K. The hand | handmade-looking motion | card flip · stepped time · scribble · paper theatre · picture through type · multiply · passing light · light-lapse · stepped walk from edits · AI clip, stepped (10) |
| L. The machine | a different model does the work | three video models on one shot · morph without a video model · stock footage restyled · figure animated on green (4); three pinned frames added in Round 5 |
| M. The object | (Round 5) | a picture turned into a 3D model |
| N. The real thing | (Round 5) | a real document on the screen · a real portrait on the wall · drawn figures over a real photograph |
| (process) | (Round 5) | cut to a voice |

- The script-move table ("The sentence is…") has 35 rows across three tables (17 + 13 + 5) (measured). Each row has: what the narration is doing, an example line from the episode, "Reach for first", "Also works", and (first two tables) "What it asks of the script". Sample rows: naming parts of one scene → framed details; listing items quickly → rapid-cut montage; two versions of one act → two-up with a pose difference; taking one thing away → state swap; describing something that happens → pose-to-pose; giving a count → unit chart from the figure; drawing an analogy across cases → matched cut; naming the idea → type behind the figures; recapping → strip recap; leaving a question open → "A slow push on one still. This is where it earns its place"; telling a short story → storyboard sheet; showing the evidence itself → a real document on the screen
- Its stated diagnosis: "A long hold on one picture is still right when the narration wants the viewer to think; the fault in the episode is using it for every other kind of sentence as well."
- "What a script can do to set these up" — six rules: return to places; state the change as its own sentence; name what is in the picture; keep lists parallel and short; give analogies a returning phrase and a fixed order; put the number in its own clause
- "What to ask for when making the pictures" — six rules: reusable surfaces; clear silhouettes on a flat ground; states by edit, never by a second generation; matched compositions by anchor; compose for the layout; wide pictures with separated groups
- Faults table: 12 rows. Seven marked **Fixed** in the 11 Oct polish pass (triptych, pose-to-pose, pose swap, state swap, push-through, AI in-between, a cut inside an AI clip — the last "by changing the method": make the cut in Remotion between pinned clips); one **Not fixed** (AI camera arc: "Three takes, three inventions"); two open and needing new pictures from ChatGPT (flatter fal pictures; four-panel difference too small at phone size); two with no fix (AI transition between matched stills; depth-map parallax)
- One technique is recorded as failing outright: stepped walk from edits — "**Does not hold.** The figures change coat, count and position from step to step"
- "What this round says about the tools": "A sheet beats a chain"; "A second picture from a reference works"; "Video models differ in kind, not only in quality"; "Restyling real footage is now possible for under a dollar"; "Stepping hides the machine"
- Tool and price table:

| Job | Tool | Price as recorded |
|---|---|---|
| Edit one thing in a still | `fal-ai/nano-banana-2/edit` via `fal_edit.py` | $0.08 at 1K, $0.12 at 2K, $0.16 at 4K |
| Very wide picture | same endpoint at 4:1 | $0.16 (8256×2048) |
| Split a still into layers | `fal-ai/qwen-image-layered` | $0.05 (returns 864×480; use its outlines over the original) |
| Cut figures out | `fal-ai/birefnet/v2` | about $0 |
| Depth map | `fal-ai/image-preprocessors/depth-anything/v2` | about $0 |
| Five-second clip from a still | MiniMax H3 Max via `fal_i2v.py` | $0.48 at 1080p, "a promotional rate until 15 October 2026" |
| Other video models (Round 4) | Kling 3.0 Pro i2v $0.112/s; Veo 3.1 Lite i2v $0.05/s; Kling O3 Pro video-to-video edit $0.168/s; FILM and RIFE $0.0013 per compute second | |
| Round 5 | Pikaframes $0.36 for 6 s; Trellis image-to-3D $0.02 each; ElevenLabs via fal about 3 cents for three beats | |

- Spend as recorded in the catalogue: three reels about $4.20; polish pass $0.20; five retake clips $2.40; Round 4 about $3.74; Round 5 about $0.43; "the five exploration reels to about $8.38 (the polish pass and its retakes are counted separately)". The JSON sidecars on disk sum to $9.46 across 26 clip sidecars and $3.56 across 36 edit sidecars, $13.02 in all; that total also includes the 10 Oct clips and the visual-identity trials (measured) — [episodes/ai-care-motives/assets/clips-i2v/](../../episodes/ai-care-motives/assets/clips-i2v/), [episodes/ai-care-motives/assets/keyframes/](../../episodes/ai-care-motives/assets/keyframes/)
- Voice test finding: "The scratch read ran at 2.8 to 3.5 words a second, against the 2.5 the manifest assumes"; pauses of 0.6 to 1.2 s between sentences "are where the cuts want to sit"; "Cutting to words is mechanical once the timings exist"
- Its own statement of what remains: "What remains is no longer a kind of technique but a matter of doing these with your voice and deciding which to keep."
- Who references it: `StillsReel3.tsx` (a comment), `episodes/ai-care-motives/prompts/chatgpt-prompts-toolbox.md`, the stills report addendum, and the memory index. No skill, no `CLAUDE.md`, no `AGENTS.md` (measured with grep)

**B. Experiment code: [remotion-templates/src/experiments/](../../remotion-templates/src/experiments/)** (6 new files, 3,522 lines; registered in `Root.tsx` under the `Experiments` folder as `stills-reel-ai-care`, `-2-`, `-3-`, `-4-`, `-5-`, `stills-reel-polish-ai-care`, `stills-reel-retakes-ai-care`)

| File (lines) | Exported pieces | Generic or hard-wired |
|---|---|---|
| [StillsReel.tsx](../../remotion-templates/src/experiments/StillsReel.tsx) (546) | types `Framing`, `ShotState`, `Shot`, `Rect`, `Line`; `StillShots` (plays a list of shots: a framing move, stacked states with `atSec`/`softSec`, an overlay that rides the camera); `Panel` (rect, stacked states, focus, zoom, badge, veil); `QUAD`, `mixRect`, `Badge`, `RowLabel`; `MOVE`, `GLIDE`, `RESHAPE` easings; `NarrationStrip`, `Slate` (review aids); data `FRAMED_DETAILS`, `STATE_SWAP` | `StillShots` and `Panel` are data-driven and generic. `still()` is fixed to `episodes/ai-care-motives/stills-test`. `PanelBuild` and the shot data are for one picture |
| [StillsReel2.tsx](../../remotion-templates/src/experiments/StillsReel2.tsx) (739) | `K`, `FULL_IMG`, `FULL`, `RATER_STRIPS`, `CUTOUT_SCALE`, `PANO_ASPECT`, `TRI`, `MATCH`, `MatchAndTriptych`, `CONTACT`, `RESCUE`. Internal (not exported): `Crop` (one picture cropped to a region with a second registered state over it), `cardMarks`, `spotlight`, `crowdBuild`, `PanoTravel` (keyframed camera on a 4:1 strip with `travelEase` and labels that project onto the picture), `DeskDepth`, `ShopLive`, `QuadLive` | `Crop`, `spotlight`, `travelEase`, `panoCamera` take parameters and are generic in shape but private. `PanoTravel` reads module constants (`PANO_KEYS`, `PANO_LABELS`, the file `street-pano`). `RATER_STRIPS`, `CARDS`, `SCREEN`, `CONTACT`, `WINDOW_CLIP` are pixel measurements of specific stills |
| [StillsReel3.tsx](../../remotion-templates/src/experiments/StillsReel3.tsx) (662) | `PushThrough`, `STILLS_REEL_3_INDEX`. Internal: `CrowdLayers`, `RackFocus`, `TypeBehind`, `CutoutLean`, `LineBoil`, `ColourIsolation`, `UnitBlock`/`UnitChart`, `StripRecap`, `SpotDiagram`, `DepthParallax`, `Clip` | All internal components take no props or few and are tied to the crowd still, the desk still and the spot-illustration sheet |
| [StillsReel4.tsx](../../remotion-templates/src/experiments/StillsReel4.tsx) (889) | type `Pt`; `quadToQuad(src, dst)` (returns a CSS `matrix3d` mapping one quad to another); `FRAME_QUAD`; `SCREEN` (the laptop's four corners). Internal: `Storyboard`, `IntoScreen`, `Raters`, `Figure`, `Stepped`, `PaperTheatre`, `ThroughType`, `Multiply`, `PassingLight`, `ThreeModels`, `Morphs`, `Restyle`, `GreenActor`, `Video`, `Tag` | `quadToQuad` is a pure function and generic. The rest is per-picture |
| [StillsReel5.tsx](../../remotion-templates/src/experiments/StillsReel5.tsx) (494) | none beyond the reel. Internal: `ThreeKeyframes`, `Orbit`, `Model` (GLTF via `@remotion/three`), `NoticePage`, `DocumentOnScreen`, `Collage`, `Voice`, `VoiceStoryboard` | per-picture; `Model` takes a file and orbit angles |
| [StillsReelPolish.tsx](../../remotion-templates/src/experiments/StillsReelPolish.tsx) (192) | `StillsReelPolish`, `StillsReelRetakes`. Internal: `Pane`, `TakePair`, `FullClip` | sequencing only: "this file only sequences them" |

- Dependency chain between the experiment files: Reel 3 imports from Reels 1 and 2; Reel 4 from 1 and 2; Reel 5 from 1, 2 and 4; Polish from 1, 2 and 3 (measured from import lines)
- Every file's header says "Test only: nothing here is wired into an episode manifest." The narration strip is "a review aid… not part of the look" — file headers
- I did not find a symbol named `quadMatrix`; the equivalent function is `quadToQuad` in `StillsReel4.tsx`
- Rendered reels (gitignored via `remotion-templates/out/`): `stills-test-reel.mp4` (24 MB), `-reel-2` (66 MB), `-reel-3` (74 MB), `-reel-4` (126 MB), `-reel-5` (56 MB), `stills-test-polish.mp4` (41 MB), `stills-test-retakes.mp4` (10 MB) — [remotion-templates/out/ai-care-motives/](../../remotion-templates/out/ai-care-motives/)
- Test pictures and clips: 88 files, 204 MB, not gitignored, untracked — [remotion-templates/public/episodes/ai-care-motives/stills-test/](../../remotion-templates/public/episodes/ai-care-motives/stills-test/)
- A browsable gallery is recorded at `https://claude.ai/artifact/QnAmQkwEYNEAU98wJznnAK` — memory file `project_visual_toolbox_exploration.md` (not opened; no web)

**C. New tools**

| Tool | What it does | Documented in | Tests |
|---|---|---|---|
| [tools/ai-video/fal_i2v.py](../../tools/ai-video/fal_i2v.py) (170 lines, 10 Oct) | one image-to-video clip per call through fal's queue API; optional pinned end frame; JSON sidecar with prompt, expanded prompt, price; price table in code ("H3 Max is 40% off until Oct 15 2026") | `CLAUDE.md` Shipped Oct 10; `project/VISUAL_QA.md`; not in `AGENTS.md`; no skill | none found |
| [tools/ai-video/fal_edit.py](../../tools/ai-video/fal_edit.py) (206 lines, 11 Oct) | `edit` (send a still or a crop + instruction to `fal-ai/nano-banana-2/edit`) and `composite` (paste back through a feathered box so everything outside is pixel-identical) | `VISUAL_TOOLBOX.md` and the stills report only; not in `CLAUDE.md`, `AGENTS.md` or any skill | none found |
| [tools/assembly/retime_manifest.py](../../tools/assembly/retime_manifest.py) (553 lines, 10–11 Oct) | re-times a hand-wired manifest to recorded narration; dry run unless `--write` | `CLAUDE.md`, `AGENTS.md`, `PRODUCTION_PIPELINE.md`, D49 | [test_retime_manifest.py](../../tools/assembly/test_retime_manifest.py) |
| [remotion-templates/scripts/qa-episode.mjs](../../remotion-templates/scripts/qa-episode.mjs) (630 lines, 10–11 Oct) | episode-level and frame-level measured checks; "Components" section; `npm run qa:episode` | `CLAUDE.md`, `AGENTS.md`, `VISUAL_QA.md`, `pipeline-state.json` notes; no skill (render-qa and visual-qa do not mention it) | none found; supported by `QaProbe.tsx`, `qaMode.ts` |
| [remotion-templates/scripts/preview-range.mjs](../../remotion-templates/scripts/preview-range.mjs) (101 lines, 10 Oct) | picture-only mp4 of a time range or one segment with padding | `CLAUDE.md`, `AGENTS.md` | none found |

(references measured with grep across `*.md`, `*.py`, `*.mjs`, `*.ts`, `*.tsx`, `*.json`)

- The fal tools need `FAL_KEY` "in the environment or the repo-root .env (gitignored)" — tool docstrings
- `fal_i2v.py`'s docstring points to "Prompting rules for flat constructivist stills: project/CHAINED_STILL_LESSONS.md", a file that contains none of the October rules (see §5) — [tools/ai-video/fal_i2v.py](../../tools/ai-video/fal_i2v.py)
- Older tools in the same folder that the new ones sit beside: `render_kenburns.py`, `upscale.py`, `gen_depth.py`, `gen_motion_prompts.py`, `motion_director.py`, `critic_loop.py` — [tools/ai-video/](../../tools/ai-video/)

**D. New engine pieces**

| Piece | Role | Wired in | Test |
|---|---|---|---|
| [src/utils/resolveSeams.ts](../../remotion-templates/src/utils/resolveSeams.ts) (201 lines) | decides what each seam draws; real cross-dissolve via an outgoing "tail"; hold-under; iris → cut; match-cut → cut | `FullEpisode.tsx`, `segmentBackdrop.ts`; referenced by `manifest_lint.py`, `generate_manifest.py`, `TRANSITION_GRAMMAR.md`, `LESSONS.md`, `CLAUDE.md` | `resolveSeams.test.ts` |
| [src/utils/scaleToSlot.ts](../../remotion-templates/src/utils/scaleToSlot.ts) (74 lines) | scales reveal times typed in seconds by slot ÷ authored length | `FullEpisode.tsx`; `retime_manifest.py`; both `CLAUDE.md` files | `scaleToSlot.test.ts` |
| [src/utils/syncPoints.ts](../../remotion-templates/src/utils/syncPoints.ts) (40 lines) | passes on only the resolved sync cues before the first gap, so positional cues do not shift | not traced further | `syncPoints.test.ts` |
| [src/components/StillFrame.tsx](../../remotion-templates/src/components/StillFrame.tsx) (114 lines) | draws a still from its full-resolution file through a `from`→`to` framing; exports `framingAt`, `clampFraming`, `framingTransform`, `DEFAULT_STILL_FRAMING` | `FullEpisode.tsx`; manifest schema `stillFraming`; both `CLAUDE.md` files | `stillFrame.test.ts` |
| [src/hooks/useChromeLevel.tsx](../../remotion-templates/src/hooks/useChromeLevel.tsx) (37 lines) | per-episode chrome level: `briefing` or `wordmark` | `HeaderStrip`, `FooterStrip`, 9 templates, `AiCareMotivesFull.tsx`; `VISUAL_QA.md` | none found |
| `handWired` manifest flag | makes a manifest the source of truth; generator refuses to overwrite without `--force` | schema, `generate_manifest.py` (`hand_wired_refusal`), `AGENTS.md`, `CLAUDE.md`, `PRODUCTION_PIPELINE.md`, D49 | `test_generate_manifest.py` |

- Further engine changes listed for 11 Oct in `CLAUDE.md`: an exchange layout on `PrimarySourceReveal` (`dialogue`, `label`, `typeOut`, …); "Cuts land on set cards"; music ducking under narration in `AudioLayer`; CJK fonts loaded on demand ("707 → 55 font files per page") — [CLAUDE.md](../../CLAUDE.md) "Engine changes, Oct 11"

**E. Research documents**

Two synthesis reports in [reports/](../../reports/):

| File | Lines | One-line conclusion (from its own title and lead) |
|---|---:|---|
| [Remotion polish and AI tooling.md](../../reports/Remotion%20polish%20and%20AI%20tooling.md) (10 Oct) | 126 | "Shared-code fixes outrank new AI tooling": the episode's visible defects sit in shared defaults; "fix defaults before writing rules, because one corrected helper reaches hundreds of call sites while one more doctrine paragraph reaches none"; "harden only the templates the episode uses, so the library improves at the pace of shipping" |
| [AI stills beyond Ken Burns.md](../../reports/AI%20stills%20beyond%20Ken%20Burns.md) (11 Oct) | 397 | "Free stills should cut, not drift": spend several registered states on each scene, cut on the narration, annotate in code, keep AI video for the pinned first-and-last-frame technique; closes by arguing "for writing them into one current doctrine page that supersedes the May documents, with each prompt rule tied to its model and date, a ruling on layered parallax, and a rule on how much of an episode a single-move still may carry" |

Research notes behind those reports: 9 files, about 640 KB, in `research_notes/AI stills beyond Ken Burns/` (5 files) and `research_notes/Remotion polish and AI tooling/` (4 files) — [research_notes/](../../research_notes/)

`analysis/*2026-10-*.md` (16 files; five are scripts, outlines or pointer stubs for the episode):

| File | Lines | One-line conclusion |
|---|---:|---|
| [ai-video-landscape-2026-10-10.md](../../analysis/ai-video-landscape-2026-10-10.md) | 158 | Parallax under-uses AI video for historical reasons; tested H3 Max on this art: "The model obeys 'what stays still' and the direction of motion; it ignores amplitude and speed words"; "A pinned end frame gives the most control and is the first technique good enough to use"; lists the repo docs that are now stale (§7) |
| [transitions-research-2026-10-10.md](../../analysis/transitions-research-2026-10-10.md) | 83 | Segments never overlapped, so dissolves cut to blank paper; the iris read as a gag and played twice; proposed the seam grammar that shipped the same day |
| [ai-imagery-trust-research-2026-10-10.md](../../analysis/ai-imagery-trust-research-2026-10-10.md) | 135 | "D3's number does not survive a source check, but its direction mostly does"; answer No in YouTube's AI field, add a short plain disclosure, keep AI video a minority of runtime |
| [sound-under-narration-research-2026-10-10.md](../../analysis/sound-under-narration-research-2026-10-10.md) | 103 | The evidence for a continuous music bed under narration is weak to negative; repeated arbitrary sounds cost comprehension; led to the "under review" banner on AUDIO_DESIGN |
| [voice-sync-render-captions-research-2026-10-10.md](../../analysis/voice-sync-render-captions-research-2026-10-10.md) | 203 | The re-time moves segment edges only; "The sync-word matcher returns wrong words with full confidence"; one unresolved cue shifts all later cues (fixed by `syncPoints.ts`) |
| [youtube-encoding-research-2026-10-10.md](../../analysis/youtube-encoding-research-2026-10-10.md) | 204 | Upload settings, bitrate and the 28 px legibility floor that `VISUAL_QA.md` adopted |
| [remotion-improvements-research-2026-10-11.md](../../analysis/remotion-improvements-research-2026-10-11.md) | 177 | Installed packages and where use is weak (`fitText` and others installed and unused); basis for the 11 Oct engine changes |
| [beyond-remotion-tools-research-2026-10-11.md](../../analysis/beyond-remotion-tools-research-2026-10-11.md) | 221 | "The largest gains outside Remotion are in sound and finishing, not in another animation tool"; "Finish in code"; one animation tool worth an evening (Manim) |
| [museum-open-access-research-2026-10-11.md](../../analysis/museum-open-access-research-2026-10-11.md) | 241 | "Worth adopting, narrowly": eight CC0 collections; prints sit beside flat stills, oils do not; "the API work is about a day" |
| [original-demonstrations-research-2026-10-11.md](../../analysis/original-demonstrations-research-2026-10-11.md) | 201 | "leave the illustrative exchange and its label, and put no test of our own in this episode"; source of VIS-12 |
| [screen-capture-research-2026-10-11.md](../../analysis/screen-capture-research-2026-10-11.md) | 187 | True 2160p page capture works with installed Playwright + ffmpeg; the two empty slots need a typeset reconstruction, not a recording |
| ai-care-angle-memo…, ai-care-research-brief… (7 Oct) | 1 each | pointer stubs: "Moved to episodes/ai-care-motives/…" |
| first-ai-episode-do-motives-matter-one-pager / -script, first-ai-episode-good-or-looking-good-outline (7 Oct) | — | early drafts of the episode |

- No skill references `analysis/` or `reports/` except angle-memo (measured). `CLAUDE.md` links four of these files in its Oct 10/11 entries

**F. A third body of work: visual-identity studies (10–11 Oct)**

- [project/visual-identity/2026-10-10/](../../project/visual-identity/2026-10-10/): 13 alternative illustration directions with generated samples (woodcut, paper theatre, charcoal with spot colour, gouache, risograph, modernist cel, conceptual line, architectural surrealism, …), a research file `visual-language-research.md` (202 lines) on character consistency, facets and surreal storytelling, a character sheet and six-frame storyboard, and reveal comparisons. The README states the face rule: "no eyes, eyebrows, eye sockets, nose, mouth, lips or inner-ear marks; no nose or lip protrusions in profile"
- [project/visual-identity/2026-10-11/](../../project/visual-identity/2026-10-11/): three fal character-motion trials ("The coin exchange is the strongest action prototype. The head turn violates the featureless-face rule; the original pull exposes weak hand/arm anatomy"), eight scenery/object/overlay studies with six-second Remotion clips, and a 26-second combined Remotion sequence; "no treatment has been selected for production"
- The combined-sequence README names production components it could later use: "ImageComposite for object placement, AnnotationSVGLayer for authored leaders and FrameworkDiagram for the explanation. Those production components would need a paint-preserving asset path and explicit timing/data adapters"
- Related code and data: `remotion-templates/research/combined-sequence/` (5 files) and `remotion-templates/research/world-objects-overlays/` (6 files) (measured)
- This work is not mentioned in `CLAUDE.md`, `AGENTS.md`, `VISUAL_TOOLBOX.md` or the memory index (measured with grep for `visual-identity`; one hit, in `fal_i2v` trial data)

**G. Episode-level artefacts: [episodes/ai-care-motives/](../../episodes/ai-care-motives/)**

- `prompts/`: `chatgpt-prompts.md` (8 Oct), `chatgpt-prompts-toolbox.md` (11 Oct; six pictures to remake in ChatGPT "where the twelve episode stills were made"; "None of them is in the episode"), `edit/` with 28 prompt files, `i2v/` with 17 (measured)
- `assets/keyframes/`: 98 files, 484 MB, of which 36 are JSON sidecars (32 for `nano-banana-2/edit`, 2 BiRefNet, 1 depth, 1 Qwen layered); not gitignored, untracked (measured)
- `assets/clips-i2v/`: 52 files, 278 MB = 26 clips + 26 JSON sidecars (20 MiniMax H3 Max, 1 each of Kling v3 Pro, Veo 3.1 Lite, Kling O3 edit, Pikaframes, FILM, RIFE); gitignored by `episodes/*/assets/clips-i2v/`, so the sidecars that record prompts and costs are also outside git (measured; [.gitignore](../../.gitignore) line 76)
- Sidecar fields: `generated_at`, `model`, `request_id`, `still`, `end_image`, `duration_requested`, `resolution`, `prompt`, `expanded_prompt`, `price_per_second_usd`, `estimated_cost_usd`, `video_url` (clip); `image`, `crop`, `sent_size`, `returned_size`, `prompt`, `estimated_cost_usd`, `image_url` (edit) — e.g. `assets/clips-i2v/aigen-03-headturn.json`
- `assets/scratch-voice/`: three synthetic mp3 files and `words.json`; "The voice is a timing aid. It is not the narration and nothing in the episode uses it." — [project/VISUAL_TOOLBOX.md](../../project/VISUAL_TOOLBOX.md)
- Other asset folders: `stills/` 12, `stills-4k/` 12 (gitignored), `clips-kenburns/` 16 (gitignored; superseded by `StillFrame`), `sourced/` 9, `stills-archive/` 5, `ep-refs/` 4 (measured)
- `visual-spec.md` (193 lines) is a running log: sections 6–15 are dated passes from 9–10 Oct (critique pass, assets sourced, hold and timing fixes, shared-code fixes, chrome stripped, three pane-review batches)
- QA outputs: 10 tagged runs under `remotion-templates/out/qa/` (gitignored). The components run of 11 Oct reports AI illustration 5:09 (45.6%), of which "Camera move only (Ken Burns)" 22 segments, 4:08 (36.6%); "Animated by a video model" 1 segment, 0:10 (1.5%); stills aigen-10 used 5× and aigen-06 4×; 0 fails, 13 warnings on the main run — `remotion-templates/out/qa/ai-care-motives-components/report.md`, `remotion-templates/out/qa/ai-care-motives/report.md`

**H. Decisions and rules recorded**

- D48 (7 Oct): focus shifts to AI alignment, ethics and philosophy. "Open: disposition of the geopolitics queue; elevator pitch and title rule wording; default visual vocabulary for argument-driven episodes; updates to PROJECT_VISION / CONTENT_IDENTITY / CHANNEL_POSITIONING." Scope: `CLAUDE.md`, script-audit and topic-viability skills — [project/DECISIONS.md](../../project/DECISIONS.md)
- D49 (10 Oct): hand-wired manifest is the source of truth; narration re-times it. Open: reveal timings inside data files; no speech-alignment library installed — [project/DECISIONS.md](../../project/DECISIONS.md)
- VIS-12 (approved 11 Oct): every exchange or transcript on screen carries one of three labels ("Illustrative exchange · written for this video", "Reconstruction · source, year", "Our test · N answers · API · run date") — [episodes/EDITORIAL_PLAYBOOK.md](../../episodes/EDITORIAL_PLAYBOOK.md)
- [project/VISUAL_QA.md](../../project/VISUAL_QA.md): "code measures, the reviewer judges"; thresholds (text ≥ 18 px fail / 28 px warn; safe area; WCAG contrast; hold ≥ 3 s + 0.25 s/word; static card > 15 s; still reused > 2; same template ≥ 3 in a row); the Components taxonomy; chrome level `wordmark` for this episode "decided Oct 10, 2026"
- No DECISIONS entry exists for: the iris retirement, seam ownership, natural-colour stills, the thinned audio plan, the `wordmark` chrome level, stills drawn in Remotion, or the toolbox exploration (D49 is the latest entry) — [project/DECISIONS.md](../../project/DECISIONS.md)

### Inferences

- The October output falls into three adoption states. **Adopted and documented**: `resolveSeams`, `scaleToSlot`, `syncPoints`, `StillFrame`, `useChromeLevel`, `handWired`, `retime_manifest.py`, `qa-episode.mjs`, `preview-range.mjs`, VIS-12, D48, D49. **Used but thinly documented**: `fal_i2v.py` (in `CLAUDE.md`, not `AGENTS.md`, no skill), `fal_edit.py` (catalogue only), the October prompting rules (analysis file only). **Parked**: the 70-row catalogue, the experiment components, the visual-identity studies, most research conclusions.
- The memory folder is currently the only loaded-by-default pointer to the catalogue; a session that does not read memory, or reads `CLAUDE.md` alone, will not learn that it exists.
- Three things that existing tooling treats as records live outside version control: clip sidecars (gitignored), the reels (gitignored), and everything else (uncommitted). The QA report's classification of "animated by a video model" depends on those sidecars existing on this disk.
- The catalogue's generic core is small: `StillShots` + `Shot`/`ShotState`, `Panel`, `Crop`, `quadToQuad`, the spotlight and travel-ease helpers. Almost everything else is per-picture measurement data plus short compositions that call those pieces.

### Gaps

- "Three Claude sessions" could not be confirmed from the repo. Memory files show two distinct `originSessionId` values for October entries and describe a fork; the visual-identity work reads as a third stream but nothing on disk says which session made it.
- The count of 71 techniques could not be reproduced; I count 70 table rows. The difference may be a technique counted in a family list and not given its own row.
- I did not watch any reel or open the gallery, so nothing here judges how a technique looks.
- Tiger's statements are known to me only through the memory files, which are a session's paraphrase with quoted fragments; I found no transcript.
- I did not find a per-technique verdict from Tiger anywhere; the catalogue's Verdict column is empty in every row.
- Spend: the catalogue's own totals (about $8.38 + $2.60) and the sidecar sum ($13.02) cover different sets; I did not reconcile them clip by clip.

---

## 5. Staleness and conflict

### Takeaway

Seventeen of the nineteen rows in the report's "Doctrine splits" table are still true of the files today, one is partly superseded, and the new engine added a fresh instance of one of them (a linear default in `StillFrame` against the "never linear" rule). Beyond that table, the strategy documents, the AI-video documents, three status surfaces for the episode, the narration command and the visual-spec skill's framing each lag the October state in a specific, checkable way.

### Cited Findings

**The "Doctrine splits" table ([reports/AI stills beyond Ken Burns.md](../../reports/AI%20stills%20beyond%20Ken%20Burns.md) lines 324–344), re-checked row by row**

| # | Topic | State of the files on 11 Oct | Standing |
|---:|---|---|---|
| 1 | Layered parallax | "Manual 2.5D (C) is the one 'premium' move… reserve for 1–2 hero depth shots" ([CHAINED_STILL_LESSONS.md](../../project/CHAINED_STILL_LESSONS.md) L207); "`parallax-2.5d`: ≤ 2 per episode" ([MOTION_DIRECTOR_SPEC.md](../../project/MOTION_DIRECTOR_SPEC.md) L99); "Per-element drift is forbidden" ([HOLD_MOTION_REGISTER.md](../../project/HOLD_MOTION_REGISTER.md) L477); "Heavy parallax / 2.5D depth — Fights flat illustration discipline" ([AI_VIDEO_PIPELINE.md](../../project/AI_VIDEO_PIPELINE.md) L414) | Still unresolved. The catalogue now has one take each of layered depth ("Works and is subtle"), paper theatre and rack focus |
| 2 | Static elements in a video prompt | "Never describe what stays static (mentioning it causes Kling to animate it)" ([ASSET_GENERATION_REGISTER.md](../../project/ASSET_GENERATION_REGISTER.md) L199); "name only the one moving element; name everything else…" ([CHAINED_STILL_LESSONS.md](../../project/CHAINED_STILL_LESSONS.md) L55); "The model obeys 'what stays still'" ([ai-video-landscape](../../analysis/ai-video-landscape-2026-10-10.md) L149) | Still three rules for three models, none dated beside the others |
| 3 | "No usable programmatic API" | "these tools have no usable programmatic API" ([ASSET_GENERATION_REGISTER.md](../../project/ASSET_GENERATION_REGISTER.md) L24); `fal_i2v.py` and `fal_edit.py` exist, and 62 JSON sidecars of fal calls are on disk | Stale |
| 4 | Tool picks and prices | AI_VIDEO_PIPELINE header "Updated: May 9, 2026", "Primary for chained scenes: Pika 2.5"; ASSET_GENERATION_REGISTER names ChatGPT, Kling, Hailuo, Pika; `GENERATION_WORKFLOW.md` carries a "24 September 2026 review" banner saying its selections and prices "are historical" | Stale; one of three files flags itself |
| 5 | Why morphs fail | "has no 3D world model" and "So gooeyness is architectural" ([CHAINED_STILL_LESSONS.md](../../project/CHAINED_STILL_LESSONS.md) L149, L152) | Unchanged |
| 6 | October findings absent from CHAINED_STILL_LESSONS | Header "Last updated: May 21, 2026"; zero matches for "H3 Max", "October", "pinned end", "amplitude" (measured). `fal_i2v.py` nonetheless points to it for prompting rules | Stale by omission; the seven October prompting rules live only in [ai-video-landscape](../../analysis/ai-video-landscape-2026-10-10.md) lines 114–119 |
| 7 | Still-design rules vs pose techniques | "Figures must be dark silhouettes in static poses… Never mid-stride, mid-gesture"; "No flickering light sources" ([ASSET_GENERATION_REGISTER.md](../../project/ASSET_GENERATION_REGISTER.md) L125, L129). The catalogue's pose-to-pose, onion skin, light-lapse and passing light need the opposite | Conflict by design, still unrecorded |
| 8 | AI-GEN share | "Target 10-20% of episode runtime" ([VISUAL_LANGUAGE.md](../../project/VISUAL_LANGUAGE.md) L315); "AI-GEN 5-15%" ([skills/visual-spec/SKILL.md](../../skills/visual-spec/SKILL.md) L326, citing SCRIPT_FORMAT); "AI-gen 15-30%" (VIS-01 in [EDITORIAL_PLAYBOOK.md](../../episodes/EDITORIAL_PLAYBOOK.md)); measured 45.6% | Three different targets in three files, and the episode outside all of them |
| 9 | Uniform slow zoom | "Continuous-zoom uniform across composition… is the YouTube-explainer signature anti-pattern" ([HOLD_MOTION_REGISTER.md](../../project/HOLD_MOTION_REGISTER.md) L459, L467); the manifest has 22 still segments with a `framing` move, 36.6% of runtime | Unchanged |
| 10 | Easing | "A1: No linear interpolation" ([POLISH.md](../../remotion-templates/POLISH.md) L20); "Motion is never linear" ([remotion-templates/CLAUDE.md](../../remotion-templates/CLAUDE.md)); `render_kenburns.py` L59 "Linear zoom". **New:** `StillFrame.tsx` documents `"linear"` as its default ease, and 18 of the 22 framings in the manifest use it | Conflict now also in the replacement component |
| 11 | Match cut | "the highest-leverage under-served transition in the channel" ([TRANSITION_GRAMMAR.md](../../project/TRANSITION_GRAMMAR.md) L222, L593); `match-cut` → cut in [resolveSeams.ts](../../remotion-templates/src/utils/resolveSeams.ts) and in the grammar's own table (L72) | Named and not built; matched cut and match dissolve exist only in experiments |
| 12 | Transition budget | "Never: … more than three transition types in one episode" ([TRANSITION_GRAMMAR.md](../../project/TRANSITION_GRAMMAR.md) L406). Manifest today: color-wash on the way in at 7 segments and on the way out at 5; four tokens in use (cut, dissolve, fade, color-wash) (measured) | Over the limit if a plain cut counts as a type; the rule does not say |
| 13 | Still reuse | "Still reused > 2 uses — house rule" ([VISUAL_QA.md](../../project/VISUAL_QA.md)); "The desk-at-night still now appears five times; it is the episode's recurring 'you and the machine' image" ([visual-spec.md](../../episodes/ai-care-motives/visual-spec.md) L105); catalogue rule 1 is "Return to places" | The QA rule, the episode and the catalogue point three ways; the exception is noted only in the episode file |
| 14 | Episode share figure | QA components report: 5:09, 45.6% (verified) | Use the QA figure |
| 15 | `DepthParallax` template | Described in [LESSONS.md](../../remotion-templates/LESSONS.md) L1016–1024 and named in `gen_depth.py` L6; no folder under `src/templates/`. **New:** a private component named `DepthParallax` exists inside `StillsReel3.tsx` (line 387) "for comparison" | Still missing as a template |
| 16 | Natural colour | `AnnotatedImage`, `ScrollyReveal`, `AnnotatedZoom` accept only standard/conflict/editorial for `duotoneRamp`; `PhotoMontage.treatment` is required; `ImageComposite.duotone` accepts "none" (schema files) | Templates still lag the decision |
| 17 | Consecutive AI-GEN | "Never more than 2 consecutive AI-GEN clips without a mode switch" ([VISUAL_LANGUAGE.md](../../project/VISUAL_LANGUAGE.md) L315; [skills/visual-spec/SKILL.md](../../skills/visual-spec/SKILL.md) L332, L342) | No ruling for a pose-to-pose or framed-details run on one scene |
| 18 | Decision D3 | "Clean motion graphics as primary visual (not AI illustration)… trust drop (~50%)… AI used as compositing tool only… never as raw final output" ([DECISIONS.md](../../project/DECISIONS.md) L19–20) | Unchanged in the log; the episode is 45.6% AI illustration |
| 19 | H3 Max price | "$0.48 at 1080p (a promotional rate until 15 October 2026)" ([VISUAL_TOOLBOX.md](../../project/VISUAL_TOOLBOX.md)); "40% off until Oct 15 2026 (then 0.05 / 0.08 / 0.16)" ([fal_i2v.py](../../tools/ai-video/fal_i2v.py)) | Every MiniMax price in the catalogue expires four days after this audit |

- The report's note that "Four techniques have no doctrine at all: a deliberate line boil, the maximum number of panes, minimum pane size for phones, and push-through seams" still holds; none of the four terms appears in a doctrine file (the grammar bans "zoom or whip presets" without naming push-through) — [project/TRANSITION_GRAMMAR.md](../../project/TRANSITION_GRAMMAR.md) L406

**Additional stale or conflicting documents**

| Document | What is stale, in one line |
|---|---|
| [project/PROJECT_VISION.md](../../project/PROJECT_VISION.md) (mtime 9 May) | Summary still reads "historical analogy, philosophical frameworks, and contemporary geopolitics"; 16 mentions of geopolitics, 0 of alignment (measured) |
| [project/CONTENT_IDENTITY.md](../../project/CONTENT_IDENTITY.md) (mtime 3 May) | 23 mentions of geopolitics, 0 of alignment; read by 7 skills (measured) |
| [project/CHANNEL_POSITIONING.md](../../project/CHANNEL_POSITIONING.md) (mtime 5 May) | Describes the visual lineage as "editorial design tradition applied to geopolitics"; public "About" copy predates D48 |
| [project/AUDIO_DESIGN.md](../../project/AUDIO_DESIGN.md) | Carries an "Under review (October 10, 2026)" banner: research "contradicts several rules below: the continuous music bed, 'avoid silence longer than 3 seconds', a transition sound at every beat boundary, and the quotas of 15–25 transition sounds and 30–50 texture hits"; the body and the audio-spec skill are unchanged |
| [project/AI_VIDEO_PIPELINE.md](../../project/AI_VIDEO_PIPELINE.md) | "Updated: May 9, 2026"; Pika 2.5 as the validated default; no fal, no pinned end frame, no edit-then-composite; visual-spec lists it as a reference doc |
| [project/ASSET_GENERATION_REGISTER.md](../../project/ASSET_GENERATION_REGISTER.md) | "no usable programmatic API"; Kling/Hailuo/Pika tool table; static-pose still rules; the asset-brief skill is built on it |
| [project/CHAINED_STILL_LESSONS.md](../../project/CHAINED_STILL_LESSONS.md) | "Last updated: May 21, 2026"; `remotion-templates/CLAUDE.md` cites it as the easing doctrine and `fal_i2v.py` as the prompting doctrine |
| [CLAUDE.md](../../CLAUDE.md) status row for `ai-care-motives` | Says "all 12 stills generated, upscaled and rendered as Ken Burns clips" and "26 data files"; the same file's Oct 11 entry says `StillFrame` "Replaces the clips baked by `render_kenburns.py`… uses it for all 22 still segments"; the data folder holds 28 data files plus the manifest (measured) |
| [CLAUDE.md](../../CLAUDE.md) elsewhere | Header "Last updated: May 16, 2026"; May entry lists iris as canonical; says the shot-list schema has `camera_move` (it does not); has no entry for `VISUAL_TOOLBOX.md`, `fal_edit.py` or the experiments |
| [episodes/ai-care-motives/_status.md](../../episodes/ai-care-motives/_status.md) | "Auto-generated 2026-10-08"; shows "✗ assembly-manifest", "✗ data files", "0 clips", "5 of 9 stages" and a next action "Assembly manifest missing — run `generate_manifest.py`", which D49 now refuses |
| [episodes/pipeline-state.json](../../episodes/pipeline-state.json) notes | "28 Remotion data files, hand-wired assembly manifest (51 segments, 11:19 estimate)" and "16 Ken Burns clips rendered"; the manifest has 53 segments today. D49 and the 10 Oct report say 56 (true on their dates, when stills were baked clips); `CLAUDE.md` says 53 |
| [.claude/commands/narrate.md](../../.claude/commands/narrate.md) L176 | Tells the operator to run `generate_manifest.py $1 --audio`, the path D49 replaced with `retime_manifest.py` |
| [skills/visual-spec/SKILL.md](../../skills/visual-spec/SKILL.md) | Opens "You are generating the full visual data layer for a bilingual geopolitics video channel"; mode-share targets predate the episode; Step 5 writes Kling/Sora/Runway briefs; internal iris contradiction at line 29; `episodes/ai-care-motives/visual-spec.md` §5 still says "Run `generate_manifest.py`… render stills of the 26 files" |
| Skills generally | "geopolit" appears in 14 of 25 `SKILL.md` files (persona-eval 7, visual-spec 4, visual-concept 4, publish-retro 4, review-package 3, …); D48 lists only script-audit and topic-viability as updated (measured) |
| [data/shot-list.schema.json](../../data/shot-list.schema.json) | Lacks every motion and thread key that the one live shot list uses |
| [data/concepts.json](../../data/concepts.json) | No entry for the new episode's named concept |
| [project/DECISIONS.md](../../project/DECISIONS.md) | D3 unrevised; no entry after D49 |
| [episodes/EDITORIAL_PLAYBOOK.md](../../episodes/EDITORIAL_PLAYBOOK.md) | VIS-01 budgets ("MG 40-55%, Footage 15-25%, AI-gen 15-30%") against a measured 35.7% / 15.2% / 45.6%; revision history stops at 10 May; two pending rules unreviewed since May |
| [project/PRODUCTION_PIPELINE.md](../../project/PRODUCTION_PIPELINE.md) | "Pipeline Overview (Actual — as of May 12, 2026)"; a D49 paragraph was added at L481, nothing on StillFrame, QA or fal |
| [project/MOTION_DIRECTOR_SPEC.md](../../project/MOTION_DIRECTOR_SPEC.md) | Six-technique taxonomy and "does not generate AI video (no API)" predate the 70-row catalogue and `fal_i2v.py` |
| `~/.claude/commands/end-session.md` | Refers to `memory/active_context.md` and `memory/progress.md`, which do not exist |
| Plugin skill copies | Ten installed copies differ from the repo and predate every October change |

### Inferences

- Staleness clusters where a number or a tool name was restated in several files: mode shares (three targets), segment counts (four values), the transition list, the AI video tool pick. Each restatement is a place the next change must also reach.
- The documents that would mislead a script or spec session most directly are the ones skills actually load: `VISUAL_LANGUAGE.md` (5 skills), `SCRIPT_FORMAT.md` (8), `CONTENT_IDENTITY.md` (7), `AI_VIDEO_PIPELINE.md` and `ASSET_GENERATION_REGISTER.md` (visual-spec, asset-brief). The stale strategy docs matter through `CONTENT_IDENTITY.md`'s seven readers.
- Two of the validator-backed surfaces (`_status.md`, the `CLAUDE.md` status row) are out of date although a tool exists to regenerate them; the tool evidently has not been run since 8 Oct, or its stage detection does not recognise the hand-wired layout. I did not run it to find out which.
- The catalogue itself will start to age on 15 October (prices) and whenever Tiger records the six ChatGPT remakes or a verdict.

### Gaps

- I checked each doctrine-split row by grep for the quoted phrase, not by rereading the surrounding sections, so a nearby qualifying sentence could have been added without my seeing it.
- Row 12's "2–3 colour washes" limit was not located as a phrase; I found only the "more than three transition types" rule.
- I did not diff `skills/*/SKILL.md` against git to list exactly what D48 changed in the 7 modified skills.
- I did not read `PROJECT_VISION.md`, `CONTENT_IDENTITY.md` or `CHANNEL_POSITIONING.md` beyond their openings and keyword counts.

---

## 6. Size and load

### Takeaway

To make one visual decision the visual-spec skill asks an agent to hold about 10,000 lines (roughly 717 KB) before it reaches a family selector or a dossier, and none of that text covers how to treat a generated still. Ten doctrine-folder files are read by no skill, context file or code, and the two documents written this week for exactly this decision (`VISUAL_TOOLBOX.md`, `VISUAL_QA.md`) are read by no skill. Four registers have lint rules; four have none.

### Cited Findings

**What visual-spec tells an agent to read**

- "Before starting, familiarize yourself with" 12 documents — [skills/visual-spec/SKILL.md](../../skills/visual-spec/SKILL.md) lines 19–33. Sizes (measured):

| Document | Lines | Bytes |
|---|---:|---:|
| remotion-templates/PARALLAX_VISUAL_VOCABULARY.md | 512 | 59,475 |
| remotion-templates/EDITORIAL_FRAME_ARCHITECTURE.md | 286 | 17,832 |
| project/VISUAL_LANGUAGE.md | 587 | 63,891 |
| project/DIRECTING_LANGUAGE.md | 825 | 44,113 |
| project/TEXT_ANIMATION_REGISTER.md | 565 | 32,859 |
| project/HOLD_MOTION_REGISTER.md | 575 | 35,416 |
| project/MATH_RENDER_REGISTER.md | 409 | 25,145 |
| project/TRANSITION_GRAMMAR.md | 601 | 46,849 |
| project/FOOTAGE_SOURCING.md | 212 | 15,543 |
| project/SCRIPT_FORMAT.md | 892 | 65,181 |
| project/AI_VIDEO_PIPELINE.md | 718 | 59,677 |
| tools/ai-video/style-references/PROMPTS.md | 1,019 | 57,649 |
| **Twelve reference docs** | **7,201** | **523,630** |
| + the skill itself | 1,013 | 81,372 |
| + references/template-schemas.md ("Before writing any JSON, read…") | 1,651 | 83,141 |
| + TEMPLATE_FAMILIES.md (the family index) | 405 | 28,975 |
| **Total before a selector or dossier is opened** | **10,270** | **717,118** |

- On top of that: the family selector for the beat (152–225 lines each; 958 for all five), `references/template-picker.md` (1,170 lines, "the deeper-dive reference"), and the template's dossier (79 files, 10,790 lines in all) — [skills/visual-spec/SKILL.md](../../skills/visual-spec/SKILL.md) lines 39–47; sizes measured
- script-draft's "Before You Start" list names nine items plus the picker docs; the fixed documents among them total about 5,526 lines (EDITORIAL_PLAYBOOK 467, SCRIPT_FORMAT 892, VISUAL_LANGUAGE 587, template-picker 1,170, five selectors 958, DIRECTING_LANGUAGE 825, FOOTAGE_SOURCING 212, JIANG 219, CALIBRATION 196) plus the 482-line skill; it adds "consult per `[MG:]` cell — not optional" and a "mandatory" template-selection self-check — [skills/script-draft/SKILL.md](../../skills/script-draft/SKILL.md)
- For a row tagged `[AI-GEN:]`, the relevant part of visual-spec is Step 5 (lines 789–980), which produces a video-model brief. No `SKILL.md`, and no file in `project/` other than `VISUAL_TOOLBOX.md`, mentions `StillFrame` or the manifest `framing` field (measured with grep over `skills/*/SKILL.md`, `project/*.md`, `remotion-templates/*.md`, `AGENTS.md`, `CLAUDE.md`; the hits are `VISUAL_TOOLBOX.md` and the two `CLAUDE.md` files). `tools/ai-video/style-references/PROMPTS.md` was not included in that grep
- `CLAUDE.md`'s "Key documents" list says "Read these when the task requires them" and names 20 documents; `VISUAL_TOOLBOX.md` and `VISUAL_QA.md` are not among them (VISUAL_QA is linked from the Shipped entry) — [CLAUDE.md](../../CLAUDE.md)

**Documents written but not read by any skill, context file or code**

- Reference count for each `project/*.md` across (a) the 25 `SKILL.md` files, (b) the three context files, (c) code under `tools/`, `scripts/`, `remotion-templates/scripts|src/`, `.githooks/` (measured with grep on the file name):
  - Zero in all three: `3D_RECREATION_FINDINGS`, `BACKLOG`, `BACKUP`, `CAMERA_CONSOLIDATION_REVIEW`, `CAMERA_REVIEW_PASS_2`, `EDITORIAL_AUDIT_MAY_2026`, `ENGINEERING_POLISH_AUDIT_2026-05-16`, `FINAL_POLISH_PASS_2026-05-16`, `HOLD_MOTION_AUDIT_PHASE0`, `PIPELINE_ALIGNMENT_AUDIT_2026-05-16` (10 files; some are linked from other documents, e.g. BACKLOG from PRODUCTION_PIPELINE)
  - Zero skills, but named in a context file: `DECISIONS` (3 context mentions), `PACING_REGISTER` (2), `VISUAL_QA` (2), `CHANNEL_POSITIONING` (1), `CAMERA_CONSOLIDATION_RESEARCH` (1)
  - Zero skills and zero context, named only in code comments: `VISUAL_TOOLBOX` (1), `SOUNDSCAPE_REGISTER` (4), `MOTION_DIRECTOR_SPEC` (1), `ORACLE_TRACK` (1), `REMOTION_MOTION_LAYER_ROADMAP` (3)
  - Most-read: `SCRIPT_FORMAT` (8 skills), `CONTENT_IDENTITY` (7), `TRANSITION_GRAMMAR` (5), `VISUAL_LANGUAGE` (5), `IDEAS` (4), `SEO_KEYWORDS` (4)
- `analysis/` (32 files) and `reports/` (2 files) are referenced by one skill (angle-memo) (measured)
- `project/visual-identity/` (50 text files modified this week) is referenced by no skill or context file (measured)
- The measured-QA tool is described in `AGENTS.md` and `VISUAL_QA.md`; the two QA skills (render-qa 568 lines, visual-qa 155 lines) do not mention `qa:episode` (measured)

**Lint coverage by register**

| Register or rule set | Lint rules found | Where |
|---|---|---|
| Transition grammar | M-TRANSITION-DEPRECATED, -IRIS-CHART, -IRIS-OVERUSE, -IRIS-RETIRED, -DISSOLVE-CREEP, -COLOR-WASH-TOKEN; M-OVERLAP; S-DIR-DEPRECATED, S-DIR-IRIS-OVERUSE, S-DIR-IRIS-RETIRED, S-DIR-COLOR-WASH | `manifest_lint.py`, `script_lint.py` |
| Text animation | M-TEXT-ANIM; `missing-direction-wiring`; `audit-direction-fields.mjs --strict` | `manifest_lint.py`, `lint-conventions.mjs` |
| Hold motion | M-DRIFT-DEFAULT; `nested-ken-burns`, `missing-composition-animation` | `manifest_lint.py`, `lint-conventions.mjs` |
| Math rendering | M-MATH-VALID, M-MATH-COLOR, M-MATH-LENGTH; `no-katex-font-override` | `lint-math-formulas.mjs`, `lint-conventions.mjs` |
| Per-element reveal (POLISH D17), music (D18) | M-SYNC-MISSING, M-SYNC-COUNT, M-SYNC; M-D18, M-CROSSFADE, M-CUE | `manifest_lint.py` |
| Pacing | S-PACE-INVALID (validity of the token only) | `script_lint.py` |
| Mode balance | S-MG-RUN | `script_lint.py` |
| Counterfactual register | none found | — |
| Asset-generation register | none found | — |
| Soundscape register | none found in `tools/lint/`; M-CUE checks cue enums | — |
| Visual QA | no lint rule; measured by `qa-episode.mjs` on demand, not in `lint.sh` | — |
| Visual toolbox / still treatment | none | — |
| Editorial playbook VIS rules | none found for VIS-01 shares, VIS-12 labels | — |

(rule IDs measured by grep in [tools/lint/](../../tools/lint/) and [remotion-templates/scripts/](../../remotion-templates/scripts/))

- QA already measures the two things the catalogue is aimed at: "Still reused > 2 uses", "Same template in a row ≥ 3", and the Components split with its "camera move only" row; the stills report calls that row "the measure of whether the step did anything" — [project/VISUAL_QA.md](../../project/VISUAL_QA.md); [reports/AI stills beyond Ken Burns.md](../../reports/AI%20stills%20beyond%20Ken%20Burns.md) line 361

### Inferences

- At roughly four bytes per token, the 717 KB that visual-spec front-loads is on the order of 180,000 tokens. That is my arithmetic, not a measurement, and whether a session reads all of it or skims is not recorded anywhere.
- Adding the catalogue (331 lines, 37 KB) to visual-spec's reference list in the house style would add about 5% to a load that already contains nothing about stills; replacing the stale AI-video entries would shrink it (AI_VIDEO_PIPELINE and PROMPTS.md together are 1,737 lines, 117 KB).
- The read-by-nobody set is mostly dated audit and review snapshots. They are records of a pass, not rules, so their being unread costs nothing; the two that are rules-in-waiting and unread are `VISUAL_TOOLBOX.md` and `MOTION_DIRECTOR_SPEC.md`.
- Registers with lint (transitions, text animation, hold motion, math) are the ones whose vocabulary became a schema enum. Registers without lint (counterfactual, asset generation, soundscape, pacing beyond token validity) are prose plus skill instructions. The house precedent for "enforced" is therefore "has an enum".
- The script format's unit is the row and the catalogue's unit is "what the sentence is doing"; the 35-row script-move table is already in the shape a per-row chooser would take, and it is 35 rows long against thousands of lines for the template choosers.

### Gaps

- No file records which documents a session actually opened, so "read by no skill" is the strongest statement available; real reading behaviour is unknown.
- Token figures are estimates from byte counts.
- I did not check `references/template-picker.json` or whether any tool consumes it.

---

## 7. For each kind of new item: what adoption would touch, and the smallest step short of it

### Takeaway

Under the house pattern a technique, a component, a tool, a finding and a rule each have a different footprint, from one row in one file to thirty-plus files. The table below lays out, for each kind, the full footprint by reference to the measured precedents in §2 and the smallest step that leaves a usable trace. No option is recommended here.

### Cited Findings

**Precedents that set the scale** (all from §2 and §4)

- A full register: 20–43 files, 2,500–4,000 inserted lines — git history, §2
- A new manifest-level template: 4 files in its folder + "all 5 registration files" + dossier + selector/family entry + visual-spec + 2–3 test tables + 1–2 catalog fixtures, about 15–18 files — [CLAUDE.md](../../CLAUDE.md) "Shipped May 20, 2026"; [remotion-templates/CLAUDE.md](../../remotion-templates/CLAUDE.md)
- A new manifest field with its component and no script vocabulary (`framing` + `StillFrame`, 11 Oct): component, test, schema definition, `FullEpisode.tsx`, the episode manifest, two context-file lines — about 7 files; it has no directive, no generator support, no lint, no skill text (measured with grep, §3)
- A new script directive end to end (`over(previous)`, 10 Oct): DIRECTING_LANGUAGE, SCRIPT_FORMAT, TRANSITION_GRAMMAR, generator + test, `resolveSeams` + test, `FullEpisode`, schema, three or four skills, `CLAUDE.md` — about 14–16 files (approximate; counted by grep, §2, and shared with the iris retirement done in the same pass)
- A playbook rule (VIS-12, 11 Oct): one section in one file, with the approval recorded in its Source line; the playbook has a "Pending Rules" table whose stated process is one row per candidate, reviewed by Tiger — [episodes/EDITORIAL_PLAYBOOK.md](../../episodes/EDITORIAL_PLAYBOOK.md)
- A decision (D48, D49): one entry in `DECISIONS.md` with Context / Decision / Open / Scope, the Scope line listing the files changed — [project/DECISIONS.md](../../project/DECISIONS.md)
- A tool (`retime_manifest.py`): the script, a test file, an `AGENTS.md` line, a `CLAUDE.md` line, a `PRODUCTION_PIPELINE.md` paragraph, a decision entry — 6 files
- A measured standard (`VISUAL_QA.md` + `qa-episode.mjs`): one doctrine page, one script, an npm script, two support files (`QaProbe.tsx`, `qaMode.ts`), `data-qa-role` attributes on chrome components, `AGENTS.md` and `CLAUDE.md` lines; no skill, no lint — [project/VISUAL_QA.md](../../project/VISUAL_QA.md)

**Options by kind of item**

| Kind of item | What exists now | Full adoption under the house pattern would touch | Smallest useful step short of that |
|---|---|---|---|
| **A technique in the catalogue** (70 rows) | A row in [project/VISUAL_TOOLBOX.md](../../project/VISUAL_TOOLBOX.md) with reel timestamp, needs, cost, first read, empty Verdict | As a register: retitle or split the doc into a `project/*_REGISTER.md`; a POLISH D-rule; a `_direction` or manifest enum naming the techniques; a `DIR:` directive in DIRECTING_LANGUAGE + SCRIPT_FORMAT; generator + test; an `M-*` lint (+ test); a showcase composition + Root.tsx; visual-spec, script-draft, visual-concept, script-audit skill text; `CLAUDE.md` + `AGENTS.md`; and a component per technique (next row). Precedent: 20–43 files for the register shell, before any component | (a) Fill the Verdict column for the rows Tiger has an opinion on: 1 file. (b) One line in `CLAUDE.md` "Key documents" pointing to the catalogue: 1 file. (c) For techniques in the "expressible today" group of §3, write them into the hand-wired manifest as extra segments: 1 file per episode, no code. (d) One paragraph in script-draft and visual-concept saying "for `[AI-GEN:]` rows, consult the script-move table": 2 files |
| **A reusable component in experiments** (`StillShots`, `Panel`, `Crop`, `quadToQuad`, `spotlight`, `travelEase`/`panoCamera`, `CrowdLayers`) | Exported or private in `src/experiments/StillsReel*.tsx`; asset path fixed to `stills-test`; shot data as inline TypeScript with render callbacks; per-picture pixel constants | As a manifest-level template: new folder (4 files) with a Zod schema that turns `Shot`/`ShotState`/overlays into JSON (overlays are functions today, so a declarative overlay vocabulary is needed); `templateRegistry.ts`, `templateSchemas.ts`, `Root.tsx`, manifest schema enum, `TEMPLATE_AUDIO_MAP`; dossier; a selector entry (no stills selector exists, so a sixth selector or a TYPOGRAPHY entry); `template-schemas.md`; visual-spec; `templates.test.ts`, coverage tables; a catalog fixture; per-still measurement data (card rectangles, quads, cut-out strips) needs a home, e.g. a sidecar JSON per still. About 15–18 files per template. As an extension of `StillFrame` instead (states, overlay): `StillFrame.tsx` + test, `stillFraming` schema, `FullEpisode.tsx`, both `CLAUDE.md` files — about 6 files, no registry changes | (a) Move the generic pieces out of the reel files into `src/components/` (or one `src/experiments/shared.ts`) with the asset path as a prop, leaving the reels importing them: 2–7 files, no schema. (b) Leave the code where it is and add a header index of what is reusable: 1 file. (c) Use an experiment composition directly as an episode-specific segment component in `AiCareMotivesFull.tsx`, outside the manifest: 1–2 files, and it will not re-time |
| **A generation or edit tool** (`fal_edit.py`, `fal_i2v.py`) | Working scripts with docstrings and sidecars; `fal_i2v.py` in `CLAUDE.md` only; `fal_edit.py` in neither context file; no tests; sidecars for clips gitignored; prompts under `episodes/<slug>/prompts/edit|i2v/` | `AGENTS.md` "Visual production" entry; `CLAUDE.md`; tests (`test_fal_*.py`); rewrite of ASSET_GENERATION_REGISTER tool table and "no programmatic API" line; AI_VIDEO_PIPELINE and GENERATION_WORKFLOW tool picks; October prompting rules into CHAINED_STILL_LESSONS (the file `fal_i2v.py` already points to); asset-brief skill (so it writes `prompts/edit/*.txt` and `prompts/i2v/*.txt`, not Kling/Hailuo paste documents); ground-motion skill; visual-spec Step 5; shot-list schema keys for states and anchors; `EPISODE_STRUCTURE.md` / `EPISODE_TEMPLATE/` for `keyframes/`, `clips-i2v/`, `prompts/edit`, `prompts/i2v`; `.gitignore` decision on sidecars; `/log-cost` and `COST_LOG.md`; MOTION_DIRECTOR_SPEC. About 12–16 files | (a) Two lines in `AGENTS.md` (one per tool): 1 file. (b) A dated "October 2026, MiniMax H3 Max" section appended to CHAINED_STILL_LESSONS holding the seven prompting rules from the landscape analysis: 1 file. (c) Un-ignore `clips-i2v/*.json` so the prompt and cost record is versionable: 1 file. (d) Correct line 24 of ASSET_GENERATION_REGISTER: 1 file |
| **A research finding** (16 analysis files, 2 reports) | Prose in `analysis/` and `reports/`, each with a "Bottom line"; four linked from `CLAUDE.md`; some already acted on (seams, VIS-12, QA floor, audio plan) and some only bannered (AUDIO_DESIGN "Under review") | Per finding, the house route is: a decision entry (DECISIONS) or playbook rule; edit of the doctrine doc it contradicts (e.g. AUDIO_DESIGN body + audio-spec skill + `check_audio_cues.py` quotas for the sound research; D3 for the trust research; VISUAL_LANGUAGE share targets + VIS-01 + SCRIPT_FORMAT + visual-spec for the 45.6% figure; `asset-source` + `source.py` + shot-list schema + FOOTAGE_SOURCING for museum sources); then lint where a number is involved. 3–8 files per finding; the two reports alone name 19 doctrine splits | (a) One index file listing each analysis file with its bottom line and status (acted on / bannered / parked): 1 new file. (b) A dated banner on each contradicted doctrine doc, as was done for AUDIO_DESIGN and GENERATION_WORKFLOW: 1 line per file. (c) One DECISIONS entry per ruling Tiger actually makes (D3, parallax, AI share): 1 file each |
| **A production rule** (the 6 script rules and 6 picture rules in the catalogue; "a sheet beats a chain"; "states by edit"; the faults table) | Lists inside `VISUAL_TOOLBOX.md`; none has a rule ID; none approved | Playbook rules VIS-13 onward with Pattern / Anti-pattern / Evidence / Source (the VIS-12 shape), approved by Tiger; script rules into script-draft and script-audit lens 6 (`skills/script-audit/references/lens-6-visual-layer.md`); picture rules into ASSET_GENERATION_REGISTER "still principles" (which currently says the opposite on poses) and asset-brief; mechanical ones into `script_lint.py` (an `S-*` rule + test) or `qa-episode.mjs` (a new episode-level check); the still-reuse threshold in VISUAL_QA and `qa-episode.mjs`. About 6–10 files | (a) Add them as candidate rows in the playbook's "Pending Rules" table, which is the documented lane for unapproved rules: 1 file. (b) Leave them in the catalogue and cite the catalogue section from script-draft: 1 file. (c) Adjust the one QA threshold the catalogue contradicts (still reuse) with a note: 2 files |

Sources for the "what exists now" column: §3 and §4 above. Sources for footprints: §2 precedents and the files named in each cell.

**Facts that bear on any of these options**

- The memory instruction in force: "It is not a go-ahead to wire any technique into an episode, a skill or a pipeline doc; ask before doing that" — memory file `project_visual_toolbox_exploration.md`
- The standing feedback: "Prefer moving the episode through the pipeline over further tooling improvements… Offer tooling work only when it directly unblocks the episode" — memory file `feedback_skip_over_testing.md`
- What the episode still lacks, per its status row: "read-aloud, screen recording, audio sourcing, narration, render"; no audio file of any kind exists — [CLAUDE.md](../../CLAUDE.md); [analysis/beyond-remotion-tools-research-2026-10-11.md](../../analysis/beyond-remotion-tools-research-2026-10-11.md)
- The catalogue's own remaining step is not systemization: "doing these with your voice and deciding which to keep" — [project/VISUAL_TOOLBOX.md](../../project/VISUAL_TOOLBOX.md)
- The catalogue says every cut in the reels "follow[s] a word-count estimate" and the voice test found the estimate wrong by 12–40% (2.8–3.5 against 2.5 words a second) — [project/VISUAL_TOOLBOX.md](../../project/VISUAL_TOOLBOX.md)
- Every technique has one take on one episode's art; seven faults are fixed, one is not, two await new pictures, one technique failed — [project/VISUAL_TOOLBOX.md](../../project/VISUAL_TOOLBOX.md)
- The 10 Oct report's stated lesson: "fix defaults before writing rules" and "harden only the templates the episode uses, so the library improves at the pace of shipping" — [reports/Remotion polish and AI tooling.md](../../reports/Remotion%20polish%20and%20AI%20tooling.md)
- The 11 Oct report's stated lesson: the findings argue "for writing them into one current doctrine page that supersedes the May documents" — [reports/AI stills beyond Ken Burns.md](../../reports/AI%20stills%20beyond%20Ken%20Burns.md)
- The visual identity itself is under exploration (13 directions, "no treatment has been selected for production"), and per-picture measurements in the experiments (card rectangles, screen corners, cut-out strips) belong to the current twelve stills — [project/visual-identity/2026-10-10/README.md](../../project/visual-identity/2026-10-10/README.md); [remotion-templates/src/experiments/StillsReel2.tsx](../../remotion-templates/src/experiments/StillsReel2.tsx)
- D48 leaves open "default visual vocabulary for argument-driven episodes", which is the question the catalogue addresses — [project/DECISIONS.md](../../project/DECISIONS.md)
- The whole working tree since about 19 May is uncommitted (922 paths), so any adoption step today lands on top of an unversioned base and cannot be reviewed or reverted as a unit — git status, §4
- Other sessions may be editing shared files: `CLAUDE.md` changed on disk during this audit window relative to the copy loaded at session start (the "Engine changes, Oct 11" sub-list) — [CLAUDE.md](../../CLAUDE.md) (mtime 11 Oct 16:20)

### Inferences

- The five kinds differ by an order of magnitude in cost: a rule or decision is 1 file; a tool is about 6; a manifest field with a component is about 7; a directive is about 15; a template is about 15–18; a register is 20–43. Treating all 70 techniques as one register plus templates would be several times the size of the largest thing the repo has shipped; treating them as a chooser table plus a handful of data shapes (§3: second registered source, cut-out layers, four-corner quad, panel layout) is closer to one register.
- The smallest steps in the table are all documentation-layer or manifest-layer and touch no code; the first step that requires code is moving generic pieces out of the reel files.
- Several "smallest steps" also remove staleness found in §5 (the API line, the prompting rules, the QA reuse threshold), so some adoption work and some cleanup are the same edit.
- Because the experiment components take render callbacks and pixel constants, making them manifest-driven requires inventing a declarative vocabulary for overlays and per-still measurements; that design work is not captured by a file count.
- Any step that edits skills has to choose which copy is authoritative, given the ten divergent plugin copies.

### Gaps

- File counts for full adoption are estimates built from the precedents; no one has scoped a stills register, so the true figure is unknown.
- I found no statement from Tiger about how much systemization he wants or when; the two memory entries pull in different directions and the reconciliation in the memory file is the session's own reading.
- Which techniques Tiger wants in the first episode, if any, is not recorded.
- Whether the next episode will reuse this illustration style (and therefore these measurements and prompts) is undecided in the files I read.
- I did not assess effort in hours for any option.
