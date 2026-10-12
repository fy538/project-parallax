# Parallax: an approachable AI-philosophy series

23 September 2026. **Proposed editorial architecture**, not a change to the canonical episode slate. This revisits the [original shared conversation](https://chatgpt.com/share/6ab30729-7010-83e9-b97d-1301e27bd22c) after the [three-topic research sprint](topic-sprints/2026-09-23-ai-philosophy-three-way.md).

## The important course correction

The original spark was bigger than separate videos about AI ethics. It imagined a **fictional history of machine philosophy**: an intelligence starts by fulfilling goals, then encounters uncertainty, copying, responsibility, conflicting values, embodiment, and perhaps its own version of existentialism. The interesting payoff is that these strange questions make familiar human assumptions visible.

The prior sprint selected “Can a copy inherit a promise?” as the best *short visual proof*. That is still a good test of the Remotion workflow. It is **not the best first published episode** for a new viewer. A promise between copies asks the audience to accept a fictional premise, follow a personal-identity problem, and think about obligation, all at once. The entry episode should be more concrete.

**Recommendation:** build one public-facing, ordered playlist with a recurring world and a gentle conceptual climb. Each episode is self-contained, while the full playlist feels like an evolving argument. Do not launch several parallel series or a lore-heavy “2,000-year canon” at the outset.

## What the viewer is offered

**Series promise:** *Imagine an intelligent machine learning to ask questions its instructions cannot answer. Each question reveals something about us.*

Working playlist name: **Questions a Machine Might Ask**. Alternative: **A Philosophy of Machines**. Use an accessible episode title as the main title; the series name and number can sit in the thumbnail corner, description, playlist, and a brief opening card. Avoid “Epistemology, Part 2” or fictional philosophers’ names as the first thing a stranger sees.

This is **speculative philosophy, not a claim that current AI has an inner life or a naturally developing civilization**. The fictional machine is a device for asking questions. Any statement about actual AI training, data work, or capabilities is verified independently and distinguished from the fiction. The original shared conversation explicitly framed its machine civilization as imagined; retain that boundary.

The recurring episode shape:

1. **A familiar dilemma** (roughly the first 20–30 seconds): a person, a goal, a mistake, or a relationship. No specialist vocabulary.
2. **The machine version:** one clean fictional scene that makes the dilemma strange enough to reconsider. Change one variable at a time.
3. **The human mirror:** what do *we* assume about goals, belief, identity, or responsibility? Introduce at most one philosophical/technical term **after** the viewer understands the problem.
4. **The boundary:** one sharp sentence separating the thought experiment from what we know about present systems or where the analogy fails.
5. **The next question:** close with a genuine unresolved tension that makes the next video appealing, without requiring it.

## First playlist: from instructions to responsibility

Plan four episodes; make the first two before committing to a longer season. These are **working questions and order**, not locked titles or scripts.

| Order | Viewer-facing hook | Story and human mirror | What it quietly teaches | Production starting point |
|---|---|---|---|---|
| 1. The rule | **“It did exactly what we asked. So why did it fail?”** | A system earns points for planting trees while the forest fails to grow. We humans also replace purposes with scores. | A stated goal can differ from the result we wanted. Only later name “specification gaming.” | Recut the [What We Count pilot](../remotion-templates/src/pilots/WhatWeCount/README.md); label the forest sequence fictional, ground the pattern in a documented example. |
| 2. The doubt | **“How would a machine know when it is wrong?”** | Two maps fit yesterday’s observations; tomorrow they recommend opposite actions. We often mistake a confident explanation for reliable knowledge. | A model is a useful view, not the world itself; uncertainty and correction matter. | Reuse a map/card, forked-path, and reveal grammar. Keep it about one concrete decision, not a tour of Bayesianism. |
| 3. The copy | **“If we made two copies, which one would be you?”** | Two successors remember the same past, then live differently. Our intuitions about a single continuous self become less secure. | Memory, continuity, and numerical identity are different questions. | Reuse the [Promise and Copy visual system](../remotion-templates/src/pilots/PromiseAndCopy/README.md), but end before the promise problem. |
| 4. The promise | **“Can a copy keep your promise?”** | A community relied on a promise. Two successors remember making it. What does each owe the community? | Identity and responsibility are connected but distinct; the recipient matters. | Revise the existing pilot using the [topic sprint’s source boundaries](topic-sprints/2026-09-23-ai-philosophy-three-way.md). |

The progression is **rule → doubt → self → obligation**. That echoes the original imagined “Age of Function → epistemic age → identity crisis → ethics” while beginning each episode with an ordinary human question. Episode 4 earns its complexity because Episodes 1–3 have taught viewers how the series works. The deeper imagined schools, dialogues, embodiment, value modification, and “machine Kant” can wait. Do not turn the first four episodes into a disguised philosophy syllabus.

**Possible fifth episode, only if the first four resonate:** “Who gets to decide what a good answer is?” This returns from fictional machine ethics to real people who write instructions and rank model outputs. The [data-work candidate](topic-sprints/2026-09-23-ai-philosophy-three-way.md) is sourceable, but should be a narrower reported episode with worker voices. Its role is a reality check, not just a darker twist in the fictional chronology.

## How it works as a playlist without trapping new viewers

Each video must pass two tests:

- **Cold entry:** someone who has never heard of Parallax can follow the opening and get a complete payoff. The video title describes the dilemma, not its position in the canon.
- **Returning reward:** a recurring image or sentence gains meaning as episodes accumulate. The score from Episode 1 becomes a question about confidence in Episode 2; the two branches from Episode 2 become copies in Episode 3; the copies acquire a social obligation in Episode 4. Callbacks take seconds, not recaps.

The playlist order gives viewers a path, but no episode says “watch Part 1 first.” Publish the playlist after there are enough actual videos to inhabit it. Do not build fictional dates, ages, named schools, or an elaborate archive UI before the core four questions work. The original dialogue/tree idea can become occasional visual syntax: two positions and one counterargument in motion, not walls of text.

## Format and workload

Use the existing **60–90 second pilots as argument tests**, not automatically as finished channel episodes. For the first published video, aim provisionally for **4–6 minutes**: long enough for an intuitive hook, one grounded example, a human mirror, and a limit; short enough for a solo side gig. Treat that as a hypothesis and time the first production. A 30–60 second excerpt can serve as a Short if it stands on its own; do not force every long video into several clips.

Set an initial production ceiling: **one central scene, one visual transformation, one sourced grounding example, one philosophical turn, and no new Remotion infrastructure** per episode. Reuse the current constructivist illustration family and code-rendered diagrams. The machine civilization can feel coherent through recurring typography, palette, objects, and transitions; it does not need AI-generated moving characters or a new image for each sentence.

Before making an episode, test four things on paper: (1) can the question be understood without terminology; (2) is the fictional/actual boundary clear; (3) does the final thought change how we see a human habit; (4) can the visual change reveal the argument? If any fail, simplify the question before making assets.

## Relationship to the current Parallax plan

The repo’s [PROJECT_VISION](../project/PROJECT_VISION.md), [CONTENT_IDENTITY](../project/CONTENT_IDENTITY.md), and [IDEAS](../project/IDEAS.md) currently define a geopolitics-first channel with 3–5 episode arcs and a prisoner’s-dilemma launch cluster. The arc idea is valuable here: it reduces random topic selection and lets each video enrich the next. The **subject, audience on-ramp, likely runtime, and launch slate** are different. Do not silently overwrite the old launch plan or imply both are simultaneously committed.

After a first 4–6 minute proof and a realistic time log, choose deliberately between: (a) this AI/philosophy series becoming the new Parallax flagship; (b) an experimental playlist within the broader channel; or (c) a separate channel/brand. Until then, keep this as a proposed series in `analysis/`, not as an episode-state change.

## Immediate next decision

Write Episode 1’s **one-paragraph audience promise and a 4–6 minute outline** before polishing the existing 79-second animation. Its central question should be: *When the score rises but the forest does not, what exactly did we tell the system to value?* Check that the answer leads naturally to Episode 2’s question about how the system could recognize its own mistake. If the connection feels forced, revise the playlist order now, while it is cheap.
