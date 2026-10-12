Parallax folder review — September 22, 2026
=========================================

Parallax has a well-developed editorial identity and a substantial, working production toolkit. The main weakness is the handoff between research, the latest script, visual data, and the rendered episode. Several components pass their own checks while disagreeing about what the current episode actually is.

This review covered the project guidance, core strategy and production documents, all three canonical episode scripts, associated research and review material, pipeline state, manifests, asset registries, key assembly/render code, and representative visual assets. I ran static checks and the Python and TypeScript unit suites. This is a local repository assessment: historical and current-affairs claims were not independently reverified against external sources, and I did not render or watch a complete episode. Existing production files were left unchanged.

**What the project is trying to build**

The central product is a way of thinking about geopolitics: reveal a structural connection across history, philosophy, and contemporary events, then identify its limits. “Bounded analogy” is the most useful statement of the channel's identity. Its value comes from showing both what an analogy reveals and what it cannot establish.

The voice is conversational and investigative. The viewer should feel involved in a discovery. The “backstage maximum, frontstage confident” doctrine is sensible when the confidence remains bounded by what the research supports. Human narration, English-first release, a 5–10 hour weekly time budget, and a reusable visual vocabulary are central operating constraints.

The format repertoire is broader than the launch needs: Detective, Philosopher's Lens, Dialectic, Time Collapse, Wargame, Advisor, Shorts, and forecast retrospectives. The concept registry, callbacks, and prediction tracking could make a published catalog accumulate value. At present, the publication registry is empty and the learning log contains no audience results. Time-per-episode, retention, and growth targets remain planning assumptions.

References: [project vision](/Users/feihuyan/project-parallax/project/PROJECT_VISION.md), [content identity](/Users/feihuyan/project-parallax/project/CONTENT_IDENTITY.md), [editorial playbook](/Users/feihuyan/project-parallax/episodes/EDITORIAL_PLAYBOOK.md), [publication registry](/Users/feihuyan/project-parallax/episodes/publish-order.json), [learning log](/Users/feihuyan/project-parallax/episodes/LEARNING_LOG.md).

**How the folder fits together**

| Location | Role | What to treat as authoritative |
|---|---|---|
| `AGENTS.md`, `CLAUDE.md` | Operating instructions and project orientation | Conventions are useful; embedded progress summaries need checking |
| `project/` | Strategy, research method, editorial and visual rules, decisions, experiments | Read newer decisions alongside older doctrine |
| `episodes/<slug>/` | Current script, production specification, research, audits, assets, release material | `script.md` and the canonical layout in `EPISODE_STRUCTURE.md` |
| `episodes/pipeline-state.json` | Declared lifecycle state and dates | Canonical state declaration, not proof of production readiness |
| `remotion-templates/data/episodes/` | Template inputs and timed assembly manifests | What the renderer will actually consume |
| `remotion-templates/src/` | React templates, animation, maps, compositing, audio | Runtime behavior and Zod validation |
| `tools/` | Python sourcing, assembly, narration, validation, publishing and tracking tools | CLI implementation takes precedence over stale command examples |
| `skills/` | 25 version-controlled production workflows | Stage-specific instructions; not a fully orchestrated automatic pipeline |
| `data/` | Shared schemas, 35 concepts, forecasts, personas and signal sources | Cross-episode structured records |
| `scripts/`, `.githooks/`, `.github/` | Local entry points, commit checks and CI | Effective only when invocation and configuration match |

The intended flow is research → angle → two-column script → editorial/visual review → template data and asset sourcing → assembly → narration alignment → render/post-production → publish → retrospective. Newer narration guidance puts a scratch recording before final timing, while some older pipeline diagrams still place narration after rendering.

The assembly manifest is the central technical contract: it combines beat timing, foreground/background segments, template inputs, media references, transitions and audio. `FullEpisode.tsx` implements that contract and merges template direction, segment direction, and narration sync points. The current component registry contains **87 template identifiers**; that includes aliases/variants, not 87 unrelated rendering engines.

The design system is unusually specific: warm Meridian colors, IBM Plex typography, editorial chart framing, analytical/atmospheric/grounding registers, and rules for reveal timing, motion during holds, transitions and mathematics. The inspected RAND-office and grid-landscape stills have a coherent faceted, textured style. The sampled chart baseline uses a restrained editorial layout. These are meaningful assets, although stills alone cannot establish pacing or finished-video quality.

References: [folder convention](/Users/feihuyan/project-parallax/episodes/EPISODE_STRUCTURE.md), [manifest generator](/Users/feihuyan/project-parallax/tools/assembly/generate_manifest.py), [full-episode renderer](/Users/feihuyan/project-parallax/remotion-templates/src/templates/Episodes/FullEpisode.tsx), [brand](/Users/feihuyan/project-parallax/remotion-templates/BRAND.md).

**The three episodes**

| Episode | Editorial assessment | Verified production state |
|---|---|---|
| `prisoners-dilemma` | Clearest expression of the channel's identity. “The Wrong Game,” the move from defection to coordination, and the final two-equilibrium motif form a coherent arc. Several central statements exceed the qualifications in its own research. | Declared RENDER READY. Manifest: 121 segments, 893.8 seconds, estimate mode, 46 distinct data-file references. Registry: 33/33 still paths and 16/27 video paths present. Preflight: 31 resolved references, one pending, zero broken paths. Visual spec exists. No narration WAV found in its episode tree; manifest has no narration file. |
| `silicon-trap` | Strong material tension: technical success versus strategic dependence. Human details and the supply-chain story make an abstract topic tangible. The chess/go framing and fast/slow AI ending need clear limits so metaphors and scenarios do not become deterministic explanations. | Declared RENDER READY. Manifest: 99 segments, 812.8 seconds, estimate mode, 25 distinct data-file references. Preflight: 21 pending references. Registry: 27 assets planned; dashboard reports missing stills and pending clips. No narration WAV found in its episode tree; manifest has no narration file. |
| `blockades-leak` | Useful collective-action question, but overburdened with parallel cases and three named concepts. “Leakage occurs” and “controls fail” are different claims; the script itself credits COCOM with delay. | Declared INCUBATING. Research, script and visual specification exist, but no assembly manifest. Its retrospective explicitly identifies the research stage as a simulation. Earlier artifacts should not be treated as evidence that the episode passed a current production gate. |

The two “RENDER READY” labels describe an intermediate state. They do not imply publishable audio, completed sourcing, current timing, or a verified full master. Pending-reference counts also differ from registry clip counts: a registry tracks intended assets, while preflight only checks what the current manifest references.

The strategic overview still says the launch episode lacks `visual-spec.md`. That is now false: the specification was backfilled May 21 and revised May 24 to drop morphs for the first episode. Its own text nevertheless retains references to retired shots. The canonical launch script is v6.3, while the canonical script audit and review package identify v4. Later comparison/revision material exists, but those filenames alone do not certify the current script.

References: [launch script](/Users/feihuyan/project-parallax/episodes/prisoners-dilemma/script.md), [launch visual specification](/Users/feihuyan/project-parallax/episodes/prisoners-dilemma/visual-spec.md), [Silicon Trap script](/Users/feihuyan/project-parallax/episodes/silicon-trap/script.md), [Blockades script](/Users/feihuyan/project-parallax/episodes/blockades-leak/script.md), [simulation retrospective](/Users/feihuyan/project-parallax/episodes/blockades-leak/development/pipeline-retrospective.md).

**Editorial findings that matter before recording**

1. **The launch script loses an explicit research qualification.** Its research says Nash's objection was substantively correct and warns against presenting the experiment as a clean falsification. The script opens with “It's also wrong,” describes Nash as blaming the players, and repeatedly calls this a failed model. The research's narrower thesis—an abstraction being applied outside its appropriate domain—is stronger than this simplification. The Nash quotation is also marked “verify exact phrasing” in the script's visual column, yet is already authored as an attributed quote in JSON. Resolve the wording before recording or rendering the quote card. Evidence: [research breakpoints](/Users/feihuyan/project-parallax/episodes/prisoners-dilemma/research/research-pass3.md:46), [script opening](/Users/feihuyan/project-parallax/episodes/prisoners-dilemma/script.md:47), [quote data](/Users/feihuyan/project-parallax/remotion-templates/data/episodes/prisoners-dilemma/kinetic-nash-quote.json).

2. **A conditional mathematical statement becomes unconditional narration.** The research describes the Skyrms transformation with trigger strategies; the script states that an iterated Prisoner's Dilemma is mathematically equivalent to a stag hunt without carrying that restriction. This is a demonstrable difference between the local research and script, independently of a fresh mathematical fact-check. Restore the conditions and ensure the visual expresses the same scope. Evidence: [research](/Users/feihuyan/project-parallax/episodes/prisoners-dilemma/research/research-pass3.md:134), [script Beat 4](/Users/feihuyan/project-parallax/episodes/prisoners-dilemma/script.md:194).

3. **Illustrative numbers are presented as a research finding.** `chart-diffusion.json` explicitly calls its theory/empirical ratios illustrative, but its headline says “Theory outpaced evidence — three to one” and its explanatory text makes an across-decades factual claim. The inspected saved baseline displays this prominently. Replace this with sourced quantitative evidence or an unmistakably conceptual illustration. The separate volatility chart also contains precise indexed values without a point-level data provenance trail; it needs verification or explicit schematic treatment. Evidence: [diffusion chart](/Users/feihuyan/project-parallax/remotion-templates/data/episodes/prisoners-dilemma/chart-diffusion.json:38), [volatility chart](/Users/feihuyan/project-parallax/remotion-templates/data/episodes/prisoners-dilemma/chart-vol-smile.json).

4. **Timing claims are not yet grounded in a recording.** The launch script claims a pivot within 15 seconds, but approximately 56 whitespace-delimited words precede it: about 22 seconds at 150 words/minute, or 19 seconds at 180. The opening visual is assigned 14 seconds. Its script targets roughly 17 minutes while the current manifest is 14.9 minutes. These discrepancies should be resolved by an actual read, not by the script's self-assessment checkmarks.

5. **Blockades needs substantive revision before promotion.** In the fishing section it says “OPEC members” exceeded quotas, then discusses fish—a direct cross-case editing error. Several verification tags are malformed. Its script, viability document and research brief differ in how strongly they claim inevitability. A useful revision would define success as delay, cost, scale or denial, then test how leakage changes that metric. Evidence: [fishing passage](/Users/feihuyan/project-parallax/episodes/blockades-leak/script.md:82).

6. **Time-sensitive claims and forecasts need a new pre-publication check.** The active content was developed in May, while this review is in September. In particular, Silicon Trap relies on precise yields, costs, export-control changes and reported training outcomes; the launch episode includes a December 2026 forecast. This review establishes their presence and age, not whether the underlying claims are currently correct. Publication should preserve an explicit prediction date and resolution criterion.

**Verified production and tooling gaps**

1. **Canonical script changes escape invalidation.** The dependency graph still matches `episodes/{slug}/script-production.md`, while the current convention is `script.md`. Running `invalidate.py --paths episodes/prisoners-dilemma/script.md --json --soft` returned zero invalidations. The graph also retains old locations for several derived documents. This is a functional gap in the intended protection against stale artifacts. Evidence: [dependency graph](/Users/feihuyan/project-parallax/tools/assembly/dependency-graph.json:7).

2. **The launch manifest is textually stale, not just older by timestamp.** Its opening narration reference begins “The Prisoner's Dilemma is the most influential framework…”. The current script begins “Every textbook on international relations…”. It also retains the old opening template sequence. The cross-check reports 16 shot-list IDs not referenced by the launch manifest; Silicon Trap has eight manifest shot IDs absent from its shot list. Some data-file-reference warnings are expected because scripts use inline specifications or brace shorthand, so not every warning is a defect.

3. **Documented recovery commands do not match the CLI.** `python3 tools/assembly/generate_manifest.py prisoners-dilemma` exits with missing required arguments: the implementation needs `--script`, `--episode` and `--output`. For this episode, the episode-specific config also matters. `node remotion-templates/scripts/render-episode.mjs prisoners-dilemma` exits with only `silicon-trap` listed as available. That script renders a clip sequence, and only Silicon Trap has a sequence JSON. The separate `prisoners-dilemma-full` composition does exist and is registered; this finding concerns the documented wrapper, not the absence of a full-episode renderer. Evidence: [generator arguments](/Users/feihuyan/project-parallax/tools/assembly/generate_manifest.py:2876), [render wrapper](/Users/feihuyan/project-parallax/remotion-templates/scripts/render-episode.mjs:52), [full composition](/Users/feihuyan/project-parallax/remotion-templates/src/templates/Episodes/PrisonersDilemmaFull.tsx).

4. **The tracked commit gate is inactive in this checkout.** `core.hooksPath` points to the repository's `.git/hooks`, which has no `pre-commit`; the maintained hook lives in `.githooks/`. The documented bootstrap has therefore not taken effect in this configuration. I did not change it.

5. **State agreement is weaker than readiness.** State tokens agree across the mirrored tables, so the source-consistency check passes. Their prose, dates and computed health are stale. The validator also suggests promoting Blockades because later-stage files exist, despite the recorded editorial re-gate. File presence cannot settle that decision.

**Validation results**

| Check | Result | Interpretation |
|---|---|---|
| TypeScript `tsc --noEmit` | Passed | Current TS compiles in strict mode |
| `npm run test:unit` | 61 suites, 1,342 tests passed | Includes static episode integrity and registry alignment; no full render |
| Python suite using installed Python 3.13 | 2,096 passed, 9 failed | All nine failures in `test_treat_video.py`; tests expect a string while `build_filter_chain` now returns `(graph, is_complex)` |
| Default `python3` test invocation | Collection blocked | Resolves to Python 3.14.6, missing `requests` and Pillow; installed 3.13 has the needed dependencies |
| Repository JSON validation, also checked under 3.13 | Failed for 3 catalog fixtures | Off-palette values in comparison-pair military budgets and two territory-map fixtures |
| `scripts/lint.sh` | Four failing check groups | Template polish, stale generated shot-list types, stale HTML dashboard, stale Markdown dashboard |
| Manifest doctrine | No errors; 76 warnings | Warnings still need editorial triage |
| Concept registry and state-token consistency | Passed | Structural consistency only |
| Asset preflight | No broken referenced paths; pending assets remain | One pending launch reference, 21 pending Silicon Trap references |

The polish linter flags title-block errors in BarChartRace and SplitFrame, plus 91 warnings. The documentation checker finds two references to the absent TimelineMorph template but runs in non-strict mode, so the aggregator prints that check as passed. Ruff was skipped because it is absent from the default Python environment. The shell lint wrapper also attempts to execute the brand glyph because it appears inside backticks in a double-quoted label.

The Python failures show a test/API contract mismatch; they do not by themselves demonstrate corrupted video output. Likewise, green TypeScript tests establish useful structural confidence but do not validate factual claims, narration quality or the finished viewing experience. Browser visual regression and full-episode rendering were not run.

**What I would prioritize next**

First, take `prisoners-dilemma` through one coherent release path. Resolve the research-to-script qualifications, quotation, and illustrative chart evidence; bring its editorial review up to the accepted script version; then record a scratch read. Reconcile the manifest, shot IDs and asset mappings against that version and recording. Complete the remaining production assets, render the registered full composition, and review the actual audiovisual result before final narration and publication.

In parallel with that narrowly scoped production work, repair the handoff protections: canonical paths in the dependency graph, valid generated commands, the distinction between clip rendering and master rendering, and hook configuration. Address the failing tests and schema/lint drift so the documented checks become dependable again.

Silicon Trap should follow once its time-sensitive evidence and sourcing are refreshed. Blockades should remain an editorial decision rather than advance because a validator found old files. Broader template expansion, orchestration and multilingual work can wait until a completed episode supplies evidence about which steps actually consume time.

The strongest existing asset is the connection between editorial thought and visual form. The most valuable next improvement is preserving that connection across revisions, so the researched argument, spoken script, chart evidence and final render all express the same version of the episode.

**Workspace context**

The checkout was already on `main` with 825 Git status entries, including 346 untracked files, when this review began. Much of the visible state is ongoing work rather than the last commit. I preserved those changes and added only this report. Diagnostic logs were written under `/tmp/parallax-folder-review-*`.
