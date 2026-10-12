# Producing the first Parallax AI episode

Research and repository review: 27 September 2026.

Status: proposed pilot workflow for the AI/philosophy direction. This memo does not change the canonical production pipeline, episode state, or publishing slate. It synthesizes public practitioner guidance and direct inspection of the current repository; it is not evidence that this workflow has already succeeded here.

## Recommendation

Use a complete, inexpensive story prototype as the main decision point before visual production:

**Question and evidence → outline with visual sketches → spoken draft → scratch narration and complete animatic → focused review and revision → final narration and timing → finished visuals and sound → release review.**

An animatic is the whole episode assembled from rough pictures and temporary sound. It lets us inspect pacing, causal explanations, and the relationship between narration and visuals while changes are still cheap. Individual beautiful frames and a compelling opening cannot establish that the middle and ending work.

The project already contains much of the necessary machinery. The immediate improvement is to sequence it coherently and test it on one episode. Production hours, viewer response, and the reliability of the end-to-end tools remain unknown.

## What the external evidence supports

These are practitioner accounts and official guidance, not controlled demonstrations of an optimal YouTube production process. Older sources are useful for durable production methods; their software recommendations and staffing assumptions are not adopted.

| Source | What it directly supports | Proposed application and limit |
|---|---|---|
| [Common Craft: Creating Simple Storyboards](https://commoncraft.com/explainer-tip-creating-simple-storyboards), Lee LeFever, 2013 | The studio plans scenes with rough sketches alongside narration, reads the script aloud, gets feedback, and revises before production. Storyboarding can expose script problems. | Co-develop words and pictures before detailed asset specifications. This is explanatory-video practice, not proof of entertainment retention. |
| [Kurzgesagt: Our video process](https://kurzgesagt.org/what-we-do?visit=videos), accessed September 2026 | Describes primary-source research, expert consultation, source sheets, script revisions, visual sketches, and animation timed to recorded narration. | Preserve claim verification and audio-based timing. Its studio-scale production intensity is not a solo creator's budget. |
| [Morr Meroz / Bloop Animation: Making an Animated Short](https://www.bloopanimation.com/wp-content/uploads/2014/12/Making-an-Animated-Short.pdf), 2014, animatic section, printed p. 20 | Combines storyboard images with dialogue and basic sound to inspect rhythm and progression before animation production. | Make a complete temporary cut. This is an animation practice transferable to our mixed-media essays, not a requirement to adopt a 3D pipeline. |
| [GOV.UK: Using moderated usability testing](https://www.gov.uk/service-manual/user-research/using-moderated-usability-testing), updated 2017 | Recommends actual or likely users, clear research questions, neutral instructions, observation, and open follow-up questions. | Adapt the interview discipline to cold-viewer review. A video screening is a different activity; do not interrupt viewing with continuous think-aloud commentary. |
| [YouTube: Upload schedule tips](https://support.google.com/youtube/answer/13616979?hl=en-GB), accessed September 2026 | Advises assessing sustainability, time to produce, costs, goals, and production frequency together. | Measure our first episodes before promising a cadence. The guidance supplies no hours-per-episode benchmark. |
| [YouTube: Audience retention](https://support.google.com/youtube/answer/9314415?hl=en), accessed September 2026 | Describes intro performance, dips, and spikes; explicitly notes that rewatching can reflect unclear content. Highlighted key moments require detection and at least 100 views on videos at least 60 seconds long. | Use analytics to locate questions for investigation. Retention alone cannot establish comprehension or explain why someone left. Early-channel data may be sparse. |

No videos were audited end to end for this memo. Conclusions about creator workflows come from their written accounts; no editing success or audience outcome is inferred from titles or view counts. A separately located Kurzgesagt research article could not be fully opened and is not needed to support the recommendations above.

## What our repository already does—and where it conflicts

| Finding from inspected files | Consequence for the pilot |
|---|---|
| [PRODUCTION_PIPELINE.md](../PRODUCTION_PIPELINE.md) already calls for an angle memo, script/visual iteration, a radio edit, and combined editorial reviews. | These are useful foundations. Another elaborate review system would duplicate work. |
| Its overview puts visual production before narration; [scratch_pass.py](../../tools/narration/scratch_pass.py) explicitly exists to get real narration timing before visual specification. | Establish one sequence: draft audio for the animatic, then final audio before detailed synchronization. |
| The pipeline says all later directing decisions execute a locked script, while also allowing final editorial adjustments. | Use two distinct commitments: settle the story after the rough cut, then finalize detailed timing against the actual final recording. Editing may still reveal necessary corrections. |
| The existing radio-edit rule expects the argument to work without visuals. | Use that test for awkward phrasing and narrative flow. Test visual reasoning in the animatic too; avoid forcing the narrator to describe everything already visible in a diagram. |
| The old guide targets roughly three human hours per episode and a weekly long video plus several Shorts. The latest imported report proposes a much larger budget. | Neither estimate has been established by this pilot. Separate creator effort, unattended generation/render time, waiting for feedback, and rework. |
| [The earlier topic-workflow review](../../analysis/codex-topic-research-workflow-2026-09-23.md) found legacy gates aimed at historical/geopolitical essays. | Preserve evidence and accuracy checks. Treat requirements for historical parallels, many cross-domain connections, and predictions as format questions to resolve before promotion into canonical production. |
| [render-episode.mjs](../../remotion-templates/scripts/render-episode.mjs) defines `--preview` as still rendering. The production guide describes full-episode assembly separately. | A preview-still pass does not test pacing. Verify a playable assembly with narration. A new episode also needs its data and composition wired correctly. |
| [check-episode.sh](../../scripts/check-episode.sh), asset preflight, audio QA, and render postflight already exist. | Keep the technical checks for real renders. Passing them does not establish that the episode is interesting or understandable. |

This was a document and code inspection, not a production rehearsal. No claim is made that the complete new-episode path, local narration dependencies, or render environment was executed successfully.

## A practical pilot workflow

The following choices are editorial recommendations for Parallax. They are hypotheses to improve through making the episode.

### 1. Establish the promise and evidence

Use one page to state the viewer question, intended audience, provisional answer, strongest factual anchor, best objection, human stakes, and scope exclusions. Include a working title and rough thumbnail idea so the packaging promise is visible early.

Keep an evidence ledger alongside the research brief: proposed claim, original source and location, what it actually supports, limitation, and verification status. Separate documented event, experimental result, interpretation, and hypothetical example. Existing deep research supplies leads; every consequential claim retained in the script still needs its supporting source checked.

**Ready to proceed:** the question is understandable without alignment terminology, the proposed answer has support, and unresolved gaps are specific enough to investigate. Research continues in response to those gaps rather than a fixed number of deep-research passes.

### 2. Outline words and pictures together

For each beat record: what question the viewer has, what changes their understanding, the evidence needed, and what the picture demonstrates. Identify a few moments where the image itself carries reasoning. Sketch them before committing to detailed production syntax.

Draft two short openings only if the opening approach is still a material uncertainty. Read both aloud, choose provisionally, and continue to the whole story. Two separately polished opening videos are unnecessary at this point.

**Ready to proceed:** the ending answers the opening's main question; each beat advances it; the technical explanation has a clear job; the key visuals can be made with available assets or a bounded experiment.

### 3. Produce a complete spoken draft and rough cut

Read the script aloud, revise unnatural sentences, and record temporary narration. A clean continuous recording is useful; final vocal performance is not needed yet. Assemble the complete episode with sketches, simple source cards, rough diagrams, and temporary assets. Include essential motion where a static image would misrepresent the intended explanation.

Use the current assembly route if it is straightforward. If a new episode requires substantial setup, first test a short representative sequence containing narration, one image, one diagram, and a transition. This checks integration, not visual style. A narrated slide sequence can serve as a fallback story test while production wiring is resolved; it is not a rehearsal of the final renderer.

**Ready to review:** a stranger can watch from beginning to end without the creator explaining missing pieces. The governing argument and its resolution are present, and placeholders have clear roles.

### 4. Review, then settle the story

Use two lenses in one concise review note:

- **Evidence review:** examine the actual narration, charts, labels, and visuals for unsupported claims or misleading implications. A reader with relevant technical knowledge is valuable where available. AI review can find candidate problems but does not replace opening the sources.
- **Audience review:** ask a small convenience group of likely viewers unfamiliar with alignment to watch unaided. Three to five people is a pragmatic starting proposal, not a validated sample size or a forecast of YouTube demand.

Ask first for an unaided account: “What was the video saying?” Then ask what they think actually happened, which parts were illustrative, where attention dropped, and what remains confusing. For sycophancy, check whether they infer an immediate model update from one thumbs-up, a proven single cause of the rollback, or that a better assistant should always disagree. Do not teach them the desired answer before asking.

Prioritize revisions: factual or causal misunderstanding; missing payoff; repeated confusion or boredom; personal stylistic preference. Budget for one focused revision and a targeted recheck. Repeated substantive problems require another correction or narrower scope; a revision limit is not permission to publish an error.

**Story commitment:** the central claims are supportable, the explanation is intelligible, and the opening earns its payoff. If reviewers are unavailable, record that gap rather than counting simulated personas as audience evidence.

### 5. Record final narration and produce the visuals

Record and clean the final narration after the story revision. Reconcile it with the script, then regenerate timing against that recording before polishing synchronized animation. Scratch timings are provisional: a new take changes pauses and emphasis even if the words match.

Use the established constructivist illustration direction to depict situations; use Remotion for labels, relationships, comparisons, and controlled motion. Generate raster art for scenes that need authored illustration. Keep precise text and data in editable layouts. Test any essential new effect cheaply; defer optional library expansion until a repeated production need is observed.

Finish by sequence, checking each in context. Preserve the claim ledger and source distinctions when replacing placeholders with final images. If a substantive change is needed, record it and recheck affected narration, visuals, and timing.

**Timing commitment:** final audio and synchronized visuals match; source assets resolve; readability and motion work at ordinary playback speed.

### 6. Verify the final cut and learn from release

Run existing episode checks and render validation, then watch the exported file end to end. Inspect text on a small screen, narration intelligibility, source attribution, chart meaning, and the transition between documented material and illustration. Check that title and thumbnail accurately promise what the finished episode delivers.

Record remaining limitations and the publication decision. Publishing itself remains a separate user-directed action.

After release, log production time by stage and collect specific audience misunderstandings. Examine retention when useful data exists; propose explanations for dips rather than treating them as diagnoses. Change one or two workflow choices for episode two. Avoid turning every preference from the first screening into a permanent rule.

## Keep the operating burden small

The creator's three main editorial decisions are the question/angle, the revised complete rough cut, and the final release cut. Normal drafting, source retrieval, asset preparation, and checks can progress between those decisions. The creator retains responsibility for the thesis, voice, and final factual judgment.

Keep one current version of each artifact and one prioritized issue list. When the episode is formally initialized, follow [EPISODE_STRUCTURE.md](../../episodes/EPISODE_STRUCTURE.md): research and evidence under `research/`, pre-lock work under `development/`, the canonical production script at `script.md`, read documents under `audio/`, and media under `assets/`. Consolidate review findings into the existing review package; do not add a separate report for each pass.

Measure four things in the pilot: active creator hours, generation/render waiting, rework caused by upstream changes, and unresolved audience confusion. Establish the cadence only after observing actual production. The repo's 5–10 hours/week availability is a planning constraint to reconfirm, not evidence that a weekly episode is feasible.

## Immediate application to the sycophancy episode

Start from [the existing outline](../../analysis/first-ai-episode-sycophancy-outline-2026-09-25.md). Revise its human stakes and ending together, resolve the source links behind the claims we retain, then build a complete spoken draft with a rough visual plan. Use the release/rollback case and the human-advice dilemma as candidate openings; choose before polishing either.

The next milestone is a watchable full story with temporary visuals, followed by a short list of specific revisions. The useful outcome of this first production is both an episode and measured evidence about where the workflow needs improvement.
