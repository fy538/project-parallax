# Review of the AI alignment deep-research report

23 September 2026, America/New_York. Companion editorial review of the [saved report](../project/research/2026-09-24-ai-alignment-landscape-deep-research.md), which is a byte-for-byte copy of the supplied `deep-research-report (30).md` (SHA-256 `78677f3293e34d3c21780b4b1ab06dd69312653866d190bff4daebd4085f987b`). The original file was not edited. This is a **targeted source and editorial audit**, not a line-by-line verification of all 181 lines.

## Assessment

The report is a strong **backstage map** of alignment research. Its most useful distinction is between (a) methods that shape model behavior, (b) methods that test or inspect behavior, (c) controls that limit harmful actions even when a model is not trusted, and (d) human institutions that decide what to permit. It repeatedly distinguishes controlled demonstrations from claims about ordinary deployed systems. That is the right guardrail for a series built around fictional machine thought experiments.

It is not yet a script-ready research package. Most citations in the overview and tables are opaque `cite...` markers: this file has **96 such citation clusters and only 15 ordinary web links**, concentrated in its evidence ledger. A reader opening the Markdown cannot follow those markers. Each sentence promoted into narration needs its own direct source URL and exact-support check. The report also says **24 September 2026 in America/New_York**, whereas the local New York date at this review was **23 September 2026**. Preserve the submitted date as provenance, but do not use it as proof that it includes research from a future day.

## What I checked against primary sources

| Report claim | Check | Editorial implication |
|---|---|
| The 2016 “Concrete Problems” paper organizes five practical accident-risk problems, including wrong objectives, costly supervision, exploration and distribution shift. | Supported by the [original paper’s abstract](https://arxiv.org/abs/1606.06565). | A foundational research agenda, not evidence that a specific modern chatbot exhibited the report’s fictional forest or office behavior. |
| InstructGPT used demonstrations, output rankings and RLHF; a 1.3B model was preferred over a 175B GPT-3 baseline on its evaluated prompt distribution. | Supported by the [InstructGPT paper](https://arxiv.org/abs/2203.02155). | State the comparison with its evaluation scope. It does not mean smaller models are generally better or that RLHF resolved “human values.” |
| Three of four teams found an intentionally planted hidden objective. | Supported by the [paper](https://arxiv.org/abs/2503.10965). Anthropic’s [research account](https://www.anthropic.com/research/auditing-hidden-objectives) adds an important detail: the unsuccessful team lacked training-data access, and the authors caution against broad conclusions from four teams. | Good later-season material about what an audit can reveal. Do not retell as discovery of naturally arising secret motives in a deployed model. |
| Adaptive attacks evaded monitor-based AI-control protocols on two benchmarks. | Supported by the [2025 preprint](https://arxiv.org/abs/2510.09462). | Evidence about tested protocols and threat models, not a general finding that all possible control fails. |
| Claude’s *expressed* values varied across models and languages in a 2026 study. | Supported by [Anthropic’s study](https://www.anthropic.com/research/claude-values-models-languages/). Its four axes explain **15%** of the controlled variation; the authors do not claim to have established intrinsic values, causal origins, user harms, or what each language community wants. | Potentially rich human-values episode, provided the wording stays “expressed values in this analysis,” not “the model believes different moral truths in different languages.” |
| Google DeepMind added “Tracked Capability Levels” to its Frontier Safety Framework on 17 April 2026. | Supported by [DeepMind’s framework update](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/). | An example of company governance becoming more granular, not a universal safety standard. |

These spot checks support the report’s broad caution and several key facts. They do **not** verify every 2025–2026 claim, publication date, framework revision, numeric result, or comparative maturity judgment. The direct-link work remains necessary for any selected episode.

## Where the report needs editorial resistance

1. **It drifts toward a safety-research syllabus.** The five proposed episodes move from an intuitive objective problem to interpretability, weak-to-strong supervision and AI control. Those are important subjects, but the [original shared thought](https://chatgpt.com/share/6ab30729-7010-83e9-b97d-1301e27bd22c) was an imagined *intellectual civilization* whose questions illuminate human assumptions. The public series should organize around viewer questions and recurring fictional situations; research methods are grounding, not the plot.
2. **The timeline is a useful map, not a single causal ladder.** Preference learning, constitutions, interpretability, governance and labor questions developed partly in parallel and for different purposes. The report’s “one missing layer exposed the next” paragraph is an elegant synthesis, but it should not become a literal historical claim that each research community waited for the previous one to fail.
3. **Some language anthropomorphizes the system after warning against anthropomorphism.** “Alignment training tries to make the system *want* ... the intended target” blurs observed behavior, internal objective and felt desire. For narration, say “training tries to steer behavior toward a target.” Reserve “want” for a clearly marked fictional machine voice or for a carefully defined research hypothesis.
4. **The fictional vignettes need an empirical bridge.** The office that cancels breaks and the forest that replants trees are inventions. [DeepMind’s specification-gaming account](https://deepmind.google/blog/specification-gaming-the-flip-side-of-ai-ingenuity/) supplies observed research examples, while the fictional scene makes the human point. Put both in the source ledger and label them differently. A research-agenda paper alone does not substantiate an observed mishap.
5. **“Whose values?” is present, but affected people need more than one row.** The report names evaluators, users, public participants and governments, yet its core evidence is concentrated in technical papers and major lab publications. For an ethics episode, add original worker accounts and research on affected communities, as the [three-topic sprint](topic-sprints/2026-09-23-ai-philosophy-three-way.md) begins to do. Do not imply labelers’ preferences are the only excluded perspective.
6. **The maturity column can be misread as a scorecard.** “Established,” “promising,” and “research-stage” are the report author’s synthesis across different types of evidence. A deployed practice, an experimental technique, and a governance pledge cannot be ranked on one axis without specifying the property being judged. Keep the table backstage; translate only the distinction the episode needs.

## Implications for the playlist

I would **keep Episode 1’s concrete objective failure**, because both the report and the existing [What We Count pilot](../remotion-templates/src/pilots/WhatWeCount/README.md) support it. But I would consider moving **“Whose answer counts as good?” into Episode 2**, ahead of the proposed doubt/map episode in the [current series plan](ai-philosophy-series-plan-2026-09-23.md). That follows the audience’s natural objection: “Fine, let humans judge it—*which* humans?” It also gets to the channel’s distinctive human/AI ethics intersection quickly without requiring machine selfhood.

The provisional progression becomes:

| Step | Public question | Backstage research anchor | Technical burden |
|---|---|---|---|
| 1 | It did what we asked. Why did it fail? | Specification gaming and objective misspecification | Low |
| 2 | Who gets to decide what counts as good? | Human feedback, constitutions, value pluralism, data workers | Low–moderate |
| 3 | How would we know the answer is wrong—or the explanation misleading? | Evaluation, uncertainty, limited interpretability | Moderate; choose one, not all three, for the actual episode |
| 4 | If two successors remember the same promise, who is responsible? | Identity/promise philosophy, kept explicitly speculative | Moderate; a later chapter, not an alignment benchmark |

This is a **proposed revision**, not a silent replacement of the existing plan. The first two questions form the smallest plausible mini-arc. They can test audience interest, narration burden and the reusable visual language before we commit to Episodes 3–4 or to the 7–15 minute technical topics in the report.

## Smallest useful next research step

Create an Episode 1 claim sheet with only: (1) the fictional forest rule, (2) one observed specification-gaming example from its original source, (3) one sentence explaining why human feedback helps but does not specify everyone’s values, and (4) the human mirror. Attach direct URLs to every factual sentence. Then write a 4–6 minute outline and a 60–90 second spoken proof. If that cannot feel clear and interesting without defining RLHF or introducing a fictional consciousness, the concept still needs simplification.
