# A Codex topic sprint for the new Parallax direction

23 September 2026. Research on how to use this local Codex workspace to select an AI/philosophy topic efficiently. This is a proposed pilot workflow, not a change to the canonical episode pipeline.

## Finding

Use Codex for a **bounded editorial decision**, not a giant research report. In one task, compare three questions, inspect the original sources behind their load-bearing claims, challenge each angle, and recommend one 60–90 second proof-of-concept. Only the winner enters the existing episode research and audit pipeline.

The current repo already has useful later-stage machinery: [topic viability](../skills/topic-viability/SKILL.md), [research audit](../skills/research-audit/SKILL.md), [angle memo](../skills/angle-memo/SKILL.md), [visual concept](../skills/visual-concept/SKILL.md), and the source-verification rules in [RESEARCH_WORKFLOW.md](../project/RESEARCH_WORKFLOW.md). But those early gates were written for 15–20 minute geopolitics essays. Topic viability expects a historical parallel and two of the old three pillars; research audit expects multiple cross-domain connections. Those are useful for that format and can be false negatives for a short question about identity, agency, or ethics. The source-support checks should survive the shift; the mandatory historical apparatus should not be imposed on a short pilot.

Codex can work with the local folder and write reviewable artifacts in it; the desktop browser can inspect public pages, while web search can supply current sources. This is documented in the [ChatGPT desktop quickstart](https://learn.chatgpt.com/docs/quickstart) and [browser guide](https://learn.chatgpt.com/docs/browser). OpenAI's recent [guidance on Codex skills and prompts](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra) cautions against accumulating long, overlapping instructions. Start with one scoped task and this brief; create a new skill only after the sprint works repeatedly.

## One task, four passes

| Pass | Codex produces | Human decision / stop rule |
|---|---|---|
| 1. Frame | Three one-sentence viewer questions, the surprising tension, and the **human mirror**: what the AI case makes us notice about ourselves | Reject a question if its payoff is only “AI is powerful/scary,” or it requires a 15-minute setup before the puzzle is clear. |
| 2. Source | A short evidence ledger for each: 1–3 load-bearing claims, direct links to original papers, philosophical texts, official technical material, or firsthand evidence; exact support, limits, date | No quote, number, or named empirical example enters narration without opening the source and checking that precise proposition. Mark missing support explicitly. |
| 3. Challenge | Best counterposition, where the analogy or thought experiment breaks, existing video angles, and a plausible audience misunderstanding | Do not manufacture an “angle gap” from a cursory search. If existing coverage makes the same move well, change the question or choose another. |
| 4. Prove | For the best one or two: a 90-second spoken spine, three visual beats, one change over time, and a rough production estimate using assets/templates already here | Choose one topic to test. Do not generate art or build a new component until its script and visual proposition are understandable on paper. |

For factual research, use original material first: the paper or text being discussed, original experiment or dataset, official documentation, transcript, or first-hand statement. A scholarly review can supply context or disagreement. A YouTube search is a **coverage scan**, not evidence that a claim is true. Keep four kinds of statements distinct in the ledger: established fact, contested interpretation, philosophical argument, and invented thought experiment. The [repo research-audit skill](../skills/research-audit/SKILL.md) already makes the essential distinction between a real citation and a citation that supports the exact sentence.

## Candidate card: one screen, not a dossier

```markdown
### [Working question]
Viewer puzzle: [one sentence]
Human mirror: [what this reveals about human values, identity, judgment, or institutions]
Provisional answer: [one sentence; allowed to change]
Best objection: [one sentence]
Evidence: [1–3 source links and what each directly establishes]
Unknowns: [load-bearing gaps, not a miscellaneous reading list]
Visual argument: [image establishes what situation; Remotion changes what relation/measure]
Existing coverage: [2–3 actual videos/angles, checked as of date]
Effort: [easy / moderate / hard, with the reason]
Decision: [test / research more / park]
```

Use judgment rather than an elaborate weighted score. Two questions can both be promising for different reasons. The decisive tests are: **Does it change how someone sees themselves or a familiar institution? Is the underlying claim supportable? Can a visual change expose the reasoning? Can we make it within the side-gig time budget?** A historical parallel is optional; a bounded analogy or explicit limit is not.

## Initial three-way sprint

These are *candidates*, not researched or approved episode theses:

1. **Can a copy inherit a promise?** Strong identity/obligation puzzle and an existing Remotion pilot. Research must distinguish a philosophical thought experiment from factual claims about current AI memory, continuity, or moral status.
2. **When does a measure replace what we value?** Clear model/goal tension and an existing visual study. The specification-gaming concept has a source trail in [What We Count](../remotion-templates/src/pilots/WhatWeCount/README.md); the tree story itself is invented and should stay labeled that way. The editorial challenge is finding a less familiar human payoff than “metrics can be gamed.”
3. **Whose work disappears inside an AI answer?** The [human-cost illustration](constructivist-human-test-2026-09-23.md) gives a visual starting point. This question requires particularly careful sourcing: the illustration is metaphorical, and any claim about actual labor, compensation, or deployment practices needs direct evidence and specificity.

## Copyable request for this Codex task

> In this Parallax folder, compare these three candidate questions for a short AI/philosophy video: “Can a copy inherit a promise?”, “When does a measure replace what we value?”, and “Whose work disappears inside an AI answer?” Read only the relevant project context and existing pilots. Browse current sources. For each candidate, make the one-screen card in `analysis/codex-topic-research-workflow-2026-09-23.md`. Open the primary sources and verify the exact load-bearing claims; label facts, interpretations, philosophical arguments, and thought experiments separately. Check 2–3 relevant existing video angles without treating video popularity as evidence. State the strongest objection and what a viewer could misunderstand. Recommend one candidate for a 60–90 second script and three-beat visual test using our current Remotion and illustration assets. Save the evidence ledger and decision in `analysis/topic-sprints/`; do not advance episode state or build new visual tooling yet.

After the sprint, Tiger selects the question and decides whether the provisional answer sounds like a video he wants to make. Codex can then draft and revise the short script, prepare scratch narration, and render a visual proof. If the piece is worth expanding, move it into `episodes/<slug>/research/brief.md` and apply the full [research audit](../skills/research-audit/SKILL.md) at the tier appropriate to its claims. Keep publication-level verification separate from the cheap topic-selection pass.

## What not to automate yet

Do not schedule weekly scans, add a new agent framework, or rewrite `project/IDEAS.md` around the new identity from one conversation. The existing signal monitor watches geopolitical feeds and would not meaningfully discover these philosophical questions without a redesigned source set. A single sprint will reveal whether the real bottleneck is finding a question, finding trustworthy sources, writing the short narration, or making the visual argument. Automate the repeated bottleneck only after observing it.
